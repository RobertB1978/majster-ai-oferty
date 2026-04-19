/**
 * OfferPDFPayload — JSON-serializable contract for server-side PDF generation.
 *
 * PURPOSE: This is the wire format sent from the frontend to the
 * `generate-offer-pdf` Supabase Edge Function (roadmap §26.2).
 * All Date fields are ISO 8601 strings so the payload can be JSON.stringify'd
 * without loss and validated on the Edge Function side.
 *
 * DISTINCTION from OfferPdfPayload (offerDataBuilder.ts):
 *   OfferPdfPayload  — in-memory object used by the browser (Date instances).
 *   OfferPDFPayload  — wire/JSON format used for the Edge Function call.
 *
 * Use `serializeOfferPdfPayload()` from `@/lib/serialize-offer-pdf-payload`
 * to convert between the two.
 *
 * Roadmap: §26 PDF Migration Milestone — PR 1 (Payload Contract).
 */

// ── Re-usable sub-types (identical shape to offerDataBuilder.ts, no Date) ────

export interface PDFCompanyInfo {
  name: string;
  nip?: string;
  regon?: string;
  krs?: string;
  representativeName?: string;
  representativeRole?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  logoUrl?: string | null;
  phone?: string;
  email?: string;
}

export interface PDFClientInfo {
  name: string;
  email?: string;
  address?: string;
  phone?: string;
}

export interface PDFOfferPosition {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: 'Materiał' | 'Robocizna';
  notes?: string;
}

export interface PDFQuoteData {
  positions: PDFOfferPosition[];
  summaryMaterials: number;
  summaryLabor: number;
  marginPercent: number;
  total: number;
  /** VAT rate percentage (e.g. 23). null = VAT exempt. */
  vatRate: number | null;
  isVatExempt: boolean;
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
  /** true when items carry more than one distinct VAT rate */
  hasMixedVatRates?: boolean;
}

export type PDFTemplateId = 'classic' | 'modern' | 'minimal';

export interface PDFConfig {
  version: 'standard' | 'premium';
  templateId?: PDFTemplateId;
  title: string;
  offerText: string;
  terms: string;
  deadlineText: string;
}

export interface PDFVariantSection {
  id: string;
  label: string;
  sort_order: number;
  quote: PDFQuoteData;
}

// ── Root wire contract ────────────────────────────────────────────────────────

/**
 * JSON-safe offer payload for the `generate-offer-pdf` Edge Function.
 *
 * Rule: every field MUST be JSON-serializable (no Date, no undefined if
 * omittable — use null or optional instead).
 */
export interface OfferPDFPayload {
  /** Stable offer / project ID — same as `offers.id` in the DB. */
  projectId: string;
  projectName: string;
  company: PDFCompanyInfo;
  client: PDFClientInfo | null;
  quote: PDFQuoteData | null;
  pdfConfig: PDFConfig;
  /** ISO 8601 — when the payload was assembled on the client. */
  generatedAt: string;
  /** Human-readable doc ID, e.g. "OF/2026/A1B2C3". */
  documentId: string;
  /** ISO 8601 — date of issue. */
  issuedAt: string;
  /** ISO 8601 — offer validity deadline. */
  validUntil: string;
  /** Named variant sections; present only for multi-variant offers. */
  variantSections?: PDFVariantSection[];
  /**
   * URL to the digital acceptance page.
   * When present, a QR code is embedded in the generated PDF.
   */
  acceptanceUrl?: string;
  /**
   * Schema version — allows the Edge Function to reject stale payloads
   * or apply backwards-compatible parsing.
   * Current: 1
   */
  schemaVersion: 1;

  // ── PDF Platform v2 Foundation — pola metadanych (opcjonalne, backward compatible) ──
  //
  // Dodane w ramach PDF Platform v2 Foundation aby umożliwić przyszłe
  // auto-mapowanie szablonu (documentType + trade + planTier → renderer).
  // Pola opcjonalne — nie wpływają na istniejące przepływy.
  //
  // Domyślne wartości gdy nieobecne:
  //   documentType = 'offer'  (dla schemaVersion: 1 zawsze oferta)
  //   locale       = 'pl-PL'
  //   trade        = 'general'
  //   planTier     = (zależne od profilu użytkownika)

  /** Typ dokumentu — zawsze 'offer' dla ofert (schemaVersion: 1) */
  documentType?: 'offer';

  /**
   * Lokalizacja formatowania (daty, waluty, etykiety).
   * Format BCP 47, np. 'pl-PL'.
   */
  locale?: string;

  /**
   * Branża wykonawcy — umożliwia przyszły dobór szablonu per trade.
   * Wartości: TradeType z unified-document-payload.ts
   */
  trade?: string;

  /**
   * Poziom planu subskrypcji.
   * Wartości: 'free' | 'basic' | 'pro' | 'enterprise'
   */
  planTier?: string;
}
