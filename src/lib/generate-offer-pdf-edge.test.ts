/**
 * Unit tests for generateOfferPdfEdge.
 * Roadmap §26 PDF Migration — PR 5 (QA & Cleanup).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('./offerPdfPayloadBuilder', () => ({
  buildOfferPdfPayloadFromOffer: vi.fn(),
}));

vi.mock('./serialize-offer-pdf-payload', () => ({
  serializeOfferPdfPayload: vi.fn(),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { generateOfferPdfEdge } from './generate-offer-pdf-edge';
import { supabase } from '@/integrations/supabase/client';
import { buildOfferPdfPayloadFromOffer } from './offerPdfPayloadBuilder';
import { serializeOfferPdfPayload } from './serialize-offer-pdf-payload';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_PAYLOAD = { projectId: 'offer-1', projectName: 'Test' } as never;
const MOCK_WIRE = { schemaVersion: 1, projectId: 'offer-1' } as never;
const MOCK_PDF_BLOB = new Blob(['%PDF-1.4'], { type: 'application/pdf' });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateOfferPdfEdge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(buildOfferPdfPayloadFromOffer).mockResolvedValue(MOCK_PAYLOAD);
    vi.mocked(serializeOfferPdfPayload).mockReturnValue(MOCK_WIRE);
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: MOCK_PDF_BLOB,
      error: null,
    });
  });

  it('returns a Blob on success', async () => {
    const result = await generateOfferPdfEdge('offer-1', 'user-1');
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
  });

  it('builds payload with correct offerId and userId', async () => {
    await generateOfferPdfEdge('offer-abc', 'user-xyz');
    expect(buildOfferPdfPayloadFromOffer).toHaveBeenCalledWith('offer-abc', 'user-xyz');
  });

  it('serializes the payload before calling Edge Function', async () => {
    await generateOfferPdfEdge('offer-1', 'user-1');
    expect(serializeOfferPdfPayload).toHaveBeenCalledWith(MOCK_PAYLOAD);
  });

  it('invokes generate-offer-pdf EF with wire payload', async () => {
    await generateOfferPdfEdge('offer-1', 'user-1');
    expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-offer-pdf', {
      body: MOCK_WIRE,
    });
  });

  it('throws when Edge Function returns an error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: 'Internal server error' },
    });
    await expect(generateOfferPdfEdge('offer-1', 'user-1')).rejects.toThrow(
      'PDF generation failed',
    );
  });

  it('throws when Edge Function returns non-Blob data', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { error: 'unexpected json' },
      error: null,
    });
    await expect(generateOfferPdfEdge('offer-1', 'user-1')).rejects.toThrow(
      'Unexpected response from generate-offer-pdf Edge Function',
    );
  });

  it('throws when buildOfferPdfPayloadFromOffer rejects', async () => {
    vi.mocked(buildOfferPdfPayloadFromOffer).mockRejectedValue(
      new Error('DB query failed'),
    );
    await expect(generateOfferPdfEdge('offer-1', 'user-1')).rejects.toThrow(
      'DB query failed',
    );
  });
});
