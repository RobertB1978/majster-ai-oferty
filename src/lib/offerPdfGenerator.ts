/**
 * Offer PDF Generator - Phase 5B
 *
 * Client-side PDF generation using jsPDF + jspdf-autotable.
 * Generates professional offer documents and uploads them to Supabase Storage.
 *
 * PHASE 5 ROADMAP:
 * - Phase 5A: Data structure + email templates ✓
 * - Phase 5B (current): PDF generation + Supabase Storage upload
 * - Phase 5C (next): Shareable PDF links + attach to emails + DB storage
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

// Amber design tokens (Tailwind amber scale)
// amber-50: #fffbeb  amber-100: #fef3c7  amber-200: #fde68a
// amber-700: #b45309  amber-800: #92400e
const AMBER_50: [number, number, number] = [255, 251, 235];
const AMBER_100: [number, number, number] = [254, 243, 199];
const AMBER_700: [number, number, number] = [180, 83, 9];

const TEMPLATE_THEMES: Record<PdfTemplateId, TemplateTheme> = {
  classic: {
    headerFill: [30, 58, 95],
    headerText: [255, 255, 255],
    accentColor: [30, 58, 95],
    tableTheme: 'grid',
    alternateRowFill: [248, 250, 252],
    summaryBg: AMBER_50,
    grossAccent: AMBER_700,
  },
  modern: {
    headerFill: [30, 58, 95],
    headerText: [255, 255, 255],
    accentColor: [30, 58, 95],
    tableTheme: 'striped',
    companyBg: [30, 58, 95],
    companyBgLight: [42, 78, 122],
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
  const margin = 15;
  let yPosition = margin;

  // Resolve template theme
  const templateId = payload.pdfConfig.templateId ?? 'classic';
  const theme = TEMPLATE_THEMES[templateId];

  // ========================================
  // HEADER SECTION
  // ========================================

  if (theme.companyBg) {
    // Modern template: full-width colored header band with subtle depth
    const bandHeight = 50;
    doc.setFillColor(theme.companyBg[0], theme.companyBg[1], theme.companyBg[2]);
    doc.rect(0, 0, pageWidth, bandHeight, 'F');

    // Lighter stripe at the very top (3mm) for depth effect
    if (theme.companyBgLight) {
      doc.setFillColor(theme.companyBgLight[0], theme.companyBgLight[1], theme.companyBgLight[2]);
      doc.rect(0, 0, pageWidth, 3, 'F');
    }

    // "OFERTA" label right-aligned in header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 200, 240);
    doc.text('OFERTA', pageWidth - margin, 12, { align: 'right' });

    // Company name in white
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(payload.company.name, margin, 20);

    // Company details: NIP + address on one line, contact on next
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(190, 215, 245);

    const addrParts: string[] = [];
    if (payload.company.nip) addrParts.push(`NIP: ${payload.company.nip}`);
    if (payload.company.street) addrParts.push(payload.company.street);
    if (payload.company.postalCode || payload.company.city) {
      addrParts.push([payload.company.postalCode, payload.company.city].filter(Boolean).join(' '));
    }
    if (addrParts.length > 0) doc.text(addrParts.join('  |  '), margin, 30);

    const contactParts: string[] = [];
    if (payload.company.phone) contactParts.push(`Tel: ${payload.company.phone}`);
    if (payload.company.email) contactParts.push(`Email: ${payload.company.email}`);
    if (contactParts.length > 0) doc.text(contactParts.join('  |  '), margin, 38);

    doc.setTextColor(0, 0, 0);
    yPosition = bandHeight + 6;
  } else {
    // Classic / Minimal template: text-only header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
    doc.text(payload.company.name, margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    if (payload.company.nip) {
      doc.text(`NIP: ${payload.company.nip}`, margin, yPosition);
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
      doc.text(address, margin, yPosition);
      yPosition += 5;
    }

    if (payload.company.phone) {
      doc.text(`Tel: ${payload.company.phone}`, margin, yPosition);
      yPosition += 5;
    }

    if (payload.company.email) {
      doc.text(`Email: ${payload.company.email}`, margin, yPosition);
      yPosition += 5;
    }

    yPosition += 5;

    // Separator line
    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
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
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      // Thin border frame around QR code
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(qrX - 1, yPosition - 3, QR_SIZE + 2, QR_SIZE + 2);
      doc.addImage(qrDataUrl, 'PNG', qrX, yPosition - 2, QR_SIZE, QR_SIZE);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text('OFERTA ONLINE', qrX + QR_SIZE / 2, yPosition + QR_SIZE + 1.5, { align: 'center' });
      doc.setTextColor(0);
      qrPlaced = true;
    } catch {
      // QR generation failure is non-fatal — PDF continues without QR
    }
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  // Leave room for QR code when present
  const titleMaxWidth = qrPlaced ? qrX - margin - 5 : pageWidth - 2 * margin;
  doc.text(payload.pdfConfig.title, margin, yPosition, { maxWidth: titleMaxWidth });
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Compliance: document ID + dates (uses getPdfComplianceLines for testable strings)
  const complianceLines = getPdfComplianceLines(payload);
  const complianceRightX = qrPlaced ? qrX - 3 : pageWidth - margin;
  doc.text(complianceLines.documentIdLine, complianceRightX, yPosition, { align: 'right' });
  doc.text(complianceLines.issuedAtLine, margin, yPosition);
  yPosition += 5;

  doc.text(complianceLines.validUntilLine, margin, yPosition);
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
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dane klienta:', margin, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(payload.client.name, margin, yPosition);
    yPosition += 5;

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

    yPosition += 5;
  }

  // ========================================
  // OFFER TEXT SECTION
  // ========================================

  if (payload.pdfConfig.offerText) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const offerTextLines = doc.splitTextToSize(
      payload.pdfConfig.offerText,
      pageWidth - 2 * margin
    );
    doc.text(offerTextLines, margin, yPosition);
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
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
    doc.text(sectionLabel ?? 'Pozycje wyceny:', margin, yPosition);
    // Thin underline accent
    doc.setDrawColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 1.5, margin + 60, yPosition + 1.5);
    doc.setLineWidth(0.2);
    doc.setTextColor(0, 0, 0);
    yPosition += 9;

    const tableData = quote.positions.map((pos) => [
      pos.name,
      pos.qty.toString(),
      pos.unit,
      formatCurrency(pos.price),
      pos.category,
      formatCurrency(pos.qty * pos.price),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Nazwa', 'Ilość', 'Jedn.', 'Cena jedn.', 'Kategoria', 'Wartość']],
      body: tableData,
      theme: theme.tableTheme,
      headStyles: {
        fillColor: theme.headerFill,
        textColor: theme.headerText,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: theme.alternateRowFill
        ? { fillColor: theme.alternateRowFill }
        : undefined,
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 27, halign: 'right' },
        4: { cellWidth: 24, halign: 'center' },
        5: { cellWidth: 27, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      // Apply Courier (monospace) for monetary amount columns — col 3 & 5
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

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
    doc.text('Podsumowanie:', margin, yPosition + 4);
    doc.setTextColor(0, 0, 0);
    yPosition += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (quote.isVatExempt) {
      // Amber highlight band behind the total row
      doc.setFillColor(AMBER_100[0], AMBER_100[1], AMBER_100[2]);
      doc.rect(summaryX - 4, yPosition - 1, summaryBoxWidth, 10, 'F');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(theme.grossAccent[0], theme.grossAccent[1], theme.grossAccent[2]);
      doc.text('Wartość końcowa:', summaryX + 1, yPosition + 5);
      doc.setFont(monoFont, 'bold');
      doc.text(formatCurrency(quote.total), pageWidth - margin, yPosition + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      yPosition += 12;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120);
      doc.text('Sprzedawca zwolniony z podatku VAT (art. 43 ust. 1 ustawy o VAT)', summaryX + 1, yPosition);
      doc.setTextColor(0);
      yPosition += 10;
    } else {
      doc.setTextColor(80, 80, 80);
      doc.text('Wartość netto:', summaryX + 1, yPosition);
      doc.setFont(monoFont, 'normal');
      doc.text(formatCurrency(quote.netTotal), pageWidth - margin, yPosition, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      yPosition += 6;
      if (quote.vatRate !== null) {
        doc.setTextColor(80, 80, 80);
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
      doc.setDrawColor(theme.grossAccent[0], theme.grossAccent[1], theme.grossAccent[2]);
      doc.setLineWidth(0.5);
      doc.line(summaryX - 2, yPosition - 1, pageWidth - margin + 2, yPosition - 1);
      doc.setLineWidth(0.2);
      doc.setDrawColor(180);

      doc.setFontSize(12);
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
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]);
    doc.text('Warunki:', margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const termsLines = doc.splitTextToSize(payload.pdfConfig.terms, pageWidth - 2 * margin);
    doc.text(termsLines, margin, yPosition);
    yPosition += termsLines.length * 4 + 5;
  }

  // ========================================
  // DEADLINE SECTION
  // ========================================

  if (payload.pdfConfig.deadlineText) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(payload.pdfConfig.deadlineText, margin, yPosition);
    yPosition += 10;
  }

  // ========================================
  // SIGNATURE SECTION
  // ========================================

  const pageHeight = doc.internal.pageSize.getHeight();
  // If there's not enough space for the signature block (~55mm), start a new page
  if (yPosition + 55 > pageHeight - 25) {
    doc.addPage();
    yPosition = margin;
  }

  yPosition += 12;

  // Separator before signatures
  doc.setDrawColor(180);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 18;

  const sigColWidth = (pageWidth - 2 * margin - 10) / 2;
  const rightSigX = margin + sigColWidth + 10;
  const sigLineY = yPosition + 18;

  // Contractor name label
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(payload.company.name, margin, yPosition);

  // Client name label
  const clientName = payload.client?.name ?? 'Klient';
  doc.text(clientName, rightSigX, yPosition);

  // Signature lines
  doc.setDrawColor(120);
  doc.line(margin, sigLineY, margin + sigColWidth, sigLineY);
  doc.line(rightSigX, sigLineY, rightSigX + sigColWidth, sigLineY);

  // Labels below lines
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
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
    doc.setFontSize(7.5);
    doc.setTextColor(130);

    // Thin separator line above footer
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 7, pageWidth - margin, footerY - 7);

    // Left: validity date
    doc.setFont('helvetica', 'normal');
    doc.text(`Ważna do: ${validUntilStr}`, margin, footerY - 2);

    // Center: generator notice
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Wygenerowano przez Majster.AI | ${generatedStr}`,
      pageWidth / 2,
      footerY - 2,
      { align: 'center' }
    );

    // Right: page X / Y
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Str. ${pageNum} / ${totalPages}`,
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
