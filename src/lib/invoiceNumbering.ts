/**
 * Invoice Numbering System
 * Generates and validates Polish invoice numbers in FV-YYYY-### format
 */

import type { InvoiceNumberSequence } from '../types/invoices';

// ============================================
// Number Generation
// ============================================

/**
 * Generate invoice number in format: PREFIX-YEAR-SEQUENCE
 * Example: FV-2026-001, FV-2026-002, etc.
 *
 * @param prefix - Invoice prefix (default: 'FV' for Faktura)
 * @param year - Year (e.g., 2026)
 * @param sequence - Sequential number (padded to 3 digits)
 * @returns Formatted invoice number
 */
export function generateInvoiceNumber(
  prefix: string = 'FV',
  year: number,
  sequence: number
): string {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error(`Invalid year: ${year}. Must be between 2000 and 2100`);
  }

  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error(`Invalid sequence: ${sequence}. Must be positive integer`);
  }

  if (!prefix || prefix.length === 0) {
    throw new Error('Prefix cannot be empty');
  }

  const paddedSequence = String(sequence).padStart(3, '0');
  return `${prefix}-${year}-${paddedSequence}`;
}

/**
 * Generate invoice number using custom format
 * Supports placeholders: {PREFIX}, {YEAR}, {SEQUENCE}, {YY} (2-digit year)
 *
 * @param format - Format string with placeholders
 * @param year - Year
 * @param sequence - Sequence number
 * @param prefix - Invoice prefix
 * @returns Formatted invoice number
 */
export function generateInvoiceNumberWithFormat(
  format: string,
  year: number,
  sequence: number,
  prefix: string = 'FV'
): string {
  const yy = String(year).slice(-2);
  const paddedSequence = String(sequence).padStart(3, '0');

  const result = format
    .replace('{PREFIX}', prefix)
    .replace('{YEAR}', String(year))
    .replace('{YY}', yy)
    .replace('{SEQUENCE}', paddedSequence);

  return result;
}

// ============================================
// Number Parsing
// ============================================

export interface ParsedInvoiceNumber {
  prefix: string;
  year: number;
  sequence: number;
  isValid: boolean;
}

/**
 * Parse invoice number into components
 * Supports formats: FV-2026-001, FV-26-001, etc.
 *
 * @param invoiceNumber - Invoice number to parse
 * @returns Parsed components or null if invalid
 */
export function parseInvoiceNumber(invoiceNumber: string): ParsedInvoiceNumber | null {
  if (!invoiceNumber || typeof invoiceNumber !== 'string') {
    return null;
  }

  // Match pattern: PREFIX-YEAR-SEQUENCE
  // PREFIX: 1-5 uppercase letters
  // YEAR: 2 or 4 digits
  // SEQUENCE: 1-5 digits
  const regex = /^([A-Z]+)-(\d{2,4})-(\d{1,5})$/;
  const match = invoiceNumber.match(regex);

  if (!match) {
    return null;
  }

  const prefix = match[1];
  let year = parseInt(match[2], 10);

  // If 2-digit year, assume 20XX
  if (year < 100) {
    year += 2000;
  }

  const sequence = parseInt(match[3], 10);

  return {
    prefix,
    year,
    sequence,
    isValid: year >= 2000 && year <= 2100 && sequence >= 1,
  };
}

/**
 * Validate invoice number format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  const parsed = parseInvoiceNumber(invoiceNumber);
  return parsed !== null && parsed.isValid;
}

// ============================================
// Sequence Management
// ============================================

/**
 * Get next invoice number based on last invoice
 * If no last invoice, starts from sequence 1
 * If last invoice is from different year, resets to 1
 *
 * @param lastInvoiceNumber - Last issued invoice number or null
 * @param prefix - Invoice prefix (default: 'FV')
 * @param currentYear - Current year
 * @returns Next invoice number
 */
export function getNextInvoiceNumber(
  lastInvoiceNumber: string | null,
  prefix: string = 'FV',
  currentYear: number
): string {
  // No last invoice - start from 1
  if (!lastInvoiceNumber) {
    return generateInvoiceNumber(prefix, currentYear, 1);
  }

  const parsed = parseInvoiceNumber(lastInvoiceNumber);

  // Invalid format - start fresh
  if (!parsed) {
    return generateInvoiceNumber(prefix, currentYear, 1);
  }

  // Different year - reset sequence
  if (parsed.year !== currentYear) {
    return generateInvoiceNumber(prefix, currentYear, 1);
  }

  // Same year - increment sequence
  return generateInvoiceNumber(prefix, currentYear, parsed.sequence + 1);
}

/**
 * Compare two invoice numbers by sequence
 * Returns: -1 if first < second, 0 if equal, 1 if first > second
 */
export function compareInvoiceNumbers(num1: string, num2: string): number {
  const parsed1 = parseInvoiceNumber(num1);
  const parsed2 = parseInvoiceNumber(num2);

  if (!parsed1 || !parsed2) {
    return 0;
  }

  if (parsed1.year !== parsed2.year) {
    return parsed1.year - parsed2.year;
  }

  return parsed1.sequence - parsed2.sequence;
}

// ============================================
// Sequence Validation
// ============================================

/**
 * Validate that invoice numbers are sequential within a year
 * Checks for gaps and duplicates
 *
 * @param invoiceNumbers - Array of invoice numbers to check
 * @returns Validation result
 */
export interface SequenceValidation {
  valid: boolean;
  gaps?: Array<{ expected: string; found: string | null }>;
  duplicates?: string[];
  errors: string[];
}

export function validateSequence(invoiceNumbers: string[]): SequenceValidation {
  const errors: string[] = [];
  const gaps: Array<{ expected: string; found: string | null }> = [];
  const duplicates: string[] = [];
  const parsed: Map<string, ParsedInvoiceNumber> = new Map();

  // Parse all numbers
  invoiceNumbers.forEach(num => {
    const p = parseInvoiceNumber(num);
    if (!p || !p.isValid) {
      errors.push(`Invalid invoice number: ${num}`);
      return;
    }

    const key = `${p.year}-${p.sequence}`;
    if (parsed.has(key)) {
      duplicates.push(num);
    }
    parsed.set(key, p);
  });

  // Check for gaps
  const byYear = new Map<number, ParsedInvoiceNumber[]>();
  parsed.forEach(p => {
    if (!byYear.has(p.year)) {
      byYear.set(p.year, []);
    }
    byYear.get(p.year)!.push(p);
  });

  byYear.forEach((yearNumbers, year) => {
    yearNumbers.sort((a, b) => a.sequence - b.sequence);

    for (let i = 1; i < yearNumbers[yearNumbers.length - 1].sequence; i++) {
      const found = yearNumbers.find(n => n.sequence === i);
      if (!found) {
        gaps.push({
          expected: generateInvoiceNumber('FV', year, i),
          found: null,
        });
      }
    }
  });

  return {
    valid: errors.length === 0 && gaps.length === 0 && duplicates.length === 0,
    gaps: gaps.length > 0 ? gaps : undefined,
    duplicates: duplicates.length > 0 ? duplicates : undefined,
    errors,
  };
}

// ============================================
// Formatting
// ============================================

/**
 * Format invoice number for display
 */
export function formatInvoiceNumberForDisplay(invoiceNumber: string): string {
  const parsed = parseInvoiceNumber(invoiceNumber);
  if (!parsed) {
    return invoiceNumber;
  }

  return `${parsed.prefix}/${parsed.year}/${String(parsed.sequence).padStart(3, '0')}`;
}

/**
 * Get human-readable description of invoice number
 */
export function getInvoiceNumberDescription(invoiceNumber: string): string {
  const parsed = parseInvoiceNumber(invoiceNumber);
  if (!parsed) {
    return 'Nieznany numer faktury';
  }

  return `Faktura nr ${parsed.prefix}-${parsed.year}-${String(parsed.sequence).padStart(3, '0')}`;
}

// ============================================
// Batch Operations
// ============================================

/**
 * Generate sequence of invoice numbers
 * Useful for initializing numbering system
 */
export function generateInvoiceNumberSequence(
  startYear: number,
  startSequence: number,
  count: number,
  prefix: string = 'FV'
): string[] {
  const numbers: string[] = [];
  let year = startYear;
  let sequence = startSequence;

  for (let i = 0; i < count; i++) {
    numbers.push(generateInvoiceNumber(prefix, year, sequence));
    sequence++;
  }

  return numbers;
}

// ============================================
// Helpers for Database Operations
// ============================================

/**
 * Get year from invoice number
 */
export function getYearFromInvoiceNumber(invoiceNumber: string): number | null {
  const parsed = parseInvoiceNumber(invoiceNumber);
  return parsed ? parsed.year : null;
}

/**
 * Get sequence from invoice number
 */
export function getSequenceFromInvoiceNumber(invoiceNumber: string): number | null {
  const parsed = parseInvoiceNumber(invoiceNumber);
  return parsed ? parsed.sequence : null;
}

/**
 * Build query to find next available sequence for year
 * Should be used with database query to find max sequence
 *
 * @param year - Year
 * @param prefix - Prefix filter
 * @returns Next sequence number (based on result + 1)
 */
export function getNextSequenceFromMaxFound(maxSequence: number | null, year: number): number {
  if (!maxSequence) {
    return 1;
  }

  return maxSequence + 1;
}

// ============================================
// Testing Helpers
// ============================================

/**
 * Generate random invoice number for testing
 */
export function generateTestInvoiceNumber(year?: number, prefix: string = 'FV'): string {
  const testYear = year || new Date().getFullYear();
  const randomSequence = Math.floor(Math.random() * 1000) + 1;
  return generateInvoiceNumber(prefix, testYear, randomSequence);
}

/**
 * Create mock invoice number sequence
 */
export function createMockInvoiceNumberSequence(
  partial?: Partial<InvoiceNumberSequence>
): InvoiceNumberSequence {
  const now = new Date().toISOString();
  return {
    id: 'test-' + Math.random().toString(36).substr(2, 9),
    user_id: 'test-user',
    year: new Date().getFullYear(),
    next_sequence: 1,
    prefix: 'FV',
    format: '{PREFIX}-{YEAR}-{SEQUENCE}',
    created_at: now,
    updated_at: now,
    ...partial,
  };
}
