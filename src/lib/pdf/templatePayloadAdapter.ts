/**
 * templatePayloadAdapter — PDF Platform v2
 *
 * Adapter: TemplatePdfInput (DocumentTemplate + formData + autofillContext)
 *          → UnifiedDocumentPayload (schemaVersion: 2)
 *
 * Jest to "most" łączący system szablonów dokumentów (protokoły, umowy, inspekcje)
 * z kanonicznym modelem payload v2 (UnifiedDocumentPayload).
 *
 * ── Jak to działa ──────────────────────────────────────────────────────────────
 *   TemplateEditor.tsx (UI)
 *     → buildTemplatePayload()      ← ten moduł
 *     → renderDocumentPdfV2()       ← koordynator v2 (próbuje Edge Function)
 *     → PendingMigrationError (501) ← Edge Function jeszcze nie obsługuje protocol/inspection/contract
 *     → TemplateEditor catch        ← fallback na generateTemplatePdf (jsPDF)
 *
 * Gdy Edge Function 'generate-pdf-v2' zostanie rozszerzona o obsługę
 * 'protocol', 'inspection', 'contract', TemplateEditor automatycznie
 * zacznie korzystać z renderowania serwerowego — bez zmian w logice UI.
 *
 * ── Mapowanie kategorii → documentType ────────────────────────────────────────
 *   PROTOCOLS  → 'protocol'
 *   COMPLIANCE → 'inspection'
 *   CONTRACTS  → 'contract'
 *   ANNEXES    → 'contract'
 *   OTHER      → 'contract'
 *
 * ── Nota o sekcjach v2 ────────────────────────────────────────────────────────
 * Sekcje UnifiedDocumentPayload (ProtocolDocumentSection, InspectionDocumentSection,
 * ContractDocumentSection) zawierają wybrane pola z formData — mapowanie
 * jest addytywne. Faktyczne renderowanie PDF nadal odbywa się przez
 * generateTemplatePdf (jsPDF) dopóki Edge Function nie implementuje tych typów.
 * Sekcja v2 przygotowuje infrastrukturę dla przyszłego renderowania serwerowego.
 *
 * ── Zakres tego pliku ──────────────────────────────────────────────────────────
 *   TYLKO budowanie payloadu. Nie renderuje. Nie wywołuje API.
 *
 * Roadmap: PDF Platform v2 — Template Migration.
 */

import type { TemplatePdfInput } from '@/lib/templatePdfGenerator';
import type {
  UnifiedDocumentPayload,
  DocumentType,
  TradeType,
  PlanTier,
  UnifiedCompanyInfo,
  UnifiedClientInfo,
  ProtocolDocumentSection,
  InspectionDocumentSection,
  ContractDocumentSection,
  DocumentSection,
} from '@/types/unified-document-payload';
import type { TemplateCategory } from '@/data/documentTemplates';

// ── Mapowanie kategorii szablonu → documentType v2 ────────────────────────────

/**
 * Mapuje kategorię szablonu dokumentu na documentType v2.
 *
 * PROTOCOLS  → 'protocol'   (protokoły odbioru, przekazania, itp.)
 * COMPLIANCE → 'inspection' (przeglądy techniczne, inspekcje)
 * CONTRACTS  → 'contract'   (umowy o dzieło, zlecenia, itp.)
 * ANNEXES    → 'contract'   (załączniki do umów)
 * OTHER      → 'contract'   (bezpieczny fallback — najszerszy typ)
 */
export function categoryToDocumentType(category: TemplateCategory): DocumentType {
  switch (category) {
    case 'PROTOCOLS':   return 'protocol';
    case 'COMPLIANCE':  return 'inspection';
    case 'CONTRACTS':
    case 'ANNEXES':
    case 'OTHER':
    default:            return 'contract';
  }
}

// ── Generowanie ID dokumentu szablonowego ─────────────────────────────────────

/**
 * Generuje czytelny identyfikator dokumentu z klucza szablonu.
 * Format: {PREFIX}/{rok}/{6-znakowy suffix alfanumeryczny}
 *
 * Analogicznie do identyfikatorów ofert (OF/...) i gwarancji (GWR/...).
 */
function generateTemplateDocId(templateKey: string): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const prefix = templateKey.slice(0, 4).toUpperCase().replace(/_/g, '');
  return `${prefix}/${year}/${suffix}`;
}

// ── Konwersja locale ──────────────────────────────────────────────────────────

function toLocale(short: 'pl' | 'en' | 'uk'): string {
  switch (short) {
    case 'pl': return 'pl-PL';
    case 'en': return 'en-GB';
    case 'uk': return 'uk-UA';
  }
}

// ── Mapowanie danych firmy ────────────────────────────────────────────────────

function buildCompanyInfo(
  ctx: TemplatePdfInput['autofillContext'],
): UnifiedCompanyInfo {
  return {
    name: ctx.company?.name ?? 'Nieznana firma',
    nip: ctx.company?.nip ?? undefined,
    // AutofillContext przechowuje adres jako jeden string (ulica+kod+miasto)
    // UnifiedCompanyInfo.street to najbliższe semantycznie pole
    street: ctx.company?.address ?? undefined,
    phone: ctx.company?.phone ?? undefined,
    email: ctx.company?.email ?? undefined,
  };
}

// ── Mapowanie danych klienta ──────────────────────────────────────────────────

function buildClientInfo(
  ctx: TemplatePdfInput['autofillContext'],
): UnifiedClientInfo | null {
  if (!ctx.client?.name) return null;
  return {
    name: ctx.client.name,
    email: ctx.client.email ?? undefined,
    address: ctx.client.address ?? undefined,
    phone: ctx.client.phone ?? undefined,
  };
}

// ── Budowanie sekcji per documentType ────────────────────────────────────────

/**
 * Buduje ProtocolDocumentSection z formData.
 *
 * Mapowane pola (spójne z kluczami pól w documentTemplates.ts):
 *   receptionDate: acceptance_date | work_end_date | contract_date
 *   notes:         additional_notes
 */
function buildProtocolSection(data: Record<string, string>): ProtocolDocumentSection {
  return {
    type: 'protocol',
    receptionDate:
      data['acceptance_date'] ??
      data['work_end_date'] ??
      data['contract_date'] ??
      undefined,
    notes: data['additional_notes'] ?? undefined,
  };
}

/**
 * Buduje InspectionDocumentSection z formData.
 *
 * Mapowane pola (spójne z kluczami pól w documentTemplates.ts):
 *   findings:        findings
 *   recommendations: recommended_actions
 */
function buildInspectionSection(data: Record<string, string>): InspectionDocumentSection {
  return {
    type: 'inspection',
    findings: data['findings'] ?? undefined,
    recommendations: data['recommended_actions'] ?? undefined,
  };
}

/**
 * Buduje ContractDocumentSection z formData.
 *
 * Mapowane pola (spójne z kluczami pól w documentTemplates.ts):
 *   subject:      scope_description | project_title
 *   value:        net_amount | total_amount (parsowane jako float)
 *   startDate:    start_date | contract_date
 *   endDate:      end_date
 *   paymentTerms: payment_terms
 */
function buildContractSection(data: Record<string, string>): ContractDocumentSection {
  const rawValue = data['net_amount'] ?? data['total_amount'];
  const parsedValue = rawValue ? parseFloat(rawValue) : 0;

  return {
    type: 'contract',
    subject: data['scope_description'] ?? data['project_title'] ?? '',
    value: !isNaN(parsedValue) ? parsedValue : 0,
    vatRate: null,
    startDate:
      data['start_date'] ??
      data['contract_date'] ??
      new Date().toISOString().slice(0, 10),
    endDate: data['end_date'] ?? undefined,
    paymentTerms: data['payment_terms'] ?? undefined,
  };
}

function buildSection(
  documentType: DocumentType,
  data: Record<string, string>,
): DocumentSection {
  switch (documentType) {
    case 'protocol':   return buildProtocolSection(data);
    case 'inspection': return buildInspectionSection(data);
    case 'contract':   return buildContractSection(data);
    // Typy 'offer' i 'warranty' nie mogą trafić tutaj przez mapowanie kategorii
    default:           return buildContractSection(data);
  }
}

// ── Główny adapter ────────────────────────────────────────────────────────────

export interface TemplatePdfAdapterOpts {
  /** Branża wykonawcy — domyślnie 'general' */
  trade?: TradeType;
  /** Poziom planu — domyślnie 'basic' */
  planTier?: PlanTier;
}

/**
 * Buduje UnifiedDocumentPayload (schemaVersion: 2) z danych szablonu dokumentu.
 *
 * @param input   - dane wejściowe (DocumentTemplate + formData + autofillContext)
 * @param opts    - opcjonalne: trade, planTier (z domyślnymi wartościami)
 * @returns UnifiedDocumentPayload gotowy do przekazania do renderDocumentPdfV2()
 *
 * Uwaga: funkcja `t` (tłumaczenia) w TemplatePdfInput jest ignorowana —
 * payload v2 nie zawiera przetłumaczonych etykiet; renderowanie w jsPDF
 * obsługuje tłumaczenia bezpośrednio w generateTemplatePdf().
 */
export function buildTemplatePayload(
  input: TemplatePdfInput,
  opts: TemplatePdfAdapterOpts = {},
): UnifiedDocumentPayload {
  const { template, data, autofillContext, locale } = input;
  const documentType = categoryToDocumentType(template.category);
  const now = new Date().toISOString();

  return {
    schemaVersion: 2,
    documentType,
    trade: opts.trade ?? 'general',
    planTier: opts.planTier ?? 'basic',
    locale: toLocale(locale),
    documentId: generateTemplateDocId(template.key),
    generatedAt: now,
    issuedAt: now,
    validUntil: null,
    company: buildCompanyInfo(autofillContext),
    client: buildClientInfo(autofillContext),
    section: buildSection(documentType, data),
  };
}
