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
    const { projectsData, costsData, revenueData } = await req.json();

    console.log("Running finance AI analysis");

    const response = await completeAI({
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
      maxTokens: 2500,
    });

    const content = response.content;
    
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

    console.log("Finance analysis completed");

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return handleAIError(error);
    }
    console.error("Error in finance-ai-analysis:", error);
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
