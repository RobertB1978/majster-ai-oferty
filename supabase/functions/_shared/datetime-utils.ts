/**
 * DateTime Utilities - Timezone-Aware UTC Handling
 *
 * CRITICAL: This module prevents timezone-naive/aware comparison errors.
 * All functions return ISO 8601 strings in UTC with timezone information.
 *
 * WHY: JavaScript Date objects can be ambiguous. By always using ISO strings
 * with explicit timezone info, we prevent runtime errors when comparing dates.
 */

/**
 * Get current UTC time as an ISO 8601 string
 * ALWAYS use this instead of new Date().toISOString() for consistency
 *
 * @returns ISO 8601 string with timezone (e.g., "2026-01-02T07:14:06.000Z")
 */
export function utcNow(): string {
  return new Date().toISOString();
}

/**
 * Ensure a date value is a valid timezone-aware UTC ISO string
 * If input is already a valid ISO string, returns it
 * If input is a Date object, converts to ISO string
 * If input is null/undefined, returns null
 *
 * @param dt - Date value to normalize (string, Date, or null/undefined)
 * @returns ISO 8601 string with timezone or null
 */
export function ensureAwareUTC(dt: string | Date | null | undefined): string | null {
  if (dt === null || dt === undefined) {
    return null;
  }

  if (typeof dt === 'string') {
    // Validate it's a proper ISO string
    const parsed = new Date(dt);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: ${dt}`);
    }
    return parsed.toISOString();
  }

  if (dt instanceof Date) {
    if (isNaN(dt.getTime())) {
      throw new Error('Invalid Date object');
    }
    return dt.toISOString();
  }

  throw new Error(`Unsupported date type: ${typeof dt}`);
}

/**
 * Check if a scheduled time is due (current time >= scheduled time)
 * Safely compares timezone-aware UTC timestamps
 *
 * @param scheduledFor - The scheduled time (ISO string or Date)
 * @param now - Current time (ISO string or Date). Defaults to utcNow()
 * @returns true if scheduled time has passed
 */
export function isDue(
  scheduledFor: string | Date,
  now: string | Date = utcNow()
): boolean {
  const scheduledTime = new Date(ensureAwareUTC(scheduledFor)!);
  const currentTime = new Date(ensureAwareUTC(now)!);

  return currentTime >= scheduledTime;
}

/**
 * Add seconds to a date
 *
 * @param date - Base date (ISO string or Date)
 * @param seconds - Number of seconds to add
 * @returns New ISO 8601 string
 */
export function addSeconds(date: string | Date, seconds: number): string {
  const baseDate = new Date(ensureAwareUTC(date)!);
  const newDate = new Date(baseDate.getTime() + seconds * 1000);
  return newDate.toISOString();
}

/**
 * Calculate exponential backoff delay in seconds
 *
 * @param retryCount - Number of retries already attempted
 * @param baseDelay - Base delay in seconds (default: 60)
 * @param maxDelay - Maximum delay in seconds (default: 3600 = 1 hour)
 * @returns Delay in seconds
 */
export function exponentialBackoff(
  retryCount: number,
  baseDelay: number = 60,
  maxDelay: number = 3600
): number {
  const delay = baseDelay * Math.pow(2, retryCount);
  return Math.min(delay, maxDelay);
}
