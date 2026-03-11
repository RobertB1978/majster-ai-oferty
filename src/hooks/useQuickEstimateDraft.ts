/**
 * useQuickEstimateDraft — persistent draft for QuickEstimateWorkspace
 *
 * Saves the in-progress estimate to the `offers` + `offer_items` tables
 * with status='DRAFT' and source='quick_estimate'. On page reload the
 * hook restores the full workspace state, so the user never loses work.
 *
 * Usage pattern:
 *   const { loadDraft, scheduleSave, clearDraft, draftOfferId, lastSavedAt, saveStatus } =
 *     useQuickEstimateDraft();
 *
 *   // On mount — restore draft if one exists
 *   useEffect(() => { loadDraft().then(draft => { if (draft) restoreState(draft); }); }, []);
 *
 *   // Auto-save on every state change (debounced 2 s)
 *   useEffect(() => { scheduleSave({ projectName, clientId, vatEnabled, items }); }, [state]);
 *
 *   // After final save to projects — remove the draft
 *   await clearDraft();
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { itemUnitPrice, itemLineTotal, calcTotals } from '@/lib/estimateCalc';
import type { LineItem } from '@/components/quickEstimate/WorkspaceLineItems';

/* ── Types ────────────────────────────────────────────────────── */

export interface QuickEstimateData {
  projectName: string;
  clientId: string;
  vatEnabled: boolean;
  items: LineItem[];
}

export type DraftSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface LineItemMetadata {
  priceMode: 'single' | 'split';
  price: number;
  laborCost: number;
  materialCost: number;
  marginPct: number;
  showMargin: boolean;
}

/* ── Constants ────────────────────────────────────────────────── */

const DEBOUNCE_MS = 2000;
const DRAFT_SOURCE = 'quick_estimate';

/* ── Hook ─────────────────────────────────────────────────────── */

export function useQuickEstimateDraft() {
  const [draftOfferId, setDraftOfferId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>('idle');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref so saveDraftNow can always read the latest id without closure staleness
  const draftOfferIdRef = useRef<string | null>(null);
  useEffect(() => { draftOfferIdRef.current = draftOfferId; }, [draftOfferId]);

  /* ── Load ──────────────────────────────────────────────────── */

  /**
   * Looks for the most recently updated DRAFT offer created by Quick Estimate
   * for the current user. Returns the restored workspace state, or null if no
   * draft exists.
   */
  const loadDraft = useCallback(async (): Promise<QuickEstimateData | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch latest quick-estimate draft for this user
    const { data: offer, error: offerErr } = await (supabase
      .from('offers')
      .select('id, title, client_id, vat_enabled')
      .eq('status', 'DRAFT')
      .eq('source' as never, DRAFT_SOURCE)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{
        data: {
          id: string;
          title: string | null;
          client_id: string | null;
          vat_enabled: boolean | null;
        } | null;
        error: unknown;
      }>);

    if (offerErr || !offer) return null;

    // Fetch associated items
    const { data: rawItems, error: itemsErr } = await supabase
      .from('offer_items')
      .select('id, name, unit, qty, unit_price_net, item_type, metadata')
      .eq('offer_id', offer.id)
      .order('created_at', { ascending: true });

    if (itemsErr) return null;

    setDraftOfferId(offer.id);

    const items: LineItem[] = (rawItems ?? []).map((row) => {
      const meta = (row.metadata as LineItemMetadata | null) ?? null;
      return {
        id: row.id,
        name: row.name,
        qty: Number(row.qty),
        unit: row.unit ?? 'szt',
        priceMode: meta?.priceMode ?? 'single',
        price: meta?.price ?? Number(row.unit_price_net),
        laborCost: meta?.laborCost ?? 0,
        materialCost: meta?.materialCost ?? 0,
        marginPct: meta?.marginPct ?? 0,
        showMargin: meta?.showMargin ?? true,
        itemType: (row.item_type as LineItem['itemType']) ?? 'service',
      };
    });

    return {
      projectName: offer.title ?? '',
      clientId: offer.client_id ?? '',
      vatEnabled: offer.vat_enabled ?? true,
      items,
    };
  }, []);

  /* ── Save (immediate) ─────────────────────────────────────── */

  /**
   * Persists the current workspace state to the backend immediately.
   * Creates a new DRAFT offer on first call; updates it on subsequent calls.
   * Replaces all offer_items on each save (simple and correct for drafts).
   */
  const saveDraftNow = useCallback(async (data: QuickEstimateData): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaveStatus('saving');

    try {
      const { netTotal, vatAmount, grossTotal } = calcTotals(data.items, data.vatEnabled);

      let currentId = draftOfferIdRef.current;

      if (!currentId) {
        // First save — create the DRAFT offer record
        const { data: offer, error: insertErr } = await (supabase
          .from('offers')
          .insert({
            user_id: user.id,
            status: 'DRAFT',
            source: DRAFT_SOURCE,
            title: data.projectName.trim() || null,
            client_id: data.clientId || null,
            vat_enabled: data.vatEnabled,
            total_net: netTotal,
            total_gross: grossTotal,
            total_vat: vatAmount,
          } as never)
          .select('id')
          .single() as unknown as Promise<{ data: { id: string } | null; error: unknown }>);

        if (insertErr || !offer) throw insertErr ?? new Error('Insert returned no data');
        currentId = offer.id;
        setDraftOfferId(offer.id);
      } else {
        // Subsequent save — update existing DRAFT offer
        const { error: updateErr } = await (supabase
          .from('offers')
          .update({
            title: data.projectName.trim() || null,
            client_id: data.clientId || null,
            vat_enabled: data.vatEnabled,
            total_net: netTotal,
            total_gross: grossTotal,
            total_vat: vatAmount,
          } as never)
          .eq('id', currentId) as unknown as Promise<{ error: unknown }>);

        if (updateErr) throw updateErr;
      }

      // Replace all line items (delete + insert is simplest and safe for DRAFT)
      await supabase.from('offer_items').delete().eq('offer_id', currentId);

      const validItems = data.items.filter((i) => i.name.trim());
      if (validItems.length > 0) {
        const { error: itemsErr } = await (supabase.from('offer_items').insert(
          validItems.map((item) => ({
            user_id: user.id,
            offer_id: currentId,
            name: item.name,
            unit: item.unit,
            qty: item.qty,
            item_type: item.itemType,
            unit_price_net: itemUnitPrice(item),
            line_total_net: itemLineTotal(item),
            vat_rate: data.vatEnabled ? 23 : null,
            metadata: {
              priceMode: item.priceMode,
              price: item.price,
              laborCost: item.laborCost,
              materialCost: item.materialCost,
              marginPct: item.marginPct,
              showMargin: item.showMargin,
            } satisfies LineItemMetadata,
          })),
        ) as unknown as Promise<{ error: unknown }>);

        if (itemsErr) throw itemsErr;
      }

      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch {
      setSaveStatus('error');
    }
  }, []);

  /* ── Schedule (debounced) ─────────────────────────────────── */

  /**
   * Schedules a save after DEBOUNCE_MS milliseconds of inactivity.
   * Previous pending saves are cancelled when called again.
   */
  const scheduleSave = useCallback(
    (data: QuickEstimateData) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void saveDraftNow(data);
      }, DEBOUNCE_MS);
    },
    [saveDraftNow],
  );

  /* ── Clear ────────────────────────────────────────────────── */

  /**
   * Deletes the DRAFT offer record (and its items via ON DELETE CASCADE)
   * after the user has successfully finalized the estimate.
   */
  const clearDraft = useCallback(async (): Promise<void> => {
    const id = draftOfferIdRef.current;
    if (!id) return;
    // offer_items are deleted via ON DELETE CASCADE on offers.id
    await supabase.from('offers').delete().eq('id', id);
    setDraftOfferId(null);
    setSaveStatus('idle');
    setLastSavedAt(null);
  }, []);

  /* ── Cleanup debounce on unmount ─────────────────────────── */

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    loadDraft,
    scheduleSave,
    saveDraftNow,
    clearDraft,
    draftOfferId,
    lastSavedAt,
    saveStatus,
  };
}
