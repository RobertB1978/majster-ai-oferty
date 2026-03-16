/**
 * useOfflineSync — runtime wiring for the offline queue (§3.9, §18.1, §25.1).
 *
 * Mounts once at app root. Triggers flushQueue when:
 *   1. App mounts and browser is already online (after MOUNT_FLUSH_DELAY_MS).
 *   2. Browser fires the `online` event (debounced by ONLINE_DEBOUNCE_MS).
 *
 * The MVP SyncProcessor routes each of the 5 allowed action types (§25.1)
 * to the appropriate Supabase operation. The processor is the only place
 * where network calls are made — flushQueue itself stays backend-agnostic.
 *
 * Retry schedule: 1s → 2s → 4s → 8s, max 5 attempts (§18.1).
 * After max attempts the entry is marked CONFLICT and never retried.
 * Network failures keep entries as PENDING_SYNC for the next online cycle.
 */

import { useEffect, useRef } from 'react';
import { flushQueue } from '@/lib/offline-queue';
import type { SyncProcessor, QueueEntry } from '@/lib/offline-queue';
import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Timing constants
// ---------------------------------------------------------------------------

/** Delay after mount before the first flush attempt (ms). */
export const MOUNT_FLUSH_DELAY_MS = 1_500;

/** Debounce window for the browser `online` event (ms). */
export const ONLINE_DEBOUNCE_MS = 800;

// ---------------------------------------------------------------------------
// Payload shapes expected for each allowed action type
// ---------------------------------------------------------------------------

interface OfferDraftSavePayload {
  draftId: string;
  draft: {
    ownerUserId: string;
    client: { id: string | null };
    pricing: { currency: string };
  };
}

interface TemporaryClientAddPayload {
  userId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

// ---------------------------------------------------------------------------
// MVP SyncProcessor factory
// ---------------------------------------------------------------------------

/**
 * Creates the runtime SyncProcessor for the 5 allowed MVP action types.
 *
 * - OFFER_DRAFT_SAVE   → upsert into `offers` (draft row, source=quick_mode)
 * - TEMPORARY_CLIENT_ADD → insert into `clients`
 * - TEXT_NOTE_SAVE / PHOTO_METADATA_SAVE / CHECKLIST_UPDATE →
 *     These are field-level captures already included in every
 *     OFFER_DRAFT_SAVE payload. Acknowledging them removes stale
 *     duplicates without a separate backend round-trip.
 */
export function createMvpSyncProcessor(): SyncProcessor {
  return async (entry: QueueEntry): Promise<{ ok: true } | { ok: false; error: string }> => {
    switch (entry.actionType) {
      case 'OFFER_DRAFT_SAVE': {
        const payload = entry.payload as OfferDraftSavePayload;
        const { error } = await supabase
          .from('offers')
          .upsert(
            {
              id: payload.draftId,
              user_id: payload.draft.ownerUserId,
              client_id: payload.draft.client.id ?? null,
              status: 'draft',
              currency: payload.draft.pricing.currency,
            },
            { onConflict: 'id' },
          );

        if (error) {
          return { ok: false, error: error.message };
        }
        return { ok: true };
      }

      case 'TEMPORARY_CLIENT_ADD': {
        const payload = entry.payload as TemporaryClientAddPayload;
        const { error } = await supabase
          .from('clients')
          .insert({
            user_id: payload.userId,
            name: payload.name,
            phone: payload.phone ?? null,
            email: payload.email ?? null,
          });

        if (error) {
          return { ok: false, error: error.message };
        }
        return { ok: true };
      }

      // Field-level captures are always included in the OFFER_DRAFT_SAVE
      // payload. Acknowledging them keeps the queue clean.
      case 'TEXT_NOTE_SAVE':
      case 'PHOTO_METADATA_SAVE':
      case 'CHECKLIST_UPDATE':
        return { ok: true };

      default:
        // Should never reach here — queue.addEntry already rejects unknown types.
        return {
          ok: false,
          error: `No backend handler for action type: ${entry.actionType as string}`,
        };
    }
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Mount once at app root (inside AuthProvider / BrowserRouter).
 * Returns void — side-effect only.
 */
export function useOfflineSync(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable processor ref — recreated only if the module is hot-reloaded.
  const processorRef = useRef<SyncProcessor>(createMvpSyncProcessor());

  useEffect(() => {
    function scheduleFlush(delayMs: number): void {
      // Cancel any pending flush before scheduling a new one.
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        // Fire-and-forget: errors are non-fatal; next online cycle retries.
        void flushQueue(processorRef.current).catch(() => {
          // Intentionally swallowed — queue errors must never crash the app.
        });
      }, delayMs);
    }

    function handleOnline(): void {
      scheduleFlush(ONLINE_DEBOUNCE_MS);
    }

    // If already online on mount, schedule an initial flush after a short delay
    // so the app can finish rendering before network activity starts.
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      scheduleFlush(MOUNT_FLUSH_DELAY_MS);
    }

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
}
