/**
 * templatePdfGenerator — PR-17
 *
 * Generates PDF documents from filled document template instances.
 * Uses jsPDF + jspdf-autotable (same approach as PR-11/PR-16).
 *
 * Features:
 *  - Company header (logo/name/address) from autofill context
 *  - Document title + document number
 *  - Sections with fields (key-value pairs)
 *  - References block (legal basis) in footer/appendix
 *  - Signature lines
 *  - Upload to dossier bucket
 *
 * ── Klasyfikacja PDF Platform v2 ─────────────────────────────────────────────
 * STATUS: STANDALONE / OCZEKUJE MIGRACJI
 *
 * Ten generator używa jsPDF z hardkodowanymi kolorami (niezgodnymi z tokenami
 * z modernPdfStyles.ts). Jest wywoływany bezpośrednio przez TemplateEditor.tsx.
 *
 * Deferred migracja do v2:
 *   - Krok 1: implementacja 'protocol'/'inspection' w generate-pdf-v2 (Edge Fn)
 *   - Krok 2: adapter UnifiedDocumentPayload → TemplatePdfInput
 *   - Krok 3: migracja TemplateEditor.tsx → renderDocumentPdfV2
 *   - Krok 4: zastąpienie hardkodowanych kolorów tokenami z modernPdfStyles.ts
 *
 * Tokeny docelowe (modernPdfStyles.ts):
 *   blue `[37, 99, 235]`   → ACCENT_BLUE = [30, 64, 175]  (do ujednolicenia)
 *   gray `[100, 100, 100]` → TEXT_SECONDARY = [107, 114, 128]
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/formatters';
import type { DocumentTemplate } from '@/data/documentTemplates';
import type { AutofillContext } from '@/hooks/useDocumentInstances';
import { registerNotoSans } from '@/lib/pdf/registerNotoSansJsPDF';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TemplatePdfInput {
  template: DocumentTemplate;
  data: Record<string, string>;
  autofillContext: AutofillContext;
  locale: 'pl' | 'en' | 'uk';
  documentNumber?: string;
  /** i18n translation function (t) for field/section labels */
  t: (key: string, opts?: Record<string, unknown>) => string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function docNumber(templateKey: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const prefix = templateKey.slice(0, 4).toUpperCase().replace(/_/g, '');
  return `${prefix}/${year}${month}${day}/${rand}`;
}

function formatFieldValue(key: string, value: string, t: (k: string) => string): string {
  if (!value) return '—';

  // Translate select values
  const selectValueMap: Record<string, string> = {
    // acceptance_result
    'accepted': t('docTemplates.selectValues.accepted'),
    'accepted_with_defects': t('docTemplates.selectValues.acceptedWithDefects'),
    'rejected': t('docTemplates.selectValues.rejected'),
    // materials_source
    'contractor': t('docTemplates.selectValues.contractor'),
    'client': t('docTemplates.selectValues.client'),
    'mixed': t('docTemplates.selectValues.mixed'),
    // urgency / risk_rating
    'low': t('docTemplates.selectValues.low'),
    'medium': t('docTemplates.selectValues.medium'),
    'high': t('docTemplates.selectValues.high'),
    'critical': t('docTemplates.selectValues.critical'),
    'emergency': t('docTemplates.selectValues.emergency'),
    // legal_title
    'owner': t('docTemplates.selectValues.owner'),
    'tenant': t('docTemplates.selectValues.tenant'),
    'co_owner': t('docTemplates.selectValues.coOwner'),
    'attorney': t('docTemplates.selectValues.attorney'),
    // handover_direction
    'contractor_to_client': t('docTemplates.selectValues.contractorToClient'),
    'client_to_contractor': t('docTemplates.selectValues.clientToContractor'),
    // damage_type
    'flood': t('docTemplates.selectValues.flood'),
    'fire': t('docTemplates.selectValues.fire'),
    'mechanical': t('docTemplates.selectValues.mechanical'),
    'other': t('docTemplates.selectValues.other'),
    // overall_assessment
    'fit_for_use': t('docTemplates.selectValues.fitForUse'),
    'requires_repairs': t('docTemplates.selectValues.requiresRepairs'),
    'requires_demolition': t('docTemplates.selectValues.requiresDemolition'),
    // inspection_type
    'spring_before_31_may': t('docTemplates.selectValues.springBefore31May'),
    'autumn_before_30_nov': t('docTemplates.selectValues.autumnBefore30Nov'),
  };

  return selectValueMap[value] ?? value;
}

// ── generateTemplatePdf ───────────────────────────────────────────────────────

export async function generateTemplatePdf(input: TemplatePdfInput): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const { template, data, autofillContext, t, documentNumber } = input;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const bodyFont = registerNotoSans(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  const blue: [number, number, number] = [37, 99, 235];
  const gray: [number, number, number] = [100, 100, 100];
  const darkGray: [number, number, number] = [50, 50, 50];

  // ── Company header ──────────────────────────────────────────────────────────
  const companyName = autofillContext.company?.name ?? t('docTemplates.pdf.unknownCompany');

  // Blue band
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setFont(bodyFont, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(companyName, margin, 16);

  doc.setFont(bodyFont, 'normal');
  doc.setFontSize(8);
  const companyParts: string[] = [];
  if (autofillContext.company?.nip) companyParts.push(`NIP: ${autofillContext.company.nip}`);
  if (autofillContext.company?.address) companyParts.push(autofillContext.company.address);
  if (autofillContext.company?.phone) companyParts.push(`Tel: ${autofillContext.company.phone}`);
  if (autofillContext.company?.email) companyParts.push(autofillContext.company.email);
  if (companyParts.length > 0) {
    doc.text(companyParts.join('  |  '), margin, 25);
  }

  doc.setTextColor(0, 0, 0);
  y = 44;

  // ── Document title + number ─────────────────────────────────────────────────
  const docNum = documentNumber ?? docNumber(template.key);
  const docTitle = t(template.titleKey);

  doc.setFont(bodyFont, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkGray);
  doc.text(docTitle, margin, y);

  doc.setFont(bodyFont, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(`${t('docTemplates.pdf.docNumber')}: ${docNum}`, pageWidth - margin, y, { align: 'right' });
  doc.text(
    `${t('docTemplates.pdf.generatedAt')}: ${formatDate(new Date(), input.locale)}`,
    pageWidth - margin,
    y + 5,
    { align: 'right' }
  );

  doc.setTextColor(0, 0, 0);
  y += 12;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── Sections ────────────────────────────────────────────────────────────────
  for (const section of template.sections) {
    // Section heading
    doc.setFont(bodyFont, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...blue);
    doc.text(t(section.titleKey).toUpperCase(), margin, y);
    y += 2;

    // Underline
    doc.setDrawColor(...blue);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    y += 5;

    for (const field of section.fields) {
      const value = data[field.key] ?? '';
      if (!value && !field.required) continue;

      const labelText = t(field.labelKey);
      const valueText = formatFieldValue(field.key, value, t);

      // Check for page overflow
      if (y + 12 > pageHeight - 35) {
        doc.addPage();
        y = margin;
      }

      if (field.type === 'textarea') {
        // Label above, value below (multi-line)
        doc.setFont(bodyFont, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        doc.text(labelText + ':', margin, y);
        y += 4;

        doc.setFont(bodyFont, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        const lines = doc.splitTextToSize(valueText, pageWidth - 2 * margin);
        doc.text(lines, margin + 3, y);
        y += lines.length * 4.5 + 3;
      } else if (field.type === 'checkbox') {
        // Checkbox field
        doc.setFont(bodyFont, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        const checkMark = value === 'true' ? '☑' : '☐';
        doc.text(`${checkMark}  ${labelText}`, margin + 3, y);
        y += 6;
      } else {
        // Inline label: value
        doc.setFont(bodyFont, 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        doc.text(labelText + ': ', margin, y);

        const labelWidth = doc.getTextWidth(labelText + ': ');
        doc.setFont(bodyFont, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        doc.text(valueText, margin + labelWidth, y);
        y += 6;
      }
    }

    y += 4;
  }

  // ── Signature lines ─────────────────────────────────────────────────────────
  if (y + 40 > pageHeight - 35) {
    doc.addPage();
    y = margin;
  }

  y += 6;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  const sigWidth = (pageWidth - 2 * margin - 10) / 2;
  const rightSigX = margin + sigWidth + 10;

  doc.setDrawColor(80, 80, 80);
  doc.line(margin, y, margin + sigWidth, y);
  doc.line(rightSigX, y, rightSigX + sigWidth, y);

  doc.setFont(bodyFont, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text(t('docTemplates.pdf.contractorSignature'), margin, y + 5);
  doc.text(t('docTemplates.pdf.clientSignature'), rightSigX, y + 5);

  y += 12;

  // ── References (appendix or footer) ────────────────────────────────────────
  if (template.references.length > 0) {
    if (y + 20 + template.references.length * 6 > pageHeight - 20) {
      doc.addPage();
      y = margin;
    } else {
      y += 4;
    }

    doc.setDrawColor(...blue);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFont(bodyFont, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...blue);
    doc.text(t('docTemplates.pdf.references'), margin, y);
    y += 5;

    doc.setFont(bodyFont, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...gray);

    for (const ref of template.references) {
      const lines = doc.splitTextToSize(`• ${ref.text}`, pageWidth - 2 * margin);
      if (y + lines.length * 4 > pageHeight - 15) {
        doc.addPage();
        y = margin;
      }
      doc.text(lines, margin, y);
      y += lines.length * 4 + 1;
    }
  }

  // ── Page footers ────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Majster.AI — ${docTitle} | ${t('docTemplates.pdf.page')} ${i} / ${pageCount} | ${docNum}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      formatDate(new Date(), input.locale),
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  return doc.output('blob');
}

// ── uploadTemplatePdf ─────────────────────────────────────────────────────────

export async function uploadTemplatePdf(params: {
  userId: string;
  projectId?: string | null;
  instanceId: string;
  templateKey: string;
  pdfBlob: Blob;
}): Promise<string> {
  const { userId, projectId, instanceId, templateKey, pdfBlob } = params;
  const safeName = templateKey.replace(/[^a-z0-9_]/g, '_');
  const projectPart = projectId ?? 'no_project';
  const filePath = `${userId}/${projectPart}/documents/${safeName}_${instanceId}.pdf`;

  const { error } = await supabase.storage
    .from('dossier')
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    logger.error('[TemplatePdf] upload error', error);
    throw new Error(`PDF upload failed: ${error.message}`);
  }

  return filePath;
}
