/**
 * generate-pdf-v2 — Adapter renderera oferty (v2 → v1 layout engine)
 *
 * Przyjmuje UnifiedDocumentPayload (schemaVersion: 2, documentType: 'offer')
 * i adaptuje go do formatu OfferPDFPayload (schemaVersion: 1), wymaganego
 * przez istniejący renderer @react-pdf/renderer z generate-offer-pdf.
 *
 * DLACZEGO ADAPTER, NIE PRZEPISANIE:
 *   Renderer @react-pdf/renderer w generate-offer-pdf/renderer.ts jest
 *   przetestowany produkcyjnie i obsługuje polskie czcionki Noto Sans.
 *   Przepisanie go w tym PR byłoby szeroką zmianą wizualną — poza zakresem.
 *   Adapter pozwala wymusić jeden punkt wejścia v2 bez duplikacji logiki.
 *
 * UWAGI MIGRACYJNE:
 *   - projectName pochodzi z section.pdfConfig.title (brak dedykowanego pola w v2)
 *   - projectId pochodzi z sourceProjectId ?? documentId (tracking/analytics)
 *   - validUntil: null (dozwolone w v2) jest mapowane na issuedAt + 30 dni
 *     jako bezpieczne domyślne — renderowanie v1 wymaga niepustego validUntil
 *
 * Roadmap: PDF Platform v2 — Canonical Renderer.
 */

import { renderOfferPdf } from "../generate-offer-pdf/renderer.ts";
import type {
  OfferPDFPayload,
  PDFQuoteData,
  PDFVariantSection,
  PDFConfig,
} from "../generate-offer-pdf/types.ts";
import type {
  UnifiedDocumentPayload,
  OfferDocumentSection,
  UnifiedQuoteData,
  UnifiedVariantSection,
} from "../_shared/unified-document-payload.ts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function adaptQuote(q: UnifiedQuoteData): PDFQuoteData {
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
  };
}

function adaptVariantSection(v: UnifiedVariantSection): PDFVariantSection {
  return {
    id: v.id,
    label: v.label,
    sort_order: v.sort_order,
    quote: adaptQuote(v.quote),
  };
}

/**
 * Mapuje planTier na wersję PDF.
 * 'pro' i 'enterprise' → 'premium'; pozostałe → 'standard'.
 */
function resolvePdfVersion(planTier: string): "standard" | "premium" {
  return planTier === "pro" || planTier === "enterprise" ? "premium" : "standard";
}

/**
 * Fallback validUntil gdy payload.validUntil === null.
 * Zwraca issuedAt + 30 dni jako domyślną datę ważności.
 */
function fallbackValidUntil(issuedAt: string): string {
  const d = new Date(issuedAt);
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

// ── Publiczne API ─────────────────────────────────────────────────────────────

/**
 * Renderuje ofertę z UnifiedDocumentPayload v2 do binarnego PDF.
 *
 * @param payload - UnifiedDocumentPayload z documentType === 'offer'
 * @returns Uint8Array z zawartością PDF
 * @throws jeśli sekcja nie jest typem 'offer' lub renderowanie się nie powiodło
 */
export async function renderOfferFromV2Payload(
  payload: UnifiedDocumentPayload,
): Promise<Uint8Array> {
  if (payload.section.type !== "offer") {
    throw new Error(
      `renderOfferFromV2Payload: oczekiwano section.type='offer', otrzymano '${payload.section.type}'.`,
    );
  }

  const section = payload.section as OfferDocumentSection;

  const pdfConfig: PDFConfig = {
    version: resolvePdfVersion(payload.planTier),
    title: section.pdfConfig.title,
    offerText: section.pdfConfig.offerText,
    terms: section.pdfConfig.terms,
    deadlineText: section.pdfConfig.deadlineText,
  };

  const v1Payload: OfferPDFPayload = {
    schemaVersion: 1,
    // projectId / projectName — brak dedykowanego pola w v2; używamy dostępnych danych
    projectId: payload.sourceProjectId ?? payload.documentId,
    projectName: section.pdfConfig.title,
    company: {
      name: payload.company.name,
      nip: payload.company.nip,
      regon: payload.company.regon,
      krs: payload.company.krs,
      representativeName: payload.company.representativeName,
      representativeRole: payload.company.representativeRole,
      street: payload.company.street,
      postalCode: payload.company.postalCode,
      city: payload.company.city,
      logoUrl: payload.company.logoUrl,
      phone: payload.company.phone,
      email: payload.company.email,
    },
    client: payload.client
      ? {
          name: payload.client.name,
          email: payload.client.email,
          address: payload.client.address,
          phone: payload.client.phone,
          // clientNip (v2-only) nie jest przekazywane do v1 renderer
        }
      : null,
    quote: section.quote ? adaptQuote(section.quote) : null,
    pdfConfig,
    generatedAt: payload.generatedAt,
    documentId: payload.documentId,
    issuedAt: payload.issuedAt,
    validUntil: payload.validUntil ?? fallbackValidUntil(payload.issuedAt),
    variantSections: section.variantSections?.map(adaptVariantSection),
    acceptanceUrl: section.acceptanceUrl,
    // Pola v2 Foundation — pass-through do renderera v1 (obsługiwane opcjonalnie)
    documentType: "offer",
    trade: payload.trade,
    planTier: payload.planTier,
    locale: payload.locale,
  };

  return renderOfferPdf(v1Payload);
}
