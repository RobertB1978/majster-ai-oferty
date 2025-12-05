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
    const { projectsData, costsData, revenueData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Running finance AI analysis");

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
            content: `Jesteś analitykiem finansowym dla firmy budowlanej/remontowej. Analizujesz dane projektów, kosztów i przychodów.
            
Odpowiedz w formacie JSON:
{
  "profitableProjectTypes": ["lista najbardziej dochodowych typów projektów"],
  "losingAreas": ["obszary gdzie firma traci pieniądze"],
  "pricingRecommendations": [
    {
      "category": "kategoria usługi",
      "currentAvgPrice": obecna średnia cena,
      "recommendedPrice": rekomendowana cena,
      "reason": "uzasadnienie"
    }
  ],
  "cashflowForecast": {
    "nextMonth": prognoza na następny miesiąc,
    "trend": "up" lub "down" lub "stable"
  },
  "keyInsights": ["kluczowe wnioski"],
  "actionItems": ["konkretne działania do podjęcia"],
  "riskFactors": ["czynniki ryzyka"]
}`
          },
          {
            role: "user",
            content: `Przeanalizuj te dane finansowe firmy:

PROJEKTY:
${JSON.stringify(projectsData, null, 2)}

KOSZTY:
${JSON.stringify(costsData, null, 2)}

PRZYCHODY:
${JSON.stringify(revenueData, null, 2)}

Wygeneruj szczegółową analizę i rekomendacje.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
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
        throw new Error("No JSON found");
      }
    } catch (e) {
      console.error("Failed to parse analysis:", e);
      analysis = {
        profitableProjectTypes: [],
        losingAreas: [],
        pricingRecommendations: [],
        cashflowForecast: { nextMonth: 0, trend: "stable" },
        keyInsights: [content],
        actionItems: [],
        riskFactors: []
      };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in finance-ai-analysis:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
