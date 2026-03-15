/**
 * Offline Queue — Constants
 *
 * Sync status labels (Polish) from §18.1.
 * Retry config from §18.1 / §23.3.
 */

import type { AllowedActionType, ExcludedActionType, RetryConfig, SyncStatus } from './types';

// ---------------------------------------------------------------------------
// Sync status → Polish UI label mapping (§18.1)
// These are infra-only constants; UI rendering is out of scope.
// ---------------------------------------------------------------------------

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  LOCAL: 'Zapisano lokalnie',
  PENDING_SYNC: 'Oczekuje synchronizacji',
  SYNCED: 'Zsynchronizowano',
  CONFLICT: 'Konflikt synchronizacji',
} as const;

// ---------------------------------------------------------------------------
// Retry strategy (§18.1 / §23.3): 1s, 2s, 4s, 8s — max 5 attempts
// ---------------------------------------------------------------------------

export const RETRY_CONFIG: RetryConfig = {
  delays: [1_000, 2_000, 4_000, 8_000] as const,
  maxAttempts: 5,
} as const;

// ---------------------------------------------------------------------------
// Allowed action types set — for O(1) validation
// ---------------------------------------------------------------------------

export const ALLOWED_ACTIONS: ReadonlySet<AllowedActionType> = new Set<AllowedActionType>([
  'OFFER_DRAFT_SAVE',
  'PHOTO_METADATA_SAVE',
  'TEXT_NOTE_SAVE',
  'CHECKLIST_UPDATE',
  'TEMPORARY_CLIENT_ADD',
]);

// ---------------------------------------------------------------------------
// Excluded action types set — for explicit rejection with message
// ---------------------------------------------------------------------------

export const EXCLUDED_ACTIONS: ReadonlySet<ExcludedActionType> = new Set<ExcludedActionType>([
  'PHOTO_BINARY_UPLOAD',
  'OFFER_SEND',
  'PDF_GENERATE',
  'CLIENT_ACCEPT',
  'SETTINGS_BILLING',
  'TEMPLATE_CREATE',
  'PROJECT_CHANGE',
  'CLIENT_MERGE',
]);

// ---------------------------------------------------------------------------
// IndexedDB store key used by idb-keyval
// ---------------------------------------------------------------------------

export const IDB_QUEUE_KEY = 'offline-queue-entries';
