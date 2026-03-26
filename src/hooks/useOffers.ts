/**
 * useOffers — PR-09
 *
 * TanStack Query hook for the standalone `offers` table.
 * Provides list query with status filter + search + sort.
 * RLS enforced server-side (user_id = auth.uid()).
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  client_reference: string | null;
  /** Sprint D1: industry starter pack origin. Null for manually created offers. */
  source_template_id: string | null;
}

export interface OffersQueryParams {
  status?: OfferStatus | 'ALL';
  search?: string;
  sort?: OfferSort;
}

export const offersKeys = {
  all: ['offers'] as const,
  list: (params: OffersQueryParams) => [...offersKeys.all, 'list', params] as const,
  detail: (id: string) => [...offersKeys.all, 'detail', id] as const,
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
        .select('id, user_id, client_id, status, title, total_net, total_gross, currency, sent_at, accepted_at, rejected_at, last_activity_at, created_at, updated_at, source_template_id');

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

      const offers = (data as Offer[]) ?? [];
      const clientIds = Array.from(new Set(offers.map((offer) => offer.client_id).filter(Boolean))) as string[];

      let clientMap = new Map<string, string>();
      if (clientIds.length > 0) {
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds);

        if (!clientsError) {
          clientMap = new Map((clients ?? []).map((client) => [client.id, client.name]));
        }
      }

      return offers.map((offer) => ({
        ...offer,
        client_reference: offer.client_id ? (clientMap.get(offer.client_id) ?? offer.client_id) : null,
      }));
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

/**
 * Fetch minimal offer data for source-offer context in ProjectHub.
 * Returns null when offerId is empty or the offer no longer exists.
 */
export function useSourceOffer(offerId: string | null | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: offersKeys.detail(offerId ?? ''),
    queryFn: async (): Promise<Pick<Offer, 'id' | 'title' | 'total_net' | 'currency' | 'accepted_at' | 'source_template_id'> | null> => {
      if (!offerId) return null;
      const { data, error } = await supabase
        .from('offers')
        .select('id, title, total_net, currency, accepted_at, source_template_id')
        .eq('id', offerId)
        .maybeSingle();
      if (error) throw error;
      return data as Pick<Offer, 'id' | 'title' | 'total_net' | 'currency' | 'accepted_at' | 'source_template_id'> | null;
    },
    enabled: !!user && !!offerId,
    staleTime: 60_000,
  });
}

// ── Paginated (infinite) offers ───────────────────────────────────────────────

export const PAGE_SIZE = 20;

export const offersInfiniteKeys = {
  all: ['offers-infinite'] as const,
  list: (params: OffersQueryParams) => [...offersInfiniteKeys.all, 'list', params] as const,
};

/**
 * Cursor-based paginated offers using useInfiniteQuery.
 * Each page fetches PAGE_SIZE (20) items ordered by last_activity_at DESC.
 * Use `hasNextPage` / `fetchNextPage` to power a "Load more" button.
 */
export function useOffersInfinite(params: OffersQueryParams = {}) {
  const { user } = useAuth();
  const { status = 'ALL', search = '', sort = 'last_activity_at' } = params;

  return useInfiniteQuery({
    queryKey: offersInfiniteKeys.list(params),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Offer[]> => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('offers')
        .select('id, user_id, client_id, status, title, total_net, total_gross, currency, sent_at, accepted_at, rejected_at, last_activity_at, created_at, updated_at, source_template_id')
        .order(sort, { ascending: false })
        .range(from, to);

      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }
      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const offers = (data as Offer[]) ?? [];
      const clientIds = Array.from(new Set(offers.map((o) => o.client_id).filter(Boolean))) as string[];

      let clientMap = new Map<string, string>();
      if (clientIds.length > 0) {
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds);
        if (!clientsError) {
          clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]));
        }
      }

      return offers.map((o) => ({
        ...o,
        client_reference: o.client_id ? (clientMap.get(o.client_id) ?? o.client_id) : null,
      }));
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
    enabled: !!user,
    staleTime: 30_000,
  });
}

// ── Archive ───────────────────────────────────────────────────────────────────

/**
 * Soft-delete (archive) an offer by setting status to ARCHIVED.
 */
export function useArchiveOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
        .eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
}
