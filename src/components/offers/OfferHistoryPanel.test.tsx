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

describe('OfferHistoryPanel - Phase 6C Follow-up', () => {
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

  it('should display follow-up legend with all categories', () => {
    const send = createMockSend();

    mockUseOfferSends.mockReturnValue({
      data: [send],
      isLoading: false,
    });

    renderPanel();

    // Sprawdź nagłówek legendy
    expect(screen.getByText('Legenda follow-up')).toBeInTheDocument();

    // Sprawdź wszystkie kategorie w legendzie
    const zamknieta = screen.getAllByText('Zamknięta');
    expect(zamknieta.length).toBeGreaterThan(0);

    const nowa = screen.getAllByText('Nowa');
    expect(nowa.length).toBeGreaterThan(0);

    const nieotwarta = screen.getAllByText('Do follow-up (nieotwarta)');
    expect(nieotwarta.length).toBeGreaterThan(0);

    const brakDecyzji = screen.getAllByText('Do follow-up (brak decyzji)');
    expect(brakDecyzji.length).toBeGreaterThan(0);
  });

  it('should display "Tylko follow-up" filter button', () => {
    const send = createMockSend();

    mockUseOfferSends.mockReturnValue({
      data: [send],
      isLoading: false,
    });

    renderPanel();

    // Przycisk filtra powinien być widoczny
    const filterButton = screen.getByText('Tylko follow-up');
    expect(filterButton).toBeInTheDocument();
  });

  it('should change filter button text to "Wszystkie" when clicked', async () => {
    const user = userEvent.setup();
    const send = createMockSend();

    mockUseOfferSends.mockReturnValue({
      data: [send],
      isLoading: false,
    });

    renderPanel();

    // Kliknij przycisk filtra
    const filterButton = screen.getByText('Tylko follow-up');
    await user.click(filterButton);

    // Tekst powinien się zmienić
    expect(screen.getByText('Wszystkie')).toBeInTheDocument();
    expect(screen.queryByText('Tylko follow-up')).not.toBeInTheDocument();
  });

  it('should filter sends to show only follow-up when filter is active', async () => {
    const user = userEvent.setup();
    const now = new Date('2025-12-09T12:00:00Z');

    // Utwórz 4 różne wysyłki z różnymi kategoriami follow-up
    const freshSend = createMockSend({
      id: 'fresh-1',
      client_email: 'fresh@test.com',
      tracking_status: 'sent',
      sent_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dzień temu
    });

    const notOpenedSend = createMockSend({
      id: 'not-opened-1',
      client_email: 'notopened@test.com',
      tracking_status: 'sent',
      sent_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dni temu
    });

    const noDecisionSend = createMockSend({
      id: 'no-decision-1',
      client_email: 'nodecision@test.com',
      tracking_status: 'opened',
      sent_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 dni temu
    });

    const acceptedSend = createMockSend({
      id: 'accepted-1',
      client_email: 'accepted@test.com',
      tracking_status: 'accepted',
      sent_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 dni temu
    });

    mockUseOfferSends.mockReturnValue({
      data: [freshSend, notOpenedSend, noDecisionSend, acceptedSend],
      isLoading: false,
    });

    renderPanel();

    // Na początku wszystkie 4 wysyłki są widoczne
    expect(screen.getByText('fresh@test.com')).toBeInTheDocument();
    expect(screen.getByText('notopened@test.com')).toBeInTheDocument();
    expect(screen.getByText('nodecision@test.com')).toBeInTheDocument();
    expect(screen.getByText('accepted@test.com')).toBeInTheDocument();

    // Kliknij filtr
    const filterButton = screen.getByText('Tylko follow-up');
    await user.click(filterButton);

    // Po filtrowaniu tylko 2 wysyłki wymagające follow-up są widoczne
    expect(screen.queryByText('fresh@test.com')).not.toBeInTheDocument();
    expect(screen.getByText('notopened@test.com')).toBeInTheDocument();
    expect(screen.getByText('nodecision@test.com')).toBeInTheDocument();
    expect(screen.queryByText('accepted@test.com')).not.toBeInTheDocument();
  });

  it('should show "Brak ofert wymagających follow-up" when filter active and no follow-up sends', async () => {
    const user = userEvent.setup();
    const now = new Date('2025-12-09T12:00:00Z');

    // Tylko świeże i zamknięte wysyłki (żadna nie wymaga follow-up)
    const freshSend = createMockSend({
      id: 'fresh-1',
      tracking_status: 'sent',
      sent_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const acceptedSend = createMockSend({
      id: 'accepted-1',
      tracking_status: 'accepted',
      sent_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    });

    mockUseOfferSends.mockReturnValue({
      data: [freshSend, acceptedSend],
      isLoading: false,
    });

    renderPanel();

    // Kliknij filtr
    const filterButton = screen.getByText('Tylko follow-up');
    await user.click(filterButton);

    // Powinien pokazać komunikat
    expect(screen.getByText('Brak ofert wymagających follow-up')).toBeInTheDocument();
  });

  it('should display follow-up badge for each send', () => {
    const now = new Date('2025-12-09T12:00:00Z');

    const notOpenedSend = createMockSend({
      id: 'not-opened-1',
      client_email: 'notopened@test.com',
      tracking_status: 'sent',
      sent_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dni temu = followup_not_opened
    });

    mockUseOfferSends.mockReturnValue({
      data: [notOpenedSend],
      isLoading: false,
    });

    renderPanel();

    // Badge follow-up powinien być widoczny (oprócz legendy)
    const badges = screen.getAllByText('Do follow-up (nieotwarta)');
    expect(badges.length).toBeGreaterThan(1); // W legendzie i przy wysyłce
  });
});
