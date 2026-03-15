/**
 * Offline Queue — Sync Engine
 *
 * Implements exponential backoff retry (§18.1 / §23.3):
 *   1s → 2s → 4s → 8s, max 5 attempts.
 *
 * The actual network call is delegated to a `SyncProcessor` supplied by
 * consuming code. This module only orchestrates retry logic and status
 * transitions — no Supabase or fetch calls live here.
 */

import type { QueueEntry, SyncProcessor, SyncResult } from './types';
import { RETRY_CONFIG } from './constants';
import { getEntriesByStatus, updateEntry, removeEntry } from './queue';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDelay(attempt: number): number {
  const { delays } = RETRY_CONFIG;
  // Use last delay value for attempts beyond the array length
  return delays[Math.min(attempt, delays.length - 1)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Process a single entry with retry
// ---------------------------------------------------------------------------

/**
 * Attempt to sync a single queue entry.
 *
 * Transitions:
 *   LOCAL / PENDING_SYNC → attempt sync
 *     success → remove entry from queue
 *     failure (attempts < max) → PENDING_SYNC, increment attempts
 *     failure (attempts >= max) → CONFLICT
 *
 * Returns `true` if the entry was synced and removed, `false` otherwise.
 */
export async function processEntry(
  entry: QueueEntry,
  processor: SyncProcessor,
): Promise<boolean> {
  const attemptNumber = entry.attempts; // 0-based before this attempt
  const now = new Date().toISOString();

  // Mark as pending sync before attempting
  await updateEntry(entry.id, {
    status: 'PENDING_SYNC',
    lastAttemptAt: now,
    attempts: attemptNumber + 1,
  });

  const result: SyncResult = await processor(entry);

  if (result.ok) {
    await removeEntry(entry.id);
    return true;
  }

  // Failed — check if we've exhausted retries
  const totalAttempts = attemptNumber + 1;

  if (totalAttempts >= RETRY_CONFIG.maxAttempts) {
    await updateEntry(entry.id, {
      status: 'CONFLICT',
      lastError: result.error,
    });
    return false;
  }

  // Still have retries left — stay PENDING_SYNC
  await updateEntry(entry.id, {
    status: 'PENDING_SYNC',
    lastError: result.error,
  });

  return false;
}

// ---------------------------------------------------------------------------
// Flush: process all pending entries with backoff
// ---------------------------------------------------------------------------

/**
 * Process all LOCAL and PENDING_SYNC entries, respecting exponential backoff.
 *
 * This is intended to be called when the app regains connectivity.
 * Each entry is attempted independently — one failure does not block others.
 *
 * Returns summary counts.
 */
export async function flushQueue(
  processor: SyncProcessor,
): Promise<{ synced: number; failed: number; remaining: number }> {
  const localEntries = await getEntriesByStatus('LOCAL');
  const pendingEntries = await getEntriesByStatus('PENDING_SYNC');
  const entries = [...localEntries, ...pendingEntries];

  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    // Apply backoff delay based on previous attempts
    if (entry.attempts > 0) {
      const delay = getDelay(entry.attempts - 1);
      await sleep(delay);
    }

    const success = await processEntry(entry, processor);
    if (success) {
      synced++;
    } else {
      failed++;
    }
  }

  // Count remaining entries (including those in CONFLICT)
  const remainingLocal = await getEntriesByStatus('LOCAL');
  const remainingPending = await getEntriesByStatus('PENDING_SYNC');
  const remainingConflict = await getEntriesByStatus('CONFLICT');
  const remaining = remainingLocal.length + remainingPending.length + remainingConflict.length;

  return { synced, failed, remaining };
}

// ---------------------------------------------------------------------------
// Utility: get delay for a given attempt (exposed for testing)
// ---------------------------------------------------------------------------

export { getDelay };
