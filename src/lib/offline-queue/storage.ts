/**
 * Offline Queue — Storage Layer
 *
 * Thin wrapper over idb-keyval for persisting queue entries to IndexedDB.
 * Web-only implementation (§18.1). Capacitor Storage adapter is out of MVP scope.
 */

import { get, set, del } from 'idb-keyval';
import type { QueueEntry } from './types';
import { IDB_QUEUE_KEY } from './constants';

// ---------------------------------------------------------------------------
// Read all entries from IndexedDB
// ---------------------------------------------------------------------------

export async function loadEntries(): Promise<QueueEntry[]> {
  const data = await get<QueueEntry[]>(IDB_QUEUE_KEY);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Persist full entries array to IndexedDB
// ---------------------------------------------------------------------------

export async function saveEntries(entries: QueueEntry[]): Promise<void> {
  await set(IDB_QUEUE_KEY, entries);
}

// ---------------------------------------------------------------------------
// Clear all entries from IndexedDB
// ---------------------------------------------------------------------------

export async function clearEntries(): Promise<void> {
  await del(IDB_QUEUE_KEY);
}
