// ============================================
// FILE VALIDATION TESTS - COMPREHENSIVE
// Phase 2 - B2 File Validation
// ============================================

import { describe, it, expect } from 'vitest';
import { validateFile, FILE_VALIDATION_CONFIGS } from './fileValidation';

describe('fileValidation - Comprehensive Tests', () => {
  describe('Logo validation', () => {
    it('should accept valid PNG logo under 2MB', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid JPEG logo', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.jpg', {
        type: 'image/jpeg',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });

    it('should accept valid JPG with alternate type', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.jpg', {
        type: 'image/jpg',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });

    it('should accept valid WEBP logo', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'logo.webp', {
        type: 'image/webp',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });

    it('should reject logo over 2MB', () => {
      const file = new File([new ArrayBuffer(3 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('za duży');
      expect(result.error).toContain('2.0 MB');
    });

    it('should reject wrong MIME type', () => {
      const file = new File([new ArrayBuffer(1024)], 'logo.txt', {
        type: 'text/plain',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Nieprawidłowy typ pliku');
    });

    it('should reject wrong extension even with correct MIME', () => {
      const file = new File([new ArrayBuffer(1024)], 'logo.gif', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Nieprawidłowe rozszerzenie');
    });

    it('should accept file at exact size limit', () => {
      const file = new File([new ArrayBuffer(2 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });

    it('should reject file one byte over limit', () => {
      const file = new File([new ArrayBuffer(2 * 1024 * 1024 + 1)], 'logo.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('za duży');
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

    it('should accept PNG document', () => {
      const file = new File([new ArrayBuffer(1024)], 'scan.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.document);
      expect(result.valid).toBe(true);
    });

    it('should accept JPEG document', () => {
      const file = new File([new ArrayBuffer(1024)], 'scan.jpg', {
        type: 'image/jpeg',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.document);
      expect(result.valid).toBe(true);
    });

    it('should accept DOC file', () => {
      const file = new File([new ArrayBuffer(1024)], 'document.doc', {
        type: 'application/msword',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.document);
      expect(result.valid).toBe(true);
    });

    it('should accept DOCX file', () => {
      const file = new File([new ArrayBuffer(1024)], 'document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
      expect(result.error).toContain('10.0 MB');
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

    it('should accept HEIC format', () => {
      const file = new File([new ArrayBuffer(1024)], 'photo.heic', {
        type: 'image/heic',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.photo);
      expect(result.valid).toBe(true);
    });

    it('should accept WEBP photo', () => {
      const file = new File([new ArrayBuffer(1024)], 'photo.webp', {
        type: 'image/webp',
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
      expect(result.error).toContain('15.0 MB');
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

    it('should accept PNG invoice scan', () => {
      const file = new File([new ArrayBuffer(1024)], 'invoice.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.invoice);
      expect(result.valid).toBe(true);
    });
  });

  describe('Dangerous file detection', () => {
    it('should reject .exe files', () => {
      const file = new File([new ArrayBuffer(1024)], 'malware.exe', {
        type: 'application/x-msdownload',
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

    it('should reject .cmd files', () => {
      const file = new File([new ArrayBuffer(1024)], 'script.cmd', {
        type: 'application/x-cmd',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.document);
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

    it('should reject .vbs files', () => {
      const file = new File([new ArrayBuffer(1024)], 'script.vbs', {
        type: 'application/x-vbscript',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
    });

    it('should reject .sh files', () => {
      const file = new File([new ArrayBuffer(1024)], 'script.sh', {
        type: 'application/x-sh',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
    });

    it('should reject .ps1 PowerShell files', () => {
      const file = new File([new ArrayBuffer(1024)], 'script.ps1', {
        type: 'application/x-powershell',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
    });

    it('should reject .dll files', () => {
      const file = new File([new ArrayBuffer(1024)], 'library.dll', {
        type: 'application/x-msdownload',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
    });

    it('should reject .msi installer files', () => {
      const file = new File([new ArrayBuffer(1024)], 'installer.msi', {
        type: 'application/x-msi',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
    });

    it('should handle uppercase extensions', () => {
      const file = new File([new ArrayBuffer(1024)], 'MALWARE.EXE', {
        type: 'application/x-msdownload',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('zabroniony ze względów bezpieczeństwa');
    });

    it('should handle mixed case extensions', () => {
      const file = new File([new ArrayBuffer(1024)], 'Script.Js', {
        type: 'application/javascript',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
    });
  });

  describe('Extension validation edge cases', () => {
    it('should reject file with no extension', () => {
      const file = new File([new ArrayBuffer(1024)], 'noextension', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Nieprawidłowe rozszerzenie');
    });

    it('should handle file with multiple dots', () => {
      const file = new File([new ArrayBuffer(1024)], 'my.logo.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });

    it('should handle file starting with dot', () => {
      const file = new File([new ArrayBuffer(1024)], '.hidden.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });
  });

  describe('File size edge cases', () => {
    it('should accept very small file (1 byte)', () => {
      const file = new File([new ArrayBuffer(1)], 'tiny.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });

    it('should accept empty file (0 bytes)', () => {
      const file = new File([new ArrayBuffer(0)], 'empty.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });

    it('should format KB sizes correctly', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024 + 1)], 'large.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MB');
    });

    it('should handle exact boundary sizes', () => {
      const file = new File([new ArrayBuffer(1024)], 'exactly1kb.png', {
        type: 'image/png',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(true);
    });
  });

  describe('MIME type validation', () => {
    it('should reject incorrect MIME type for logo', () => {
      const file = new File([new ArrayBuffer(1024)], 'doc.png', {
        type: 'application/pdf',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Nieprawidłowy typ pliku');
    });

    it('should show allowed extensions in error', () => {
      const file = new File([new ArrayBuffer(1024)], 'wrong.gif', {
        type: 'image/gif',
      });
      const result = validateFile(file, FILE_VALIDATION_CONFIGS.logo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('.PNG');
      expect(result.error).toContain('.JPG');
    });

    it('should accept all configured MIME types for documents', () => {
      const mimeTypes = [
        { name: 'doc.pdf', type: 'application/pdf' },
        { name: 'scan.png', type: 'image/png' },
        { name: 'scan.jpg', type: 'image/jpeg' },
        { name: 'doc.doc', type: 'application/msword' },
        { name: 'doc.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      ];

      mimeTypes.forEach(({ name, type }) => {
        const file = new File([new ArrayBuffer(1024)], name, { type });
        const result = validateFile(file, FILE_VALIDATION_CONFIGS.document);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Configuration object validation', () => {
    it('should respect custom label in error messages', () => {
      const customConfig = {
        ...FILE_VALIDATION_CONFIGS.logo,
        label: 'Custom Label',
      };
      const file = new File([new ArrayBuffer(10 * 1024 * 1024)], 'big.png', {
        type: 'image/png',
      });
      const result = validateFile(file, customConfig);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Custom Label');
    });

    it('should work with all predefined configs', () => {
      const configs = [
        FILE_VALIDATION_CONFIGS.logo,
        FILE_VALIDATION_CONFIGS.document,
        FILE_VALIDATION_CONFIGS.photo,
        FILE_VALIDATION_CONFIGS.invoice,
      ];

      configs.forEach(config => {
        const file = new File([new ArrayBuffer(1024)], 'test.png', {
          type: 'image/png',
        });
        const result = validateFile(file, config);
        // Should not throw, and should return a result
        expect(result).toHaveProperty('valid');
        expect(typeof result.valid).toBe('boolean');
      });
    });
  });
});
