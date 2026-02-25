// ============================================
// CLIENT-QUESTION - Public offer question submission
// Accepts client questions via public token,
// saves as contractor notification (no PII in logs)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateUUID,
  validateString,
  createValidationErrorResponse,
} from "../_shared/validation.ts";
import {
  checkRateLimit,
  createRateLimitResponse,
  getIdentifier,
} from "../_shared/rate-limiter.ts";
import { sanitizeUserInput } from "../_shared/sanitization.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let body: { token?: unknown; questionText?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { token, questionText } = body;

    // Validate token format (UUID)
    const tokenValidation = validateUUID(token, "token");
    if (!tokenValidation.valid) {
      return createValidationErrorResponse(tokenValidation.errors, corsHeaders);
    }

    // Validate question text
    const questionValidation = validateString(questionText, "questionText", {
      required: true,
      minLength: 3,
      maxLength: 2000,
    });
    if (!questionValidation.valid) {
      return createValidationErrorResponse(
        questionValidation.errors,
        corsHeaders,
      );
    }

    // Rate limiting — 5 requests per IP per 10 minutes (abuse mitigation)
    const rateLimitResult = await checkRateLimit(
      getIdentifier(req),
      "client-question",
      supabase,
    );
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Fetch minimal offer data by public_token — no PII returned or logged
    const { data: approval, error: fetchError } = await supabase
      .from("offer_approvals")
      .select("id, user_id, project_id, status, expires_at")
      .eq("public_token", String(token))
      .single();

    if (fetchError || !approval) {
      return new Response(
        JSON.stringify({ error: "Oferta nie została znaleziona" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Token-level expiry check
    if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Link wygasł" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reject questions on terminal-state offers
    const terminalStatuses = [
      "expired",
      "withdrawn",
      "accepted",
      "approved",
      "rejected",
    ];
    if (terminalStatuses.includes(approval.status)) {
      return new Response(
        JSON.stringify({ error: "Oferta jest już zakończona" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const safeQuestion = sanitizeUserInput(String(questionText), 2000);

    // Save question as in-app notification for the contractor
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: approval.user_id,
      title: "❓ Klient zadał pytanie dot. oferty",
      message: safeQuestion.length > 500
        ? safeQuestion.substring(0, 497) + "..."
        : safeQuestion,
      type: "info",
      action_url: `/app/jobs/${approval.project_id}`,
    });

    if (notifError) {
      // Log only error type, not offer/client details
      console.error("[client-question] Notification insert failed");
      throw notifError;
    }

    // Log only offer ID — no token value, no client PII
    console.log(`[client-question] Question saved for offer ${approval.id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error(
      "[client-question] Error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
