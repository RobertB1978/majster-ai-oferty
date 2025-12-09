/**
 * Tests for OfferHistoryPanel - Phase 5C & 6A
 * Tests PDF link display and tracking status in offer send history
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfferHistoryPanel } from './OfferHistoryPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfferSend } from '@/hooks/useOfferSends';

// Mock the hooks
const mockUseOfferSends = vi.fn();
const mockUpdateMutate = vi.fn();
const mockUseUpdateOfferSend = vi.fn(() => ({
  mutate: mockUpdateMutate,
}));

vi.mock('@/hooks/useOfferSends', () => ({
  useOfferSends: (projectId: string) => mockUseOfferSends(projectId),
  useUpdateOfferSend: () => mockUseUpdateOfferSend(),
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
    tracking_status: null, // Phase 6A: null defaults to 'sent' in UI
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

describe('OfferHistoryPanel - Phase 6A Tracking Status', () => {
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
    tracking_status: null,
    error_message: null,
    sent_at: '2024-01-15T10:00:00Z',
    pdf_url: null,
    pdf_generated_at: null,
    ...overrides,
  });

  it('should display "Wysłano" badge when tracking_status is null (default)', () => {
    const sendWithNullStatus = createMockSend({
      tracking_status: null,
    });

    mockUseOfferSends.mockReturnValue({
      data: [sendWithNullStatus],
      isLoading: false,
    });

    renderPanel();

    const badge = screen.getByText('Wysłano');
    expect(badge).toBeInTheDocument();
  });

  it('should display "Zaakceptowano" badge when tracking_status is "accepted"', () => {
    const acceptedSend = createMockSend({
      tracking_status: 'accepted',
    });

    mockUseOfferSends.mockReturnValue({
      data: [acceptedSend],
      isLoading: false,
    });

    renderPanel();

    const badge = screen.getByText('Zaakceptowano');
    expect(badge).toBeInTheDocument();
  });

  it('should display "Odrzucono" badge when tracking_status is "rejected"', () => {
    const rejectedSend = createMockSend({
      tracking_status: 'rejected',
    });

    mockUseOfferSends.mockReturnValue({
      data: [rejectedSend],
      isLoading: false,
    });

    renderPanel();

    const badge = screen.getByText('Odrzucono');
    expect(badge).toBeInTheDocument();
  });

  it('should show dropdown menu button for status changes when status is "sent"', () => {
    const send = createMockSend({
      status: 'sent',
      tracking_status: 'sent',
    });

    mockUseOfferSends.mockReturnValue({
      data: [send],
      isLoading: false,
    });

    renderPanel();

    const dropdownButton = screen.getByTitle('Zmień status');
    expect(dropdownButton).toBeInTheDocument();
  });

  it('should NOT show dropdown menu button when status is "failed"', () => {
    const failedSend = createMockSend({
      status: 'failed',
      tracking_status: 'sent',
    });

    mockUseOfferSends.mockReturnValue({
      data: [failedSend],
      isLoading: false,
    });

    renderPanel();

    const dropdownButton = screen.queryByTitle('Zmień status');
    expect(dropdownButton).not.toBeInTheDocument();
  });

  it('should call update mutation with "accepted" when user clicks accept option', async () => {
    const user = userEvent.setup();
    const send = createMockSend({
      id: 'test-send-123',
      status: 'sent',
      tracking_status: 'sent',
    });

    mockUseOfferSends.mockReturnValue({
      data: [send],
      isLoading: false,
    });

    renderPanel('project-1');

    // Open dropdown
    const dropdownButton = screen.getByTitle('Zmień status');
    await user.click(dropdownButton);

    // Click "Zaakceptowano" option
    const acceptOption = screen.getByText('Zaakceptowano');
    await user.click(acceptOption);

    // Verify mutation was called with correct parameters
    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: 'test-send-123',
      projectId: 'project-1',
      tracking_status: 'accepted',
    });
  });

  it('should call update mutation with "rejected" when user clicks reject option', async () => {
    const user = userEvent.setup();
    const send = createMockSend({
      id: 'test-send-456',
      status: 'sent',
      tracking_status: 'sent',
    });

    mockUseOfferSends.mockReturnValue({
      data: [send],
      isLoading: false,
    });

    renderPanel('project-1');

    // Open dropdown
    const dropdownButton = screen.getByTitle('Zmień status');
    await user.click(dropdownButton);

    // Click "Odrzucono" option
    const rejectOption = screen.getByText('Odrzucono');
    await user.click(rejectOption);

    // Verify mutation was called with correct parameters
    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: 'test-send-456',
      projectId: 'project-1',
      tracking_status: 'rejected',
    });
  });
});
