// ============================================
// PUBLIC API - Security Enhanced
// Security Pack Δ1
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  validateString, 
  validateUUID, 
  createValidationErrorResponse,
  combineValidations 
} from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Validate API key header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      console.warn('Public API: Missing API key');
      return new Response(JSON.stringify({ error: "API key required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate API key format (hex string, 64 chars)
    if (!/^[a-f0-9]{64}$/i.test(apiKey)) {
      console.warn('Public API: Invalid API key format');
      return new Response(JSON.stringify({ error: "Invalid API key format" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lookup API key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, user_id, permissions, is_active')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      console.warn('Public API: Invalid or inactive API key');
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = keyData.user_id;
    
    // Rate limiting
    const rateLimitResult = await checkRateLimit(
      getIdentifier(req, userId),
      'public-api',
      supabase
    );
    
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    const url = new URL(req.url);
    const path = url.pathname.replace('/public-api', '');
    const permissions = (keyData.permissions as string[]) || ['read'];

    console.log(`Public API: ${req.method} ${path} by user ${userId}`);

    // Route: /projects
    if (path === '/projects' || path === '/projects/') {
      if (req.method === 'GET') {
        if (!permissions.includes('read')) {
          return new Response(JSON.stringify({ error: "Read permission required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from('projects')
          .select('id, project_name, status, priority, start_date, end_date, created_at, clients(id, name)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        return new Response(JSON.stringify({ data, count: data?.length || 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === 'POST') {
        if (!permissions.includes('write')) {
          return new Response(JSON.stringify({ error: "Write permission required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        
        // Validate input
        const validation = combineValidations(
          validateString(body.project_name, 'project_name', { maxLength: 200 }),
          validateUUID(body.client_id, 'client_id')
        );
        
        if (!validation.valid) {
          return createValidationErrorResponse(validation.errors, corsHeaders);
        }

        // Verify client belongs to user
        const { data: clientCheck } = await supabase
          .from('clients')
          .select('id')
          .eq('id', body.client_id)
          .eq('user_id', userId)
          .single();

        if (!clientCheck) {
          return new Response(JSON.stringify({ error: "Client not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from('projects')
          .insert({
            project_name: body.project_name.trim(),
            client_id: body.client_id,
            user_id: userId,
            status: body.status || 'Nowy',
            priority: body.priority || 'normal'
          })
          .select('id, project_name, status, created_at')
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Route: /clients
    if (path === '/clients' || path === '/clients/') {
      if (req.method === 'GET') {
        if (!permissions.includes('read')) {
          return new Response(JSON.stringify({ error: "Read permission required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from('clients')
          .select('id, name, email, phone, address, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        return new Response(JSON.stringify({ data, count: data?.length || 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (req.method === 'POST') {
        if (!permissions.includes('write')) {
          return new Response(JSON.stringify({ error: "Write permission required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const body = await req.json();
        
        const validation = validateString(body.name, 'name', { maxLength: 100 });
        if (!validation.valid) {
          return createValidationErrorResponse(validation.errors, corsHeaders);
        }

        const { data, error } = await supabase
          .from('clients')
          .insert({
            name: body.name.trim(),
            email: body.email?.trim() || '',
            phone: body.phone?.trim() || '',
            address: body.address?.trim() || '',
            user_id: userId
          })
          .select('id, name, email, phone, created_at')
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Route: /quotes
    if (path === '/quotes' || path === '/quotes/') {
      if (req.method === 'GET') {
        if (!permissions.includes('read')) {
          return new Response(JSON.stringify({ error: "Read permission required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from('quotes')
          .select('id, project_id, total, margin_percent, summary_labor, summary_materials, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        return new Response(JSON.stringify({ data, count: data?.length || 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Public API error:", error);
    // Don't leak internal error details
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
