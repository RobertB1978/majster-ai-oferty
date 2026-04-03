/**
 * Offer PDF Generator — Prestige Pass (Gate 1 / Warunek 3)
 *
 * Client-side PDF generation using jsPDF + jspdf-autotable.
 * Design tokens from src/lib/pdf/modernPdfStyles.ts (sections 3.1–3.4).
 *
 * Scope per sekcja 26.1: typography, spacing, hierarchy, layout, colors,
 * header (logo, company data, document ID), footer (validity, date, page X/Y),
 * QR code, amber Total accent, JetBrains Mono for amounts.
 *
 * ── Klasyfikacja PDF Platform v2 ─────────────────────────────────────────────
 * STATUS: FALLBACK
 *
 * Ten plik jest FALLBACKIEM dla ścieżki kanonicznej v2.
 * Wywoływany gdy Edge Function generate-pdf-v2 jest niedostępna (sieć, timeout).
 * Nowe przepływy powinny używać renderPdfV2.ts, który wywołuje ten moduł
 * automatycznie jako fallback dla documentType='offer'.
 *
 * ŚCIEŻKA KANONICZNA: src/lib/pdf/renderPdfV2.ts → generate-pdf-v2 (Edge Fn)
 * FALLBACK:           ten plik (jsPDF, client-side)
 * LEGACY (v1 flow):   src/lib/generateServerPdf.ts → generate-offer-pdf (Edge Fn)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

/** jsPDF extended with jspdf-autotable dynamic property */
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}
import type { PdfTemplateId } from './offerDataBuilder';
import { OfferPdfPayload } from './offerDataBuilder';
import { formatCurrency, formatDate } from './formatters';
import { logger } from './logger';

/**
 * Translation function type for locale-aware PDF label rendering.
 * When provided, static document labels follow the active locale.
 * When omitted, Polish labels are used as backward-compatible fallback.
 */
export type OfferPdfTranslateFn = (key: string, opts?: Record<string, unknown>) => string;
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from './analytics/track';
import { ANALYTICS_EVENTS } from './analytics/events';
import { JETBRAINS_MONO_REGULAR_B64 } from './jetbrains-mono-b64';
import { registerNotoSans } from './pdf/registerNotoSansJsPDF';
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  ACCENT_AMBER,
  ACCENT_AMBER_SUBTLE,
  AMBER_50,
  AMBER_100,
  AMBER_700,
  BORDER_DEFAULT,
  FONT_SIZES,
  PDF_MARGIN,
  WHITE,
  TEXT_HEADER_SUBTITLE,
  TABLE_GRID_LINE,
  drawLogoPlaceholder,
  hexToRgb,
} from './pdf/modernPdfStyles';
import {
  resolveTemplateVariant,
  getStyleTokens,
} from './pdf/documentVisualSystem';
import type { TradeType, PlanTier } from '@/types/unified-document-payload';

// ---------------------------------------------------------------------------
// JetBrains Mono font registration
// ---------------------------------------------------------------------------

const JBM_FONT_NAME = 'JetBrainsMono';
const JBM_FILE = 'JetBrainsMono-Regular.ttf';

/** Registers JetBrains Mono in jsPDF VFS (idempotent). Returns font name on success, 'courier' fallback on failure. */
function registerJetBrainsMono(doc: jsPDF): string {
  try {
    doc.addFileToVFS(JBM_FILE, JETBRAINS_MONO_REGULAR_B64);
    doc.addFont(JBM_FILE, JBM_FONT_NAME, 'normal');
    doc.addFont(JBM_FILE, JBM_FONT_NAME, 'bold');
    return JBM_FONT_NAME;
  } catch {
    return 'courier';
  }
}

// ---------------------------------------------------------------------------
// Template theme system
// ---------------------------------------------------------------------------

interface TemplateTheme {
  /** Table header background RGB */
  headerFill: [number, number, number];
  /** Table header text RGB */
  headerText: [number, number, number];
  /** Section title text RGB */
  accentColor: [number, number, number];
  /** jspdf-autotable theme */
  tableTheme: 'grid' | 'striped' | 'plain';
  /** Optional colored band behind the company name in the header */
  companyBg?: [number, number, number];
  /** Optional lighter top stripe for depth in header band */
  companyBgLight?: [number, number, number];
  /** Optional alternating row fill color */
  alternateRowFill?: [number, number, number];
  /** Background fill for summary / totals box */
  summaryBg: [number, number, number];
  /** Accent color for gross total line */
  grossAccent: [number, number, number];
}

const TEMPLATE_THEMES: Record<PdfTemplateId, TemplateTheme> = {
  classic: {
    headerFill: TEXT_PRIMARY,
    headerText: [255, 255, 255],
    accentColor: TEXT_PRIMARY,
    tableTheme: 'grid',
    alternateRowFill: [248, 250, 252],
    summaryBg: AMBER_50,
    grossAccent: AMBER_700,
  },
  modern: {
    headerFill: TEXT_PRIMARY,
    headerText: [255, 255, 255],
    accentColor: TEXT_PRIMARY,
    tableTheme: 'striped',
    companyBg: TEXT_PRIMARY,
    companyBgLight: [31, 41, 55], // gray-800
    alternateRowFill: [240, 245, 255],
    summaryBg: AMBER_50,
    grossAccent: AMBER_700,
  },
  minimal: {
    headerFill: [60, 60, 60],
    headerText: [255, 255, 255],
    accentColor: [60, 60, 60],
    tableTheme: 'plain',
    alternateRowFill: [248, 248, 248],
    summaryBg: AMBER_50,
    grossAccent: AMBER_700,
  },
};

/**
 * Returns the compliance-required text lines that will appear in the PDF.
 * Exported for direct unit testing — generateOfferPdf uses these same strings.
 *
 * When `t` is provided, labels are resolved via i18n (offerPdf.* keys).
 * When omitted, Polish labels are used as backward-compatible fallback.
 */
export function getPdfComplianceLines(payload: OfferPdfPayload, t?: OfferPdfTranslateFn) {
  const locale = payload.locale ?? 'pl-PL';
  const dateStr = formatDate(payload.issuedAt, locale);
  const validStr = formatDate(payload.validUntil, locale);
  return {
    documentIdLine: `Nr: ${payload.documentId}`,
    issuedAtLine: t
      ? t('offerPdf.issuedAt', { date: dateStr })
      : `Data wystawienia: ${dateStr}`,
    validUntilLine: t
      ? t('offerPdf.validUntil', { date: validStr })
      : `Ważna do: ${validStr}`,
    vatExemptLine: t
      ? t('offerPdf.vatExemptNote')
      : 'Sprzedawca zwolniony z podatku VAT (art. 43 ust. 1 ustawy o VAT)',
    vatRateLine:
      payload.quote?.vatRate !== null && payload.quote?.vatRate !== undefined
        ? `VAT (${payload.quote.vatRate}%):`
        : null,
  };
}

/**
 * Generate PDF document from offer payload.
 * Returns a Blob that can be downloaded or uploaded to storage.
 *
 * @param payload  Offer data (company, client, quote, config, locale).
 * @param t        Optional i18n translation function. When provided, static
 *                 PDF labels (headings, table headers, footer) follow the
 *                 active locale via `offerPdf.*` keys. When omitted, Polish
 *                 labels are used as backward-compatible fallback.
 */
export async function generateOfferPdf(
  payload: OfferPdfPayload,
  t?: OfferPdfTranslateFn,
): Promise<Blob> {
  const locale = payload.locale ?? 'pl-PL';
  // Create new PDF document (A4 portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Register NotoSans — Unicode body font for Polish diacritics (ą ć ę ł ń ó ś ź ż)
  const bodyFont = registerNotoSans(doc);

  // Register JetBrains Mono — used for all monetary amounts
  const monoFont = registerJetBrainsMono(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = PDF_MARGIN;
  const FOOTER_ZONE = 18; // mm reserved for footer (line + text + padding)
  let yPosition = margin;

  /** Ensure at least `needed` mm of space before footer zone; adds new page if not. */
  function ensureSpace(needed: number): void {
    if (yPosition + needed > pageHeight - FOOTER_ZONE) {
      doc.addPage();
      yPosition = margin;
    }
  }

  // Resolve template theme
  const templateId = payload.pdfConfig.templateId ?? 'classic';
  const theme = TEMPLATE_THEMES[templateId];

  // ── Trade accent resolution ─────────────────────────────────────────────
  // When trade/planTier are present (v2 adapter path), resolve trade-specific
  // accent colors from the visual system. Otherwise fall back to brand amber.
  let accentRgb: [number, number, number] = ACCENT_AMBER;
  let accentSubtleRgb: [number, number, number] = ACCENT_AMBER_SUBTLE;
  if (payload.trade) {
    const safeTrade = (payload.trade as TradeType) ?? 'general';
    const safePlan = (payload.planTier as PlanTier) ?? 'basic';
    const variant = resolveTemplateVariant({
      documentType: 'offer',
      trade: safeTrade,
      planTier: safePlan,
    });
    const tokens = getStyleTokens(variant);
    accentRgb = hexToRgb(tokens.sectionAccent, ACCENT_AMBER);
    accentSubtleRgb = hexToRgb(tokens.accentStripeBg, ACCENT_AMBER_SUBTLE);
  }

  // ── Logo embedding ──────────────────────────────────────────────────────
  // Try to fetch and embed the real company logo when logoUrl is available.
  let logoImageData: string | null = null;
  if (payload.company.logoUrl) {
    try {
      const response = await fetch(payload.company.logoUrl);
      if (response.ok) {
        const blob = await response.blob();
        if (blob.type.startsWith('image/') && blob.size < 2_000_000) {
          logoImageData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch {
      // Logo fetch failure is non-fatal — fall back to placeholder
    }
  }

  // ========================================
  // HEADER SECTION
  // ========================================

  if (theme.companyBg) {
    // Modern template: full-width colored header band with logo placeholder
    const bandHeight = 50;
    doc.setFillColor(...theme.companyBg);
    doc.rect(0, 0, pageWidth, bandHeight, 'F');

    // Lighter stripe at the very top (3mm) for depth effect
    if (theme.companyBgLight) {
      doc.setFillColor(...theme.companyBgLight);
      doc.rect(0, 0, pageWidth, 3, 'F');
    }

    // Trade-aware accent bar at the bottom of the header band
    doc.setFillColor(...accentRgb);
    doc.rect(0, bandHeight - 2, pageWidth, 2, 'F');

    // "OFERTA" label right-aligned in header
    doc.setFontSize(FONT_SIZES.sm);
    doc.setFont(bodyFont, 'bold');
    doc.setTextColor(...accentRgb);
    doc.text(t ? t('offerPdf.label') : 'OFERTA', pageWidth - margin, 12, { align: 'right' });

    // Logo in the header band — real image or placeholder
    const logoY = 14;
    const logoSize = 12;
    if (logoImageData) {
      try {
        doc.addImage(logoImageData, margin, logoY, logoSize, logoSize);
      } catch {
        // Image embed failure — fall back to placeholder
        doc.setFillColor(...WHITE);
        doc.roundedRect(margin, logoY, logoSize, logoSize, 2, 2, 'F');
        const initial = payload.company.name.trim().charAt(0).toUpperCase() || 'M';
        doc.setFontSize(logoSize * 0.55);
        doc.setFont(bodyFont, 'bold');
        doc.setTextColor(...(theme.companyBg ?? TEXT_PRIMARY));
        doc.text(initial, margin + logoSize / 2, logoY + logoSize * 0.68, { align: 'center' });
      }
    } else {
      doc.setFillColor(...WHITE);
      doc.roundedRect(margin, logoY, logoSize, logoSize, 2, 2, 'F');
      const initial = payload.company.name.trim().charAt(0).toUpperCase() || 'M';
      doc.setFontSize(logoSize * 0.55);
      doc.setFont(bodyFont, 'bold');
      doc.setTextColor(...(theme.companyBg ?? TEXT_PRIMARY));
      doc.text(initial, margin + logoSize / 2, logoY + logoSize * 0.68, { align: 'center' });
    }

    // Company name in white — next to logo
    const nameX = margin + logoSize + 4;
    doc.setFontSize(FONT_SIZES['2xl']);
    doc.setFont(bodyFont, 'bold');
    doc.setTextColor(...WHITE);
    doc.text(payload.company.name, nameX, 22);

    // Company details: NIP + address on one line, contact on next
    doc.setFontSize(FONT_SIZES.sm);
    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(...TEXT_HEADER_SUBTITLE);

    const addrParts: string[] = [];
    if (payload.company.nip) addrParts.push(`NIP: ${payload.company.nip}`);
    if (payload.company.regon) addrParts.push(`REGON: ${payload.company.regon}`);
    if (payload.company.krs) addrParts.push(`KRS: ${payload.company.krs}`);
    if (addrParts.length > 0) doc.text(addrParts.join('  ·  '), nameX, 30);

    const addrLine2Parts: string[] = [];
    if (payload.company.street) addrLine2Parts.push(payload.company.street);
    if (payload.company.postalCode || payload.company.city) {
      addrLine2Parts.push([payload.company.postalCode, payload.company.city].filter(Boolean).join(' '));
    }
    const contactParts: string[] = [];
    if (payload.company.phone) contactParts.push(`Tel: ${payload.company.phone}`);
    if (payload.company.email) contactParts.push(`Email: ${payload.company.email}`);
    const line2 = [...addrLine2Parts, ...contactParts].join('  ·  ');
    if (line2) doc.text(line2, nameX, 38);

    doc.setTextColor(...TEXT_PRIMARY);
    yPosition = bandHeight + 6;
  } else {
    // Classic / Minimal template: text-only header with logo
    // Logo on the left — real image or placeholder
    if (logoImageData) {
      try {
        doc.addImage(logoImageData, margin, yPosition - 3, 14, 14);
      } catch {
        drawLogoPlaceholder(doc, margin, yPosition - 3, payload.company.name);
      }
    } else {
      drawLogoPlaceholder(doc, margin, yPosition - 3, payload.company.name);
    }
    const nameX = margin + 18; // after logo

    doc.setFontSize(FONT_SIZES.xl);
    doc.setFont(bodyFont, 'bold');
    doc.setTextColor(...theme.accentColor);
    doc.text(payload.company.name, nameX, yPosition + 2);
    yPosition += 8;

    doc.setFontSize(FONT_SIZES.base);
    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(...TEXT_SECONDARY);

    if (payload.company.nip) {
      const regParts = [`NIP: ${payload.company.nip}`];
      if (payload.company.regon) regParts.push(`REGON: ${payload.company.regon}`);
      if (payload.company.krs) regParts.push(`KRS: ${payload.company.krs}`);
      doc.text(regParts.join('  ·  '), nameX, yPosition);
      yPosition += 5;
    }

    if (payload.company.street || payload.company.postalCode || payload.company.city) {
      const address = [
        payload.company.street,
        payload.company.postalCode,
        payload.company.city,
      ]
        .filter(Boolean)
        .join(', ');
      doc.text(address, nameX, yPosition);
      yPosition += 5;
    }

    if (payload.company.phone) {
      doc.text(`Tel: ${payload.company.phone}`, nameX, yPosition);
      yPosition += 5;
    }

    if (payload.company.email) {
      doc.text(`Email: ${payload.company.email}`, nameX, yPosition);
      yPosition += 5;
    }

    yPosition += 5;

    // Separator line with trade-aware accent
    doc.setDrawColor(...BORDER_DEFAULT);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    // Accent segment (first 40mm)
    doc.setDrawColor(...accentRgb);
    doc.setLineWidth(0.8);
    doc.line(margin, yPosition, margin + 40, yPosition);
    doc.setLineWidth(0.2);
    yPosition += 10;
  }

  // ========================================
  // TITLE SECTION
  // ========================================

  // QR code for digital version (top-right corner, 28×28mm)
  const QR_SIZE = 28;
  const qrX = pageWidth - margin - QR_SIZE;
  let qrPlaced = false;
  if (payload.acceptanceUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(payload.acceptanceUrl, {
        width: 168,   // 28mm at 150dpi — clear and scannable
        margin: 2,
        errorCorrectionLevel: 'Q',
        color: { dark: '#111827', light: '#FFFFFF' },
      });
      // Trade-accented frame around QR code
      doc.setFillColor(...accentSubtleRgb);
      doc.roundedRect(qrX - 2, yPosition - 4, QR_SIZE + 4, QR_SIZE + 12, 2, 2, 'F');
      doc.setDrawColor(...accentRgb);
      doc.setLineWidth(0.4);
      doc.roundedRect(qrX - 2, yPosition - 4, QR_SIZE + 4, QR_SIZE + 12, 2, 2, 'S');
      doc.setLineWidth(0.2);
      doc.addImage(qrDataUrl, 'PNG', qrX, yPosition - 2, QR_SIZE, QR_SIZE);
      // Label below QR
      doc.setFontSize(FONT_SIZES.xs);
      doc.setFont(bodyFont, 'bold');
      doc.setTextColor(...AMBER_700);
      doc.text(t ? t('offerPdf.onlineLabel') : 'OFERTA ONLINE', qrX + QR_SIZE / 2, yPosition + QR_SIZE + 3, { align: 'center' });
      doc.setTextColor(...TEXT_PRIMARY);
      qrPlaced = true;
    } catch {
      // QR generation failure is non-fatal — PDF continues without QR
    }
  }

  doc.setFontSize(FONT_SIZES.lg);
  doc.setFont(bodyFont, 'bold');
  doc.setTextColor(...TEXT_PRIMARY);
  // Leave room for QR code when present
  const titleMaxWidth = qrPlaced ? qrX - margin - 5 : pageWidth - 2 * margin;
  doc.text(payload.pdfConfig.title, margin, yPosition, { maxWidth: titleMaxWidth });
  yPosition += 8;

  doc.setFontSize(FONT_SIZES.base);
  doc.setFont(bodyFont, 'normal');

  // Compliance: document ID + dates (uses getPdfComplianceLines for testable strings)
  const complianceLines = getPdfComplianceLines(payload, t);
  const complianceRightX = qrPlaced ? qrX - 3 : pageWidth - margin;
  // Document ID in monospace
  doc.setFont(monoFont, 'bold');
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(complianceLines.documentIdLine, complianceRightX, yPosition, { align: 'right' });
  doc.setFont(bodyFont, 'normal');
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(complianceLines.issuedAtLine, margin, yPosition);
  yPosition += 5;

  doc.text(complianceLines.validUntilLine, margin, yPosition);
  doc.setTextColor(...TEXT_PRIMARY);
  // Advance past QR code if it was placed
  if (qrPlaced) {
    yPosition = Math.max(yPosition + 5, yPosition + QR_SIZE - 3);
  } else {
    yPosition += 10;
  }

  // ========================================
  // CLIENT SECTION
  // ========================================

  if (payload.client) {
    ensureSpace(30); // client block needs ~30mm
    doc.setFontSize(FONT_SIZES.md);
    doc.setFont(bodyFont, 'bold');
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text(t ? t('offerPdf.clientSection') : 'Dane klienta:', margin, yPosition);
    yPosition += 6;

    doc.setFontSize(FONT_SIZES.base);
    doc.setFont(bodyFont, 'bold');
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text(payload.client.name, margin, yPosition);
    yPosition += 5;

    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(...TEXT_SECONDARY);

    if (payload.client.address) {
      doc.text(payload.client.address, margin, yPosition);
      yPosition += 5;
    }

    if (payload.client.phone) {
      doc.text(`Tel: ${payload.client.phone}`, margin, yPosition);
      yPosition += 5;
    }

    if (payload.client.email) {
      doc.text(`Email: ${payload.client.email}`, margin, yPosition);
      yPosition += 5;
    }

    doc.setTextColor(...TEXT_PRIMARY);
    yPosition += 5;
  }

  // ========================================
  // OFFER TEXT SECTION
  // ========================================

  if (payload.pdfConfig.offerText) {
    ensureSpace(15); // at least one line + padding
    doc.setFontSize(FONT_SIZES.base);
    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(...TEXT_PRIMARY);
    const offerTextLines = doc.splitTextToSize(
      payload.pdfConfig.offerText,
      pageWidth - 2 * margin
    );
    doc.text(offerTextLines, margin, yPosition);
    doc.setTextColor(...TEXT_PRIMARY);
    yPosition += offerTextLines.length * 5 + 5;
  }

  // ========================================
  // QUOTE POSITIONS TABLE
  // Variant mode: render each variant as a labeled section.
  // No-variant mode: render as before (single section).
  // ========================================

  const hasVariants =
    Array.isArray(payload.variantSections) && payload.variantSections.length > 1;

  /** Renders items table + summary for a single quote slice */
  function renderQuoteSection(quote: typeof payload.quote, sectionLabel?: string) {
    if (!quote || quote.positions.length === 0) {
      doc.setFontSize(10);
      doc.setFont(bodyFont, 'italic');
      doc.text(t ? t('offerPdf.noPositions') : 'Brak pozycji.', margin, yPosition);
      yPosition += 8;
      return;
    }

    // Section header (variant label or default "Pozycje wyceny")
    ensureSpace(20); // heading + at least first table row
    doc.setFontSize(FONT_SIZES.lg);
    doc.setFont(bodyFont, 'bold');
    doc.setTextColor(...theme.accentColor);
    doc.text(sectionLabel ?? (t ? t('offerPdf.positionsHeading') : 'Pozycje wyceny:'), margin, yPosition);
    // Trade-aware underline accent
    doc.setDrawColor(...accentRgb);
    doc.setLineWidth(0.8);
    doc.line(margin, yPosition + 1.5, margin + 50, yPosition + 1.5);
    doc.setLineWidth(0.2);
    doc.setTextColor(...TEXT_PRIMARY);
    yPosition += 9;

    // Resolve VAT label for table header
    const vatLabel = quote.isVatExempt ? 'zw.' : `${quote.vatRate ?? 0}%`;

    const tableData = quote.positions.map((pos) => {
      const netValue = pos.qty * pos.price;
      const vatMult = quote.isVatExempt ? 0 : (quote.vatRate ?? 0) / 100;
      const grossValue = netValue * (1 + vatMult);
      return [
        pos.name,
        pos.qty.toString(),
        pos.unit,
        formatCurrency(pos.price, locale),
        vatLabel,
        formatCurrency(grossValue, locale),
      ];
    });

    const colHeaders = t
      ? [t('offerPdf.colName'), t('offerPdf.colQty'), t('offerPdf.colUnit'), t('offerPdf.colNetPrice'), t('offerPdf.colVat'), t('offerPdf.colGrossValue')]
      : ['Nazwa', 'Ilość', 'J.m.', 'Cena netto', 'VAT', 'Wartość brutto'];

    autoTable(doc, {
      startY: yPosition,
      head: [colHeaders],
      body: tableData,
      theme: theme.tableTheme,
      headStyles: {
        fillColor: theme.headerFill,
        textColor: theme.headerText,
        fontStyle: 'bold',
        fontSize: FONT_SIZES.sm,
      },
      bodyStyles: { fontSize: FONT_SIZES.sm },
      alternateRowStyles: theme.alternateRowFill
        ? { fillColor: theme.alternateRowFill }
        : undefined,
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      // Apply JetBrains Mono for monetary amount columns — col 3 (cena netto) & 5 (wartość brutto)
      willDrawCell: (data) => {
        if (
          data.section === 'body' &&
          (data.column.index === 3 || data.column.index === 5)
        ) {
          data.doc.setFont(monoFont, 'normal');
        }
      },
      didDrawCell: (data) => {
        if (
          data.section === 'body' &&
          (data.column.index === 3 || data.column.index === 5)
        ) {
          data.doc.setFont(bodyFont, 'normal');
        }
      },
    });

    yPosition = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 6;

    // Ensure summary box fits on current page (avoid splitting across pages)
    const summaryEstimate = quote.isVatExempt ? 28 : 38;
    ensureSpace(summaryEstimate);

    // Summary
    const summaryX = pageWidth - margin - 72;
    const summaryBoxWidth = pageWidth - margin - summaryX + 4;

    // Estimate summary box height: vat-exempt → ~22mm, with VAT → ~32mm
    const summaryBoxHeight = quote.isVatExempt ? 22 : (quote.vatRate !== null ? 32 : 26);

    // Draw amber-50 background for summary section
    doc.setFillColor(theme.summaryBg[0], theme.summaryBg[1], theme.summaryBg[2]);
    doc.roundedRect(summaryX - 4, yPosition - 2, summaryBoxWidth, summaryBoxHeight, 2, 2, 'F');
    // Left border accent
    doc.setFillColor(theme.grossAccent[0], theme.grossAccent[1], theme.grossAccent[2]);
    doc.rect(summaryX - 4, yPosition - 2, 2.5, summaryBoxHeight, 'F');

    doc.setFontSize(FONT_SIZES.md);
    doc.setFont(bodyFont, 'bold');
    doc.setTextColor(...theme.accentColor);
    doc.text(t ? t('offerPdf.summary') : 'Podsumowanie:', margin, yPosition + 4);
    doc.setTextColor(...TEXT_PRIMARY);
    yPosition += 6;

    doc.setFontSize(FONT_SIZES.base);
    doc.setFont(bodyFont, 'normal');

    if (quote.isVatExempt) {
      // Amber highlight band behind the total row
      doc.setFillColor(...AMBER_100);
      doc.rect(summaryX - 4, yPosition - 1, summaryBoxWidth, 10, 'F');

      doc.setFontSize(FONT_SIZES.lg);
      doc.setFont(bodyFont, 'bold');
      doc.setTextColor(theme.grossAccent[0], theme.grossAccent[1], theme.grossAccent[2]);
      doc.text(t ? t('offerPdf.finalValue') : 'Wartość końcowa:', summaryX + 1, yPosition + 5);
      doc.setFont(monoFont, 'bold');
      doc.text(formatCurrency(quote.total, locale), pageWidth - margin, yPosition + 5, { align: 'right' });
      doc.setFont(bodyFont, 'normal');
      doc.setTextColor(...TEXT_PRIMARY);
      yPosition += 12;
      doc.setFontSize(FONT_SIZES.sm);
      doc.setFont(bodyFont, 'italic');
      doc.setTextColor(...TEXT_MUTED);
      doc.text(t ? t('offerPdf.vatExemptNote') : 'Sprzedawca zwolniony z podatku VAT (art. 43 ust. 1 ustawy o VAT)', summaryX + 1, yPosition);
      doc.setTextColor(...TEXT_PRIMARY);
      yPosition += 10;
    } else {
      doc.setTextColor(...TEXT_SECONDARY);
      doc.text(t ? t('offerPdf.netValue') : 'Wartość netto:', summaryX + 1, yPosition);
      doc.setFont(monoFont, 'normal');
      doc.text(formatCurrency(quote.netTotal, locale), pageWidth - margin, yPosition, { align: 'right' });
      doc.setFont(bodyFont, 'normal');
      doc.setTextColor(...TEXT_PRIMARY);
      yPosition += 6;
      if (quote.vatRate !== null) {
        doc.setTextColor(...TEXT_SECONDARY);
        doc.text(`VAT (${quote.vatRate}%):`, summaryX + 1, yPosition);
        doc.setFont(monoFont, 'normal');
        doc.text(formatCurrency(quote.vatAmount, locale), pageWidth - margin, yPosition, { align: 'right' });
        doc.setFont(bodyFont, 'normal');
        doc.setTextColor(...TEXT_PRIMARY);
        yPosition += 6;
      }
      // Amber highlight band behind the gross total row
      doc.setFillColor(...AMBER_100);
      doc.rect(summaryX - 4, yPosition - 1, summaryBoxWidth, 11, 'F');
      // Separator line above gross total
      doc.setDrawColor(...ACCENT_AMBER);
      doc.setLineWidth(0.8);
      doc.line(summaryX - 2, yPosition - 1, pageWidth - margin + 2, yPosition - 1);
      doc.setLineWidth(0.2);
      doc.setDrawColor(...TABLE_GRID_LINE);

      doc.setFontSize(FONT_SIZES.lg);
      doc.setFont(bodyFont, 'bold');
      doc.setTextColor(theme.grossAccent[0], theme.grossAccent[1], theme.grossAccent[2]);
      doc.text(t ? t('offerPdf.grossPayable') : 'Do zapłaty (brutto):', summaryX + 1, yPosition + 5);
      doc.setFont(monoFont, 'bold');
      doc.text(formatCurrency(quote.grossTotal, locale), pageWidth - margin, yPosition + 5, { align: 'right' });
      doc.setFont(bodyFont, 'normal');
      doc.setTextColor(...TEXT_PRIMARY);
      yPosition += 15;
    }
  }

  if (hasVariants && payload.variantSections) {
    // Multi-variant: render each variant as a labeled section
    payload.variantSections.forEach((section, idx) => {
      if (idx > 0) {
        // Thin separator between variants
        doc.setDrawColor(...TABLE_GRID_LINE);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
        doc.setLineDashPattern([], 0);
        yPosition += 4;
      }
      renderQuoteSection(section.quote, `${section.label}:`);
    });
  } else if (payload.quote && payload.quote.positions.length > 0) {
    renderQuoteSection(payload.quote);
  } else {
    // No quote available
    doc.setFontSize(10);
    doc.setFont(bodyFont, 'italic');
    doc.text(t ? t('offerPdf.noQuote') : 'Wycena nie została jeszcze przygotowana.', margin, yPosition);
    yPosition += 10;
  }

  // ========================================
  // TERMS & CONDITIONS SECTION
  // ========================================

  if (payload.pdfConfig.terms) {
    ensureSpace(20); // section heading + at least one line
    doc.setFontSize(FONT_SIZES.md);
    doc.setFont(bodyFont, 'bold');
    doc.setTextColor(...theme.accentColor);
    doc.text(t ? t('offerPdf.termsSection') : 'Warunki:', margin, yPosition);
    doc.setTextColor(...TEXT_PRIMARY);
    yPosition += 6;

    doc.setFontSize(FONT_SIZES.sm);
    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(...TEXT_SECONDARY);
    const termsLines = doc.splitTextToSize(payload.pdfConfig.terms, pageWidth - 2 * margin);
    doc.text(termsLines, margin, yPosition);
    doc.setTextColor(...TEXT_PRIMARY);
    yPosition += termsLines.length * 4 + 5;
  }

  // ========================================
  // DEADLINE SECTION
  // ========================================

  if (payload.pdfConfig.deadlineText) {
    ensureSpace(12);
    doc.setFontSize(FONT_SIZES.base);
    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text(payload.pdfConfig.deadlineText, margin, yPosition);
    doc.setTextColor(...TEXT_PRIMARY);
    yPosition += 10;
  }

  // ========================================
  // SIGNATURE SECTION
  // ========================================

  // Ensure enough space for signature block (~55mm)
  ensureSpace(55);

  yPosition += 12;

  // Separator before signatures
  doc.setDrawColor(...TABLE_GRID_LINE);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 18;

  const sigColWidth = (pageWidth - 2 * margin - 10) / 2;
  const rightSigX = margin + sigColWidth + 10;
  const sigLineY = yPosition + 18;

  // Contractor — representative name + role + company
  doc.setFontSize(FONT_SIZES.sm);
  doc.setFont(bodyFont, 'bold');
  doc.setTextColor(...TEXT_PRIMARY);
  if (payload.company.representativeName) {
    doc.text(payload.company.representativeName, margin, yPosition);
    doc.setFontSize(FONT_SIZES.xs);
    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(...TEXT_SECONDARY);
    if (payload.company.representativeRole) {
      doc.text(payload.company.representativeRole, margin, yPosition + 4);
    }
    doc.text(payload.company.name, margin, yPosition + (payload.company.representativeRole ? 8 : 4));
    doc.setTextColor(...TEXT_PRIMARY);
  } else {
    doc.text(payload.company.name, margin, yPosition);
  }

  // Client name label
  doc.setFontSize(FONT_SIZES.sm);
  doc.setFont(bodyFont, 'bold');
  doc.setTextColor(...TEXT_PRIMARY);
  const clientName = payload.client?.name ?? (t ? t('offerPdf.defaultClientName') : 'Klient');
  doc.text(clientName, rightSigX, yPosition);

  // Signature lines
  doc.setDrawColor(...BORDER_DEFAULT);
  doc.line(margin, sigLineY, margin + sigColWidth, sigLineY);
  doc.line(rightSigX, sigLineY, rightSigX + sigColWidth, sigLineY);

  // Labels below lines
  doc.setFontSize(FONT_SIZES.xs);
  doc.setFont(bodyFont, 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text(t ? t('offerPdf.contractorSignature') : 'Podpis i pieczęć wykonawcy', margin, sigLineY + 5);
  doc.text(t ? t('offerPdf.clientSignature') : 'Podpis klienta', rightSigX, sigLineY + 5);

  doc.setTextColor(...TEXT_PRIMARY);
  yPosition = sigLineY + 10;

  // ========================================
  // FOOTER — add to all pages
  // ========================================

  const totalPages = doc.getNumberOfPages();
  const footerY = doc.internal.pageSize.getHeight() - 10;
  const validUntilStr = formatDate(payload.validUntil, locale);
  const generatedStr = payload.generatedAt.toLocaleString(locale);

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    doc.setFontSize(FONT_SIZES.xs);
    doc.setTextColor(...TEXT_MUTED);

    // Thin separator line above footer
    doc.setDrawColor(...BORDER_DEFAULT);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 7, pageWidth - margin, footerY - 7);
    // Trade-aware accent on first 30mm
    doc.setDrawColor(...accentRgb);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 7, margin + 30, footerY - 7);
    doc.setLineWidth(0.2);

    // Left: validity date
    doc.setFont(bodyFont, 'normal');
    const footerValidText = t
      ? t('offerPdf.validUntil', { date: validUntilStr })
      : `Ważna do: ${validUntilStr}`;
    doc.text(footerValidText, margin, footerY - 2);

    // Center: generator notice
    doc.setFont(bodyFont, 'italic');
    const footerGenText = t
      ? t('offerPdf.generatedBy', { date: generatedStr })
      : `Wygenerowano przez Majster.AI  ·  ${generatedStr}`;
    doc.text(
      footerGenText,
      pageWidth / 2,
      footerY - 2,
      { align: 'center' }
    );

    // Right: page X / Y in monospace
    doc.setFont(monoFont, 'bold');
    doc.text(
      `${pageNum} / ${totalPages}`,
      pageWidth - margin,
      footerY - 2,
      { align: 'right' }
    );

    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(...TEXT_PRIMARY);
  }

  // Convert to Blob
  const pdfBlob = doc.output('blob');

  // Fire analytics event after successful generation
  trackEvent(ANALYTICS_EVENTS.OFFER_PDF_GENERATED, {
    meta: { templateId },
  });

  return pdfBlob;
}

/**
 * Upload offer PDF to Supabase Storage
 * Uses existing 'company-documents' bucket with path pattern: userId/offers/projectId/timestamp.pdf
 */
export async function uploadOfferPdf(params: {
  projectId: string;
  pdfBlob: Blob;
  userId: string;
  fileName?: string;
}): Promise<{ storagePath: string; publicUrl: string }> {
  const { projectId, pdfBlob, userId, fileName } = params;

  // Generate unique file name
  const timestamp = Date.now();
  const finalFileName = fileName || `oferta-${timestamp}.pdf`;
  const storagePath = `${userId}/offers/${projectId}/${finalFileName}`;

  // Upload to Supabase Storage (using existing 'company-documents' bucket)
  const { error: uploadError } = await supabase.storage
    .from('company-documents')
    .upload(storagePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true, // Allow overwriting if file exists
    });

  if (uploadError) {
    logger.error('PDF upload error:', uploadError);
    throw new Error(`Nie udało się zapisać PDF: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('company-documents')
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: urlData.publicUrl,
  };
}
