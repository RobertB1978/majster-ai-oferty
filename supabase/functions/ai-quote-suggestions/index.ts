import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { completeAI, handleAIError } from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestionRequest {
  projectName: string;
  existingPositions: Array<{ name: string; category: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, existingPositions }: SuggestionRequest = await req.json();

    const existingItems = existingPositions.map(p => `- ${p.name} (${p.category})`).join('\n');

    const systemPrompt = `Jesteś ekspertem od wycen budowlanych i remontowych w Polsce. 
Twoim zadaniem jest zasugerowanie pozycji do wyceny projektu.
Odpowiadaj TYLKO po polsku.
Sugeruj realistyczne pozycje z cenami w PLN.
Kategorie: "Materiał" lub "Robocizna".`;

    const userPrompt = `Projekt: "${projectName}"
${existingItems ? `Istniejące pozycje:\n${existingItems}` : 'Brak istniejących pozycji.'}

Zasugeruj 5-8 dodatkowych pozycji do wyceny. Dla każdej podaj:
- Nazwę
- Kategorię (Materiał lub Robocizna)
- Sugerowaną cenę jednostkową w PLN
- Jednostkę (szt., m², m, godz., itp.)`;

    console.log('Processing quote suggestions for:', projectName);

    const response = await completeAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      maxTokens: 2048,
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_quote_items",
            description: "Zwraca sugerowane pozycje do wyceny",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Nazwa pozycji" },
                      category: { type: "string", enum: ["Materiał", "Robocizna"] },
                      price: { type: "number", description: "Cena jednostkowa w PLN" },
                      unit: { type: "string", description: "Jednostka (szt., m², m, godz.)" },
                      reasoning: { type: "string", description: "Krótkie uzasadnienie" }
                    },
                    required: ["name", "category", "price", "unit"]
                  }
                }
              },
              required: ["suggestions"]
            }
          }
        }
      ],
      toolChoice: { type: "function", function: { name: "suggest_quote_items" } }
    });

    // Extract tool call result
    if (response.toolCalls?.[0]?.function?.arguments) {
      const suggestions = JSON.parse(response.toolCalls[0].function.arguments);
      console.log('Suggestions generated:', suggestions.suggestions?.length || 0);
      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to content parsing if no tool call
    if (response.content) {
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(suggestions), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.error('Failed to parse content as JSON:', e);
      }
    }

    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      return handleAIError(error);
    }
    console.error("Error in ai-quote-suggestions:", error);
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
