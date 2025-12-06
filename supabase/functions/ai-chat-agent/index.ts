import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Usługa AI nie jest skonfigurowana. Skontaktuj się z administratorem.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context-aware system prompt
    let contextualPrompt = systemPrompt;
    if (context === 'quote_creation') {
      contextualPrompt += `\n\nKontekst: Użytkownik tworzy nowy projekt/wycenę. Pomagaj mu w określeniu zakresu prac i szacowaniu kosztów.`;
    }

    const messages = [
      { role: 'system', content: contextualPrompt },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log('Sending request to Lovable AI Gateway...');
    console.log('Message:', message.substring(0, 100));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Zbyt wiele zapytań. Poczekaj chwilę i spróbuj ponownie.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Limit zapytań AI wyczerpany. Skontaktuj się z administratorem.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Przepraszam, nie udało się wygenerować odpowiedzi. Spróbuj ponownie.';

    console.log('AI response received, length:', aiResponse.length);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        reply: aiResponse // backwards compatibility
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in ai-chat-agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera';
    return new Response(
      JSON.stringify({ error: `Błąd AI: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});