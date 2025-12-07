import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { completeAI, handleAIError } from "../_shared/ai-provider.ts";

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

  try {
    const { message, history = [], context } = await req.json();

    if (!message) {
      console.error('No message provided');
      return new Response(
        JSON.stringify({ error: 'Wiadomość jest wymagana' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context-aware system prompt
    let contextualPrompt = systemPrompt;
    if (context === 'quote_creation') {
      contextualPrompt += `\n\nKontekst: Użytkownik tworzy nowy projekt/wycenę. Pomagaj mu w określeniu zakresu prac i szacowaniu kosztów.`;
    }

    const messages = [
      { role: 'system' as const, content: contextualPrompt },
      ...history.slice(-10).map((m: any) => ({ 
        role: m.role as 'user' | 'assistant', 
        content: m.content as string 
      })),
      { role: 'user' as const, content: message }
    ];

    console.log('Processing AI chat request...');
    console.log('Message:', message.substring(0, 100));

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
