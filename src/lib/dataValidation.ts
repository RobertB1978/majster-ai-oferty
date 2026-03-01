/**
 * Data Validation & Normalization Utilities
 * Sprint 4 - Production Readiness & Security Hardening
 *
 * Defensive data normalization to prevent invalid data from entering the system.
 */

/**
 * Normalizes price values to ensure they are non-negative
 * @param price - Raw price value
 * @param defaultValue - Fallback value if price is invalid (default: 0)
 * @returns Normalized price (>= 0)
 */
export function normalizePrice(price: number | string | null | undefined, defaultValue = 0): number {
  const parsed = typeof price === 'string' ? parseFloat(price) : price;

  if (typeof parsed !== 'number' || isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }

  return Math.max(0, parsed);
}

/**
 * Normalizes quantity values to ensure they are positive
 * @param qty - Raw quantity value
 * @param defaultValue - Fallback value if qty is invalid (default: 1)
 * @returns Normalized quantity (> 0)
 */
export function normalizeQuantity(qty: number | string | null | undefined, defaultValue = 1): number {
  const parsed = typeof qty === 'string' ? parseFloat(qty) : qty;

  if (typeof parsed !== 'number' || isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }

  return Math.max(0.01, parsed);
}

/**
 * Normalizes string values by trimming whitespace and handling nullish values
 * @param value - Raw string value
 * @param defaultValue - Fallback value if string is empty or nullish (default: '')
 * @param maxLength - Optional maximum length to truncate to
 * @returns Normalized string
 */
export function normalizeString(
  value: string | null | undefined,
  defaultValue = '',
  maxLength?: number
): string {
  if (value == null || typeof value !== 'string') {
    return defaultValue;
  }

  let normalized = value.trim();

  if (maxLength && normalized.length > maxLength) {
    normalized = normalized.slice(0, maxLength);
  }

  return normalized;
}

/**
 * Normalizes email addresses to lowercase and trimmed
 * @param email - Raw email value
 * @returns Normalized email or empty string if invalid
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
}

/**
 * Normalizes phone numbers by removing non-digit characters (except + at start)
 * @param phone - Raw phone value
 * @returns Normalized phone number
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  const trimmed = phone.trim();

  // Keep leading + for international format, remove all other non-digits
  const normalized = trimmed.startsWith('+')
    ? '+' + trimmed.slice(1).replace(/\D/g, '')
    : trimmed.replace(/\D/g, '');

  return normalized;
}

/**
 * Normalizes percentage values to ensure they are within 0-100 range
 * @param percent - Raw percentage value
 * @param defaultValue - Fallback value if invalid (default: 0)
 * @returns Normalized percentage (0-100)
 */
export function normalizePercentage(
  percent: number | string | null | undefined,
  defaultValue = 0
): number {
  const parsed = typeof percent === 'string' ? parseFloat(percent) : percent;

  if (typeof parsed !== 'number' || isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }

  return Math.max(0, Math.min(100, parsed));
}

/**
 * Normalizes date strings to ISO format
 * @param date - Raw date value
 * @returns ISO date string or null if invalid
 */
export function normalizeDate(date: string | Date | null | undefined): string | null {
  if (!date) return null;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return null;
    }

    return dateObj.toISOString();
  } catch {
    return null;
  }
}

/**
 * Sanitizes HTML to prevent XSS attacks (basic sanitization)
 * For display purposes only - React already escapes by default
 * @param html - Raw HTML string
 * @returns Sanitized string with dangerous tags removed
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized.trim();
}

/**
 * Normalizes quote/offer position data
 * Ensures all numeric values are valid and strings are trimmed
 */
export interface QuotePositionInput {
  name: string;
  qty: number | string;
  price: number | string;
  unit?: string;
  description?: string;
}

export interface NormalizedQuotePosition {
  name: string;
  qty: number;
  price: number;
  unit: string;
  description: string;
}

export function normalizeQuotePosition(position: QuotePositionInput): NormalizedQuotePosition {
  return {
    name: normalizeString(position.name, '', 200),
    qty: normalizeQuantity(position.qty),
    price: normalizePrice(position.price),
    unit: normalizeString(position.unit, 'szt.', 20),
    description: normalizeString(position.description, '', 500),
  };
}

/**
 * Normalizes profile data before saving
 */
export interface ProfileInput {
  company_name?: string;
  owner_name?: string;
  nip?: string;
  phone?: string;
  email_for_offers?: string;
  street?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  bank_account?: string;
  website?: string;
}

export interface NormalizedProfile {
  company_name?: string;
  owner_name?: string;
  nip?: string;
  phone?: string;
  email_for_offers?: string;
  street?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  bank_account?: string;
  website?: string;
}

export function normalizeProfileData(profile: ProfileInput): NormalizedProfile {
  const normalized: NormalizedProfile = {};

  if (profile.company_name !== undefined) {
    normalized.company_name = normalizeString(profile.company_name, '', 200);
  }

  if (profile.owner_name !== undefined) {
    normalized.owner_name = normalizeString(profile.owner_name, '', 200);
  }

  if (profile.nip !== undefined) {
    normalized.nip = normalizeString(profile.nip, '', 20).replace(/\D/g, '');
  }

  if (profile.phone !== undefined) {
    normalized.phone = normalizePhone(profile.phone);
  }

  if (profile.email_for_offers !== undefined) {
    normalized.email_for_offers = normalizeEmail(profile.email_for_offers);
  }

  if (profile.street !== undefined) {
    normalized.street = normalizeString(profile.street, '', 200);
  }

  if (profile.address_line2 !== undefined) {
    normalized.address_line2 = normalizeString(profile.address_line2, '', 200);
  }

  if (profile.city !== undefined) {
    normalized.city = normalizeString(profile.city, '', 100);
  }

  if (profile.postal_code !== undefined) {
    normalized.postal_code = normalizeString(profile.postal_code, '', 10);
  }

  if (profile.country !== undefined) {
    normalized.country = normalizeString(profile.country, '', 50);
  }

  if (profile.bank_account !== undefined) {
    normalized.bank_account = normalizeString(profile.bank_account, '', 50).replace(/\s/g, '');
  }

  if (profile.website !== undefined) {
    normalized.website = normalizeString(profile.website, '', 200);
  }

  return normalized;
}
