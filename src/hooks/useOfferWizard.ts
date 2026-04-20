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
  newClient: {
    name: string;
    phone: string;
    email: string;
    nip: string;
    street: string;
    postal_code: string;
    city: string;
  } | null;
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
  /** PR-COMM-04: commercial text fields */
  offerText: string;
  terms: string;
  deadlineText: string;
  /** ISO 8601 string or empty — stored as valid_until in DB. Empty = use +30d default at PDF build time. */
  validUntil: string;
  /**
   * PR-FIN-10: offer-level markup (narzut) in percent, 0..100.
   * Applied uniformly to net + VAT to produce final stored totals.
   * Default 0 = no markup (totals == sum of line totals).
   */
  marginPercent: number;
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
  offer_text: string | null;
  terms: string | null;
  deadline_text: string | null;
  valid_until: string | null;
  /** PR-FIN-10: offer-level markup percent, 0..100. Default 0 for legacy offers. */
  margin_percent: number;
  items: WizardItem[];
  variants: WizardVariant[];
}

// ── Computed totals ───────────────────────────────────────────────────────────

export interface OfferTotals {
  total_net: number;
  total_vat: number;
  total_gross: number;
}

export function computeTotalsForItems(items: WizardItem[]): OfferTotals {
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
 * PR-FIN-10: clamp a margin value into the safe 0..100 range.
 * NaN / null / undefined / negative → 0; values above 100 → 100.
 */
export function clampMarginPercent(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

/**
 * PR-FIN-10: apply offer-level markup (narzut) to a raw totals triplet.
 * VAT is scaled by the same factor so per-item VAT proportions are preserved.
 * Result is rounded to 2 decimals (matching DB NUMERIC scale).
 */
export function applyMargin(raw: OfferTotals, marginPercent: number): OfferTotals {
  const factor = 1 + clampMarginPercent(marginPercent) / 100;
  const total_net = Math.round(raw.total_net * factor * 100) / 100;
  const total_vat = Math.round(raw.total_vat * factor * 100) / 100;
  return {
    total_net,
    total_vat,
    total_gross: Math.round((total_net + total_vat) * 100) / 100,
  };
}

/**
 * Compute totals from form data, applying the offer-level margin (PR-FIN-10).
 * In variant mode, returns totals for the first variant (representative totals for the offer row).
 */
export function computeTotals(
  form: Pick<WizardFormData, 'items' | 'variants' | 'marginPercent'>,
): OfferTotals {
  const raw = form.variants.length > 0
    ? computeTotalsForItems(form.variants[0]?.items ?? [])
    : computeTotalsForItems(form.items);
  return applyMargin(raw, form.marginPercent);
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
        .select('id, user_id, client_id, title, status, total_net, total_gross, currency, offer_text, terms, deadline_text, valid_until, margin_percent')
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
        ...(offer as Omit<OfferWithItems, 'items' | 'total_vat' | 'variants' | 'margin_percent'>),
        total_vat: null,
        // PR-FIN-10: numeric column may arrive as string from supabase-js; coerce + clamp.
        margin_percent: clampMarginPercent(Number((offer as { margin_percent?: number | string | null }).margin_percent ?? 0)),
        items: noVariantItems,
        variants,
      } as OfferWithItems;
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
            nip: form.newClient.nip.trim() || '',
            address: form.newClient.street.trim() || null,
            postal_code: form.newClient.postal_code.trim() || null,
            city: form.newClient.city.trim() || null,
          })
          .select('id')
          .single();

        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      // PR-FIN-10: computeTotals already applies form.marginPercent.
      const totals = computeTotals(form);
      const marginPercent = clampMarginPercent(form.marginPercent);

      // 2. Upsert offer
      let offerId = form.offerId;
      const commercialFields = {
        offer_text: form.offerText.trim() || null,
        terms: form.terms.trim() || null,
        deadline_text: form.deadlineText.trim() || null,
        valid_until: form.validUntil.trim() || null,
        margin_percent: marginPercent,
      };

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
            ...commercialFields,
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
            ...commercialFields,
          })
          .select('id')
          .single();
        if (error) throw error;
        offerId = data.id;
      }

      // 3. Save variants and items — atomic via DB function (BUG-02 fix: prevents partial state)
      const variantsPayload = form.variants.length > 0
        ? form.variants.map((v, i) => ({
            label: v.label.trim() || `Wariant ${i + 1}`,
            sort_order: i,
            items: v.items.map((it) => ({
              item_type: it.item_type,
              name: it.name,
              unit: it.unit || '',
              qty: it.qty,
              unit_price_net: it.unit_price_net,
              vat_rate: it.vat_rate,
            })),
          }))
        : [];

      const itemsPayload = form.variants.length === 0
        ? form.items.map((it) => ({
            item_type: it.item_type,
            name: it.name,
            unit: it.unit || '',
            qty: it.qty,
            unit_price_net: it.unit_price_net,
            vat_rate: it.vat_rate,
          }))
        : [];

      const { error: saveErr } = await supabase.rpc('save_offer_items', {
        p_offer_id: offerId,
        p_user_id: user.id,
        p_variants: variantsPayload,
        p_items: itemsPayload,
      });
      if (saveErr) throw saveErr;

      return offerId;
    },
    onSuccess: (savedOfferId: string) => {
      queryClient.invalidateQueries({ queryKey: offersKeys.all });
      // Clear stale wizard cache so reopening the draft fetches fresh data
      // (fixes client not being hydrated on reopen — PR-009)
      queryClient.removeQueries({ queryKey: offerWizardKeys.detail(savedOfferId) });
    },
  });
}
