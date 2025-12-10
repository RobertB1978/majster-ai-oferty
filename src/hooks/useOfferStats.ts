import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

      if (error) throw error;

      // Calculate basic statistics
      const sentCount = data?.length || 0;
      
      // Without tracking_status, we count accepted from offer_approvals
      const { data: approvals } = await supabase
        .from('offer_approvals')
        .select('status')
        .eq('user_id', user!.id)
        .eq('status', 'approved')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const acceptedCount = approvals?.length || 0;

      const conversionRate = sentCount > 0
        ? Math.round((acceptedCount / sentCount) * 100)
        : 0;

      // Simplified follow-up stats (since tracking_status is not available)
      return {
        sentCount,
        acceptedCount,
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
