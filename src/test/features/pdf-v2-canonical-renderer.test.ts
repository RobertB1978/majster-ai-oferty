/**
 * PDF Platform v2 — Canonical Renderer Tests
 *
 * Weryfikuje:
 *   1. renderDocumentPdfV2 — wybór ścieżki renderowania (server vs fallback)
 *   2. callGeneratePdfV2 — obsługa odpowiedzi Edge Function (Blob, ArrayBuffer, error)
 *   3. PendingMigrationError — poprawne rzucanie dla typów bez fallbacku
 *   4. offerClientFallback — wywołanie jsPDF gdy Edge Function zawiedzie
 *   5. Brak regresji: oryginalna ścieżka v1 (generateOfferPdfWithServer) działa niezależnie
 *   6. adaptToOfferPdfPayload — poprawne mapowanie UnifiedDocumentPayload → OfferPdfPayload
 *   7. Typy oczekujące migracji (warranty, protocol, contract, inspection)
 *
 * Zakres: wyłącznie logika koordynatora i wybór ścieżki.
 * Renderowanie PDF (jsPDF, @react-pdf/renderer) mockowane.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UnifiedDocumentPayload, DocumentType } from '@/types/unified-document-payload';

// ── Mocki ──────────────────────────────────────────────────────────────────────

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

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Import po mockach ─────────────────────────────────────────────────────────

import { renderDocumentPdfV2, PendingMigrationError } from '@/lib/pdf/renderPdfV2';
import { supabase } from '@/integrations/supabase/client';
import { generateOfferPdf } from '@/lib/offerPdfGenerator';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeOfferPayload(
  overrides: Partial<UnifiedDocumentPayload> = {},
): UnifiedDocumentPayload {
  return {
    schemaVersion: 2,
    documentType: 'offer',
    trade: 'tiling',
    planTier: 'pro',
    locale: 'pl-PL',
    documentId: 'OF/2026/A1B2C3',
    generatedAt: '2026-04-01T10:00:00.000Z',
    issuedAt: '2026-04-01T09:00:00.000Z',
    validUntil: '2026-05-01T09:00:00.000Z',
    company: {
      name: 'Firma Kafelkarska Sp. z o.o.',
      nip: '1234567890',
      phone: '+48 22 123 45 67',
    },
    client: {
      name: 'Jan Kowalski',
      email: 'jan@example.pl',
    },
    section: {
      type: 'offer',
      quote: {
        positions: [
          { id: 'p1', name: 'Płytki ceramiczne', qty: 10, unit: 'm²', price: 85, category: 'Materiał' },
        ],
        summaryMaterials: 850,
        summaryLabor: 1200,
        marginPercent: 10,
        total: 2255,
        vatRate: 23,
        isVatExempt: false,
        netTotal: 2050,
        vatAmount: 472,
        grossTotal: 2522,
      },
      pdfConfig: {
        title: 'Oferta na remont łazienki',
        offerText: 'Szanowni Państwo,',
        terms: '50% zaliczka',
        deadlineText: '3 tygodnie',
      },
      acceptanceUrl: 'https://app.majster.ai/a/token-xyz',
    },
    ...overrides,
  };
}

function makeWarrantyPayload(): UnifiedDocumentPayload {
  return {
    schemaVersion: 2,
    documentType: 'warranty',
    trade: 'general',
    planTier: 'basic',
    locale: 'pl-PL',
    documentId: 'GWR/2026/ABCD01',
    generatedAt: '2026-04-01T10:00:00.000Z',
    issuedAt: '2026-04-01T09:00:00.000Z',
    validUntil: null,
    company: { name: 'Firma Remontowa XYZ' },
    client: { name: 'Anna Nowak' },
    section: {
      type: 'warranty',
      warrantyMonths: 24,
      startDate: '2026-04-01T00:00:00.000Z',
      endDate: '2028-04-01T00:00:00.000Z',
    },
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('PDF Platform v2 — renderDocumentPdfV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Ścieżka kanoniczna (serwer-first) ──────────────────────────────────

  describe('ścieżka kanoniczna — Edge Function v2', () => {
    it('zwraca PDF z Edge Function gdy wywołanie się powiodło (Blob)', async () => {
      const serverBlob = new Blob(['server-v2-pdf'], { type: 'application/pdf' });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: serverBlob,
        error: null,
      });

      const result = await renderDocumentPdfV2(makeOfferPayload());

      expect(result).toBe(serverBlob);
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'generate-pdf-v2',
        { body: expect.objectContaining({ schemaVersion: 2, documentType: 'offer' }) },
      );
      expect(generateOfferPdf).not.toHaveBeenCalled();
    });

    it('zwraca PDF z Edge Function gdy odpowiedź to ArrayBuffer', async () => {
      const buffer = new ArrayBuffer(20);
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: buffer,
        error: null,
      });

      const result = await renderDocumentPdfV2(makeOfferPayload());

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
      expect(generateOfferPdf).not.toHaveBeenCalled();
    });
  });

  // ── 2. Fallback jsPDF dla oferty ──────────────────────────────────────────

  describe('fallback jsPDF — oferta', () => {
    it('odpada na jsPDF gdy Edge Function zwraca błąd (offer)', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Function not found', name: 'FunctionsError', context: {} as unknown },
      });

      const result = await renderDocumentPdfV2(makeOfferPayload());

      expect(result).toBeInstanceOf(Blob);
      expect(generateOfferPdf).toHaveBeenCalledTimes(1);
    });

    it('odpada na jsPDF gdy Edge Function rzuca wyjątek sieci (offer)', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network timeout'));

      const result = await renderDocumentPdfV2(makeOfferPayload());

      expect(result).toBeInstanceOf(Blob);
      expect(generateOfferPdf).toHaveBeenCalledTimes(1);
    });

    it('fallback jsPDF otrzymuje poprawnie zmapowany OfferPdfPayload', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('offline'));

      const payload = makeOfferPayload({
        company: { name: 'Glazurnik Nowak', nip: '9991112222' },
        sourceProjectId: 'proj-abc-123',
      });

      await renderDocumentPdfV2(payload);

      const calledWith = vi.mocked(generateOfferPdf).mock.calls[0][0];
      expect(calledWith.company.name).toBe('Glazurnik Nowak');
      expect(calledWith.company.nip).toBe('9991112222');
      expect(calledWith.projectId).toBe('proj-abc-123');
      expect(calledWith.generatedAt).toBeInstanceOf(Date);
      expect(calledWith.issuedAt).toBeInstanceOf(Date);
      expect(calledWith.validUntil).toBeInstanceOf(Date);
    });

    it('fallback jsPDF używa documentId gdy sourceProjectId brak', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('offline'));

      const payload = makeOfferPayload({ sourceProjectId: undefined });

      await renderDocumentPdfV2(payload);

      const calledWith = vi.mocked(generateOfferPdf).mock.calls[0][0];
      expect(calledWith.projectId).toBe('OF/2026/A1B2C3');
    });

    it('fallback jsPDF mapuje planTier pro → version premium', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('offline'));

      await renderDocumentPdfV2(makeOfferPayload({ planTier: 'pro' }));

      const calledWith = vi.mocked(generateOfferPdf).mock.calls[0][0];
      expect(calledWith.pdfConfig.version).toBe('premium');
    });

    it('fallback jsPDF mapuje planTier free → version standard', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('offline'));

      await renderDocumentPdfV2(makeOfferPayload({ planTier: 'free' }));

      const calledWith = vi.mocked(generateOfferPdf).mock.calls[0][0];
      expect(calledWith.pdfConfig.version).toBe('standard');
    });

    it('fallback jsPDF obsługuje validUntil: null (używa issuedAt jako fallback)', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('offline'));

      await renderDocumentPdfV2(makeOfferPayload({ validUntil: null }));

      const calledWith = vi.mocked(generateOfferPdf).mock.calls[0][0];
      expect(calledWith.validUntil).toBeInstanceOf(Date);
      // validUntil musi być datą (nie null)
      expect(isNaN(calledWith.validUntil.getTime())).toBe(false);
    });

    it('fallback jsPDF poprawnie mapuje pozycje wyceny', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('offline'));

      await renderDocumentPdfV2(makeOfferPayload());

      const calledWith = vi.mocked(generateOfferPdf).mock.calls[0][0];
      expect(calledWith.quote?.positions).toHaveLength(1);
      expect(calledWith.quote?.positions[0].name).toBe('Płytki ceramiczne');
      expect(calledWith.quote?.positions[0].category).toBe('Materiał');
    });
  });

  // ── 3. PendingMigrationError dla typów bez fallbacku ─────────────────────

  describe('PendingMigrationError — typy oczekujące migracji', () => {
    const pendingTypes: DocumentType[] = ['warranty', 'protocol', 'contract', 'inspection'];

    it.each(pendingTypes)(
      'rzuca PendingMigrationError dla documentType: %s gdy Edge Function zwraca błąd',
      async (docType) => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: null,
          error: { message: 'Function error', name: 'FunctionsError', context: {} as unknown },
        });

        // Budujemy payload z odpowiednią sekcją
        const sectionMap: Record<string, unknown> = {
          warranty: { type: 'warranty', warrantyMonths: 12, startDate: '2026-01-01T00:00:00.000Z', endDate: '2027-01-01T00:00:00.000Z' },
          protocol: { type: 'protocol' },
          contract: { type: 'contract', subject: 'Remont', value: 5000, vatRate: 23, startDate: '2026-01-01T00:00:00.000Z' },
          inspection: { type: 'inspection' },
        };

        const payload: UnifiedDocumentPayload = {
          schemaVersion: 2,
          documentType: docType,
          trade: 'general',
          planTier: 'basic',
          locale: 'pl-PL',
          documentId: `DOC/2026/TEST`,
          generatedAt: '2026-04-01T10:00:00.000Z',
          issuedAt: '2026-04-01T09:00:00.000Z',
          validUntil: null,
          company: { name: 'Test Firma' },
          client: null,
          section: sectionMap[docType] as UnifiedDocumentPayload['section'],
        };

        await expect(renderDocumentPdfV2(payload)).rejects.toThrow(PendingMigrationError);
        expect(generateOfferPdf).not.toHaveBeenCalled();
      },
    );

    it('PendingMigrationError zawiera poprawny documentType', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'error', name: 'FunctionsError', context: {} as unknown },
      });

      try {
        await renderDocumentPdfV2(makeWarrantyPayload());
        expect.fail('Powinien rzucić PendingMigrationError');
      } catch (err) {
        expect(err).toBeInstanceOf(PendingMigrationError);
        expect((err as PendingMigrationError).documentType).toBe('warranty');
      }
    });

    it('PendingMigrationError ma poprawną nazwę (dla instanceof check)', () => {
      const err = new PendingMigrationError('warranty');
      expect(err.name).toBe('PendingMigrationError');
      expect(err.message).toContain('warranty');
      expect(err.message).toContain('warrantyPdfGenerator');
    });
  });

  // ── 4. pendingMigration response z Edge Function (501) ────────────────────

  describe('obsługa odpowiedzi pendingMigration (501) z Edge Function', () => {
    it('rzuca PendingMigrationError gdy Edge Function zwraca pendingMigration dla warranty', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          pendingMigration: true,
          documentType: 'warranty',
          error: "documentType 'warranty' oczekuje na migrację",
        },
        error: { message: 'Function returned error', name: 'FunctionsError', context: {} as unknown },
      });

      await expect(renderDocumentPdfV2(makeWarrantyPayload())).rejects.toThrow(
        PendingMigrationError,
      );
    });
  });

  // ── 5. Brak regresji — ścieżka v1 (generateOfferPdfWithServer) ────────────

  describe('brak regresji — ścieżka legacy v1', () => {
    it('generateOfferPdfWithServer działa niezależnie od renderDocumentPdfV2', async () => {
      // Weryfikujemy że moduł v1 jest dostępny i nie jest nadpisany przez v2
      const { generateOfferPdfWithServer } = await import('@/lib/generateServerPdf');
      expect(typeof generateOfferPdfWithServer).toBe('function');
    });
  });

  // ── 6. Wywołanie Edge Function z poprawnym documentType ───────────────────

  describe('poprawne wywołanie Edge Function', () => {
    it('wysyła payload z schemaVersion: 2 do generate-pdf-v2', async () => {
      const serverBlob = new Blob(['v2-pdf'], { type: 'application/pdf' });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: serverBlob,
        error: null,
      });

      await renderDocumentPdfV2(makeOfferPayload());

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'generate-pdf-v2',
        expect.objectContaining({
          body: expect.objectContaining({
            schemaVersion: 2,
            documentType: 'offer',
            trade: 'tiling',
            planTier: 'pro',
          }),
        }),
      );
    });

    it('wysyła polskie znaki niezniszczone w payloadzie', async () => {
      const serverBlob = new Blob(['pdf'], { type: 'application/pdf' });
      vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: serverBlob, error: null });

      const polishName = 'Firma Budowlana Łukasz Ćwiąkała';
      await renderDocumentPdfV2(makeOfferPayload({
        company: { name: polishName },
      }));

      const calledPayload = vi.mocked(supabase.functions.invoke).mock.calls[0][1]?.body as UnifiedDocumentPayload;
      expect(calledPayload.company.name).toBe(polishName);
    });
  });
});
