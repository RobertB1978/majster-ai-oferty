// ============================================
// AI QUOTE SUGGESTIONS - Security Enhanced
// Security Pack Δ1
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { completeAI, handleAIError } from "../_shared/ai-provider.ts";
import {
  validateString,
  validateArray,
  createValidationErrorResponse,
  combineValidations
} from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";
import { getCorsHeaders, isPreflight, requireBearerToken } from "../_shared/security.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (isPreflight(req)) {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  try {
    // Parse request body
    let body: { projectName?: unknown; existingPositions?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { projectName, existingPositions = [] } = body;

    // Validate inputs
    const validation = combineValidations(
      validateString(projectName, 'projectName', { maxLength: 200 }),
      validateArray(existingPositions, 'existingPositions', { maxItems: 100 })
    );

    if (!validation.valid) {
      return createValidationErrorResponse(validation.errors, corsHeaders);
    }

    // Rate limiting
    if (supabase) {
      const rateLimitResult = await checkRateLimit(
        getIdentifier(req),
        'ai-quote-suggestions',
        supabase
      );
      
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult, corsHeaders);
      }
    }

    // Sanitize existing positions
    const safePositions = Array.isArray(existingPositions)
      ? existingPositions
          .slice(0, 100)
          .filter((p: unknown) => p && typeof p === 'object')
          .map((p: unknown) => {
            const pos = p as Record<string, unknown>;
            return {
              name: String(pos.name || '').substring(0, 200),
              category: String(pos.category || '').substring(0, 50)
            };
          })
      : [];

    const existingItems = safePositions.map(p => `- ${p.name} (${p.category})`).join('\n');

    const systemPrompt = `Jesteś ekspertem od wycen budowlanych i remontowych w Polsce. 
Twoim zadaniem jest zasugerowanie pozycji do wyceny projektu.
Odpowiadaj TYLKO po polsku.
Sugeruj realistyczne pozycje z cenami w PLN.
Kategorie: "Materiał" lub "Robocizna".`;

    const userPrompt = `Projekt: "${(projectName as string).substring(0, 200)}"
${existingItems ? `Istniejące pozycje:\n${existingItems}` : 'Brak istniejących pozycji.'}

Zasugeruj 5-8 dodatkowych pozycji do wyceny. Dla każdej podaj:
- Nazwę
- Kategorię (Materiał lub Robocizna)
- Sugerowaną cenę jednostkową w PLN
- Jednostkę (szt., m², m, godz., itp.)`;

    console.log('Processing quote suggestions for:', (projectName as string).substring(0, 50));

    const response = await completeAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      maxTokens: 2048,
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_quote_items",
            description: "Zwraca sugerowane pozycje do wyceny",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Nazwa pozycji" },
                      category: { type: "string", enum: ["Materiał", "Robocizna"] },
                      price: { type: "number", description: "Cena jednostkowa w PLN" },
                      unit: { type: "string", description: "Jednostka (szt., m², m, godz.)" },
                      reasoning: { type: "string", description: "Krótkie uzasadnienie" }
                    },
                    required: ["name", "category", "price", "unit"]
                  }
                }
              },
              required: ["suggestions"]
            }
          }
        }
      ],
      toolChoice: { type: "function", function: { name: "suggest_quote_items" } }
    });

    // Extract tool call result
    if (response.toolCalls?.[0]?.function?.arguments) {
      try {
        const suggestions = JSON.parse(response.toolCalls[0].function.arguments);
        
        // Sanitize suggestions
        if (suggestions.suggestions && Array.isArray(suggestions.suggestions)) {
          suggestions.suggestions = suggestions.suggestions.slice(0, 20).map((s: unknown) => {
            const sug = s as Record<string, unknown>;
            return {
              name: String(sug.name || '').substring(0, 200),
              category: sug.category === 'Robocizna' ? 'Robocizna' : 'Materiał',
              price: Math.min(Math.max(Number(sug.price) || 0, 0), 999999),
              unit: String(sug.unit || 'szt.').substring(0, 20),
              reasoning: String(sug.reasoning || '').substring(0, 500)
            };
          });
        }
        
        console.log('Suggestions generated:', suggestions.suggestions?.length || 0);
        return new Response(JSON.stringify(suggestions), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error('Failed to parse tool call arguments:', parseError);
      }
    }

    // Fallback to content parsing if no tool call
    if (response.content) {
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(suggestions), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.error('Failed to parse content as JSON:', e);
      }
    }

    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      return handleAIError(error);
    }
    console.error("Error in ai-quote-suggestions:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
    const authCheck = requireBearerToken(req, corsHeaders);
    if (authCheck.errorResponse) return authCheck.errorResponse;

