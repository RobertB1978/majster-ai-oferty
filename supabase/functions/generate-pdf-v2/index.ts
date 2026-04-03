/**
 * generate-pdf-v2 — Kanoniczny punkt wejścia PDF Platform v2
 *
 * Przyjmuje UnifiedDocumentPayload (schemaVersion: 2) i generuje binarny PDF.
 * Jest to KANONICZNY kierunek renderowania dla wszystkich nowych typów dokumentów.
 *
 * Auth: JWT wymagany (verify_jwt = true w config.toml).
 *
 * Request:
 *   POST /functions/v1/generate-pdf-v2
 *   Content-Type: application/json
 *   Body: UnifiedDocumentPayload (schemaVersion: 2)
 *
 * Response (sukces):
 *   Content-Type: application/pdf
 *   Content-Disposition: attachment; filename="<documentId>.pdf"
 *   Body: binarny PDF
 *
 * Response (błąd walidacji):
 *   Content-Type: application/json
 *   Status: 400 / 422
 *   Body: { error: string }
 *
 *
 * ── Obsługiwane typy dokumentów ───────────────────────────────────────────────
 *   WSZYSTKIE ZAIMPLEMENTOWANE:
 *     'offer'      — deleguje do renderera @react-pdf/renderer przez adapter v2→v1
 *     'warranty'   — bezpośredni renderer @react-pdf/renderer (warrantyRenderer.ts)
 *     'protocol'   — bezpośredni renderer @react-pdf/renderer (protocolRenderer.ts)
 *     'contract'   — bezpośredni renderer @react-pdf/renderer (contractRenderer.ts)
 *     'inspection' — bezpośredni renderer @react-pdf/renderer (inspectionRenderer.ts)
 *
 * Roadmap: PDF Platform v2 — Canonical Renderer.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, getCorsPreflightHeaders } from "../_shared/cors.ts";
import {
  validateUnifiedPayload,
  type UnifiedDocumentPayload,
} from "../_shared/unified-document-payload.ts";
import { renderOfferFromV2Payload } from "./offerRenderer.ts";
import { renderWarrantyFromV2Payload } from "./warrantyRenderer.ts";
import { renderProtocolFromV2Payload } from "./protocolRenderer.ts";
import { renderContractFromV2Payload } from "./contractRenderer.ts";
import { renderInspectionFromV2Payload } from "./inspectionRenderer.ts";

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsPreflightHeaders(req) });
  }

  const corsHeaders = getCorsHeaders(req);

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────────

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Nieprawidłowe ciało żądania — oczekiwano JSON." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Walidacja UnifiedDocumentPayload v2 ────────────────────────────────────

  const validationError = validateUnifiedPayload(body);
  if (validationError) {
    return new Response(
      JSON.stringify({ error: validationError }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const payload = body as UnifiedDocumentPayload;

  // ── Routing po documentType ────────────────────────────────────────────────

  try {
    switch (payload.documentType) {
      // ── ZAIMPLEMENTOWANE ─────────────────────────────────────────────────
      case "offer": {
        const pdfBytes = await renderOfferFromV2Payload(payload);
        const filename = `${payload.documentId.replace(/\//g, "-")}.pdf`;

        return new Response(pdfBytes, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": String(pdfBytes.byteLength),
          },
        });
      }

      // ── ZAIMPLEMENTOWANE: warranty ────────────────────────────────────────
      case "warranty": {
        const pdfBytes = await renderWarrantyFromV2Payload(payload);
        const filename = `${payload.documentId.replace(/\//g, "-")}.pdf`;

        return new Response(pdfBytes, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": String(pdfBytes.byteLength),
          },
        });
      }

      // ── ZAIMPLEMENTOWANE: protocol ───────────────────────────────────────
      case "protocol": {
        const pdfBytes = await renderProtocolFromV2Payload(payload);
        const filename = `${payload.documentId.replace(/\//g, "-")}.pdf`;

        return new Response(pdfBytes, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": String(pdfBytes.byteLength),
          },
        });
      }

      // ── ZAIMPLEMENTOWANE: contract ──────────────────────────────────────
      case "contract": {
        const pdfBytes = await renderContractFromV2Payload(payload);
        const filename = `${payload.documentId.replace(/\//g, "-")}.pdf`;

        return new Response(pdfBytes, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": String(pdfBytes.byteLength),
          },
        });
      }

      // ── ZAIMPLEMENTOWANE: inspection ────────────────────────────────────
      case "inspection": {
        const pdfBytes = await renderInspectionFromV2Payload(payload);
        const filename = `${payload.documentId.replace(/\//g, "-")}.pdf`;

        return new Response(pdfBytes, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": String(pdfBytes.byteLength),
          },
        });
      }

      // ── TypeScript exhaustive check ──────────────────────────────────────
      default: {
        const _exhaustive: never = payload.documentType;
        return new Response(
          JSON.stringify({ error: `Nieznany documentType: ${String(_exhaustive)}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Wewnętrzny błąd renderowania PDF.";
    console.error("[generate-pdf-v2] błąd renderowania:", message);

    return new Response(
      JSON.stringify({ error: "Generowanie PDF nie powiodło się.", detail: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
