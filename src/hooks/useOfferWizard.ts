/**
 * useOfferWizard — PR-10
 *
 * Data layer for the Offer Wizard.
 * Handles loading an existing draft and saving (upsert) offer + items.
 * Drafts NEVER count toward the FREE_TIER_OFFER_LIMIT (quota is for SEND only).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { offersKeys } from '@/hooks/useOffers';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ItemType = 'labor' | 'material' | 'service' | 'travel' | 'lump_sum';

export interface WizardItem {
  /** Temporary local ID (uuid generated client-side) */
  localId: string;
  /** DB id from offer_items — null when not yet saved */
  dbId: string | null;
  name: string;
  unit: string;
  qty: number;
  unit_price_net: number;
  vat_rate: number | null;
  item_type: ItemType;
}

export interface WizardFormData {
  offerId: string | null;
  clientId: string | null;
  /** When user creates a new client inline */
  newClient: { name: string; phone: string; email: string } | null;
  title: string;
  items: WizardItem[];
}

export interface OfferWithItems {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string | null;
  status: string;
  total_net: number | null;
  total_vat: number | null;
  total_gross: number | null;
  currency: string;
  items: WizardItem[];
}

// ── Computed totals ───────────────────────────────────────────────────────────

export function computeTotals(items: WizardItem[]) {
  const total_net = items.reduce((sum, it) => sum + it.qty * it.unit_price_net, 0);
  const total_vat = items.reduce((sum, it) => {
    const rate = it.vat_rate ?? 0;
    return sum + it.qty * it.unit_price_net * (rate / 100);
  }, 0);
  return {
    total_net: Math.round(total_net * 100) / 100,
    total_vat: Math.round(total_vat * 100) / 100,
    total_gross: Math.round((total_net + total_vat) * 100) / 100,
  };
}

// ── Keys ─────────────────────────────────────────────────────────────────────

export const offerWizardKeys = {
  detail: (id: string) => ['offerWizard', id] as const,
};

// ── Load existing draft ───────────────────────────────────────────────────────

export function useLoadOfferDraft(offerId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: offerWizardKeys.detail(offerId ?? 'new'),
    queryFn: async (): Promise<OfferWithItems | null> => {
      if (!offerId) return null;

      const { data: offer, error: offerErr } = await supabase
        .from('offers')
        .select('id, user_id, client_id, title, status, total_net, total_gross, currency')
        .eq('id', offerId)
        .maybeSingle();

      if (offerErr) throw offerErr;
      if (!offer) return null;

      const { data: rawItems, error: itemsErr } = await supabase
        .from('offer_items')
        .select('id, item_type, name, unit, qty, unit_price_net, vat_rate, line_total_net')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true });

      if (itemsErr) throw itemsErr;

      const items: WizardItem[] = (rawItems ?? []).map((row) => ({
        localId: row.id,
        dbId: row.id,
        name: row.name,
        unit: row.unit ?? '',
        qty: Number(row.qty),
        unit_price_net: Number(row.unit_price_net),
        vat_rate: row.vat_rate !== null ? Number(row.vat_rate) : null,
        item_type: row.item_type as ItemType,
      }));

      return {
        ...(offer as Omit<OfferWithItems, 'items' | 'total_vat'>),
        total_vat: null,
        items,
      };
    },
    enabled: !!user && !!offerId,
    staleTime: 0,
  });
}

// ── Save draft ────────────────────────────────────────────────────────────────

export function useSaveDraft() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: WizardFormData): Promise<string> => {
      if (!user) throw new Error('Not authenticated');

      let clientId = form.clientId;

      // 1. Create new client if needed
      if (!clientId && form.newClient && form.newClient.name.trim()) {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            name: form.newClient.name.trim(),
            phone: form.newClient.phone.trim() || null,
            email: form.newClient.email.trim() || null,
          })
          .select('id')
          .single();

        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      const totals = computeTotals(form.items);

      // 2. Upsert offer
      let offerId = form.offerId;
      if (offerId) {
        const { error } = await supabase
          .from('offers')
          .update({
            client_id: clientId,
            title: form.title.trim() || null,
            status: 'DRAFT',
            total_net: totals.total_net,
            total_vat: totals.total_vat,
            total_gross: totals.total_gross,
          })
          .eq('id', offerId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('offers')
          .insert({
            user_id: user.id,
            client_id: clientId,
            title: form.title.trim() || null,
            status: 'DRAFT',
            total_net: totals.total_net,
            total_vat: totals.total_vat,
            total_gross: totals.total_gross,
          })
          .select('id')
          .single();
        if (error) throw error;
        offerId = data.id;
      }

      // 3. Replace items: delete all then insert
      const { error: delErr } = await supabase
        .from('offer_items')
        .delete()
        .eq('offer_id', offerId);
      if (delErr) throw delErr;

      if (form.items.length > 0) {
        const rows = form.items.map((it) => ({
          user_id: user.id,
          offer_id: offerId as string,
          item_type: it.item_type,
          name: it.name,
          unit: it.unit || null,
          qty: it.qty,
          unit_price_net: it.unit_price_net,
          vat_rate: it.vat_rate,
          line_total_net: Math.round(it.qty * it.unit_price_net * 100) / 100,
        }));

        const { error: insErr } = await supabase.from('offer_items').insert(rows);
        if (insErr) throw insErr;
      }

      return offerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
}
