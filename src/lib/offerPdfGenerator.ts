/**
 * Offer PDF Generator — Prestige Pass (Gate 1 / Warunek 3)
 *
 * Client-side PDF generation using jsPDF + jspdf-autotable.
 * Design tokens from src/lib/pdf/modernPdfStyles.ts (sections 3.1–3.4).
 *
 * Scope per sekcja 26.1: typography, spacing, hierarchy, layout, colors,
 * header (logo, company data, document ID), footer (validity, date, page X/Y),
 * QR code, amber Total accent, JetBrains Mono for amounts.
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
import { formatCurrency } from './formatters';
import { logger } from './logger';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from './analytics/track';
import { ANALYTICS_EVENTS } from './analytics/events';
import { JETBRAINS_MONO_REGULAR_B64 } from './jetbrains-mono-b64';
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
  drawLogoPlaceholder,
} from './pdf/modernPdfStyles';

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
 */
export function getPdfComplianceLines(payload: OfferPdfPayload) {
  const locale = 'pl-PL';
  return {
    documentIdLine: `Nr: ${payload.documentId}`,
    issuedAtLine: `Data wystawienia: ${payload.issuedAt.toLocaleDateString(locale)}`,
    validUntilLine: `Ważna do: ${payload.validUntil.toLocaleDateString(locale)}`,
    vatExemptLine: 'Sprzedawca zwolniony z podatku VAT (art. 43 ust. 1 ustawy o VAT)',
    vatRateLine:
      payload.quote?.vatRate !== null && payload.quote?.vatRate !== undefined
        ? `VAT (${payload.quote.vatRate}%):`
        : null,
  };
}

/**
 * Generate PDF document from offer payload
 * Returns a Blob that can be downloaded or uploaded to storage
 */
export async function generateOfferPdf(payload: OfferPdfPayload): Promise<Blob> {
  // Create new PDF document (A4 portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

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

  // ========================================
  // HEADER SECTION
  // ========================================

  if (theme.companyBg) {
    // Modern template: full-width colored header band with logo placeholder
    const bandHeight = 50;
    doc.setFillColor(theme.companyBg[0], theme.companyBg[1], theme.companyBg[2]);
    doc.rect(0, 0, pageWidth, bandHeight, 'F');

    // Lighter stripe at the very top (3mm) for depth effect
    if (theme.companyBgLight) {
      doc.setFillColor(theme.companyBgLight[0], theme.companyBgLight[1], theme.companyBgLight[2]);
      doc.rect(0, 0, pageWidth, 3, 'F');
    }

    // Amber accent bar at the bottom of the header band
    doc.setFillColor(ACCENT_AMBER[0], ACCENT_AMBER[1], ACCENT_AMBER[2]);
    doc.rect(0, bandHeight - 2, pageWidth, 2, 'F');

    // "OFERTA" label right-aligned in header
    doc.setFontSize(FONT_SIZES.sm);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(ACCENT_AMBER[0], ACCENT_AMBER[1], ACCENT_AMBER[2]);
    doc.text('OFERTA', pageWidth - margin, 12, { align: 'right' });

    // Logo placeholder (white rounded square with initial) in the header band
    const logoY = 14;
    const logoSize = 12;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, logoY, logoSize, logoSize, 2, 2, 'F');
    const initial = payload.company.name.trim().charAt(0).toUpperCase() || 'M';
    doc.setFontSize(logoSize * 0.55);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.companyBg[0], theme.companyBg[1], theme.companyBg[2]);
    doc.text(initial, margin + logoSize / 2, logoY + logoSize * 0.68, { align: 'center' });

    // Company name in white — next to logo
    const nameX = margin + logoSize + 4;
    doc.setFontSize(FONT_SIZES['2xl']);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(payload.company.name, nameX, 22);

    // Company details: NIP + address on one line, contact on next
    doc.setFontSize(FONT_SIZES.sm);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(190, 215, 245);

    const addrParts: string[] = [];
    if (payload.company.nip) addrParts.push(`NIP: ${payload.company.nip}`);
    if (payload.company.street) addrParts.push(payload.company.street);
    if (payload.company.postalCode || payload.company.city) {
      addrParts.push([payload.company.postalCode, payload.company.city].filter(Boolean).join(' '));
    }
    if (addrParts.length > 0) doc.text(addrParts.join('  ·  '), nameX, 30);

    const contactParts: string[] = [];
    if (payload.company.phone) contactParts.push(`Tel: ${payload.company.phone}`);
    if (payload.company.email) contactParts.push(`Email: ${payload.company.email}`);
    if (contactParts.length > 0) doc.text(contactParts.join('  ·  '), nameX, 38);

    doc.setTextColor(0, 0, 0);
    yPosition = bandHeight + 6;
  } else {
    // Classic / Minimal template: text-only header with logo placeholder
    // Logo placeholder on the left
    drawLogoPlaceholder(doc, margin, yPosition - 3, payload.company.name);
    const nameX = margin + 18; // after logo placeholder

    doc.setFontSize(FONT_SIZES.xl);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
    doc.text(payload.company.name, nameX, yPosition + 2);
    yPosition += 8;

    doc.setFontSize(FONT_SIZES.base);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);

    if (payload.company.nip) {
      doc.text(`NIP: ${payload.company.nip}`, nameX, yPosition);
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

    // Separator line with amber accent
    doc.setDrawColor(BORDER_DEFAULT[0], BORDER_DEFAULT[1], BORDER_DEFAULT[2]);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    // Amber accent segment (first 40mm)
    doc.setDrawColor(ACCENT_AMBER[0], ACCENT_AMBER[1], ACCENT_AMBER[2]);
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
      // Amber-accented frame around QR code
      doc.setFillColor(ACCENT_AMBER_SUBTLE[0], ACCENT_AMBER_SUBTLE[1], ACCENT_AMBER_SUBTLE[2]);
      doc.roundedRect(qrX - 2, yPosition - 4, QR_SIZE + 4, QR_SIZE + 12, 2, 2, 'F');
      doc.setDrawColor(ACCENT_AMBER[0], ACCENT_AMBER[1], ACCENT_AMBER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(qrX - 2, yPosition - 4, QR_SIZE + 4, QR_SIZE + 12, 2, 2, 'S');
      doc.setLineWidth(0.2);
      doc.addImage(qrDataUrl, 'PNG', qrX, yPosition - 2, QR_SIZE, QR_SIZE);
      // Label below QR
      doc.setFontSize(FONT_SIZES.xs);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(AMBER_700[0], AMBER_700[1], AMBER_700[2]);
      doc.text('OFERTA ONLINE', qrX + QR_SIZE / 2, yPosition + QR_SIZE + 3, { align: 'center' });
      doc.setTextColor(0);
      qrPlaced = true;
    } catch {
      // QR generation failure is non-fatal — PDF continues without QR
    }
  }

  doc.setFontSize(FONT_SIZES.lg);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
  // Leave room for QR code when present
  const titleMaxWidth = qrPlaced ? qrX - margin - 5 : pageWidth - 2 * margin;
  doc.text(payload.pdfConfig.title, margin, yPosition, { maxWidth: titleMaxWidth });
  yPosition += 8;

  doc.setFontSize(FONT_SIZES.base);
  doc.setFont('helvetica', 'normal');

  // Compliance: document ID + dates (uses getPdfComplianceLines for testable strings)
  const complianceLines = getPdfComplianceLines(payload);
  const complianceRightX = qrPlaced ? qrX - 3 : pageWidth - margin;
  // Document ID in monospace
  doc.setFont(monoFont, 'bold');
  doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
  doc.text(complianceLines.documentIdLine, complianceRightX, yPosition, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
  doc.text(complianceLines.issuedAtLine, margin, yPosition);
  yPosition += 5;

  doc.text(complianceLines.validUntilLine, margin, yPosition);
  doc.setTextColor(0, 0, 0);
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
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
    doc.text('Dane klienta:', margin, yPosition);
    yPosition += 6;

    doc.setFontSize(FONT_SIZES.base);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
    doc.text(payload.client.name, margin, yPosition);
    yPosition += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);

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

    doc.setTextColor(0, 0, 0);
    yPosition += 5;
  }

  // ========================================
  // OFFER TEXT SECTION
  // ========================================

  if (payload.pdfConfig.offerText) {
    ensureSpace(15); // at least one line + padding
    doc.setFontSize(FONT_SIZES.base);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
    const offerTextLines = doc.splitTextToSize(
      payload.pdfConfig.offerText,
      pageWidth - 2 * margin
    );
    doc.text(offerTextLines, margin, yPosition);
    doc.setTextColor(0, 0, 0);
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
      doc.setFont('helvetica', 'italic');
      doc.text('Brak pozycji.', margin, yPosition);
      yPosition += 8;
      return;
    }

    // Section header (variant label or default "Pozycje wyceny")
    ensureSpace(20); // heading + at least first table row
    doc.setFontSize(FONT_SIZES.lg);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
    doc.text(sectionLabel ?? 'Pozycje wyceny:', margin, yPosition);
    // Amber underline accent
    doc.setDrawColor(ACCENT_AMBER[0], ACCENT_AMBER[1], ACCENT_AMBER[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, yPosition + 1.5, margin + 50, yPosition + 1.5);
    doc.setLineWidth(0.2);
    doc.setTextColor(0, 0, 0);
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
        formatCurrency(pos.price),
        vatLabel,
        formatCurrency(grossValue),
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Nazwa', 'Ilość', 'J.m.', 'Cena netto', 'VAT', 'Wartość brutto']],
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
          data.doc.setFont('helvetica', 'normal');
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
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
    doc.text('Podsumowanie:', margin, yPosition + 4);
    doc.setTextColor(0, 0, 0);
    yPosition += 6;

    doc.setFontSize(FONT_SIZES.base);
    doc.setFont('helvetica', 'normal');

    if (quote.isVatExempt) {
      // Amber highlight band behind the total row
      doc.setFillColor(AMBER_100[0], AMBER_100[1], AMBER_100[2]);
      doc.rect(summaryX - 4, yPosition - 1, summaryBoxWidth, 10, 'F');

      doc.setFontSize(FONT_SIZES.lg);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(theme.grossAccent[0], theme.grossAccent[1], theme.grossAccent[2]);
      doc.text('Wartość końcowa:', summaryX + 1, yPosition + 5);
      doc.setFont(monoFont, 'bold');
      doc.text(formatCurrency(quote.total), pageWidth - margin, yPosition + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      yPosition += 12;
      doc.setFontSize(FONT_SIZES.sm);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text('Sprzedawca zwolniony z podatku VAT (art. 43 ust. 1 ustawy o VAT)', summaryX + 1, yPosition);
      doc.setTextColor(0);
      yPosition += 10;
    } else {
      doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
      doc.text('Wartość netto:', summaryX + 1, yPosition);
      doc.setFont(monoFont, 'normal');
      doc.text(formatCurrency(quote.netTotal), pageWidth - margin, yPosition, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      yPosition += 6;
      if (quote.vatRate !== null) {
        doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
        doc.text(`VAT (${quote.vatRate}%):`, summaryX + 1, yPosition);
        doc.setFont(monoFont, 'normal');
        doc.text(formatCurrency(quote.vatAmount), pageWidth - margin, yPosition, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        yPosition += 6;
      }
      // Amber highlight band behind the gross total row
      doc.setFillColor(AMBER_100[0], AMBER_100[1], AMBER_100[2]);
      doc.rect(summaryX - 4, yPosition - 1, summaryBoxWidth, 11, 'F');
      // Separator line above gross total
      doc.setDrawColor(ACCENT_AMBER[0], ACCENT_AMBER[1], ACCENT_AMBER[2]);
      doc.setLineWidth(0.8);
      doc.line(summaryX - 2, yPosition - 1, pageWidth - margin + 2, yPosition - 1);
      doc.setLineWidth(0.2);
      doc.setDrawColor(180);

      doc.setFontSize(FONT_SIZES.lg);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(theme.grossAccent[0], theme.grossAccent[1], theme.grossAccent[2]);
      doc.text('Do zapłaty (brutto):', summaryX + 1, yPosition + 5);
      doc.setFont(monoFont, 'bold');
      doc.text(formatCurrency(quote.grossTotal), pageWidth - margin, yPosition + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      yPosition += 15;
    }
  }

  if (hasVariants && payload.variantSections) {
    // Multi-variant: render each variant as a labeled section
    payload.variantSections.forEach((section, idx) => {
      if (idx > 0) {
        // Thin separator between variants
        doc.setDrawColor(180);
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
    doc.setFont('helvetica', 'italic');
    doc.text('Wycena nie została jeszcze przygotowana.', margin, yPosition);
    yPosition += 10;
  }

  // ========================================
  // TERMS & CONDITIONS SECTION
  // ========================================

  if (payload.pdfConfig.terms) {
    ensureSpace(20); // section heading + at least one line
    doc.setFontSize(FONT_SIZES.md);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
    doc.text('Warunki:', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 6;

    doc.setFontSize(FONT_SIZES.sm);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
    const termsLines = doc.splitTextToSize(payload.pdfConfig.terms, pageWidth - 2 * margin);
    doc.text(termsLines, margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += termsLines.length * 4 + 5;
  }

  // ========================================
  // DEADLINE SECTION
  // ========================================

  if (payload.pdfConfig.deadlineText) {
    ensureSpace(12);
    doc.setFontSize(FONT_SIZES.base);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
    doc.text(payload.pdfConfig.deadlineText, margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 10;
  }

  // ========================================
  // SIGNATURE SECTION
  // ========================================

  // Ensure enough space for signature block (~55mm)
  ensureSpace(55);

  yPosition += 12;

  // Separator before signatures
  doc.setDrawColor(180);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 18;

  const sigColWidth = (pageWidth - 2 * margin - 10) / 2;
  const rightSigX = margin + sigColWidth + 10;
  const sigLineY = yPosition + 18;

  // Contractor name label
  doc.setFontSize(FONT_SIZES.sm);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(TEXT_PRIMARY[0], TEXT_PRIMARY[1], TEXT_PRIMARY[2]);
  doc.text(payload.company.name, margin, yPosition);

  // Client name label
  const clientName = payload.client?.name ?? 'Klient';
  doc.text(clientName, rightSigX, yPosition);

  // Signature lines
  doc.setDrawColor(BORDER_DEFAULT[0], BORDER_DEFAULT[1], BORDER_DEFAULT[2]);
  doc.line(margin, sigLineY, margin + sigColWidth, sigLineY);
  doc.line(rightSigX, sigLineY, rightSigX + sigColWidth, sigLineY);

  // Labels below lines
  doc.setFontSize(FONT_SIZES.xs);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('Podpis i pieczęć wykonawcy', margin, sigLineY + 5);
  doc.text('Podpis klienta', rightSigX, sigLineY + 5);

  doc.setTextColor(0, 0, 0);
  yPosition = sigLineY + 10;

  // ========================================
  // FOOTER — add to all pages
  // ========================================

  const totalPages = doc.getNumberOfPages();
  const footerY = doc.internal.pageSize.getHeight() - 10;
  const locale = 'pl-PL';
  const validUntilStr = payload.validUntil.toLocaleDateString(locale);
  const generatedStr = payload.generatedAt.toLocaleString(locale);

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    doc.setFontSize(FONT_SIZES.xs);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);

    // Thin separator line above footer
    doc.setDrawColor(BORDER_DEFAULT[0], BORDER_DEFAULT[1], BORDER_DEFAULT[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 7, pageWidth - margin, footerY - 7);
    // Amber accent on first 30mm
    doc.setDrawColor(ACCENT_AMBER[0], ACCENT_AMBER[1], ACCENT_AMBER[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 7, margin + 30, footerY - 7);
    doc.setLineWidth(0.2);

    // Left: validity date
    doc.setFont('helvetica', 'normal');
    doc.text(`Ważna do: ${validUntilStr}`, margin, footerY - 2);

    // Center: generator notice
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Wygenerowano przez Majster.AI  ·  ${generatedStr}`,
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

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
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
