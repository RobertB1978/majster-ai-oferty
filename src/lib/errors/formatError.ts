/**
 * Majster.AI — Shared Error Formatter
 *
 * Maps any runtime error to a standardized FormattedError shape.
 * Designed to be used in:
 *   - ErrorBoundary (root catch-all)
 *   - toast/catch blocks in feature components
 *   - Edge Function response adapters (future)
 *
 * Usage:
 *   const fmt = formatError(err);
 *   toast.error(fmt.userMessage);
 *   // or pass fmt.code / fmt.requestId to UI
 */

import i18n from '@/i18n';
import { getCatalogEntry, FALLBACK_CATALOG_ENTRY } from './catalog';
import type { ErrorCatalogEntry } from './catalog';
import { generateDebugId, getErrorCode } from '@/lib/errorDiagnostics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * RFC 9457 Problem Details shape (https://www.rfc-editor.org/rfc/rfc9457).
 * Used as the canonical wire format for API error responses.
 * Not all fields are mandatory — omit what doesn't apply.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  request_id: string;
}

/** Full standardized error shape returned by formatError() */
export interface FormattedError {
  /** Domain error code, e.g. MAJ-UNK-001 */
  code: string;
  /** Unique per-event ID shown to the user for support lookup */
  requestId: string;
  /** Stable hash fingerprint for Sentry grouping (ERR-XXXXXXXX) */
  fingerprint: string;
  /** Localized user-friendly message (ready for toast / UI display) */
  userMessage: string;
  /** One-line hint for developer/AI/support triage */
  developerMessage: string;
  /** Whether the caller can safely retry the operation */
  retryable: boolean;
  /** Whether the error likely requires developer/owner intervention */
  ownerActionRequired: boolean;
  /** RFC 9457 Problem Details shape (useful for API / Edge Function responses) */
  problem: ProblemDetails;
  /** The original catalog entry for further inspection */
  catalogEntry: ErrorCatalogEntry;
}

/** Optional context passed to formatError() */
export interface FormatErrorContext {
  /**
   * Explicit domain code from catalog (e.g. 'MAJ-OFF-001').
   * When provided, skips auto-detection and uses this entry directly.
   */
  domainCode?: string;
  /** Current route path — attached to problem.detail for richer context */
  route?: string;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Normalize any thrown value to an Error instance.
 */
function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error('Unknown error');
  }
}

/**
 * Resolve the catalog entry from context or fall back to MAJ-UNK-001.
 */
function resolveCatalogEntry(context?: FormatErrorContext): ErrorCatalogEntry {
  if (context?.domainCode) {
    return getCatalogEntry(context.domainCode);
  }
  return FALLBACK_CATALOG_ENTRY;
}

/**
 * Build a localized user message for a catalog entry.
 * Falls back to generic errors.somethingWentWrong if key is missing.
 */
function resolveUserMessage(entry: ErrorCatalogEntry): string {
  const catalogKey = `errors.catalog.${entry.userMessageKey}`;
  const translated = i18n.t(catalogKey);
  // i18next returns the key itself when the translation is missing
  if (translated !== catalogKey) return translated;
  return i18n.t('errors.somethingWentWrong');
}

/**
 * Core formatter. Accepts any thrown value and optional context.
 * Returns a fully populated FormattedError.
 *
 * @example
 * // In a toast/catch block:
 * const fmt = formatError(err, { domainCode: 'MAJ-OFF-002' });
 * toast.error(fmt.userMessage);
 *
 * @example
 * // In an Edge Function response adapter:
 * const fmt = formatError(err, { domainCode: 'MAJ-DB-001' });
 * return new Response(JSON.stringify(fmt.problem), { status: fmt.problem.status });
 */
export function formatError(
  value: unknown,
  context?: FormatErrorContext
): FormattedError {
  const error = toError(value);
  const entry = resolveCatalogEntry(context);
  const requestId = generateDebugId();
  const fingerprint = getErrorCode(error);
  const userMessage = resolveUserMessage(entry);

  const detail = context?.route
    ? `${entry.developerMessage} [route: ${context.route}]`
    : entry.developerMessage;

  const problem: ProblemDetails = {
    type: entry.problemType,
    title: entry.code,
    status: entry.defaultHttpStatus,
    detail,
    code: entry.code,
    request_id: requestId,
  };

  return {
    code: entry.code,
    requestId,
    fingerprint,
    userMessage,
    developerMessage: entry.developerMessage,
    retryable: entry.retryable,
    ownerActionRequired: entry.ownerActionRequired,
    problem,
    catalogEntry: entry,
  };
}
