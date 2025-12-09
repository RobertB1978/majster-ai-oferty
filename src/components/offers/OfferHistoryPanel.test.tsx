/**
 * Tests for OfferHistoryPanel - Phase 5C
 * Tests PDF link display in offer send history
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfferHistoryPanel } from './OfferHistoryPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfferSend } from '@/hooks/useOfferSends';

// Mock the useOfferSends hook
const mockUseOfferSends = vi.fn();
vi.mock('@/hooks/useOfferSends', () => ({
  useOfferSends: (projectId: string) => mockUseOfferSends(projectId),
}));

describe('OfferHistoryPanel - PDF Link Display', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderPanel = (projectId: string = 'project-1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <OfferHistoryPanel projectId={projectId} />
      </QueryClientProvider>
    );
  };

  const createMockSend = (overrides?: Partial<OfferSend>): OfferSend => ({
    id: 'send-1',
    project_id: 'project-1',
    user_id: 'user-1',
    client_email: 'client@example.com',
    subject: 'Oferta - Test Project',
    message: 'Test message',
    status: 'sent',
    error_message: null,
    sent_at: '2024-01-15T10:00:00Z',
    pdf_url: null,
    pdf_generated_at: null,
    ...overrides,
  });

  it('should display PDF button when pdf_url is available', () => {
    const sendWithPdf = createMockSend({
      pdf_url: 'https://storage.example.com/user-1/offers/project-1/offer.pdf',
      pdf_generated_at: '2024-01-15T09:55:00Z',
    });

    mockUseOfferSends.mockReturnValue({
      data: [sendWithPdf],
      isLoading: false,
    });

    renderPanel();

    const pdfButton = screen.getByRole('button', { name: /PDF/i });
    expect(pdfButton).toBeInTheDocument();
    expect(pdfButton).toHaveAttribute('title', 'Otwórz PDF oferty');
  });

  it('should NOT display PDF button when pdf_url is null', () => {
    const sendWithoutPdf = createMockSend({
      pdf_url: null,
    });

    mockUseOfferSends.mockReturnValue({
      data: [sendWithoutPdf],
      isLoading: false,
    });

    renderPanel();

    const pdfButton = screen.queryByRole('button', { name: /PDF/i });
    expect(pdfButton).not.toBeInTheDocument();
  });

  it('should open PDF in new tab when PDF button is clicked', async () => {
    const user = userEvent.setup();
    const pdfUrl = 'https://storage.example.com/test-offer.pdf';
    const sendWithPdf = createMockSend({ pdf_url: pdfUrl });

    mockUseOfferSends.mockReturnValue({
      data: [sendWithPdf],
      isLoading: false,
    });

    // Mock window.open
    const mockWindowOpen = vi.fn();
    vi.stubGlobal('window', { ...window, open: mockWindowOpen });

    renderPanel();

    const pdfButton = screen.getByRole('button', { name: /PDF/i });
    await user.click(pdfButton);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      pdfUrl,
      '_blank',
      'noopener,noreferrer'
    );

    vi.unstubAllGlobals();
  });

  it('should display multiple sends with mixed PDF availability', () => {
    const sends: OfferSend[] = [
      createMockSend({
        id: 'send-1',
        client_email: 'client1@test.com',
        pdf_url: 'https://storage.example.com/offer-1.pdf',
        sent_at: '2024-01-15T10:00:00Z',
      }),
      createMockSend({
        id: 'send-2',
        client_email: 'client2@test.com',
        pdf_url: null, // No PDF
        sent_at: '2024-01-14T15:30:00Z',
      }),
      createMockSend({
        id: 'send-3',
        client_email: 'client3@test.com',
        pdf_url: 'https://storage.example.com/offer-3.pdf',
        sent_at: '2024-01-13T09:00:00Z',
      }),
    ];

    mockUseOfferSends.mockReturnValue({
      data: sends,
      isLoading: false,
    });

    renderPanel();

    // Should have 2 PDF buttons (for send-1 and send-3)
    const pdfButtons = screen.getAllByRole('button', { name: /PDF/i });
    expect(pdfButtons).toHaveLength(2);

    // Should display all 3 emails
    expect(screen.getByText('client1@test.com')).toBeInTheDocument();
    expect(screen.getByText('client2@test.com')).toBeInTheDocument();
    expect(screen.getByText('client3@test.com')).toBeInTheDocument();
  });

  it('should not render panel when no sends exist', () => {
    mockUseOfferSends.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { container } = renderPanel();

    expect(container).toBeEmptyDOMElement();
  });

  it('should show loading state while fetching sends', () => {
    mockUseOfferSends.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderPanel();

    // Should show loader (Loader2 icon is rendered)
    const loader = screen.getByRole('generic'); // Card content with loader
    expect(loader).toBeInTheDocument();
  });
});
