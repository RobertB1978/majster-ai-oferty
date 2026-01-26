/**
 * VAT Calculation System
 * Polish VAT calculation engine supporting all valid rates (0%, 5%, 7%, 23%)
 */

import { POLISH_VAT_RATES, VATRate, VATCalculation, VATBreakdown } from '../types/invoices';
import type { InvoiceLineItem } from '../types/invoices';

// ============================================
// Single Item VAT Calculation
// ============================================

/**
 * Calculate VAT for a single item
 * @param netAmount - Amount without VAT
 * @param vatRate - VAT rate (0, 5, 7, 23)
 * @returns Object with net, vat, and gross amounts
 */
export function calculateVAT(netAmount: number, vatRate: VATRate): VATCalculation {
  if (!Object.values(POLISH_VAT_RATES).includes(vatRate)) {
    throw new Error(`Invalid VAT rate: ${vatRate}. Must be one of: 0, 5, 7, 23`);
  }

  const vatAmount = Number((netAmount * (vatRate / 100)).toFixed(2));
  const grossAmount = Number((netAmount + vatAmount).toFixed(2));

  return {
    netAmount: Number(netAmount.toFixed(2)),
    vatRate,
    vatAmount,
    grossAmount,
  };
}

/**
 * Calculate net amount from gross amount and VAT rate
 * Reverse calculation: gross / (1 + rate/100)
 */
export function calculateNetFromGross(grossAmount: number, vatRate: VATRate): VATCalculation {
  if (!Object.values(POLISH_VAT_RATES).includes(vatRate)) {
    throw new Error(`Invalid VAT rate: ${vatRate}`);
  }

  const divisor = 1 + vatRate / 100;
  const netAmount = Number((grossAmount / divisor).toFixed(2));
  const vatAmount = Number((grossAmount - netAmount).toFixed(2));

  return {
    netAmount,
    vatRate,
    vatAmount,
    grossAmount: Number(grossAmount.toFixed(2)),
  };
}

/**
 * Calculate line item totals
 * @param quantity - Item quantity
 * @param unitPrice - Price per unit
 * @param vatRate - VAT rate
 */
export function calculateLineItemTotals(
  quantity: number,
  unitPrice: number,
  vatRate: VATRate
): Omit<InvoiceLineItem, 'id' | 'description' | 'unit' | 'category' | 'notes' | 'itemOrder'> {
  const netAmount = Number((quantity * unitPrice).toFixed(2));
  const vat = calculateVAT(netAmount, vatRate);

  return {
    quantity: Number(quantity.toFixed(2)),
    unitPrice: Number(unitPrice.toFixed(2)),
    netAmount,
    vatRate,
    vatAmount: vat.vatAmount,
    grossAmount: vat.grossAmount,
  };
}

// ============================================
// Invoice Total Calculations
// ============================================

/**
 * Calculate invoice totals from line items
 * @param lineItems - Array of invoice line items
 * @param additionalCharges - Extra charges (shipping, handling, etc.)
 * @param discountAmount - Discount amount (if applying flat discount)
 * @returns Totals and VAT breakdown
 */
export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
  additionalCharges?: number,
  discountAmount?: number
): {
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  vatBreakdown: Record<VATRate, number>;
} {
  let netTotal = 0;
  let vatTotal = 0;
  const vatBreakdown: Record<VATRate, number> = {
    0: 0,
    5: 0,
    7: 0,
    23: 0,
  };

  // Sum up all line items
  lineItems.forEach(item => {
    netTotal += item.netAmount;
    vatTotal += item.vatAmount;
    vatBreakdown[item.vatRate] += item.vatAmount;
  });

  // Apply additional charges and discount
  const totalCharges = netTotal + (additionalCharges || 0);
  const finalNet = Math.max(0, totalCharges - (discountAmount || 0));

  // Recalculate VAT if discount is applied (proportional reduction)
  let finalVat = vatTotal;
  if (discountAmount && discountAmount > 0) {
    const discountRatio = discountAmount / netTotal;
    finalVat = Number((vatTotal * (1 - discountRatio)).toFixed(2));

    // Adjust VAT breakdown proportionally
    Object.keys(vatBreakdown).forEach(rate => {
      vatBreakdown[rate as unknown as VATRate] = Number(
        (vatBreakdown[rate as unknown as VATRate] * (1 - discountRatio)).toFixed(2)
      );
    });
  }

  return {
    netTotal: Number(finalNet.toFixed(2)),
    vatTotal: Number(finalVat.toFixed(2)),
    grossTotal: Number((finalNet + finalVat).toFixed(2)),
    vatBreakdown,
  };
}

/**
 * Generate detailed VAT breakdown by rate
 */
export function getVATBreakdown(lineItems: InvoiceLineItem[]): VATBreakdown {
  const breakdown: VATBreakdown = {
    0: { rate: 0, netAmount: 0, vatAmount: 0 },
    5: { rate: 5, netAmount: 0, vatAmount: 0 },
    7: { rate: 7, netAmount: 0, vatAmount: 0 },
    23: { rate: 23, netAmount: 0, vatAmount: 0 },
    total: { netAmount: 0, vatAmount: 0, grossAmount: 0 },
  };

  lineItems.forEach(item => {
    const rate = item.vatRate as VATRate;
    breakdown[rate].netAmount += item.netAmount;
    breakdown[rate].vatAmount += item.vatAmount;
    breakdown.total.netAmount += item.netAmount;
    breakdown.total.vatAmount += item.vatAmount;
  });

  breakdown.total.grossAmount = breakdown.total.netAmount + breakdown.total.vatAmount;

  // Round all values to 2 decimal places
  Object.keys(breakdown).forEach(key => {
    if (key !== 'total') {
      const rate = key as unknown as VATRate;
      breakdown[rate].netAmount = Number(breakdown[rate].netAmount.toFixed(2));
      breakdown[rate].vatAmount = Number(breakdown[rate].vatAmount.toFixed(2));
    }
  });

  breakdown.total.netAmount = Number(breakdown.total.netAmount.toFixed(2));
  breakdown.total.vatAmount = Number(breakdown.total.vatAmount.toFixed(2));
  breakdown.total.grossAmount = Number(breakdown.total.grossAmount.toFixed(2));

  return breakdown;
}

// ============================================
// VAT Validation
// ============================================

/**
 * Validate VAT rates and amounts in line items
 */
export function validateVATData(lineItems: InvoiceLineItem[]): string[] {
  const errors: string[] = [];
  const validRates = Object.values(POLISH_VAT_RATES);

  lineItems.forEach((item, index) => {
    // Check VAT rate
    if (!validRates.includes(item.vatRate)) {
      errors.push(`Line ${index + 1}: Invalid VAT rate "${item.vatRate}". Must be one of: 0%, 5%, 7%, 23%`);
    }

    // Check quantity
    if (item.quantity <= 0) {
      errors.push(`Line ${index + 1}: Quantity must be greater than 0`);
    }

    // Check price
    if (item.unitPrice < 0) {
      errors.push(`Line ${index + 1}: Unit price cannot be negative`);
    }

    // Verify amount calculations
    const calculatedNet = Number((item.quantity * item.unitPrice).toFixed(2));
    if (Math.abs(calculatedNet - item.netAmount) > 0.01) {
      errors.push(
        `Line ${index + 1}: Net amount mismatch. Expected ${calculatedNet}, got ${item.netAmount}`
      );
    }

    // Verify VAT calculations
    const expectedVat = Number((item.netAmount * (item.vatRate / 100)).toFixed(2));
    if (Math.abs(expectedVat - item.vatAmount) > 0.01) {
      errors.push(
        `Line ${index + 1}: VAT amount mismatch. Expected ${expectedVat}, got ${item.vatAmount}`
      );
    }

    // Verify gross amount
    const expectedGross = Number((item.netAmount + item.vatAmount).toFixed(2));
    if (Math.abs(expectedGross - item.grossAmount) > 0.01) {
      errors.push(
        `Line ${index + 1}: Gross amount mismatch. Expected ${expectedGross}, got ${item.grossAmount}`
      );
    }
  });

  return errors;
}

/**
 * Check if VAT rate is valid for Poland
 */
export function isValidVATRate(rate: unknown): rate is VATRate {
  return Object.values(POLISH_VAT_RATES).includes(rate as VATRate);
}

/**
 * Get VAT rate description in Polish
 */
export function getVATRateDescription(rate: VATRate): string {
  const descriptions: Record<VATRate, string> = {
    0: 'Zwolnione',
    5: 'Obniżona - Książki, prasę',
    7: 'Obniżona - Żywność, hotel',
    23: 'Standardowa',
  };
  return descriptions[rate] || 'Nieznane';
}

// ============================================
// Formatting
// ============================================

/**
 * Format amount as Polish currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format VAT percentage
 */
export function formatVATPercent(rate: VATRate): string {
  return `${rate}%`;
}

// ============================================
// Testing Helpers
// ============================================

/**
 * Create mock invoice line items for testing
 */
export function createMockLineItem(
  partial?: Partial<InvoiceLineItem>
): InvoiceLineItem {
  const defaults = {
    id: 'test-' + Math.random().toString(36).substr(2, 9),
    description: 'Test Item',
    quantity: 1,
    unit: 'szt.',
    unitPrice: 100,
    vatRate: 23 as VATRate,
    ...partial,
  };

  const netAmount = defaults.quantity * defaults.unitPrice;
  const vat = calculateVAT(netAmount, defaults.vatRate);

  return {
    ...defaults,
    netAmount: vat.netAmount,
    vatAmount: vat.vatAmount,
    grossAmount: vat.grossAmount,
  };
}
