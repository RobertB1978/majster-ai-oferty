/**
 * PR-L4b — usePublicLegalDocument tests
 *
 * Covers:
 * 1. Returns doc when DB has a published document
 * 2. isFallback=true when DB returns null (no published doc)
 * 3. isFallback=true when DB query returns an error
 * 4. effectiveDate formatted from doc.effective_at
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { LegalDocument } from '@/types/legal';

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: mockEq,
    })),
  },
}));

// Helper: chain multiple .eq() calls through mockReturnThis
beforeEach(() => {
  mockEq.mockReturnValue({ eq: mockEq, maybeSingle: mockMaybeSingle });
  mockMaybeSingle.mockReset();
});

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

// Lazy import so mock is applied first
async function getHook() {
  const mod = await import('@/hooks/usePublicLegalDocument');
  return mod.usePublicLegalDocument;
}

const publishedDoc: LegalDocument = {
  id: 'doc-1',
  slug: 'privacy',
  language: 'pl',
  version: '1.0',
  title: 'Polityka prywatności',
  content: 'Treść polityki prywatności',
  status: 'published',
  published_at: '2026-04-20T00:00:00Z',
  effective_at: '2026-04-20T00:00:00Z',
  created_at: '2026-04-20T00:00:00Z',
  updated_at: '2026-04-20T00:00:00Z',
};

describe('usePublicLegalDocument', () => {
  it('returns doc and isFallback=false when DB has published doc', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: publishedDoc, error: null });
    const usePublicLegalDocument = await getHook();

    const { result } = renderHook(
      () => usePublicLegalDocument('privacy', 'pl'),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.doc?.id).toBe('doc-1');
    expect(result.current.doc?.title).toBe('Polityka prywatności');
    expect(result.current.isFallback).toBe(false);
  });

  it('returns isFallback=true when DB returns null (no published doc)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const usePublicLegalDocument = await getHook();

    const { result } = renderHook(
      () => usePublicLegalDocument('terms', 'en'),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.doc).toBeNull();
    expect(result.current.isFallback).toBe(true);
  });

  it('returns isFallback=true when DB query returns an error', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'connection refused' },
    });
    const usePublicLegalDocument = await getHook();

    const { result } = renderHook(
      () => usePublicLegalDocument('cookies', 'pl'),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.doc).toBeNull();
    expect(result.current.isFallback).toBe(true);
  });

  it('formats effectiveDate from doc.effective_at for pl locale', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: publishedDoc, error: null });
    const usePublicLegalDocument = await getHook();

    const { result } = renderHook(
      () => usePublicLegalDocument('privacy', 'pl'),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Should be a non-null formatted date string
    expect(result.current.effectiveDate).not.toBeNull();
    expect(typeof result.current.effectiveDate).toBe('string');
    expect(result.current.effectiveDate!.length).toBeGreaterThan(0);
  });

  it('returns effectiveDate=null when doc has no effective_at', async () => {
    const docNoDate: LegalDocument = { ...publishedDoc, effective_at: null };
    mockMaybeSingle.mockResolvedValueOnce({ data: docNoDate, error: null });
    const usePublicLegalDocument = await getHook();

    const { result } = renderHook(
      () => usePublicLegalDocument('privacy', 'pl'),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.effectiveDate).toBeNull();
  });
});
