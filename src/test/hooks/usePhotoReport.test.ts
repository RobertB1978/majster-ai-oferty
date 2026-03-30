/**
 * usePhotoReport — PR-2 updated tests.
 *
 * Now queries photo_project_links joined with media_library.
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

const mockOrder = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: mockOrder,
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
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: 'relation "photo_project_links" does not exist', code: '42P01' },
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
    mockOrder.mockRejectedValue(new Error('Network error'));

    const { usePhotoReport } = await import('@/hooks/usePhotoReport');

    const { result } = renderHook(() => usePhotoReport('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('returns photos when query succeeds', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'link-1',
          photo_id: 'photo-1',
          project_id: 'proj-1',
          user_id: 'user-1',
          phase: 'BEFORE',
          sort_order: 0,
          created_at: '2025-01-01T00:00:00Z',
          media_library: {
            id: 'photo-1',
            storage_path: 'user-1/proj-1/abc.jpg',
            file_name: 'abc.jpg',
            file_size: 1024,
            mime_type: 'image/jpeg',
            width: null,
            height: null,
            ai_analysis: null,
          },
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
    expect(result.current.data![0].file_name).toBe('abc.jpg');
    expect(result.current.data![0].media_id).toBe('photo-1');
    expect(result.current.data![0].link_id).toBe('link-1');
    expect(result.current.isError).toBe(false);
  });
});
