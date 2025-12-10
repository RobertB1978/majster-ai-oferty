/**
 * Sanitization Utilities for Edge Functions
 * Sprint 5 - Production Hardening
 */

/**
 * Sanitizes HTML to prevent XSS attacks
 * Removes script tags, event handlers, and javascript: protocol
 * @param html - Raw HTML string
 * @returns Sanitized string with dangerous content removed
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized.trim();
}

/**
 * Sanitizes user input text (comments, descriptions)
 * @param text - Raw text input
 * @param maxLength - Maximum allowed length
 * @returns Sanitized and length-limited text
 */
export function sanitizeUserInput(
  text: string | null | undefined,
  maxLength = 1000
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // First sanitize HTML
  let sanitized = sanitizeHtml(text);

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
}

/**
 * Normalizes email to lowercase and trim
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
}
