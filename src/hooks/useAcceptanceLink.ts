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

      // Delete any existing link first.
      // This handles two cases safely:
      //   1. No link exists → DELETE is a no-op, INSERT creates fresh link.
      //   2. Expired link exists → DELETE removes it, INSERT creates new link
      //      with a fresh token (UUID) and new 30-day expiry via DB defaults.
      // Note: the "Create link" button is only shown when no link or link is
      // expired, so this never invalidates a live, non-expired client session.
      await supabase
        .from('acceptance_links')
        .delete()
        .eq('offer_id', offerId);

      const { data, error } = await supabase
        .from('acceptance_links')
        .insert({
          user_id: user.id,
          offer_id: offerId,
          // token and expires_at use DB defaults (gen_random_uuid, now+30d)
        })
        .select('id, offer_id, token, expires_at, created_at')
        .single();

      if (error) throw error;
      return data as AcceptanceLink;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

export function buildAcceptanceLinkUrl(token: string): string {
  return `${window.location.origin}/a/${token}`;
}

export function daysUntilExpiry(expiresAt: string): number {
  return differenceInDays(new Date(expiresAt), new Date());
}
