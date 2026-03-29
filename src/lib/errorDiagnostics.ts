/**
 * Minimal error diagnostics — stable error code + unique debug ID.
 * No stack traces or sensitive data are generated or exposed here.
 */

/**
 * djb2 hash — deterministic, no external deps.
 * Same error name+message → same hash → same error code.
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep 32-bit unsigned
  }
  return hash;
}

/**
 * Stable error code derived from the error's name and message.
 * Format: ERR-XXXXXXXX (8 uppercase hex chars).
 * Same error → same code every time (useful for grouping in Sentry).
 */
export function getErrorCode(error: Error): string {
  const input = `${error.name}:${error.message}`.slice(0, 200);
  const hex = djb2Hash(input).toString(16).padStart(8, '0').toUpperCase();
  return `ERR-${hex}`;
}

/**
 * Unique per-render debug ID.
 * Format: REQ-XXXXXXXX (8 uppercase hex chars, random).
 * Each crash event gets its own ID — correlates UI display with Sentry event.
 */
export function generateDebugId(): string {
  const hex = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0')
    .toUpperCase();
  return `REQ-${hex}`;
}

export interface ErrorDiagnostics {
  errorCode: string;
  debugId: string;
}

export function buildDiagnostics(error: Error): ErrorDiagnostics {
  return {
    errorCode: getErrorCode(error),
    debugId: generateDebugId(),
  };
}
