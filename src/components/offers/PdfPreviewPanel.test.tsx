// ============================================
// PDF PREVIEW PANEL TESTS
// Phase 4 - Bug fixes and type safety
// Phase 5B - PDF generation functionality
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PdfPreviewPanel } from './PdfPreviewPanel';

// Mock hooks
vi.mock('@/hooks/usePdfData', () => ({
  usePdfData: vi.fn(() => ({
    data: {
      version: 'standard',
      title: 'Oferta testowa',
      offer_text: 'Tekst oferty testowej',
      terms: 'Warunki testowe',
      deadline_text: 'Termin testowy',
    },
    isLoading: false,
  })),
  useSavePdfData: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useQuotes', () => ({
  useQuote: vi.fn(() => ({
    data: {
      id: 'test-quote-id',
      project_id: 'test-project-id',
      user_id: 'test-user-id',
      positions: [
        {
          id: 'pos-1',
          name: 'Pozycja testowa',
          qty: 10,
          unit: 'szt',
          price: 100,
          category: 'Materiał',
        },
      ],
      summary_materials: 1000,
      summary_labor: 500,
      margin_percent: 20,
      total: 1800,
      created_at: '2024-01-01',
    },
  })),
  QuotePosition: {} as any,
}));

vi.mock('@/hooks/useProjects', () => ({
  useProject: vi.fn(() => ({
    data: {
      id: 'test-project-id',
      project_name: 'Projekt testowy',
      clients: {
        name: 'Klient testowy',
        address: 'ul. Testowa 1, 00-000 Test',
      },
    },
  })),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(() => ({
    data: {
      company_name: 'Firma testowa',
      nip: '1234567890',
      street: 'ul. Testowa 1',
      postal_code: '00-000',
      city: 'Warszawa',
      logo_url: null,
    },
  })),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
  })),
}));

// Mock PDF generation functions
const mockGenerateOfferPdf = vi.fn();
const mockUploadOfferPdf = vi.fn();

vi.mock('@/lib/offerPdfGenerator', () => ({
  generateOfferPdf: mockGenerateOfferPdf,
  uploadOfferPdf: mockUploadOfferPdf,
}));

vi.mock('@/lib/offerDataBuilder', () => ({
  buildOfferData: vi.fn((params) => ({
    projectId: params.projectId,
    projectName: params.projectName,
    company: { name: 'Test Company' },
    client: null,
    quote: params.quote,
    pdfConfig: {
      version: 'standard',
      title: 'Test Offer',
      offerText: 'Test offer text',
      terms: 'Test terms',
      deadlineText: 'Test deadline',
    },
    generatedAt: new Date(),
  })),
}));

describe('PdfPreviewPanel', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it('should render with initialized data from pdfData', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PdfPreviewPanel projectId="test-project-id" />
      </QueryClientProvider>
    );

    // Check if component renders with title
    expect(screen.getByText('Podgląd oferty PDF')).toBeInTheDocument();

    // Check if data is displayed
    expect(screen.getByText('Skonfigurowana')).toBeInTheDocument();
    expect(screen.getByText('Oferta testowa')).toBeInTheDocument();
    expect(screen.getByText('Tekst oferty testowej')).toBeInTheDocument();
  });

  it('should display quote total when quote data is available', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PdfPreviewPanel projectId="test-project-id" />
      </QueryClientProvider>
    );

    // Check if quote total is displayed
    expect(screen.getByText('Wartość oferty')).toBeInTheDocument();
    // formatCurrency(1800) should contain "1" and "800"
    expect(screen.getByText(/1.*800/)).toBeInTheDocument();
  });

  // ============================================
  // PHASE 5B - PDF GENERATION TESTS
  // ============================================

  it('should show "Generuj PDF" button when not in edit mode', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <PdfPreviewPanel projectId="test-project-id" />
      </QueryClientProvider>
    );

    const generateButton = screen.getByRole('button', { name: /Generuj PDF/i });
    expect(generateButton).toBeInTheDocument();
    expect(generateButton).not.toBeDisabled();
  });

  it('should disable "Generuj PDF" button when quote is missing', async () => {
    // Mock useQuote to return null for this specific test
    const useQuoteMocks = await import('@/hooks/useQuotes');
    vi.mocked(useQuoteMocks.useQuote).mockReturnValueOnce({ data: null } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <PdfPreviewPanel projectId="test-project-id" />
      </QueryClientProvider>
    );

    const generateButton = screen.getByRole('button', { name: /Generuj PDF/i });
    expect(generateButton).toBeDisabled();
  });

  it('should call generateOfferPdf and uploadOfferPdf when "Generuj PDF" is clicked', async () => {
    const user = userEvent.setup();
    const mockPdfBlob = new Blob(['test pdf'], { type: 'application/pdf' });
    mockGenerateOfferPdf.mockResolvedValue(mockPdfBlob);
    mockUploadOfferPdf.mockResolvedValue({
      storagePath: 'test-user-id/offers/test-project-id/oferta-123.pdf',
      publicUrl: 'https://storage.example.com/test.pdf',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PdfPreviewPanel projectId="test-project-id" />
      </QueryClientProvider>
    );

    const generateButton = screen.getByRole('button', { name: /Generuj PDF/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(mockGenerateOfferPdf).toHaveBeenCalledTimes(1);
      expect(mockUploadOfferPdf).toHaveBeenCalledTimes(1);
    });
  });

  it('should show loading state during PDF generation', async () => {
    const user = userEvent.setup();
    mockGenerateOfferPdf.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(new Blob()), 100))
    );
    mockUploadOfferPdf.mockResolvedValue({
      storagePath: 'test.pdf',
      publicUrl: 'https://storage.example.com/test.pdf',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PdfPreviewPanel projectId="test-project-id" />
      </QueryClientProvider>
    );

    const generateButton = screen.getByRole('button', { name: /Generuj PDF/i });
    await user.click(generateButton);

    // Check for loading state
    expect(screen.getByText(/Generowanie.../i)).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(mockUploadOfferPdf).toHaveBeenCalled();
    });
  });

  it('should display success message and PDF link after generation', async () => {
    const user = userEvent.setup();
    const mockPdfBlob = new Blob(['test pdf'], { type: 'application/pdf' });
    mockGenerateOfferPdf.mockResolvedValue(mockPdfBlob);
    mockUploadOfferPdf.mockResolvedValue({
      storagePath: 'test-user-id/offers/test-project-id/oferta-123.pdf',
      publicUrl: 'https://storage.example.com/test-offer.pdf',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PdfPreviewPanel projectId="test-project-id" />
      </QueryClientProvider>
    );

    const generateButton = screen.getByRole('button', { name: /Generuj PDF/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('PDF oferty został wygenerowany')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Otwórz PDF/i })).toBeInTheDocument();
    });
  });
});
