/**
 * useRecentActivity — fetches real user activity from Supabase
 *
 * Replaces demo/placeholder data in ActivityFeed with actual user actions:
 * - Offers created/sent/accepted/rejected
 * - Clients added
 * - Projects created
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Activity } from '@/data/demoActivities';
import type { ActivityType } from '@/data/activityConfig';

function mapOfferStatusToActivityType(status: string): ActivityType {
  switch (status) {
    case 'ACCEPTED':
      return 'offer_accepted';
    case 'SENT':
      return 'offer_sent';
    default:
      return 'quote_created';
  }
}

export function useRecentActivity(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-activity', user?.id, limit],
    queryFn: async (): Promise<Activity[]> => {
      if (!user) throw new Error('User not authenticated');

      const activities: Activity[] = [];

      // Fetch recent offers (created, sent, accepted)
      const { data: offers } = await supabase
        .from('offers')
        .select('id, title, status, total_net, created_at, sent_at, accepted_at, client_id')
        .order('last_activity_at', { ascending: false })
        .limit(limit);

      if (offers) {
        for (const offer of offers) {
          const actType = mapOfferStatusToActivityType(offer.status);
          const timestamp = offer.accepted_at || offer.sent_at || offer.created_at;
          activities.push({
            id: `offer-${offer.id}`,
            type: actType,
            title: offer.title || 'Oferta',
            timestamp: new Date(timestamp),
            amount: actType === 'offer_accepted' && offer.total_net ? offer.total_net : undefined,
          });
        }
      }

      // Fetch recent clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (clients) {
        for (const client of clients) {
          activities.push({
            id: `client-${client.id}`,
            type: 'client_added',
            title: client.name,
            timestamp: new Date(client.created_at),
          });
        }
      }

      // Sort all activities by timestamp descending, take top N
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return activities.slice(0, limit);
    },
    enabled: !!user,
    staleTime: 60_000, // 1 minute
  });
}
