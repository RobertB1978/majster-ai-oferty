/**
 * Offline Queue — Public API
 *
 * Re-exports the queue's public surface for consuming code.
 */

// Types
export type {
  AllowedActionType,
  ExcludedActionType,
  SyncStatus,
  QueueEntry,
  RetryConfig,
  SyncResult,
  SyncProcessor,
} from './types';

// Constants
export {
  SYNC_STATUS_LABELS,
  RETRY_CONFIG,
  ALLOWED_ACTIONS,
  EXCLUDED_ACTIONS,
  IDB_QUEUE_KEY,
} from './constants';

// Queue operations
export {
  addEntry,
  getEntries,
  getEntriesByStatus,
  updateEntry,
  removeEntry,
  clearQueue,
  ExcludedActionError,
} from './queue';

// Sync engine
export {
  processEntry,
  flushQueue,
  getDelay,
} from './sync';
