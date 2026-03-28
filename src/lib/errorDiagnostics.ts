/**
 * Safe error diagnostics utility.
 *
 * Maps unknown runtime errors to a stable error code, unique debug ID,
 * and a safe user-facing message. Raw stack traces and internal details
 * are NEVER returned from this module — they belong in logs/Sentry only.
 */

/** Stable, machine-readable error codes shown to users and sent to Sentry. */
export type ErrorCode =
  | 'ERR_RENDER'
  | 'ERR_NETWORK'
  | 'ERR_AUTH'
  | 'ERR_NOT_FOUND'
  | 'ERR_SERVER'
  | 'ERR_VALIDATION'
  | 'ERR_UNKNOWN';

export interface ErrorDiagnostic {
  /** Stable error code, safe to display and log. */
  code: ErrorCode;
  /** Short unique ID for correlating user reports with Sentry events. */
  debugId: string;
}

/**
 * Generates a short, human-readable debug ID.
 * Format: base-36 timestamp + 4 random chars, e.g. "LB9K3F2A-X7QR"
 */
export function generateDebugId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${ts}-${rand}`;
}

/**
 * Classifies an unknown error into a stable error code.
 * Uses only error.name and error.message — never exposes stack.
 */
function classifyError(error: unknown): ErrorCode {
  if (!(error instanceof Error)) return 'ERR_UNKNOWN';

  const name = error.name.toLowerCase();
  const msg = error.message.toLowerCase();

  if (
    name.includes('networkerror') ||
    msg.includes('failed to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('load failed')
  ) {
    return 'ERR_NETWORK';
  }

  if (
    msg.includes('unauthorized') ||
    msg.includes('jwt') ||
    msg.includes('not authenticated') ||
    msg.includes('403')
  ) {
    return 'ERR_AUTH';
  }

  if (msg.includes('not found') || msg.includes('404')) {
    return 'ERR_NOT_FOUND';
  }

  if (msg.includes('validation') || msg.includes('invalid')) {
    return 'ERR_VALIDATION';
  }

  if (
    msg.includes('internal server') ||
    msg.includes('500') ||
    msg.includes('supabase')
  ) {
    return 'ERR_SERVER';
  }

  // Default: a React render error or unclassified runtime error
  return 'ERR_RENDER';
}

/**
 * Builds a diagnostic object for any caught error.
 * Call this once per error event; store the result in component state
 * so both the UI and Sentry receive the same code + debugId.
 */
export function buildDiagnostic(error: unknown): ErrorDiagnostic {
  return {
    code: classifyError(error),
    debugId: generateDebugId(),
  };
}
