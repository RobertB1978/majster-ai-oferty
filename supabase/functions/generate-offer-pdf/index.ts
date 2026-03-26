/**
 * generate-offer-pdf — Supabase Edge Function
 *
 * Receives an OfferPDFPayload JSON body, generates a binary PDF using
 * @react-pdf/renderer, and returns the PDF as application/pdf.
 *
 * Auth: JWT required (verify_jwt = true in config.toml).
 *
 * Request:
 *   POST /functions/v1/generate-offer-pdf
 *   Content-Type: application/json
 *   Body: OfferPDFPayload (schemaVersion: 1)
 *
 * Response (success):
 *   Content-Type: application/pdf
 *   Content-Disposition: attachment; filename="<documentId>.pdf"
 *   Body: binary PDF
 *
 * Response (error):
 *   Content-Type: application/json
 *   Body: { error: string }
 *
 * Roadmap §26 PDF Migration — PR 2 (Edge Function).
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, getCorsPreflightHeaders } from "../_shared/cors.ts";
import { validatePayload, type OfferPDFPayload } from "./types.ts";
import { renderOfferPdf } from "./renderer.ts";

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
      JSON.stringify({ error: "Invalid JSON body." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Validate payload ───────────────────────────────────────────────────────

  const validationError = validatePayload(body);
  if (validationError) {
    return new Response(
      JSON.stringify({ error: validationError }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const payload = body as OfferPDFPayload;

  // ── Render PDF ─────────────────────────────────────────────────────────────

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await renderOfferPdf(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF rendering failed.";
    console.error("[generate-offer-pdf] render error:", message);
    return new Response(
      JSON.stringify({ error: "PDF generation failed.", detail: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ── Return binary PDF ──────────────────────────────────────────────────────

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
});
