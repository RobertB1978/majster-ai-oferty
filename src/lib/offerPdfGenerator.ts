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
import { OfferPdfPayload } from './offerDataBuilder';
import { formatCurrency } from './formatters';
import { supabase } from '@/integrations/supabase/client';

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

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = margin;

  // ========================================
  // HEADER SECTION
  // ========================================

  // Company name (bold, large)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(payload.company.name, margin, yPosition);
  yPosition += 8;

  // Company details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

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

  // ========================================
  // TITLE SECTION
  // ========================================

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(payload.pdfConfig.title, margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Data: ${payload.generatedAt.toLocaleDateString('pl-PL')}`,
    margin,
    yPosition
  );
  yPosition += 10;

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
  // ========================================

  if (payload.quote && payload.quote.positions.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Pozycje wyceny:', margin, yPosition);
    yPosition += 8;

    // Prepare table data
    const tableData = payload.quote.positions.map((pos) => [
      pos.name,
      pos.qty.toString(),
      pos.unit,
      formatCurrency(pos.price),
      pos.category,
      formatCurrency(pos.qty * pos.price),
    ]);

    // Generate table using jspdf-autotable
    autoTable(doc, {
      startY: yPosition,
      head: [['Nazwa', 'Ilość', 'Jedn.', 'Cena jedn.', 'Kategoria', 'Wartość']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 50 }, // Nazwa
        1: { cellWidth: 20, halign: 'center' }, // Ilość
        2: { cellWidth: 20, halign: 'center' }, // Jednostka
        3: { cellWidth: 25, halign: 'right' }, // Cena jedn.
        4: { cellWidth: 25, halign: 'center' }, // Kategoria
        5: { cellWidth: 25, halign: 'right' }, // Wartość
      },
      margin: { left: margin, right: margin },
    });

    // Update yPosition after table
    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // ========================================
    // SUMMARY SECTION
    // ========================================

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Podsumowanie:', margin, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summaryX = pageWidth - margin - 60;

    doc.text('Materiały:', summaryX, yPosition);
    doc.text(formatCurrency(payload.quote.summaryMaterials), pageWidth - margin, yPosition, {
      align: 'right',
    });
    yPosition += 5;

    doc.text('Robocizna:', summaryX, yPosition);
    doc.text(formatCurrency(payload.quote.summaryLabor), pageWidth - margin, yPosition, {
      align: 'right',
    });
    yPosition += 5;

    doc.text(`Marża (${payload.quote.marginPercent}%):`, summaryX, yPosition);
    const marginValue =
      (payload.quote.summaryMaterials + payload.quote.summaryLabor) *
      (payload.quote.marginPercent / 100);
    doc.text(formatCurrency(marginValue), pageWidth - margin, yPosition, {
      align: 'right',
    });
    yPosition += 8;

    // Total (bold, larger)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Wartość końcowa:', summaryX, yPosition);
    doc.text(formatCurrency(payload.quote.total), pageWidth - margin, yPosition, {
      align: 'right',
    });
    yPosition += 10;
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
    doc.text('Warunki:', margin, yPosition);
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
  // FOOTER
  // ========================================

  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text(
    `Oferta wygenerowana przez Majster.AI - ${payload.generatedAt.toLocaleString('pl-PL')}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // Convert to Blob
  const pdfBlob = doc.output('blob');
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
    console.error('PDF upload error:', uploadError);
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
