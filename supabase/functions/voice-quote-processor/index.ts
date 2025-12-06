import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
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

    console.log('Processing voice text:', text);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Stwórz wycenę na podstawie: "${text}"` }
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || '';

    console.log('AI raw response:', aiResponse);

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
    if (!quoteData.projectName) quoteData.projectName = "Nowa wycena";
    if (!Array.isArray(quoteData.items)) quoteData.items = [];
    if (!quoteData.summary) quoteData.summary = "";

    // Ensure each item has correct structure
    quoteData.items = quoteData.items.map((item: any) => ({
      name: item.name || "Pozycja",
      qty: Number(item.qty) || 1,
      unit: item.unit || "szt.",
      price: Number(item.price) || 0,
      category: item.category === 'Robocizna' ? 'Robocizna' : 'Materiał'
    }));

    console.log('Processed quote data:', quoteData);

    return new Response(
      JSON.stringify(quoteData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in voice-quote-processor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
