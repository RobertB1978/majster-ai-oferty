/**
 * Stripe Webhook Handler
 *
 * Edge Function to handle Stripe webhooks and sync subscription data to Supabase.
 * Processes events: checkout.session.completed, customer.subscription.*
 *
 * Created: 2025-12-17
 * Based on: Supabase + Stripe webhook best practices 2025
 *
 * Security: Verifies webhook signature to ensure requests come from Stripe
 */

import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { checkRateLimit, createRateLimitResponse, getIdentifier } from '../_shared/rate-limiter.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Crypto provider for webhook signature verification
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  // TIER 1 - Rate limiting (SECURITY: prevent webhook abuse)
  const identifier = getIdentifier(req);
  const rateLimitResult = await checkRateLimit(identifier, 'stripe-webhook', supabase);

  if (!rateLimitResult.allowed) {
    console.warn(`[stripe-webhook] Rate limit exceeded for ${identifier}`);
    return createRateLimitResponse(rateLimitResult, {});
  }

  const signature = req.headers.get('Stripe-Signature');

  if (!signature) {
    return new Response('Missing Stripe signature', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return new Response(`Webhook signature verification failed: ${err.message}`, {
      status: 400,
    });
  }

  console.log(`[stripe-webhook] Event received: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      // ========================================================================
      // CHECKOUT COMPLETED
      // ========================================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[stripe-webhook] Checkout completed for session ${session.id}`);

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const userId = session.metadata?.user_id;

          if (!userId) {
            console.error('[stripe-webhook] Missing user_id in session metadata');
            break;
          }

          // Fetch full subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Insert subscription into database
          const { error: insertError } = await supabase.from('subscriptions').insert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            metadata: subscription.metadata as any,
          });

          if (insertError) {
            console.error('[stripe-webhook] Error inserting subscription:', insertError);
          } else {
            console.log(`[stripe-webhook] ✅ Subscription ${subscription.id} created for user ${userId}`);
          }
        }

        break;
      }

      // ========================================================================
      // SUBSCRIPTION UPDATED
      // ========================================================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[stripe-webhook] Subscription updated: ${subscription.id}`);

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            stripe_price_id: subscription.items.data[0].price.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            metadata: subscription.metadata as any,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('[stripe-webhook] Error updating subscription:', updateError);
        } else {
          console.log(`[stripe-webhook] ✅ Subscription ${subscription.id} updated`);
        }

        break;
      }

      // ========================================================================
      // SUBSCRIPTION DELETED (canceled)
      // ========================================================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[stripe-webhook] Subscription deleted: ${subscription.id}`);

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            ended_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('[stripe-webhook] Error marking subscription as canceled:', updateError);
        } else {
          console.log(`[stripe-webhook] ✅ Subscription ${subscription.id} marked as canceled`);
        }

        break;
      }

      // ========================================================================
      // PAYMENT SUCCEEDED
      // ========================================================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] Payment succeeded for invoice ${invoice.id}`);

        // Optional: Store invoice record or send receipt email
        // For now, just log it

        break;
      }

      // ========================================================================
      // PAYMENT FAILED
      // ========================================================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] Payment failed for invoice ${invoice.id}`);

        // Optional: Send email to user about failed payment
        // Update subscription status will be handled by subscription.updated event

        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(`[stripe-webhook] Error processing event ${event.type}:`, error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
