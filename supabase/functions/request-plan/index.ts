// ============================================================
// REQUEST-PLAN Edge Function
// Saves an in-app plan upgrade request to plan_requests table.
// Used when VITE_STRIPE_ENABLED=false (no Stripe account yet).
// ============================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateString,
  validateEnum,
  createValidationErrorResponse,
  combineValidations,
} from "../_shared/validation.ts";
import {
  checkRateLimit,
  createRateLimitResponse,
  getIdentifier,
} from "../_shared/rate-limiter.ts";

// ── Plan slugs that users can request ──────────────────────
const ALLOWED_PLAN_SLUGS = ["starter", "pro", "business", "enterprise"] as const;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[request-plan] Missing Supabase configuration");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // Service-role client — only used for INSERT after user is authenticated
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // ── Authenticate caller ────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // Validate JWT using anon client
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const anonClient = createClient(supabaseUrl, anonKey ?? "");
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid or expired session" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const userId = user.id;
  const userEmail = user.email ?? "";

  // ── Rate limiting (per user) ───────────────────────────────
  const rateLimitResult = await checkRateLimit(
    getIdentifier(req, userId),
    "request-plan",
    adminClient,
  );

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  // ── Parse body ────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const { plan_slug, phone, message } = body;

  // ── Validate inputs ───────────────────────────────────────
  const validation = combineValidations(
    validateEnum(plan_slug, "plan_slug", ALLOWED_PLAN_SLUGS),
    validateString(phone, "phone", { required: false, maxLength: 20 }),
    validateString(message, "message", { required: false, maxLength: 500 }),
  );

  if (!validation.valid) {
    return createValidationErrorResponse(validation.errors, corsHeaders);
  }

  // ── Insert into plan_requests ─────────────────────────────
  // Service role is required here so we bypass RLS for the insert
  // (the authenticated user can only INSERT their own rows via RLS,
  //  but we double-check user_id server-side for safety).
  const insertPayload = {
    user_id: userId,
    email: userEmail,
    phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
    plan_slug: plan_slug as string,
    locale: req.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "pl",
    message: typeof message === "string" && message.trim() ? message.trim() : null,
    status: "new",
  };

  const { data, error: insertError } = await adminClient
    .from("plan_requests")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError) {
    console.error("[request-plan] Insert error:", insertError.message);
    return new Response(
      JSON.stringify({ error: "Failed to save request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  console.log(
    `[request-plan] Request saved: id=${data.id} plan=${plan_slug} user=${userId.slice(0, 8)}...`,
  );

  return new Response(
    JSON.stringify({ success: true, request_id: data.id }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
};

serve(handler);
