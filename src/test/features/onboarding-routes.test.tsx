/**
 * onboarding-routes.test.tsx
 *
 * Weryfikuje, że kroki onboardingu prowadzą do właściwych tras.
 *
 * Kluczowe poprawki (sprint product-readiness-audit):
 *  - Krok 1 (Profil firmy): /app/profile — NIE /profile (stary redirect szedł do /app/settings)
 *  - Krok 3 (Pierwsza oferta): /app/offers/new — architektura offer-first
 *  - Krok 4 (Wyślij ofertę): /app/offers — lista ofert
 *  - Krok 5 (Eksport PDF): /app/offers — PDF generowany z poziomu oferty
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---------- Mock navigate ----------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------- Mock supabase ----------

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

// ---------- Mock AuthContext ----------

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' }, isLoading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------- Mock i18next ----------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pl', changeLanguage: vi.fn() },
  }),
}));

// ---------- Mock useOnboarding ----------

import { ONBOARDING_STEPS } from '@/hooks/useOnboarding';

vi.mock('@/hooks/useOnboarding', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useOnboarding')>();
  return {
    ...actual,
    useOnboardingProgress: () => ({
      data: { completed_steps: [], is_completed: false, skipped_at: null },
      isLoading: false,
    }),
    useSkipOnboarding: () => ({ mutateAsync: vi.fn() }),
  };
});

// ---------- Wrapper ----------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/app/dashboard']}>{children}</MemoryRouter>
);

// ---------- Tests ----------

describe('ONBOARDING_STEPS — definicje kroków', () => {
  it('krok 1 to Profil firmy', () => {
    expect(ONBOARDING_STEPS[0].id).toBe(1);
    expect(ONBOARDING_STEPS[0].titleKey).toBe('onboarding.steps.companyProfile.title');
  });

  it('krok 3 to Pierwsza oferta (architektura offer-first)', () => {
    expect(ONBOARDING_STEPS[2].id).toBe(3);
    expect(ONBOARDING_STEPS[2].titleKey).toBe('onboarding.steps.firstOffer.title');
  });

  it('krok 4 to Wyślij ofertę', () => {
    expect(ONBOARDING_STEPS[3].id).toBe(4);
    expect(ONBOARDING_STEPS[3].titleKey).toBe('onboarding.steps.sendOffer.title');
  });

  it('wszystkie 5 kroków jest zdefiniowanych', () => {
    expect(ONBOARDING_STEPS).toHaveLength(5);
  });
});

describe('OnboardingWizard — nawigacja do właściwych tras', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('krok 1 (Profil firmy) kieruje do /app/profile (nie /profile → /app/settings)', async () => {
    const { OnboardingWizard } = await import('@/components/onboarding/OnboardingWizard');

    render(<OnboardingWizard open={true} onClose={vi.fn()} />, { wrapper: Wrapper });

    // Krok 1 powinien być widoczny — kliknij "Start"
    const startButtons = screen.getAllByRole('button', { name: /onboarding\.startStep/i });
    // Pierwszy przycisk Start odpowiada krokowi 1
    fireEvent.click(startButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/app/profile');
    expect(mockNavigate).not.toHaveBeenCalledWith('/profile');
    expect(mockNavigate).not.toHaveBeenCalledWith('/app/settings');
  });

  it('krok 3 (Pierwsza oferta) kieruje do /app/offers/new', async () => {
    const { OnboardingWizard } = await import('@/components/onboarding/OnboardingWizard');

    render(<OnboardingWizard open={true} onClose={vi.fn()} />, { wrapper: Wrapper });

    const startButtons = screen.getAllByRole('button', { name: /onboarding\.startStep/i });
    // Trzeci przycisk Start odpowiada krokowi 3
    fireEvent.click(startButtons[2]);

    expect(mockNavigate).toHaveBeenCalledWith('/app/offers/new');
    expect(mockNavigate).not.toHaveBeenCalledWith('/projects/new');
    expect(mockNavigate).not.toHaveBeenCalledWith('/app/projects/new');
  });

  it('krok 4 (Wyślij ofertę) kieruje do /app/offers', async () => {
    const { OnboardingWizard } = await import('@/components/onboarding/OnboardingWizard');

    render(<OnboardingWizard open={true} onClose={vi.fn()} />, { wrapper: Wrapper });

    const startButtons = screen.getAllByRole('button', { name: /onboarding\.startStep/i });
    fireEvent.click(startButtons[3]);

    expect(mockNavigate).toHaveBeenCalledWith('/app/offers');
    expect(mockNavigate).not.toHaveBeenCalledWith('/projects');
  });
});
