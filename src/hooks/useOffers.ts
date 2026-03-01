/**
 * useOffers — PR-09
 *
 * TanStack Query hook for the standalone `offers` table.
 * Provides list query with status filter + search + sort.
 * RLS enforced server-side (user_id = auth.uid()).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type OfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED';
export type OfferSort = 'last_activity_at' | 'created_at' | 'total_net';

export interface Offer {
  id: string;
  user_id: string;
  client_id: string | null;
  status: OfferStatus;
  title: string | null;
  total_net: number | null;
  total_gross: number | null;
  currency: string;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface OffersQueryParams {
  status?: OfferStatus | 'ALL';
  search?: string;
  sort?: OfferSort;
}

export const offersKeys = {
  all: ['offers'] as const,
  list: (params: OffersQueryParams) => [...offersKeys.all, 'list', params] as const,
};

/** No-response threshold in days for SENT offers */
export const NO_RESPONSE_DAYS = 7;

/**
 * Returns offers for the current user, filtered by status/search, sorted by sort field.
 * RLS prevents fetching other users' offers.
 */
export function useOffers(params: OffersQueryParams = {}) {
  const { user } = useAuth();
  const { status = 'ALL', search = '', sort = 'last_activity_at' } = params;

  return useQuery({
    queryKey: offersKeys.list(params),
    queryFn: async (): Promise<Offer[]> => {
      let query = supabase
        .from('offers')
        .select('id, user_id, client_id, status, title, total_net, total_gross, currency, sent_at, accepted_at, rejected_at, last_activity_at, created_at, updated_at');

      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }

      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      // Sort: last_activity_at DESC is default; created_at DESC for newest; total_net DESC for value
      const ascending = false;
      query = query.order(sort, { ascending });

      const { data, error } = await query;
      if (error) throw error;

      return (data as Offer[]) ?? [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
