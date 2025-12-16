// ============================================
// SHARED VALIDATION UTILITIES FOR EDGE FUNCTIONS
// Security Pack Δ1 - Input Validation
// ============================================

// Email validation regex (RFC 5322 compliant simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// URL validation
const URL_REGEX = /^https?:\/\/.+/i;

// UUID validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEmail(email: unknown): ValidationResult {
  const errors: string[] = [];
  
  if (typeof email !== 'string') {
    errors.push('Email must be a string');
  } else if (!email.trim()) {
    errors.push('Email is required');
  } else if (email.length > 255) {
    errors.push('Email must be less than 255 characters');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Invalid email format');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateUrl(url: unknown, fieldName = 'URL'): ValidationResult {
  const errors: string[] = [];
  
  if (typeof url !== 'string') {
    errors.push(`${fieldName} must be a string`);
  } else if (!url.trim()) {
    errors.push(`${fieldName} is required`);
  } else if (url.length > 2048) {
    errors.push(`${fieldName} must be less than 2048 characters`);
  } else if (!URL_REGEX.test(url)) {
    errors.push(`Invalid ${fieldName} format - must start with http:// or https://`);
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateUUID(uuid: unknown, fieldName = 'ID'): ValidationResult {
  const errors: string[] = [];
  
  if (typeof uuid !== 'string') {
    errors.push(`${fieldName} must be a string`);
  } else if (!UUID_REGEX.test(uuid)) {
    errors.push(`Invalid ${fieldName} format`);
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateString(
  value: unknown, 
  fieldName: string, 
  options: { 
    required?: boolean; 
    minLength?: number; 
    maxLength?: number;
  } = {}
): ValidationResult {
  const { required = true, minLength = 1, maxLength = 10000 } = options;
  const errors: string[] = [];
  
  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return { valid: errors.length === 0, errors };
  }
  
  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { valid: false, errors };
  }
  
  const trimmed = value.trim();
  
  if (required && trimmed.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`);
  }
  
  if (trimmed.length > maxLength) {
    errors.push(`${fieldName} must be less than ${maxLength} characters`);
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateArray(
  value: unknown, 
  fieldName: string,
  options: { minItems?: number; maxItems?: number } = {}
): ValidationResult {
  const { minItems = 0, maxItems = 1000 } = options;
  const errors: string[] = [];
  
  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array`);
    return { valid: false, errors };
  }
  
  if (value.length < minItems) {
    errors.push(`${fieldName} must have at least ${minItems} items`);
  }
  
  if (value.length > maxItems) {
    errors.push(`${fieldName} must have at most ${maxItems} items`);
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number; required?: boolean } = {}
): ValidationResult {
  const { min, max, required = true } = options;
  const errors: string[] = [];
  
  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return { valid: errors.length === 0, errors };
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${fieldName} must be a valid number`);
    return { valid: false, errors };
  }
  
  if (min !== undefined && value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }
  
  if (max !== undefined && value > max) {
    errors.push(`${fieldName} must be at most ${max}`);
  }
  
  return { valid: errors.length === 0, errors };
}

// Sanitize string to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Create error response with proper CORS headers
export function createValidationErrorResponse(
  errors: string[],
  corsHeaders: Record<string, string>
): Response {
  console.error('Validation errors:', errors);
  return new Response(
    JSON.stringify({ 
      error: 'Validation failed', 
      details: errors 
    }),
    { 
      status: 400, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    }
  );
}

// Combine multiple validation results
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(r => r.errors);
  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}

// Validate boolean
export function validateBoolean(
  value: unknown,
  fieldName: string,
  options: { required?: boolean } = {}
): ValidationResult {
  const { required = true } = options;
  const errors: string[] = [];

  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return { valid: errors.length === 0, errors };
  }

  if (typeof value !== 'boolean') {
    errors.push(`${fieldName} must be a boolean`);
  }

  return { valid: errors.length === 0, errors };
}

// Validate enum value
export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[],
  options: { required?: boolean } = {}
): ValidationResult {
  const { required = true } = options;
  const errors: string[] = [];

  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return { valid: errors.length === 0, errors };
  }

  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { valid: false, errors };
  }

  if (!allowedValues.includes(value as T)) {
    errors.push(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

// Validate base64 encoded data
export function validateBase64(
  value: unknown,
  fieldName: string,
  options: { maxSize?: number; required?: boolean } = {}
): ValidationResult {
  const { maxSize = 100000, required = true } = options; // 100KB default
  const errors: string[] = [];

  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return { valid: errors.length === 0, errors };
  }

  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return { valid: false, errors };
  }

  // Check base64 format (basic regex)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(value)) {
    errors.push(`${fieldName} must be valid base64 encoded data`);
    return { valid: false, errors };
  }

  // Check size
  if (value.length > maxSize) {
    errors.push(`${fieldName} exceeds maximum size of ${maxSize} bytes`);
  }

  return { valid: errors.length === 0, errors };
}

// Validate payload size (total request body)
export function validatePayloadSize(
  payload: unknown,
  maxSize = 1048576 // 1MB default
): ValidationResult {
  const errors: string[] = [];

  try {
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > maxSize) {
      errors.push(`Request payload exceeds maximum size of ${Math.floor(maxSize / 1024)}KB`);
    }
  } catch {
    errors.push('Invalid payload format');
  }

  return { valid: errors.length === 0, errors };
}

// Validate JSON structure
export function validateJson(
  value: unknown,
  fieldName: string,
  options: { maxSize?: number; required?: boolean } = {}
): ValidationResult {
  const { maxSize = 10000, required = true } = options;
  const errors: string[] = [];

  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return { valid: errors.length === 0, errors };
  }

  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a JSON string`);
    return { valid: false, errors };
  }

  if (value.length > maxSize) {
    errors.push(`${fieldName} exceeds maximum size of ${maxSize} characters`);
    return { valid: false, errors };
  }

  try {
    JSON.parse(value);
  } catch {
    errors.push(`${fieldName} must be valid JSON`);
  }

  return { valid: errors.length === 0, errors };
}

// Validate ISO date string
export function validateDate(
  value: unknown,
  fieldName: string,
  options: { required?: boolean } = {}
): ValidationResult {
  const { required = true } = options;
  const errors: string[] = [];

  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return { valid: errors.length === 0, errors };
  }

  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a date string`);
    return { valid: false, errors };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push(`${fieldName} must be a valid ISO date`);
  }

  return { valid: errors.length === 0, errors };
}
