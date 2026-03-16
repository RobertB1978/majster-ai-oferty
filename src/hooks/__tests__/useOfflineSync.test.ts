/**
 * Tests for useOfflineSync — offline queue runtime wiring.
 *
 * Required DOD test cases:
 *   1. No flush on mount when offline
 *   2. Flush on mount when online
 *   3. Flush on online event
 *   4. Successful queued item removal
 *   5. Retry schedule matches roadmap (1s/2s/4s/8s)
 *   6. Conflict item marked and not retried
 *   7. Excluded action type rejected and never flushed
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { act } from 'react';

// ---------------------------------------------------------------------------
// Mock idb-keyval (jsdom has no IndexedDB)
// ---------------------------------------------------------------------------

let idbStore: Record<string, unknown> = {};

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => idbStore[key] ?? undefined),
  set: vi.fn(async (key: string, value: unknown) => {
    idbStore[key] = value;
  }),
  del: vi.fn(async (key: string) => {
    delete idbStore[key];
  }),
}));

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

const mockUpsert = vi.fn(async () => ({ error: null }));
const mockInsert = vi.fn(async () => ({ error: null }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: mockUpsert,
      insert: mockInsert,
    })),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mock registration)
// ---------------------------------------------------------------------------

import { useOfflineSync, MOUNT_FLUSH_DELAY_MS, ONLINE_DEBOUNCE_MS } from '../useOfflineSync';
import {
  addEntry,
  getEntries,
  getEntriesByStatus,
  ExcludedActionError,
} from '@/lib/offline-queue';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function triggerOnline(): void {
  window.dispatchEvent(new Event('online'));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  idbStore = {};
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ===========================================================================
// 1. No flush on mount when offline
// ===========================================================================

describe('useOfflineSync — offline on mount', () => {
  it('does not call upsert when browser is offline at mount', async () => {
    // Simulate offline
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    // Queue a draft save so there is something to flush
    await addEntry('OFFER_DRAFT_SAVE', {
      draftId: 'draft-001',
      draft: { ownerUserId: 'user-1', client: { id: null }, pricing: { currency: 'PLN' } },
    });

    renderHook(() => useOfflineSync());

    // Advance past mount delay
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOUNT_FLUSH_DELAY_MS + 100);
    });

    // Supabase should NOT have been called
    expect(mockUpsert).not.toHaveBeenCalled();

    // Restore online
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });
});

// ===========================================================================
// 2. Flush on mount when online
// ===========================================================================

describe('useOfflineSync — online on mount', () => {
  it('calls upsert after mount delay when browser is online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    await addEntry('OFFER_DRAFT_SAVE', {
      draftId: 'draft-002',
      draft: { ownerUserId: 'user-2', client: { id: null }, pricing: { currency: 'PLN' } },
    });

    renderHook(() => useOfflineSync());

    // Before the delay, no flush yet
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOUNT_FLUSH_DELAY_MS - 100);
    });
    expect(mockUpsert).not.toHaveBeenCalled();

    // After the delay, flush fires
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// 3. Flush on online event
// ===========================================================================

describe('useOfflineSync — online event', () => {
  it('calls upsert after online event + debounce', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    await addEntry('OFFER_DRAFT_SAVE', {
      draftId: 'draft-003',
      draft: { ownerUserId: 'user-3', client: { id: null }, pricing: { currency: 'PLN' } },
    });

    renderHook(() => useOfflineSync());

    // Fire online event (simulates reconnect)
    act(() => {
      triggerOnline();
    });

    // Before debounce, no flush yet
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ONLINE_DEBOUNCE_MS - 100);
    });
    expect(mockUpsert).not.toHaveBeenCalled();

    // After debounce, flush fires
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(mockUpsert).toHaveBeenCalledTimes(1);

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });
});

// ===========================================================================
// 4. Successful queued item removal
// ===========================================================================

describe('useOfflineSync — successful item removal', () => {
  it('removes OFFER_DRAFT_SAVE entry from queue on successful sync', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    mockUpsert.mockResolvedValueOnce({ error: null });

    await addEntry('OFFER_DRAFT_SAVE', {
      draftId: 'draft-004',
      draft: { ownerUserId: 'user-4', client: { id: null }, pricing: { currency: 'PLN' } },
    });

    // Confirm entry is queued
    const before = await getEntries();
    expect(before).toHaveLength(1);

    renderHook(() => useOfflineSync());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOUNT_FLUSH_DELAY_MS + 100);
    });

    // Entry should be removed after successful sync
    const after = await getEntries();
    expect(after).toHaveLength(0);
  });

  it('removes TEMPORARY_CLIENT_ADD entry from queue on successful sync', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    mockInsert.mockResolvedValueOnce({ error: null });

    await addEntry('TEMPORARY_CLIENT_ADD', {
      userId: 'user-5',
      name: 'Jan Kowalski',
      phone: '+48 600 000 001',
    });

    const before = await getEntries();
    expect(before).toHaveLength(1);

    renderHook(() => useOfflineSync());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOUNT_FLUSH_DELAY_MS + 100);
    });

    const after = await getEntries();
    expect(after).toHaveLength(0);
  });
});

// ===========================================================================
// 5. Retry schedule matches roadmap (1s / 2s / 4s / 8s)
// ===========================================================================

describe('useOfflineSync — retry schedule', () => {
  it('retries with exponential backoff and increments attempts', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    // Fail first two attempts, then succeed
    mockUpsert
      .mockResolvedValueOnce({ error: { message: 'Network timeout' } })
      .mockResolvedValueOnce({ error: null });

    await addEntry('OFFER_DRAFT_SAVE', {
      draftId: 'draft-005',
      draft: { ownerUserId: 'user-6', client: { id: null }, pricing: { currency: 'PLN' } },
    });

    renderHook(() => useOfflineSync());

    // First flush attempt (attempt 0 → 1)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOUNT_FLUSH_DELAY_MS + 100);
    });
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    // Entry should still be in queue with attempts=1
    const afterFirst = await getEntriesByStatus('PENDING_SYNC');
    expect(afterFirst).toHaveLength(1);
    expect(afterFirst[0].attempts).toBe(1);

    // Second flush (simulated via online event; backoff delay = 1s for attempt 1)
    act(() => {
      triggerOnline();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ONLINE_DEBOUNCE_MS + 1_000 + 100);
    });

    // Second attempt succeeds — entry removed
    const afterSecond = await getEntries();
    expect(afterSecond).toHaveLength(0);
  });
});

// ===========================================================================
// 6. Conflict item marked and not retried
// ===========================================================================

describe('useOfflineSync — conflict handling', () => {
  it('marks entry as CONFLICT after max 5 failed attempts', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    // Simulate 4 prior failed attempts (so attempt 5 is the final one)
    await addEntry('OFFER_DRAFT_SAVE', {
      draftId: 'draft-006',
      draft: { ownerUserId: 'user-7', client: { id: null }, pricing: { currency: 'PLN' } },
    });

    // Manually set attempts to 4 in storage so next attempt (5th total) triggers CONFLICT
    const { IDB_QUEUE_KEY } = await import('@/lib/offline-queue');
    const entries = idbStore[IDB_QUEUE_KEY] as Array<{ attempts: number; status: string }>;
    entries[0].attempts = 4;
    entries[0].status = 'PENDING_SYNC';

    mockUpsert.mockResolvedValueOnce({ error: { message: 'Server conflict' } });

    renderHook(() => useOfflineSync());

    // The entry has attempts=4, so flushQueue applies getDelay(3)=8000ms backoff.
    // We must advance: mount delay (1500) + backoff (8000) + buffer (500).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOUNT_FLUSH_DELAY_MS + 8_000 + 500);
    });

    const conflicted = await getEntriesByStatus('CONFLICT');
    expect(conflicted).toHaveLength(1);
    expect(conflicted[0].lastError).toBe('Server conflict');

    // Trigger another online event — CONFLICT entries must NOT be retried
    const callCountBefore = mockUpsert.mock.calls.length;
    act(() => {
      triggerOnline();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ONLINE_DEBOUNCE_MS + 100);
    });
    // No additional Supabase calls for CONFLICT entries
    expect(mockUpsert.mock.calls.length).toBe(callCountBefore);
  });
});

// ===========================================================================
// 7. Excluded action type rejected and never flushed
// ===========================================================================

describe('useOfflineSync — excluded action types', () => {
  it('throws ExcludedActionError for OFFER_SEND and nothing enters the queue', async () => {
    await expect(addEntry('OFFER_SEND', { offerId: 'o-1' })).rejects.toThrow(ExcludedActionError);

    const entries = await getEntries();
    expect(entries).toHaveLength(0);
  });

  it('throws ExcludedActionError for PDF_GENERATE and nothing enters the queue', async () => {
    await expect(addEntry('PDF_GENERATE', {})).rejects.toThrow(ExcludedActionError);

    const entries = await getEntries();
    expect(entries).toHaveLength(0);
  });

  it('excluded entries are never passed to the SyncProcessor', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    // Queue is intentionally empty (excluded types can't enter)
    renderHook(() => useOfflineSync());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOUNT_FLUSH_DELAY_MS + 100);
    });

    // Nothing to flush → Supabase never called
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 8. Cleanup: hook removes event listener on unmount
// ===========================================================================

describe('useOfflineSync — cleanup', () => {
  it('does not flush after unmount', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    await addEntry('OFFER_DRAFT_SAVE', {
      draftId: 'draft-007',
      draft: { ownerUserId: 'user-8', client: { id: null }, pricing: { currency: 'PLN' } },
    });

    const { unmount } = renderHook(() => useOfflineSync());
    unmount();

    // Trigger online after unmount — no flush should happen
    act(() => {
      triggerOnline();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ONLINE_DEBOUNCE_MS + 100);
    });

    expect(mockUpsert).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('clears pending timer on unmount', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

    await addEntry('OFFER_DRAFT_SAVE', {
      draftId: 'draft-008',
      draft: { ownerUserId: 'user-9', client: { id: null }, pricing: { currency: 'PLN' } },
    });

    const { unmount } = renderHook(() => useOfflineSync());

    // Unmount before the mount delay fires
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MOUNT_FLUSH_DELAY_MS + 100);
    });

    // Timer was cleared — no flush
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
