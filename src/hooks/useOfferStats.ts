import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export interface OfferStats {
  sentCount: number;
  acceptedCount: number;
  conversionRate: number;
  followupCount: number;
  followupNotOpened: number;
  followupOpenedNoDecision: number;
}

/**
 * Hook to fetch and calculate offer statistics for the last 30 days
 * Phase 6A: Simple stats without heavy aggregations
 */
export function useOfferStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['offer_stats', user?.id],
    queryFn: async (): Promise<OfferStats> => {
      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch all offer_sends from last 30 days for current user
      const { data, error } = await supabase
        .from('offer_sends')
        .select('status, sent_at, id')
        .eq('user_id', user!.id)
        .gte('sent_at', thirtyDaysAgo.toISOString())
        .eq('status', 'sent'); // Only count successfully sent emails

      // Return empty stats on error instead of crashing the page
      if (error) {
        logger.warn('useOfferStats: offer_sends query failed', error.message);
        return { sentCount: 0, acceptedCount: 0, conversionRate: 0, followupCount: 0, followupNotOpened: 0, followupOpenedNoDecision: 0 };
      }

      // Calculate basic statistics
      const sentCount = data?.length || 0;

      // Count accepted offers from canonical offers table (ARCH-03: migrated from offer_approvals)
      const { count: acceptedCount, error: acceptedError } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('status', 'ACCEPTED')
        .gte('accepted_at', thirtyDaysAgo.toISOString());

      if (acceptedError) {
        logger.warn('useOfferStats: offers accepted query failed', acceptedError.message);
      }

      const conversionRate = sentCount > 0
        ? Math.round(((acceptedCount ?? 0) / sentCount) * 100)
        : 0;

      // Simplified follow-up stats (since tracking_status is not available)
      return {
        sentCount,
        acceptedCount: acceptedCount ?? 0,
        conversionRate,
        followupCount: 0,
        followupNotOpened: 0,
        followupOpenedNoDecision: 0,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
