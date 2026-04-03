/**
 * warrantyPdfGenerator — PR-18
 *
 * Generates a warranty card PDF using jsPDF.
 * Returns a Blob for download and optionally uploads to the dossier bucket.
 *
 * ── Klasyfikacja PDF Platform v2 ─────────────────────────────────────────────
 * STATUS: FALLBACK (siatka bezpieczeństwa)
 *
 * Ten generator używa jsPDF z tokenami z modernPdfStyles.ts.
 * Pełni rolę fallbacku klient-side gdy Edge Function jest niedostępna.
 * Ścieżka kanoniczna: generate-pdf-v2 → warrantyRenderer.ts (@react-pdf/renderer)
 *
 * Wywoływany przez:
 *   - renderPdfV2.ts → warrantyClientFallback() (gdy serwer niedostępny)
 *   - WarrantySection.tsx → bezpośrednio (legacy catch PendingMigrationError)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { formatDate } from '@/lib/formatters';
import type { ProjectWarranty } from '@/hooks/useWarranty';
import { registerNotoSans } from '@/lib/pdf/registerNotoSansJsPDF';
import {
  ACCENT_BLUE, TEXT_SECONDARY, TEXT_PRIMARY, WHITE,
  BORDER_LINE, TEXT_FOOTER, TEXT_HEADER_META,
  hexToRgb,
} from '@/lib/pdf/modernPdfStyles';
import {
  resolveTemplateVariant,
  getStyleTokens,
} from '@/lib/pdf/documentVisualSystem';
import type { TradeType, PlanTier } from '@/types/unified-document-payload';

export interface WarrantyPdfContext {
  warranty: ProjectWarranty;
  projectTitle: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyNip?: string;
  companyRegon?: string;
  companyKrs?: string;
  t: (key: string) => string;
  locale?: string;
  /** Trade type for visual system accent colors */
  trade?: string;
  /** Plan tier for visual system styling */
  planTier?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '—';
  return formatDate(iso, locale);
}

function drawLine(doc: jsPDF, y: number): void {
  doc.setDrawColor(...BORDER_LINE);
  doc.line(15, y, 195, y);
}

function sectionTitle(doc: jsPDF, font: string, text: string, y: number): number {
  doc.setFontSize(10);
  doc.setFont(font, 'bold');
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text(text.toUpperCase(), 15, y);
  drawLine(doc, y + 2);
  return y + 8;
}

function field(doc: jsPDF, font: string, label: string, value: string, y: number): number {
  doc.setFontSize(9);
  doc.setFont(font, 'bold');
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(label, 15, y);

  doc.setFont(font, 'normal');
  doc.setTextColor(...TEXT_PRIMARY);
  const lines = doc.splitTextToSize(value || '—', 120);
  doc.text(lines, 75, y);
  return y + lines.length * 5 + 2;
}

// ── Main generator ────────────────────────────────────────────────────────────

export function generateWarrantyPdfBlob(ctx: WarrantyPdfContext): Blob {
  const { warranty, projectTitle, companyName, companyAddress, companyPhone, companyNip, companyRegon, companyKrs, t, locale } = ctx;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const bodyFont = registerNotoSans(doc);

  // ── Resolve trade-aware header accent ─────────────────────────────────────
  let headerAccent: [number, number, number] = ACCENT_BLUE;
  if (ctx.trade) {
    const safeTrade = (ctx.trade as TradeType) ?? 'general';
    const safePlan = (ctx.planTier as PlanTier) ?? 'basic';
    const variant = resolveTemplateVariant({
      documentType: 'warranty',
      trade: safeTrade,
      planTier: safePlan,
    });
    const tokens = getStyleTokens(variant);
    headerAccent = hexToRgb(tokens.headerBg, ACCENT_BLUE);
  }

  // ── Header ───────────────────────────────────────────────────────────────────
  doc.setFillColor(...headerAccent);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setFontSize(18);
  doc.setFont(bodyFont, 'bold');
  doc.setTextColor(...WHITE);
  doc.text(t('warranty.pdf.title'), 15, 13);

  doc.setFontSize(9);
  doc.setFont(bodyFont, 'normal');
  doc.text(companyName, 15, 20);
  const regParts: string[] = [];
  if (companyNip) regParts.push(`NIP: ${companyNip}`);
  if (companyRegon) regParts.push(`REGON: ${companyRegon}`);
  if (companyKrs) regParts.push(`KRS: ${companyKrs}`);
  if (regParts.length > 0) doc.text(regParts.join(' · '), 15, 25);
  if (companyAddress) doc.text(companyAddress, 15, regParts.length > 0 ? 30 : 25);

  // ── Document number + date ───────────────────────────────────────────────────
  const docNum = `GWR/${new Date().getFullYear()}/${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_HEADER_META);
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
    doc.setTextColor(...TEXT_PRIMARY);
    const scopeLines = doc.splitTextToSize(warranty.scope_of_work, 175);
    doc.text(scopeLines, 15, y);
    y += scopeLines.length * 5 + 6;
  }

  // ── Exclusions ───────────────────────────────────────────────────────────────
  if (warranty.exclusions) {
    y = sectionTitle(doc, bodyFont, t('warranty.pdf.sectionExclusions'), y);
    doc.setFontSize(9);
    doc.setFont(bodyFont, 'normal');
    doc.setTextColor(...TEXT_PRIMARY);
    const excLines = doc.splitTextToSize(warranty.exclusions, 175);
    doc.text(excLines, 15, y);
    y += excLines.length * 5 + 6;
  }

  // ── Legal basis ──────────────────────────────────────────────────────────────
  y = sectionTitle(doc, bodyFont, t('warranty.pdf.sectionLegal'), y);
  doc.setFontSize(8);
  doc.setFont(bodyFont, 'normal');
  doc.setTextColor(...TEXT_SECONDARY);
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
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(t('warranty.pdf.sigWarrantor'), 30, y + 20, { align: 'center' });
  doc.text('...................................', 30, y + 22, { align: 'center' });
  doc.text(t('warranty.pdf.sigBeneficiary'), 175, y + 20, { align: 'center' });
  doc.text('...................................', 175, y + 22, { align: 'center' });

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_FOOTER);
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
