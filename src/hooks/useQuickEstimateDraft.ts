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
import { parseJsonColumn, withExtraColumns, typedResult, typedMutationResult } from '@/lib/supabaseTypeUtils';

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
  // Track in-flight save so concurrent calls (debounce + manual, or debounce + promote) don't race
  const saveInFlightRef = useRef<Promise<void> | null>(null);

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
    // Note: `source` and `vat_enabled` columns exist in DB but are missing from
    // generated Supabase types. typedResult + `as never` on .eq bridge the gap.
    const { data: offer, error: offerErr } = await typedResult<{
      id: string;
      title: string | null;
      client_id: string | null;
      vat_enabled: boolean | null;
    } | null>(
      supabase
        .from('offers')
        .select('id, title, client_id, vat_enabled')
        .eq('status', 'DRAFT')
        .eq('source' as never, DRAFT_SOURCE)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    );

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
      // `metadata` is a JSONB column that exists in DB but not in generated types
      const rawRow = row as typeof row & { metadata?: unknown };
      const meta = parseJsonColumn<LineItemMetadata | null>(rawRow.metadata as import('@/integrations/supabase/types').Json | undefined, null);
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
    // Skip if a save is already in flight — prevents duplicate DRAFT inserts and
    // item-level write conflicts when scheduleSave and manual save overlap.
    if (saveInFlightRef.current !== null) return;

    const runSave = async (): Promise<void> => {
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
          // `source` and `vat_enabled` exist in DB but not in generated types
          const { data: offer, error: insertErr } = await typedResult<{ id: string } | null>(
            supabase
              .from('offers')
              .insert(withExtraColumns({
                user_id: user.id,
                status: 'DRAFT',
                title: data.projectName.trim() || null,
                client_id: data.clientId || null,
                total_net: netTotal,
                total_gross: grossTotal,
                total_vat: vatAmount,
              }, { source: DRAFT_SOURCE, vat_enabled: data.vatEnabled }))
              .select('id')
              .single(),
          );

          if (insertErr || !offer) throw insertErr ?? new Error('Insert returned no data');
          currentId = offer.id;
          setDraftOfferId(offer.id);
        } else {
          // Subsequent save — update existing DRAFT offer
          // `vat_enabled` exists in DB but not in generated types
          const { error: updateErr } = await typedMutationResult(
            supabase
              .from('offers')
              .update(withExtraColumns({
                title: data.projectName.trim() || null,
                client_id: data.clientId || null,
                total_net: netTotal,
                total_gross: grossTotal,
                total_vat: vatAmount,
              }, { vat_enabled: data.vatEnabled }))
              .eq('id', currentId),
          );

          if (updateErr) throw updateErr;
        }

        // Replace all line items (delete + insert is simplest and safe for DRAFT)
        await supabase.from('offer_items').delete().eq('offer_id', currentId);

        const validItems = data.items.filter((i) => i.name.trim());
        if (validItems.length > 0) {
          // `metadata` column exists in DB but not in generated types
          const { error: itemsErr } = await typedMutationResult(
            supabase.from('offer_items').insert(
              validItems.map((item) => withExtraColumns({
                user_id: user.id,
                offer_id: currentId!,
                name: item.name,
                unit: item.unit,
                qty: item.qty,
                item_type: item.itemType,
                unit_price_net: itemUnitPrice(item),
                line_total_net: itemLineTotal(item),
                vat_rate: data.vatEnabled ? 23 : null,
              }, {
                metadata: {
                  priceMode: item.priceMode,
                  price: item.price,
                  laborCost: item.laborCost,
                  materialCost: item.materialCost,
                  marginPct: item.marginPct,
                  showMargin: item.showMargin,
                } satisfies LineItemMetadata,
              })),
            ),
          );

          if (itemsErr) throw itemsErr;
        }

        setSaveStatus('saved');
        setLastSavedAt(new Date());
      } catch {
        setSaveStatus('error');
      }
    }; // end runSave

    saveInFlightRef.current = runSave();
    try {
      await saveInFlightRef.current;
    } finally {
      saveInFlightRef.current = null;
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

  /* ── Promote draft to SENT (finalize) ─────────────────────── */

  /**
   * Promotes the current DRAFT offer to 'SENT' status, finalizing
   * offer_items with the provided data.
   * If no draft exists yet, creates a new SENT offer with items.
   * Cancels any pending debounced auto-save and resets local draft state
   * WITHOUT deleting the DB record — the offer is kept as SENT.
   *
   * Returns the finalized offer id and net total for the caller
   * (needed to link and budget a v2_project).
   */
  const promoteDraft = useCallback(async (
    data: QuickEstimateData,
  ): Promise<{ offerId: string; netTotal: number }> => {
    // Cancel any pending debounced auto-save so it cannot race with promotion
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // If an auto-save fired just before the debounce was cancelled, wait for it
    // to finish before writing — prevents item-list corruption from interleaved
    // delete+insert sequences on the same offer_items rows.
    if (saveInFlightRef.current) await saveInFlightRef.current;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { netTotal, vatAmount, grossTotal } = calcTotals(data.items, data.vatEnabled);
    let offerId = draftOfferIdRef.current;

    if (offerId) {
      // Promote existing DRAFT offer to SENT with final values
      // `vat_enabled` exists in DB but not in generated types
      const { error: updateErr } = await typedMutationResult(
        supabase
          .from('offers')
          .update(withExtraColumns({
            status: 'SENT',
            title: data.projectName.trim() || null,
            client_id: data.clientId || null,
            total_net: netTotal,
            total_gross: grossTotal,
            total_vat: vatAmount,
          }, { vat_enabled: data.vatEnabled }))
          .eq('id', offerId),
      );
      if (updateErr) throw updateErr;
    } else {
      // No draft yet — create a new SENT offer directly
      // `source` and `vat_enabled` exist in DB but not in generated types
      const { data: offer, error: insertErr } = await typedResult<{ id: string } | null>(
        supabase
          .from('offers')
          .insert(withExtraColumns({
            user_id: user.id,
            status: 'SENT',
            title: data.projectName.trim() || null,
            client_id: data.clientId || null,
            total_net: netTotal,
            total_gross: grossTotal,
            total_vat: vatAmount,
          }, { source: DRAFT_SOURCE, vat_enabled: data.vatEnabled }))
          .select('id')
          .single(),
      );

      if (insertErr || !offer) throw insertErr ?? new Error('Insert returned no data');
      offerId = offer.id;
    }

    // Replace offer_items with the final validated set
    await supabase.from('offer_items').delete().eq('offer_id', offerId);

    const validItems = data.items.filter((i) => i.name.trim());
    if (validItems.length > 0) {
      // `metadata` column exists in DB but not in generated types
      const { error: itemsErr } = await typedMutationResult(
        supabase.from('offer_items').insert(
          validItems.map((item) => withExtraColumns({
            user_id: user.id,
            offer_id: offerId!,
            name: item.name,
            unit: item.unit,
            qty: item.qty,
            item_type: item.itemType,
            unit_price_net: itemUnitPrice(item),
            line_total_net: itemLineTotal(item),
            vat_rate: data.vatEnabled ? 23 : null,
          }, {
            metadata: {
              priceMode: item.priceMode,
              price: item.price,
              laborCost: item.laborCost,
              materialCost: item.materialCost,
              marginPct: item.marginPct,
              showMargin: item.showMargin,
            } satisfies LineItemMetadata,
          })),
        ),
      );
      if (itemsErr) throw itemsErr;
    }

    // Reset local draft state — offer is kept as SENT, not deleted
    draftOfferIdRef.current = null;
    setDraftOfferId(null);
    setSaveStatus('idle');
    setLastSavedAt(null);

    return { offerId: offerId!, netTotal };
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
    promoteDraft,
    draftOfferId,
    lastSavedAt,
    saveStatus,
  };
}
