/**
 * PDF Platform v2 — UnifiedDocumentPayload
 *
 * Warstwa fundacyjna zunifikowanego modelu dokumentów dla Majster.AI.
 *
 * DLACZEGO TO ISTNIEJE:
 *   Przed v2 każdy typ dokumentu (oferta, gwarancja, protokół) miał własny,
 *   niezależny model payload — bez wspólnych pól documentType / trade / planTier / locale.
 *   Uniemożliwiało to automatyczne mapowanie szablonu, spójne raportowanie i
 *   przyszłe funkcje premium (dobór szablonu per trade).
 *
 * ZAKRES:
 *   - Definiuje słowniki typów: DocumentType, TradeType, PlanTier
 *   - Definiuje UnifiedCompanyInfo / UnifiedClientInfo (rozszerzone o NIP klienta B2B)
 *   - Definiuje sekcje per dokument jako discriminated union (DocumentSection)
 *   - Definiuje UnifiedDocumentPayload (schemaVersion: 2) — JSON-safe wire format
 *
 * WSTECZNA ZGODNOŚĆ:
 *   OfferPDFPayload (schemaVersion: 1) z src/types/offer-pdf-payload.ts
 *   POZOSTAJE NIEZMIENIONY i obsługiwany przez Edge Function generate-offer-pdf.
 *   UnifiedDocumentPayload (v2) jest NOWYM typem dla nowych przepływów dokumentów.
 *   Migracja ofert z v1 → v2 jest planowana jako osobny PR.
 *
 * Roadmap: PDF Platform v2 Foundation.
 */

// ── Słowniki typów ─────────────────────────────────────────────────────────────

/**
 * Wszystkie obsługiwane typy dokumentów generowanych przez Majster.AI.
 * Wartość ta trafia do PDF jako metadane i steruje wyborem szablonu.
 */
export type DocumentType =
  | 'offer'       // Oferta handlowa
  | 'contract'    // Umowa o dzieło / umowa zlecenia
  | 'protocol'    // Protokół odbioru robót
  | 'warranty'    // Karta gwarancyjna
  | 'inspection'; // Protokół oględzin / raport z inspekcji

/**
 * Branża wykonawcy — wpływa na dobór szablonu w planie premium.
 * Wartość 'general' jest domyślna dla ogólnobudowlanych i gdy branża jest nieznana.
 */
export type TradeType =
  | 'general'     // Ogólnobudowlany (domyślny)
  | 'electrical'  // Elektryk
  | 'plumbing'    // Hydraulik
  | 'tiling'      // Glazurnik / kafelkarz
  | 'painting'    // Malarz / tynkarz
  | 'carpentry'   // Cieśla / stolarz
  | 'roofing'     // Dekarz
  | 'hvac'        // Instalacje grzewcze i klimatyzacja
  | 'masonry'     // Murarz
  | 'flooring';   // Posadzkarz

/**
 * Poziom planu subskrypcji — określa dostępne funkcje PDF.
 * 'free' — podstawowy PDF, bez brandingu premium.
 * 'basic' — logo firmy, pełne dane.
 * 'pro' — pełne branding + szablony branżowe.
 * 'enterprise' — pełna customizacja + API.
 */
export type PlanTier = 'free' | 'basic' | 'pro' | 'enterprise';

// ── Wspólne typy danych stron ─────────────────────────────────────────────────

/**
 * Dane firmy / wykonawcy (wystawcy dokumentu).
 * Rozszerzone względem PDFCompanyInfo (v1) o brak — oba interfejsy mają
 * identyczne pola; UnifiedCompanyInfo stanowi autonomiczną definicję dla v2.
 */
export interface UnifiedCompanyInfo {
  name: string;
  nip?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  logoUrl?: string | null;
  phone?: string;
  email?: string;
}

/**
 * Dane klienta / odbiorcy dokumentu.
 * Rozszerzone o clientNip względem PDFClientInfo (v1) dla obsługi B2B.
 */
export interface UnifiedClientInfo {
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  /** NIP klienta — dla faktur i umów B2B */
  clientNip?: string;
}

// ── Sekcje specyficzne dla dokumentów ─────────────────────────────────────────

/** Pozycja kosztorysu (wyceny) — wspólna dla oferty i kontraktu */
export interface UnifiedOfferPosition {
  id: string;
  name: string;
  qty: number;
  unit: string;
  /** Cena jednostkowa netto */
  price: number;
  category: 'Materiał' | 'Robocizna';
  notes?: string;
}

/** Dane wyceny (netto/VAT/brutto) */
export interface UnifiedQuoteData {
  positions: UnifiedOfferPosition[];
  summaryMaterials: number;
  summaryLabor: number;
  marginPercent: number;
  total: number;
  /** Stawka VAT w % (np. 23). null = zwolnienie z VAT */
  vatRate: number | null;
  isVatExempt: boolean;
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
}

/** Wariant oferty (dla ofert wielowariantowych) */
export interface UnifiedVariantSection {
  id: string;
  label: string;
  sort_order: number;
  quote: UnifiedQuoteData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sekcja: Oferta handlowa
// ─────────────────────────────────────────────────────────────────────────────

export interface OfferDocumentSection {
  readonly type: 'offer';
  quote: UnifiedQuoteData | null;
  /** Warianty — gdy oferta jest wielowariantowa */
  variantSections?: UnifiedVariantSection[];
  pdfConfig: {
    title: string;
    offerText: string;
    terms: string;
    deadlineText: string;
  };
  /** URL do strony cyfrowej akceptacji oferty (generuje QR code w PDF) */
  acceptanceUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sekcja: Karta gwarancyjna
// ─────────────────────────────────────────────────────────────────────────────

export interface WarrantyDocumentSection {
  readonly type: 'warranty';
  /** Czas trwania gwarancji w miesiącach */
  warrantyMonths: number;
  /** ISO 8601 — data rozpoczęcia gwarancji */
  startDate: string;
  /** ISO 8601 — data zakończenia gwarancji */
  endDate: string;
  /** Zakres prac objętych gwarancją */
  scopeOfWork?: string;
  /** Wyłączenia z gwarancji */
  exclusions?: string;
  /** Dane kontaktowe w sprawach gwarancyjnych */
  contactPhone?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sekcja: Protokół odbioru
// ─────────────────────────────────────────────────────────────────────────────

export interface ProtocolItem {
  description: string;
  /** true = przyjęto bez zastrzeżeń */
  accepted: boolean;
  notes?: string;
}

export interface ProtocolDocumentSection {
  readonly type: 'protocol';
  items?: ProtocolItem[];
  notes?: string;
  /** ISO 8601 — data odbioru */
  receptionDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sekcja: Umowa
// ─────────────────────────────────────────────────────────────────────────────

export interface ContractDocumentSection {
  readonly type: 'contract';
  /** Przedmiot umowy */
  subject: string;
  /** Wartość kontraktu netto */
  value: number;
  /** Stawka VAT (null = zwolnienie) */
  vatRate: number | null;
  /** ISO 8601 — data rozpoczęcia */
  startDate: string;
  /** ISO 8601 — data zakończenia (null = bezterminowa) */
  endDate?: string;
  paymentTerms?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sekcja: Protokół oględzin / raport
// ─────────────────────────────────────────────────────────────────────────────

export interface InspectionPhoto {
  url: string;
  caption?: string;
}

export interface InspectionDocumentSection {
  readonly type: 'inspection';
  findings?: string;
  recommendations?: string;
  photos?: InspectionPhoto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Discriminated union wszystkich sekcji
// ─────────────────────────────────────────────────────────────────────────────

export type DocumentSection =
  | OfferDocumentSection
  | WarrantyDocumentSection
  | ProtocolDocumentSection
  | ContractDocumentSection
  | InspectionDocumentSection;

// ── Główny kontrakt v2 ────────────────────────────────────────────────────────

/**
 * UnifiedDocumentPayload v2 — JSON-safe wire format dla wszystkich typów dokumentów.
 *
 * Używać gdy:
 *   - documentType != 'offer' (gwarancja, protokół, umowa, inspekcja)
 *   - Lub gdy nowy przepływ oferty zostanie zmigrowany z v1 → v2
 *
 * Pola schemaVersion: 2, documentType, trade, planTier, locale
 * są WYMAGANE — stanowią fundament automatycznego mapowania szablonu.
 *
 * Reguła: każde pole musi być JSON-serializable (bez Date, bez undefined
 * gdy pole jest opcjonalne — użyć null lub ?: zamiast tego).
 */
export interface UnifiedDocumentPayload {
  /** Zawsze 2 dla tego interfejsu */
  readonly schemaVersion: 2;

  /** Typ dokumentu — steruje wyborem sekcji i szablonu renderowania */
  documentType: DocumentType;

  /**
   * Branża wykonawcy — umożliwia przyszłe auto-mapowanie szablonu per trade.
   * Domyślnie 'general' gdy nieznana.
   */
  trade: TradeType;

  /** Poziom planu — określa dostępne funkcje PDF (logo, szablony premium) */
  planTier: PlanTier;

  /**
   * Lokalizacja formatowania (daty, waluty, etykiety).
   * Format BCP 47, np. 'pl-PL', 'en-GB'.
   * Wymagane do prawidłowego formatowania polskich dat i kwot.
   */
  locale: string;

  // ── Tożsamość dokumentu ────────────────────────────────────────────────────

  /**
   * Czytelny identyfikator dokumentu, np. "OF/2026/A1B2C3", "GWR/2026/XXXX".
   * Format: {PREFIX}/{rok}/{6-znakowy suffix}
   */
  documentId: string;

  /** ISO 8601 — czas wygenerowania payloadu */
  generatedAt: string;

  /** ISO 8601 — data wystawienia dokumentu */
  issuedAt: string;

  /**
   * ISO 8601 — data ważności / wygaśnięcia.
   * null dla dokumentów bez daty ważności (np. protokoły, umowy bezterminowe).
   */
  validUntil: string | null;

  // ── Powiązania źródłowe (do śledzenia) ────────────────────────────────────

  /** UUID oferty źródłowej, jeśli dokument pochodzi z oferty */
  sourceOfferId?: string;

  /** UUID projektu źródłowego */
  sourceProjectId?: string;

  // ── Strony ────────────────────────────────────────────────────────────────

  company: UnifiedCompanyInfo;
  client: UnifiedClientInfo | null;

  // ── Treść specyficzna dla typu dokumentu ──────────────────────────────────

  /**
   * Sekcja zawierająca dane właściwe dla documentType.
   * `section.type` MUSI być identyczny z `documentType`.
   */
  section: DocumentSection;
}

// ── Helpers walidacyjne (runtime, bezpieczne dla both Node i Deno) ─────────────

const VALID_DOCUMENT_TYPES = new Set<string>([
  'offer', 'contract', 'protocol', 'warranty', 'inspection',
]);

const VALID_TRADE_TYPES = new Set<string>([
  'general', 'electrical', 'plumbing', 'tiling', 'painting',
  'carpentry', 'roofing', 'hvac', 'masonry', 'flooring',
]);

const VALID_PLAN_TIERS = new Set<string>([
  'free', 'basic', 'pro', 'enterprise',
]);

/**
 * Minimalny runtime check dla UnifiedDocumentPayload (v2).
 * Zwraca komunikat błędu lub null (gdy OK).
 *
 * Używane zarówno po stronie frontendu jak i w Edge Functions Deno.
 */
export function validateUnifiedPayload(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return 'Request body musi być obiektem JSON.';
  }

  const p = body as Record<string, unknown>;

  if (p.schemaVersion !== 2) {
    return `Nieobsługiwana schemaVersion: ${String(p.schemaVersion)}. Oczekiwano 2.`;
  }

  if (typeof p.documentType !== 'string' || !VALID_DOCUMENT_TYPES.has(p.documentType)) {
    return `Nieprawidłowe documentType: "${String(p.documentType)}". Dozwolone: ${[...VALID_DOCUMENT_TYPES].join(', ')}.`;
  }

  if (typeof p.trade !== 'string' || !VALID_TRADE_TYPES.has(p.trade)) {
    return `Nieprawidłowe trade: "${String(p.trade)}". Dozwolone: ${[...VALID_TRADE_TYPES].join(', ')}.`;
  }

  if (typeof p.planTier !== 'string' || !VALID_PLAN_TIERS.has(p.planTier)) {
    return `Nieprawidłowy planTier: "${String(p.planTier)}". Dozwolone: ${[...VALID_PLAN_TIERS].join(', ')}.`;
  }

  if (typeof p.locale !== 'string' || !p.locale) {
    return 'Brakujące wymagane pole: locale (np. "pl-PL").';
  }

  if (typeof p.documentId !== 'string' || !p.documentId) {
    return 'Brakujące wymagane pole: documentId.';
  }

  if (typeof p.issuedAt !== 'string' || !p.issuedAt) {
    return 'Brakujące wymagane pole: issuedAt (ISO 8601).';
  }

  if (!('validUntil' in p)) {
    return 'Brakujące wymagane pole: validUntil (ISO 8601 lub null).';
  }

  if (p.validUntil !== null && typeof p.validUntil !== 'string') {
    return 'Pole validUntil musi być ciągiem ISO 8601 lub null.';
  }

  if (!p.company || typeof p.company !== 'object') {
    return 'Brakujące wymagane pole: company.';
  }

  const companyName = (p.company as Record<string, unknown>).name;
  if (typeof companyName !== 'string' || !companyName) {
    return 'Brakujące wymagane pole: company.name.';
  }

  if (!p.section || typeof p.section !== 'object') {
    return 'Brakujące wymagane pole: section.';
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
