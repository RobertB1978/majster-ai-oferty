/**
 * renderPdfV2 — Kanoniczny frontend koordynator PDF Platform v2
 *
 * Jest to JEDYNY właściwy punkt wejścia dla nowych przepływów generowania PDF.
 * Wszystkie nowe funkcje generujące dokumenty POWINNY używać tej funkcji
 * zamiast wywoływać generatory jsPDF bezpośrednio.
 *
 * ── Strategia renderowania ─────────────────────────────────────────────────
 *   1. Próba serwer-first: Edge Function generate-pdf-v2 (@react-pdf/renderer)
 *      → Wyższa jakość, polskie czcionki, serwer-side rendering
 *      → Obsługuje WSZYSTKIE 5 typów: offer, warranty, protocol, contract, inspection
 *   2. Fallback klient-side (dla 'offer' i 'warranty'):
 *      → jsPDF (offerPdfGenerator / warrantyPdfGenerator) — gdy Edge Function niedostępna
 *   3. Dla typów bez klient-side fallbacku (protocol, contract, inspection):
 *      → rzuca PendingMigrationError gdy Edge Function jest niedostępna
 *      → Istniejące UI komponentów używają bezpośrednio generatorów jsPDF
 *        (templatePdfGenerator) jako fallback
 *
 * ── Klasyfikacja ścieżek renderowania ─────────────────────────────────────
 *   CANONICAL  : generate-pdf-v2 (Edge Function, @react-pdf/renderer)
 *                Obsługuje: wszystkie 5 typów dokumentów
 *   FALLBACK   : offerPdfGenerator.ts (jsPDF, 'offer')
 *                warrantyPdfGenerator.ts (jsPDF, 'warranty')
 *   LEGACY     : generateServerPdf.ts (OfferPDFPayload v1 → generate-offer-pdf)
 *   STANDALONE : templatePdfGenerator.ts
 *                (jsPDF, fallback dla protocol/contract/inspection gdy Edge Function niedostępna)
 *
 * Roadmap: PDF Platform v2 — Canonical Renderer.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { generateOfferPdf } from '@/lib/offerPdfGenerator';
import type { OfferPdfTranslateFn } from '@/lib/offerPdfGenerator';
import { generateWarrantyPdfBlob } from '@/lib/warrantyPdfGenerator';
import type { WarrantyPdfContext } from '@/lib/warrantyPdfGenerator';
import type { OfferPdfPayload, QuoteData, OfferVariantSection } from '@/lib/offerDataBuilder';
import type {
  UnifiedDocumentPayload,
  OfferDocumentSection,
  UnifiedQuoteData,
  UnifiedVariantSection,
  DocumentType,
} from '@/types/unified-document-payload';
import {
  resolveTemplateVariant,
  visualStyleToJsPdfTemplate,
} from '@/lib/pdf/documentVisualSystem';

// ── Typy błędów ───────────────────────────────────────────────────────────────

/**
 * Rzucany gdy Edge Function generate-pdf-v2 jest niedostępna
 * i dany documentType nie ma klient-side jsPDF fallbacku.
 *
 * Dotyczy: protocol, contract, inspection — typy obsługiwane server-side,
 * ale bez klient-side generatora jsPDF jako fallback.
 * Wywołujący (np. TemplateEditor) powinien obsłużyć ten błąd
 * i użyć generateTemplatePdf (jsPDF) jako alternatywy.
 */
export class PendingMigrationError extends Error {
  constructor(
    public readonly documentType: DocumentType,
    public readonly cause?: unknown,
  ) {
    super(
      `renderPdfV2: documentType '${documentType}' oczekuje na migrację do v2 renderera. ` +
      `Użyj bezpośrednio warrantyPdfGenerator lub templatePdfGenerator.`,
    );
    this.name = 'PendingMigrationError';
  }
}

// ── Adapter v2 → OfferPdfPayload (fallback jsPDF) ────────────────────────────

function adaptQuoteV2(q: UnifiedQuoteData): QuoteData {
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

function adaptVariantV2(v: UnifiedVariantSection): OfferVariantSection {
  return {
    id: v.id,
    label: v.label,
    sort_order: v.sort_order,
    quote: adaptQuoteV2(v.quote),
  };
}

/**
 * Mapuje planTier na wersję PDF (v1 format).
 */
function resolvePdfVersion(planTier: string): 'standard' | 'premium' {
  return planTier === 'pro' || planTier === 'enterprise' ? 'premium' : 'standard';
}

/**
 * Rozwiązuje wariant szablonu wizualnego dla danego payloadu.
 * Używane w ścieżce fallback jsPDF — mapuje VisualBaseStyle na PdfTemplateId.
 */
function resolveJsPdfTemplateId(
  payload: UnifiedDocumentPayload,
): import('@/lib/offerDataBuilder').PdfTemplateId {
  const variant = resolveTemplateVariant({
    documentType: payload.documentType,
    trade: payload.trade,
    planTier: payload.planTier,
  });
  logger.info(
    `[renderPdfV2] Wariant wizualny: ${variant.variantKey}`,
  );
  return visualStyleToJsPdfTemplate(variant.baseStyle);
}

/**
 * Adaptuje UnifiedDocumentPayload (offer) do OfferPdfPayload (jsPDF format).
 * Używane wyłącznie w fallbacku gdy Edge Function jest niedostępna.
 */
function adaptToOfferPdfPayload(payload: UnifiedDocumentPayload): OfferPdfPayload {
  const section = payload.section as OfferDocumentSection;

  return {
    projectId: payload.sourceProjectId ?? payload.documentId,
    projectName: section.pdfConfig.title,
    company: {
      name: payload.company.name,
      nip: payload.company.nip,
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
        }
      : null,
    quote: section.quote ? adaptQuoteV2(section.quote) : null,
    pdfConfig: {
      version: resolvePdfVersion(payload.planTier),
      templateId: resolveJsPdfTemplateId(payload),
      title: section.pdfConfig.title,
      offerText: section.pdfConfig.offerText,
      terms: section.pdfConfig.terms,
      deadlineText: section.pdfConfig.deadlineText,
    },
    // ISO strings → Date (wymagane przez jsPDF generator)
    generatedAt: new Date(payload.generatedAt),
    documentId: payload.documentId,
    issuedAt: new Date(payload.issuedAt),
    validUntil: new Date(payload.validUntil ?? payload.issuedAt),
    variantSections: section.variantSections?.map(adaptVariantV2),
    acceptanceUrl: section.acceptanceUrl,
    // Pass-through pól v2 Foundation (opcjonalne w OfferPdfPayload v1)
    trade: payload.trade,
    planTier: payload.planTier,
    locale: payload.locale,
  };
}

// ── Wywołanie Edge Function ───────────────────────────────────────────────────

interface PendingMigrationResponse {
  pendingMigration: true;
  documentType: string;
  error: string;
}

/**
 * Wywołuje Edge Function generate-pdf-v2.
 *
 * @throws {PendingMigrationError} gdy Edge Function zwraca 501 (pendingMigration)
 * @throws {Error} dla innych błędów (sieć, 4xx, 5xx)
 */
async function callGeneratePdfV2(payload: UnifiedDocumentPayload): Promise<Blob> {
  const { data, error } = await supabase.functions.invoke('generate-pdf-v2', {
    body: payload,
  });

  if (error) {
    // Sprawdź czy to błąd pendingMigration (501)
    // supabase.functions.invoke może zwrócić parsed JSON w data gdy status != 200
    if (data && typeof data === 'object' && (data as PendingMigrationResponse).pendingMigration) {
      throw new PendingMigrationError(payload.documentType);
    }
    throw new Error(`generate-pdf-v2 Edge Function błąd: ${error.message}`);
  }

  if (data instanceof Blob) return data;
  if (data instanceof ArrayBuffer) return new Blob([data], { type: 'application/pdf' });
  if (data && typeof (data as Response).arrayBuffer === 'function') {
    const buffer = await (data as Response).arrayBuffer();
    return new Blob([buffer], { type: 'application/pdf' });
  }

  throw new Error('Nieoczekiwany typ odpowiedzi z generate-pdf-v2');
}

// ── Fallback jsPDF dla oferty ─────────────────────────────────────────────────

async function offerClientFallback(payload: UnifiedDocumentPayload, t?: OfferPdfTranslateFn): Promise<Blob> {
  logger.warn('[renderPdfV2] Fallback na jsPDF dla oferty');
  const legacyPayload = adaptToOfferPdfPayload(payload);
  return generateOfferPdf(legacyPayload, t);
}

// ── Fallback jsPDF dla gwarancji ─────────────────────────────────────────────

/**
 * Adapter UnifiedDocumentPayload (warranty) → WarrantyPdfContext (jsPDF format).
 * Używane wyłącznie w fallbacku gdy Edge Function jest niedostępna.
 *
 * UWAGA: Funkcja tłumaczenia `t` jest zastąpiona domyślnym mapowaniem
 * kluczy polskojęzycznych — fallback nie wymaga kontekstu i18next.
 */
function warrantyClientFallback(
  payload: UnifiedDocumentPayload,
  warrantyFallbackT?: (key: string) => string,
): Blob {
  if (payload.section.type !== 'warranty') {
    throw new Error(`warrantyClientFallback: oczekiwano section.type='warranty'`);
  }

  const section = payload.section;

  // Domyślne tłumaczenia polskie dla fallbacku (brak pełnego i18n w koordynatorze)
  const defaultT = (key: string): string => {
    const map: Record<string, string> = {
      'warranty.pdf.title': 'KARTA GWARANCYJNA',
      'warranty.pdf.docNo': 'Nr dokumentu',
      'warranty.pdf.issueDate': 'Data wystawienia',
      'warranty.pdf.sectionParties': 'Strony',
      'warranty.pdf.warrantor': 'Gwarant:',
      'warranty.pdf.phone': 'Telefon:',
      'warranty.pdf.beneficiary': 'Beneficjent:',
      'warranty.pdf.email': 'E-mail:',
      'warranty.pdf.contactPhone': 'Tel. kontaktowy:',
      'warranty.pdf.sectionObject': 'Obiekt gwarancji',
      'warranty.pdf.projectName': 'Projekt:',
      'warranty.pdf.sectionPeriod': 'Okres gwarancji',
      'warranty.pdf.startDate': 'Od:',
      'warranty.pdf.endDate': 'Do:',
      'warranty.pdf.duration': 'Czas trwania:',
      'warranty.pdf.months': 'mies.',
      'warranty.pdf.sectionScope': 'Zakres prac',
      'warranty.pdf.sectionExclusions': 'Wyłączenia',
      'warranty.pdf.sectionLegal': 'Podstawa prawna',
      'warranty.pdf.legalText':
        'Niniejsza gwarancja jest udzielana na podstawie art. 577–581 Kodeksu cywilnego.',
      'warranty.pdf.sigWarrantor': 'Podpis gwaranta',
      'warranty.pdf.sigBeneficiary': 'Podpis beneficjenta',
      'warranty.pdf.footerGenerated': 'Wygenerowano',
    };
    return map[key] ?? key;
  };

  const t = warrantyFallbackT ?? defaultT;

  const ctx: WarrantyPdfContext = {
    warranty: {
      id: payload.documentId,
      user_id: '',
      project_id: payload.sourceProjectId ?? payload.documentId,
      client_name: payload.client?.name ?? null,
      client_email: payload.client?.email ?? null,
      contact_phone: section.contactPhone ?? null,
      warranty_months: section.warrantyMonths,
      start_date: section.startDate,
      end_date: section.endDate,
      scope_of_work: section.scopeOfWork ?? null,
      exclusions: section.exclusions ?? null,
      pdf_storage_path: null,
      reminder_30_sent_at: null,
      reminder_7_sent_at: null,
      created_at: payload.generatedAt,
      updated_at: payload.generatedAt,
    },
    projectTitle: payload.sourceProjectId ?? payload.documentId,
    companyName: payload.company.name,
    companyAddress: [payload.company.street, payload.company.postalCode, payload.company.city]
      .filter(Boolean)
      .join(', ') || undefined,
    companyPhone: payload.company.phone,
    t,
    locale: payload.locale,
    trade: payload.trade,
    planTier: payload.planTier,
  };

  logger.warn('[renderPdfV2] Fallback na jsPDF dla gwarancji');
  return generateWarrantyPdfBlob(ctx);
}

// ── Kanoniczny koordynator ────────────────────────────────────────────────────

/**
 * Renderuje dokument PDF przez kanoniczny pipeline v2.
 *
 * Strategia:
 *   1. Zawsze próbuje Edge Function generate-pdf-v2 (serwer-first)
 *   2. Dla 'offer' i 'warranty': fallback na jsPDF gdy Edge Function zawiedzie
 *   3. Wszystkie 5 typów dokumentów obsługiwane server-side
 *
 * @param payload - UnifiedDocumentPayload (schemaVersion: 2)
 * @returns Blob z zawartością PDF
 */
export async function renderDocumentPdfV2(
  payload: UnifiedDocumentPayload,
  t?: OfferPdfTranslateFn,
): Promise<Blob> {
  // ── Próba serwer-first (canonical path) ──────────────────────────────────
  try {
    const blob = await callGeneratePdfV2(payload);
    logger.info(`[renderPdfV2] PDF wygenerowany przez Edge Function v2 (${payload.documentType})`);
    return blob;
  } catch (serverErr) {
    // Jeśli to PendingMigrationError — fallback dla typów z klient-side generatorem
    if (serverErr instanceof PendingMigrationError) {
      if (payload.documentType === 'offer') {
        logger.warn('[renderPdfV2] Nieoczekiwany pendingMigration dla offer — fallback jsPDF');
        return offerClientFallback(payload, t);
      }
      if (payload.documentType === 'warranty') {
        logger.warn('[renderPdfV2] Nieoczekiwany pendingMigration dla warranty — fallback jsPDF');
        return warrantyClientFallback(payload);
      }
      // Pozostałe typy: propaguj błąd — nie ma fallbacku klient-side
      throw serverErr;
    }

    // Błąd sieciowy / 5xx → fallback dla typów z klient-side generatorem
    if (payload.documentType === 'offer') {
      logger.warn('[renderPdfV2] Edge Function niedostępna — fallback jsPDF dla oferty:', serverErr);
      return offerClientFallback(payload, t);
    }
    if (payload.documentType === 'warranty') {
      logger.warn('[renderPdfV2] Edge Function niedostępna — fallback jsPDF dla gwarancji:', serverErr);
      return warrantyClientFallback(payload);
    }

    // Dla protocol/contract/inspection: nie ma klient-side jsPDF fallback
    // → rzuć PendingMigrationError z oryginalnym błędem jako przyczyną
    throw new PendingMigrationError(payload.documentType, serverErr);
  }
}
