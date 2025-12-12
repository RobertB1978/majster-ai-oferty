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

// Request body size limit (1MB default - prevents DoS attacks)
export const MAX_REQUEST_SIZE = 1_000_000; // 1MB

export interface RequestSizeCheckResult {
  ok: boolean;
  size: number;
  maxSize: number;
  errorResponse?: Response;
}

/**
 * Check request body size to prevent DoS attacks via large payloads
 * Returns result with optional error Response
 */
export async function checkRequestSize(
  req: Request,
  corsHeaders: Record<string, string>,
  maxSize: number = MAX_REQUEST_SIZE
): Promise<RequestSizeCheckResult> {
  const contentLength = req.headers.get('content-length');

  // Check Content-Length header first (fast path)
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSize) {
      console.error(`Request too large: ${size} bytes (max: ${maxSize})`);
      return {
        ok: false,
        size,
        maxSize,
        errorResponse: new Response(
          JSON.stringify({
            error: 'Payload too large',
            details: [`Request size ${size} bytes exceeds maximum ${maxSize} bytes`]
          }),
          {
            status: 413, // HTTP 413 Payload Too Large
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          }
        )
      };
    }
  }

  return { ok: true, size: contentLength ? parseInt(contentLength, 10) : 0, maxSize };
}

/**
 * Read and validate request body with size limit
 * Returns parsed JSON or error Response
 */
export async function readAndValidateBody<T = unknown>(
  req: Request,
  corsHeaders: Record<string, string>,
  maxSize: number = MAX_REQUEST_SIZE
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  // Check size first
  const sizeCheck = await checkRequestSize(req, corsHeaders, maxSize);
  if (!sizeCheck.ok && sizeCheck.errorResponse) {
    return { success: false, response: sizeCheck.errorResponse };
  }

  // Read body as text
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch (error) {
    console.error('Failed to read request body:', error);
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Failed to read request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      )
    };
  }

  // Check actual body size (in case Content-Length was missing)
  if (bodyText.length > maxSize) {
    console.error(`Request body too large: ${bodyText.length} bytes (max: ${maxSize})`);
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Payload too large',
          details: [`Request body ${bodyText.length} bytes exceeds maximum ${maxSize} bytes`]
        }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      )
    };
  }

  // Parse JSON
  try {
    const data = JSON.parse(bodyText) as T;
    return { success: true, data };
  } catch (error) {
    console.error('Invalid JSON:', error);
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      )
    };
  }
}
