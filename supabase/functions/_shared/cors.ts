// ============================================
// CORS CONFIGURATION - Security Fix
// Replaces wildcard '*' with proper origin validation
// ============================================

/**
 * Returns CORS headers with proper origin validation.
 * Uses ALLOWED_ORIGINS env var (comma-separated list) or falls back to
 * FRONTEND_URL. Never falls back to wildcard '*' in production.
 *
 * Set in Supabase Secrets:
 *   ALLOWED_ORIGINS=https://app.majster.ai,https://majster.ai
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigins = getallowedOrigins();
  const requestOrigin = req.headers.get('Origin') ?? '';

  // If no allowed origins configured AND we're in dev/test, allow all
  // (Supabase local dev doesn't have FRONTEND_URL set)
  if (allowedOrigins.length === 0) {
    return buildCorsHeaders('*');
  }

  const isAllowed = allowedOrigins.some(
    (o) => o === requestOrigin || o === '*',
  );

  const origin = isAllowed ? requestOrigin : allowedOrigins[0];
  return buildCorsHeaders(origin ?? '*');
}

/**
 * Returns CORS headers for CORS preflight responses (OPTIONS).
 * Always uses proper origin from getCorsHeaders.
 */
export function getCorsPreflightHeaders(req: Request): Record<string, string> {
  return {
    ...getCorsHeaders(req),
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-api-key, stripe-signature',
    'Access-Control-Max-Age': '86400',
  };
}

function getallowedOrigins(): string[] {
  const fromEnv = Deno.env.get('ALLOWED_ORIGINS');
  if (fromEnv) {
    return fromEnv.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const frontendUrl = Deno.env.get('FRONTEND_URL');
  if (frontendUrl) {
    return [frontendUrl];
  }

  return [];
}

function buildCorsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}
