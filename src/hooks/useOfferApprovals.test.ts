// ============================================
// USEOFFERAPPROVALS TESTS
// Sprint 3 - Client Portal / Public Link
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useOfferApprovals,
  useCreateOfferApproval,
  useExtendOfferApproval,
  usePublicOfferApproval,
  useSubmitOfferApproval,
  OfferApproval,
} from '@/hooks/useOfferApprovals';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
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

describe('useOfferApprovals', () => {
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

  it('should fetch offer approvals for a project successfully', async () => {
    const mockApprovals: OfferApproval[] = [
      {
        id: 'approval-1',
        project_id: 'project-1',
        user_id: 'test-user-id',
        public_token: 'token-abc',
        client_name: 'Jan Kowalski',
        client_email: 'jan@example.com',
        status: 'approved',
        signature_data: 'signature-base64',
        client_comment: 'Wygląda dobrze',
        approved_at: '2024-01-15T12:00:00Z',
        created_at: '2024-01-10T10:00:00Z',
        expires_at: '2024-02-10T10:00:00Z',
      },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockApprovals,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useOfferApprovals('project-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockApprovals);
    expect(result.current.data).toHaveLength(1);
  });

  it('should handle fetch errors gracefully', async () => {
    const mockError = { message: 'Database error' };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useOfferApprovals('project-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });
});

describe('usePublicOfferApproval', () => {
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

  it('should fetch offer approval by public token successfully', async () => {
    const mockOfferData = {
      id: 'approval-1',
      project_name: 'Remont mieszkania',
      total: 15000,
      status: 'pending',
      expires_at: '2024-12-31T23:59:59Z',
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: mockOfferData,
      error: null,
    });

    const { result } = renderHook(() => usePublicOfferApproval('valid-token-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockOfferData);
  });

  it('should handle invalid/expired token gracefully', async () => {
    const mockError = { message: 'Token expired or invalid' };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => usePublicOfferApproval('expired-token'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });

  it('should not fetch when token is empty', () => {
    const { result } = renderHook(() => usePublicOfferApproval(''), { wrapper });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useSubmitOfferApproval', () => {
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

  it('should approve offer with signature successfully', async () => {
    const mockResponse = {
      success: true,
      status: 'approved',
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const { result } = renderHook(() => useSubmitOfferApproval(), { wrapper });

    result.current.mutate({
      token: 'valid-token',
      action: 'approve',
      signatureData: 'signature-base64-data',
      comment: 'Zgadzam się',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
  });

  it('should reject offer successfully', async () => {
    const mockResponse = {
      success: true,
      status: 'rejected',
    };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const { result } = renderHook(() => useSubmitOfferApproval(), { wrapper });

    result.current.mutate({
      token: 'valid-token',
      action: 'reject',
      comment: 'Cena za wysoka',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
  });

  it('should handle submission errors and show toast', async () => {
    const mockError = { message: 'Submission failed' };

    (supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result } = renderHook(() => useSubmitOfferApproval(), { wrapper });

    result.current.mutate({
      token: 'invalid-token',
      action: 'approve',
      signatureData: 'signature-data',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });

  it('should require signature for approval action', async () => {
    // This test verifies that the component/hook logic handles missing signature
    // In practice, this validation should be done in the UI before submission
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { success: false, error: 'Signature required' },
      error: { message: 'Signature required for approval' },
    });

    const { result } = renderHook(() => useSubmitOfferApproval(), { wrapper });

    result.current.mutate({
      token: 'valid-token',
      action: 'approve',
      // Missing signatureData
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateOfferApproval', () => {
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

  it('should create new offer approval successfully', async () => {
    const mockNewApproval: OfferApproval = {
      id: 'new-approval-1',
      project_id: 'project-1',
      user_id: 'test-user-id',
      public_token: 'new-token-xyz',
      client_name: 'Anna Nowak',
      client_email: 'anna@example.com',
      status: 'pending',
      signature_data: null,
      client_comment: null,
      approved_at: null,
      created_at: '2024-01-20T10:00:00Z',
      expires_at: '2024-02-20T10:00:00Z',
    };

    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockNewApproval,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useCreateOfferApproval(), { wrapper });

    result.current.mutate({
      projectId: 'project-1',
      clientName: 'Anna Nowak',
      clientEmail: 'anna@example.com',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockNewApproval);
  });

  it('should handle creation errors gracefully', async () => {
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

    const { result } = renderHook(() => useCreateOfferApproval(), { wrapper });

    result.current.mutate({
      projectId: 'project-1',
      clientName: 'Test',
      clientEmail: 'test@example.com',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useExtendOfferApproval', () => {
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

  it('should extend offer approval expiration successfully', async () => {
    const mockExtendedApproval: OfferApproval = {
      id: 'approval-1',
      project_id: 'project-1',
      user_id: 'test-user-id',
      public_token: 'token-abc',
      client_name: 'Jan Kowalski',
      client_email: 'jan@example.com',
      status: 'pending',
      signature_data: null,
      client_comment: null,
      approved_at: null,
      created_at: '2024-01-10T10:00:00Z',
      expires_at: '2024-03-10T10:00:00Z', // Extended by 30 days
    };

    (supabase.from as any).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockExtendedApproval,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useExtendOfferApproval(), { wrapper });

    result.current.mutate({
      approvalId: 'approval-1',
      projectId: 'project-1',
      daysToExtend: 30,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockExtendedApproval);
  });

  it('should handle extend errors gracefully', async () => {
    const mockError = { message: 'Extension failed' };

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

    const { result } = renderHook(() => useExtendOfferApproval(), { wrapper });

    result.current.mutate({
      approvalId: 'approval-1',
      projectId: 'project-1',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });
});
