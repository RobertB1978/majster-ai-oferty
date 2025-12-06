import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const systemPrompt = `Jesteś Majster.AI - profesjonalnym asystentem dla firm budowlanych i remontowych w Polsce.

Twoje główne zadania:
1. Pomaganie w tworzeniu ofert i wycen
2. Doradzanie w kwestiach cenowych (materiały, robocizna)
3. Odpowiadanie na pytania branżowe
4. Sugerowanie materiałów i rozwiązań

Zasady:
- Odpowiadaj zawsze po polsku
- Bądź konkretny i profesjonalny
- Podawaj realistyczne ceny rynkowe z Polski (2024/2025)
- Używaj jednostek: m², mb, szt., godz., kpl.
- Format odpowiedzi: krótko, na temat, z listami punktowanymi

Przykładowe ceny orientacyjne (zł):
- Malowanie ścian: 15-25 zł/m²
- Układanie płytek: 80-150 zł/m²
- Płytki ceramiczne: 40-150 zł/m²
- Hydraulik: 80-150 zł/godz
- Elektryk: 70-120 zł/godz
- Gładzie gipsowe: 25-40 zł/m²
- Panele podłogowe (z montażem): 80-150 zł/m²

Zawsze dodawaj zastrzeżenie, że ceny są orientacyjne i mogą się różnić w zależności od regionu i zakresu prac.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    console.log('Sending request to Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Przepraszam, nie udało się wygenerować odpowiedzi.';

    console.log('AI response received successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in ai-chat-agent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
