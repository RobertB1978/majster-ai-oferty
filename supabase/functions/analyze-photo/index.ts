import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { completeAI, handleAIError } from "../_shared/ai-provider.ts";

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

    console.log("Analyzing photo for project:", projectName);

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
      maxTokens: 3000,
    });

    const content = response.content;
    
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

    console.log("Photo analysis completed");

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return handleAIError(error);
    }
    console.error("Error in analyze-photo:", error);
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
