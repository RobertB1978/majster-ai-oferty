import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import Register from './Register';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/legal/acceptance', () => ({
  fetchSignupRequiredDocs: vi.fn(),
  storePendingAcceptances: vi.fn(),
}));

vi.mock('@/components/auth/TurnstileWidget', () => ({
  TurnstileWidget: () => null,
  isCaptchaEnabled: false,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  ANALYTICS_EVENTS: { SIGNUP_STARTED: 'signup_started', SIGNUP_COMPLETED: 'signup_completed' },
}));

vi.mock('@/lib/siteUrl', () => ({
  getSiteUrl: () => 'https://majster.ai',
}));

vi.mock('@/config/featureFlags', () => ({
  CANONICAL_HOME: '/dashboard',
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_DOCS = [
  { id: 'uuid-terms-001', slug: 'terms', version: '1.0', title: 'Regulamin' },
  { id: 'uuid-privacy-001', slug: 'privacy', version: '1.0', title: 'Prywatność' },
];

async function setupMocks() {
  const { useAuth } = await import('@/contexts/AuthContext');
  const { fetchSignupRequiredDocs } = await import('@/lib/legal/acceptance');

  vi.mocked(useAuth).mockReturnValue({
    user: null,
    session: null,
    isLoading: false,
    register: vi.fn().mockResolvedValue({ error: null }),
    logout: vi.fn(),
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    loginWithApple: vi.fn(),
    resendVerificationEmail: vi.fn(),
  });

  vi.mocked(fetchSignupRequiredDocs).mockResolvedValue(SAMPLE_DOCS);
}

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/^hasło$/i), 'StrongPass1!');
  await userEvent.type(screen.getByLabelText(/potwierdź hasło/i), 'StrongPass1!');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Register — legal consent validation', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it('shows inline error for terms when submitted without checking terms checkbox', async () => {
    render(<Register />);

    // Wait for legal docs to load (checkboxes enabled)
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /regulamin/i })).not.toBeDisabled();
    });

    await fillRequiredFields();

    // Check only privacy, leave terms unchecked
    fireEvent.click(screen.getByRole('checkbox', { name: /polityk/i }));

    fireEvent.click(screen.getByRole('button', { name: /załóż konto/i }));

    await waitFor(() => {
      expect(screen.getByText(/wymagana akceptacja regulaminu/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/wymagana akceptacja polityki/i)).not.toBeInTheDocument();
  });

  it('shows inline error for privacy when submitted without checking privacy checkbox', async () => {
    render(<Register />);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /regulamin/i })).not.toBeDisabled();
    });

    await fillRequiredFields();

    // Check only terms, leave privacy unchecked
    fireEvent.click(screen.getByRole('checkbox', { name: /regulamin/i }));

    fireEvent.click(screen.getByRole('button', { name: /załóż konto/i }));

    await waitFor(() => {
      expect(screen.getByText(/wymagana akceptacja polityki/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/wymagana akceptacja regulaminu/i)).not.toBeInTheDocument();
  });

  it('shows both inline errors when neither checkbox is checked', async () => {
    render(<Register />);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /regulamin/i })).not.toBeDisabled();
    });

    await fillRequiredFields();

    // Submit without checking either checkbox
    fireEvent.click(screen.getByRole('button', { name: /załóż konto/i }));

    await waitFor(() => {
      expect(screen.getByText(/wymagana akceptacja regulaminu/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/wymagana akceptacja polityki/i)).toBeInTheDocument();
  });

  it('calls register() when both checkboxes are checked and form is valid', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    const mockRegister = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      register: mockRegister,
      logout: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      loginWithApple: vi.fn(),
      resendVerificationEmail: vi.fn(),
    });

    render(<Register />);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /regulamin/i })).not.toBeDisabled();
    });

    await fillRequiredFields();

    fireEvent.click(screen.getByRole('checkbox', { name: /regulamin/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /polityk/i }));

    fireEvent.click(screen.getByRole('button', { name: /załóż konto/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'StrongPass1!');
    });
  });

  it('clears terms error when terms checkbox is subsequently checked', async () => {
    render(<Register />);

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /regulamin/i })).not.toBeDisabled();
    });

    await fillRequiredFields();

    // Submit without checking — trigger errors
    fireEvent.click(screen.getByRole('button', { name: /załóż konto/i }));

    await waitFor(() => {
      expect(screen.getByText(/wymagana akceptacja regulaminu/i)).toBeInTheDocument();
    });

    // Now check terms
    fireEvent.click(screen.getByRole('checkbox', { name: /regulamin/i }));

    await waitFor(() => {
      expect(screen.queryByText(/wymagana akceptacja regulaminu/i)).not.toBeInTheDocument();
    });
  });
});
