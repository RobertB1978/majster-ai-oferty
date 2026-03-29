/**
 * usePhotoReport — minimal test for Sprint 0 containment fix.
 *
 * Verifies that query errors are caught and return [] instead of throwing,
 * so PhotoReportPanel shows empty-state instead of broken error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    loading: false,
  }),
}));

const mockSelect = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: mockSelect,
        }),
      }),
    }),
    storage: {
      from: () => ({
        createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/imageCompression', () => ({
  compressImage: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('usePhotoReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when Supabase query returns an error', async () => {
    mockSelect.mockResolvedValue({
      data: null,
      error: { message: 'relation "project_photos" does not exist', code: '42P01' },
    });

    const { usePhotoReport } = await import('@/hooks/usePhotoReport');

    const { result } = renderHook(() => usePhotoReport('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('returns empty array when Supabase throws unexpectedly', async () => {
    mockSelect.mockRejectedValue(new Error('Network error'));

    const { usePhotoReport } = await import('@/hooks/usePhotoReport');

    const { result } = renderHook(() => usePhotoReport('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('returns photos when query succeeds', async () => {
    mockSelect.mockResolvedValue({
      data: [
        {
          id: 'photo-1',
          project_id: 'proj-1',
          user_id: 'user-1',
          phase: 'BEFORE',
          photo_url: 'user-1/proj-1/abc.jpg',
          file_name: 'abc.jpg',
          mime_type: 'image/jpeg',
          size_bytes: 1024,
          width: null,
          height: null,
          created_at: '2025-01-01T00:00:00Z',
        },
      ],
      error: null,
    });

    const { usePhotoReport } = await import('@/hooks/usePhotoReport');

    const { result } = renderHook(() => usePhotoReport('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].phase).toBe('BEFORE');
    expect(result.current.isError).toBe(false);
  });
});
