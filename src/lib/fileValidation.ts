// ============================================
// FILE VALIDATION UTILITIES (Client-side)
// Phase 2 - B2 File Validation
// ============================================

export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  label: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// Validation configs for different file types
export const FILE_VALIDATION_CONFIGS = {
  logo: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp'],
    label: 'Logo',
  },
  document: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'],
    label: 'Dokument',
  },
  photo: {
    maxSizeBytes: 15 * 1024 * 1024, // 15MB (before compression)
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic'],
    allowedExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.heic'],
    label: 'Zdjęcie',
  },
  invoice: {
    maxSizeBytes: 15 * 1024 * 1024, // 15MB
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
    allowedExtensions: ['.pdf', '.png', '.jpg', '.jpeg'],
    label: 'Faktura',
  },
} as const;

// Dangerous file extensions that should never be uploaded
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
  '.js', '.jse', '.vbs', '.vbe', '.wsf', '.wsh',
  '.msi', '.msp', '.dll', '.sh', '.bash', '.ps1',
];

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot).toLowerCase();
}

/**
 * Check if file has a dangerous extension
 */
function isDangerousFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return DANGEROUS_EXTENSIONS.includes(ext);
}

/**
 * Format file size for user-friendly messages
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate file against configuration
 */
export function validateFile(file: File, config: FileValidationConfig): FileValidationResult {
  // Check for dangerous file types
  if (isDangerousFile(file.name)) {
    return {
      valid: false,
      error: 'Ten typ pliku jest zabroniony ze względów bezpieczeństwa',
    };
  }

  // Check file size
  if (file.size > config.maxSizeBytes) {
    return {
      valid: false,
      error: `${config.label} jest za duży. Maksymalny rozmiar: ${formatFileSize(config.maxSizeBytes)}`,
    };
  }

  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.type)) {
    const allowedExts = config.allowedExtensions.join(', ').toUpperCase();
    return {
      valid: false,
      error: `Nieprawidłowy typ pliku. Dozwolone: ${allowedExts}`,
    };
  }

  // Check file extension
  const ext = getFileExtension(file.name);
  if (!config.allowedExtensions.includes(ext)) {
    const allowedExts = config.allowedExtensions.join(', ').toUpperCase();
    return {
      valid: false,
      error: `Nieprawidłowe rozszerzenie pliku. Dozwolone: ${allowedExts}`,
    };
  }

  return { valid: true };
}
