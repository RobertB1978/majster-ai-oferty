/**
 * Unit tests for generateServerPdf — server-side PDF with jsPDF fallback.
 * Roadmap §26 PDF Migration — PR 5 (QA & Cleanup).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock payload builder
vi.mock('./offerPdfPayloadBuilder', () => ({
  buildOfferPdfPayloadFromOffer: vi.fn().mockResolvedValue({
    projectId: 'test-id',
    projectName: 'Test',
    company: { name: 'Test Co' },
    client: null,
    quote: null,
    pdfConfig: { version: 'standard', title: 'Oferta', offerText: '', terms: '', deadlineText: '' },
    generatedAt: new Date('2026-01-01'),
    documentId: 'OF/2026/TEST',
    issuedAt: new Date('2026-01-01'),
    validUntil: new Date('2026-01-31'),
  }),
}));

// Mock client-side generator (fallback)
vi.mock('./offerPdfGenerator', () => ({
  generateOfferPdf: vi.fn().mockResolvedValue(new Blob(['jspdf-fallback'], { type: 'application/pdf' })),
}));

// Mock serializer
vi.mock('./serialize-offer-pdf-payload', () => ({
  serializeOfferPdfPayload: vi.fn().mockReturnValue({
    schemaVersion: 1,
    projectId: 'test-id',
    projectName: 'Test',
    company: { name: 'Test Co' },
    client: null,
    quote: null,
    pdfConfig: { version: 'standard', title: 'Oferta', offerText: '', terms: '', deadlineText: '' },
    generatedAt: '2026-01-01T00:00:00.000Z',
    documentId: 'OF/2026/TEST',
    issuedAt: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-01-31T00:00:00.000Z',
  }),
}));

// Mock logger
vi.mock('./logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { generateOfferPdfWithServer } from './generateServerPdf';
import { supabase } from '@/integrations/supabase/client';
import { generateOfferPdf as generateClientPdf } from './offerPdfGenerator';

describe('generateOfferPdfWithServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns server-side PDF when Edge Function succeeds', async () => {
    const serverBlob = new Blob(['server-pdf'], { type: 'application/pdf' });
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: serverBlob,
      error: null,
    });

    const result = await generateOfferPdfWithServer('offer-123', 'user-456');

    expect(result).toBe(serverBlob);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-offer-pdf', {
      body: expect.objectContaining({ schemaVersion: 1 }),
    });
    expect(generateClientPdf).not.toHaveBeenCalled();
  });

  it('falls back to jsPDF when Edge Function returns error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Function not found', name: 'FunctionsError', context: {} as unknown },
    });

    const result = await generateOfferPdfWithServer('offer-123', 'user-456');

    expect(result).toBeInstanceOf(Blob);
    expect(generateClientPdf).toHaveBeenCalled();
  });

  it('falls back to jsPDF when Edge Function throws', async () => {
    vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network timeout'));

    const result = await generateOfferPdfWithServer('offer-123', 'user-456');

    expect(result).toBeInstanceOf(Blob);
    expect(generateClientPdf).toHaveBeenCalled();
  });

  it('handles ArrayBuffer response from Edge Function', async () => {
    const buffer = new ArrayBuffer(10);
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: buffer,
      error: null,
    });

    const result = await generateOfferPdfWithServer('offer-123', 'user-456');

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
    expect(generateClientPdf).not.toHaveBeenCalled();
  });
});
