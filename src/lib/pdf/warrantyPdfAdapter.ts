/**
 * warrantyPdfAdapter — PDF Platform v2
 *
 * Adapter: ProjectWarranty + kontekst firmy → UnifiedDocumentPayload (schemaVersion: 2).
 *
 * Jest to "most" łączący istniejący model danych gwarancji (ProjectWarranty z bazy)
 * z kanonicznym modelem payload v2 (UnifiedDocumentPayload).
 *
 * ── Jak to działa ──────────────────────────────────────────────────────────────
 *   WarrantySection.tsx (UI)
 *     → buildWarrantyUnifiedPayload()  ← ten moduł
 *     → renderDocumentPdfV2()          ← koordynator v2 (serwer-first)
 *     → Edge Function generate-pdf-v2  ← warrantyRenderer.ts (@react-pdf/renderer)
 *     → fallback jsPDF                 ← warrantyPdfGenerator (jeśli serwer niedostępny)
 *
 * ── Zakres tego pliku ──────────────────────────────────────────────────────────
 *   TYLKO budowanie payloadu. Nie renderuje. Nie wywołuje API.
 *
 * Roadmap: PDF Platform v2 — Warranty Migration.
 */

import type { ProjectWarranty } from '@/hooks/useWarranty';
import type {
  UnifiedDocumentPayload,
  TradeType,
  PlanTier,
} from '@/types/unified-document-payload';

// ── Kontekst wymagany do zbudowania payloadu ──────────────────────────────────

export interface WarrantyPayloadBuildCtx {
  /** Tytuł projektu — wpisany do sekcji obiektu gwarancji */
  projectTitle: string;
  /** Nazwa firmy wystawcy (gwaranta) */
  companyName: string;
  /** Telefon firmy (opcjonalny) */
  companyPhone?: string;
  /** Miasto/adres firmy (opcjonalny) */
  companyCity?: string;
  /** NIP firmy (opcjonalny) */
  companyNip?: string;
  /** REGON firmy (opcjonalny) */
  companyRegon?: string;
  /** KRS firmy (opcjonalny) */
  companyKrs?: string;
  /** Branża wykonawcy — domyślnie 'general' */
  trade?: TradeType;
  /** Poziom planu — domyślnie 'basic' */
  planTier?: PlanTier;
  /** Locale BCP 47 — domyślnie 'pl-PL' */
  locale?: string;
  /** UUID projektu (jeśli znany — nadpisuje warranty.project_id) */
  sourceProjectId?: string;
}

// ── Generowanie ID dokumentu gwarancyjnego ────────────────────────────────────

/**
 * Generuje czytelny identyfikator dokumentu gwarancyjnego.
 * Format: GWR/{rok}/{6-znakowy alfanumeryczny suffix}
 *
 * Analogicznie do identyfikatorów ofert (OF/...).
 * Uwaga: nie jest to UUID — służy tylko do czytelnej identyfikacji w PDF.
 */
function generateWarrantyDocId(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GWR/${year}/${suffix}`;
}

// ── Główny adapter ────────────────────────────────────────────────────────────

/**
 * Buduje UnifiedDocumentPayload (schemaVersion: 2) dla dokumentu gwarancyjnego.
 *
 * @param warranty - dane gwarancji z bazy danych (ProjectWarranty)
 * @param ctx - kontekst budowania (dane firmy, projekt, locale)
 * @returns UnifiedDocumentPayload gotowy do przekazania do renderDocumentPdfV2()
 */
export function buildWarrantyUnifiedPayload(
  warranty: ProjectWarranty,
  ctx: WarrantyPayloadBuildCtx,
): UnifiedDocumentPayload {
  const now = new Date().toISOString();

  return {
    schemaVersion: 2,
    documentType: 'warranty',
    trade: ctx.trade ?? 'general',
    planTier: ctx.planTier ?? 'basic',
    locale: ctx.locale ?? 'pl-PL',
    documentId: generateWarrantyDocId(),
    generatedAt: now,
    issuedAt: now,
    // Gwarancje nie mają daty ważności w modelu payloadu —
    // data zakończenia jest wewnątrz sekcji warranty (endDate)
    validUntil: null,
    sourceProjectId: ctx.sourceProjectId ?? warranty.project_id,
    company: {
      name: ctx.companyName,
      nip: ctx.companyNip,
      regon: ctx.companyRegon,
      krs: ctx.companyKrs,
      phone: ctx.companyPhone,
      city: ctx.companyCity,
    },
    client: warranty.client_name
      ? {
          name: warranty.client_name,
          email: warranty.client_email ?? undefined,
          phone: warranty.contact_phone ?? undefined,
        }
      : null,
    section: {
      type: 'warranty',
      warrantyMonths: warranty.warranty_months,
      startDate: warranty.start_date,
      endDate: warranty.end_date,
      scopeOfWork: warranty.scope_of_work ?? undefined,
      exclusions: warranty.exclusions ?? undefined,
      contactPhone: warranty.contact_phone ?? undefined,
    },
  };
}
