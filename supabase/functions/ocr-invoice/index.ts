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
    const { documentUrl } = await req.json();

    console.log("Processing invoice OCR");

    const response = await completeAI({
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
      maxTokens: 2000,
    });

    const content = response.content;
    
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

    console.log("Invoice OCR completed");

    return new Response(JSON.stringify({ result: ocrResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return handleAIError(error);
    }
    console.error("Error in ocr-invoice:", error);
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
