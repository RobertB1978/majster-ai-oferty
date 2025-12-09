/**
 * Currency and number formatting utilities
 */

/**
 * Format a number as PLN currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "1 234,56 zł")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN'
  }).format(amount);
}
