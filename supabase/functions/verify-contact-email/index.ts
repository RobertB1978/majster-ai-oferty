import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, getCorsPreflightHeaders } from "../_shared/cors.ts";
import { htmlEscape } from "../_shared/sanitization.ts";

interface VerifyContactEmailRequest {
  userId?: string;
  email?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsPreflightHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const senderEmail = Deno.env.get("SENDER_EMAIL");
  const frontendUrl = Deno.env.get("FRONTEND_URL");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[verify-contact-email] Supabase env not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  if (!resendApiKey || !senderEmail) {
    console.error("[verify-contact-email] Email delivery not configured (RESEND_API_KEY or SENDER_EMAIL missing)");
    return new Response(
      JSON.stringify({ error: "Email delivery is not configured" }),
      { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  if (!frontendUrl) {
    console.error("[verify-contact-email] FRONTEND_URL not configured — verification link would be broken");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // 1. Validate JWT — extract authenticated user from Authorization header
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const jwtToken = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwtToken);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // 2. Parse request body
  let body: VerifyContactEmailRequest = {};
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // 3. Anti-impersonation: client-provided userId must match JWT identity
  if (body.userId && body.userId !== user.id) {
    console.warn(`[verify-contact-email] Impersonation attempt: JWT=${user.id} body.userId=${body.userId}`);
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // 4. Load profile by authenticated user ID (JWT wins over body)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("contact_email, contact_email_verification_token")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[verify-contact-email] Profile fetch error:", profileError?.message);
    return new Response(
      JSON.stringify({ error: "Profile not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // 5. Confirm contact_email is set
  if (!profile.contact_email) {
    return new Response(
      JSON.stringify({ error: "No contact email set on profile" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // 6. Use existing token or generate a fresh one if null (DB default covers normal path)
  let verificationToken: string = profile.contact_email_verification_token ?? "";
  if (!verificationToken) {
    verificationToken = crypto.randomUUID();
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ contact_email_verification_token: verificationToken })
      .eq("user_id", user.id);

    if (updateErr) {
      console.error("[verify-contact-email] Token update error:", updateErr.message);
      return new Response(
        JSON.stringify({ error: "Failed to prepare verification token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
  }

  // 7. Build verification link (token-consume page implemented in PR-VCE-02)
  const verifyUrl = `${frontendUrl}/verify-contact-email?token=${verificationToken}`;
  const safeEmail = htmlEscape(profile.contact_email);

  // 8. Send verification email via Resend
  const emailHtml = buildVerificationEmailHtml(safeEmail, verifyUrl);
  const subject = "Weryfikacja adresu email kontaktowego — Majster.AI";

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Majster.AI <${senderEmail}>`,
        to: [profile.contact_email],
        subject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      console.error("[verify-contact-email] Resend API error:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to send verification email" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const masked = profile.contact_email.replace(/^(.{3}).*@/, "$1***@");
    console.log(`[verify-contact-email] Verification email sent to: ${masked}`);

    return new Response(
      JSON.stringify({ sent: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (sendError: unknown) {
    const msg = sendError instanceof Error ? sendError.message : "Unknown error";
    console.error("[verify-contact-email] Send error:", msg);
    return new Response(
      JSON.stringify({ error: "Failed to send verification email" }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});

function buildVerificationEmailHtml(safeEmail: string, verifyUrl: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weryfikacja adresu email — Majster.AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Weryfikacja adresu email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Cześć!
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Poproszono o weryfikację adresu email kontaktowego <strong>${safeEmail}</strong> w systemie Majster.AI.
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Kliknij poniższy przycisk, aby potwierdzić adres i aktywować go jako adres Reply-To w Twoich ofertach dla klientów.
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">
                      Zweryfikuj adres email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #6b7280; font-size: 13px; margin: 30px 0 0 0; line-height: 1.5;">
                Jeśli nie składałeś/aś tej prośby, możesz bezpiecznie zignorować tę wiadomość.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                Ta wiadomość została wysłana przez system Majster.AI
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                &copy; ${year} Majster.AI
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
