// ============================================
// PDF PREVIEW PANEL TESTS
// Phase 4 - Bug fixes and type safety
// ============================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
