/**
 * Standardized error codes for Edge Functions.
 *
 * Frontend maps these codes to i18n translations (apiErrors namespace).
 * This eliminates hardcoded Polish strings from API responses,
 * enabling proper multi-language error display.
 */

export const ERROR_CODES = {
  INVALID_REQUEST_BODY: 'INVALID_REQUEST_BODY',
  UNKNOWN_DOCUMENT_TYPE: 'UNKNOWN_DOCUMENT_TYPE',
  PDF_GENERATION_FAILED: 'PDF_GENERATION_FAILED',
  OFFER_NOT_FOUND: 'OFFER_NOT_FOUND',
  OFFER_NOT_ACCEPTED: 'OFFER_NOT_ACCEPTED',
  OFFER_EXPIRED: 'OFFER_EXPIRED',
  OFFER_ALREADY_COMPLETED: 'OFFER_ALREADY_COMPLETED',
  ACCEPTANCE_WINDOW_EXPIRED: 'ACCEPTANCE_WINDOW_EXPIRED',
  ACCEPTANCE_TIME_UNKNOWN: 'ACCEPTANCE_TIME_UNKNOWN',
  INVALID_ACCEPTANCE_TOKEN: 'INVALID_ACCEPTANCE_TOKEN',
  LINK_EXPIRED: 'LINK_EXPIRED',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_QUOTA_EXHAUSTED: 'AI_QUOTA_EXHAUSTED',
  AI_NOT_CONFIGURED: 'AI_NOT_CONFIGURED',
  AI_ERROR: 'AI_ERROR',
  UNKNOWN_SERVER_ERROR: 'UNKNOWN_SERVER_ERROR',
  // ── Mode B (DOCX pilot) — PR-02 ───────────────────────────────────────────
  INSTANCE_NOT_FOUND: 'INSTANCE_NOT_FOUND',
  INSTANCE_ACCESS_DENIED: 'INSTANCE_ACCESS_DENIED',
  MASTER_TEMPLATE_NOT_FOUND: 'MASTER_TEMPLATE_NOT_FOUND',
  DOCX_GENERATION_FAILED: 'DOCX_GENERATION_FAILED',
  STORAGE_UPLOAD_FAILED: 'STORAGE_UPLOAD_FAILED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Build a standardized JSON error response.
 * `detail` is optional — useful for debugging but never user-facing text.
 */
export function errorResponse(
  code: ErrorCode,
  status: number,
  headers: Record<string, string>,
  detail?: string,
): Response {
  return new Response(
    JSON.stringify({ error: { code, detail: detail ?? code } }),
    { status, headers: { ...headers, 'Content-Type': 'application/json' } },
  );
}
