// ============================================
// USEPROFILE TESTS
// Sprint 1 - Account & Company Profile
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfile, useUpdateProfile, useUploadLogo } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { validateFile, FILE_VALIDATION_CONFIGS } from '@/lib/fileValidation';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
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

// Mock file validation
vi.mock('@/lib/fileValidation', () => ({
  validateFile: vi.fn(),
  FILE_VALIDATION_CONFIGS: {
    logo: {
      maxSizeBytes: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      typeLabel: 'JPG, PNG, WEBP',
    },
  },
}));

describe('useProfile', () => {
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

  it('should fetch profile data successfully', async () => {
    const mockProfile = {
      id: 'profile-1',
      user_id: 'test-user-id',
      company_name: 'Test Company',
      owner_name: 'Jan Kowalski',
      nip: '1234567890',
      phone: '+48123456789',
      email_for_offers: 'test@company.pl',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (supabase as any).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProfile);
    expect(result.current.data?.company_name).toBe('Test Company');
  });

  it('should return null when profile does not exist', async () => {
    (supabase as any).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('should handle database errors gracefully', async () => {
    const mockError = { message: 'Database connection failed' };

    (supabase as any).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });

  it('should not fetch when user is not authenticated', () => {
    // Mock useAuth to return null user
    vi.mock('@/contexts/AuthContext', () => ({
      useAuth: () => ({ user: null }),
    }));

    const { result } = renderHook(() => useProfile(), { wrapper });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useUpdateProfile', () => {
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

  it('should update existing profile successfully', async () => {
    const mockUpdatedProfile = {
      id: 'profile-1',
      user_id: 'test-user-id',
      company_name: 'Updated Company',
      nip: '9876543210',
    };

    // Mock existing profile check
    (supabase as any).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'profile-1' },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUpdatedProfile,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({ company_name: 'Updated Company', nip: '9876543210' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUpdatedProfile);
  });

  it('should create new profile when profile does not exist', async () => {
    const mockNewProfile = {
      id: 'profile-new',
      user_id: 'test-user-id',
      company_name: 'New Company',
    };

    // Mock no existing profile
    (supabase as any).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockNewProfile,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({ company_name: 'New Company' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockNewProfile);
  });

  it('should handle update errors and show toast', async () => {
    const mockError = { message: 'Update failed' };

    (supabase as any).from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'profile-1' },
            error: null,
          }),
        }),
      }),
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

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({ company_name: 'Test' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(mockError);
  });
});

describe('useUploadLogo', () => {
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

  it('should reject file that is too large', async () => {
    // Mock file validation to return error
    (validateFile as any).mockReturnValue({
      valid: false,
      error: 'Plik za duży - maksymalny rozmiar to 2 MB',
    });

    const { result } = renderHook(() => useUploadLogo(), { wrapper });

    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large-logo.png', {
      type: 'image/png',
    });

    result.current.mutate(largeFile);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe(
      'Plik za duży - maksymalny rozmiar to 2 MB'
    );
  });

  it('should reject file with invalid type', async () => {
    // Mock file validation to return error
    (validateFile as any).mockReturnValue({
      valid: false,
      error: 'Nieprawidłowy format pliku - dopuszczalne: JPG, PNG, WEBP',
    });

    const { result } = renderHook(() => useUploadLogo(), { wrapper });

    const invalidFile = new File(['fake pdf content'], 'logo.pdf', {
      type: 'application/pdf',
    });

    result.current.mutate(invalidFile);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toContain('Nieprawidłowy format');
  });

  it('should successfully upload valid logo file', async () => {
    // Mock successful validation
    (validateFile as any).mockReturnValue({
      valid: true,
    });

    // Mock Supabase storage operations
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/logos/test-user-id/logo.png' },
    });

    const mockUpload = vi.fn().mockResolvedValue({
      error: null,
    });

    const mockUpdate = vi.fn().mockResolvedValue({
      error: null,
    });

    (supabase.storage.from as any).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    });

    // Mock supabase.from for profile update
    (supabase as any).from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    const { result } = renderHook(() => useUploadLogo(), { wrapper });

    const validFile = new File(['fake image data'], 'logo.png', {
      type: 'image/png',
    });

    result.current.mutate(validFile);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify upload was called
    expect(mockUpload).toHaveBeenCalledWith(
      'test-user-id/logo.png',
      validFile,
      { upsert: true }
    );

    // Verify public URL was retrieved
    expect(mockGetPublicUrl).toHaveBeenCalledWith('test-user-id/logo.png');
  });

  it('should handle upload errors gracefully', async () => {
    // Mock successful validation
    (validateFile as any).mockReturnValue({
      valid: true,
    });

    // Mock Supabase storage upload error
    const mockUpload = vi.fn().mockResolvedValue({
      error: { message: 'Storage quota exceeded' },
    });

    (supabase.storage.from as any).mockReturnValue({
      upload: mockUpload,
    });

    const { result } = renderHook(() => useUploadLogo(), { wrapper });

    const validFile = new File(['fake image data'], 'logo.png', {
      type: 'image/png',
    });

    result.current.mutate(validFile);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });

  it('should invalidate profile query on success', async () => {
    // Mock successful validation
    (validateFile as any).mockReturnValue({
      valid: true,
    });

    // Mock Supabase operations
    (supabase.storage.from as any).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/logo.png' },
      }),
    });

    (supabase as any).from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUploadLogo(), { wrapper });

    const validFile = new File(['fake image data'], 'logo.png', {
      type: 'image/png',
    });

    result.current.mutate(validFile);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that profile queries were invalidated
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['profile'],
    });
  });
});
