/**
 * unified-document-payload — Deno mirror
 *
 * Lustrzane odbicie src/types/unified-document-payload.ts dla środowiska Deno
 * (Supabase Edge Functions). Utrzymywane ręcznie w synchronizacji z frontendem.
 * Pole schemaVersion stanowi bramę wersji.
 *
 * ZAKRES: wyłącznie typy TypeScript + runtime walidacja.
 * Brak zależności od runtime Node.js ani przeglądarki — bezpieczne dla Deno.
 *
 * Roadmap: PDF Platform v2 — Canonical Renderer.
 */

// ── Słowniki typów ─────────────────────────────────────────────────────────────

export type DocumentType =
  | "offer"
  | "contract"
  | "protocol"
  | "warranty"
  | "inspection";

export type TradeType =
  | "general"
  | "electrical"
  | "plumbing"
  | "tiling"
  | "painting"
  | "carpentry"
  | "roofing"
  | "hvac"
  | "masonry"
  | "flooring";

export type PlanTier = "free" | "basic" | "pro" | "enterprise";

// ── Wspólne typy danych stron ─────────────────────────────────────────────────

export interface UnifiedCompanyInfo {
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

export interface UnifiedClientInfo {
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  clientNip?: string;
}

// ── Sekcje dokumentów ─────────────────────────────────────────────────────────

export interface UnifiedOfferPosition {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: "Materiał" | "Robocizna";
  notes?: string;
}

export interface UnifiedQuoteData {
  positions: UnifiedOfferPosition[];
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

export interface UnifiedVariantSection {
  id: string;
  label: string;
  sort_order: number;
  quote: UnifiedQuoteData;
}

export interface OfferDocumentSection {
  readonly type: "offer";
  quote: UnifiedQuoteData | null;
  variantSections?: UnifiedVariantSection[];
  pdfConfig: {
    title: string;
    offerText: string;
    terms: string;
    deadlineText: string;
  };
  acceptanceUrl?: string;
}

export interface WarrantyDocumentSection {
  readonly type: "warranty";
  warrantyMonths: number;
  startDate: string;
  endDate: string;
  scopeOfWork?: string;
  exclusions?: string;
  contactPhone?: string;
}

export interface ProtocolItem {
  description: string;
  accepted: boolean;
  notes?: string;
}

export interface ProtocolDocumentSection {
  readonly type: "protocol";
  items?: ProtocolItem[];
  notes?: string;
  receptionDate?: string;
}

export interface ContractDocumentSection {
  readonly type: "contract";
  subject: string;
  value: number;
  vatRate: number | null;
  startDate: string;
  endDate?: string;
  paymentTerms?: string;
}

export interface InspectionPhoto {
  url: string;
  caption?: string;
}

export interface InspectionDocumentSection {
  readonly type: "inspection";
  findings?: string;
  recommendations?: string;
  photos?: InspectionPhoto[];
}

export type DocumentSection =
  | OfferDocumentSection
  | WarrantyDocumentSection
  | ProtocolDocumentSection
  | ContractDocumentSection
  | InspectionDocumentSection;

// ── Główny kontrakt v2 ────────────────────────────────────────────────────────

export interface UnifiedDocumentPayload {
  readonly schemaVersion: 2;
  documentType: DocumentType;
  trade: TradeType;
  planTier: PlanTier;
  locale: string;
  documentId: string;
  generatedAt: string;
  issuedAt: string;
  validUntil: string | null;
  sourceOfferId?: string;
  sourceProjectId?: string;
  company: UnifiedCompanyInfo;
  client: UnifiedClientInfo | null;
  section: DocumentSection;
}

// ── Helpers walidacyjne ───────────────────────────────────────────────────────

const VALID_DOCUMENT_TYPES = new Set<string>([
  "offer", "contract", "protocol", "warranty", "inspection",
]);

const VALID_TRADE_TYPES = new Set<string>([
  "general", "electrical", "plumbing", "tiling", "painting",
  "carpentry", "roofing", "hvac", "masonry", "flooring",
]);

const VALID_PLAN_TIERS = new Set<string>([
  "free", "basic", "pro", "enterprise",
]);

/**
 * Minimalny runtime check dla UnifiedDocumentPayload v2.
 * Zwraca komunikat błędu lub null (OK).
 * Bezpieczne dla Deno i przeglądarki (brak zależności platformowych).
 */
export function validateUnifiedPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body musi być obiektem JSON.";
  }

  const p = body as Record<string, unknown>;

  if (p.schemaVersion !== 2) {
    return `Nieobsługiwana schemaVersion: ${String(p.schemaVersion)}. Oczekiwano 2.`;
  }

  if (typeof p.documentType !== "string" || !VALID_DOCUMENT_TYPES.has(p.documentType)) {
    return `Nieprawidłowe documentType: "${String(p.documentType)}". Dozwolone: ${[...VALID_DOCUMENT_TYPES].join(", ")}.`;
  }

  if (typeof p.trade !== "string" || !VALID_TRADE_TYPES.has(p.trade)) {
    return `Nieprawidłowe trade: "${String(p.trade)}". Dozwolone: ${[...VALID_TRADE_TYPES].join(", ")}.`;
  }

  if (typeof p.planTier !== "string" || !VALID_PLAN_TIERS.has(p.planTier)) {
    return `Nieprawidłowy planTier: "${String(p.planTier)}". Dozwolone: ${[...VALID_PLAN_TIERS].join(", ")}.`;
  }

  if (typeof p.locale !== "string" || !p.locale) {
    return 'Brakujące wymagane pole: locale (np. "pl-PL").';
  }

  if (typeof p.documentId !== "string" || !p.documentId) {
    return "Brakujące wymagane pole: documentId.";
  }

  if (typeof p.issuedAt !== "string" || !p.issuedAt) {
    return "Brakujące wymagane pole: issuedAt (ISO 8601).";
  }

  if (!("validUntil" in p)) {
    return "Brakujące wymagane pole: validUntil (ISO 8601 lub null).";
  }

  if (p.validUntil !== null && typeof p.validUntil !== "string") {
    return "Pole validUntil musi być ciągiem ISO 8601 lub null.";
  }

  if (!p.company || typeof p.company !== "object") {
    return "Brakujące wymagane pole: company.";
  }

  const companyName = (p.company as Record<string, unknown>).name;
  if (typeof companyName !== "string" || !companyName) {
    return "Brakujące wymagane pole: company.name.";
  }

  if (!p.section || typeof p.section !== "object") {
    return "Brakujące wymagane pole: section.";
  }

  const section = p.section as Record<string, unknown>;
  if (section.type !== p.documentType) {
    return `Niezgodność: section.type="${String(section.type)}" musi być identyczne z documentType="${String(p.documentType)}".`;
  }

  return null;
}

/**
 * Type guard — sprawdza czy payload jest UnifiedDocumentPayload v2.
 */
export function isUnifiedDocumentPayload(value: unknown): value is UnifiedDocumentPayload {
  return validateUnifiedPayload(value) === null;
}
