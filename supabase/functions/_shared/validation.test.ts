import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateUrl,
  type ValidationResult
} from './validation.ts';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'first+last@company.org',
        'admin@subdomain.example.com'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject non-string email', () => {
      const result = validateEmail(123);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email must be a string');
    });

    it('should reject null/undefined email', () => {
      const result1 = validateEmail(null);
      expect(result1.valid).toBe(false);

      const result2 = validateEmail(undefined);
      expect(result2.valid).toBe(false);
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject email with only whitespace', () => {
      const result = validateEmail('   ');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject email longer than 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      const result = validateEmail(longEmail);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email must be less than 255 characters');
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        'user@@example.com'
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid email format');
      });
    });
  });

  describe('validateUrl', () => {
    it('should accept valid HTTP URLs', () => {
      const validUrls = [
        'http://example.com',
        'https://www.example.com',
        'https://subdomain.example.com/path',
        'https://example.com:8080/path?query=value'
      ];

      validUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject non-string URL', () => {
      const result = validateUrl(123);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('URL must be a string');
    });

    it('should use custom field name in error messages', () => {
      const result = validateUrl(123, 'Frontend URL');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Frontend URL must be a string');
    });

    it('should reject empty URL', () => {
      const result = validateUrl('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('URL is required');
    });

    it('should reject URL with only whitespace', () => {
      const result = validateUrl('   ');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('URL is required');
    });

    it('should reject URL longer than 2048 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2050);
      const result = validateUrl(longUrl);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('URL must be less than 2048 characters');
    });

    it('should reject URLs without http/https protocol', () => {
      const invalidUrls = [
        'example.com',
        'ftp://example.com',
        'file:///path/to/file',
        'javascript:alert(1)'
      ];

      invalidUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('must start with http'))).toBe(true);
      });
    });

    it('should accept case-insensitive protocols', () => {
      const urls = [
        'HTTP://example.com',
        'HTTPS://example.com',
        'HtTpS://example.com'
      ];

      urls.forEach(url => {
        const result = validateUrl(url);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('ValidationResult type', () => {
    it('should have correct structure', () => {
      const result: ValidationResult = {
        valid: true,
        errors: []
      };

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.valid).toBe('boolean');
    });
  });
});
