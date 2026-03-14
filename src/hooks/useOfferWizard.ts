/**
 * useOfferWizard — PR-10 (extended in offer-versioning-7RcU5)
 *
 * Data layer for the Offer Wizard.
 * Handles loading an existing draft and saving (upsert) offer + items + variants.
 * Drafts NEVER count toward the FREE_TIER_OFFER_LIMIT (quota is for SEND only).
 *
 * Variant mode:
 *   - When form.variants.length === 0 → no-variant mode, items saved with variant_id = NULL
 *   - When form.variants.length > 0   → variant mode, each variant owns its items
 *   - Max 3 variants enforced in UI layer
 *   - Offer totals = first variant's totals (or all items in no-variant mode)
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

/**
 * A single named variant with its own item set.
 * Sprint offer-versioning-7RcU5.
 */
export interface WizardVariant {
  /** Temporary local ID (uuid generated client-side) */
  localId: string;
  /** DB id from offer_variants — null when not yet saved */
  dbId: string | null;
  label: string;
  items: WizardItem[];
}

export interface WizardFormData {
  offerId: string | null;
  clientId: string | null;
  /** When user creates a new client inline */
  newClient: { name: string; phone: string; email: string } | null;
  title: string;
  /**
   * Items in no-variant mode (variants.length === 0).
   * When variants exist, this array is ignored in favour of variant.items.
   */
  items: WizardItem[];
  /**
   * Named variants. Empty = no-variant mode.
   * Max 3 variants enforced in UI layer.
   */
  variants: WizardVariant[];
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
  variants: WizardVariant[];
}

// ── Computed totals ───────────────────────────────────────────────────────────

export function computeTotalsForItems(items: WizardItem[]) {
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

/**
 * Compute totals from form data.
 * In variant mode, returns totals for the first variant (representative totals for the offer row).
 */
export function computeTotals(form: Pick<WizardFormData, 'items' | 'variants'>) {
  if (form.variants.length > 0) {
    return computeTotalsForItems(form.variants[0]?.items ?? []);
  }
  return computeTotalsForItems(form.items);
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

      // Load items (with variant_id)
      const { data: rawItems, error: itemsErr } = await supabase
        .from('offer_items')
        .select('id, item_type, name, unit, qty, unit_price_net, vat_rate, line_total_net, variant_id')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true });

      if (itemsErr) throw itemsErr;

      // Load variants
      const { data: rawVariants, error: variantsErr } = await supabase
        .from('offer_variants')
        .select('id, label, sort_order')
        .eq('offer_id', offerId)
        .order('sort_order', { ascending: true });

      if (variantsErr) throw variantsErr;

      const allRawItems = rawItems ?? [];

      // Build variant mode or no-variant mode
      const variants: WizardVariant[] = (rawVariants ?? []).map((v) => ({
        localId: v.id,
        dbId: v.id,
        label: v.label,
        items: allRawItems
          .filter((it) => it.variant_id === v.id)
          .map((row) => ({
            localId: row.id,
            dbId: row.id,
            name: row.name,
            unit: row.unit ?? '',
            qty: Number(row.qty),
            unit_price_net: Number(row.unit_price_net),
            vat_rate: row.vat_rate !== null ? Number(row.vat_rate) : null,
            item_type: row.item_type as ItemType,
          })),
      }));

      // No-variant items (variant_id = null)
      const noVariantItems: WizardItem[] = allRawItems
        .filter((it) => it.variant_id === null)
        .map((row) => ({
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
        ...(offer as Omit<OfferWithItems, 'items' | 'total_vat' | 'variants'>),
        total_vat: null,
        items: noVariantItems,
        variants,
      };
    },
    enabled: !!user && !!offerId,
    staleTime: 1000 * 60,
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

      const totals = computeTotals(form);

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

      // 3. Save variants and items
      if (form.variants.length > 0) {
        await saveWithVariants(offerId, user.id, form.variants);
      } else {
        await saveNoVariant(offerId, user.id, form.items);
      }

      return offerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offersKeys.all });
    },
  });
}

// ── Internal save helpers ─────────────────────────────────────────────────────

async function saveNoVariant(offerId: string, userId: string, items: WizardItem[]) {
  // Delete all existing variants (cascades to variant items)
  await supabase.from('offer_variants').delete().eq('offer_id', offerId);

  // Delete remaining items (no-variant ones)
  await supabase.from('offer_items').delete().eq('offer_id', offerId);

  if (items.length > 0) {
    const rows = items.map((it) => ({
      user_id: userId,
      offer_id: offerId,
      item_type: it.item_type,
      name: it.name,
      unit: it.unit || null,
      qty: it.qty,
      unit_price_net: it.unit_price_net,
      vat_rate: it.vat_rate,
      line_total_net: Math.round(it.qty * it.unit_price_net * 100) / 100,
      variant_id: null,
    }));
    const { error } = await supabase.from('offer_items').insert(rows);
    if (error) throw error;
  }
}

async function saveWithVariants(offerId: string, userId: string, variants: WizardVariant[]) {
  // Clear all existing variants (cascades to their items via ON DELETE CASCADE)
  await supabase.from('offer_variants').delete().eq('offer_id', offerId);
  // Clear any remaining no-variant items
  await supabase.from('offer_items').delete().eq('offer_id', offerId);

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];

    // Insert variant
    const { data: inserted, error: vErr } = await supabase
      .from('offer_variants')
      .insert({
        offer_id: offerId,
        user_id: userId,
        label: v.label.trim() || `Wariant ${i + 1}`,
        sort_order: i,
      })
      .select('id')
      .single();
    if (vErr) throw vErr;

    const variantDbId = inserted.id;

    if (v.items.length > 0) {
      const rows = v.items.map((it) => ({
        user_id: userId,
        offer_id: offerId,
        item_type: it.item_type,
        name: it.name,
        unit: it.unit || null,
        qty: it.qty,
        unit_price_net: it.unit_price_net,
        vat_rate: it.vat_rate,
        line_total_net: Math.round(it.qty * it.unit_price_net * 100) / 100,
        variant_id: variantDbId,
      }));
      const { error: iErr } = await supabase.from('offer_items').insert(rows);
      if (iErr) throw iErr;
    }
  }
}
