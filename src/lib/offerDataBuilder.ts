/**
 * Offer Data Builder - Phase 5A
 *
 * Centralized logic for building offer data payload.
 * This prepares the data structure for PDF generation (Phase 5B) and email sending.
 *
 * PHASE 5 ROADMAP:
 * - Phase 5A (current): Data structure + email templates (no PDF generation yet)
 * - Phase 5B (next): Add PDF generation library (jsPDF/pdfmake) + Supabase Storage upload
 * - Phase 5C (final): Shareable PDF links + attach to emails
 */

import { formatCurrency } from './formatters';

/**
 * PDF template style identifiers.
 * 'classic', 'modern', 'minimal' are free-tier templates.
 * Additional templates can be added here for higher plans.
 */
export type PdfTemplateId = 'classic' | 'modern' | 'minimal';

/**
 * Single quote position (material or labor)
 */
export interface OfferPosition {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: 'Materiał' | 'Robocizna';
  notes?: string;
}

/**
 * Company profile data for offer header
 */
export interface CompanyInfo {
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

/**
 * Client data for offer
 */
export interface ClientInfo {
  name: string;
  email?: string;
  address?: string;
  phone?: string;
}

/**
 * Quote/estimation data
 */
export interface QuoteData {
  positions: OfferPosition[];
  summaryMaterials: number;
  summaryLabor: number;
  marginPercent: number;
  total: number;
  /** VAT rate percentage (e.g. 23). null means seller is VAT-exempt. */
  vatRate: number | null;
  /** true = seller is not a VAT payer ("zwolniony z VAT") */
  isVatExempt: boolean;
  /** Net total before VAT (equals total when VAT-exempt) */
  netTotal: number;
  /** VAT amount (0 when VAT-exempt) */
  vatAmount: number;
  /** Gross total including VAT (equals total when VAT-exempt) */
  grossTotal: number;
}

/**
 * PDF-specific configuration
 */
export interface PdfConfig {
  version: 'standard' | 'premium';
  /** Template style for PDF layout. Defaults to 'classic'. */
  templateId?: PdfTemplateId;
  title: string;
  offerText: string;
  terms: string;
  deadlineText: string;
}

/**
 * A single named variant section for PDF output.
 * Present only when the offer has multiple variants.
 * Sprint: offer-versioning-7RcU5.
 */
export interface OfferVariantSection {
  id: string;
  label: string;
  sort_order: number;
  quote: QuoteData;
}

/**
 * Complete offer payload ready for PDF generation or email
 */
export interface OfferPdfPayload {
  projectId: string;
  projectName: string;
  company: CompanyInfo;
  client: ClientInfo | null;
  quote: QuoteData | null;
  pdfConfig: PdfConfig;
  generatedAt: Date;
  /** Unique document identifier, e.g. "OF/2026/A1B2C3" */
  documentId: string;
  /** Date the offer was issued */
  issuedAt: Date;
  /** Date until which the offer is valid */
  validUntil: Date;
  /**
   * Named variant sections. Present when offer has variants.
   * When undefined/empty, PDF renders as single offer (current behavior).
   */
  variantSections?: OfferVariantSection[];
  /**
   * URL to the digital (web) version of this offer.
   * When present, a QR code is embedded in the PDF.
   * Format: https://app.example.com/a/{token}
   */
  acceptanceUrl?: string;

  // ── PDF Platform v2 Foundation — pola metadanych (opcjonalne) ─────────────
  //
  // Umożliwiają przyszłe auto-mapowanie szablonu per documentType/trade/planTier.
  // Opcjonalne — nie wpływają na bieżące przepływy generowania PDF.
  // serializeOfferPdfPayload() wypełnia je domyślnymi wartościami.

  /** Typ dokumentu — zawsze 'offer' dla ofert */
  documentType?: 'offer';

  /** Lokalizacja formatowania (np. 'pl-PL'). Domyślnie 'pl-PL'. */
  locale?: string;

  /**
   * Branża wykonawcy. Opcjonalne — pochodzi z profilu użytkownika.
   * Gdy nieobecne, serializer pomija (Edge Function używa 'general' jako default).
   */
  trade?: string;

  /**
   * Poziom planu subskrypcji. Opcjonalne — pochodzi z danych rozliczeniowych.
   * Gdy nieobecne, serializer pomija.
   */
  planTier?: string;
}

/**
 * Generate a stable, human-readable document ID for an offer.
 * Format: OF/{year}/{6-char project suffix}
 * Example: "OF/2026/A1B2C3"
 */
export function generateDocumentId(projectId: string, date?: Date): string {
  const year = (date ?? new Date()).getFullYear();
  const suffix = projectId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `OF/${year}/${suffix}`;
}

/**
 * Build complete offer data from component props
 * This centralizes all data collection logic in one place
 */
export function buildOfferData(params: {
  projectId: string;
  projectName: string;
  profile?: {
    company_name?: string;
    legal_form?: string;
    nip?: string;
    regon?: string;
    krs?: string;
    owner_name?: string;
    representative_name?: string;
    representative_role?: string;
    street?: string;
    postal_code?: string;
    city?: string;
    logo_url?: string | null;
    phone?: string;
    email?: string;
  };
  client?: {
    name?: string;
    email?: string;
    address?: string;
    phone?: string;
  } | null;
  quote?: {
    positions: unknown[];
    summary_materials: number;
    summary_labor: number;
    margin_percent: number;
    total: number;
    /** VAT rate percentage (e.g. 23). Omit or pass null for VAT-exempt sellers. */
    vat_rate?: number | null;
  } | null;
  pdfData?: {
    version: 'standard' | 'premium';
    title: string;
    offer_text: string;
    terms: string;
    deadline_text: string;
  };
  /** Template ID override (UI selection, not persisted to DB) */
  templateId?: PdfTemplateId;
  /** Override the auto-generated document ID */
  documentId?: string;
  /** Override the validity date (default: issuedAt + 30 days) */
  validUntil?: Date;
  /** Locale for formatting (e.g. 'pl-PL', 'en-GB', 'uk-UA'). Default: 'pl-PL'. */
  locale?: string;
  /** Optional i18n translation function for locale-aware default text. */
  t?: (key: string, opts?: Record<string, unknown>) => string;
}): OfferPdfPayload {
  const t = params.t;

  // Company info — resolve representative based on legal form
  const legalForm = params.profile?.legal_form || 'jdg';
  const isJdg = legalForm === 'jdg';
  const representativeName = isJdg
    ? params.profile?.owner_name
    : params.profile?.representative_name;
  const representativeRole = isJdg
    ? 'Właściciel'
    : (params.profile?.representative_role || 'Prezes Zarządu');

  const company: CompanyInfo = {
    name: params.profile?.company_name || 'Majster.AI',
    nip: params.profile?.nip,
    regon: params.profile?.regon || undefined,
    krs: isJdg ? undefined : (params.profile?.krs || undefined),
    representativeName: representativeName || undefined,
    representativeRole: representativeName ? representativeRole : undefined,
    street: params.profile?.street,
    postalCode: params.profile?.postal_code,
    city: params.profile?.city,
    logoUrl: params.profile?.logo_url,
    phone: params.profile?.phone,
    email: params.profile?.email,
  };

  // Client info
  const client: ClientInfo | null = params.client
    ? {
        name: params.client.name || (t ? t('offerPdf.defaultClientName') : 'Klient'),
        email: params.client.email,
        address: params.client.address,
        phone: params.client.phone,
      }
    : null;

  // Quote data with VAT compliance fields
  const quote: QuoteData | null = params.quote
    ? (() => {
        const vatRate = params.quote.vat_rate ?? null;
        const isVatExempt = vatRate === null;
        const netTotal = params.quote.total;
        const vatAmount = isVatExempt ? 0 : netTotal * (vatRate! / 100);
        const grossTotal = netTotal + vatAmount;
        return {
          positions: params.quote.positions.map((pos: unknown, index: number) => ({
            id: (pos as Record<string, unknown>).id || `pos-${index}`,
            name: (pos as Record<string, unknown>).name as string,
            qty: (pos as Record<string, unknown>).qty as number,
            unit: (pos as Record<string, unknown>).unit as string,
            price: (pos as Record<string, unknown>).price as number,
            category: (pos as Record<string, unknown>).category as 'Materiał' | 'Robocizna',
            notes: (pos as Record<string, unknown>).notes as string | undefined,
          })),
          summaryMaterials: params.quote.summary_materials,
          summaryLabor: params.quote.summary_labor,
          marginPercent: params.quote.margin_percent,
          total: params.quote.total,
          vatRate,
          isVatExempt,
          netTotal,
          vatAmount,
          grossTotal,
        };
      })()
    : null;

  // PDF configuration
  const pdfConfig: PdfConfig = params.pdfData
    ? {
        version: params.pdfData.version,
        templateId: params.templateId ?? 'classic',
        title: params.pdfData.title,
        offerText: params.pdfData.offer_text,
        terms: params.pdfData.terms,
        deadlineText: params.pdfData.deadline_text,
      }
    : {
        version: 'standard',
        templateId: params.templateId ?? 'classic',
        title: t
          ? t('offerPdf.defaultTitle', { projectName: params.projectName })
          : `Oferta - ${params.projectName}`,
        offerText: t
          ? t('pdfGenerator.defaultOfferText')
          : 'Szanowni Państwo,\n\nZ przyjemnością przedstawiamy ofertę na wykonanie prac zgodnie z poniższym kosztorysem.',
        terms: t
          ? t('pdfGenerator.defaultTerms')
          : 'Warunki płatności: 50% zaliczka, 50% po wykonaniu.\nGwarancja: 24 miesiące na wykonane prace.',
        deadlineText: t
          ? t('pdfGenerator.defaultDeadline')
          : 'Termin realizacji: do uzgodnienia.',
      };

  const issuedAt = new Date();
  const validUntil =
    params.validUntil ??
    new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    projectId: params.projectId,
    projectName: params.projectName,
    company,
    client,
    quote,
    pdfConfig,
    generatedAt: issuedAt,
    documentId: params.documentId ?? generateDocumentId(params.projectId, issuedAt),
    issuedAt,
    validUntil,
    locale: params.locale ?? 'pl-PL',
  };
}

/**
 * Format offer summary for display or email
 */
export function formatOfferSummary(payload: OfferPdfPayload): string {
  if (!payload.quote) {
    return 'Wycena nie została jeszcze przygotowana.';
  }

  const lines: string[] = [];
  lines.push(`Projekt: ${payload.projectName}`);
  lines.push(`\nPodsumowanie wyceny:`);
  lines.push(`- Materiały: ${formatCurrency(payload.quote.summaryMaterials)}`);
  lines.push(`- Robocizna: ${formatCurrency(payload.quote.summaryLabor)}`);
  lines.push(`- Marża: ${payload.quote.marginPercent}%`);
  lines.push(`\nWartość całkowita: ${formatCurrency(payload.quote.total)}`);

  return lines.join('\n');
}
