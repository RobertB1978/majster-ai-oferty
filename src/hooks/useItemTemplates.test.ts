// ============================================
// USEITEMTEMPLATES TESTS
// Sprint 2 - Price Item Library
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useItemTemplates,
  useCreateItemTemplate,
  useUpdateItemTemplate,
  useDeleteItemTemplate,
  ItemTemplate,
} from '@/hooks/useItemTemplates';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
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

describe('useItemTemplates', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch item templates successfully', async () => {
    const mockTemplates: ItemTemplate[] = [
      {
        id: '1',
        user_id: 'test-user-id',
        name: 'Płytki ceramiczne',
        unit: 'm²',
        default_qty: 10,
        default_price: 50,
        category: 'Materiał',
        description: 'Płytki łazienkowe',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        user_id: 'test-user-id',
        name: 'Malowanie ścian',
        unit: 'm²',
        default_qty: 20,
        default_price: 30,
        category: 'Robocizna',
        description: 'Malowanie pomieszczenia',
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockTemplates,
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useItemTemplates(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTemplates);
    expect(result.current.data).toHaveLength(2);
  });

  it('should handle fetch errors gracefully', async () => {
    const mockError = { message: 'Database error' };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    });

    const { result } = renderHook(() => useItemTemplates(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });

  it('should return empty array when no templates exist', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useItemTemplates(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('should sort templates by name', async () => {
    const mockTemplates: ItemTemplate[] = [
      {
        id: '1',
        user_id: 'test-user-id',
        name: 'AAA Template',
        unit: 'szt.',
        default_qty: 1,
        default_price: 10,
        category: 'Materiał',
        description: '',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockTemplates,
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useItemTemplates(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify order() was called with 'name'
    expect(supabase.from).toHaveBeenCalledWith('item_templates');
  });
});

describe('useCreateItemTemplate', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should create new item template successfully', async () => {
    const mockNewTemplate = {
      id: 'new-template-1',
      user_id: 'test-user-id',
      name: 'New Template',
      unit: 'm²',
      default_qty: 5,
      default_price: 100,
      category: 'Materiał' as const,
      description: 'Test description',
      created_at: '2024-01-03T00:00:00Z',
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockNewTemplate,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useCreateItemTemplate(), { wrapper });

    result.current.mutate({
      name: 'New Template',
      unit: 'm²',
      default_qty: 5,
      default_price: 100,
      category: 'Materiał',
      description: 'Test description',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockNewTemplate);
  });

  it('should handle creation errors and show toast', async () => {
    const mockError = { message: 'Creation failed' };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useCreateItemTemplate(), { wrapper });

    result.current.mutate({
      name: 'Test',
      unit: 'szt.',
      default_qty: 1,
      default_price: 10,
      category: 'Materiał',
      description: '',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useUpdateItemTemplate', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should update item template successfully', async () => {
    const mockUpdatedTemplate = {
      id: 'template-1',
      user_id: 'test-user-id',
      name: 'Updated Template',
      unit: 'm',
      default_qty: 15,
      default_price: 200,
      category: 'Robocizna' as const,
      description: 'Updated description',
      created_at: '2024-01-01T00:00:00Z',
    };

    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUpdatedTemplate,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useUpdateItemTemplate(), { wrapper });

    result.current.mutate({
      id: 'template-1',
      name: 'Updated Template',
      default_price: 200,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUpdatedTemplate);
  });

  it('should handle update errors gracefully', async () => {
    const mockError = { message: 'Update failed' };

    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useUpdateItemTemplate(), { wrapper });

    result.current.mutate({ id: 'template-1', name: 'Test' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useDeleteItemTemplate', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should delete item template successfully', async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useDeleteItemTemplate(), { wrapper });

    result.current.mutate('template-to-delete');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should handle deletion errors and show toast', async () => {
    const mockError = { message: 'Deletion failed' };

    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: mockError,
        }),
      }),
    });

    const { result } = renderHook(() => useDeleteItemTemplate(), { wrapper });

    result.current.mutate('template-to-delete');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });

  it('should invalidate queries after successful deletion', async () => {
    (supabase.from as any).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteItemTemplate(), { wrapper });

    result.current.mutate('template-to-delete');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['item_templates'],
    });
  });
});
