/**
 * Tests for SendOfferModal - Phase 5C
 * Tests PDF URL integration with email sending
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SendOfferModal } from './SendOfferModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    data: {
      company_name: 'Test Company',
      email_subject_template: 'Oferta od {company_name}',
      email_greeting: 'Szanowny Kliencie,',
      email_signature: 'Z poważaniem',
      phone: '+48 123 456 789',
    },
  }),
}));

vi.mock('@/hooks/useOfferSends', () => ({
  useCreateOfferSend: () => ({
    mutateAsync: vi.fn(() =>
      Promise.resolve({ id: 'send-123', project_id: 'project-1' })
    ),
    isPending: false,
  }),
  useUpdateOfferSend: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// Mock Supabase client
const mockInvoke = vi.fn(() => Promise.resolve({ data: { success: true }, error: null }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SendOfferModal - PDF URL Integration', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    projectId: 'project-1',
    projectName: 'Test Project',
    clientEmail: 'client@example.com',
    clientName: 'Jan Kowalski',
  };

  const renderModal = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SendOfferModal {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display PDF attachment info when pdfUrl is provided', () => {
    renderModal({ pdfUrl: 'https://storage.example.com/test.pdf' });

    expect(
      screen.getByText(/PDF oferty zostanie dołączony do wiadomości/i)
    ).toBeInTheDocument();
  });

  it('should NOT display PDF attachment info when pdfUrl is not provided', () => {
    renderModal({ pdfUrl: undefined });

    expect(
      screen.queryByText(/PDF oferty zostanie dołączony/i)
    ).not.toBeInTheDocument();
  });

  it('should show instruction to generate PDF when pdfUrl is missing', () => {
    renderModal({ pdfUrl: undefined });

    expect(
      screen.getByText(/Aby dołączyć PDF, najpierw wygeneruj go/i)
    ).toBeInTheDocument();
  });

  it('should pass pdfUrl to edge function when sending email', async () => {
    const user = userEvent.setup();
    const pdfUrl = 'https://storage.example.com/offer-123.pdf';

    renderModal({ pdfUrl });

    // Fill in form
    const emailInput = screen.getByLabelText(/Adres e-mail odbiorcy/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');

    // Click send button
    const sendButton = screen.getByRole('button', { name: /Wyślij/i });
    await user.click(sendButton);

    // Verify edge function was called with pdfUrl
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'send-offer-email',
        expect.objectContaining({
          body: expect.objectContaining({
            pdfUrl: pdfUrl,
          }),
        })
      );
    });
  });

  it('should NOT pass pdfUrl to edge function when not provided', async () => {
    const user = userEvent.setup();

    renderModal({ pdfUrl: undefined });

    // Fill in form
    const emailInput = screen.getByLabelText(/Adres e-mail odbiorcy/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');

    // Click send button
    const sendButton = screen.getByRole('button', { name: /Wyślij/i });
    await user.click(sendButton);

    // Verify edge function was called WITHOUT pdfUrl (or with undefined)
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'send-offer-email',
        expect.objectContaining({
          body: expect.not.objectContaining({
            pdfUrl: expect.any(String),
          }),
        })
      );
    });
  });

  it('should include offerSendId in edge function call for DB update', async () => {
    const user = userEvent.setup();
    const pdfUrl = 'https://storage.example.com/offer-456.pdf';

    renderModal({ pdfUrl });

    const emailInput = screen.getByLabelText(/Adres e-mail odbiorcy/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'client@test.com');

    const sendButton = screen.getByRole('button', { name: /Wyślij/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'send-offer-email',
        expect.objectContaining({
          body: expect.objectContaining({
            offerSendId: 'send-123', // From mocked useCreateOfferSend
            pdfUrl: pdfUrl,
          }),
        })
      );
    });
  });
});
