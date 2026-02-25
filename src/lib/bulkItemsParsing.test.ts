import { describe, it, expect } from 'vitest';
import {
  detectDelimiter,
  parseBulkText,
  parsedRowsToLineItems,
} from './bulkItemsParsing';

describe('detectDelimiter', () => {
  it('detects pipe delimiter', () => {
    const text = 'Kafelki | 10 | m² | 150\nGips | 5 | worek | 25';
    expect(detectDelimiter(text)).toBe('|');
  });

  it('detects tab delimiter', () => {
    const text = 'Kafelki\t10\tm²\t150\nGips\t5\tworek\t25';
    expect(detectDelimiter(text)).toBe('\t');
  });

  it('detects comma delimiter', () => {
    const text = 'Kafelki,10,m²,150\nGips,5,worek,25';
    expect(detectDelimiter(text)).toBe(',');
  });

  it('prefers tab over comma when both present', () => {
    const text = 'Kafelki, opis\t10\tm²\t150';
    expect(detectDelimiter(text)).toBe('\t');
  });

  it('returns comma for empty input', () => {
    expect(detectDelimiter('')).toBe(',');
    expect(detectDelimiter('   \n   ')).toBe(',');
  });
});

describe('parseBulkText', () => {
  describe('4-column inputs', () => {
    it('parses pipe-separated row', () => {
      const rows = parseBulkText('Kafelkowanie ściany | 10 | m² | 150');
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('Kafelkowanie ściany');
      expect(rows[0].qty).toBe(10);
      expect(rows[0].unit).toBe('m²');
      expect(rows[0].price).toBe(150);
      expect(rows[0].nameError).toBe(false);
      expect(rows[0].qtyError).toBe(false);
      expect(rows[0].priceError).toBe(false);
    });

    it('parses tab-separated row (Excel paste)', () => {
      const rows = parseBulkText('Gips\t5\tworek\t25');
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('Gips');
      expect(rows[0].qty).toBe(5);
      expect(rows[0].unit).toBe('worek');
      expect(rows[0].price).toBe(25);
    });

    it('parses comma-separated row (CSV)', () => {
      const rows = parseBulkText('Kafelki,10,m²,150');
      expect(rows).toHaveLength(1);
      expect(rows[0].qty).toBe(10);
      expect(rows[0].price).toBe(150);
    });
  });

  describe('header detection', () => {
    it('skips header row in CSV', () => {
      const input = 'Name,Qty,Unit,UnitPrice\nKafelki,10,m²,150\nGips,5,worek,25';
      const rows = parseBulkText(input);
      expect(rows).toHaveLength(2);
      expect(rows[0].name).toBe('Kafelki');
      expect(rows[1].name).toBe('Gips');
    });

    it('skips pipe-delimited header row', () => {
      const input = 'Nazwa | Ilość | Jedn. | Cena\nKafelki | 10 | m² | 150';
      const rows = parseBulkText(input);
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('Kafelki');
    });

    it('does not skip data rows that start with a number', () => {
      // First row has numeric qty — should NOT be treated as header
      const input = 'Kafelki | 10 | m² | 150\nGips | 5 | worek | 25';
      const rows = parseBulkText(input);
      expect(rows).toHaveLength(2);
    });
  });

  describe('column count variations', () => {
    it('parses 3-column input (name|qty|price, unit defaults to szt)', () => {
      const rows = parseBulkText('Kafelki | 10 | 150');
      expect(rows).toHaveLength(1);
      expect(rows[0].qty).toBe(10);
      expect(rows[0].unit).toBe('szt');
      expect(rows[0].price).toBe(150);
      expect(rows[0].priceError).toBe(false);
    });

    it('parses 2-column input (name|price, qty defaults to 1)', () => {
      const rows = parseBulkText('Kafelki | 150');
      expect(rows).toHaveLength(1);
      expect(rows[0].qty).toBe(1);
      expect(rows[0].price).toBe(150);
    });
  });

  describe('multiple lines', () => {
    it('parses 20 lines correctly', () => {
      const lines = Array.from(
        { length: 20 },
        (_, i) => `Pozycja ${i + 1} | ${i + 1} | szt | ${(i + 1) * 10}`
      ).join('\n');
      const rows = parseBulkText(lines);
      expect(rows).toHaveLength(20);
      rows.forEach((r) => {
        expect(r.nameError).toBe(false);
        expect(r.qtyError).toBe(false);
        expect(r.priceError).toBe(false);
      });
    });
  });

  describe('error detection', () => {
    it('marks nameError for empty name', () => {
      const rows = parseBulkText(' | 10 | m² | 150');
      expect(rows[0].nameError).toBe(true);
    });

    it('marks priceError for missing price', () => {
      // 1-column: only name, no price
      const rows = parseBulkText('Kafelki');
      expect(rows[0].priceError).toBe(true);
    });

    it('marks qtyError for invalid quantity string', () => {
      const rows = parseBulkText('Kafelki | abc | m² | 150');
      expect(rows[0].qtyError).toBe(true);
    });

    it('marks priceError for non-numeric price', () => {
      const rows = parseBulkText('Kafelki | 10 | m² | abc');
      expect(rows[0].priceError).toBe(true);
    });
  });

  describe('decimal separators', () => {
    it('handles comma as decimal separator in qty', () => {
      const rows = parseBulkText('Kafelki | 10,5 | m² | 150,00');
      expect(rows[0].qty).toBe(10.5);
      expect(rows[0].price).toBe(150);
    });

    it('handles dot as decimal separator', () => {
      const rows = parseBulkText('Kafelki | 10.5 | m² | 150.00');
      expect(rows[0].qty).toBe(10.5);
      expect(rows[0].price).toBe(150);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty string', () => {
      expect(parseBulkText('')).toEqual([]);
    });

    it('returns empty array for whitespace-only string', () => {
      expect(parseBulkText('   \n   \n  ')).toEqual([]);
    });

    it('assigns unique ids to each row', () => {
      const rows = parseBulkText('A | 1 | szt | 10\nB | 2 | szt | 20');
      expect(rows[0].id).not.toBe(rows[1].id);
    });

    it('defaults missing unit to szt', () => {
      const rows = parseBulkText('Kafelki | 10 | 150'); // 3-col
      expect(rows[0].unit).toBe('szt');
    });
  });
});

describe('parsedRowsToLineItems', () => {
  it('filters out rows with name errors', () => {
    const rows = parseBulkText(
      'Kafelki | 10 | m² | 150\n | 5 | worek | 25'
    );
    const items = parsedRowsToLineItems(rows);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Kafelki');
  });

  it('filters out rows with price errors', () => {
    const rows = parseBulkText(
      'Kafelki | 10 | m² | 150\nGips | 5 | worek | abc'
    );
    const items = parsedRowsToLineItems(rows);
    expect(items).toHaveLength(1);
  });

  it('converts valid rows to BulkLineItems with correct fields', () => {
    const rows = parseBulkText('Kafelki | 10 | m² | 150');
    const items = parsedRowsToLineItems(rows);
    expect(items[0]).toMatchObject({
      name: 'Kafelki',
      qty: 10,
      unit: 'm²',
      price: 150,
    });
    expect(items[0].id).toBeTruthy();
  });

  it('assigns fresh ids (different from parsed row ids)', () => {
    const rows = parseBulkText('Kafelki | 10 | m² | 150');
    const items = parsedRowsToLineItems(rows);
    expect(items[0].id).not.toBe(rows[0].id);
  });

  it('returns empty array when all rows have errors', () => {
    const rows = parseBulkText(' | abc | m² | xyz');
    const items = parsedRowsToLineItems(rows);
    expect(items).toHaveLength(0);
  });
});
