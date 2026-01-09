const defaultAllowedOrigins = [
  "https://majster-ai-oferty.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173"
];

const runtimeAllowedOrigins = (() => {
  if (typeof Deno === "undefined") return [] as string[];
  const fromEnv = Deno.env.get("ALLOWED_ORIGINS");
  return fromEnv?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];
})();

const allowedOrigins = new Set([...defaultAllowedOrigins, ...runtimeAllowedOrigins]);

export const baseCorsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-secret",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  Vary: "Origin"
};

export const defaultOrigin = defaultAllowedOrigins[0];

export const corsDeniedHeaders = {
  ...baseCorsHeaders,
  "Access-Control-Allow-Origin": "https://invalid.origin"
};

export const getCorsHeaders = (req: Request | null) => {
  const origin = req?.headers?.get("Origin") ?? req?.headers?.get("origin") ?? "";
  if (origin && allowedOrigins.has(origin)) {
    return { ...baseCorsHeaders, "Access-Control-Allow-Origin": origin };
  }
  return { ...baseCorsHeaders, "Access-Control-Allow-Origin": defaultOrigin };
};

export const isPreflight = (req: Request) => req.method === "OPTIONS";

export const requireBearerToken = (
  req: Request,
  corsHeaders: Record<string, string>
): { token?: string; errorResponse?: Response } => {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return {
      errorResponse: new Response(JSON.stringify({ error: "Missing or invalid authorization token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    };
  }
  return { token: authHeader.split(" ")[1] };
};

export const requireServiceSecret = (
  req: Request,
  corsHeaders: Record<string, string>,
  secret = typeof Deno !== "undefined" ? Deno.env.get("INTERNAL_SERVICE_SECRET") : undefined
) => {
  const provided = req.headers.get("x-service-secret");
  if (!secret) {
    return {
      errorResponse: new Response(JSON.stringify({ error: "Service secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    };
  }
  if (provided !== secret) {
    return {
      errorResponse: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    };
  }
  return {};
};

export async function getUserFromRequest(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<{ userId?: string; errorResponse?: Response }> {
  const { token, errorResponse } = requireBearerToken(req, corsHeaders);
  if (errorResponse || !token) return { errorResponse };

  if (typeof Deno === "undefined") {
    return { userId: "" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      errorResponse: new Response(JSON.stringify({ error: "Auth backend misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    };
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    return {
      errorResponse: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    };
  }

  return { userId: data.user.id };
}
