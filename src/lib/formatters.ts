/**
 * Locale-aware currency, number and date formatting utilities.
 *
 * All public helpers accept an optional `locale` parameter (BCP-47 tag
 * such as 'pl', 'en', 'uk').  When omitted the default is 'pl'.
 *
 * These replace the previously hardcoded 'pl-PL' calls scattered across
 * the codebase (audit item P0).
 */

/** Map short i18n language keys to full BCP-47 locale tags. */
const LOCALE_MAP: Record<string, string> = {
  pl: 'pl-PL',
  en: 'en-GB',
  uk: 'uk-UA',
};

/** Resolve a short language key (e.g. 'pl') to a BCP-47 locale. */
export function resolveLocale(lang?: string): string {
  if (!lang) return 'pl-PL';
  return LOCALE_MAP[lang] ?? lang;
}

/**
 * Format a number as PLN currency.
 * @param amount - The amount to format
 * @param locale - BCP-47 locale or short language key (default: 'pl')
 * @returns Formatted currency string (e.g., "1 234,56 zł" for pl, "PLN 1,234.56" for en)
 */
export function formatCurrency(amount: number, locale?: string): string {
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: 'currency',
    currency: 'PLN',
  }).format(amount);
}

/**
 * Format a number with fixed decimal places.
 * @param amount - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - BCP-47 locale or short language key (default: 'pl')
 */
export function formatNumber(amount: number, decimals = 2, locale?: string): string {
  return new Intl.NumberFormat(resolveLocale(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format a number with no decimals (compact).
 */
export function formatNumberCompact(amount: number, locale?: string): string {
  return new Intl.NumberFormat(resolveLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format an ISO date string or Date object to a locale-appropriate date string.
 * @param date - ISO string or Date
 * @param locale - BCP-47 locale or short language key (default: 'pl')
 * @param options - Intl.DateTimeFormatOptions overrides
 */
export function formatDate(
  date: string | Date,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(resolveLocale(locale), options);
}

/**
 * Format an ISO date string or Date object to a locale-appropriate datetime string.
 */
export function formatDateTime(
  date: string | Date,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(resolveLocale(locale), options);
}

/**
 * Format a date with long month name (e.g. "14 marca 2026" or "March 14, 2026").
 */
export function formatDateLong(date: string | Date, locale?: string): string {
  return formatDate(date, locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Map stored Polish unit abbreviations to i18n keys.
 * DB values are Polish (backward compat), but display should be locale-aware.
 * Use with `t(`measurements.units.${unitToI18nKey(storedUnit)}`)`.
 */
const UNIT_KEY_MAP: Record<string, string> = {
  'szt.': 'pcs',
  'm²': 'm2',
  'm': 'm',
  'mb': 'mb',
  'kg': 'kg',
  'l': 'l',
  'worek': 'bag',
  'kpl.': 'set',
  'godz.': 'hrs',
  'dni': 'days',
  'm³': 'm3',
  // English/Ukrainian values also map to themselves
  'pcs': 'pcs',
  'm2': 'm2',
  'm3': 'm3',
  'bag': 'bag',
  'set': 'set',
  'hrs': 'hrs',
  'days': 'days',
};

/**
 * Convert a stored unit string to an i18n key for `measurements.units.*`.
 * Returns the original string if no mapping exists (graceful fallback).
 */
export function unitToI18nKey(unit: string): string {
  return UNIT_KEY_MAP[unit] ?? unit;
}
