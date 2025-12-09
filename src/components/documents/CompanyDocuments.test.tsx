// ============================================
// COMPANY DOCUMENTS UPLOAD TESTS
// Phase 3 - UX & Reliability Polish
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyDocuments } from '@/components/documents/CompanyDocuments';
import { supabase } from '@/integrations/supabase/client';
import { validateFile, FILE_VALIDATION_CONFIGS } from '@/lib/fileValidation';
import { toast } from 'sonner';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
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
    document: {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      typeLabel: 'PDF, JPG, PNG',
    },
  },
}));

describe('CompanyDocuments', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // Mock empty documents query by default
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should show error toast when file validation fails', async () => {
    // Mock validation failure
    (validateFile as any).mockReturnValue({
      valid: false,
      error: 'Nieprawidłowy format pliku - dopuszczalne: PDF, JPG, PNG',
    });

    render(<CompanyDocuments />, { wrapper });

    // Open the dialog
    const addButton = screen.getByText('Dodaj dokument');
    fireEvent.click(addButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Dodaj nowy dokument')).toBeInTheDocument();
    });

    // Find the file input and simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const invalidFile = new File(['fake content'], 'document.exe', {
      type: 'application/exe',
    });

    // Trigger file selection
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Wait for validation error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Nieprawidłowy format pliku - dopuszczalne: PDF, JPG, PNG'
      );
    });
  });

  it('should show loading state during upload', async () => {
    // Mock successful validation
    (validateFile as any).mockReturnValue({
      valid: true,
    });

    // Mock slow upload to capture loading state
    let resolveUpload: any;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });

    const mockUpload = vi.fn().mockReturnValue(uploadPromise);
    (supabase.storage.from as any).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/doc.pdf' },
      }),
    });

    // Mock insert
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({
        error: null,
      }),
    });

    render(<CompanyDocuments />, { wrapper });

    // Open dialog
    const addButton = screen.getByText('Dodaj dokument');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Dodaj nowy dokument')).toBeInTheDocument();
    });

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(['fake pdf content'], 'document.pdf', {
      type: 'application/pdf',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText('Przesyłanie...')).toBeInTheDocument();
    });

    // Check that button is disabled
    const uploadButton = screen.getByText('Przesyłanie...').closest('button');
    expect(uploadButton).toBeDisabled();

    // Resolve upload
    resolveUpload({ error: null });

    // Wait for loading state to clear
    await waitFor(() => {
      expect(screen.queryByText('Przesyłanie...')).not.toBeInTheDocument();
    });
  });

  it('should successfully upload valid document', async () => {
    // Mock successful validation
    (validateFile as any).mockReturnValue({
      valid: true,
    });

    // Mock successful upload
    const mockUpload = vi.fn().mockResolvedValue({
      error: null,
    });

    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/documents/test-doc.pdf' },
    });

    (supabase.storage.from as any).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    });

    // Mock successful insert
    const mockInsert = vi.fn().mockResolvedValue({
      error: null,
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'company_documents') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
          insert: mockInsert,
        };
      }
    });

    render(<CompanyDocuments />, { wrapper });

    // Open dialog
    const addButton = screen.getByText('Dodaj dokument');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Dodaj nowy dokument')).toBeInTheDocument();
    });

    // Simulate file selection
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(['fake pdf content'], 'document.pdf', {
      type: 'application/pdf',
    });

    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });

    // Verify success toast was shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Dokument został dodany');
    });
  });

  it('should display upload format hint to user', async () => {
    render(<CompanyDocuments />, { wrapper });

    // Open dialog
    const addButton = screen.getByText('Dodaj dokument');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Dodaj nowy dokument')).toBeInTheDocument();
    });

    // Check for format hint
    expect(screen.getByText(/Akceptowane formaty: PDF, JPG, PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/Max 10MB/i)).toBeInTheDocument();
  });
});
