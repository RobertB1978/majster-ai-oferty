/**
 * Tests for htmlEscape utility (SEC-01 fix)
 * Ensures user data is properly escaped before insertion into HTML templates.
 *
 * Note: The actual function lives in supabase/functions/_shared/sanitization.ts (Deno).
 * This test validates the same logic in a Node/Vitest environment.
 */
import { describe, it, expect } from 'vitest';

// Replicate the htmlEscape function for testing (same logic as Deno version)
function htmlEscape(str: string | null | undefined): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

describe('htmlEscape', () => {
  it('should escape angle brackets', () => {
    expect(htmlEscape('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should escape ampersand', () => {
    expect(htmlEscape('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape quotes', () => {
    expect(htmlEscape('He said "hello"')).toBe('He said &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(htmlEscape("it's")).toBe('it&#039;s');
  });

  it('should handle null and undefined', () => {
    expect(htmlEscape(null)).toBe('');
    expect(htmlEscape(undefined)).toBe('');
  });

  it('should handle empty string', () => {
    expect(htmlEscape('')).toBe('');
  });

  it('should not modify safe strings', () => {
    expect(htmlEscape('Jan Kowalski')).toBe('Jan Kowalski');
  });

  it('should handle complex XSS attempts', () => {
    const malicious = '"><img src=x onerror=alert(1)>';
    const escaped = htmlEscape(malicious);
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).not.toContain('"');
  });
});
