/**
 * Tests for useAcceptanceLink — atomic upsert regression.
 *
 * Verifies that useCreateAcceptanceLink uses the atomic RPC
 * (upsert_acceptance_link) instead of separate DELETE + INSERT,
 * preventing race conditions where the offer could be left without a link.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/* ── Mocks (hoisted) ────────────────────────────────────────────── */

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

import { useCreateAcceptanceLink } from './useAcceptanceLink';

/* ── Helpers ─────────────────────────────────────────────────────── */

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

/* ── Tests ────────────────────────────────────────────────────────── */

describe('useCreateAcceptanceLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.rpc.mockResolvedValue({
      data: { id: 'link-1', offer_id: 'offer-abc', token: 'tok-uuid', expires_at: '2026-05-03T00:00:00Z', created_at: '2026-04-03T00:00:00Z' },
      error: null,
    });
  });

  it('calls upsert_acceptance_link RPC instead of DELETE + INSERT', async () => {
    const { result } = renderHook(() => useCreateAcceptanceLink('offer-abc'), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Must use atomic RPC, not separate from() calls
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('upsert_acceptance_link', {
      p_offer_id: 'offer-abc',
      p_user_id: 'user-123',
    });

    // from() should NOT be called for delete/insert on acceptance_links
    expect(mockSupabase.from).not.toHaveBeenCalledWith('acceptance_links');
  });

  it('throws when RPC returns an error', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'conflict' } });

    const { result } = renderHook(() => useCreateAcceptanceLink('offer-abc'), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('conflict');
  });

  it('throws when RPC returns null data', async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

    const { result } = renderHook(() => useCreateAcceptanceLink('offer-abc'), { wrapper: makeWrapper() });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('no data');
  });
});
