import { describe, it, expect } from 'vitest';
import { computeTotalsForItems, computeTotals } from './useOfferWizard';
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
    const form: Pick<WizardFormData, 'items' | 'variants'> = {
      items: [makeItem({ qty: 1, unit_price_net: 100, vat_rate: 23 })],
      variants: [],
    };
    const result = computeTotals(form);
    expect(result.total_net).toBe(100);
    expect(result.total_gross).toBe(123);
  });

  it('uses FIRST variant items when variants exist', () => {
    const form: Pick<WizardFormData, 'items' | 'variants'> = {
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
    };
    const result = computeTotals(form);
    expect(result.total_net).toBe(200); // first variant, not second, not flat items
    expect(result.total_gross).toBe(246);
  });

  it('returns zero totals when variants exist but first variant has no items', () => {
    const form: Pick<WizardFormData, 'items' | 'variants'> = {
      items: [],
      variants: [{ localId: 'v1', dbId: null, label: 'Empty', items: [] }],
    };
    const result = computeTotals(form);
    expect(result).toEqual({ total_net: 0, total_vat: 0, total_gross: 0 });
  });
});
