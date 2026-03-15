/**
 * Unit tests for useDraft — Gate 1 Condition 2.
 *
 * Required DOD test cases:
 *   1. draft_id stable across multiple updates
 *   2. draft_id stable after transitionToFull()
 *   3. mode cannot reverse full → quick
 *   4. canTransitionToFull false when any required condition is missing
 *   5. canTransitionToFull true when all 4 conditions are met
 *   6. missingTransitionFields returns meaningful missing fields
 *   7. sourceContext.createdFrom remains 'quick-mode' after transition
 *   8. offline persistence is invoked on field updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraft } from './useDraft';

// ── Mock: offline queue ───────────────────────────────────────────────────────

const mockAddEntry = vi.fn().mockResolvedValue({ id: 'queue-entry-1' });

vi.mock('@/lib/offline-queue', () => ({
  addEntry: (...args: unknown[]) => mockAddEntry(...args),
}));

// ── Mock: analytics ───────────────────────────────────────────────────────────

const mockTrackEvent = vi.fn();

vi.mock('@/lib/analytics/track', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const OWNER_ID = 'user-test-123';

/** Returns a renderHook result for useDraft with a fresh ownerUserId. */
function renderDraftHook(ownerUserId = OWNER_ID) {
  return renderHook(() => useDraft(ownerUserId));
}

/**
 * Applies all field updates required to satisfy the 4 §19.3 conditions:
 *   1. draft_id — exists from init
 *   2. ownerUserId — assigned from init
 *   3. client — tempName + tempPhone
 *   4. fieldCapture — textNote present
 */
function fulfillTransitionConditions(
  result: ReturnType<typeof renderDraftHook>['result'],
): void {
  act(() => {
    result.current.updateClient({ tempName: 'Jan Kowalski', tempPhone: '600100200' });
  });
  act(() => {
    result.current.updateFieldCapture({ textNote: 'Wymiana instalacji elektrycznej' });
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── DOD 1: draft_id stable across multiple updates ─────────────────────────

  it('draft_id is stable across multiple field updates', () => {
    const { result } = renderDraftHook();
    const originalId = result.current.draft.id;

    act(() => {
      result.current.updateClient({ tempName: 'Anna Nowak' });
    });
    expect(result.current.draft.id).toBe(originalId);

    act(() => {
      result.current.updateFieldCapture({ textNote: 'Remont łazienki' });
    });
    expect(result.current.draft.id).toBe(originalId);

    act(() => {
      result.current.updateChecklist({ hasDocumentation: 'yes' });
    });
    expect(result.current.draft.id).toBe(originalId);

    act(() => {
      result.current.updatePricing({ pricingState: 'draft' });
    });
    expect(result.current.draft.id).toBe(originalId);
  });

  // ── DOD 2: draft_id stable after transitionToFull() ───────────────────────

  it('draft_id is stable after transitionToFull()', () => {
    const { result } = renderDraftHook();
    const originalId = result.current.draft.id;

    fulfillTransitionConditions(result);

    let transitioned = false;
    act(() => {
      transitioned = result.current.transitionToFull();
    });

    expect(transitioned).toBe(true);
    expect(result.current.draft.id).toBe(originalId);
  });

  // ── DOD 3: mode cannot reverse full → quick ────────────────────────────────

  it('mode cannot reverse from full back to quick', () => {
    const { result } = renderDraftHook();

    fulfillTransitionConditions(result);

    // First transition: quick → full
    act(() => {
      result.current.transitionToFull();
    });
    expect(result.current.draft.mode).toBe('full');

    // Attempt to call transitionToFull again (full → full is invalid direction)
    let secondAttempt = false;
    act(() => {
      secondAttempt = result.current.transitionToFull();
    });
    expect(secondAttempt).toBe(false);
    expect(result.current.draft.mode).toBe('full');
  });

  // ── DOD 4: canTransitionToFull false when any condition is missing ─────────

  it('canTransitionToFull is false when client is not identified', () => {
    const { result } = renderDraftHook();

    // Provide context source but no client
    act(() => {
      result.current.updateFieldCapture({ textNote: 'Docieplenie ścian zewnętrznych' });
    });

    expect(result.current.canTransitionToFull).toBe(false);
    expect(result.current.missingTransitionFields).toContain('client_identified');
  });

  it('canTransitionToFull is false when no context source is present', () => {
    const { result } = renderDraftHook();

    // Identify client but provide no context source
    act(() => {
      result.current.updateClient({ tempName: 'Piotr Wiśniewski', tempPhone: '500200300' });
    });

    expect(result.current.canTransitionToFull).toBe(false);
    expect(result.current.missingTransitionFields).toContain('min_context_source_present');
  });

  it('canTransitionToFull is false on fresh (empty) draft', () => {
    const { result } = renderDraftHook();

    expect(result.current.canTransitionToFull).toBe(false);
    // At minimum client_identified and min_context_source_present must be missing
    expect(result.current.missingTransitionFields.length).toBeGreaterThanOrEqual(2);
  });

  // ── DOD 5: canTransitionToFull true when all 4 conditions are met ──────────

  it('canTransitionToFull is true when all 4 §19.3 conditions are met', () => {
    const { result } = renderDraftHook();

    fulfillTransitionConditions(result);

    expect(result.current.canTransitionToFull).toBe(true);
    expect(result.current.missingTransitionFields).toHaveLength(0);
  });

  it('canTransitionToFull is true when client is identified via existing id', () => {
    const { result } = renderDraftHook();

    act(() => {
      result.current.updateClient({ id: 'existing-client-uuid' });
    });
    act(() => {
      result.current.updateFieldCapture({ textNote: 'Malowanie sufitu' });
    });

    expect(result.current.canTransitionToFull).toBe(true);
  });

  it('canTransitionToFull is true when context comes from a photo', () => {
    const { result } = renderDraftHook();

    act(() => {
      result.current.updateClient({ tempName: 'Maria Zielińska', tempEmail: 'maria@example.pl' });
    });
    act(() => {
      result.current.updateFieldCapture({
        photos: [{ id: 'photo-1', storagePath: 'uploads/p1.jpg', localQueueId: null, caption: null, category: null }],
      });
    });

    expect(result.current.canTransitionToFull).toBe(true);
  });

  // ── DOD 6: missingTransitionFields returns meaningful fields ───────────────

  it('missingTransitionFields lists all failing conditions on empty draft', () => {
    const { result } = renderDraftHook();

    const missing = result.current.missingTransitionFields;

    // draft_id and ownerUserId are set from init, so they must NOT be missing
    expect(missing).not.toContain('draft_id_exists');
    expect(missing).not.toContain('owner_user_id_assigned');

    // client and context are not yet set
    expect(missing).toContain('client_identified');
    expect(missing).toContain('min_context_source_present');
  });

  it('missingTransitionFields is empty after all conditions are satisfied', () => {
    const { result } = renderDraftHook();

    fulfillTransitionConditions(result);

    expect(result.current.missingTransitionFields).toHaveLength(0);
  });

  // ── DOD 7: sourceContext.createdFrom remains 'quick-mode' after transition ──

  it('sourceContext.createdFrom remains quick-mode after transitionToFull()', () => {
    const { result } = renderDraftHook();

    fulfillTransitionConditions(result);

    act(() => {
      result.current.transitionToFull();
    });

    expect(result.current.draft.sourceContext.createdFrom).toBe('quick-mode');
    expect(result.current.draft.mode).toBe('full');
  });

  // ── DOD 8: offline persistence is invoked on field updates ─────────────────

  it('updateClient invokes addEntry with OFFER_DRAFT_SAVE', () => {
    const { result } = renderDraftHook();

    act(() => {
      result.current.updateClient({ tempName: 'Zbigniew Kowal' });
    });

    expect(mockAddEntry).toHaveBeenCalledWith(
      'OFFER_DRAFT_SAVE',
      expect.objectContaining({ draftId: result.current.draft.id }),
    );
  });

  it('updateFieldCapture invokes addEntry with OFFER_DRAFT_SAVE', () => {
    const { result } = renderDraftHook();

    act(() => {
      result.current.updateFieldCapture({ textNote: 'Wymiana okien PCV' });
    });

    expect(mockAddEntry).toHaveBeenCalledWith(
      'OFFER_DRAFT_SAVE',
      expect.objectContaining({ draftId: result.current.draft.id }),
    );
  });

  it('updateChecklist invokes addEntry with OFFER_DRAFT_SAVE', () => {
    const { result } = renderDraftHook();

    act(() => {
      result.current.updateChecklist({ hasDocumentation: 'no' });
    });

    expect(mockAddEntry).toHaveBeenCalledWith(
      'OFFER_DRAFT_SAVE',
      expect.objectContaining({ draftId: result.current.draft.id }),
    );
  });

  it('updatePricing invokes addEntry with OFFER_DRAFT_SAVE', () => {
    const { result } = renderDraftHook();

    act(() => {
      result.current.updatePricing({ pricingState: 'draft' });
    });

    expect(mockAddEntry).toHaveBeenCalledWith(
      'OFFER_DRAFT_SAVE',
      expect.objectContaining({ draftId: result.current.draft.id }),
    );
  });

  it('transitionToFull invokes addEntry with OFFER_DRAFT_SAVE on success', () => {
    const { result } = renderDraftHook();

    fulfillTransitionConditions(result);
    const callsBeforeTransition = mockAddEntry.mock.calls.length;

    act(() => {
      result.current.transitionToFull();
    });

    expect(mockAddEntry.mock.calls.length).toBeGreaterThan(callsBeforeTransition);
    const lastCall = mockAddEntry.mock.calls[mockAddEntry.mock.calls.length - 1];
    expect(lastCall[0]).toBe('OFFER_DRAFT_SAVE');
    expect(lastCall[1]).toMatchObject({ draftId: result.current.draft.id });
  });

  // ── Analytics event ────────────────────────────────────────────────────────

  it('OFFER_QUICK_TO_FULL fires after successful transition', () => {
    const { result } = renderDraftHook();

    fulfillTransitionConditions(result);

    act(() => {
      result.current.transitionToFull();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'offer_quick_to_full',
      expect.objectContaining({ draftId: result.current.draft.id }),
    );
  });

  it('OFFER_QUICK_TO_FULL does NOT fire when transition conditions are not met', () => {
    const { result } = renderDraftHook();

    // No client, no context — conditions not met
    act(() => {
      result.current.transitionToFull();
    });

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('OFFER_QUICK_TO_FULL does NOT fire on a second call when already in full mode', () => {
    const { result } = renderDraftHook();

    fulfillTransitionConditions(result);

    act(() => {
      result.current.transitionToFull();
    });
    mockTrackEvent.mockClear();

    act(() => {
      result.current.transitionToFull(); // invalid: full → full
    });

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  // ── Preservation of all quick-mode data ───────────────────────────────────

  it('transitionToFull preserves all prior quick-mode data', () => {
    const { result } = renderDraftHook();

    const testNote = 'Kompleksowy remont mieszkania 65m2';
    const testClientName = 'Tomasz Nowak';

    act(() => {
      result.current.updateClient({ tempName: testClientName, tempPhone: '512345678' });
    });
    act(() => {
      result.current.updateFieldCapture({ textNote: testNote });
    });

    act(() => {
      result.current.transitionToFull();
    });

    const { draft } = result.current;
    expect(draft.client.tempName).toBe(testClientName);
    expect(draft.fieldCapture.textNote).toBe(testNote);
    expect(draft.ownerUserId).toBe(OWNER_ID);
    expect(draft.status).toBe('draft');
    expect(draft.pricing.currency).toBe('PLN');
  });
});
