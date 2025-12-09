import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OfferStats {
  sentCount: number;
  acceptedCount: number;
  conversionRate: number;
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
        .select('tracking_status, status')
        .eq('user_id', user!.id)
        .gte('sent_at', thirtyDaysAgo.toISOString())
        .eq('status', 'sent'); // Only count successfully sent emails

      if (error) throw error;

      // Calculate statistics
      const sentCount = data?.length || 0;
      const acceptedCount = data?.filter(
        (send) => send.tracking_status === 'accepted'
      ).length || 0;

      const conversionRate = sentCount > 0
        ? Math.round((acceptedCount / sentCount) * 100)
        : 0;

      return {
        sentCount,
        acceptedCount,
        conversionRate,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't need to be real-time
  });
}
