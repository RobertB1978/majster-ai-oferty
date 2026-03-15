/**
 * Offline Queue — Core Queue Operations
 *
 * Manages adding, removing, and querying queue entries.
 * Validates action types against §25.1 (allowed) and §25.2 (excluded).
 */

import type { AllowedActionType, ExcludedActionType, QueueEntry, SyncStatus } from './types';
import { ALLOWED_ACTIONS, EXCLUDED_ACTIONS } from './constants';
import { loadEntries, saveEntries, clearEntries } from './storage';

// ---------------------------------------------------------------------------
// Error for rejected (excluded) actions
// ---------------------------------------------------------------------------

export class ExcludedActionError extends Error {
  public readonly actionType: string;

  constructor(actionType: string) {
    super(
      `Action "${actionType}" is explicitly excluded from the offline queue (§25.2). ` +
      'This action must be performed online.',
    );
    this.name = 'ExcludedActionError';
    this.actionType = actionType;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without randomUUID
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function isExcluded(actionType: string): actionType is ExcludedActionType {
  return EXCLUDED_ACTIONS.has(actionType as ExcludedActionType);
}

function isAllowed(actionType: string): actionType is AllowedActionType {
  return ALLOWED_ACTIONS.has(actionType as AllowedActionType);
}

// ---------------------------------------------------------------------------
// Queue: add entry
// ---------------------------------------------------------------------------

/**
 * Add a new entry to the offline queue.
 *
 * - Throws `ExcludedActionError` for actions listed in §25.2.
 * - Throws generic `Error` for unknown action types.
 * - Returns the created `QueueEntry`.
 */
export async function addEntry<TPayload = unknown>(
  actionType: string,
  payload: TPayload,
): Promise<QueueEntry<TPayload>> {
  // Gate: explicitly excluded actions
  if (isExcluded(actionType)) {
    throw new ExcludedActionError(actionType);
  }

  // Gate: unknown (not in allowed list)
  if (!isAllowed(actionType)) {
    throw new Error(
      `Action "${actionType}" is not recognised by the offline queue. ` +
      'Only MVP actions from §25.1 are supported.',
    );
  }

  const entry: QueueEntry<TPayload> = {
    id: generateId(),
    actionType,
    payload,
    createdAt: new Date().toISOString(),
    status: 'LOCAL',
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
  };

  const entries = await loadEntries();
  entries.push(entry as QueueEntry);
  await saveEntries(entries);

  return entry;
}

// ---------------------------------------------------------------------------
// Queue: get all entries
// ---------------------------------------------------------------------------

export async function getEntries(): Promise<QueueEntry[]> {
  return loadEntries();
}

// ---------------------------------------------------------------------------
// Queue: get entries by status
// ---------------------------------------------------------------------------

export async function getEntriesByStatus(status: SyncStatus): Promise<QueueEntry[]> {
  const entries = await loadEntries();
  return entries.filter((e) => e.status === status);
}

// ---------------------------------------------------------------------------
// Queue: update entry (e.g. after sync attempt)
// ---------------------------------------------------------------------------

export async function updateEntry(
  id: string,
  patch: Partial<Pick<QueueEntry, 'status' | 'attempts' | 'lastAttemptAt' | 'lastError'>>,
): Promise<QueueEntry | null> {
  const entries = await loadEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;

  entries[idx] = { ...entries[idx], ...patch };
  await saveEntries(entries);
  return entries[idx];
}

// ---------------------------------------------------------------------------
// Queue: remove entry by ID
// ---------------------------------------------------------------------------

export async function removeEntry(id: string): Promise<boolean> {
  const entries = await loadEntries();
  const filtered = entries.filter((e) => e.id !== id);
  if (filtered.length === entries.length) return false;

  await saveEntries(filtered);
  return true;
}

// ---------------------------------------------------------------------------
// Queue: clear all entries
// ---------------------------------------------------------------------------

export async function clearQueue(): Promise<void> {
  await clearEntries();
}
