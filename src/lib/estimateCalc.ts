/**
 * Pure calculation functions for Quick Estimate (Szybka wycena) pricing model.
 *
 * Supports:
 *  - Single price mode: one combined unit price
 *  - Split mode: separate labor (robocizna) + material (materiały) costs
 *  - Margin (marża) applied on top of base cost, per item
 *  - showMargin flag: when false margin is hidden from client view but ALWAYS included in totals
 */

import type { LineItem } from '@/components/quickEstimate/WorkspaceLineItems';

const VAT_RATE = 0.23;

/**
 * Net base price per unit before margin.
 *  - split mode: laborCost + materialCost
 *  - single mode: price
 */
export function itemBasePrice(item: LineItem): number {
  return item.priceMode === 'split'
    ? item.laborCost + item.materialCost
    : item.price;
}

/**
 * Net price per unit after margin is applied.
 * Margin is always applied regardless of showMargin flag.
 * showMargin controls display only, not calculation.
 */
export function itemUnitPrice(item: LineItem): number {
  const base = itemBasePrice(item);
  return base * (1 + item.marginPct / 100);
}

/**
 * Net total for the line: qty × unit price (with margin).
 */
export function itemLineTotal(item: LineItem): number {
  return item.qty * itemUnitPrice(item);
}

export interface EstimateTotals {
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
}

/**
 * Compute overall totals from all items.
 * Margin is ALWAYS included in netTotal even when showMargin === false.
 */
export function calcTotals(
  items: LineItem[],
  vatEnabled: boolean,
): EstimateTotals {
  const netTotal = items.reduce((sum, item) => sum + itemLineTotal(item), 0);
  const vatAmount = vatEnabled ? netTotal * VAT_RATE : 0;
  return { netTotal, vatAmount, grossTotal: netTotal + vatAmount };
}
