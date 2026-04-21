import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { Subprocessor } from '@/types/subprocessors';

/* ── Mocks (hoisted) ─────────────────────────────────────────────── */

const { mockOrderFn, mockEqFn, mockSelectFn, mockFromFn } = vi.hoisted(() => {
  const mockOrderFn = vi.fn();
  const mockEqFn = vi.fn();
  const mockSelectFn = vi.fn();
  const mockFromFn = vi.fn();

  const builder = {
    select: mockSelectFn,
    eq: mockEqFn,
    order: mockOrderFn,
  };

  mockSelectFn.mockReturnValue(builder);
  mockEqFn.mockReturnValue(builder);
  mockFromFn.mockReturnValue(builder);

  return { mockOrderFn, mockEqFn, mockSelectFn, mockFromFn };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFromFn },
}));

import { usePublicSubprocessors } from './usePublicSubprocessors';

/* ── Fixtures ────────────────────────────────────────────────────── */

const SAMPLE_SUBPROCESSORS: Subprocessor[] = [
  {
    id: 'uuid-1',
    slug: 'supabase',
    name: 'Supabase Inc.',
    category: 'infrastructure',
    purpose: 'Database hosting',
    data_categories: 'User data',
    location: 'USA',
    transfer_basis: 'SCC',
    dpa_url: 'https://supabase.com/legal/dpa',
    privacy_url: 'https://supabase.com/privacy',
    display_order: 10,
  },
  {
    id: 'uuid-2',
    slug: 'resend',
    name: 'Resend',
    category: 'email',
    purpose: 'Transactional email',
    data_categories: null,
    location: 'USA',
    transfer_basis: 'SCC',
    dpa_url: 'https://resend.com/legal/dpa',
    privacy_url: 'https://resend.com/privacy',
    display_order: 20,
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

/* ── Tests ───────────────────────────────────────────────────────── */

describe('usePublicSubprocessors', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const builder = {
      select: mockSelectFn,
      eq: mockEqFn,
      order: mockOrderFn,
    };
    mockSelectFn.mockReturnValue(builder);
    mockEqFn.mockReturnValue(builder);
    mockFromFn.mockReturnValue(builder);
    mockOrderFn.mockResolvedValue({ data: SAMPLE_SUBPROCESSORS, error: null });
  });

  it('returns active subprocessors on success', async () => {
    const { result } = renderHook(() => usePublicSubprocessors(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].slug).toBe('supabase');
    expect(result.current.data![1].slug).toBe('resend');
  });

  it('queries the subprocessors table with status="active" filter', async () => {
    renderHook(() => usePublicSubprocessors(), { wrapper: makeWrapper() });

    await waitFor(() => expect(mockFromFn).toHaveBeenCalled());

    expect(mockFromFn).toHaveBeenCalledWith('subprocessors');
    expect(mockEqFn).toHaveBeenCalledWith('status', 'active');
  });

  it('orders results by display_order ascending', async () => {
    renderHook(() => usePublicSubprocessors(), { wrapper: makeWrapper() });

    await waitFor(() => expect(mockOrderFn).toHaveBeenCalled());

    expect(mockOrderFn).toHaveBeenCalledWith('display_order', { ascending: true });
  });

  it('returns empty array when data is null', async () => {
    mockOrderFn.mockResolvedValueOnce({ data: null, error: null });

    const { result } = renderHook(() => usePublicSubprocessors(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('sets isError when supabase returns an error', async () => {
    mockOrderFn.mockResolvedValue({ data: null, error: { message: 'DB unavailable' } });

    const { result } = renderHook(() => usePublicSubprocessors(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
  });
});
