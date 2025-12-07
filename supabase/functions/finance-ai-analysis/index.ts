// ============================================
// FINANCE AI ANALYSIS - Security Enhanced
// Security Pack Δ1
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { completeAI, handleAIError } from "../_shared/ai-provider.ts";
import { validateArray, createValidationErrorResponse, combineValidations } from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  try {
    // Parse request body
    let body: { projectsData?: unknown; costsData?: unknown; revenueData?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { projectsData, costsData, revenueData } = body;

    // Validate inputs (all should be arrays or objects)
    const validation = combineValidations(
      validateArray(projectsData || [], 'projectsData', { maxItems: 1000 }),
      validateArray(costsData || [], 'costsData', { maxItems: 1000 }),
      validateArray(revenueData || [], 'revenueData', { maxItems: 1000 })
    );

    if (!validation.valid) {
      return createValidationErrorResponse(validation.errors, corsHeaders);
    }

    // Rate limiting (strict - expensive AI operation)
    if (supabase) {
      const rateLimitResult = await checkRateLimit(
        getIdentifier(req),
        'finance-ai-analysis',
        supabase
      );
      
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult, corsHeaders);
      }
    }

    console.log("Running finance AI analysis");

    // Limit data size for AI processing
    const safeProjectsData = Array.isArray(projectsData) ? projectsData.slice(0, 100) : [];
    const safeCostsData = Array.isArray(costsData) ? costsData.slice(0, 100) : [];
    const safeRevenueData = Array.isArray(revenueData) ? revenueData.slice(0, 100) : [];

    const response = await completeAI({
      messages: [
        {
          role: "system",
          content: `Jesteś analitykiem finansowym dla firmy budowlanej/remontowej. Analizujesz dane projektów, kosztów i przychodów.
            
Odpowiedz w formacie JSON:
{
  "profitableProjectTypes": ["lista najbardziej dochodowych typów projektów"],
  "losingAreas": ["obszary gdzie firma traci pieniądze"],
  "pricingRecommendations": [
    {
      "category": "kategoria usługi",
      "currentAvgPrice": obecna średnia cena,
      "recommendedPrice": rekomendowana cena,
      "reason": "uzasadnienie"
    }
  ],
  "cashflowForecast": {
    "nextMonth": prognoza na następny miesiąc,
    "trend": "up" lub "down" lub "stable"
  },
  "keyInsights": ["kluczowe wnioski"],
  "actionItems": ["konkretne działania do podjęcia"],
  "riskFactors": ["czynniki ryzyka"]
}`
        },
        {
          role: "user",
          content: `Przeanalizuj te dane finansowe firmy:

PROJEKTY:
${JSON.stringify(safeProjectsData, null, 2).substring(0, 10000)}

KOSZTY:
${JSON.stringify(safeCostsData, null, 2).substring(0, 10000)}

PRZYCHODY:
${JSON.stringify(safeRevenueData, null, 2).substring(0, 10000)}

Wygeneruj szczegółową analizę i rekomendacje.`
        }
      ],
      maxTokens: 2500,
    });

    const content = response.content;
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
        
        // Sanitize output
        analysis.profitableProjectTypes = Array.isArray(analysis.profitableProjectTypes) 
          ? analysis.profitableProjectTypes.slice(0, 20) : [];
        analysis.losingAreas = Array.isArray(analysis.losingAreas) 
          ? analysis.losingAreas.slice(0, 20) : [];
        analysis.pricingRecommendations = Array.isArray(analysis.pricingRecommendations) 
          ? analysis.pricingRecommendations.slice(0, 20) : [];
        analysis.keyInsights = Array.isArray(analysis.keyInsights) 
          ? analysis.keyInsights.slice(0, 20) : [];
        analysis.actionItems = Array.isArray(analysis.actionItems) 
          ? analysis.actionItems.slice(0, 20) : [];
        analysis.riskFactors = Array.isArray(analysis.riskFactors) 
          ? analysis.riskFactors.slice(0, 20) : [];
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      console.error("Failed to parse analysis:", e);
      analysis = {
        profitableProjectTypes: [],
        losingAreas: [],
        pricingRecommendations: [],
        cashflowForecast: { nextMonth: 0, trend: "stable" },
        keyInsights: [content.substring(0, 1000)],
        actionItems: [],
        riskFactors: []
      };
    }

    console.log("Finance analysis completed");

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return handleAIError(error);
    }
    console.error("Error in finance-ai-analysis:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
