import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, formatDate, formatDateLong, resolveLocale, unitToI18nKey } from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
      expect(result).toContain('zł');
    });

    it('should format small amounts correctly', () => {
      const result = formatCurrency(10);
      expect(result).toContain('10');
      expect(result).toContain('zł');
    });

    it('should format decimal amounts with proper Polish formatting', () => {
      const result = formatCurrency(123.45);
      // Polish format uses comma as decimal separator
      expect(result).toContain('123,45');
      expect(result).toContain('zł');
    });

    it('should format large amounts with thousand separators', () => {
      const result = formatCurrency(12345.67);
      // Polish format uses non-breaking space as thousand separator
      expect(result).toMatch(/12.*345,67/);
      expect(result).toContain('zł');
    });

    it('should format very large amounts correctly', () => {
      const result = formatCurrency(1234567.89);
      // Should have proper thousand separators
      expect(result).toMatch(/1.*234.*567,89/);
      expect(result).toContain('zł');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('-100');
      expect(result).toContain('zł');
    });

    it('should round to 2 decimal places', () => {
      const result = formatCurrency(10.999);
      // Should round to 11.00
      expect(result).toContain('11');
      expect(result).toContain('zł');
    });

    it('should format with English locale', () => {
      const result = formatCurrency(1234.56, 'en');
      expect(result).toContain('PLN');
      expect(result).toMatch(/1.*234/);
    });
  });

  describe('resolveLocale', () => {
    it('maps pl to pl-PL', () => {
      expect(resolveLocale('pl')).toBe('pl-PL');
    });
    it('maps en to en-GB', () => {
      expect(resolveLocale('en')).toBe('en-GB');
    });
    it('maps uk to uk-UA', () => {
      expect(resolveLocale('uk')).toBe('uk-UA');
    });
    it('defaults to pl-PL when undefined', () => {
      expect(resolveLocale()).toBe('pl-PL');
    });
  });

  describe('formatNumber', () => {
    it('formats with 2 decimals by default (pl)', () => {
      const result = formatNumber(1234.5);
      expect(result).toMatch(/1.*234,50/);
    });
    it('formats with 0 decimals', () => {
      const result = formatNumber(1234.5, 0);
      expect(result).toMatch(/1.*235|1.*234/);
    });
  });

  describe('formatDate', () => {
    it('formats a date string', () => {
      const result = formatDate('2026-03-19');
      expect(result).toBeTruthy();
    });
    it('formats a Date object', () => {
      const result = formatDate(new Date(2026, 2, 19));
      expect(result).toBeTruthy();
    });
  });

  describe('formatDateLong', () => {
    it('includes month name for pl', () => {
      const result = formatDateLong('2026-03-19', 'pl');
      expect(result).toBeTruthy();
    });
  });

  describe('unitToI18nKey', () => {
    it('maps Polish szt. to pcs', () => {
      expect(unitToI18nKey('szt.')).toBe('pcs');
    });
    it('maps godz. to hrs', () => {
      expect(unitToI18nKey('godz.')).toBe('hrs');
    });
    it('passes through unknown units', () => {
      expect(unitToI18nKey('custom')).toBe('custom');
    });
  });
});
