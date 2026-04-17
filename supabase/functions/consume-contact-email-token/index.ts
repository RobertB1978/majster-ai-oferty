import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, getCorsPreflightHeaders } from "../_shared/cors.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsPreflightHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[consume-contact-email-token] Supabase env not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  let body: { token?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token || !UUID_RE.test(token)) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing token" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Look up profile by verification token
  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select("user_id, contact_email_verified")
    .eq("contact_email_verification_token", token)
    .maybeSingle();

  if (lookupError) {
    console.error("[consume-contact-email-token] Lookup error:", lookupError.message);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // Generic 404 — do not distinguish "unknown token" from "already consumed"
  // to avoid enumeration attacks
  if (!profile) {
    return new Response(
      JSON.stringify({ error: "Token not found or already used" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // Idempotent: already verified — return success without double-writing
  if (profile.contact_email_verified) {
    return new Response(
      JSON.stringify({ verified: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // Consume token: set verified, record timestamp, clear token (one-time use)
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      contact_email_verified: true,
      contact_email_verified_at: new Date().toISOString(),
      contact_email_verification_token: null,
    })
    .eq("user_id", profile.user_id)
    .eq("contact_email_verification_token", token);

  if (updateError) {
    console.error("[consume-contact-email-token] Update error:", updateError.message);
    return new Response(
      JSON.stringify({ error: "Failed to verify email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  console.log(`[consume-contact-email-token] Token consumed for user: ${profile.user_id}`);
  return new Response(
    JSON.stringify({ verified: true }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
