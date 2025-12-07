// ============================================
// AI CHAT AGENT - Security Enhanced
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Jesteś Majster.AI - profesjonalnym asystentem dla firm budowlanych i remontowych w Polsce.

Twoje główne zadania:
1. Pomaganie w tworzeniu ofert i wycen budowlanych
2. Doradzanie w kwestiach cenowych (materiały, robocizna)
3. Odpowiadanie na pytania branżowe
4. Sugerowanie materiałów i rozwiązań technicznych
5. Pomaganie w planowaniu projektów remontowych

Zasady:
- Odpowiadaj ZAWSZE po polsku
- Bądź konkretny, profesjonalny i pomocny
- Podawaj realistyczne ceny rynkowe z Polski (2024/2025)
- Używaj jednostek: m², mb, szt., godz., kpl., worek, kg
- Format odpowiedzi: krótko, na temat, z listami punktowanymi gdy pasuje

Przykładowe ceny orientacyjne (zł brutto z robocizną):
WYKOŃCZENIA:
- Malowanie ścian: 25-35 zł/m²
- Układanie płytek podłogowych: 100-150 zł/m²
- Układanie płytek ściennych: 110-160 zł/m²
- Gładzie gipsowe: 35-50 zł/m²
- Panele podłogowe (z montażem): 65-120 zł/m²
- Tapetowanie: 40-60 zł/m²

INSTALACJE:
- Punkt elektryczny: 100-150 zł/szt.
- Punkt wod-kan: 200-350 zł/szt.
- Hydraulik stawka godzinowa: 80-150 zł/godz
- Elektryk stawka godzinowa: 70-120 zł/godz

SUCHA ZABUDOWA:
- Sufit podwieszany GK: 80-120 zł/m²
- Ścianki działowe GK: 90-140 zł/m²

ŁAZIENKA (materiały):
- Płytki ceramiczne: 40-200 zł/m²
- Umywalka z baterią: 400-1500 zł/kpl
- WC kompakt: 400-1200 zł/szt
- Kabina prysznicowa: 800-2500 zł/kpl

Zawsze dodawaj zastrzeżenie, że ceny są orientacyjne i mogą się różnić w zależności od regionu, zakresu prac i jakości materiałów.

Gdy użytkownik pyta o wycenę konkretnego projektu:
1. Zadaj pytania doprecyzowujące (metraż, standard wykończenia, zakres)
2. Podaj rozbitkę kosztów (materiały vs robocizna)
3. Podaj widełki cenowe (od-do)
4. Zasugeruj potencjalne oszczędności`;

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
    let body: { message?: unknown; history?: unknown; context?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, history = [], context } = body;

    // Validate inputs
    const validation = combineValidations(
      validateString(message, 'message', { maxLength: 5000 }),
      validateArray(history, 'history', { maxItems: 50 })
    );

    if (!validation.valid) {
      return createValidationErrorResponse(validation.errors, corsHeaders);
    }

    // Rate limiting
    if (supabase) {
      const rateLimitResult = await checkRateLimit(
        getIdentifier(req),
        'ai-chat-agent',
        supabase
      );
      
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult, corsHeaders);
      }
    }

    // Build context-aware system prompt
    let contextualPrompt = systemPrompt;
    if (context === 'quote_creation') {
      contextualPrompt += `\n\nKontekst: Użytkownik tworzy nowy projekt/wycenę. Pomagaj mu w określeniu zakresu prac i szacowaniu kosztów.`;
    }

    // Validate and sanitize history items
    const safeHistory = Array.isArray(history) 
      ? history
          .filter((m: unknown) => 
            m && typeof m === 'object' && 
            'role' in m && 'content' in m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.length <= 5000
          )
          .slice(-10)
          .map((m: { role: string; content: string }) => ({ 
            role: m.role as 'user' | 'assistant', 
            content: m.content.substring(0, 5000)
          }))
      : [];

    const messages = [
      { role: 'system' as const, content: contextualPrompt },
      ...safeHistory,
      { role: 'user' as const, content: (message as string).substring(0, 5000) }
    ];

    console.log('Processing AI chat request, message length:', (message as string).length);

    const response = await completeAI({
      messages,
      maxTokens: 2048,
    });

    const aiResponse = response.content || 'Przepraszam, nie udało się wygenerować odpowiedzi. Spróbuj ponownie.';
    console.log('AI response received, length:', aiResponse.length);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        reply: aiResponse // backwards compatibility
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    if (error instanceof Error) {
      return handleAIError(error);
    }
    console.error('Error in ai-chat-agent:', error);
    return new Response(
      JSON.stringify({ error: 'Nieznany błąd serwera' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
