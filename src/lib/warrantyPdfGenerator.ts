/**
 * warrantyPdfGenerator — PR-18
 *
 * Generates a warranty card PDF using jsPDF.
 * Returns a Blob for download and optionally uploads to the dossier bucket.
 *
 * ── Klasyfikacja PDF Platform v2 ─────────────────────────────────────────────
 * STATUS: STANDALONE / OCZEKUJE MIGRACJI
 *
 * Ten generator używa jsPDF z hardkodowanymi kolorami (niezgodnymi z tokenami
 * z modernPdfStyles.ts). Jest wywoływany bezpośrednio przez WarrantySection.tsx.
 *
 * Deferred migracja do v2:
 *   - Krok 1: implementacja 'warranty' w generate-pdf-v2 (Edge Fn) — prio 1
 *   - Krok 2: adapter UnifiedDocumentPayload → WarrantyPdfContext (wymaga t fn)
 *   - Krok 3: migracja WarrantySection.tsx → renderDocumentPdfV2
 *   - Krok 4: zastąpienie hardkodowanych kolorów tokenami z modernPdfStyles.ts
 *
 * Tokeny docelowe (modernPdfStyles.ts):
 *   blue `[30, 90, 200]`  → ACCENT_BLUE = [30, 64, 175]  (do ujednolicenia)
 *   gray `[100, 100, 100]`→ TEXT_SECONDARY = [107, 114, 128]
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/formatters';
import type { ProjectWarranty } from '@/hooks/useWarranty';
import { registerNotoSans } from '@/lib/pdf/registerNotoSansJsPDF';

export interface WarrantyPdfContext {
  warranty: ProjectWarranty;
  projectTitle: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  t: (key: string) => string;
  locale?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '—';
  return formatDate(iso, locale);
}

function drawLine(doc: jsPDF, y: number): void {
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, 195, y);
}

function sectionTitle(doc: jsPDF, font: string, text: string, y: number): number {
  doc.setFontSize(10);
  doc.setFont(font, 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(text.toUpperCase(), 15, y);
  drawLine(doc, y + 2);
  return y + 8;
}

function field(doc: jsPDF, font: string, label: string, value: string, y: number): number {
  doc.setFontSize(9);
  doc.setFont(font, 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text(label, 15, y);

  doc.setFont(font, 'normal');
  doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(value || '—', 120);
  doc.text(lines, 75, y);
  return y + lines.length * 5 + 2;
}

// ── Main generator ────────────────────────────────────────────────────────────

export function generateWarrantyPdfBlob(ctx: WarrantyPdfContext): Blob {
  const { warranty, projectTitle, companyName, companyAddress, companyPhone, t, locale } = ctx;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const bodyFont = registerNotoSans(doc);

  // ── Header ───────────────────────────────────────────────────────────────────
  doc.setFillColor(30, 90, 200);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setFontSize(18);
  doc.setFont(bodyFont, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(t('warranty.pdf.title'), 15, 13);

  doc.setFontSize(9);
  doc.setFont(bodyFont, 'normal');
  doc.text(companyName, 15, 20);
  if (companyAddress) doc.text(companyAddress, 15, 25);

  // ── Document number + date ───────────────────────────────────────────────────
  const docNum = `GWR/${new Date().getFullYear()}/${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  doc.setFontSize(8);
  doc.setTextColor(200, 220, 255);
  doc.text(`${t('warranty.pdf.docNo')}: ${docNum}`, 195, 10, { align: 'right' });
  doc.text(`${t('warranty.pdf.issueDate')}: ${fmtDate(new Date().toISOString(), locale)}`, 195, 16, { align: 'right' });

  let y = 40;

  // ── Parties ──────────────────────────────────────────────────────────────────
  y = sectionTitle(doc, bodyFont, t('warranty.pdf.sectionParties'), y);
  y = field(doc, bodyFont, t('warranty.pdf.warrantor'), companyName, y);
  if (companyPhone) y = field(doc, bodyFont, t('warranty.pdf.phone'), companyPhone, y);
  y = field(doc, bodyFont, t('warranty.pdf.beneficiary'), warranty.client_name || '—', y);
  if (warranty.client_email) y = field(doc, bodyFont, t('warranty.pdf.email'), warranty.client_email, y);
  if (warranty.contact_phone) y = field(doc, bodyFont, t('warranty.pdf.contactPhone'), warranty.contact_phone, y);
  y += 4;

  // ── Object ───────────────────────────────────────────────────────────────────
  y = sectionTitle(doc, bodyFont, t('warranty.pdf.sectionObject'), y);
  y = field(doc, bodyFont, t('warranty.pdf.projectName'), projectTitle, y);
  y += 4;

  // ── Warranty period ──────────────────────────────────────────────────────────
  y = sectionTitle(doc, bodyFont, t('warranty.pdf.sectionPeriod'), y);
  y = field(doc, bodyFont, t('warranty.pdf.startDate'), fmtDate(warranty.start_date, locale), y);
  y = field(doc, bodyFont, t('warranty.pdf.endDate'), fmtDate(warranty.end_date, locale), y);
  y = field(doc, bodyFont, t('warranty.pdf.duration'), `${warranty.warranty_months} ${t('warranty.pdf.months')}`, y);
  y += 4;

  // ── Scope ────────────────────────────────────────────────────────────────────
  if (warranty.scope_of_work) {
    y = sectionTitle(doc, bodyFont, t('warranty.pdf.sectionScope'), y);
    doc.setFontSize(9);
    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(30, 30, 30);
    const scopeLines = doc.splitTextToSize(warranty.scope_of_work, 175);
    doc.text(scopeLines, 15, y);
    y += scopeLines.length * 5 + 6;
  }

  // ── Exclusions ───────────────────────────────────────────────────────────────
  if (warranty.exclusions) {
    y = sectionTitle(doc, bodyFont, t('warranty.pdf.sectionExclusions'), y);
    doc.setFontSize(9);
    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(30, 30, 30);
    const excLines = doc.splitTextToSize(warranty.exclusions, 175);
    doc.text(excLines, 15, y);
    y += excLines.length * 5 + 6;
  }

  // ── Legal basis ──────────────────────────────────────────────────────────────
  y = sectionTitle(doc, bodyFont, t('warranty.pdf.sectionLegal'), y);
  doc.setFontSize(8);
  doc.setFont(bodyFont, 'normal');
  doc.setTextColor(100, 100, 100);
  const legalText = t('warranty.pdf.legalText');
  const legalLines = doc.splitTextToSize(legalText, 175);
  doc.text(legalLines, 15, y);
  y += legalLines.length * 4.5 + 8;

  // ── Signatures ───────────────────────────────────────────────────────────────
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  drawLine(doc, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont(bodyFont, 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(t('warranty.pdf.sigWarrantor'), 30, y + 20, { align: 'center' });
  doc.text('...................................', 30, y + 22, { align: 'center' });
  doc.text(t('warranty.pdf.sigBeneficiary'), 175, y + 20, { align: 'center' });
  doc.text('...................................', 175, y + 22, { align: 'center' });

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(`Majster.AI — ${t('warranty.pdf.footerGenerated')} ${formatDate(new Date(), locale)}`, 105, 290, { align: 'center' });

  return doc.output('blob');
}

// ── Upload to dossier ─────────────────────────────────────────────────────────

export async function uploadWarrantyToDossier(
  blob: Blob,
  projectId: string,
  projectTitle: string,
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const fileName = `gwarancja_${projectTitle.replace(/\s+/g, '_').slice(0, 30)}_${Date.now()}.pdf`;
  const path = `${user.id}/${projectId}/warranty/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('dossier')
    .upload(path, blob, { contentType: 'application/pdf', upsert: true });

  if (uploadError) {
    logger.error('uploadWarrantyToDossier storage error', uploadError);
    throw uploadError;
  }

  // Add to dossier items
  const { error: dbError } = await supabase
    .from('project_dossier_items')
    .insert({
      user_id: user.id,
      project_id: projectId,
      category: 'GUARANTEE',
      file_path: path,
      file_name: fileName,
      mime_type: 'application/pdf',
      size_bytes: blob.size,
      source: 'MANUAL',
    });

  if (dbError) {
    logger.error('uploadWarrantyToDossier dossier insert error', dbError);
    throw dbError;
  }

  return path;
}
