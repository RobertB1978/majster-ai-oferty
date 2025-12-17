/**
 * Stripe Subscription Hook
 *
 * React hook for managing Stripe subscriptions in frontend.
 * Queries the new 'subscriptions' table created in Stripe integration migration.
 *
 * Created: 2025-12-17
 * Based on: Supabase + Stripe best practices 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Stripe subscription status from database
export type StripeSubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid';

export interface StripeSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  status: StripeSubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ended_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to get current user's Stripe subscription
 */
export function useStripeSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stripe-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        throw error;
      }

      return data as StripeSubscription | null;
    },
    enabled: !!user,
  });
}

/**
 * Hook to create Stripe checkout session
 */
export function useCreateCheckoutSession() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ priceId }: { priceId: string }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });

      if (error) {
        console.error('Checkout session error:', error);
        throw error;
      }

      return data as { sessionId: string; url: string };
    },
    onError: (error: Error) => {
      console.error('Checkout error:', error);
      toast.error('Nie udało się rozpocząć płatności. Spróbuj ponownie.');
    },
  });
}

/**
 * Hook to check subscription status and features
 */
export function useSubscriptionStatus() {
  const { data: subscription, isLoading } = useStripeSubscription();

  const isActive = subscription?.status === 'active';
  const isTrialing = subscription?.status === 'trialing';
  const isPastDue = subscription?.status === 'past_due';
  const isCanceled = subscription?.status === 'canceled';

  const hasAccess = isActive || isTrialing;

  // Check if trial is ending soon (within 3 days)
  const trialEndingSoon =
    isTrialing &&
    subscription?.trial_end &&
    new Date(subscription.trial_end).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  // Check if subscription will cancel at period end
  const willCancelAtPeriodEnd = subscription?.cancel_at_period_end || false;

  return {
    subscription,
    isLoading,
    isActive,
    isTrialing,
    isPastDue,
    isCanceled,
    hasAccess,
    trialEndingSoon,
    willCancelAtPeriodEnd,
    currentPeriodEnd: subscription?.current_period_end
      ? new Date(subscription.current_period_end)
      : null,
  };
}

/**
 * Hook to manage subscription (cancel, reactivate)
 */
export function useManageSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      // This would call a Stripe Edge Function to cancel subscription
      // For now, we'll just show a placeholder
      throw new Error('Cancel subscription not implemented - use Stripe Customer Portal');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-subscription'] });
      toast.success('Subskrypcja została anulowana');
    },
    onError: (error: Error) => {
      toast.error(`Błąd anulowania: ${error.message}`);
    },
  });

  const reactivateSubscription = useMutation({
    mutationFn: async () => {
      // This would call a Stripe Edge Function to reactivate subscription
      throw new Error('Reactivate subscription not implemented - use Stripe Customer Portal');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-subscription'] });
      toast.success('Subskrypcja została wznowiona');
    },
    onError: (error: Error) => {
      toast.error(`Błąd wznowienia: ${error.message}`);
    },
  });

  return {
    cancelSubscription,
    reactivateSubscription,
  };
}

/**
 * Get customer's Stripe customer ID
 */
export function useStripeCustomer() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stripe-customer', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('customers')
        .select('stripe_customer_id, email')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Customer doesn't exist yet - will be created on first checkout
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });
}
