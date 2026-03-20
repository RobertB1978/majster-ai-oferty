// ============================================
// RATE LIMITER FOR EDGE FUNCTIONS
// Security Pack Δ1 - Rate Limiting
// ============================================

export interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// Rate limit configurations per endpoint
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'public-api': { endpoint: 'public-api', maxRequests: 100, windowMs: 60 * 1000 },
  'ai-chat-agent': { endpoint: 'ai-chat-agent', maxRequests: 20, windowMs: 60 * 1000 },
  'voice-quote-processor': { endpoint: 'voice-quote-processor', maxRequests: 10, windowMs: 60 * 1000 },
  'ai-quote-suggestions': { endpoint: 'ai-quote-suggestions', maxRequests: 30, windowMs: 60 * 1000 },
  'analyze-photo': { endpoint: 'analyze-photo', maxRequests: 10, windowMs: 60 * 1000 },
  'ocr-invoice': { endpoint: 'ocr-invoice', maxRequests: 20, windowMs: 60 * 1000 },
  'finance-ai-analysis': { endpoint: 'finance-ai-analysis', maxRequests: 10, windowMs: 60 * 1000 },
  'send-offer-email': { endpoint: 'send-offer-email', maxRequests: 10, windowMs: 60 * 1000 },
  'approve-offer': { endpoint: 'approve-offer', maxRequests: 30, windowMs: 60 * 1000 },
  'client-question': { endpoint: 'client-question', maxRequests: 5, windowMs: 10 * 60 * 1000 },
  'request-plan': { endpoint: 'request-plan', maxRequests: 5, windowMs: 60 * 1000 },
};

const DEFAULT_CONFIG: RateLimitConfig = {
  endpoint: 'default',
  maxRequests: 60,
  windowMs: 60 * 1000,
};

// deno-lint-ignore no-explicit-any
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  supabaseClient?: unknown
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[endpoint] || DEFAULT_CONFIG;

  if (!supabaseClient) {
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date(Date.now() + config.windowMs) };
  }
  
  try {
    const { data: result, error: rpcError } = await (supabaseClient as any)
      .rpc('check_and_increment_rate_limit', {
        p_identifier: identifier,
        p_endpoint: endpoint,
        p_max_requests: config.maxRequests,
        p_window_ms: config.windowMs,
      })
      .single();

    if (rpcError) throw rpcError;

    const resetAt = result?.reset_at ? new Date(result.reset_at) : new Date(Date.now() + config.windowMs);
    const currentCount = result?.current_count ?? 0;

    if (!result?.allowed) {
      console.warn(`Rate limit exceeded: ${identifier} on ${endpoint} (count: ${currentCount}/${config.maxRequests})`);
      return { allowed: false, remaining: 0, resetAt };
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - currentCount),
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit error (DB unavailable) — failing closed for endpoint:', endpoint, error);
    return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + config.windowMs) };
  }
}

export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded', retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000) }),
    { 
      status: 429, 
      headers: { 
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
        ...corsHeaders 
      } 
    }
  );
}

export function getIdentifier(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}
