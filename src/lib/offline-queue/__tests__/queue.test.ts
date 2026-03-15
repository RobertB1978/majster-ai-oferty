/**
 * Offline Queue — Unit Tests
 *
 * Covers:
 * - queue add (allowed actions)
 * - queue reject (excluded & unknown actions)
 * - retry delay progression
 * - remove / clear success paths
 * - persistence roundtrip via mocked idb-keyval
 * - sync status labels
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock idb-keyval — jsdom has no IndexedDB
// ---------------------------------------------------------------------------

let store: Record<string, unknown> = {};

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => store[key] ?? undefined),
  set: vi.fn(async (key: string, value: unknown) => {
    store[key] = value;
  }),
  del: vi.fn(async (key: string) => {
    delete store[key];
  }),
}));

// ---------------------------------------------------------------------------
// Imports (after mock registration)
// ---------------------------------------------------------------------------

import {
  addEntry,
  getEntries,
  getEntriesByStatus,
  removeEntry,
  clearQueue,
  ExcludedActionError,
} from '../queue';
import { getDelay, processEntry, flushQueue } from '../sync';
import {
  SYNC_STATUS_LABELS,
  RETRY_CONFIG,
  ALLOWED_ACTIONS,
  EXCLUDED_ACTIONS,
  IDB_QUEUE_KEY,
} from '../constants';
import type { QueueEntry, SyncProcessor } from '../types';

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  store = {};
});

// ============================= Constants ====================================

describe('constants', () => {
  it('defines all 4 sync status labels in Polish', () => {
    expect(SYNC_STATUS_LABELS.LOCAL).toBe('Zapisano lokalnie');
    expect(SYNC_STATUS_LABELS.PENDING_SYNC).toBe('Oczekuje synchronizacji');
    expect(SYNC_STATUS_LABELS.SYNCED).toBe('Zsynchronizowano');
    expect(SYNC_STATUS_LABELS.CONFLICT).toBe('Konflikt synchronizacji');
  });

  it('retry config matches roadmap spec (1s, 2s, 4s, 8s / max 5)', () => {
    expect(RETRY_CONFIG.delays).toEqual([1_000, 2_000, 4_000, 8_000]);
    expect(RETRY_CONFIG.maxAttempts).toBe(5);
  });

  it('has exactly 5 allowed action types', () => {
    expect(ALLOWED_ACTIONS.size).toBe(5);
  });

  it('has exactly 8 excluded action types', () => {
    expect(EXCLUDED_ACTIONS.size).toBe(8);
  });
});

// ============================= Queue: add ===================================

describe('addEntry', () => {
  it('adds an OFFER_DRAFT_SAVE entry', async () => {
    const entry = await addEntry('OFFER_DRAFT_SAVE', { title: 'Remont łazienki' });

    expect(entry.id).toBeTruthy();
    expect(entry.actionType).toBe('OFFER_DRAFT_SAVE');
    expect(entry.payload).toEqual({ title: 'Remont łazienki' });
    expect(entry.status).toBe('LOCAL');
    expect(entry.attempts).toBe(0);
    expect(entry.lastAttemptAt).toBeNull();
    expect(entry.lastError).toBeNull();
  });

  it('adds all 5 allowed action types', async () => {
    const types = [
      'OFFER_DRAFT_SAVE',
      'PHOTO_METADATA_SAVE',
      'TEXT_NOTE_SAVE',
      'CHECKLIST_UPDATE',
      'TEMPORARY_CLIENT_ADD',
    ] as const;

    for (const t of types) {
      const entry = await addEntry(t, { test: true });
      expect(entry.actionType).toBe(t);
    }

    const all = await getEntries();
    expect(all).toHaveLength(5);
  });

  it('persists entry to store (roundtrip)', async () => {
    await addEntry('TEXT_NOTE_SAVE', { note: 'Uwaga: ściana nośna' });

    const raw = store[IDB_QUEUE_KEY] as QueueEntry[];
    expect(raw).toHaveLength(1);
    expect(raw[0].payload).toEqual({ note: 'Uwaga: ściana nośna' });

    // Read back via queue API
    const entries = await getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].actionType).toBe('TEXT_NOTE_SAVE');
  });
});

// ============================= Queue: reject ================================

describe('addEntry — rejection', () => {
  it('throws ExcludedActionError for PHOTO_BINARY_UPLOAD', async () => {
    await expect(addEntry('PHOTO_BINARY_UPLOAD', {})).rejects.toThrow(ExcludedActionError);
  });

  it('throws ExcludedActionError for all 8 excluded types', async () => {
    const excluded = [
      'PHOTO_BINARY_UPLOAD',
      'OFFER_SEND',
      'PDF_GENERATE',
      'CLIENT_ACCEPT',
      'SETTINGS_BILLING',
      'TEMPLATE_CREATE',
      'PROJECT_CHANGE',
      'CLIENT_MERGE',
    ];

    for (const t of excluded) {
      await expect(addEntry(t, {})).rejects.toThrow(ExcludedActionError);
    }

    // Nothing should have been persisted
    const entries = await getEntries();
    expect(entries).toHaveLength(0);
  });

  it('throws generic Error for unknown action type', async () => {
    await expect(addEntry('TOTALLY_UNKNOWN', {})).rejects.toThrow(
      /not recognised by the offline queue/,
    );
    await expect(addEntry('TOTALLY_UNKNOWN', {})).rejects.not.toThrow(ExcludedActionError);
  });
});

// ============================= Queue: remove / clear ========================

describe('removeEntry', () => {
  it('removes an existing entry and returns true', async () => {
    const entry = await addEntry('CHECKLIST_UPDATE', { items: [] });
    const removed = await removeEntry(entry.id);
    expect(removed).toBe(true);

    const remaining = await getEntries();
    expect(remaining).toHaveLength(0);
  });

  it('returns false for non-existent ID', async () => {
    const removed = await removeEntry('non-existent-id');
    expect(removed).toBe(false);
  });
});

describe('clearQueue', () => {
  it('removes all entries', async () => {
    await addEntry('OFFER_DRAFT_SAVE', {});
    await addEntry('TEXT_NOTE_SAVE', {});
    await addEntry('CHECKLIST_UPDATE', {});

    await clearQueue();

    const entries = await getEntries();
    expect(entries).toHaveLength(0);
  });
});

// ============================= Queue: filter by status ======================

describe('getEntriesByStatus', () => {
  it('filters entries by status', async () => {
    await addEntry('OFFER_DRAFT_SAVE', {});
    await addEntry('TEXT_NOTE_SAVE', {});

    const local = await getEntriesByStatus('LOCAL');
    expect(local).toHaveLength(2);

    const pending = await getEntriesByStatus('PENDING_SYNC');
    expect(pending).toHaveLength(0);
  });
});

// ============================= Retry delay ==================================

describe('getDelay', () => {
  it('returns correct delays for attempts 0–3', () => {
    expect(getDelay(0)).toBe(1_000);
    expect(getDelay(1)).toBe(2_000);
    expect(getDelay(2)).toBe(4_000);
    expect(getDelay(3)).toBe(8_000);
  });

  it('caps at last delay for attempts beyond array length', () => {
    expect(getDelay(4)).toBe(8_000);
    expect(getDelay(10)).toBe(8_000);
  });
});

// ============================= Sync: processEntry ===========================

describe('processEntry', () => {
  it('removes entry on successful sync', async () => {
    const entry = await addEntry('OFFER_DRAFT_SAVE', { data: 1 });
    const processor: SyncProcessor = vi.fn(async () => ({ ok: true as const }));

    const result = await processEntry(entry, processor);

    expect(result).toBe(true);
    expect(processor).toHaveBeenCalledTimes(1);

    const remaining = await getEntries();
    expect(remaining).toHaveLength(0);
  });

  it('marks entry CONFLICT after max attempts exhausted', async () => {
    await addEntry('OFFER_DRAFT_SAVE', { data: 1 });

    // Simulate 4 prior failed attempts
    const entries = store[IDB_QUEUE_KEY] as QueueEntry[];
    entries[0].attempts = 4;
    entries[0].status = 'PENDING_SYNC';

    const processor: SyncProcessor = vi.fn(async () => ({
      ok: false as const,
      error: 'Server error',
    }));

    const result = await processEntry(entries[0], processor);

    expect(result).toBe(false);

    const remaining = await getEntries();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].status).toBe('CONFLICT');
    expect(remaining[0].lastError).toBe('Server error');
  });

  it('keeps entry as PENDING_SYNC when retries remain', async () => {
    const entry = await addEntry('TEXT_NOTE_SAVE', { note: 'test' });

    const processor: SyncProcessor = vi.fn(async () => ({
      ok: false as const,
      error: 'Network timeout',
    }));

    const result = await processEntry(entry, processor);

    expect(result).toBe(false);

    const remaining = await getEntries();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].status).toBe('PENDING_SYNC');
    expect(remaining[0].attempts).toBe(1);
    expect(remaining[0].lastError).toBe('Network timeout');
  });
});

// ============================= Sync: flushQueue =============================

describe('flushQueue', () => {
  it('syncs all LOCAL entries when processor succeeds', async () => {
    await addEntry('OFFER_DRAFT_SAVE', { a: 1 });
    await addEntry('TEXT_NOTE_SAVE', { b: 2 });

    const processor: SyncProcessor = vi.fn(async () => ({ ok: true as const }));

    const result = await flushQueue(processor);

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.remaining).toBe(0);
    expect(processor).toHaveBeenCalledTimes(2);
  });

  it('reports failures correctly', async () => {
    await addEntry('CHECKLIST_UPDATE', {});

    const processor: SyncProcessor = vi.fn(async () => ({
      ok: false as const,
      error: 'fail',
    }));

    const result = await flushQueue(processor);

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.remaining).toBe(1);
  });
});
