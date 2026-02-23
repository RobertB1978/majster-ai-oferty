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

/**
 * Sanitizes AI-generated text output before returning it to clients.
 *
 * This is defense-in-depth: React JSX already auto-escapes text on the
 * frontend, but stripping HTML here ensures no markup survives in stored
 * chat history or structured response fields regardless of render path.
 *
 * Strips ALL HTML/XML tags (not just dangerous ones), removes javascript:
 * and data: URI schemes, and enforces a maximum length.
 *
 * @param text - Raw AI output string
 * @param maxLength - Maximum allowed length (default 10 000 chars)
 * @returns Plain-text string safe for storage and rendering
 */
export function sanitizeAiOutput(
  text: string | null | undefined,
  maxLength = 10000
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Strip ALL HTML/XML tags iteratively until stable.
  // A single-pass replace can leave behind partial tags when input contains
  // nested/overlapping sequences like `<scr<script>ipt>`.  Looping ensures
  // no tag remnants survive (CodeQL: incomplete-multi-char-sanitization).
  let sanitized = text;
  let prev: string;
  do {
    prev = sanitized;
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } while (sanitized !== prev);

  // Remove dangerous URI schemes.  All three variants are stripped to prevent
  // XSS via href/src attributes that survive tag-stripping, including the
  // vbscript: scheme omitted by the original check
  // (CodeQL: incomplete-url-scheme-check).
  sanitized = sanitized.replace(/(?:javascript|vbscript|data):[^\s]*/gi, '');

  // Enforce length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
}
