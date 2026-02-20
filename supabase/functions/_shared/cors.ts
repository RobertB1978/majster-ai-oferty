// ============================================
// CORS UTILITY - Security Enhanced
// Fix for HIGH-01 from AUDIT_REPORT_2025-12-16.md
// ============================================
//
// Issue: CORS set to '*' in all Edge Functions
// Risk: Any domain can call our APIs (CSRF potential)
// Fix: Restrict to FRONTEND_URL in production
// ============================================

/**
 * Get allowed origins based on environment
 * In production: Only FRONTEND_URL
 * In development: localhost + FRONTEND_URL
 */
function getAllowedOrigins(): string[] {
  const frontendUrl = Deno.env.get("FRONTEND_URL");
  const isDev = Deno.env.get("ENVIRONMENT") === "development";

  const origins: string[] = [];

  // Always allow FRONTEND_URL if configured
  if (frontendUrl) {
    origins.push(frontendUrl);
  }

  // In development, also allow localhost variants
  if (isDev) {
    origins.push("http://localhost:8080");
    origins.push("http://localhost:5173");
    origins.push("http://127.0.0.1:8080");
    origins.push("http://127.0.0.1:5173");
  }

  // Fallback for Edge Functions without FRONTEND_URL configured
  // (Not recommended for production!)
  if (origins.length === 0) {
    console.warn("⚠️  CORS: No FRONTEND_URL configured, falling back to '*' (INSECURE!)");
    return ["*"];
  }

  return origins;
}

/**
 * Get CORS headers for a request
 * Checks if origin is allowed before setting Access-Control-Allow-Origin
 *
 * @param req - The incoming request
 * @returns CORS headers object
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = req.headers.get("origin");

  // If '*' is in allowed origins (development fallback), use it
  if (allowedOrigins.includes("*")) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Max-Age": "86400", // 24 hours
    };
  }

  // Check if request origin is in allowed list
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return {
      "Access-Control-Allow-Origin": requestOrigin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Credentials": "true", // Allow cookies when origin is specific
    };
  }

  // Origin not allowed - return restrictive headers
  console.warn(`🚫 CORS: Blocked request from unauthorized origin: ${requestOrigin}`);
  return {
    "Access-Control-Allow-Origin": "", // Empty = no CORS
    "Access-Control-Allow-Headers": "",
  };
}

/**
 * Create CORS preflight response (OPTIONS request)
 *
 * @param req - The incoming OPTIONS request
 * @returns Response with CORS headers
 */
export function createCorsPreflightResponse(req: Request): Response {
  const headers = getCorsHeaders(req);

  // If origin not allowed, return 403
  if (!headers["Access-Control-Allow-Origin"]) {
    return new Response("CORS preflight failed - origin not allowed", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Validate request origin (for additional security in handlers)
 *
 * @param req - The incoming request
 * @returns true if origin is allowed, false otherwise
 */
export function isOriginAllowed(req: Request): boolean {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = req.headers.get("origin");

  if (allowedOrigins.includes("*")) {
    return true; // Fallback mode (development)
  }

  if (!requestOrigin) {
    // No origin header (direct API call, not from browser)
    // Allow for server-to-server calls
    return true;
  }

  return allowedOrigins.includes(requestOrigin);
}

// ============================================
// USAGE EXAMPLE:
// ============================================
//
// import { getCorsHeaders, createCorsPreflightResponse } from "../_shared/cors.ts";
//
// serve(async (req) => {
//   // Handle OPTIONS request
//   if (req.method === 'OPTIONS') {
//     return createCorsPreflightResponse(req);
//   }
//
//   const corsHeaders = getCorsHeaders(req);
//
//   try {
//     // ... your handler logic ...
//
//     return new Response(JSON.stringify({ data }), {
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     return new Response(JSON.stringify({ error: "Internal error" }), {
//       status: 500,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   }
// });
// ============================================

// ============================================
// CONFIGURATION CHECKLIST:
// ============================================
//
// For Edge Functions to use this properly, set in Supabase Dashboard:
//
// Required Secrets:
// - FRONTEND_URL (e.g., "https://your-app.vercel.app")
//
// Optional Secrets:
// - ENVIRONMENT (set to "development" for local testing)
//
// After deploying this file:
// 1. Update all Edge Functions to use getCorsHeaders(req)
// 2. Replace hardcoded corsHeaders = { 'Access-Control-Allow-Origin': '*' }
// 3. Test from allowed domain (should work)
// 4. Test from unauthorized domain (should fail with 403)
// ============================================
