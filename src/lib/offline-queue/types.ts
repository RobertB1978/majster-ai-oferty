/**
 * Offline Queue — Type Definitions
 *
 * MVP scope from ULTRA_ENTERPRISE_ROADMAP.md §25.1
 * Only the 5 allowed action types are permitted.
 */

// ---------------------------------------------------------------------------
// Allowed MVP action types (§25.1 — closed list)
// ---------------------------------------------------------------------------

export type AllowedActionType =
  | 'OFFER_DRAFT_SAVE'
  | 'PHOTO_METADATA_SAVE'
  | 'TEXT_NOTE_SAVE'
  | 'CHECKLIST_UPDATE'
  | 'TEMPORARY_CLIENT_ADD';

// ---------------------------------------------------------------------------
// Explicitly excluded action types (§25.2 — closed list)
// ---------------------------------------------------------------------------

export type ExcludedActionType =
  | 'PHOTO_BINARY_UPLOAD'
  | 'OFFER_SEND'
  | 'PDF_GENERATE'
  | 'CLIENT_ACCEPT'
  | 'SETTINGS_BILLING'
  | 'TEMPLATE_CREATE'
  | 'PROJECT_CHANGE'
  | 'CLIENT_MERGE';

// ---------------------------------------------------------------------------
// Sync status (§18.1 — UI label constants live in constants.ts)
// ---------------------------------------------------------------------------

export type SyncStatus =
  | 'LOCAL'
  | 'PENDING_SYNC'
  | 'SYNCED'
  | 'CONFLICT';

// ---------------------------------------------------------------------------
// Queue entry
// ---------------------------------------------------------------------------

export interface QueueEntry<TPayload = unknown> {
  /** Unique entry ID (crypto.randomUUID or fallback) */
  id: string;
  /** One of the 5 allowed action types */
  actionType: AllowedActionType;
  /** Arbitrary JSON-serialisable payload */
  payload: TPayload;
  /** ISO-8601 timestamp of creation */
  createdAt: string;
  /** Current sync status */
  status: SyncStatus;
  /** Number of sync attempts so far */
  attempts: number;
  /** ISO-8601 timestamp of last attempt (null if never attempted) */
  lastAttemptAt: string | null;
  /** Error message from last failed attempt (null if none) */
  lastError: string | null;
}

// ---------------------------------------------------------------------------
// Retry configuration
// ---------------------------------------------------------------------------

export interface RetryConfig {
  /** Delay sequence in milliseconds */
  delays: readonly number[];
  /** Maximum number of attempts */
  maxAttempts: number;
}

// ---------------------------------------------------------------------------
// Sync result (returned by sync processor)
// ---------------------------------------------------------------------------

export type SyncResult =
  | { ok: true }
  | { ok: false; error: string };

/** Processor function supplied by consuming code to actually push data. */
export type SyncProcessor = (entry: QueueEntry) => Promise<SyncResult>;
