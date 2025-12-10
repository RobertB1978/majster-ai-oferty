/**
 * TESTY - normalizeTrackingStatus - Phase 7B
 * Weryfikacja normalizacji tracking_status
 */

import { describe, it, expect, vi } from 'vitest';
import { normalizeTrackingStatus, type TrackingStatus } from './trackingStatusUtils';

describe('normalizeTrackingStatus', () => {
  it('powinien zwrócić "sent" dla undefined', () => {
    const result = normalizeTrackingStatus(undefined);
    expect(result).toBe('sent');
  });

  it('powinien zwrócić "sent" dla null', () => {
    const result = normalizeTrackingStatus(null);
    expect(result).toBe('sent');
  });

  it('powinien zwrócić "sent" dla pustego stringa', () => {
    const result = normalizeTrackingStatus('');
    expect(result).toBe('sent');
  });

  it('powinien przepuścić poprawne wartości bez zmian', () => {
    const validStatuses: TrackingStatus[] = ['sent', 'opened', 'pdf_viewed', 'accepted', 'rejected'];

    validStatuses.forEach((status) => {
      const result = normalizeTrackingStatus(status);
      expect(result).toBe(status);
    });
  });

  it('powinien zwrócić "sent" dla niepoprawnej wartości i wyświetlić warning', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = normalizeTrackingStatus('invalid-status');

    expect(result).toBe('sent');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid tracking_status received: "invalid-status", falling back to \'sent\''
    );

    consoleWarnSpy.mockRestore();
  });

  it('powinien obsłużyć różne niepoprawne wartości', () => {
    const invalidValues = ['SENT', 'Opened', 'random', '123', 'null'];
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    invalidValues.forEach((value) => {
      const result = normalizeTrackingStatus(value);
      expect(result).toBe('sent');
    });

    expect(consoleWarnSpy).toHaveBeenCalledTimes(invalidValues.length);
    consoleWarnSpy.mockRestore();
  });

  it('powinien obsłużyć wszystkie edge cases w jednym teście', () => {
    const testCases: Array<[string | undefined | null, TrackingStatus]> = [
      [undefined, 'sent'],
      [null, 'sent'],
      ['', 'sent'],
      ['sent', 'sent'],
      ['opened', 'opened'],
      ['pdf_viewed', 'pdf_viewed'],
      ['accepted', 'accepted'],
      ['rejected', 'rejected'],
    ];

    testCases.forEach(([input, expected]) => {
      expect(normalizeTrackingStatus(input)).toBe(expected);
    });
  });
});
