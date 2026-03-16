/**
 * DraftContext — continuity tests (Gate 1 Gate-blocker fix).
 *
 * Required DOD test cases:
 *   1. draft_id stable across multiple updates
 *   2. draft_id stable after transitionToFull()
 *   3. mode can only go quick → full; full → quick is forbidden
 *   4. transitionToFull preserves all Quick Mode fields verbatim
 *   5. hydration after reload restores the same draft
 *   6. OFFER_QUICK_TO_FULL fires exactly once on successful transition
 *   7. sourceContext.createdFrom remains 'quick-mode' after transition
 *   8. initDraft replaces a full-mode draft with a fresh quick-mode draft
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { DraftProvider, useDraftContext, ACTIVE_DRAFT_IDB_KEY } from './DraftContext';

// ── Mocks ──────────────────────────────────────────────────────────────────────

// idb-keyval: in-memory store
const idbStore = new Map<string, unknown>();

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => idbStore.get(key) ?? undefined),
  set: vi.fn(async (key: string, value: unknown) => { idbStore.set(key, value); }),
  del: vi.fn(async (key: string) => { idbStore.delete(key); }),
}));

// Offline queue
const mockAddEntry = vi.fn().mockResolvedValue({ id: 'q-1' });
vi.mock('@/lib/offline-queue', () => ({
  addEntry: (...args: unknown[]) => mockAddEntry(...args),
}));

// Analytics
const mockTrackEvent = vi.fn();
vi.mock('@/lib/analytics/track', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

const OWNER_ID = 'user-ctx-test';

function wrapper({ children }: { children: ReactNode }) {
  return <DraftProvider>{children}</DraftProvider>;
}

function renderDraftContext() {
  return renderHook(() => useDraftContext(), { wrapper });
}

/** Fulfils all §19.3 conditions so transitionToFull() returns true. */
async function fulfil(
  result: ReturnType<typeof renderDraftContext>['result'],
) {
  act(() => {
    result.current.initDraft(OWNER_ID);
  });
  // Wait for IDB hydration to complete and initDraft to be usable
  await waitFor(() => expect(result.current.draft).not.toBeNull());

  act(() => {
    result.current.updateClient({ tempName: 'Jan Kowalski', tempPhone: '600100200' });
  });
  act(() => {
    result.current.updateFieldCapture({ textNote: 'Wymiana instalacji elektrycznej' });
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('DraftContext', () => {
  beforeEach(() => {
    idbStore.clear();
    vi.clearAllMocks();
  });

  // ── DOD 1: draft_id stable across multiple updates ─────────────────────────

  it('draft_id is stable across multiple field updates', async () => {
    const { result } = renderDraftContext();

    act(() => { result.current.initDraft(OWNER_ID); });
    await waitFor(() => expect(result.current.draft).not.toBeNull());

    const originalId = result.current.draft!.id;

    act(() => { result.current.updateClient({ tempName: 'Anna Nowak' }); });
    expect(result.current.draft!.id).toBe(originalId);

    act(() => { result.current.updateFieldCapture({ textNote: 'Remont łazienki' }); });
    expect(result.current.draft!.id).toBe(originalId);

    act(() => { result.current.updateChecklist({ hasDocumentation: 'yes' }); });
    expect(result.current.draft!.id).toBe(originalId);

    act(() => { result.current.updatePricing({ pricingState: 'draft' }); });
    expect(result.current.draft!.id).toBe(originalId);
  });

  // ── DOD 2: draft_id stable after transitionToFull() ───────────────────────

  it('draft_id is stable after transitionToFull()', async () => {
    const { result } = renderDraftContext();
    await fulfil(result);

    const originalId = result.current.draft!.id;

    let transitioned = false;
    act(() => { transitioned = result.current.transitionToFull(); });

    expect(transitioned).toBe(true);
    expect(result.current.draft!.id).toBe(originalId);
  });

  // ── DOD 3: mode can only go quick → full ──────────────────────────────────

  it('mode transitions quick → full', async () => {
    const { result } = renderDraftContext();
    await fulfil(result);

    act(() => { result.current.transitionToFull(); });
    expect(result.current.draft!.mode).toBe('full');
  });

  it('mode cannot reverse from full back to quick', async () => {
    const { result } = renderDraftContext();
    await fulfil(result);

    act(() => { result.current.transitionToFull(); });
    expect(result.current.draft!.mode).toBe('full');

    let secondAttempt = false;
    act(() => { secondAttempt = result.current.transitionToFull(); });
    expect(secondAttempt).toBe(false);
    expect(result.current.draft!.mode).toBe('full');
  });

  // ── DOD 4: transition preserves all Quick Mode fields verbatim ────────────

  it('transitionToFull preserves all required Quick Mode fields', async () => {
    const { result } = renderDraftContext();

    act(() => { result.current.initDraft(OWNER_ID); });
    await waitFor(() => expect(result.current.draft).not.toBeNull());

    const testNote = 'Kompleksowy remont mieszkania 65m2';
    const testName = 'Tomasz Nowak';
    const testPhone = '512345678';

    act(() => {
      result.current.updateClient({ tempName: testName, tempPhone: testPhone });
    });
    act(() => {
      result.current.updateFieldCapture({ textNote: testNote });
    });
    act(() => {
      result.current.updateChecklist({ hasDocumentation: 'yes' });
    });

    act(() => { result.current.transitionToFull(); });

    const { draft } = result.current;
    expect(draft!.client.tempName).toBe(testName);
    expect(draft!.client.tempPhone).toBe(testPhone);
    expect(draft!.fieldCapture.textNote).toBe(testNote);
    expect(draft!.checklist.hasDocumentation).toBe('yes');
    expect(draft!.ownerUserId).toBe(OWNER_ID);
    expect(draft!.sourceContext.createdFrom).toBe('quick-mode');
  });

  // ── DOD 5: hydration after reload restores the same draft ─────────────────

  it('hydration from IDB restores the same draft after reload', async () => {
    // Session 1: create a draft and transition it
    const { result: session1 } = renderDraftContext();
    await fulfil(session1);
    act(() => { session1.current.transitionToFull(); });

    const draftId = session1.current.draft!.id;
    expect(session1.current.draft!.mode).toBe('full');

    // Simulate page reload: IDB has the persisted draft (set by persist())
    // The idbStore mock has the draft because set() was called during transitionToFull.
    // Render a new context instance (simulates a fresh app mount after reload).
    const { result: session2 } = renderDraftContext();

    // Wait for IDB hydration to complete
    await waitFor(() => expect(session2.current.isHydrating).toBe(false));

    // Draft should be restored from IDB
    expect(session2.current.draft).not.toBeNull();
    expect(session2.current.draft!.id).toBe(draftId);
    expect(session2.current.draft!.mode).toBe('full');
    expect(session2.current.draft!.sourceContext.createdFrom).toBe('quick-mode');
  });

  // ── DOD 6: OFFER_QUICK_TO_FULL fires exactly once ─────────────────────────

  it('OFFER_QUICK_TO_FULL fires exactly once on successful transition', async () => {
    const { result } = renderDraftContext();
    await fulfil(result);

    act(() => { result.current.transitionToFull(); });

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'offer_quick_to_full',
      expect.objectContaining({ draftId: result.current.draft!.id }),
    );
  });

  it('OFFER_QUICK_TO_FULL does NOT fire when conditions are not met', async () => {
    const { result } = renderDraftContext();

    act(() => { result.current.initDraft(OWNER_ID); });
    await waitFor(() => expect(result.current.draft).not.toBeNull());

    // No client, no context source — transition should fail
    act(() => { result.current.transitionToFull(); });

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('OFFER_QUICK_TO_FULL does NOT fire on a second call when already in full mode', async () => {
    const { result } = renderDraftContext();
    await fulfil(result);

    act(() => { result.current.transitionToFull(); });
    mockTrackEvent.mockClear();

    act(() => { result.current.transitionToFull(); }); // invalid: full → full
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  // ── DOD 7: sourceContext.createdFrom remains 'quick-mode' after transition ─

  it('sourceContext.createdFrom remains quick-mode after transitionToFull()', async () => {
    const { result } = renderDraftContext();
    await fulfil(result);

    act(() => { result.current.transitionToFull(); });

    expect(result.current.draft!.sourceContext.createdFrom).toBe('quick-mode');
    expect(result.current.draft!.mode).toBe('full');
  });

  // ── DOD 8: initDraft replaces a full-mode draft ───────────────────────────

  it('initDraft creates a new quick-mode draft when previous draft is in full mode', async () => {
    const { result } = renderDraftContext();
    await fulfil(result);

    act(() => { result.current.transitionToFull(); });
    const firstId = result.current.draft!.id;
    expect(result.current.draft!.mode).toBe('full');

    // Simulate user returning to QuickMode for a new session
    act(() => { result.current.initDraft(OWNER_ID); });

    expect(result.current.draft!.mode).toBe('quick');
    expect(result.current.draft!.id).not.toBe(firstId); // new draft_id
  });

  // ── Persistence ───────────────────────────────────────────────────────────

  it('persist() is called on updateClient', async () => {
    const { result } = renderDraftContext();

    act(() => { result.current.initDraft(OWNER_ID); });
    await waitFor(() => expect(result.current.draft).not.toBeNull());

    const callsBefore = mockAddEntry.mock.calls.length;
    act(() => { result.current.updateClient({ tempName: 'Test User' }); });

    expect(mockAddEntry.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(mockAddEntry.mock.calls[mockAddEntry.mock.calls.length - 1][0]).toBe('OFFER_DRAFT_SAVE');
  });

  it('IDB active-draft key is updated on transitionToFull', async () => {
    const { get } = await import('idb-keyval');

    const { result } = renderDraftContext();
    await fulfil(result);

    act(() => { result.current.transitionToFull(); });

    // IDB should have been called with the new full-mode draft
    await waitFor(() => {
      const stored = idbStore.get(ACTIVE_DRAFT_IDB_KEY) as { mode?: string } | undefined;
      expect(stored?.mode).toBe('full');
    });

    // Suppress unused var warning for the import
    expect(get).toBeDefined();
  });
});
