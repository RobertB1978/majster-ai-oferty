/**
 * Unit tests for serializeOfferPdfPayload.
 * Roadmap §26 PDF Migration — PR 1 (Payload Contract).
 */

import { describe, it, expect } from 'vitest';
import { serializeOfferPdfPayload } from './serialize-offer-pdf-payload';
import type { OfferPdfPayload } from './offerDataBuilder';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ISSUED = new Date('2026-03-26T08:00:00Z');
const VALID_UNTIL = new Date('2026-04-09T08:00:00Z');
const GENERATED = new Date('2026-03-26T12:00:00Z');

function makePayload(overrides: Partial<OfferPdfPayload> = {}): OfferPdfPayload {
  return {
    projectId: 'proj-abc-123',
    projectName: 'Remont łazienki Kowalski',
    company: { name: 'Majster Sp. z o.o.', nip: '1234567890' },
    client: { name: 'Jan Kowalski', phone: '600-100-200' },
    quote: {
      positions: [
        { id: 'p1', name: 'Kafelki', qty: 10, unit: 'm2', price: 120, category: 'Materiał' },
      ],
      summaryMaterials: 1200,
      summaryLabor: 0,
      marginPercent: 0,
      total: 1200,
      vatRate: 23,
      isVatExempt: false,
      netTotal: 1200,
      vatAmount: 276,
      grossTotal: 1476,
    },
    pdfConfig: {
      version: 'standard',
      templateId: 'modern',
      title: 'Wycena',
      offerText: 'Oferta ważna 14 dni.',
      terms: '',
      deadlineText: '14 dni',
    },
    generatedAt: GENERATED,
    documentId: 'OF/2026/PROJAB',
    issuedAt: ISSUED,
    validUntil: VALID_UNTIL,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('serializeOfferPdfPayload', () => {
  it('converts Date fields to ISO 8601 strings', () => {
    const result = serializeOfferPdfPayload(makePayload());
    expect(result.generatedAt).toBe('2026-03-26T12:00:00.000Z');
    expect(result.issuedAt).toBe('2026-03-26T08:00:00.000Z');
    expect(result.validUntil).toBe('2026-04-09T08:00:00.000Z');
  });

  it('sets schemaVersion to 1', () => {
    const result = serializeOfferPdfPayload(makePayload());
    expect(result.schemaVersion).toBe(1);
  });

  it('preserves projectId and projectName', () => {
    const result = serializeOfferPdfPayload(makePayload());
    expect(result.projectId).toBe('proj-abc-123');
    expect(result.projectName).toBe('Remont łazienki Kowalski');
  });

  it('preserves company and client', () => {
    const result = serializeOfferPdfPayload(makePayload());
    expect(result.company.name).toBe('Majster Sp. z o.o.');
    expect(result.client?.name).toBe('Jan Kowalski');
  });

  it('serializes quote positions', () => {
    const result = serializeOfferPdfPayload(makePayload());
    expect(result.quote?.positions).toHaveLength(1);
    expect(result.quote?.positions[0].name).toBe('Kafelki');
    expect(result.quote?.grossTotal).toBe(1476);
  });

  it('sets client to null when payload.client is null', () => {
    const result = serializeOfferPdfPayload(makePayload({ client: null }));
    expect(result.client).toBeNull();
  });

  it('sets quote to null when payload.quote is null', () => {
    const result = serializeOfferPdfPayload(makePayload({ quote: null }));
    expect(result.quote).toBeNull();
  });

  it('serializes variantSections when present', () => {
    const payload = makePayload({
      variantSections: [
        {
          id: 'v1',
          label: 'Wariant A',
          sort_order: 0,
          quote: {
            positions: [],
            summaryMaterials: 500,
            summaryLabor: 200,
            marginPercent: 10,
            total: 770,
            vatRate: 8,
            isVatExempt: false,
            netTotal: 770,
            vatAmount: 61.6,
            grossTotal: 831.6,
          },
        },
      ],
    });
    const result = serializeOfferPdfPayload(payload);
    expect(result.variantSections).toHaveLength(1);
    expect(result.variantSections![0].label).toBe('Wariant A');
    expect(result.variantSections![0].quote.grossTotal).toBe(831.6);
  });

  it('omits variantSections when undefined', () => {
    const result = serializeOfferPdfPayload(makePayload({ variantSections: undefined }));
    expect(result.variantSections).toBeUndefined();
  });

  it('output is JSON-serializable (no Date instances)', () => {
    const result = serializeOfferPdfPayload(makePayload());
    const json = JSON.stringify(result);
    const parsed = JSON.parse(json) as typeof result;
    // After JSON round-trip the ISO strings must survive intact
    expect(parsed.issuedAt).toBe('2026-03-26T08:00:00.000Z');
  });

  it('preserves acceptanceUrl', () => {
    const result = serializeOfferPdfPayload(
      makePayload({ acceptanceUrl: 'https://app.example.com/a/token123' }),
    );
    expect(result.acceptanceUrl).toBe('https://app.example.com/a/token123');
  });
});
