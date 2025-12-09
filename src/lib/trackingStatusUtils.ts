/**
 * TRACKING STATUS UTILITIES - Phase 7B
 * Utility functions dla normalizacji tracking_status w offer_sends
 */

/**
 * Dozwolone wartości tracking_status dla offer_sends
 */
export type TrackingStatus = 'sent' | 'opened' | 'pdf_viewed' | 'accepted' | 'rejected';

/**
 * Normalizuje tracking_status do poprawnej wartości
 *
 * @param input - wartość tracking_status (może być undefined/null)
 * @returns zawsze poprawny tracking_status ('sent' jako bezpieczny default)
 *
 * Przykłady:
 * - undefined → 'sent'
 * - null → 'sent'
 * - 'opened' → 'opened'
 * - 'invalid' → 'sent' (fallback dla niepoprawnych wartości)
 */
export function normalizeTrackingStatus(input: string | undefined | null): TrackingStatus {
  // Jeśli brak wartości, zwróć domyślną
  if (!input) {
    return 'sent';
  }

  // Lista poprawnych wartości
  const validStatuses: TrackingStatus[] = ['sent', 'opened', 'pdf_viewed', 'accepted', 'rejected'];

  // Sprawdź czy wartość jest poprawna
  if (validStatuses.includes(input as TrackingStatus)) {
    return input as TrackingStatus;
  }

  // Fallback dla niepoprawnych wartości
  console.warn(`Invalid tracking_status received: "${input}", falling back to 'sent'`);
  return 'sent';
}
