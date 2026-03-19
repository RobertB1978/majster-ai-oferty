/**
 * useOfferVariants — Sprint: offer-versioning-7RcU5
 *
 * Provides access to offer variants for a given offer (owner-side).
 * Used in the wizard to manage variant labels and in the review/preview.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OfferVariant {
  id: string;
  offer_id: string;
  user_id: string;
  label: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const offerVariantKeys = {
  byOffer: (offerId: string) => ['offerVariants', offerId] as const,
};

// ── List variants for an offer ────────────────────────────────────────────────

export function useOfferVariants(offerId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: offerVariantKeys.byOffer(offerId ?? ''),
    queryFn: async (): Promise<OfferVariant[]> => {
      if (!offerId) return [];
      const { data, error } = await supabase
        .from('offer_variants')
        .select('id, offer_id, user_id, label, sort_order, created_at, updated_at')
        .eq('offer_id', offerId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as OfferVariant[];
    },
    enabled: !!user && !!offerId,
    staleTime: 1000 * 60,
  });
}
