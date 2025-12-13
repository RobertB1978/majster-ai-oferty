/**
 * Production-safe logger with automatic PII masking
 *
 * This logger automatically redacts sensitive information from logs to prevent
 * accidental exposure of Personally Identifiable Information (PII) in browser
 * console or log aggregation systems.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.log('User logged in:', { email, userId });  // email will be masked
 *
 * @see RUNTIME_HARDENING_REPORT_DELTA2.md - PATCH 7
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info';

/**
 * Regex patterns for detecting PII in strings
 */
const PII_PATTERNS = {
  // Email: user@example.com
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Polish phone: +48 123 456 789 or 123-456-789 or 123456789
  phone: /\b(\+?48\s?)?\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g,

  // Tokens: 20+ character alphanumeric strings (JWT, API keys, etc.)
  token: /\b[A-Za-z0-9_-]{20,}\b/g,

  // Credit card: 4-4-4-4 or 16 consecutive digits
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

  // Polish PESEL: 11 digits
  pesel: /\b\d{11}\b/g,

  // IP addresses (v4)
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

/**
 * Field names that should always be redacted
 */
const SENSITIVE_FIELD_NAMES = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authorization',
  'auth',
  'cookie',
  'session',
  'ssn',
  'pesel',
  'nip',
  'creditCard',
  'credit_card',
  'cvv',
  'pin',
  'privateKey',
  'private_key',
];

/**
 * Field names that may contain PII and should be partially masked
 */
const PII_FIELD_NAMES = [
  'email',
  'mail',
  'phone',
  'telephone',
  'mobile',
  'address',
  'street',
  'city',
  'zip',
  'postal',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'fullName',
  'full_name',
  'name',
];

/**
 * Masks PII in a string value
 */
function maskString(value: string): string {
  let masked = value;

  // Apply regex patterns
  masked = masked
    .replace(PII_PATTERNS.email, '[EMAIL_REDACTED]')
    .replace(PII_PATTERNS.phone, '[PHONE_REDACTED]')
    .replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]')
    .replace(PII_PATTERNS.pesel, '[PESEL_REDACTED]')
    .replace(PII_PATTERNS.token, '[TOKEN_REDACTED]')
    .replace(PII_PATTERNS.ipAddress, '[IP_REDACTED]');

  return masked;
}

/**
 * Recursively masks PII in any value
 */
function maskPII(value: any, depth = 0): any {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  // Handle null/undefined
  if (value == null) {
    return value;
  }

  // Handle strings
  if (typeof value === 'string') {
    return maskString(value);
  }

  // Handle numbers, booleans, functions
  if (typeof value !== 'object') {
    return value;
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value;
  }

  // Handle Error objects
  if (value instanceof Error) {
    return {
      name: value.name,
      message: maskString(value.message),
      stack: value.stack ? maskString(value.stack) : undefined,
    };
  }

  // Handle Arrays
  if (Array.isArray(value)) {
    return value.map(item => maskPII(item, depth + 1));
  }

  // Handle Objects
  const masked: Record<string, any> = {};
  for (const [key, val] of Object.entries(value)) {
    const lowerKey = key.toLowerCase();

    // Fully redact sensitive fields
    if (SENSITIVE_FIELD_NAMES.some(field => lowerKey.includes(field.toLowerCase()))) {
      masked[key] = '[REDACTED]';
      continue;
    }

    // Partially redact PII fields (show first/last char)
    if (PII_FIELD_NAMES.some(field => lowerKey.includes(field.toLowerCase()))) {
      if (typeof val === 'string' && val.length > 2) {
        masked[key] = `${val[0]}***${val[val.length - 1]}`;
      } else {
        masked[key] = '[REDACTED]';
      }
      continue;
    }

    // Recursively mask nested objects
    masked[key] = maskPII(val, depth + 1);
  }

  return masked;
}

/**
 * Determines if logging should be enabled
 * - Always enabled in development
 * - Can be explicitly enabled in production via VITE_ENABLE_LOGGING=true
 */
function shouldLog(): boolean {
  // Always log in development
  if (import.meta.env.MODE === 'development') {
    return true;
  }

  // In production, only log if explicitly enabled
  if (import.meta.env.VITE_ENABLE_LOGGING === 'true') {
    return true;
  }

  return false;
}

/**
 * Safe logger that masks PII before logging
 *
 * In production, logging is disabled by default unless VITE_ENABLE_LOGGING=true
 * In development, all logs are shown but PII is still masked for safety
 */
export const logger = {
  /**
   * Log general information (masked)
   */
  log: (...args: any[]) => {
    if (shouldLog()) {
      console.log(...args.map(maskPII));
    }
  },

  /**
   * Log warnings (masked)
   */
  warn: (...args: any[]) => {
    if (shouldLog()) {
      console.warn(...args.map(maskPII));
    }
  },

  /**
   * Log errors (masked)
   * Note: Always logs errors even in production for debugging
   */
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args.map(maskPII));
  },

  /**
   * Log informational messages (masked)
   */
  info: (...args: any[]) => {
    if (shouldLog()) {
      console.info(...args.map(maskPII));
    }
  },

  /**
   * Log debug information (masked, dev-only)
   */
  debug: (...args: any[]) => {
    if (import.meta.env.MODE === 'development') {
      console.debug(...args.map(maskPII));
    }
  },
};

/**
 * Re-export for convenience
 */
export default logger;
