/**
 * useAcceptanceLink — PR-12
 *
 * Manages acceptance links for a given offer (owner side).
 * - Fetches existing link (if any)
 * - Creates a new link (upsert: UNIQUE on offer_id)
 * - Deletes the link
 *
 * Security: all DB calls are authenticated (user_id = auth.uid() RLS).
 * Public resolution is handled by the SECURITY DEFINER DB function.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AcceptanceLink {
  id: string;
  offer_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

function acceptanceLinkKeys(offerId: string) {
  return ['acceptanceLink', offerId] as const;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function useAcceptanceLink(offerId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: acceptanceLinkKeys(offerId ?? ''),
    queryFn: async (): Promise<AcceptanceLink | null> => {
      if (!offerId) return null;
      const { data, error } = await supabase
        .from('acceptance_links')
        .select('id, offer_id, token, expires_at, created_at')
        .eq('offer_id', offerId)
        .maybeSingle();
      if (error) throw error;
      return data as AcceptanceLink | null;
    },
    enabled: !!offerId && !!user,
    staleTime: 30_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateAcceptanceLink(offerId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AcceptanceLink> => {
      if (!user) throw new Error('Not authenticated');

      // Atomic UPSERT via RPC — eliminates race condition where DELETE
      // succeeds but INSERT fails, leaving the offer without a link.
      // Uses ON CONFLICT (offer_id) to create or refresh the link in
      // a single statement with a fresh token and 30-day expiry.
      const { data, error } = await supabase.rpc('upsert_acceptance_link', {
        p_offer_id: offerId,
        p_user_id: user.id,
      });

      if (error) throw error;
      if (!data) throw new Error('upsert_acceptance_link returned no data');
      return data as unknown as AcceptanceLink;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: acceptanceLinkKeys(offerId) });
    },
  });
}

export function useDeleteAcceptanceLink(offerId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('acceptance_links')
        .delete()
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: acceptanceLinkKeys(offerId) });
    },
  });
}

// ── ARCH-01: Canonical public offer route constants ────────────────────────────
// Single source of truth for public offer routing (imported by tests + App.tsx comments).

/** Canonical public offer route — acceptance_links.token (ARCH-01) */
export const CANONICAL_PUBLIC_OFFER_ROUTE = '/a/:token' as const;

/** Legacy compatibility routes — DO NOT add new business logic (ARCH-01) */
export const LEGACY_PUBLIC_OFFER_ROUTES = ['/offer/:token', '/oferta/:token'] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function buildAcceptanceLinkUrl(token: string): string {
  // Uses CANONICAL_PUBLIC_OFFER_ROUTE pattern: /a/:token
  return `${window.location.origin}/a/${token}`;
}

export function daysUntilExpiry(expiresAt: string): number {
  return differenceInDays(new Date(expiresAt), new Date());
}
