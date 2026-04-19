/**
 * PR-COMM-08 — send tracking + mixed VAT label
 *
 * 1. New send flow records send-history (offer_sends insert) when clientEmail provided
 * 2. Mixed VAT rates → "Różne stawki VAT" label instead of first rate
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readSrc(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf-8');
}

// ── 1. Send history — structural verification ─────────────────────────────────

describe('useSendOffer — offer_sends insert (send history)', () => {
  it('source inserts into offer_sends table after email send', () => {
    const source = readSrc('src/hooks/useSendOffer.ts');
    expect(source).toContain("from('offer_sends').insert");
  });

  it('source captures client_email in the insert payload', () => {
    const source = readSrc('src/hooks/useSendOffer.ts');
    expect(source).toContain('client_email: clientEmail');
  });

  it('source captures project_id (offerId) in the insert payload', () => {
    const source = readSrc('src/hooks/useSendOffer.ts');
    expect(source).toContain('project_id: offerId');
  });

  it('source sets tracking_status in the insert payload', () => {
    const source = readSrc('src/hooks/useSendOffer.ts');
    expect(source).toContain("tracking_status: 'sent'");
  });

  it('source captures pdf_url in the insert payload', () => {
    const source = readSrc('src/hooks/useSendOffer.ts');
    expect(source).toContain('pdf_url: pdfUrl');
  });

  it('insert is placed after the email send attempt (non-fatal)', () => {
    const source = readSrc('src/hooks/useSendOffer.ts');
    const emailInvokePos = source.indexOf("'send-offer-email'");
    const insertPos = source.indexOf("from('offer_sends').insert");
    expect(insertPos).toBeGreaterThan(emailInvokePos);
  });
});

// ── 2. Mixed VAT — offerDataBuilder QuoteData interface ───────────────────────

describe('QuoteData — hasMixedVatRates field', () => {
  it('QuoteData interface exports hasMixedVatRates as optional boolean', async () => {
    const source = readSrc('src/lib/offerDataBuilder.ts');
    expect(source).toContain('hasMixedVatRates?:');
  });
});

// ── 3. Mixed VAT — offerPdfPayloadBuilder detection ──────────────────────────

describe('offerPdfPayloadBuilder — buildQuoteData detects mixed VAT', () => {
  it('source computes distinctRates from item vat_rate values', () => {
    const source = readSrc('src/lib/offerPdfPayloadBuilder.ts');
    expect(source).toContain('distinctRates');
    expect(source).toContain('hasMixedVatRates');
  });

  it('source sets hasMixedVatRates when distinctRates.length > 1', () => {
    const source = readSrc('src/lib/offerPdfPayloadBuilder.ts');
    expect(source).toContain('distinctRates.length > 1');
  });

  it('source includes hasMixedVatRates in returned QuoteData object', () => {
    const source = readSrc('src/lib/offerPdfPayloadBuilder.ts');
    expect(source).toContain('hasMixedVatRates: hasMixedVatRates');
  });
});

// ── 4. Mixed VAT — offerPdfGenerator renderer labels ─────────────────────────

describe('offerPdfGenerator — uses hasMixedVatRates for safe labels', () => {
  it('table-header vatLabel uses "różne" when hasMixedVatRates is true', () => {
    const source = readSrc('src/lib/offerPdfGenerator.ts');
    expect(source).toContain("hasMixedVatRates ? 'różne'");
  });

  it('summary section uses "Różne stawki VAT:" when hasMixedVatRates is true', () => {
    const source = readSrc('src/lib/offerPdfGenerator.ts');
    expect(source).toContain("hasMixedVatRates ? 'Różne stawki VAT:'");
  });

  it('compliance vatRateLine uses "Różne stawki VAT:" when hasMixedVatRates is true', () => {
    const source = readSrc('src/lib/offerPdfGenerator.ts');
    expect(source).toContain("hasMixedVatRates ? 'Różne stawki VAT:'");
  });
});

// ── 5. Mixed VAT — wire format serializer passes flag through ─────────────────

describe('serialize-offer-pdf-payload — passes hasMixedVatRates to Edge Function', () => {
  it('PDFQuoteData type includes hasMixedVatRates optional field', () => {
    const source = readSrc('src/types/offer-pdf-payload.ts');
    expect(source).toContain('hasMixedVatRates?:');
  });

  it('serializeQuote includes hasMixedVatRates when truthy', () => {
    const source = readSrc('src/lib/serialize-offer-pdf-payload.ts');
    expect(source).toContain('hasMixedVatRates');
  });
});

// ── 6. Mixed VAT — Edge Function renderer uses mixedVat label ────────────────

describe('generate-offer-pdf Edge Function — uses mixedVat label', () => {
  it('Deno types include hasMixedVatRates in PDFQuoteData', () => {
    const source = readSrc('supabase/functions/generate-offer-pdf/types.ts');
    expect(source).toContain('hasMixedVatRates?:');
  });

  it('renderer labels have mixedVat key in all 3 locales (pl/en/uk)', () => {
    const source = readSrc('supabase/functions/generate-offer-pdf/renderer.ts');
    const matches = source.match(/mixedVat:/g);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThanOrEqual(4); // interface + pl + en + uk
  });

  it('renderer uses hasMixedVatRates to pick mixedVat label over single-rate', () => {
    const source = readSrc('supabase/functions/generate-offer-pdf/renderer.ts');
    expect(source).toContain('hasMixedVatRates ? labels.mixedVat');
  });
});
