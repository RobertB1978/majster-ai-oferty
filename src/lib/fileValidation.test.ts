// ============================================
// FILE VALIDATION TESTS
// Phase 2 - B2 File Validation
// ============================================

import { describe, it, expect } from 'vitest';
import { validateFile, FILE_VALIDATION_CONFIGS } from './fileValidation';

describe('fileValidation', () => {
  describe('Logo validation', () => {
    it('should accept valid PNG logo under 2MB', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject logo over 2MB', () => {
      const file = new File([new ArrayBuffer(3 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('za duży');
    });

    it('should reject wrong MIME type', () => {
      const file = new File([new ArrayBuffer(1024)], 'logo.txt', {
        type: 'text/plain',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Nieprawidłowy typ pliku');
    });

    it('should accept JPEG logo', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.jpg', {
        type: 'image/jpeg',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });
  });

  describe('Document validation', () => {
    it('should accept valid PDF under 10MB', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'document.pdf', {
        type: 'application/pdf',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.document);
      expect(result.valid).toBe(true);
    });

    it('should reject document over 10MB', () => {
      const file = new File([new ArrayBuffer(11 * 1024 * 1024)], 'document.pdf', {
        type: 'application/pdf',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.document);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('za duży');
    });

    it('should accept DOC file', () => {
      const file = new File([new ArrayBuffer(1024)], 'document.doc', {
        type: 'application/msword',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.document);
      expect(result.valid).toBe(true);
    });
  });

  describe('Photo validation', () => {
    it('should accept valid photo under 15MB', () => {
      const file = new File([new ArrayBuffer(10 * 1024 * 1024)], 'photo.jpg', {
        type: 'image/jpeg',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.photo);
      expect(result.valid).toBe(true);
    });

    it('should reject photo over 15MB', () => {
      const file = new File([new ArrayBuffer(16 * 1024 * 1024)], 'photo.jpg', {
        type: 'image/jpeg',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.photo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('za duży');
    });
  });

  describe('Invoice validation', () => {
    it('should accept valid PDF invoice', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'invoice.pdf', {
        type: 'application/pdf',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.invoice);
      expect(result.valid).toBe(true);
    });

    it('should accept photo of invoice', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'invoice.jpg', {
        type: 'image/jpeg',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.invoice);
      expect(result.valid).toBe(true);
    });
  });

  describe('Dangerous file detection', () => {
    it('should reject executable files', () => {
      const file = new File([new ArrayBuffer(1024)], 'malware.exe', {
        type: 'application/x-msdownload',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('zabroniony ze względów bezpieczeństwa');
    });

    it('should reject .js files', () => {
      const file = new File([new ArrayBuffer(1024)], 'script.js', {
        type: 'application/javascript',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('zabroniony ze względów bezpieczeństwa');
    });

    it('should reject .bat files', () => {
      const file = new File([new ArrayBuffer(1024)], 'script.bat', {
        type: 'application/x-bat',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('zabroniony ze względów bezpieczeństwa');
    });
  });

  describe('Extension validation', () => {
    it('should reject file with wrong extension even if MIME type matches', () => {
      const file = new File([new ArrayBuffer(1024)], 'image.txt', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Nieprawidłowe rozszerzenie');
    });

    it('should accept file with correct extension and MIME type', () => {
      const file = new File([new ArrayBuffer(1024)], 'logo.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });
  });
});
