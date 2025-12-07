// ============================================
// OCR INVOICE - Security Enhanced
// Security Pack Δ1
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { completeAI, handleAIError } from "../_shared/ai-provider.ts";
import { validateUrl, createValidationErrorResponse } from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  try {
    // Parse request body
    let body: { documentUrl?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { documentUrl } = body;

    // Validate input
    const validation = validateUrl(documentUrl, 'documentUrl');
    if (!validation.valid) {
      return createValidationErrorResponse(validation.errors, corsHeaders);
    }

    // Rate limiting
    if (supabase) {
      const rateLimitResult = await checkRateLimit(
        getIdentifier(req),
        'ocr-invoice',
        supabase
      );
      
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult, corsHeaders);
      }
    }

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
                url: String(documentUrl).substring(0, 2048)
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
        
        // Sanitize output
        ocrResult.supplierName = String(ocrResult.supplierName || '').substring(0, 200);
        ocrResult.invoiceNumber = String(ocrResult.invoiceNumber || '').substring(0, 100);
        ocrResult.items = Array.isArray(ocrResult.items) ? ocrResult.items.slice(0, 100) : [];
        ocrResult.netAmount = Math.max(0, Number(ocrResult.netAmount) || 0);
        ocrResult.vatAmount = Math.max(0, Number(ocrResult.vatAmount) || 0);
        ocrResult.grossAmount = Math.max(0, Number(ocrResult.grossAmount) || 0);
        ocrResult.confidence = Math.min(100, Math.max(0, Number(ocrResult.confidence) || 0));
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

    console.log("Invoice OCR completed, confidence:", ocrResult.confidence);

    return new Response(JSON.stringify({ result: ocrResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return handleAIError(error);
    }
    console.error("Error in ocr-invoice:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
