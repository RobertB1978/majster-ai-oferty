// src/config/currency.ts
// Dual-currency display helper: PLN + EUR.
//
// Rate source: VITE_PLN_EUR_RATE env var (default 0.23).
// Display format:
//   PL locale  →  "49 zł • €11"
//   EN / UK    →  "€11 • 49 PLN"
//   Free (any) →  "Gratis" / "Free"

/** Fallback PLN→EUR rate when VITE_PLN_EUR_RATE is not set. */
export const DEFAULT_PLN_EUR_RATE = 0.23;

/** Returns the configured PLN→EUR rate, falling back to DEFAULT_PLN_EUR_RATE. */
export function getPlanEurRate(): number {
  const raw = import.meta.env?.VITE_PLN_EUR_RATE as string | undefined;
  const n = parseFloat(raw ?? '');
  return isNaN(n) ? DEFAULT_PLN_EUR_RATE : n;
}

/**
 * Formats a PLN price showing both PLN and EUR values.
 *
 * @param pricePLN - Price in Polish Zloty (0 = free).
 * @param lang     - BCP-47 language tag or i18n language string ('pl', 'en', 'uk', …).
 * @returns        Formatted dual-currency string.
 *
 * @example
 *   formatDualCurrency(49, 'pl')  // "49 zł • €11"
 *   formatDualCurrency(49, 'en')  // "€11 • 49 PLN"
 *   formatDualCurrency(0, 'pl')   // "Gratis"
 *   formatDualCurrency(0, 'en')   // "Free"
 */
export function formatDualCurrency(pricePLN: number, lang: string): string {
  if (pricePLN === 0) {
    return lang.startsWith('pl') ? 'Gratis' : 'Free';
  }
  const rate = getPlanEurRate();
  const priceEUR = Math.round(pricePLN * rate);
  if (lang.startsWith('pl')) {
    return `${pricePLN} zł • €${priceEUR}`;
  }
  // EN, UK — EUR primary
  return `€${priceEUR} • ${pricePLN} PLN`;
}
