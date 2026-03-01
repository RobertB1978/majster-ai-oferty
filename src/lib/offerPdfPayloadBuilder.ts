/**
 * offerPdfPayloadBuilder — PR-11
 *
 * Builds an OfferPdfPayload from the new `offers` + `offer_items` tables
 * (PR-09/PR-10 data model). Used by OfferPreviewModal and useSendOffer.
 *
 * Unlike the legacy `buildOfferData` (which reads from `quotes` + `pdf_data`),
 * this builder queries the new tables directly.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  OfferPdfPayload,
  CompanyInfo,
  ClientInfo,
  QuoteData,
  PdfConfig,
  generateDocumentId,
} from './offerDataBuilder';

// ── Types returned from Supabase queries ──────────────────────────────────────

interface RawOffer {
  id: string;
  title: string | null;
  currency: string;
  total_net: number | null;
  total_vat: number | null;
  total_gross: number | null;
  client_id: string | null;
  created_at: string;
}

interface RawOfferItem {
  id: string;
  name: string;
  unit: string | null;
  qty: number;
  unit_price_net: number;
  vat_rate: number | null;
  line_total_net: number;
  item_type: string;
}

interface RawClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface RawProfile {
  company_name: string;
  nip: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  email_for_offers: string | null;
  logo_url: string | null;
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Async function that queries Supabase and builds a complete OfferPdfPayload
 * from the offers + offer_items data model (PR-10).
 *
 * @param offerId - UUID of the offer row
 * @param userId  - UUID of the authenticated user (for profile fetch)
 */
export async function buildOfferPdfPayloadFromOffer(
  offerId: string,
  userId: string,
): Promise<OfferPdfPayload> {
  // ── 1. Load offer row ────────────────────────────────────────────────────
  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('id, title, currency, total_net, total_vat, total_gross, client_id, created_at')
    .eq('id', offerId)
    .single();

  if (offerErr) throw offerErr;
  const rawOffer = offer as RawOffer;

  // ── 2. Load offer items ──────────────────────────────────────────────────
  const { data: itemsData, error: itemsErr } = await supabase
    .from('offer_items')
    .select('id, name, unit, qty, unit_price_net, vat_rate, line_total_net, item_type')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: true });

  if (itemsErr) throw itemsErr;
  const rawItems: RawOfferItem[] = (itemsData ?? []) as RawOfferItem[];

  // ── 3. Load client (if linked) ───────────────────────────────────────────
  let rawClient: RawClient | null = null;
  if (rawOffer.client_id) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('id, name, email, phone, address')
      .eq('id', rawOffer.client_id)
      .maybeSingle();
    rawClient = clientData as RawClient | null;
  }

  // ── 4. Load profile (company info) ──────────────────────────────────────
  const { data: profileData } = await supabase
    .from('profiles')
    .select('company_name, nip, street, postal_code, city, phone, email_for_offers, logo_url')
    .eq('user_id', userId)
    .maybeSingle();
  const rawProfile = profileData as RawProfile | null;

  // ── 5. Build company info ────────────────────────────────────────────────
  const company: CompanyInfo = {
    name: rawProfile?.company_name || 'Majster.AI',
    nip: rawProfile?.nip ?? undefined,
    street: rawProfile?.street ?? undefined,
    postalCode: rawProfile?.postal_code ?? undefined,
    city: rawProfile?.city ?? undefined,
    logoUrl: rawProfile?.logo_url ?? null,
    phone: rawProfile?.phone ?? undefined,
    email: rawProfile?.email_for_offers ?? undefined,
  };

  // ── 6. Build client info ─────────────────────────────────────────────────
  const client: ClientInfo | null = rawClient
    ? {
        name: rawClient.name,
        email: rawClient.email ?? undefined,
        address: rawClient.address ?? undefined,
        phone: rawClient.phone ?? undefined,
      }
    : null;

  // ── 7. Build quote data from offer_items ─────────────────────────────────
  let quoteData: QuoteData | null = null;
  if (rawItems.length > 0) {
    // Determine a representative VAT rate (use the most common non-null rate, or null if all exempt)
    const vatRates = rawItems.map((it) => it.vat_rate).filter((r): r is number => r !== null);
    const vatRate = vatRates.length > 0 ? vatRates[0] : null;
    const isVatExempt = vatRate === null;

    const netTotal = rawOffer.total_net ?? rawItems.reduce((s, it) => s + it.line_total_net, 0);
    const vatAmount = rawOffer.total_vat ?? 0;
    const grossTotal = rawOffer.total_gross ?? netTotal + vatAmount;

    quoteData = {
      positions: rawItems.map((it) => ({
        id: it.id,
        name: it.name,
        qty: Number(it.qty),
        unit: it.unit ?? 'szt.',
        price: Number(it.unit_price_net),
        category: it.item_type === 'material' ? 'Materiał' : 'Robocizna',
      })),
      // Legacy summary fields — compute from items
      summaryMaterials: rawItems
        .filter((it) => it.item_type === 'material')
        .reduce((s, it) => s + it.line_total_net, 0),
      summaryLabor: rawItems
        .filter((it) => it.item_type !== 'material')
        .reduce((s, it) => s + it.line_total_net, 0),
      marginPercent: 0,
      total: netTotal,
      vatRate,
      isVatExempt,
      netTotal,
      vatAmount,
      grossTotal,
    };
  }

  // ── 8. Build PDF config (minimal defaults for wizard offers) ─────────────
  const issuedAt = new Date();
  const validUntil = new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

  const pdfConfig: PdfConfig = {
    version: 'standard',
    templateId: 'classic',
    title: rawOffer.title || 'Oferta',
    offerText: '',
    terms: '',
    deadlineText: '',
  };

  return {
    projectId: offerId,
    projectName: rawOffer.title || 'Oferta',
    company,
    client,
    quote: quoteData,
    pdfConfig,
    generatedAt: new Date(),
    documentId: generateDocumentId(offerId, issuedAt),
    issuedAt,
    validUntil,
  };
}
