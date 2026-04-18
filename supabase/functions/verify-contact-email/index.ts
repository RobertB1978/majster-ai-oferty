// ============================================
// VERIFY CONTACT EMAIL
// Sends a verification email to the contractor's contact_email.
// Called from: src/components/settings/ContactEmailSettings.tsx
// Flow: user saves contact_email → token stored in profiles → this fn sends the link
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateEmail, validateString, combineValidations, createValidationErrorResponse } from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";
import { getCorsHeaders, getCorsPreflightHeaders } from "../_shared/cors.ts";

function buildVerificationEmail(verificationUrl: string, email: string, locale = "pl"): string {
  const content: Record<string, { subject: string; heading: string; body: string; btnLabel: string; footer: string }> = {
    pl: {
      subject: "Potwierdź adres email kontaktowy — Majster.AI",
      heading: "Potwierdź swój email",
      body: `Otrzymaliśmy prośbę o weryfikację adresu <strong>${email}</strong> jako emaila kontaktowego w Majster.AI.<br><br>Kliknij przycisk poniżej, aby potwierdzić.`,
      btnLabel: "Potwierdź adres email",
      footer: "Jeśli nie wysyłałeś tej prośby, zignoruj tę wiadomość. Link wygasa po 24 godzinach.",
    },
    en: {
      subject: "Confirm your contact email — Majster.AI",
      heading: "Confirm your email",
      body: `We received a request to verify <strong>${email}</strong> as your contact email in Majster.AI.<br><br>Click the button below to confirm.`,
      btnLabel: "Confirm email address",
      footer: "If you didn't request this, please ignore this message. The link expires in 24 hours.",
    },
    uk: {
      subject: "Підтвердіть контактний email — Majster.AI",
      heading: "Підтвердіть email",
      body: `Ми отримали запит на верифікацію адреси <strong>${email}</strong> як вашого контактного email у Majster.AI.<br><br>Натисніть кнопку нижче для підтвердження.`,
      btnLabel: "Підтвердити адресу email",
      footer: "Якщо ви не надсилали цей запит — проігноруйте цей лист. Посилання діє 24 години.",
    },
  };

  const c = content[locale] ?? content["pl"];

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#18181b;padding:24px 32px;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Majster.AI</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#18181b;">${c.heading}</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">${c.body}</p>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="border-radius:8px;background:#18181b;">
              <a href="${verificationUrl}"
                 style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                ${c.btnLabel}
              </a>
            </td></tr>
          </table>
          <p style="margin:28px 0 0;font-size:13px;color:#a1a1aa;">${c.footer}</p>
          <p style="margin:12px 0 0;font-size:12px;color:#d4d4d8;">
            Lub wklej ten link w przeglądarkę:<br>
            <span style="color:#52525b;word-break:break-all;">${verificationUrl}</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsPreflightHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const senderEmail = Deno.env.get("SENDER_EMAIL") ?? "noreply@majster.ai";
  const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "https://app.majster.ai";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[verify-contact-email] Missing Supabase env vars");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 503, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!resendApiKey) {
    console.error("[verify-contact-email] Missing RESEND_API_KEY");
    return new Response(JSON.stringify({ error: "Email service not configured" }), {
      status: 503, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Require JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse body
    let body: { userId?: unknown; email?: unknown; locale?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { userId, email, locale } = body;

    // Validate inputs
    const validation = combineValidations(
      validateString(userId, "userId", { minLength: 1 }),
      validateEmail(email as string),
    );
    if (!validation.valid) {
      return createValidationErrorResponse(validation.errors, corsHeaders);
    }

    // userId must match authenticated user (prevents impersonation)
    if ((userId as string) !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Rate limit (max 5 verification emails per hour per user)
    const rateLimitResult = await checkRateLimit(
      getIdentifier(req),
      "verify-contact-email",
      supabase,
    );
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Read the current verification token from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("contact_email, contact_email_verified, contact_email_verification_token")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("[verify-contact-email] Profile not found:", profileError);
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify the email in body matches what's stored
    if (profile.contact_email !== (email as string)) {
      return new Response(JSON.stringify({ error: "Email mismatch — save the email first" }), {
        status: 409, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (profile.contact_email_verified === true) {
      return new Response(JSON.stringify({ success: true, alreadyVerified: true }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const verificationToken = profile.contact_email_verification_token as string;
    if (!verificationToken) {
      return new Response(JSON.stringify({ error: "No verification token — save the email again" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Build verification URL
    const verificationUrl = `${frontendUrl}/app/settings?tab=email&verify-email=${verificationToken}`;

    const localeStr = typeof locale === "string" ? locale : "pl";
    const html = buildVerificationEmail(verificationUrl, profile.contact_email as string, localeStr);

    const subjects: Record<string, string> = {
      pl: "Potwierdź adres email kontaktowy — Majster.AI",
      en: "Confirm your contact email — Majster.AI",
      uk: "Підтвердіть контактний email — Majster.AI",
    };
    const subject = subjects[localeStr] ?? subjects["pl"];

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Majster.AI <${senderEmail}>`,
        to: [profile.contact_email as string],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const resendErr = await resendRes.json().catch(() => ({}));
      console.error("[verify-contact-email] Resend error:", resendErr);
      return new Response(JSON.stringify({ error: "Failed to send verification email" }), {
        status: 502, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[verify-contact-email] Verification email sent to user ${user.id.substring(0, 8)}***`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err: unknown) {
    console.error("[verify-contact-email] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
