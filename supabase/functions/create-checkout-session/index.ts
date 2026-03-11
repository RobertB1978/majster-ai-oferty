// ============================================
// CREATE CHECKOUT SESSION - Stripe Integration
// Creates a Stripe Checkout Session for subscription payment
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCheckoutRequest {
  priceId: string; // Stripe Price ID
  successUrl?: string;
  cancelUrl?: string;
}

// NOTE: Price IDs są przekazywane przez klienta (z VITE_STRIPE_PRICE_* env vars).
// Walidacja formatu price ID odbywa się w kroku 4a poniżej.
// Placeholder mapowanie usunięte — nie używane i mylące.

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate environment variables
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

    // 3. Get authenticated user
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
      console.error("[create-checkout-session] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Parse request body
    const body: CreateCheckoutRequest = await req.json();
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Missing priceId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4a. Validate that priceId looks like a real Stripe Price ID.
    //     Real Stripe Price IDs: "price_" followed by ≥14 alphanumeric characters.
    //     Placeholders ("price_pro_monthly", "price_business_yearly") do NOT match
    //     and are rejected with a clear 400 + operator-friendly error message.
    if (!/^price_[A-Za-z0-9]{14,}$/.test(priceId)) {
      console.error(
        "[create-checkout-session] INVALID_PRICE_ID: priceId does not match Stripe format.",
        "Received:", priceId,
        "— Expected format: price_<14+ alphanumeric chars>.",
        "Action required: set real Stripe Price IDs in Supabase secrets and VITE_ env vars."
      );
      return new Response(
        JSON.stringify({
          error: "Invalid price ID. The provided priceId does not look like a real Stripe Price ID. Please configure real Stripe Price IDs in your environment variables.",
          code: "INVALID_PRICE_ID",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Get or create Stripe customer
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          plan_id: "free", // Will be updated by webhook
          status: "active",
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });
    }

    // 6. Create Checkout Session
    // WAŻNE: Stripe nie pozwala na jednoczesne użycie `customer` i `customer_email`.
    // Gdy customerId istnieje, `customer_email` musi być pominięty.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${frontendUrl}/app/plan?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${frontendUrl}/app/plan?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address
      billing_address_collection: "required",
      // NIE ustawiamy customer_email gdy customer jest już podany —
      // Stripe zwraca błąd 400 gdy obie wartości są obecne jednocześnie.
    });

    console.log("[create-checkout-session] Created session:", session.id, "for user:", user.id);

    // 7. Return session URL
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("[create-checkout-session] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
