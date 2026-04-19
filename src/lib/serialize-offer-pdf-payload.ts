/**
 * serialize-offer-pdf-payload
 *
 * Converts the in-memory `OfferPdfPayload` (Date instances, from offerDataBuilder.ts)
 * to the JSON-safe `OfferPDFPayload` wire format (ISO strings) defined in
 * `src/types/offer-pdf-payload.ts`.
 *
 * Used before calling the `generate-offer-pdf` Supabase Edge Function (§26.2).
 *
 * Roadmap: §26 PDF Migration Milestone — PR 1 (Payload Contract).
 */

import type { OfferPdfPayload, OfferVariantSection, QuoteData } from './offerDataBuilder';
import type {
  OfferPDFPayload,
  PDFVariantSection,
  PDFQuoteData,
} from '@/types/offer-pdf-payload';

// ── Internal helpers ──────────────────────────────────────────────────────────

function serializeQuote(q: QuoteData): PDFQuoteData {
  return {
    positions: q.positions.map((p) => ({
      id: p.id,
      name: p.name,
      qty: p.qty,
      unit: p.unit,
      price: p.price,
      category: p.category,
      notes: p.notes,
    })),
    summaryMaterials: q.summaryMaterials,
    summaryLabor: q.summaryLabor,
    marginPercent: q.marginPercent,
    total: q.total,
    vatRate: q.vatRate,
    isVatExempt: q.isVatExempt,
    netTotal: q.netTotal,
    vatAmount: q.vatAmount,
    grossTotal: q.grossTotal,
    ...(q.hasMixedVatRates && { hasMixedVatRates: true }),
  };
}

function serializeVariantSection(v: OfferVariantSection): PDFVariantSection {
  return {
    id: v.id,
    label: v.label,
    sort_order: v.sort_order,
    quote: serializeQuote(v.quote),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Convert an `OfferPdfPayload` (Date-based, browser-side) to a
 * JSON-serializable `OfferPDFPayload` suitable for the Edge Function.
 *
 * @throws {TypeError} if `payload.generatedAt`, `issuedAt`, or `validUntil`
 *   are invalid Date objects.
 */
export function serializeOfferPdfPayload(payload: OfferPdfPayload): OfferPDFPayload {
  return {
    schemaVersion: 1,
    projectId: payload.projectId,
    projectName: payload.projectName,
    company: { ...payload.company },
    client: payload.client ? { ...payload.client } : null,
    quote: payload.quote ? serializeQuote(payload.quote) : null,
    pdfConfig: { ...payload.pdfConfig },
    generatedAt: payload.generatedAt.toISOString(),
    documentId: payload.documentId,
    issuedAt: payload.issuedAt.toISOString(),
    validUntil: payload.validUntil.toISOString(),
    variantSections: payload.variantSections?.map(serializeVariantSection),
    acceptanceUrl: payload.acceptanceUrl,

    // ── PDF Platform v2 Foundation — metadane (backward compatible) ─────────
    //
    // documentType: zawsze 'offer' dla schemaVersion: 1 — stały fakt.
    // locale: domyślnie 'pl-PL', może być nadpisane przez payload (przyszłe).
    // trade / planTier: pass-through jeśli obecne w payloadzie (opcjonalne).

    documentType: 'offer',
    locale: payload.locale ?? 'pl-PL',
    ...(payload.trade !== undefined && { trade: payload.trade }),
    ...(payload.planTier !== undefined && { planTier: payload.planTier }),
  };
}
