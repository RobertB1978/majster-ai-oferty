/**
 * PDF Platform v2 Foundation — Testy fundacyjne.
 *
 * Weryfikuje:
 *   1. Struktura UnifiedDocumentPayload v2 — wszystkie wymagane pola
 *   2. Walidator validateUnifiedPayload — poprawne pola, błędne pola
 *   3. Słowniki typów: DocumentType, TradeType, PlanTier
 *   4. Spójność metadanych: documentType == section.type
 *   5. Zachowanie polskich znaków diakrytycznych w treści payloadu
 *      (serializacja/deserializacja JSON — weryfikacja roundtrip)
 *   6. Type guard isUnifiedDocumentPayload
 *   7. Wsteczna zgodność: OfferPDFPayload schemaVersion: 1 nie jest v2
 *
 * Zakres: wyłącznie typy i walidacja runtime.
 * Renderowanie PDF (Edge Function) testowane end-to-end osobno.
 */

import { describe, it, expect } from 'vitest';
import {
  validateUnifiedPayload,
  isUnifiedDocumentPayload,
} from '@/types/unified-document-payload';
import type {
  UnifiedDocumentPayload,
  DocumentType,
  TradeType,
  PlanTier,
  OfferDocumentSection,
  WarrantyDocumentSection,
  ProtocolDocumentSection,
} from '@/types/unified-document-payload';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeOfferSection(): OfferDocumentSection {
  return {
    type: 'offer',
    quote: {
      positions: [
        {
          id: 'p1',
          name: 'Płytki ceramiczne łazienkowe',
          qty: 20,
          unit: 'm²',
          price: 85,
          category: 'Materiał',
        },
        {
          id: 'p2',
          name: 'Układanie płytek — robocizna',
          qty: 20,
          unit: 'm²',
          price: 120,
          category: 'Robocizna',
        },
      ],
      summaryMaterials: 1700,
      summaryLabor: 2400,
      marginPercent: 10,
      total: 4510,
      vatRate: 23,
      isVatExempt: false,
      netTotal: 4100,
      vatAmount: 943,
      grossTotal: 5043,
    },
    pdfConfig: {
      title: 'Oferta na remont łazienki',
      offerText: 'Szanowni Państwo, z przyjemnością przedstawiamy ofertę.',
      terms: 'Warunki płatności: 50% zaliczka przed rozpoczęciem prac.',
      deadlineText: '3 tygodnie od akceptacji',
    },
    acceptanceUrl: 'https://app.majster.ai/a/token-xyz',
  };
}

function makeWarrantySection(): WarrantyDocumentSection {
  return {
    type: 'warranty',
    warrantyMonths: 24,
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2028-04-01T00:00:00.000Z',
    scopeOfWork: 'Remont łazienki — ułożenie płytek, instalacja armatury.',
    exclusions: 'Uszkodzenia mechaniczne, zalanie wodą.',
    contactPhone: '+48 600 123 456',
  };
}

function makeMinimalPayload(
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
      street: 'ul. Budowlana 12',
      postalCode: '00-001',
      city: 'Warszawa',
      phone: '+48 22 123 45 67',
      email: 'biuro@kafelki.pl',
    },
    client: {
      name: 'Jan Kowalski',
      email: 'jan.kowalski@example.pl',
      address: 'ul. Klienta 3, 00-002 Warszawa',
      phone: '+48 500 200 300',
    },
    section: makeOfferSection(),
    ...overrides,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('PDF Platform v2 Foundation — UnifiedDocumentPayload', () => {

  // ── 1. Struktura i wymagane pola ──────────────────────────────────────────

  describe('struktura payloadu', () => {
    it('poprawny payload zwraca null z validateUnifiedPayload', () => {
      const payload = makeMinimalPayload();
      expect(validateUnifiedPayload(payload)).toBeNull();
    });

    it('schemaVersion musi być 2', () => {
      const result = validateUnifiedPayload({ ...makeMinimalPayload(), schemaVersion: 1 });
      expect(result).toContain('schemaVersion');
      expect(result).toContain('2');
    });

    it('documentType jest wymaganym polem', () => {
      const payload = makeMinimalPayload();
      const { documentType: _, ...withoutDocType } = payload;
      expect(validateUnifiedPayload(withoutDocType)).toContain('documentType');
    });

    it('trade jest wymaganym polem', () => {
      const payload = makeMinimalPayload();
      const { trade: _, ...withoutTrade } = payload;
      expect(validateUnifiedPayload(withoutTrade)).toContain('trade');
    });

    it('planTier jest wymaganym polem', () => {
      const payload = makeMinimalPayload();
      const { planTier: _, ...withoutPlanTier } = payload;
      expect(validateUnifiedPayload(withoutPlanTier)).toContain('planTier');
    });

    it('locale jest wymaganym polem', () => {
      const payload = makeMinimalPayload();
      const { locale: _, ...withoutLocale } = payload;
      expect(validateUnifiedPayload(withoutLocale)).toContain('locale');
    });

    it('documentId jest wymaganym polem', () => {
      const payload = makeMinimalPayload();
      const { documentId: _, ...withoutDocId } = payload;
      expect(validateUnifiedPayload(withoutDocId)).toContain('documentId');
    });

    it('issuedAt jest wymaganym polem', () => {
      const payload = makeMinimalPayload();
      const { issuedAt: _, ...withoutIssuedAt } = payload;
      expect(validateUnifiedPayload(withoutIssuedAt)).toContain('issuedAt');
    });

    it('validUntil może być null (dokumenty bez daty ważności)', () => {
      const payload = makeMinimalPayload({ validUntil: null });
      expect(validateUnifiedPayload(payload)).toBeNull();
    });

    it('company.name jest wymaganym polem', () => {
      const payload = makeMinimalPayload({
        company: { name: '' } as UnifiedDocumentPayload['company'],
      });
      expect(validateUnifiedPayload(payload)).toContain('company.name');
    });
  });

  // ── 2. Walidacja słowników ────────────────────────────────────────────────

  describe('walidacja documentType', () => {
    const validTypes: DocumentType[] = ['offer', 'contract', 'protocol', 'warranty', 'inspection'];

    it.each(validTypes)('akceptuje documentType: %s', (docType) => {
      const section = docType === 'offer'
        ? makeOfferSection()
        : docType === 'warranty'
        ? makeWarrantySection()
        : docType === 'protocol'
        ? { type: 'protocol' as const }
        : docType === 'contract'
        ? {
            type: 'contract' as const,
            subject: 'Remont',
            value: 10000,
            vatRate: 23,
            startDate: '2026-04-01T00:00:00.000Z',
          }
        : { type: 'inspection' as const };

      const payload = makeMinimalPayload({
        documentType: docType,
        section,
      });
      expect(validateUnifiedPayload(payload)).toBeNull();
    });

    it('odrzuca nieznany documentType', () => {
      const result = validateUnifiedPayload({
        ...makeMinimalPayload(),
        documentType: 'invoice' as DocumentType,
        section: { type: 'invoice' },
      });
      expect(result).toContain('documentType');
    });
  });

  describe('walidacja trade', () => {
    const validTrades: TradeType[] = [
      'general', 'electrical', 'plumbing', 'tiling',
      'painting', 'carpentry', 'roofing', 'hvac', 'masonry', 'flooring',
    ];

    it.each(validTrades)('akceptuje trade: %s', (trade) => {
      const payload = makeMinimalPayload({ trade });
      expect(validateUnifiedPayload(payload)).toBeNull();
    });

    it('odrzuca nieznany trade', () => {
      const result = validateUnifiedPayload({
        ...makeMinimalPayload(),
        trade: 'unknown_trade' as TradeType,
      });
      expect(result).toContain('trade');
    });
  });

  describe('walidacja planTier', () => {
    const validTiers: PlanTier[] = ['free', 'basic', 'pro', 'enterprise'];

    it.each(validTiers)('akceptuje planTier: %s', (planTier) => {
      const payload = makeMinimalPayload({ planTier });
      expect(validateUnifiedPayload(payload)).toBeNull();
    });

    it('odrzuca nieznany planTier', () => {
      const result = validateUnifiedPayload({
        ...makeMinimalPayload(),
        planTier: 'gold' as PlanTier,
      });
      expect(result).toContain('planTier');
    });
  });

  // ── 3. Spójność documentType ↔ section.type ──────────────────────────────

  describe('spójność documentType i section.type', () => {
    it('odrzuca gdy section.type != documentType', () => {
      const payload = makeMinimalPayload({
        documentType: 'warranty',
        section: makeOfferSection(), // section.type = 'offer' ≠ 'warranty'
      });
      expect(validateUnifiedPayload(payload)).toContain('section.type');
    });

    it('akceptuje gdy section.type == documentType', () => {
      const payload = makeMinimalPayload({
        documentType: 'warranty',
        section: makeWarrantySection(),
      });
      expect(validateUnifiedPayload(payload)).toBeNull();
    });
  });

  // ── 4. Polskie znaki diakrytyczne — roundtrip JSON ───────────────────────
  //
  // Weryfikuje że polskie znaki NIE są gubione podczas serializacji
  // JSON (JSON.stringify / JSON.parse). To jest warunek konieczny
  // dla przyszłego renderowania przez Edge Function.
  // Właściwe renderowanie PDF weryfikowane jest w testach e2e Edge Function.

  describe('polskie znaki diakrytyczne — roundtrip JSON', () => {
    const POLISH_STRINGS = [
      'Firma Budowlana Łukasz Ćwiąkała',
      'ul. Ogródkowa 3, Łódź',
      'ą ć ę ł ń ó ś ź ż — ĄĆĘŁŃÓŚŹŻ',
      'Płytki ceramiczne łazienkowe z fugą epoksydową',
      'Remont łazienki — wykonanie tynków wapiennych',
      'Jan Kowalski — właściciel nieruchomości',
    ];

    it.each(POLISH_STRINGS)(
      'zachowuje polskie znaki po roundtrip JSON: "%s"',
      (polishText) => {
        const payload = makeMinimalPayload({
          company: {
            name: polishText,
            nip: '1234567890',
          },
        });

        const serialized = JSON.stringify(payload);
        const deserialized = JSON.parse(serialized) as UnifiedDocumentPayload;

        // Znaki muszą przeżyć roundtrip bez modyfikacji
        expect(deserialized.company.name).toBe(polishText);
      },
    );

    it('zachowuje polskie znaki w pozycjach wyceny po roundtrip JSON', () => {
      const positionName = 'Układanie glazury — płytki gresowe 60×60 cm';
      const section = makeOfferSection();
      section.quote!.positions[0].name = positionName;

      const withSection = makeMinimalPayload({ section });
      const serialized = JSON.stringify(withSection);
      const deserialized = JSON.parse(serialized) as UnifiedDocumentPayload;

      const offerSection = deserialized.section as OfferDocumentSection;
      expect(offerSection.quote!.positions[0].name).toBe(positionName);
    });

    it('zachowuje polskie znaki w zakresie prac gwarancji po roundtrip JSON', () => {
      const scopeText = 'Gwarancja obejmuje: ułożenie płytek, fugi, uszczelnienia przy wanienię.';
      const warrantySection = makeWarrantySection();
      warrantySection.scopeOfWork = scopeText;

      const payload = makeMinimalPayload({
        documentType: 'warranty',
        section: warrantySection,
      });

      const serialized = JSON.stringify(payload);
      const deserialized = JSON.parse(serialized) as UnifiedDocumentPayload;

      const ws = deserialized.section as WarrantyDocumentSection;
      expect(ws.scopeOfWork).toBe(scopeText);
    });
  });

  // ── 5. Type guard isUnifiedDocumentPayload ───────────────────────────────

  describe('isUnifiedDocumentPayload', () => {
    it('zwraca true dla poprawnego payloadu v2', () => {
      expect(isUnifiedDocumentPayload(makeMinimalPayload())).toBe(true);
    });

    it('zwraca false dla null', () => {
      expect(isUnifiedDocumentPayload(null)).toBe(false);
    });

    it('zwraca false dla pustego obiektu', () => {
      expect(isUnifiedDocumentPayload({})).toBe(false);
    });

    it('zwraca false dla schemaVersion: 1 (OfferPDFPayload)', () => {
      const v1Payload = {
        schemaVersion: 1,
        projectId: 'proj-123',
        projectName: 'Test',
        company: { name: 'Test Firma' },
        client: null,
        quote: null,
        pdfConfig: { version: 'standard', title: 'Test', offerText: '', terms: '', deadlineText: '' },
        generatedAt: '2026-04-01T00:00:00.000Z',
        documentId: 'OF/2026/TEST01',
        issuedAt: '2026-04-01T00:00:00.000Z',
        validUntil: '2026-05-01T00:00:00.000Z',
      };
      expect(isUnifiedDocumentPayload(v1Payload)).toBe(false);
    });
  });

  // ── 6. Sekcja pól opcjonalnych (sourceOfferId, sourceProjectId) ───────────

  describe('pola opcjonalne — traceability', () => {
    it('payload bez sourceOfferId jest poprawny', () => {
      const _payload = makeMinimalPayload();
      delete _payload.sourceOfferId;
      expect(validateUnifiedPayload(_payload)).toBeNull();
    });

    it('payload z sourceOfferId i sourceProjectId jest poprawny', () => {
      const payload = makeMinimalPayload({
        sourceOfferId: 'offer-uuid-123',
        sourceProjectId: 'project-uuid-456',
      });
      expect(validateUnifiedPayload(payload)).toBeNull();
    });
  });

  // ── 7. Klient null (bez klienta) ─────────────────────────────────────────

  describe('klient opcjonalny', () => {
    it('payload z client: null jest poprawny', () => {
      const payload = makeMinimalPayload({ client: null });
      expect(validateUnifiedPayload(payload)).toBeNull();
    });

    it('payload z klientem B2B (clientNip) jest poprawny', () => {
      const payload = makeMinimalPayload({
        client: {
          name: 'Firma XYZ Sp. z o.o.',
          email: 'biuro@firmaxyz.pl',
          address: 'ul. Przemysłowa 1, 00-100 Warszawa',
          clientNip: '9876543210',
        },
      });
      expect(validateUnifiedPayload(payload)).toBeNull();
    });
  });

  // ── 8. Protokół odbioru — typ bez wymaganej wyceny ──────────────────────

  describe('sekcja protocol', () => {
    it('poprawna sekcja protokołu jest akceptowana', () => {
      const protocolSection: ProtocolDocumentSection = {
        type: 'protocol',
        items: [
          { description: 'Ułożenie płytek', accepted: true },
          { description: 'Wykonanie fug', accepted: true, notes: 'Spoina epoksydowa beżowa' },
        ],
        notes: 'Odbiór przeprowadzono bez zastrzeżeń.',
        receptionDate: '2026-04-01T14:00:00.000Z',
      };

      const payload = makeMinimalPayload({
        documentType: 'protocol',
        section: protocolSection,
      });
      expect(validateUnifiedPayload(payload)).toBeNull();
    });
  });
});
