// ============================================================================
// CUSTOMER PORTAL — Stripe Billing Portal
// Creates a Stripe Customer Portal session so users can manage their
// subscription (cancel, update payment method, view invoices) without
// exposing any Stripe keys to the browser.
//
// Security model
// ──────────────
// 1. Requires valid Supabase JWT in Authorization header.
// 2. Looks up stripe_customer_id from user_subscriptions (service-role read).
// 3. Creates portal session and returns redirect URL only — no secrets exposed.
// 4. No PII logged (user ID only, not email or payment details).
// ============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const frontendUrl = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // 2. Initialize clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // 3. Authenticate request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Look up Stripe customer ID (service-role read, no PII in log)
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) {
      console.error("[customer-portal] DB error fetching subscription:", subError.message);
      throw new Error("Failed to fetch subscription");
    }

    if (!subscription?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No active Stripe subscription found. Please upgrade first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Create Stripe Billing Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${frontendUrl}/app/plan`,
    });

    // Log minimal metadata only — no PII, no payment details
    console.log("[customer-portal] Portal session created for user:", user.id);

    // 6. Return redirect URL
    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[customer-portal] Error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
