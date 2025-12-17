/**
 * Create Stripe Checkout Session
 *
 * Edge Function to create a Stripe checkout session for subscription payments.
 * Handles customer creation/retrieval and redirects user to Stripe Checkout.
 *
 * Created: 2025-12-17
 * Based on: Supabase + Stripe best practices 2025
 */

import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080';

interface CheckoutRequest {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Parse request body
    const { priceId, successUrl, cancelUrl }: CheckoutRequest = await req.json();

    if (!priceId) {
      throw new Error('Missing priceId in request');
    }

    console.log(`[create-checkout] Creating session for user ${user.id}, price ${priceId}`);

    // Get or create Stripe customer
    let stripeCustomerId: string;

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
      console.log(`[create-checkout] Using existing customer: ${stripeCustomerId}`);
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Save to database
      const { error: insertError } = await supabase.from('customers').insert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        email: user.email,
      });

      if (insertError) {
        console.error('[create-checkout] Error saving customer:', insertError);
        // Don't throw - customer created in Stripe, we can retry sync later
      }

      console.log(`[create-checkout] Created new customer: ${stripeCustomerId}`);
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${frontendUrl}/billing/cancel`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    });

    console.log(`[create-checkout] Session created: ${session.id}`);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[create-checkout] Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
