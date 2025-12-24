// ============================================
// USESAVEQUOTE UPSERT TESTS
// Phase 2 - B4 Race Condition Fix
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSaveQuote, QuotePosition } from '@/hooks/useQuotes';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useSaveQuote UPSERT', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should use UPSERT instead of SELECT-then-INSERT/UPDATE', async () => {
    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'quote-1',
            project_id: 'project-1',
            user_id: 'test-user-id',
            positions: [],
            summary_materials: 0,
            summary_labor: 0,
            margin_percent: 10,
            total: 0,
          },
          error: null,
        }),
      }),
    });

    (supabase.from as unknown).mockReturnValue({
      upsert: mockUpsert,
    });

    const { result } = renderHook(() => useSaveQuote(), { wrapper });

    const positions: QuotePosition[] = [
      {
        id: '1',
        name: 'Test Item',
        qty: 1,
        unit: 'szt.',
        price: 100,
        category: 'Materiał',
      },
    ];

    result.current.mutate({
      projectId: 'project-1',
      positions,
      marginPercent: 10,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify UPSERT was called with correct parameters
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'project-1',
        user_id: 'test-user-id',
        margin_percent: 10,
      }),
      expect.objectContaining({
        onConflict: 'project_id',
        ignoreDuplicates: false,
      })
    );
  });

  it('should calculate summary fields correctly', async () => {
    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'quote-1' },
          error: null,
        }),
      }),
    });

    (supabase.from as unknown).mockReturnValue({
      upsert: mockUpsert,
    });

    const { result } = renderHook(() => useSaveQuote(), { wrapper });

    const positions: QuotePosition[] = [
      {
        id: '1',
        name: 'Material',
        qty: 2,
        unit: 'szt.',
        price: 50,
        category: 'Materiał',
      },
      {
        id: '2',
        name: 'Labor',
        qty: 3,
        unit: 'godz.',
        price: 100,
        category: 'Robocizna',
      },
    ];

    result.current.mutate({
      projectId: 'project-1',
      positions,
      marginPercent: 20,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        summary_materials: 100, // 2 * 50
        summary_labor: 300, // 3 * 100
        total: 480, // (100 + 300) * 1.2
      }),
      expect.any(Object)
    );
  });

  it('should handle concurrent saves without race condition', async () => {
    // Simulate concurrent saves by calling mutate multiple times
    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'quote-1', project_id: 'project-1' },
          error: null,
        }),
      }),
    });

    (supabase.from as unknown).mockReturnValue({
      upsert: mockUpsert,
    });

    const { result } = renderHook(() => useSaveQuote(), { wrapper });

    const positions: QuotePosition[] = [
      {
        id: '1',
        name: 'Item',
        qty: 1,
        unit: 'szt.',
        price: 100,
        category: 'Materiał',
      },
    ];

    // Simulate concurrent saves
    result.current.mutate({
      projectId: 'project-1',
      positions,
      marginPercent: 10,
    });

    result.current.mutate({
      projectId: 'project-1',
      positions: [...positions, { ...positions[0], id: '2', name: 'Item 2' }],
      marginPercent: 15,
    });

    await waitFor(() => expect(mockUpsert).toHaveBeenCalled());

    // Both calls should use UPSERT, preventing race conditions
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'project-1',
      }),
      expect.objectContaining({
        onConflict: 'project_id',
      })
    );
  });

  it('should handle errors gracefully', async () => {
    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }),
    });

    (supabase.from as unknown).mockReturnValue({
      upsert: mockUpsert,
    });

    const { result } = renderHook(() => useSaveQuote(), { wrapper });

    const positions: QuotePosition[] = [];

    result.current.mutate({
      projectId: 'project-1',
      positions,
      marginPercent: 10,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
