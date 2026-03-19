import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface CreateCheckoutSessionParams {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

interface CustomerPortalResponse {
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
 *     successUrl: window.location.origin + '/app/plan?success=true',
 *     cancelUrl: window.location.origin + '/app/plan?canceled=true',
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
        logger.error('Failed to create checkout session:', error);
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
      logger.error('Checkout session error:', error);
    },
  });
}

/**
 * Hook for opening the Stripe Customer Billing Portal.
 * Used on the Plan/Subscription page for paid users to manage their subscription.
 * Server creates the portal session (no secrets in browser).
 */
export function useCustomerPortal() {
  return useMutation({
    mutationFn: async (): Promise<CustomerPortalResponse> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        logger.error('Failed to open billing portal:', error);
        throw new Error(error.message || 'Failed to open billing portal');
      }

      if (!data?.url) {
        throw new Error('No portal URL returned');
      }

      return data as CustomerPortalResponse;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    },
    onError: (error) => {
      logger.error('Customer portal error:', error);
    },
  });
}

/**
 * Stripe Price IDs — wartości pochodzą wyłącznie ze zmiennych środowiskowych.
 *
 * WAŻNE: Brak fallbacków do stringów-placeholderów (np. 'price_pro_monthly').
 * Jeżeli zmienna środowiskowa nie jest ustawiona, wartość wynosi undefined.
 * Dzięki temu sprawdzenie `if (!priceId)` w callsite działa poprawnie
 * i checkout nie jest inicjowany z fałszywymi ID.
 */
export const STRIPE_PRICE_IDS: Record<string, { monthly: string | undefined; yearly: string | undefined }> = {
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || undefined,
    yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY || undefined,
  },
  starter: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_STARTER_MONTHLY || undefined,
    yearly: import.meta.env.VITE_STRIPE_PRICE_STARTER_YEARLY || undefined,
  },
  business: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_MONTHLY || undefined,
    yearly: import.meta.env.VITE_STRIPE_PRICE_BUSINESS_YEARLY || undefined,
  },
  enterprise: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY || undefined,
    yearly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_YEARLY || undefined,
  },
};

/**
 * Sprawdza, czy podana wartość wygląda jak prawdziwy Stripe Price ID.
 *
 * Prawdziwe ID Stripe: "price_" + min. 14 znaków alfanumerycznych (mixed case).
 * Przykład: price_1MkWBNLkBkqDaVD26L6D3Dz
 *
 * Placeholdery: "price_pro_monthly", "price_business_yearly" — zawierają
 * myślniki/dolne podkreślenia po prefiksie i nie mają wymaganej długości.
 */
export function isRealStripePriceId(priceId: string | undefined): boolean {
  if (!priceId) return false;
  return /^price_[A-Za-z0-9]{14,}$/.test(priceId);
}

/**
 * Zwraca true tylko wtedy, gdy Stripe jest w pełni gotowy do użycia:
 * 1. VITE_STRIPE_ENABLED === 'true'
 * 2. Przynajmniej Price ID Pro (miesięczny) jest ustawiony i wygląda jak prawdziwy
 *
 * Używaj tej funkcji do blokowania UI checkout, gdy konfiguracja jest niekompletna.
 */
export function isStripeConfigured(): boolean {
  if (import.meta.env.VITE_STRIPE_ENABLED !== 'true') return false;
  return isRealStripePriceId(import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY);
}

/**
 * Get Stripe Price ID for a plan and billing period.
 * Returns undefined if the env variable is not set or not a real Stripe Price ID.
 */
export function getStripePriceId(
  plan: 'pro' | 'starter' | 'business' | 'enterprise',
  period: 'monthly' | 'yearly'
): string | undefined {
  return STRIPE_PRICE_IDS[plan]?.[period];
}
