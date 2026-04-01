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
 *   2. Fallback klient-side (tylko dla 'offer'):
 *      → jsPDF (offerPdfGenerator) — zawsze dostępny, niezależny od sieci
 *   3. Dla typów oczekujących migracji (warranty, protocol, contract, inspection):
 *      → rzuca PendingMigrationError — wywołujący musi obsłużyć
 *      → Istniejące UI komponentów używają bezpośrednio generatorów jsPDF
 *        (warrantyPdfGenerator, templatePdfGenerator) — nie ma regresi
 *
 * ── Klasyfikacja ścieżek renderowania ─────────────────────────────────────
 *   CANONICAL  : generate-pdf-v2 (Edge Function, @react-pdf/renderer)
 *   FALLBACK   : offerPdfGenerator.ts (jsPDF, tylko dla 'offer')
 *   LEGACY     : generateServerPdf.ts (OfferPDFPayload v1 → generate-offer-pdf)
 *   STANDALONE : templatePdfGenerator.ts, warrantyPdfGenerator.ts
 *                (jsPDF, poza v2 — oczekują migracji)
 *
 * ── Przyszłe rozszerzenia (bez resetu architektury) ───────────────────────
 *   - documentType-based routing: już w miejscu (switch po documentType)
 *   - trade-aware styling: planTier/trade w UnifiedDocumentPayload → v2 renderer
 *   - plan-tier differentiation: pdfConfig.version='premium' dla pro/enterprise
 *   - warranty/protocol fallback: implementacja adaptorów w następnym PR
 *
 * Roadmap: PDF Platform v2 — Canonical Renderer.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { generateOfferPdf } from '@/lib/offerPdfGenerator';
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
 * Rzucany gdy documentType oczekuje na migrację do v2 renderera.
 * Wywołujący powinien albo obsłużyć ten błąd, albo użyć bezpośrednio
 * odpowiedniego generatora jsPDF (warrantyPdfGenerator, templatePdfGenerator).
 *
 * Znaczenie: typ dokumentu jest znany systemowi v2, ale nie ma jeszcze
 * pełnej ścieżki renderowania end-to-end — ani server, ani client-side fallback.
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

async function offerClientFallback(payload: UnifiedDocumentPayload): Promise<Blob> {
  logger.warn('[renderPdfV2] Fallback na jsPDF dla oferty');
  const legacyPayload = adaptToOfferPdfPayload(payload);
  return generateOfferPdf(legacyPayload);
}

// ── Kanoniczny koordynator ────────────────────────────────────────────────────

/**
 * Renderuje dokument PDF przez kanoniczny pipeline v2.
 *
 * Strategia:
 *   1. Zawsze próbuje Edge Function generate-pdf-v2 (serwer-first)
 *   2. Dla 'offer': fallback na jsPDF gdy Edge Function zawiedzie
 *   3. Dla typów oczekujących migracji: rzuca PendingMigrationError
 *
 * @param payload - UnifiedDocumentPayload (schemaVersion: 2)
 * @returns Blob z zawartością PDF
 * @throws {PendingMigrationError} dla warranty/protocol/contract/inspection
 *         (do czasu implementacji ich ścieżek w następnych PR)
 */
export async function renderDocumentPdfV2(
  payload: UnifiedDocumentPayload,
): Promise<Blob> {
  // ── Próba serwer-first (canonical path) ──────────────────────────────────
  try {
    const blob = await callGeneratePdfV2(payload);
    logger.info(`[renderPdfV2] PDF wygenerowany przez Edge Function v2 (${payload.documentType})`);
    return blob;
  } catch (serverErr) {
    // Jeśli to PendingMigrationError — nie próbuj fallbacku dla nieofertowych typów
    if (serverErr instanceof PendingMigrationError) {
      if (payload.documentType === 'offer') {
        // Offer nie powinien zwracać pendingMigration z serwera; fallback na wszelki wypadek
        logger.warn('[renderPdfV2] Nieoczekiwany pendingMigration dla offer — fallback jsPDF');
        return offerClientFallback(payload);
      }
      // Pozostałe typy: propaguj błąd — nie ma fallbacku klient-side
      throw serverErr;
    }

    // Błąd sieciowy / 5xx → fallback tylko dla 'offer'
    if (payload.documentType === 'offer') {
      logger.warn('[renderPdfV2] Edge Function niedostępna — fallback jsPDF dla oferty:', serverErr);
      return offerClientFallback(payload);
    }

    // Dla innych typów: nie ma klient-side fallback → rzuć PendingMigrationError
    // z oryginalnym błędem jako przyczyną
    throw new PendingMigrationError(payload.documentType, serverErr);
  }
}
