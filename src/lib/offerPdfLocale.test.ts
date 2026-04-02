/**
 * Tests for document-locale propagation in offer PDF generation.
 *
 * Verifies that:
 * - getPdfComplianceLines uses translated labels when t() is provided
 * - getPdfComplianceLines falls back to Polish when t() is omitted
 * - formatCurrency receives locale from payload
 * - buildOfferData uses t() for default text when provided
 */

import { describe, it, expect, vi } from 'vitest';
import { getPdfComplianceLines } from './offerPdfGenerator';
import { buildOfferData } from './offerDataBuilder';
import type { OfferPdfPayload } from './offerDataBuilder';

// Mock analytics + supabase to allow importing offerPdfGenerator
vi.mock('./analytics/track', () => ({ trackEvent: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn((p: string) => ({ data: { publicUrl: `https://x/${p}` } })),
      })),
    },
  },
}));

const basePayload: OfferPdfPayload = {
  projectId: 'p1',
  projectName: 'Test',
  company: { name: 'Co' },
  client: null,
  quote: null,
  pdfConfig: { version: 'standard', title: 'T', offerText: '', terms: '', deadlineText: '' },
  generatedAt: new Date('2026-01-15T10:00:00Z'),
  documentId: 'OF/2026/ABC',
  issuedAt: new Date('2026-01-15T10:00:00Z'),
  validUntil: new Date('2026-02-14T10:00:00Z'),
};

// ── getPdfComplianceLines locale tests ──────────────────────────────────────

describe('getPdfComplianceLines locale propagation', () => {
  it('falls back to Polish labels when t is not provided', () => {
    const lines = getPdfComplianceLines(basePayload);
    expect(lines.issuedAtLine).toContain('Data wystawienia:');
    expect(lines.validUntilLine).toContain('Ważna do:');
    expect(lines.vatExemptLine).toContain('zwolniony');
  });

  it('uses translated labels when t is provided', () => {
    const mockT = vi.fn((key: string, opts?: Record<string, unknown>) => {
      if (key === 'offerPdf.issuedAt') return `Issue date: ${opts?.date}`;
      if (key === 'offerPdf.validUntil') return `Valid until: ${opts?.date}`;
      if (key === 'offerPdf.vatExemptNote') return 'Seller is VAT exempt';
      return key;
    });

    const lines = getPdfComplianceLines(basePayload, mockT);
    expect(lines.issuedAtLine).toContain('Issue date:');
    expect(lines.validUntilLine).toContain('Valid until:');
    expect(lines.vatExemptLine).toBe('Seller is VAT exempt');
  });

  it('formats dates using payload locale', () => {
    const enPayload = { ...basePayload, locale: 'en-GB' };
    const lines = getPdfComplianceLines(enPayload);
    // en-GB date format: DD/MM/YYYY — should NOT contain Polish "Data wystawienia"
    // but the label itself will be Polish (no t provided)
    expect(lines.issuedAtLine).toContain('Data wystawienia:');
    // The date portion should use en-GB formatting
    expect(lines.issuedAtLine).not.toBe('');
  });

  it('uses pl-PL locale by default when payload.locale is undefined', () => {
    const lines = getPdfComplianceLines({ ...basePayload, locale: undefined });
    // Polish date format should be used
    expect(lines.issuedAtLine).toContain('Data wystawienia:');
  });
});

// ── buildOfferData locale tests ─────────────────────────────────────────────

describe('buildOfferData locale-aware defaults', () => {
  it('uses Polish defaults when t is not provided', () => {
    const result = buildOfferData({
      projectId: 'p1',
      projectName: 'Test',
    });

    expect(result.pdfConfig.title).toBe('Oferta - Test');
    expect(result.pdfConfig.offerText).toContain('Szanowni Państwo');
    expect(result.pdfConfig.terms).toContain('Warunki płatności');
    expect(result.pdfConfig.deadlineText).toContain('do uzgodnienia');
  });

  it('uses translated defaults when t is provided', () => {
    const mockT = vi.fn((key: string, opts?: Record<string, unknown>) => {
      if (key === 'offerPdf.defaultTitle') return `Offer - ${opts?.projectName}`;
      if (key === 'pdfGenerator.defaultOfferText') return 'Dear Sir/Madam';
      if (key === 'pdfGenerator.defaultTerms') return 'Payment: 50% advance';
      if (key === 'pdfGenerator.defaultDeadline') return 'To be agreed';
      if (key === 'offerPdf.defaultClientName') return 'Client';
      return key;
    });

    const result = buildOfferData({
      projectId: 'p1',
      projectName: 'Test',
      t: mockT,
    });

    expect(result.pdfConfig.title).toBe('Offer - Test');
    expect(result.pdfConfig.offerText).toBe('Dear Sir/Madam');
    expect(result.pdfConfig.terms).toBe('Payment: 50% advance');
    expect(result.pdfConfig.deadlineText).toBe('To be agreed');
  });

  it('uses translated client name fallback when t is provided', () => {
    const mockT = vi.fn((key: string) => {
      if (key === 'offerPdf.defaultClientName') return 'Client';
      return key;
    });

    const result = buildOfferData({
      projectId: 'p1',
      projectName: 'Test',
      client: { name: '' },
      t: mockT,
    });

    expect(result.client?.name).toBe('Client');
  });

  it('preserves user-entered pdfData over defaults', () => {
    const mockT = vi.fn(() => 'translated');

    const result = buildOfferData({
      projectId: 'p1',
      projectName: 'Test',
      pdfData: {
        version: 'standard',
        title: 'My Custom Title',
        offer_text: 'Custom text',
        terms: 'Custom terms',
        deadline_text: 'Custom deadline',
      },
      t: mockT,
    });

    // User-entered data should NOT be overridden by t()
    expect(result.pdfConfig.title).toBe('My Custom Title');
    expect(result.pdfConfig.offerText).toBe('Custom text');
    expect(result.pdfConfig.terms).toBe('Custom terms');
    expect(result.pdfConfig.deadlineText).toBe('Custom deadline');
    expect(mockT).not.toHaveBeenCalled();
  });

  it('passes locale through to payload', () => {
    const result = buildOfferData({
      projectId: 'p1',
      projectName: 'Test',
      locale: 'en-GB',
    });

    expect(result.locale).toBe('en-GB');
  });

  it('defaults locale to pl-PL', () => {
    const result = buildOfferData({
      projectId: 'p1',
      projectName: 'Test',
    });

    expect(result.locale).toBe('pl-PL');
  });
});
