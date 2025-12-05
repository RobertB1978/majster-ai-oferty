import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
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
        tool_choice: { type: "function", function: { name: "suggest_quote_items" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Przekroczono limit zapytań. Spróbuj później." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Brak kredytów AI. Doładuj konto." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("AI Gateway error");
    }

    const data = await response.json();
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const suggestions = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to content
    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in ai-quote-suggestions:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
