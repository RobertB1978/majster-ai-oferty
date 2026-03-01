/**
 * useFreeTierOfferQuota — PR-06 free-plan offer quota hook
 *
 * Returns the current monthly offer usage and whether the user is allowed
 * to send/finalize a new offer.
 *
 * Logic:
 *  - Calls DB function count_monthly_finalized_offers() for accurate monthly count
 *  - Applies FREE_TIER_OFFER_LIMIT = 3 for free plan users
 *  - Paid-plan users always get canSend = true
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanFeatures } from './useSubscription';
import { canSendOffer, FREE_TIER_OFFER_LIMIT, remainingOfferQuota } from '@/config/entitlements';

export interface FreeTierOfferQuota {
  /** Number of finalized offers sent in the current calendar month */
  used: number;
  /** Maximum allowed per month (FREE_TIER_OFFER_LIMIT for free plan, Infinity for paid) */
  limit: number;
  /** Remaining offers this month */
  remaining: number;
  /** Whether the user can send a new offer right now */
  canSend: boolean;
  /** 'free' | 'pro' | 'business' | etc. */
  plan: string;
  /** True while data is loading */
  isLoading: boolean;
}

export function useFreeTierOfferQuota(): FreeTierOfferQuota {
  const { user } = useAuth();
  const { currentPlan } = usePlanFeatures();

  const { data: monthlyUsed = 0, isLoading } = useQuery({
    queryKey: ['monthly-offer-quota', user?.id, currentPlan],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase.rpc('count_monthly_finalized_offers', {
        p_user_id: user.id,
      });

      if (error) {
        // Fallback: client-side count on error (less accurate but never crashes)
        const { count, error: fallbackError } = await supabase
          .from('offer_approvals')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['sent', 'accepted', 'rejected'])
          .gte('created_at', getMonthStart());

        if (fallbackError) return 0;
        return count ?? 0;
      }

      return (data as number) ?? 0;
    },
    enabled: !!user,
    // Re-fetch when user sends an offer (staleTime short so quota updates fast)
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const limit = currentPlan === 'free' ? FREE_TIER_OFFER_LIMIT : Infinity;
  const remaining = remainingOfferQuota(currentPlan, monthlyUsed);

  return {
    used: monthlyUsed,
    limit,
    remaining,
    canSend: canSendOffer(currentPlan, monthlyUsed),
    plan: currentPlan,
    isLoading,
  };
}

/** Returns ISO string for the start of the current UTC calendar month */
function getMonthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
