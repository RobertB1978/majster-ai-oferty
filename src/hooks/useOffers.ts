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

// ── L-5: Unified status mapping ───────────────────────────────────────────────
// Legacy offer_approvals uses lowercase statuses; canonical offers uses UPPERCASE.
// When a SENT offer was accepted/rejected via the legacy flow (approve-offer EF),
// offers.status remains 'SENT'. resolveUnifiedStatus corrects this discrepancy.

/** Maps legacy offer_approvals status values to canonical OfferStatus. */
export const LEGACY_TO_CANONICAL: Readonly<Partial<Record<string, OfferStatus>>> = {
  accepted: 'ACCEPTED',
  approved: 'ACCEPTED',
  rejected: 'REJECTED',
} as const;

/**
 * Resolves the authoritative status when canonical (offers.status) and legacy
 * (offer_approvals.status) may disagree.
 * Canonical wins unless still SENT and legacy has a more terminal state.
 */
export function resolveUnifiedStatus(
  canonicalStatus: OfferStatus,
  legacyStatus: string | undefined | null,
): OfferStatus {
  if (canonicalStatus === 'SENT' && legacyStatus) {
    return LEGACY_TO_CANONICAL[legacyStatus] ?? canonicalStatus;
  }
  return canonicalStatus;
}

/**
 * For a batch of offers, fetches any legacy offer_approvals that override
 * the canonical status for SENT offers. Returns a Map of offer_id → resolved status.
 * No-op (returns empty map) when there are no SENT offers in the batch.
 */
async function buildLegacyStatusOverrides(
  offers: Offer[],
): Promise<Map<string, OfferStatus>> {
  const sentIds = offers.filter((o) => o.status === 'SENT').map((o) => o.id);
  if (sentIds.length === 0) return new Map();

  const { data: approvals } = await supabase
    .from('offer_approvals')
    .select('offer_id, status')
    .in('offer_id', sentIds)
    .in('status', ['accepted', 'approved', 'rejected']);

  const overrides = new Map<string, OfferStatus>();
  for (const row of approvals ?? []) {
    const resolved = LEGACY_TO_CANONICAL[(row as { offer_id: string | null; status: string }).status];
    const offerId = (row as { offer_id: string | null; status: string }).offer_id;
    if (resolved && offerId) overrides.set(offerId, resolved);
  }
  return overrides;
}

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

      // L-5: Resolve status for offers accepted/rejected via legacy flow
      const statusOverrides = await buildLegacyStatusOverrides(offers);

      return offers.map((offer) => ({
        ...offer,
        client_reference: offer.client_id ? (clientMap.get(offer.client_id) ?? offer.client_id) : null,
        status: statusOverrides.get(offer.id) ?? offer.status,
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

      // L-5: Resolve status for offers accepted/rejected via legacy flow
      const statusOverrides = await buildLegacyStatusOverrides(offers);

      return offers.map((o) => ({
        ...o,
        client_reference: o.client_id ? (clientMap.get(o.client_id) ?? o.client_id) : null,
        status: statusOverrides.get(o.id) ?? o.status,
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

// ── Duplicate as new version ──────────────────────────────────────────────────

/**
 * Duplicate an existing offer as a new DRAFT.
 * - Copies title (appends " (kopia)"), client, currency.
 * - Clones all items and variants via save_offer_items RPC.
 * - Original offer is not modified.
 * - Returns the new offer's id.
 */
export function useDuplicateOffer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceOfferId: string): Promise<string> => {
      if (!user) throw new Error('Not authenticated');

      // 1. Load source offer header
      const { data: source, error: sourceErr } = await supabase
        .from('offers')
        .select('client_id, title, currency')
        .eq('id', sourceOfferId)
        .single();
      if (sourceErr) throw sourceErr;

      // 2. Load source items
      const { data: rawItems, error: itemsErr } = await supabase
        .from('offer_items')
        .select('item_type, name, unit, qty, unit_price_net, vat_rate, variant_id')
        .eq('offer_id', sourceOfferId)
        .order('created_at', { ascending: true });
      if (itemsErr) throw itemsErr;

      // 3. Load source variants
      const { data: rawVariants, error: variantsErr } = await supabase
        .from('offer_variants')
        .select('id, label, sort_order')
        .eq('offer_id', sourceOfferId)
        .order('sort_order', { ascending: true });
      if (variantsErr) throw variantsErr;

      const allItems = rawItems ?? [];
      const allVariants = rawVariants ?? [];
      const hasVariants = allVariants.length > 0;

      // 4. Compute totals (mirrors computeTotals from useOfferWizard)
      let totalNet = 0;
      let totalVat = 0;
      const repItems = hasVariants
        ? allItems.filter((it) => it.variant_id === allVariants[0].id)
        : allItems.filter((it) => it.variant_id === null);
      for (const it of repItems) {
        const net = Number(it.qty) * Number(it.unit_price_net);
        const vat = net * (Number(it.vat_rate ?? 0) / 100);
        totalNet += net;
        totalVat += vat;
      }
      const roundedNet = Math.round(totalNet * 100) / 100;
      const roundedVat = Math.round(totalVat * 100) / 100;
      const roundedGross = Math.round((totalNet + totalVat) * 100) / 100;

      // 5. Create new DRAFT offer (source_template_id intentionally not copied)
      const { data: newOffer, error: insertErr } = await supabase
        .from('offers')
        .insert({
          user_id: user.id,
          client_id: source.client_id,
          title: source.title ? `${source.title} (kopia)` : null,
          status: 'DRAFT' as OfferStatus,
          currency: source.currency,
          total_net: roundedNet,
          total_vat: roundedVat,
          total_gross: roundedGross,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      const newOfferId = newOffer.id as string;

      // 6. Clone variants + items atomically via save_offer_items RPC
      const variantsPayload = hasVariants
        ? allVariants.map((v) => ({
            label: v.label,
            sort_order: v.sort_order,
            items: allItems
              .filter((it) => it.variant_id === v.id)
              .map((it) => ({
                item_type: it.item_type,
                name: it.name,
                unit: it.unit ?? '',
                qty: Number(it.qty),
                unit_price_net: Number(it.unit_price_net),
                vat_rate: it.vat_rate !== null ? Number(it.vat_rate) : null,
              })),
          }))
        : [];

      const itemsPayload = !hasVariants
        ? allItems
            .filter((it) => it.variant_id === null)
            .map((it) => ({
              item_type: it.item_type,
              name: it.name,
              unit: it.unit ?? '',
              qty: Number(it.qty),
              unit_price_net: Number(it.unit_price_net),
              vat_rate: it.vat_rate !== null ? Number(it.vat_rate) : null,
            }))
        : [];

      const { error: saveErr } = await supabase.rpc('save_offer_items', {
        p_offer_id: newOfferId,
        p_user_id: user.id,
        p_variants: variantsPayload,
        p_items: itemsPayload,
      });
      if (saveErr) throw saveErr;

      return newOfferId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offersKeys.all });
      queryClient.invalidateQueries({ queryKey: offersInfiniteKeys.all });
    },
  });
}
