import { describe, it, expect } from 'vitest';
import {
  computeTotalsForItems,
  computeTotals,
  applyMargin,
  clampMarginPercent,
} from './useOfferWizard';
import type { WizardItem, WizardFormData } from './useOfferWizard';

const makeItem = (overrides: Partial<WizardItem> = {}): WizardItem => ({
  localId: 'test-id',
  dbId: null,
  name: 'Test item',
  unit: 'm²',
  qty: 1,
  unit_price_net: 100,
  vat_rate: 23,
  item_type: 'material',
  ...overrides,
});

describe('computeTotalsForItems', () => {
  it('returns zero totals for empty array', () => {
    const result = computeTotalsForItems([]);
    expect(result).toEqual({ total_net: 0, total_vat: 0, total_gross: 0 });
  });

  it('computes single item with 23% VAT', () => {
    const result = computeTotalsForItems([makeItem({ qty: 1, unit_price_net: 100, vat_rate: 23 })]);
    expect(result.total_net).toBe(100);
    expect(result.total_vat).toBe(23);
    expect(result.total_gross).toBe(123);
  });

  it('computes single item with 8% VAT', () => {
    const result = computeTotalsForItems([makeItem({ qty: 1, unit_price_net: 200, vat_rate: 8 })]);
    expect(result.total_net).toBe(200);
    expect(result.total_vat).toBe(16);
    expect(result.total_gross).toBe(216);
  });

  it('computes single item with null VAT rate (0% effective)', () => {
    const result = computeTotalsForItems([makeItem({ qty: 1, unit_price_net: 100, vat_rate: null })]);
    expect(result.total_net).toBe(100);
    expect(result.total_vat).toBe(0);
    expect(result.total_gross).toBe(100);
  });

  it('computes single item with 0% VAT', () => {
    const result = computeTotalsForItems([makeItem({ qty: 1, unit_price_net: 100, vat_rate: 0 })]);
    expect(result.total_net).toBe(100);
    expect(result.total_vat).toBe(0);
    expect(result.total_gross).toBe(100);
  });

  it('multiplies qty by unit_price_net', () => {
    const result = computeTotalsForItems([makeItem({ qty: 5, unit_price_net: 40, vat_rate: 23 })]);
    expect(result.total_net).toBe(200);
    expect(result.total_vat).toBe(46);
    expect(result.total_gross).toBe(246);
  });

  it('sums multiple items correctly', () => {
    const items = [
      makeItem({ qty: 2, unit_price_net: 100, vat_rate: 23 }),
      makeItem({ qty: 1, unit_price_net: 50, vat_rate: 8 }),
    ];
    const result = computeTotalsForItems(items);
    expect(result.total_net).toBe(250);
    expect(result.total_vat).toBeCloseTo(46 + 4, 5);
    expect(result.total_gross).toBeCloseTo(300, 5);
  });

  it('rounds to 2 decimal places', () => {
    const result = computeTotalsForItems([makeItem({ qty: 1, unit_price_net: 10.005, vat_rate: 23 })]);
    expect(result.total_net).toBe(10.01);
  });

  it('handles fractional quantities', () => {
    const result = computeTotalsForItems([makeItem({ qty: 2.5, unit_price_net: 100, vat_rate: 23 })]);
    expect(result.total_net).toBe(250);
    expect(result.total_vat).toBe(57.5);
    expect(result.total_gross).toBe(307.5);
  });
});

describe('computeTotals', () => {
  it('uses flat items when no variants', () => {
    const form: Pick<WizardFormData, 'items' | 'variants' | 'marginPercent'> = {
      items: [makeItem({ qty: 1, unit_price_net: 100, vat_rate: 23 })],
      variants: [],
      marginPercent: 0,
    };
    const result = computeTotals(form);
    expect(result.total_net).toBe(100);
    expect(result.total_gross).toBe(123);
  });

  it('uses FIRST variant items when variants exist', () => {
    const form: Pick<WizardFormData, 'items' | 'variants' | 'marginPercent'> = {
      items: [makeItem({ unit_price_net: 999 })], // ignored when variants present
      variants: [
        {
          localId: 'v1',
          dbId: null,
          label: 'Wariant A',
          items: [makeItem({ qty: 1, unit_price_net: 200, vat_rate: 23 })],
        },
        {
          localId: 'v2',
          dbId: null,
          label: 'Wariant B',
          items: [makeItem({ qty: 1, unit_price_net: 300, vat_rate: 23 })],
        },
      ],
      marginPercent: 0,
    };
    const result = computeTotals(form);
    expect(result.total_net).toBe(200); // first variant, not second, not flat items
    expect(result.total_gross).toBe(246);
  });

  it('returns zero totals when variants exist but first variant has no items', () => {
    const form: Pick<WizardFormData, 'items' | 'variants' | 'marginPercent'> = {
      items: [],
      variants: [{ localId: 'v1', dbId: null, label: 'Empty', items: [] }],
      marginPercent: 0,
    };
    const result = computeTotals(form);
    expect(result).toEqual({ total_net: 0, total_vat: 0, total_gross: 0 });
  });

  // ── PR-FIN-10: offer-level margin ──────────────────────────────────────────
  it('applies margin to flat items (no-variant mode)', () => {
    const form: Pick<WizardFormData, 'items' | 'variants' | 'marginPercent'> = {
      items: [makeItem({ qty: 1, unit_price_net: 100, vat_rate: 23 })],
      variants: [],
      marginPercent: 20,
    };
    const result = computeTotals(form);
    // Net 100 × 1.20 = 120; VAT 23 × 1.20 = 27.6; Gross = 147.6
    expect(result.total_net).toBe(120);
    expect(result.total_vat).toBe(27.6);
    expect(result.total_gross).toBe(147.6);
  });

  it('applies margin to first variant in variant mode', () => {
    const form: Pick<WizardFormData, 'items' | 'variants' | 'marginPercent'> = {
      items: [],
      variants: [
        {
          localId: 'v1',
          dbId: null,
          label: 'A',
          items: [makeItem({ qty: 1, unit_price_net: 200, vat_rate: 23 })],
        },
      ],
      marginPercent: 10,
    };
    const result = computeTotals(form);
    // Net 200 × 1.10 = 220; VAT 46 × 1.10 = 50.6; Gross = 270.6
    expect(result.total_net).toBe(220);
    expect(result.total_vat).toBe(50.6);
    expect(result.total_gross).toBe(270.6);
  });

  it('margin = 0 leaves totals unchanged (legacy behaviour)', () => {
    const form: Pick<WizardFormData, 'items' | 'variants' | 'marginPercent'> = {
      items: [makeItem({ qty: 2, unit_price_net: 100, vat_rate: 23 })],
      variants: [],
      marginPercent: 0,
    };
    const result = computeTotals(form);
    expect(result.total_net).toBe(200);
    expect(result.total_vat).toBe(46);
    expect(result.total_gross).toBe(246);
  });

  it('margin works with VAT-exempt items (vat_rate = null)', () => {
    const form: Pick<WizardFormData, 'items' | 'variants' | 'marginPercent'> = {
      items: [makeItem({ qty: 1, unit_price_net: 100, vat_rate: null })],
      variants: [],
      marginPercent: 25,
    };
    const result = computeTotals(form);
    expect(result.total_net).toBe(125);
    expect(result.total_vat).toBe(0);
    expect(result.total_gross).toBe(125);
  });
});

describe('clampMarginPercent', () => {
  it('clamps negative to 0', () => {
    expect(clampMarginPercent(-5)).toBe(0);
  });

  it('clamps above 100 to 100', () => {
    expect(clampMarginPercent(250)).toBe(100);
  });

  it('passes through valid value', () => {
    expect(clampMarginPercent(35)).toBe(35);
  });

  it('handles 0', () => {
    expect(clampMarginPercent(0)).toBe(0);
  });

  it('handles 100', () => {
    expect(clampMarginPercent(100)).toBe(100);
  });

  it('returns 0 for null / undefined / NaN', () => {
    expect(clampMarginPercent(null)).toBe(0);
    expect(clampMarginPercent(undefined)).toBe(0);
    expect(clampMarginPercent(NaN)).toBe(0);
  });
});

describe('applyMargin', () => {
  it('with margin = 0 returns input unchanged', () => {
    const result = applyMargin({ total_net: 100, total_vat: 23, total_gross: 123 }, 0);
    expect(result).toEqual({ total_net: 100, total_vat: 23, total_gross: 123 });
  });

  it('with margin = 20 scales net + VAT proportionally', () => {
    const result = applyMargin({ total_net: 100, total_vat: 23, total_gross: 123 }, 20);
    expect(result.total_net).toBe(120);
    expect(result.total_vat).toBe(27.6);
    expect(result.total_gross).toBe(147.6);
  });

  it('with margin = 100 doubles the totals', () => {
    const result = applyMargin({ total_net: 50, total_vat: 4, total_gross: 54 }, 100);
    expect(result.total_net).toBe(100);
    expect(result.total_vat).toBe(8);
    expect(result.total_gross).toBe(108);
  });

  it('clamps out-of-range margin (negative ignored, treated as 0)', () => {
    const result = applyMargin({ total_net: 100, total_vat: 23, total_gross: 123 }, -10);
    expect(result.total_net).toBe(100);
  });

  it('clamps margin above 100', () => {
    const result = applyMargin({ total_net: 100, total_vat: 0, total_gross: 100 }, 999);
    // clamped to 100% → factor 2 → net 200
    expect(result.total_net).toBe(200);
  });

  it('handles VAT-exempt totals (total_vat = 0)', () => {
    const result = applyMargin({ total_net: 200, total_vat: 0, total_gross: 200 }, 15);
    expect(result.total_net).toBe(230);
    expect(result.total_vat).toBe(0);
    expect(result.total_gross).toBe(230);
  });

  it('rounds to 2 decimal places', () => {
    // 33.33 × 1.07 = 35.6631 → 35.66
    const result = applyMargin({ total_net: 33.33, total_vat: 0, total_gross: 33.33 }, 7);
    expect(result.total_net).toBe(35.66);
    expect(result.total_gross).toBe(35.66);
  });
});
