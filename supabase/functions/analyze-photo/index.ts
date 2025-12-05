import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, projectName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing photo for project:", projectName);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
                text: `Przeanalizuj to zdjęcie dla projektu "${projectName}". Wygeneruj szczegółową wycenę prac i materiałów.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      analysis = {
        summary: content,
        works: [],
        materials: [],
        estimatedTotalLabor: 0,
        estimatedTotalMaterials: 0,
        estimatedMargin: 15,
        risks: [],
        recommendations: []
      };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in analyze-photo:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
