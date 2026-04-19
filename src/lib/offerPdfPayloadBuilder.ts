/**
 * offerPdfPayloadBuilder — PR-11 (extended in offer-versioning-7RcU5)
 *
 * Builds an OfferPdfPayload from the new `offers` + `offer_items` tables
 * (PR-09/PR-10 data model). Used by OfferPreviewModal and useSendOffer.
 *
 * offer-versioning-7RcU5:
 *   - Loads offer_variants when present
 *   - Adds variants to payload so PDF generator can render per-variant sections
 */

import { supabase } from '@/integrations/supabase/client';
import {
  OfferPdfPayload,
  CompanyInfo,
  ClientInfo,
  QuoteData,
  PdfConfig,
  generateDocumentId,
  OfferVariantSection,
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
  variant_id: string | null;
}

interface RawVariant {
  id: string;
  label: string;
  sort_order: number;
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
  legal_form: string;
  nip: string | null;
  regon: string | null;
  krs: string | null;
  owner_name: string | null;
  representative_name: string | null;
  representative_role: string | null;
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
 * @param locale  - Optional i18n locale string (e.g. 'pl', 'en', 'uk'). Defaults to 'pl-PL'.
 */
export async function buildOfferPdfPayloadFromOffer(
  offerId: string,
  userId: string,
  locale?: string,
): Promise<OfferPdfPayload> {
  // ── 1. Load offer row ────────────────────────────────────────────────────
  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('id, title, currency, total_net, total_vat, total_gross, client_id, created_at')
    .eq('id', offerId)
    .single();

  if (offerErr) throw offerErr;
  const rawOffer = offer as RawOffer;

  // ── 2. Load offer items (now includes variant_id) ────────────────────────
  const { data: itemsData, error: itemsErr } = await supabase
    .from('offer_items')
    .select('id, name, unit, qty, unit_price_net, vat_rate, line_total_net, item_type, variant_id')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: true });

  if (itemsErr) throw itemsErr;
  const rawItems: RawOfferItem[] = (itemsData ?? []) as RawOfferItem[];

  // ── 3. Load variants (if any) ────────────────────────────────────────────
  const { data: variantsData } = await supabase
    .from('offer_variants')
    .select('id, label, sort_order')
    .eq('offer_id', offerId)
    .order('sort_order', { ascending: true });

  // ── 3b. Load acceptance link token (for QR code) ─────────────────────────
  const { data: linkData } = await supabase
    .from('acceptance_links')
    .select('token')
    .eq('offer_id', offerId)
    .maybeSingle();
  const acceptanceUrl = linkData?.token
    ? `${window.location.origin}/a/${linkData.token}`
    : undefined;

  const rawVariants: RawVariant[] = (variantsData ?? []) as RawVariant[];

  // ── 4. Load client (if linked) ───────────────────────────────────────────
  let rawClient: RawClient | null = null;
  if (rawOffer.client_id) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('id, name, email, phone, address')
      .eq('id', rawOffer.client_id)
      .maybeSingle();
    rawClient = clientData as RawClient | null;
  }

  // ── 5. Load profile (company info) ──────────────────────────────────────
  const { data: profileData } = await supabase
    .from('profiles')
    .select('company_name, legal_form, nip, regon, krs, owner_name, representative_name, representative_role, street, postal_code, city, phone, email_for_offers, logo_url')
    .eq('user_id', userId)
    .maybeSingle();
  const rawProfile = profileData as RawProfile | null;

  // ── 6. Build company info ────────────────────────────────────────────────
  const legalForm = rawProfile?.legal_form || 'jdg';
  const isJdg = legalForm === 'jdg';
  const repName = isJdg
    ? rawProfile?.owner_name
    : rawProfile?.representative_name;
  const repRole = isJdg
    ? 'Właściciel'
    : (rawProfile?.representative_role || 'Prezes Zarządu');

  const company: CompanyInfo = {
    name: rawProfile?.company_name || '',
    nip: rawProfile?.nip ?? undefined,
    regon: rawProfile?.regon ?? undefined,
    krs: isJdg ? undefined : (rawProfile?.krs ?? undefined),
    representativeName: repName ?? undefined,
    representativeRole: repName ? repRole : undefined,
    street: rawProfile?.street ?? undefined,
    postalCode: rawProfile?.postal_code ?? undefined,
    city: rawProfile?.city ?? undefined,
    logoUrl: rawProfile?.logo_url ?? null,
    phone: rawProfile?.phone ?? undefined,
    email: rawProfile?.email_for_offers ?? undefined,
  };

  // ── 7. Build client info ─────────────────────────────────────────────────
  const client: ClientInfo | null = rawClient
    ? {
        name: rawClient.name,
        email: rawClient.email ?? undefined,
        address: rawClient.address ?? undefined,
        phone: rawClient.phone ?? undefined,
      }
    : null;

  // ── 8. Build quote data from offer_items ─────────────────────────────────

  // Helper to build QuoteData from a slice of items
  function buildQuoteData(items: RawOfferItem[], overrideTotals?: {
    net: number; vat: number; gross: number;
  }): QuoteData | null {
    if (items.length === 0) return null;
    const vatRates = items.map((it) => it.vat_rate).filter((r): r is number => r !== null);
    const vatRate = vatRates.length > 0 ? vatRates[0] : null;
    const isVatExempt = vatRate === null;
    const netTotal = overrideTotals?.net ?? items.reduce((s, it) => s + it.line_total_net, 0);
    const vatAmount = overrideTotals?.vat ?? (isVatExempt ? 0 : items.reduce((s, it) => {
      const r = it.vat_rate ?? 0;
      return s + Number(it.qty) * Number(it.unit_price_net) * (r / 100);
    }, 0));
    const grossTotal = overrideTotals?.gross ?? netTotal + vatAmount;

    return {
      positions: items.map((it) => ({
        id: it.id,
        name: it.name,
        qty: Number(it.qty),
        unit: it.unit ?? 'szt.',
        price: Number(it.unit_price_net),
        category: it.item_type === 'material' ? 'Materiał' : 'Robocizna',
      })),
      summaryMaterials: items.filter((it) => it.item_type === 'material').reduce((s, it) => s + it.line_total_net, 0),
      summaryLabor: items.filter((it) => it.item_type !== 'material').reduce((s, it) => s + it.line_total_net, 0),
      marginPercent: 0,
      total: netTotal,
      vatRate,
      isVatExempt,
      netTotal,
      vatAmount,
      grossTotal,
    };
  }

  let quoteData: QuoteData | null = null;
  let variantSections: OfferVariantSection[] | undefined;

  if (rawVariants.length > 0) {
    // Variant mode: build per-variant sections
    variantSections = rawVariants.map((v) => {
      const vItems = rawItems.filter((it) => it.variant_id === v.id);
      return {
        id: v.id,
        label: v.label,
        sort_order: v.sort_order,
        quote: buildQuoteData(vItems) ?? {
          positions: [],
          summaryMaterials: 0,
          summaryLabor: 0,
          marginPercent: 0,
          total: 0,
          vatRate: null,
          isVatExempt: true,
          netTotal: 0,
          vatAmount: 0,
          grossTotal: 0,
        },
      };
    });

    // quoteData = first variant (for overall offer totals)
    const firstVariantItems = rawItems.filter((it) => it.variant_id === rawVariants[0]?.id);
    quoteData = buildQuoteData(firstVariantItems, {
      net: rawOffer.total_net ?? 0,
      vat: rawOffer.total_vat ?? 0,
      gross: rawOffer.total_gross ?? 0,
    });
  } else {
    // No-variant mode: current behavior
    const noVariantItems = rawItems.filter((it) => it.variant_id === null);
    const allItems = noVariantItems.length > 0 ? noVariantItems : rawItems;
    quoteData = buildQuoteData(allItems, {
      net: rawOffer.total_net ?? allItems.reduce((s, it) => s + it.line_total_net, 0),
      vat: rawOffer.total_vat ?? 0,
      gross: rawOffer.total_gross ?? rawOffer.total_net ?? 0,
    });
  }

  // ── 9. Build PDF config ───────────────────────────────────────────────────
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
    variantSections,
    acceptanceUrl,
    locale,
  };
}
