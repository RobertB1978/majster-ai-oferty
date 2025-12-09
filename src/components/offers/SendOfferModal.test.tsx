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

// Mock useQuote hook
vi.mock('@/hooks/useQuotes', () => ({
  useQuote: () => ({
    data: {
      total: 15000,
      positions: [],
    },
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

  // Phase 7A: Quote Validation Tests
  describe('Quote Validation (Phase 7A)', () => {
    it('should prevent sending offer when quote is missing', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      // Mock useQuote to return null (no quote)
      vi.doMock('@/hooks/useQuotes', () => ({
        useQuote: () => ({
          data: null,
        }),
      }));

      renderModal();

      const emailInput = screen.getByLabelText(/Adres e-mail odbiorcy/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /Wyślij/i });
      await user.click(sendButton);

      // Should show error toast
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Najpierw utwórz wycenę dla tego projektu');
      });

      // Edge function should NOT be called
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should prevent sending offer when quote has no positions', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      // Mock useQuote to return quote with empty positions
      vi.doMock('@/hooks/useQuotes', () => ({
        useQuote: () => ({
          data: {
            total: 0,
            positions: [], // Empty array
          },
        }),
      }));

      renderModal();

      const emailInput = screen.getByLabelText(/Adres e-mail odbiorcy/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');

      const sendButton = screen.getByRole('button', { name: /Wyślij/i });
      await user.click(sendButton);

      // Should show error toast
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Najpierw utwórz wycenę dla tego projektu');
      });

      // Edge function should NOT be called
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  // Phase 6B: Email Templates Tests
  describe('Email Templates (Phase 6B)', () => {
    it('should display template selector', () => {
      renderModal();
      expect(screen.getByText(/Szablon wiadomości/i)).toBeInTheDocument();
      expect(screen.getByText(/opcjonalnie/i)).toBeInTheDocument();
    });

    it('should list all available templates', async () => {
      const user = userEvent.setup();
      renderModal();

      const templateSelect = screen.getByRole('combobox', {
        name: /Szablon wiadomości/i,
      });
      await user.click(templateSelect);

      // Check for template names
      await waitFor(() => {
        expect(screen.getByText('Budowlanka ogólna')).toBeInTheDocument();
        expect(screen.getByText('Remont / Wykończenie')).toBeInTheDocument();
        expect(screen.getByText('Hydraulika')).toBeInTheDocument();
        expect(screen.getByText('Elektryka')).toBeInTheDocument();
      });
    });

    it('should apply selected template to message', async () => {
      const user = userEvent.setup();
      renderModal();

      const templateSelect = screen.getByRole('combobox', {
        name: /Szablon wiadomości/i,
      });
      await user.click(templateSelect);

      // Select "Budowlanka ogólna" template
      const generalTemplate = await screen.findByText('Budowlanka ogólna');
      await user.click(generalTemplate);

      // Check that message textarea contains template content
      const messageTextarea = screen.getByLabelText(/Treść wiadomości/i);
      expect(messageTextarea).toHaveValue(expect.stringContaining('Test Project'));
      expect(messageTextarea).toHaveValue(expect.stringContaining('Jan Kowalski'));
    });

    it('should show confirmation indicator when template is selected', async () => {
      const user = userEvent.setup();
      renderModal();

      const templateSelect = screen.getByRole('combobox', {
        name: /Szablon wiadomości/i,
      });
      await user.click(templateSelect);

      const generalTemplate = await screen.findByText('Budowlanka ogólna');
      await user.click(generalTemplate);

      await waitFor(() => {
        expect(
          screen.getByText(/Szablon zastosowany. Możesz dalej edytować treść/i)
        ).toBeInTheDocument();
      });
    });

    it('should allow manual editing after template selection', async () => {
      const user = userEvent.setup();
      renderModal();

      // Select a template
      const templateSelect = screen.getByRole('combobox', {
        name: /Szablon wiadomości/i,
      });
      await user.click(templateSelect);
      const generalTemplate = await screen.findByText('Budowlanka ogólna');
      await user.click(generalTemplate);

      // Edit the message
      const messageTextarea = screen.getByLabelText(/Treść wiadomości/i);
      await user.clear(messageTextarea);
      await user.type(messageTextarea, 'Custom message after template');

      expect(messageTextarea).toHaveValue('Custom message after template');
    });

    it('should work without selecting template (backward compatibility)', () => {
      renderModal();

      // Message should have default content from Phase 5A
      const messageTextarea = screen.getByLabelText(/Treść wiadomości/i);
      expect(messageTextarea).toHaveValue(expect.stringContaining('Szanowny Kliencie'));
      expect(messageTextarea).toHaveValue(expect.stringContaining('Test Project'));
    });

    it('should include quote total in template when available', async () => {
      const user = userEvent.setup();
      renderModal();

      const templateSelect = screen.getByRole('combobox', {
        name: /Szablon wiadomości/i,
      });
      await user.click(templateSelect);
      const generalTemplate = await screen.findByText('Budowlanka ogólna');
      await user.click(generalTemplate);

      const messageTextarea = screen.getByLabelText(/Treść wiadomości/i);
      // Should contain formatted price from mocked quote (15000 PLN)
      expect(messageTextarea).toHaveValue(expect.stringContaining('15'));
    });
  });
});
