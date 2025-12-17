import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreateCheckoutSessionParams {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Hook for creating Stripe Checkout sessions
 *
 * Usage:
 * ```tsx
 * const { mutate: createCheckout, isLoading } = useCreateCheckoutSession();
 *
 * const handleUpgrade = () => {
 *   createCheckout({
 *     priceId: 'price_xxx',
 *     successUrl: window.location.origin + '/billing?success=true',
 *     cancelUrl: window.location.origin + '/billing?canceled=true',
 *   });
 * };
 * ```
 */
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> => {
      // Get current session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      // Call Edge Function to create Checkout Session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: params,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Failed to create checkout session:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      return data as CheckoutSessionResponse;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error) => {
      console.error('Checkout session error:', error);
    },
  });
}

// Stripe Price IDs - Replace with actual values from Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  },
  starter: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    yearly: import.meta.env.VITE_STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
  },
  business: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
    yearly: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_YEARLY || 'price_business_yearly',
  },
  enterprise: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    yearly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
  },
} as const;

/**
 * Get Stripe Price ID for a plan and billing period
 */
export function getStripePriceId(
  plan: 'pro' | 'starter' | 'business' | 'enterprise',
  period: 'monthly' | 'yearly'
): string {
  return STRIPE_PRICE_IDS[plan][period];
}
