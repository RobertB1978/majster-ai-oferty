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
  supabaseClient?: any
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[endpoint] || DEFAULT_CONFIG;
  const windowStart = new Date(Date.now() - config.windowMs);
  
  if (!supabaseClient) {
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date(Date.now() + config.windowMs) };
  }
  
  try {
    // Clean old entries
    await supabaseClient
      .from('api_rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString());
    
    // Check current count
    const { data: existing } = await supabaseClient
      .from('api_rate_limits')
      .select('request_count, window_start')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();
    
    const currentCount = existing?.request_count || 0;
    const resetAt = existing?.window_start 
      ? new Date(new Date(existing.window_start).getTime() + config.windowMs)
      : new Date(Date.now() + config.windowMs);
    
    if (currentCount >= config.maxRequests) {
      console.warn(`Rate limit exceeded: ${identifier} on ${endpoint}`);
      return { allowed: false, remaining: 0, resetAt };
    }
    
    // Increment counter
    if (existing) {
      await supabaseClient
        .from('api_rate_limits')
        .update({ request_count: currentCount + 1 })
        .eq('identifier', identifier)
        .eq('endpoint', endpoint);
    } else {
      await supabaseClient
        .from('api_rate_limits')
        .insert({ identifier, endpoint, request_count: 1, window_start: new Date().toISOString() });
    }
    
    return { allowed: true, remaining: config.maxRequests - currentCount - 1, resetAt };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date(Date.now() + config.windowMs) };
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
