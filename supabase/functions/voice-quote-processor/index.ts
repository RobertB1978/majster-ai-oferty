// ============================================
// VOICE QUOTE PROCESSOR - Security Enhanced
// Security Pack Δ1
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { completeAI, handleAIError } from "../_shared/ai-provider.ts";
import { validateString, createValidationErrorResponse } from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";
import { sanitizeAiOutput } from "../_shared/sanitization.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Jesteś ekspertem od tworzenia wycen budowlanych. Przetwarzasz tekst głosowy użytkownika i tworzysz strukturyzowaną wycenę.

Na podstawie podanego tekstu musisz wygenerować JSON z następującą strukturą:
{
  "projectName": "nazwa projektu",
  "items": [
    {
      "name": "nazwa pozycji",
      "qty": liczba,
      "unit": "jednostka (m², szt., mb, kg, godz., kpl.)",
      "price": cena_jednostkowa_w_zł,
      "category": "Materiał" lub "Robocizna"
    }
  ],
  "summary": "krótkie podsumowanie wyceny"
}

Zasady:
1. Rozpoznaj typ projektu (łazienka, kuchnia, pokój, elewacja itp.)
2. Wyciągnij metraże i ilości z tekstu
3. Dodaj wszystkie wspomniane materiały z realistycznymi cenami
4. Dodaj odpowiednią robociznę
5. Używaj cen z polskiego rynku 2024/2025

Przykładowe ceny:
- Płytki ceramiczne: 60-120 zł/m²
- Układanie płytek (robocizna): 100-150 zł/m²
- Farba lateksowa: 25-50 zł/l
- Malowanie ścian: 20-30 zł/m²
- Panele podłogowe: 50-100 zł/m²
- Montaż paneli: 30-50 zł/m²
- Umywalka z armaturą: 500-1500 zł/szt.
- Wanna: 800-3000 zł/szt.
- WC kompakt: 400-1200 zł/szt.

WAŻNE: Odpowiedź MUSI być TYLKO poprawnym JSON, bez żadnego dodatkowego tekstu!`;

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
    let body: { text?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text } = body;

    // Validate input
    const validation = validateString(text, 'text', { minLength: 5, maxLength: 5000 });
    if (!validation.valid) {
      return createValidationErrorResponse(validation.errors, corsHeaders);
    }

    // Rate limiting (stricter for AI endpoints)
    if (supabase) {
      const rateLimitResult = await checkRateLimit(
        getIdentifier(req),
        'voice-quote-processor',
        supabase
      );
      
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult, corsHeaders);
      }
    }

    console.log('Processing voice text, length:', (text as string).length);

    const response = await completeAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Stwórz wycenę na podstawie: "${(text as string).substring(0, 5000)}"` }
      ],
      maxTokens: 2048,
    });

    let aiResponse = response.content || '';
    console.log('AI raw response length:', aiResponse.length);

    // Clean up the response - remove markdown code blocks if present
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON
    let quoteData;
    try {
      quoteData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback structure
      quoteData = {
        projectName: "Nowa wycena",
        items: [
          {
            name: "Pozycja do uzupełnienia",
            qty: 1,
            unit: "szt.",
            price: 100,
            category: "Materiał"
          }
        ],
        summary: "Wycena wygenerowana automatycznie. Proszę zweryfikować pozycje."
      };
    }

    // Validate and ensure correct structure
    if (!quoteData.projectName || typeof quoteData.projectName !== 'string') {
      quoteData.projectName = "Nowa wycena";
    }
    // Δ4: sanitize AI-generated text fields
    quoteData.projectName = sanitizeAiOutput(quoteData.projectName, 200);

    if (!Array.isArray(quoteData.items)) {
      quoteData.items = [];
    }

    if (!quoteData.summary || typeof quoteData.summary !== 'string') {
      quoteData.summary = "";
    }
    quoteData.summary = sanitizeAiOutput(quoteData.summary, 1000);

    // Ensure each item has correct structure and sanitize
    quoteData.items = quoteData.items.slice(0, 50).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      return {
        name: sanitizeAiOutput(typeof i.name === 'string' ? i.name : "Pozycja", 200),
        qty: Math.min(Math.max(Number(i.qty) || 1, 0.01), 99999),
        unit: sanitizeAiOutput(typeof i.unit === 'string' ? i.unit : "szt.", 20),
        price: Math.min(Math.max(Number(i.price) || 0, 0), 9999999),
        category: i.category === 'Robocizna' ? 'Robocizna' : 'Materiał'
      };
    });

    console.log('Processed quote data, items:', quoteData.items.length);

    return new Response(
      JSON.stringify(quoteData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    if (error instanceof Error) {
      return handleAIError(error);
    }
    console.error('Error in voice-quote-processor:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
