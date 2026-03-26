/**
 * generate-offer-pdf — Deno-local type definitions.
 *
 * Mirror of src/types/offer-pdf-payload.ts (frontend) adapted for the Deno
 * runtime. Kept in sync manually; the schemaVersion field is the version gate.
 *
 * Roadmap §26 PDF Migration — PR 2 (Edge Function).
 */

// ── Sub-types ─────────────────────────────────────────────────────────────────

export interface PDFCompanyInfo {
  name: string;
  nip?: string;
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
  category: "Materiał" | "Robocizna";
  notes?: string;
}

export interface PDFQuoteData {
  positions: PDFOfferPosition[];
  summaryMaterials: number;
  summaryLabor: number;
  marginPercent: number;
  total: number;
  vatRate: number | null;
  isVatExempt: boolean;
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
}

export type PDFTemplateId = "classic" | "modern" | "minimal";

export interface PDFConfig {
  version: "standard" | "premium";
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

export interface OfferPDFPayload {
  projectId: string;
  projectName: string;
  company: PDFCompanyInfo;
  client: PDFClientInfo | null;
  quote: PDFQuoteData | null;
  pdfConfig: PDFConfig;
  generatedAt: string;
  documentId: string;
  issuedAt: string;
  validUntil: string;
  variantSections?: PDFVariantSection[];
  acceptanceUrl?: string;
  schemaVersion: 1;
}

// ── Runtime validation ────────────────────────────────────────────────────────

/**
 * Minimal runtime check — ensures the required top-level fields are present
 * and the schemaVersion is supported. Returns an error message or null.
 */
export function validatePayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object.";
  }

  const p = body as Record<string, unknown>;

  if (p.schemaVersion !== 1) {
    return `Unsupported schemaVersion: ${String(p.schemaVersion)}. Expected 1.`;
  }
  if (typeof p.projectId !== "string" || !p.projectId) {
    return "Missing required field: projectId";
  }
  if (typeof p.projectName !== "string" || !p.projectName) {
    return "Missing required field: projectName";
  }
  if (!p.company || typeof p.company !== "object") {
    return "Missing required field: company";
  }
  if (typeof (p.company as Record<string, unknown>).name !== "string") {
    return "Missing required field: company.name";
  }
  if (typeof p.documentId !== "string" || !p.documentId) {
    return "Missing required field: documentId";
  }
  if (typeof p.issuedAt !== "string" || !p.issuedAt) {
    return "Missing required field: issuedAt";
  }
  if (typeof p.validUntil !== "string" || !p.validUntil) {
    return "Missing required field: validUntil";
  }

  return null;
}
