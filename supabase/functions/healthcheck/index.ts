// ============================================
// HEALTHCHECK ENDPOINT
// Uptime monitoring i weryfikacja stanu systemu
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'pass' | 'fail';
      responseTime?: number;
      error?: string;
    };
    storage: {
      status: 'pass' | 'fail';
      responseTime?: number;
      error?: string;
    };
    auth: {
      status: 'pass' | 'fail';
      responseTime?: number;
      error?: string;
    };
  };
  uptime?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks: {
      database: { status: 'pass' },
      storage: { status: 'pass' },
      auth: { status: 'pass' },
    },
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Check Database - simple query
    const dbStart = Date.now();
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      result.checks.database.responseTime = Date.now() - dbStart;

      if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows, which is OK
        result.checks.database.status = 'fail';
        result.checks.database.error = dbError.message;
        result.status = 'degraded';
      }
    } catch (error) {
      result.checks.database.status = 'fail';
      result.checks.database.error = error instanceof Error ? error.message : 'Unknown error';
      result.checks.database.responseTime = Date.now() - dbStart;
      result.status = 'degraded';
    }

    // 2. Check Storage - list buckets
    const storageStart = Date.now();
    try {
      const { error: storageError } = await supabase.storage.listBuckets();

      result.checks.storage.responseTime = Date.now() - storageStart;

      if (storageError) {
        result.checks.storage.status = 'fail';
        result.checks.storage.error = storageError.message;
        result.status = 'degraded';
      }
    } catch (error) {
      result.checks.storage.status = 'fail';
      result.checks.storage.error = error instanceof Error ? error.message : 'Unknown error';
      result.checks.storage.responseTime = Date.now() - storageStart;
      result.status = 'degraded';
    }

    // 3. Check Auth - get session (should fail gracefully)
    const authStart = Date.now();
    try {
      const { error: authError } = await supabase.auth.getSession();

      result.checks.auth.responseTime = Date.now() - authStart;

      // Auth check passes even if no session (we're just checking if service responds)
      if (authError) {
        result.checks.auth.status = 'fail';
        result.checks.auth.error = authError.message;
        result.status = 'degraded';
      }
    } catch (error) {
      result.checks.auth.status = 'fail';
      result.checks.auth.error = error instanceof Error ? error.message : 'Unknown error';
      result.checks.auth.responseTime = Date.now() - authStart;
      result.status = 'degraded';
    }

    // Set overall status based on checks
    const failedChecks = Object.values(result.checks).filter(c => c.status === 'fail').length;
    if (failedChecks >= 2) {
      result.status = 'unhealthy';
    }

    // Calculate uptime
    result.uptime = Date.now() - startTime;

    // Return appropriate HTTP status code
    const httpStatus = result.status === 'healthy' ? 200 :
                      result.status === 'degraded' ? 200 : 503;

    return new Response(
      JSON.stringify(result, null, 2),
      {
        status: httpStatus,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );

  } catch (error) {
    console.error('Healthcheck error:', error);

    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
