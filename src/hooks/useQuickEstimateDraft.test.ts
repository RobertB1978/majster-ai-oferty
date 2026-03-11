/**
 * Tests for useQuickEstimateDraft — draft persistence behaviour.
 *
 * Tests verify:
 *  - loadDraft returns null when no draft exists
 *  - loadDraft restores state from the backend
 *  - saveDraftNow creates a new offer record on first call
 *  - saveDraftNow sets saveStatus to error when insert fails
 *  - saveDraftNow excludes blank items from insert payload
 *  - clearDraft deletes the offer record and resets state
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ── Hoisted mock builders ─────────────────────────────────────────
 * vi.mock factories are hoisted to the top of the file by vitest,
 * so any variables they reference must be created via vi.hoisted().
 */
const { mockSupabase, builderQueue } = vi.hoisted(() => {
  /** A minimal chainable builder that resolves at configurable terminal calls. */
  function makeBuilder(opts: {
    /** resolved value for maybeSingle / single */
    terminal?: { data: unknown; error: unknown };
    /** if provided, order() itself resolves (used for list queries) */
    orderResolved?: { data: unknown; error: unknown };
    /** if provided, eq() after delete() resolves (used for deletes) */
    deleteEqResolved?: { data: unknown; error: unknown };
    /** if provided, insert() resolves directly (used for item inserts) */
    insertResolved?: { data: unknown; error: unknown };
  }) {
    const b: Record<string, unknown> = {};

    const wrap = (fn: ReturnType<typeof vi.fn>) => {
      fn.mockReturnValue(b);
      return fn;
    };

    b.select = wrap(vi.fn());
    b.update = wrap(vi.fn());
    b.limit = wrap(vi.fn());

    // eq chains OR resolves (for delete terminal)
    b.eq = vi.fn().mockImplementation(() => {
      if (opts.deleteEqResolved !== undefined) return Promise.resolve(opts.deleteEqResolved);
      return b;
    });

    // order chains OR resolves (for list queries)
    b.order = vi.fn().mockImplementation(() => {
      if (opts.orderResolved !== undefined) return Promise.resolve(opts.orderResolved);
      return b;
    });

    // insert chains OR resolves (for list inserts)
    b.insert = vi.fn().mockImplementation(() => {
      if (opts.insertResolved !== undefined) return Promise.resolve(opts.insertResolved);
      return b;
    });

    // delete always chains (terminal is eq)
    b.delete = vi.fn().mockReturnValue(b);

    // terminal methods
    b.maybeSingle = vi
      .fn()
      .mockResolvedValue(opts.terminal ?? { data: null, error: null });
    b.single = vi
      .fn()
      .mockResolvedValue(opts.terminal ?? { data: null, error: null });

    return b as {
      select: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      insert: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      eq: ReturnType<typeof vi.fn>;
      order: ReturnType<typeof vi.fn>;
      limit: ReturnType<typeof vi.fn>;
      maybeSingle: ReturnType<typeof vi.fn>;
      single: ReturnType<typeof vi.fn>;
    };
  }

  // Queue of builders — each from() call pops the next entry
  const queue: Array<ReturnType<typeof makeBuilder>> = [];

  const supabaseMock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
    },
    from: vi.fn().mockImplementation(() => {
      const b = queue.shift();
      if (!b) throw new Error('[test] No builder queued for this from() call');
      return b;
    }),
  };

  return { mockSupabase: supabaseMock, builderQueue: queue, makeBuilder };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

/* ── Hook import (after mock) ──────────────────────────────────── */
import { renderHook, act } from '@testing-library/react';
import { useQuickEstimateDraft } from './useQuickEstimateDraft';
import type { LineItem } from '@/components/quickEstimate/WorkspaceLineItems';

/* ── Helpers ───────────────────────────────────────────────────── */

// Re-export makeBuilder from hoisted scope so tests can push to queue
const { makeBuilder } = vi.hoisted(() => {
  function makeBuilder(opts: {
    terminal?: { data: unknown; error: unknown };
    orderResolved?: { data: unknown; error: unknown };
    deleteEqResolved?: { data: unknown; error: unknown };
    insertResolved?: { data: unknown; error: unknown };
  }) {
    const b: Record<string, unknown> = {};

    const wrap = (fn: ReturnType<typeof vi.fn>) => {
      fn.mockReturnValue(b);
      return fn;
    };

    b.select = wrap(vi.fn());
    b.update = wrap(vi.fn());
    b.limit = wrap(vi.fn());

    b.eq = vi.fn().mockImplementation(() => {
      if (opts.deleteEqResolved !== undefined) return Promise.resolve(opts.deleteEqResolved);
      return b;
    });

    b.order = vi.fn().mockImplementation(() => {
      if (opts.orderResolved !== undefined) return Promise.resolve(opts.orderResolved);
      return b;
    });

    b.insert = vi.fn().mockImplementation(() => {
      if (opts.insertResolved !== undefined) return Promise.resolve(opts.insertResolved);
      return b;
    });

    b.delete = vi.fn().mockReturnValue(b);

    b.maybeSingle = vi
      .fn()
      .mockResolvedValue(opts.terminal ?? { data: null, error: null });
    b.single = vi
      .fn()
      .mockResolvedValue(opts.terminal ?? { data: null, error: null });

    return b as {
      select: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      insert: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      eq: ReturnType<typeof vi.fn>;
      order: ReturnType<typeof vi.fn>;
      limit: ReturnType<typeof vi.fn>;
      maybeSingle: ReturnType<typeof vi.fn>;
      single: ReturnType<typeof vi.fn>;
    };
  }
  return { makeBuilder };
});

function makeItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: crypto.randomUUID(),
    name: 'Kafelkowanie ściany',
    qty: 10,
    unit: 'm²',
    priceMode: 'single',
    price: 50,
    laborCost: 0,
    materialCost: 0,
    marginPct: 0,
    showMargin: true,
    itemType: 'service',
    ...overrides,
  };
}

/* ── Tests ─────────────────────────────────────────────────────── */

describe('useQuickEstimateDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    builderQueue.length = 0;
    mockSupabase.from.mockImplementation(() => {
      const b = builderQueue.shift();
      if (!b) throw new Error('[test] No builder queued');
      return b;
    });
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  /* ── loadDraft ──────────────────────────────────────────────── */

  describe('loadDraft', () => {
    it('returns null when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      const { result } = renderHook(() => useQuickEstimateDraft());
      let draft: Awaited<ReturnType<typeof result.current.loadDraft>>;

      await act(async () => {
        draft = await result.current.loadDraft();
      });

      expect(draft!).toBeNull();
    });

    it('returns null when no quick-estimate draft exists', async () => {
      // from('offers') → maybeSingle resolves with null
      builderQueue.push(makeBuilder({ terminal: { data: null, error: null } }));

      const { result } = renderHook(() => useQuickEstimateDraft());
      let draft: Awaited<ReturnType<typeof result.current.loadDraft>>;

      await act(async () => {
        draft = await result.current.loadDraft();
      });

      expect(draft!).toBeNull();
    });

    it('restores full workspace state from a saved draft', async () => {
      const offerRow = { id: 'offer-abc', title: 'Remont Nowak', client_id: 'client-xyz', vat_enabled: false };
      const itemRows = [
        {
          id: 'item-1',
          name: 'Kafelkowanie',
          unit: 'm²',
          qty: 12,
          unit_price_net: 60,
          item_type: 'labor',
          metadata: { priceMode: 'split', price: 0, laborCost: 40, materialCost: 20, marginPct: 10, showMargin: false },
        },
      ];

      // from('offers') → maybeSingle resolves with offerRow
      builderQueue.push(makeBuilder({ terminal: { data: offerRow, error: null } }));
      // from('offer_items') → order resolves with itemRows
      builderQueue.push(makeBuilder({ orderResolved: { data: itemRows, error: null } }));

      const { result } = renderHook(() => useQuickEstimateDraft());
      let draft: Awaited<ReturnType<typeof result.current.loadDraft>>;

      await act(async () => {
        draft = await result.current.loadDraft();
      });

      expect(draft).not.toBeNull();
      expect(draft!.projectName).toBe('Remont Nowak');
      expect(draft!.clientId).toBe('client-xyz');
      expect(draft!.vatEnabled).toBe(false);
      expect(draft!.items).toHaveLength(1);

      const item = draft!.items[0];
      expect(item.name).toBe('Kafelkowanie');
      expect(item.priceMode).toBe('split');
      expect(item.laborCost).toBe(40);
      expect(item.materialCost).toBe(20);
      expect(item.marginPct).toBe(10);
      expect(item.showMargin).toBe(false);
    });

    it('sets draftOfferId after a successful load', async () => {
      const offerRow = { id: 'offer-abc', title: null, client_id: null, vat_enabled: true };

      builderQueue.push(makeBuilder({ terminal: { data: offerRow, error: null } }));
      builderQueue.push(makeBuilder({ orderResolved: { data: [], error: null } }));

      const { result } = renderHook(() => useQuickEstimateDraft());

      await act(async () => {
        await result.current.loadDraft();
      });

      expect(result.current.draftOfferId).toBe('offer-abc');
    });
  });

  /* ── saveDraftNow ───────────────────────────────────────────── */

  describe('saveDraftNow', () => {
    it('creates a new offer record on first save and sets saveStatus to saved', async () => {
      // from('offers').insert(...).select('id').single() → new offer
      builderQueue.push(makeBuilder({ terminal: { data: { id: 'new-offer-id' }, error: null } }));
      // from('offer_items').delete().eq(...) → success
      builderQueue.push(makeBuilder({ deleteEqResolved: { data: null, error: null } }));
      // from('offer_items').insert(...) → success
      builderQueue.push(makeBuilder({ insertResolved: { data: null, error: null } }));

      const { result } = renderHook(() => useQuickEstimateDraft());

      await act(async () => {
        await result.current.saveDraftNow({
          projectName: 'Remont łazienki',
          clientId: '',
          vatEnabled: true,
          items: [makeItem()],
        });
      });

      expect(result.current.draftOfferId).toBe('new-offer-id');
      expect(result.current.saveStatus).toBe('saved');
      expect(result.current.lastSavedAt).not.toBeNull();
    });

    it('sets saveStatus to error when offer insert fails', async () => {
      // from('offers').insert().select().single() → error
      builderQueue.push(makeBuilder({ terminal: { data: null, error: { message: 'DB error' } } }));

      const { result } = renderHook(() => useQuickEstimateDraft());

      await act(async () => {
        await result.current.saveDraftNow({
          projectName: '',
          clientId: '',
          vatEnabled: true,
          items: [],
        });
      });

      expect(result.current.saveStatus).toBe('error');
    });

    it('does not include blank items in the insert payload', async () => {
      builderQueue.push(makeBuilder({ terminal: { data: { id: 'offer-999' }, error: null } }));
      builderQueue.push(makeBuilder({ deleteEqResolved: { data: null, error: null } }));

      // Capture what gets passed to insert
      const itemInsertBuilder = makeBuilder({ insertResolved: { data: null, error: null } });
      builderQueue.push(itemInsertBuilder);

      const { result } = renderHook(() => useQuickEstimateDraft());

      const namedItem = makeItem({ name: 'Malowanie' });
      const blankItem = makeItem({ name: '' });

      await act(async () => {
        await result.current.saveDraftNow({
          projectName: 'Test',
          clientId: '',
          vatEnabled: false,
          items: [namedItem, blankItem],
        });
      });

      expect(result.current.saveStatus).toBe('saved');
      // Verify insert was called with only the named item
      const insertCall = itemInsertBuilder.insert.mock.calls[0]?.[0] as Array<{ name: string }>;
      expect(insertCall).toBeDefined();
      expect(insertCall.every((i) => i.name.trim() !== '')).toBe(true);
      expect(insertCall).toHaveLength(1);
      expect(insertCall[0].name).toBe('Malowanie');
    });
  });

  /* ── clearDraft ─────────────────────────────────────────────── */

  describe('clearDraft', () => {
    it('is a no-op when there is no draft', async () => {
      const { result } = renderHook(() => useQuickEstimateDraft());

      await act(async () => {
        await result.current.clearDraft();
      });

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('deletes the offer record and resets state', async () => {
      const offerRow = { id: 'offer-to-delete', title: null, client_id: null, vat_enabled: true };

      // loadDraft: offers + offer_items
      builderQueue.push(makeBuilder({ terminal: { data: offerRow, error: null } }));
      builderQueue.push(makeBuilder({ orderResolved: { data: [], error: null } }));

      // clearDraft: delete offers by id
      const deleteBuilder = makeBuilder({ deleteEqResolved: { data: null, error: null } });
      builderQueue.push(deleteBuilder);

      const { result } = renderHook(() => useQuickEstimateDraft());

      await act(async () => { await result.current.loadDraft(); });
      expect(result.current.draftOfferId).toBe('offer-to-delete');

      await act(async () => { await result.current.clearDraft(); });

      expect(deleteBuilder.delete).toHaveBeenCalled();
      expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'offer-to-delete');
      expect(result.current.draftOfferId).toBeNull();
      expect(result.current.saveStatus).toBe('idle');
      expect(result.current.lastSavedAt).toBeNull();
    });
  });
});
