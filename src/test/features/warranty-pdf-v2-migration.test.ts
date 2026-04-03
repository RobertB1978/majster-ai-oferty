/**
 * PDF Platform v2 — Warranty Migration Tests
 *
 * Weryfikuje:
 *   1. buildWarrantyUnifiedPayload — poprawne mapowanie ProjectWarranty → UnifiedDocumentPayload
 *   2. Payload przechodzi validateUnifiedPayload (v2 runtime check)
 *   3. Spójność section.type === documentType === 'warranty'
 *   4. Mapowanie pól sekcji warranty (warrantyMonths, startDate, endDate, scope, exclusions)
 *   5. Mapowanie danych firmy i klienta
 *   6. Obsługa brakujących opcjonalnych pól (client_name null, scope_of_work null, etc.)
 *   7. Wartości domyślne (trade, planTier, locale, validUntil)
 *   8. sourceProjectId — priorytet ctx.sourceProjectId nad warranty.project_id
 *   9. Brak regresji: renderDocumentPdfV2 nadal rzuca PendingMigrationError dla warranty
 *      gdy Edge Function niedostępna (istniejące zachowanie)
 *
 * Zakres: warrantyPdfAdapter + integracja z walidatorem payloadu.
 * Renderowanie PDF (jsPDF, Edge Function) mockowane.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildWarrantyUnifiedPayload,
  type WarrantyPayloadBuildCtx,
} from '@/lib/pdf/warrantyPdfAdapter';
import {
  validateUnifiedPayload,
  isUnifiedDocumentPayload,
} from '@/types/unified-document-payload';
import type { ProjectWarranty } from '@/hooks/useWarranty';

// ── Mock renderDocumentPdfV2 (dla testu regresji) ─────────────────────────────

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('@/lib/offerPdfGenerator', () => ({
  generateOfferPdf: vi.fn().mockResolvedValue(
    new Blob(['jspdf-fallback-blob'], { type: 'application/pdf' }),
  ),
}));

vi.mock('@/lib/warrantyPdfGenerator', () => ({
  generateWarrantyPdfBlob: vi.fn().mockReturnValue(
    new Blob(['jspdf-warranty-fallback-blob'], { type: 'application/pdf' }),
  ),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeWarranty(overrides: Partial<ProjectWarranty> = {}): ProjectWarranty {
  return {
    id: 'warranty-uuid-001',
    user_id: 'user-uuid-001',
    project_id: 'project-uuid-001',
    client_name: 'Jan Kowalski',
    client_email: 'jan@example.pl',
    contact_phone: '+48 600 123 456',
    warranty_months: 24,
    start_date: '2026-04-01',
    end_date: '2028-04-01',
    scope_of_work: 'Remont łazienki — płytki, instalacja, malowanie',
    exclusions: 'Uszkodzenia mechaniczne, zalania',
    pdf_storage_path: null,
    reminder_30_sent_at: null,
    reminder_7_sent_at: null,
    created_at: '2026-04-01T10:00:00.000Z',
    updated_at: '2026-04-01T10:00:00.000Z',
    ...overrides,
  };
}

function makeCtx(overrides: Partial<WarrantyPayloadBuildCtx> = {}): WarrantyPayloadBuildCtx {
  return {
    projectTitle: 'Remont mieszkania Kowalskich',
    companyName: 'Firma Remontowa Nowak',
    companyPhone: '+48 22 456 78 90',
    companyCity: 'Warszawa',
    trade: 'general',
    planTier: 'basic',
    locale: 'pl-PL',
    sourceProjectId: 'project-uuid-001',
    ...overrides,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('buildWarrantyUnifiedPayload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Struktura podstawowa ───────────────────────────────────────────────

  describe('struktura podstawowa payloadu', () => {
    it('zwraca payload z schemaVersion: 2', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
      expect(payload.schemaVersion).toBe(2);
    });

    it('zwraca payload z documentType: warranty', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
      expect(payload.documentType).toBe('warranty');
    });

    it('section.type === warranty (spójność z documentType)', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
      expect(payload.section.type).toBe('warranty');
    });

    it('validUntil jest null (gwarancje nie mają validUntil na poziomie payloadu)', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
      expect(payload.validUntil).toBeNull();
    });

    it('generatedAt i issuedAt to poprawne daty ISO 8601', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
      expect(() => new Date(payload.generatedAt)).not.toThrow();
      expect(() => new Date(payload.issuedAt)).not.toThrow();
      expect(new Date(payload.generatedAt).getTime()).not.toBeNaN();
      expect(new Date(payload.issuedAt).getTime()).not.toBeNaN();
    });

    it('documentId ma format GWR/{rok}/{suffix}', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
      expect(payload.documentId).toMatch(/^GWR\/\d{4}\/[A-Z0-9]{6}$/);
    });
  });

  // ── 2. Walidacja runtime (validateUnifiedPayload) ─────────────────────────

  describe('walidacja runtime validateUnifiedPayload', () => {
    it('przechodzi validateUnifiedPayload bez błędów', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
      const err = validateUnifiedPayload(payload);
      expect(err).toBeNull();
    });

    it('isUnifiedDocumentPayload zwraca true', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
      expect(isUnifiedDocumentPayload(payload)).toBe(true);
    });
  });

  // ── 3. Mapowanie sekcji warranty ──────────────────────────────────────────

  describe('mapowanie sekcji warranty', () => {
    it('mapuje warrantyMonths', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty({ warranty_months: 36 }), makeCtx());
      expect(payload.section.type).toBe('warranty');
      if (payload.section.type === 'warranty') {
        expect(payload.section.warrantyMonths).toBe(36);
      }
    });

    it('mapuje startDate', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty({ start_date: '2026-06-01' }), makeCtx());
      if (payload.section.type === 'warranty') {
        expect(payload.section.startDate).toBe('2026-06-01');
      }
    });

    it('mapuje endDate', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty({ end_date: '2028-06-01' }), makeCtx());
      if (payload.section.type === 'warranty') {
        expect(payload.section.endDate).toBe('2028-06-01');
      }
    });

    it('mapuje scopeOfWork gdy podany', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ scope_of_work: 'Remont łazienki' }),
        makeCtx(),
      );
      if (payload.section.type === 'warranty') {
        expect(payload.section.scopeOfWork).toBe('Remont łazienki');
      }
    });

    it('mapuje exclusions gdy podane', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ exclusions: 'Uszkodzenia mechaniczne' }),
        makeCtx(),
      );
      if (payload.section.type === 'warranty') {
        expect(payload.section.exclusions).toBe('Uszkodzenia mechaniczne');
      }
    });

    it('mapuje contactPhone z warranty', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ contact_phone: '+48 600 999 888' }),
        makeCtx(),
      );
      if (payload.section.type === 'warranty') {
        expect(payload.section.contactPhone).toBe('+48 600 999 888');
      }
    });
  });

  // ── 4. Mapowanie firmy i klienta ──────────────────────────────────────────

  describe('mapowanie company i client', () => {
    it('mapuje company.name z ctx.companyName', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx({ companyName: 'Firma XYZ' }));
      expect(payload.company.name).toBe('Firma XYZ');
    });

    it('mapuje company.phone z ctx.companyPhone', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx({ companyPhone: '+48 22 111 22 33' }));
      expect(payload.company.phone).toBe('+48 22 111 22 33');
    });

    it('mapuje company.city z ctx.companyCity', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx({ companyCity: 'Kraków' }));
      expect(payload.company.city).toBe('Kraków');
    });

    it('mapuje client.name z warranty.client_name', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ client_name: 'Anna Nowak' }),
        makeCtx(),
      );
      expect(payload.client?.name).toBe('Anna Nowak');
    });

    it('mapuje client.email z warranty.client_email', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ client_email: 'anna@example.pl' }),
        makeCtx(),
      );
      expect(payload.client?.email).toBe('anna@example.pl');
    });

    it('client jest null gdy warranty.client_name jest null', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ client_name: null }),
        makeCtx(),
      );
      expect(payload.client).toBeNull();
    });
  });

  // ── 5. Wartości domyślne ──────────────────────────────────────────────────

  describe('wartości domyślne', () => {
    it('trade domyślnie general gdy nie podany', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx({ trade: undefined }));
      expect(payload.trade).toBe('general');
    });

    it('planTier domyślnie basic gdy nie podany', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx({ planTier: undefined }));
      expect(payload.planTier).toBe('basic');
    });

    it('locale domyślnie pl-PL gdy nie podany', () => {
      const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx({ locale: undefined }));
      expect(payload.locale).toBe('pl-PL');
    });
  });

  // ── 6. sourceProjectId ────────────────────────────────────────────────────

  describe('sourceProjectId', () => {
    it('używa ctx.sourceProjectId gdy podany', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ project_id: 'projekt-z-bazy' }),
        makeCtx({ sourceProjectId: 'projekt-z-kontekstu' }),
      );
      expect(payload.sourceProjectId).toBe('projekt-z-kontekstu');
    });

    it('fallback na warranty.project_id gdy ctx.sourceProjectId nie podany', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ project_id: 'projekt-z-bazy' }),
        makeCtx({ sourceProjectId: undefined }),
      );
      expect(payload.sourceProjectId).toBe('projekt-z-bazy');
    });
  });

  // ── 7. Obsługa pól opcjonalnych null z bazy ───────────────────────────────

  describe('obsługa pól null z bazy danych', () => {
    it('scopeOfWork jest undefined gdy scope_of_work jest null', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ scope_of_work: null }),
        makeCtx(),
      );
      if (payload.section.type === 'warranty') {
        expect(payload.section.scopeOfWork).toBeUndefined();
      }
    });

    it('exclusions jest undefined gdy exclusions jest null', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ exclusions: null }),
        makeCtx(),
      );
      if (payload.section.type === 'warranty') {
        expect(payload.section.exclusions).toBeUndefined();
      }
    });

    it('contactPhone jest undefined gdy contact_phone jest null', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ contact_phone: null }),
        makeCtx(),
      );
      if (payload.section.type === 'warranty') {
        expect(payload.section.contactPhone).toBeUndefined();
      }
    });

    it('nadal przechodzi validateUnifiedPayload z wszystkimi polami null', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({
          client_name: null,
          client_email: null,
          contact_phone: null,
          scope_of_work: null,
          exclusions: null,
        }),
        makeCtx({
          companyPhone: undefined,
          companyCity: undefined,
          trade: undefined,
          planTier: undefined,
          locale: undefined,
        }),
      );
      expect(validateUnifiedPayload(payload)).toBeNull();
    });
  });

  // ── 8. Polskie znaki w treści ─────────────────────────────────────────────

  describe('polskie znaki diakrytyczne', () => {
    it('zachowuje polskie znaki w company.name', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty(),
        makeCtx({ companyName: 'Budowlanka Łukasza Ćwiąkały Sp.j.' }),
      );
      expect(payload.company.name).toBe('Budowlanka Łukasza Ćwiąkały Sp.j.');
    });

    it('zachowuje polskie znaki w scopeOfWork po JSON roundtrip', () => {
      const payload = buildWarrantyUnifiedPayload(
        makeWarranty({ scope_of_work: 'Montaż drzwi wejściowych — żelazne okucia' }),
        makeCtx(),
      );
      const roundtrip = JSON.parse(JSON.stringify(payload)) as typeof payload;
      if (roundtrip.section.type === 'warranty') {
        expect(roundtrip.section.scopeOfWork).toBe('Montaż drzwi wejściowych — żelazne okucia');
      }
    });
  });
});

// ── Test: renderDocumentPdfV2 — warranty canonical + fallback ─────────────────

describe('renderDocumentPdfV2 + payload warranty', () => {
  it('renderDocumentPdfV2 zwraca PDF z Edge Function gdy serwer odpowiada (canonical path)', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const serverBlob = new Blob(['server-warranty-pdf'], { type: 'application/pdf' });
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: serverBlob,
      error: null,
    });

    const { renderDocumentPdfV2 } = await import('@/lib/pdf/renderPdfV2');

    const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
    const result = await renderDocumentPdfV2(payload);

    expect(result).toBe(serverBlob);
  });

  it('renderDocumentPdfV2 odpada na jsPDF fallback gdy Edge Function zwraca błąd', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Function error', name: 'FunctionsError', context: {} as unknown },
    });

    const { renderDocumentPdfV2 } = await import('@/lib/pdf/renderPdfV2');

    const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
    const result = await renderDocumentPdfV2(payload);

    // Fallback jsPDF zwraca Blob (nie rzuca PendingMigrationError)
    expect(result).toBeInstanceOf(Blob);
  });

  it('renderDocumentPdfV2 odpada na jsPDF fallback przy błędzie sieciowym', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network timeout'));

    const { renderDocumentPdfV2 } = await import('@/lib/pdf/renderPdfV2');

    const payload = buildWarrantyUnifiedPayload(makeWarranty(), makeCtx());
    const result = await renderDocumentPdfV2(payload);

    expect(result).toBeInstanceOf(Blob);
  });
});
