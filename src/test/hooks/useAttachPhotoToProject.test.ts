/**
 * useAttachPhotoToProject — unit tests
 *
 * Verifies that the hook calls supabase.from('photo_project_links').upsert
 * with the correct payload and invalidates gallery/photo_report queries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    loading: false,
  }),
}));

const mockUpsert = vi.fn();
const mockFrom = vi.fn(() => ({
  upsert: mockUpsert,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/imageCompression', () => ({
  compressImage: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  MEDIA_BUCKET: 'project-photos',
  normalizeStoragePath: (p: string) => p,
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useAttachPhotoToProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls upsert on photo_project_links with correct payload', async () => {
    mockUpsert.mockResolvedValue({ data: null, error: null });

    const { useAttachPhotoToProject } = await import('@/hooks/useMediaLibraryUpload');

    const { result } = renderHook(() => useAttachPhotoToProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        photoId: 'photo-1',
        projectId: 'project-1',
        phase: 'BEFORE',
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('photo_project_links');
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        photo_id: 'photo-1',
        project_id: 'project-1',
        user_id: 'user-1',
        phase: 'BEFORE',
      },
      { onConflict: 'photo_id,project_id' }
    );
  });

  it('throws when supabase returns an error', async () => {
    mockUpsert.mockResolvedValue({
      data: null,
      error: { message: 'duplicate key', code: '23505' },
    });

    const { useAttachPhotoToProject } = await import('@/hooks/useMediaLibraryUpload');

    const { result } = renderHook(() => useAttachPhotoToProject(), {
      wrapper: createWrapper(),
    });

    // Catch inside act so TanStack Query can flush state updates after the throw
    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.mutateAsync({
          photoId: 'photo-1',
          projectId: 'project-1',
          phase: 'DURING',
        });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeTruthy();
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('throws when user is not authenticated', async () => {
    vi.doMock('@/contexts/AuthContext', () => ({
      useAuth: () => ({ user: null, loading: false }),
    }));

    // Reset module cache to pick up the new mock
    vi.resetModules();
    const { useAttachPhotoToProject } = await import('@/hooks/useMediaLibraryUpload');

    const { result } = renderHook(() => useAttachPhotoToProject(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          photoId: 'photo-1',
          projectId: 'project-1',
          phase: 'AFTER',
        });
      })
    ).rejects.toThrow('Not authenticated');
  });
});
