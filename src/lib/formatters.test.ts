import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatters';

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
  });
});
