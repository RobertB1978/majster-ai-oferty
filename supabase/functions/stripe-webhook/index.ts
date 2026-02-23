// ============================================================================
// STRIPE WEBHOOK - Stripe Integration
// Handles Stripe webhook events for subscription management
//
// Security model
// ──────────────
// 1. Every request is verified against STRIPE_WEBHOOK_SECRET before any DB
//    write (prevents spoofed payloads).
// 2. Every Stripe event is stored in the `stripe_events` idempotency table
//    before business logic runs (prevents duplicate side-effects on retry).
// 3. Unknown subscription statuses map to "inactive" (least privilege).
// ============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";
import { mapSubscriptionStatus } from "./stripe-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Map Stripe price IDs to plan IDs
const PRICE_TO_PLAN_MAP: Record<string, string> = {
  // Replace with actual Stripe Price IDs
  "price_pro_monthly": "pro",
  "price_pro_yearly": "pro",
  "price_starter_monthly": "starter",
  "price_starter_yearly": "starter",
  "price_business_monthly": "business",
  "price_business_yearly": "business",
  "price_enterprise_monthly": "enterprise",
  "price_enterprise_yearly": "enterprise",
};

// ---------------------------------------------------------------------------
// Idempotency helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to claim the event_id in the idempotency store.
 *
 * Returns true  → event is new; caller should process it.
 * Returns false → event was already processed; caller should return 200 early.
 *
 * Uses an INSERT … ON CONFLICT DO NOTHING pattern so the check + write is
 * atomic: two concurrent deliveries of the same event cannot both claim it.
 */
async function claimEvent(supabase: SupabaseClient, eventId: string, payloadHash?: string): Promise<boolean> {
  const { error } = await supabase
    .from("stripe_events")
    .insert({ event_id: eventId, payload_hash: payloadHash ?? null });

  if (!error) {
    // Insert succeeded → this is the first time we see this event_id.
    return true;
  }

  // Supabase wraps Postgres errors; a primary-key violation means duplicate.
  if (error.code === "23505") {
    console.log("[stripe-webhook] Duplicate event, skipping:", eventId);
    return false;
  }

  // Any other error is unexpected – surface it.
  throw new Error(`[stripe-webhook] claimEvent failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    if (!stripeWebhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    // 2. Initialize clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // 3. Verify webhook signature BEFORE reading the body for anything else.
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("[stripe-webhook] Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      console.error("[stripe-webhook] Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[stripe-webhook] Received event:", event.type, event.id);

    // 4. Idempotency check — claim the event_id before doing any side-effects.
    //    If claimEvent returns false, a prior delivery already processed this
    //    event; return 200 immediately so Stripe stops retrying.
    const isNew = await claimEvent(supabase, event.id);
    if (!isNew) {
      console.log("[stripe-webhook] Event already processed, returning 200:", event.id);
      return new Response(
        JSON.stringify({ received: true, duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription, event);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription, event);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(supabase, stripe, session, event);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[stripe-webhook] Payment succeeded for invoice:", invoice.id);
        // Subscription is already updated by subscription.updated event
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[stripe-webhook] Payment failed for invoice:", invoice.id);
        await handlePaymentFailed(supabase, invoice, event);
        break;
      }

      default:
        console.log("[stripe-webhook] Unhandled event type:", event.type);
    }

    // 6. Log event to audit table
    await supabase.from("subscription_events").insert({
      event_type: event.type,
      event_data: event as unknown as Record<string, unknown>,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[stripe-webhook] Error:", error);

    // Try to log error to database
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from("subscription_events").insert({
          event_type: "error",
          event_data: { error: error instanceof Error ? error.message : String(error) },
          processed: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } catch (logError) {
      console.error("[stripe-webhook] Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleSubscriptionUpdate(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  event: Stripe.Event
) {
  const userId = subscription.metadata.supabase_user_id;
  if (!userId) {
    console.error("[stripe-webhook] No supabase_user_id in subscription metadata");
    return;
  }

  // Get plan from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const planId = PRICE_TO_PLAN_MAP[priceId] || "free";
  // mapSubscriptionStatus is imported from stripe-utils.ts;
  // unknown Stripe statuses resolve to "inactive" (least privilege).
  const status = mapSubscriptionStatus(subscription.status);

  console.log("[stripe-webhook] Updating subscription:", {
    userId,
    planId,
    status,
    subscriptionId: subscription.id,
  });

  // Use the database function to sync subscription
  const { error } = await supabase.rpc("sync_subscription_from_stripe", {
    p_user_id: userId,
    p_stripe_customer_id: subscription.customer as string,
    p_stripe_subscription_id: subscription.id,
    p_plan_id: planId,
    p_status: status,
    p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    p_cancel_at_period_end: subscription.cancel_at_period_end,
    p_trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  });

  if (error) {
    console.error("[stripe-webhook] Error syncing subscription:", error);
    throw error;
  }

  // Log event
  await supabase.from("subscription_events").insert({
    user_id: userId,
    subscription_id: subscription.id,
    event_type: event.type,
    event_data: event as unknown as Record<string, unknown>,
    processed: true,
    processed_at: new Date().toISOString(),
  });
}

async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  event: Stripe.Event
) {
  const userId = subscription.metadata.supabase_user_id;
  if (!userId) {
    console.error("[stripe-webhook] No supabase_user_id in subscription metadata");
    return;
  }

  console.log("[stripe-webhook] Subscription deleted:", subscription.id);

  // Downgrade to free plan
  const { error } = await supabase.rpc("sync_subscription_from_stripe", {
    p_user_id: userId,
    p_stripe_customer_id: subscription.customer as string,
    p_stripe_subscription_id: subscription.id,
    p_plan_id: "free",
    p_status: "cancelled",
    p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    p_cancel_at_period_end: true,
    p_trial_end: null,
  });

  if (error) {
    console.error("[stripe-webhook] Error updating subscription:", error);
    throw error;
  }

  // Log event
  await supabase.from("subscription_events").insert({
    user_id: userId,
    subscription_id: subscription.id,
    event_type: event.type,
    event_data: event as unknown as Record<string, unknown>,
    processed: true,
    processed_at: new Date().toISOString(),
  });
}

async function handleCheckoutSessionCompleted(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  event: Stripe.Event
) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error("[stripe-webhook] No supabase_user_id in session metadata");
    return;
  }

  console.log("[stripe-webhook] Checkout session completed:", session.id);

  // Get subscription details
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    await handleSubscriptionUpdate(supabase, subscription, event);
  }
}

async function handlePaymentFailed(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice,
  event: Stripe.Event
) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) {
    return;
  }

  console.log("[stripe-webhook] Payment failed for subscription:", subscriptionId);

  // Find user by subscription ID
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!subscription) {
    console.error("[stripe-webhook] Subscription not found:", subscriptionId);
    return;
  }

  // Log event
  await supabase.from("subscription_events").insert({
    user_id: subscription.user_id,
    subscription_id: subscriptionId,
    event_type: event.type,
    event_data: event as unknown as Record<string, unknown>,
    processed: true,
    processed_at: new Date().toISOString(),
  });

  // TODO: Send email notification to user about payment failure
}

serve(handler);
