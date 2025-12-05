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
    const { documentUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing invoice OCR");

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
            content: `Jesteś specjalistą od OCR faktur. Analizujesz zdjęcia/skany faktur zakupowych i wyciągasz dane.
            
Odpowiedz w formacie JSON:
{
  "supplierName": "Nazwa dostawcy",
  "invoiceNumber": "Numer faktury",
  "invoiceDate": "YYYY-MM-DD",
  "items": [
    {
      "name": "Nazwa pozycji",
      "quantity": liczba,
      "unit": "jednostka",
      "netPrice": cena netto,
      "vatRate": stawka VAT w %,
      "grossPrice": cena brutto
    }
  ],
  "netAmount": suma netto,
  "vatAmount": suma VAT,
  "grossAmount": suma brutto,
  "confidence": procent pewności odczytu (0-100)
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Przeanalizuj tę fakturę i wyciągnij wszystkie dane. Zwróć dane w formacie JSON."
              },
              {
                type: "image_url",
                image_url: {
                  url: documentUrl
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
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let ocrResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ocrResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse OCR response:", e);
      ocrResult = {
        supplierName: "",
        invoiceNumber: "",
        invoiceDate: null,
        items: [],
        netAmount: 0,
        vatAmount: 0,
        grossAmount: 0,
        confidence: 0
      };
    }

    return new Response(JSON.stringify({ result: ocrResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in ocr-invoice:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
