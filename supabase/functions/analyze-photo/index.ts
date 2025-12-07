// ============================================
// ANALYZE PHOTO - Security Enhanced
// Security Pack Δ1
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { completeAI, handleAIError } from "../_shared/ai-provider.ts";
import { 
  validateUrl, 
  validateString,
  createValidationErrorResponse,
  combineValidations 
} from "../_shared/validation.ts";
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
    let body: { imageUrl?: unknown; projectName?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageUrl, projectName } = body;

    // Validate inputs
    const validation = combineValidations(
      validateUrl(imageUrl, 'imageUrl'),
      validateString(projectName, 'projectName', { required: false, maxLength: 200 })
    );

    if (!validation.valid) {
      return createValidationErrorResponse(validation.errors, corsHeaders);
    }

    // Rate limiting (strict for image analysis - expensive)
    if (supabase) {
      const rateLimitResult = await checkRateLimit(
        getIdentifier(req),
        'analyze-photo',
        supabase
      );
      
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult, corsHeaders);
      }
    }

    const safeProjectName = projectName ? String(projectName).substring(0, 200) : 'Projekt';
    console.log("Analyzing photo for project:", safeProjectName);

    const response = await completeAI({
      messages: [
        {
          role: "system",
          content: `Jesteś ekspertem budowlanym i kosztorysantem. Analizujesz zdjęcia pomieszczeń/budynków i generujesz szczegółową wycenę prac remontowych.
            
Odpowiedz w formacie JSON:
{
  "summary": "Krótki opis co widzisz na zdjęciu",
  "works": [
    {
      "name": "Nazwa pracy",
      "category": "Robocizna" lub "Materiał",
      "unit": "m2" lub "szt." lub "mb" lub "godz.",
      "estimatedQty": liczba,
      "estimatedPrice": cena jednostkowa w PLN,
      "notes": "dodatkowe uwagi"
    }
  ],
  "materials": [
    {
      "name": "Nazwa materiału",
      "category": "Materiał",
      "unit": "szt." lub "m2" lub "opak.",
      "estimatedQty": liczba,
      "estimatedPrice": cena w PLN,
      "notes": "uwagi"
    }
  ],
  "estimatedTotalLabor": suma robocizny,
  "estimatedTotalMaterials": suma materiałów,
  "estimatedMargin": sugerowana marża w %,
  "risks": ["lista potencjalnych ryzyk"],
  "recommendations": ["lista rekomendacji"]
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Przeanalizuj to zdjęcie dla projektu "${safeProjectName}". Wygeneruj szczegółową wycenę prac i materiałów.`
            },
            {
              type: "image_url",
              image_url: {
                url: String(imageUrl).substring(0, 2048)
              }
            }
          ]
        }
      ],
      maxTokens: 3000,
    });

    const content = response.content;
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
        
        // Sanitize output
        analysis.summary = String(analysis.summary || '').substring(0, 1000);
        analysis.works = Array.isArray(analysis.works) ? analysis.works.slice(0, 50) : [];
        analysis.materials = Array.isArray(analysis.materials) ? analysis.materials.slice(0, 50) : [];
        analysis.risks = Array.isArray(analysis.risks) ? analysis.risks.slice(0, 20) : [];
        analysis.recommendations = Array.isArray(analysis.recommendations) ? analysis.recommendations.slice(0, 20) : [];
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      analysis = {
        summary: content.substring(0, 1000),
        works: [],
        materials: [],
        estimatedTotalLabor: 0,
        estimatedTotalMaterials: 0,
        estimatedMargin: 15,
        risks: [],
        recommendations: []
      };
    }

    console.log("Photo analysis completed");

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return handleAIError(error);
    }
    console.error("Error in analyze-photo:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
