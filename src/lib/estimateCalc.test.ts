import { describe, it, expect } from 'vitest';
import {
  itemBasePrice,
  itemUnitPrice,
  itemLineTotal,
  calcTotals,
} from './estimateCalc';
import type { LineItem } from '@/components/quickEstimate/WorkspaceLineItems';

/* ── helpers ─────────────────────────────────────────────────── */

function makeItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'test-id',
    name: 'Test item',
    qty: 1,
    unit: 'szt',
    priceMode: 'single',
    price: 100,
    laborCost: 0,
    materialCost: 0,
    marginPct: 0,
    showMargin: true,
    itemType: 'service',
    ...overrides,
  };
}

/* ── itemBasePrice ───────────────────────────────────────────── */

describe('itemBasePrice', () => {
  it('returns price in single mode', () => {
    const item = makeItem({ priceMode: 'single', price: 200 });
    expect(itemBasePrice(item)).toBe(200);
  });

  it('returns laborCost + materialCost in split mode', () => {
    const item = makeItem({
      priceMode: 'split',
      laborCost: 80,
      materialCost: 120,
    });
    expect(itemBasePrice(item)).toBe(200);
  });

  it('returns 0 when split mode with zero costs', () => {
    const item = makeItem({ priceMode: 'split', laborCost: 0, materialCost: 0 });
    expect(itemBasePrice(item)).toBe(0);
  });

  it('ignores split costs when in single mode', () => {
    const item = makeItem({
      priceMode: 'single',
      price: 50,
      laborCost: 999,
      materialCost: 999,
    });
    expect(itemBasePrice(item)).toBe(50);
  });
});

/* ── itemUnitPrice ───────────────────────────────────────────── */

describe('itemUnitPrice', () => {
  it('returns base price when margin is 0', () => {
    const item = makeItem({ price: 100, marginPct: 0 });
    expect(itemUnitPrice(item)).toBe(100);
  });

  it('applies 20% margin correctly', () => {
    const item = makeItem({ price: 100, marginPct: 20 });
    expect(itemUnitPrice(item)).toBeCloseTo(120);
  });

  it('applies margin regardless of showMargin flag (hidden margin still applied)', () => {
    const itemVisible = makeItem({ price: 100, marginPct: 25, showMargin: true });
    const itemHidden = makeItem({ price: 100, marginPct: 25, showMargin: false });
    // Both must produce the same unit price
    expect(itemUnitPrice(itemHidden)).toBeCloseTo(itemUnitPrice(itemVisible));
    expect(itemUnitPrice(itemHidden)).toBeCloseTo(125);
  });

  it('applies margin on split base cost', () => {
    const item = makeItem({
      priceMode: 'split',
      laborCost: 60,
      materialCost: 40,
      marginPct: 10,
    });
    // base = 100, margin 10% → 110
    expect(itemUnitPrice(item)).toBeCloseTo(110);
  });
});

/* ── itemLineTotal ───────────────────────────────────────────── */

describe('itemLineTotal', () => {
  it('multiplies qty by unit price with margin', () => {
    const item = makeItem({ qty: 5, price: 100, marginPct: 20 });
    // unit price = 120, total = 600
    expect(itemLineTotal(item)).toBeCloseTo(600);
  });

  it('returns 0 for zero qty', () => {
    const item = makeItem({ qty: 0, price: 100, marginPct: 50 });
    expect(itemLineTotal(item)).toBe(0);
  });

  it('works with decimal qty', () => {
    const item = makeItem({ qty: 2.5, price: 80, marginPct: 0 });
    expect(itemLineTotal(item)).toBeCloseTo(200);
  });

  it('includes hidden margin in total', () => {
    const itemVisible = makeItem({ qty: 2, price: 100, marginPct: 15, showMargin: true });
    const itemHidden = makeItem({ qty: 2, price: 100, marginPct: 15, showMargin: false });
    expect(itemLineTotal(itemHidden)).toBeCloseTo(itemLineTotal(itemVisible));
    expect(itemLineTotal(itemHidden)).toBeCloseTo(230);
  });
});

/* ── calcTotals ──────────────────────────────────────────────── */

describe('calcTotals', () => {
  it('sums all item line totals for netTotal', () => {
    const items = [
      makeItem({ qty: 1, price: 100 }),
      makeItem({ qty: 2, price: 50 }),
    ];
    const { netTotal } = calcTotals(items, false);
    expect(netTotal).toBeCloseTo(200);
  });

  it('adds 23% VAT when vatEnabled', () => {
    const items = [makeItem({ qty: 1, price: 100 })];
    const { netTotal, vatAmount, grossTotal } = calcTotals(items, true);
    expect(netTotal).toBeCloseTo(100);
    expect(vatAmount).toBeCloseTo(23);
    expect(grossTotal).toBeCloseTo(123);
  });

  it('applies no VAT when vatEnabled is false', () => {
    const items = [makeItem({ qty: 1, price: 100 })];
    const { vatAmount, grossTotal } = calcTotals(items, false);
    expect(vatAmount).toBe(0);
    expect(grossTotal).toBeCloseTo(100);
  });

  it('hidden-margin items still affect netTotal', () => {
    const itemNoMargin = makeItem({ qty: 1, price: 100, marginPct: 0 });
    const itemHiddenMargin = makeItem({ qty: 1, price: 100, marginPct: 20, showMargin: false });
    const { netTotal } = calcTotals([itemNoMargin, itemHiddenMargin], false);
    // 100 + 120 = 220
    expect(netTotal).toBeCloseTo(220);
  });

  it('returns zero totals for empty items list', () => {
    const { netTotal, vatAmount, grossTotal } = calcTotals([], true);
    expect(netTotal).toBe(0);
    expect(vatAmount).toBe(0);
    expect(grossTotal).toBe(0);
  });

  it('works with mixed single and split items', () => {
    const items = [
      makeItem({ priceMode: 'single', price: 100, marginPct: 0 }),
      makeItem({
        priceMode: 'split',
        laborCost: 50,
        materialCost: 50,
        marginPct: 0,
      }),
    ];
    const { netTotal } = calcTotals(items, false);
    expect(netTotal).toBeCloseTo(200);
  });

  it('applies margin to both single and split items in totals', () => {
    const items = [
      makeItem({ priceMode: 'single', price: 100, marginPct: 10 }),
      makeItem({
        priceMode: 'split',
        laborCost: 40,
        materialCost: 60,
        marginPct: 10,
      }),
    ];
    // item1: 100 * 1.10 = 110; item2: 100 * 1.10 = 110; total = 220
    const { netTotal } = calcTotals(items, false);
    expect(netTotal).toBeCloseTo(220);
  });
});
