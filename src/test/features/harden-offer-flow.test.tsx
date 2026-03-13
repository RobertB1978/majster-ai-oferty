/**
 * harden-offer-flow.test.tsx
 *
 * Fix-pack: harden-offer-flow-MLCqR
 *
 * Weryfikuje kluczowe zmiany z paczki hardeningowej:
 *
 * 1. QuoteCreationHub — tylko 2 tryby (Quick + Manual), brak zduplikowanego AI
 * 2. QuoteCreationHub — "Szybka wycena" → /app/szybka-wycena
 * 3. QuoteCreationHub — "Ręcznie" → /app/offers/new
 * 4. OfferPreviewModal.buildAcceptanceLinkUrl — nigdy nie zwraca wewnętrznej ścieżki
 * 5. EmptyDashboard — główny CTA → /app/offers/new (offer-first)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'test@example.com' }, isLoading: false, logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pl', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/app/dashboard']}>{children}</MemoryRouter>
);

// ─── QuoteCreationHub ─────────────────────────────────────────────────────────

describe('QuoteCreationHub', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.resetModules();
  });

  it('renderuje dokładnie 2 karty (Quick + Manual), bez karty AI', async () => {
    const { QuoteCreationHub } = await import('@/components/dashboard/QuoteCreationHub');
    const { container } = render(<QuoteCreationHub />, { wrapper: Wrapper });

    // Karty są elementami article (Card renderuje article)
    const cards = container.querySelectorAll('[class*="cursor-pointer"]');
    expect(cards.length).toBe(2);
  });

  it('"Szybka wycena" nawiguje do /app/szybka-wycena', async () => {
    const { QuoteCreationHub } = await import('@/components/dashboard/QuoteCreationHub');
    render(<QuoteCreationHub />, { wrapper: Wrapper });

    const quickCard = screen.getByText('dashboard.quoteCreation.quickTitle');
    fireEvent.click(quickCard.closest('[class*="cursor-pointer"]') as HTMLElement);

    expect(mockNavigate).toHaveBeenCalledWith('/app/szybka-wycena');
    expect(mockNavigate).not.toHaveBeenCalledWith('/app/offers/new');
  });

  it('"Ręcznie" nawiguje do /app/offers/new', async () => {
    const { QuoteCreationHub } = await import('@/components/dashboard/QuoteCreationHub');
    render(<QuoteCreationHub />, { wrapper: Wrapper });

    const manualCard = screen.getByText('dashboard.quoteCreation.manualTitle');
    fireEvent.click(manualCard.closest('[class*="cursor-pointer"]') as HTMLElement);

    expect(mockNavigate).toHaveBeenCalledWith('/app/offers/new');
  });

  it('nie zawiera karty z kluczem dashboard.quoteCreation.aiTitle', async () => {
    const { QuoteCreationHub } = await import('@/components/dashboard/QuoteCreationHub');
    render(<QuoteCreationHub />, { wrapper: Wrapper });

    expect(screen.queryByText('dashboard.quoteCreation.aiTitle')).toBeNull();
  });
});

// ─── buildAcceptanceLinkUrl — bezpieczeństwo URL ──────────────────────────────

describe('buildAcceptanceLinkUrl', () => {
  it('zwraca publiczny URL z /a/:token — nie wewnętrzną ścieżkę /app/', async () => {
    const { buildAcceptanceLinkUrl } = await import('@/hooks/useAcceptanceLink');

    const token = 'test-token-uuid-v4';
    const url = buildAcceptanceLinkUrl(token);

    expect(url).toContain(`/a/${token}`);
    expect(url).not.toContain('/app/');
    expect(url).not.toContain('/app/offers/');
  });
});

// ─── EmptyDashboard — offer-first CTA ────────────────────────────────────────

describe('EmptyDashboard — offer-first CTA', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.resetModules();
  });

  it('główny przycisk CTA prowadzi do /app/offers/new', async () => {
    const { EmptyDashboard } = await import('@/components/dashboard/EmptyDashboard');
    render(<EmptyDashboard />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    // Przycisk z kluczem 'quickActions.newOffer'
    const ctaBtn = buttons.find((btn) => btn.textContent?.includes('newOffer'));
    expect(ctaBtn).toBeDefined();

    fireEvent.click(ctaBtn!);

    expect(mockNavigate).toHaveBeenCalledWith('/app/offers/new');
    expect(mockNavigate).not.toHaveBeenCalledWith('/app/projects/new');
  });
});
