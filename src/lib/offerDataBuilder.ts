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
}

/**
 * PDF-specific configuration
 */
export interface PdfConfig {
  version: 'standard' | 'premium';
  title: string;
  offerText: string;
  terms: string;
  deadlineText: string;
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
    nip?: string;
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
    positions: any[];
    summary_materials: number;
    summary_labor: number;
    margin_percent: number;
    total: number;
  } | null;
  pdfData?: {
    version: 'standard' | 'premium';
    title: string;
    offer_text: string;
    terms: string;
    deadline_text: string;
  };
}): OfferPdfPayload {
  // Company info
  const company: CompanyInfo = {
    name: params.profile?.company_name || 'Majster.AI',
    nip: params.profile?.nip,
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
        name: params.client.name || 'Klient',
        email: params.client.email,
        address: params.client.address,
        phone: params.client.phone,
      }
    : null;

  // Quote data
  const quote: QuoteData | null = params.quote
    ? {
        positions: params.quote.positions.map((pos: any, index: number) => ({
          id: pos.id || `pos-${index}`,
          name: pos.name,
          qty: pos.qty,
          unit: pos.unit,
          price: pos.price,
          category: pos.category,
          notes: pos.notes,
        })),
        summaryMaterials: params.quote.summary_materials,
        summaryLabor: params.quote.summary_labor,
        marginPercent: params.quote.margin_percent,
        total: params.quote.total,
      }
    : null;

  // PDF configuration
  const pdfConfig: PdfConfig = params.pdfData
    ? {
        version: params.pdfData.version,
        title: params.pdfData.title,
        offerText: params.pdfData.offer_text,
        terms: params.pdfData.terms,
        deadlineText: params.pdfData.deadline_text,
      }
    : {
        version: 'standard',
        title: `Oferta - ${params.projectName}`,
        offerText:
          'Szanowni Państwo,\n\nZ przyjemnością przedstawiamy ofertę na wykonanie prac zgodnie z poniższym kosztorysem.',
        terms:
          'Warunki płatności: 50% zaliczka, 50% po wykonaniu.\nGwarancja: 24 miesiące na wykonane prace.',
        deadlineText: 'Termin realizacji: do uzgodnienia.',
      };

  return {
    projectId: params.projectId,
    projectName: params.projectName,
    company,
    client,
    quote,
    pdfConfig,
    generatedAt: new Date(),
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
