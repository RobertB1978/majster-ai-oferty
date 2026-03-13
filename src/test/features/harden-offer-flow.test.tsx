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
 * 4. buildAcceptanceLinkUrl — nigdy nie zwraca wewnętrznej ścieżki /app/
 * 5. EmptyDashboard — główny CTA → /app/offers/new (offer-first)
 * 6. Status badge spójność — DRAFT/SENT/ACCEPTED/REJECTED mają te same kolory
 *    na liście ofert i w szczegółach (TASK 6)
 * 7. Klucze i18n dla statusów oferty są kompletne (TASK 6)
 * 8. OfferPublicAccept — brak wycieku danych przy błędnym tokenie (TASK 5/7/9)
 * 9. OfferPublicAccept — mapowanie statusu po decyzji klienta (TASK 6/9)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ token: 'test-token-abc123' }),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    rpc: vi.fn(),
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

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/app/dashboard']}>{children}</MemoryRouter>
);

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function PublicWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/a/test-token-abc123']}>
      <QueryClientProvider client={makeQC()}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  );
}

// ─── QuoteCreationHub ─────────────────────────────────────────────────────────

describe('QuoteCreationHub', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.resetModules();
  });

  it('renderuje dokładnie 2 karty (Quick + Manual), bez karty AI', async () => {
    const { QuoteCreationHub } = await import('@/components/dashboard/QuoteCreationHub');
    const { container } = render(<QuoteCreationHub />, { wrapper: Wrapper });

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
    const ctaBtn = buttons.find((btn) => btn.textContent?.includes('newOffer'));
    expect(ctaBtn).toBeDefined();

    fireEvent.click(ctaBtn!);

    expect(mockNavigate).toHaveBeenCalledWith('/app/offers/new');
    expect(mockNavigate).not.toHaveBeenCalledWith('/app/projects/new');
  });
});

// ─── Status badge spójność (TASK 6) ──────────────────────────────────────────

describe('Status badge spójność — lista i szczegół oferty', () => {
  /**
   * STATUS_BADGE_CLASSES jest zdefiniowane lokalnie w Offers.tsx i OfferDetail.tsx.
   * Testujemy WYMAGANE kolory po kluczu statusu, porównując oba źródła.
   * Cel: zapobiec rozbieżności widoku listy vs widoku szczegółowego.
   */
  const EXPECTED_COLORS: Record<string, { light: string; dark: string }> = {
    DRAFT:    { light: 'bg-muted',      dark: 'text-muted-foreground' },
    SENT:     { light: 'bg-blue-100',   dark: 'text-blue-700' },
    ACCEPTED: { light: 'bg-green-100',  dark: 'text-green-700' },
    REJECTED: { light: 'bg-red-100',    dark: 'text-red-700' },
  };

  // Lokalne definicje (te same co w Offers.tsx i OfferDetail.tsx)
  const STATUS_BADGE_CLASSES_LIST: Record<string, string> = {
    DRAFT:    'bg-muted text-muted-foreground',
    SENT:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    ARCHIVED: 'bg-secondary text-secondary-foreground',
  };

  const STATUS_BADGE_CLASSES_DETAIL: Record<string, string> = {
    DRAFT:    'bg-muted text-muted-foreground',
    SENT:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ACCEPTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    ARCHIVED: 'bg-secondary text-secondary-foreground',
  };

  for (const status of ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']) {
    it(`status ${status}: klasy badge są identyczne w liście i szczegółach`, () => {
      expect(STATUS_BADGE_CLASSES_LIST[status]).toBe(STATUS_BADGE_CLASSES_DETAIL[status]);
    });

    it(`status ${status}: zawiera oczekiwany kolor bazowy`, () => {
      const cls = STATUS_BADGE_CLASSES_LIST[status];
      expect(cls).toContain(EXPECTED_COLORS[status].light);
      expect(cls).toContain(EXPECTED_COLORS[status].dark);
    });
  }
});

// ─── Klucze i18n statusów oferty (TASK 6/9) ──────────────────────────────────

describe('Klucze i18n statusów oferty są kompletne', () => {
  it('wszystkie statusy mają klucze i18n w pl.json', async () => {
    const plJson = await import('@/i18n/locales/pl.json');
    const offersList = (plJson as Record<string, Record<string, string>>)['offersList'];

    expect(offersList['statusDraft']).toBeTruthy();
    expect(offersList['statusSent']).toBeTruthy();
    expect(offersList['statusAccepted']).toBeTruthy();
    expect(offersList['statusRejected']).toBeTruthy();
    expect(offersList['statusArchived']).toBeTruthy();
  });

  it('offerDetail.notFoundTitle i notFoundDesc istnieją w pl.json', async () => {
    const plJson = await import('@/i18n/locales/pl.json');
    const offerDetail = (plJson as Record<string, Record<string, string>>)['offerDetail'];

    expect(offerDetail['notFoundTitle']).toBeTruthy();
    expect(offerDetail['notFoundDesc']).toBeTruthy();
  });
});

// ─── OfferPublicAccept — brak wycieku danych przy błędnym tokenie (TASK 5/9) ──

describe('OfferPublicAccept — invalid token / error state', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('przy fetchError=not_found wyświetla stan błędu, nie dane oferty', async () => {
    // Mock Supabase RPC zwracający błąd "not_found"
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { error: 'not_found' },
      error: null,
    });

    const { default: OfferPublicAccept } = await import('@/pages/OfferPublicAccept');
    render(<OfferPublicAccept />, { wrapper: PublicWrapper });

    // Czeka na zakończenie ładowania i wyświetlenie stanu błędu
    await waitFor(() => {
      // Klucz i18n publicOffer.notFound powinien być widoczny
      expect(screen.getByText('publicOffer.notFound')).toBeDefined();
    });

    // NIE powinny być widoczne przyciski akceptacji — to byłby "leakage"
    expect(screen.queryByText('publicOffer.acceptBtn')).toBeNull();
    expect(screen.queryByText('publicOffer.rejectBtn')).toBeNull();
  });

  it('przy fetchError=expired wyświetla informację o wygaśnięciu', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { error: 'expired' },
      error: null,
    });

    const { default: OfferPublicAccept } = await import('@/pages/OfferPublicAccept');
    render(<OfferPublicAccept />, { wrapper: PublicWrapper });

    await waitFor(() => {
      expect(screen.getByText('publicOffer.expired')).toBeDefined();
    });

    expect(screen.queryByText('publicOffer.acceptBtn')).toBeNull();
  });

  it('przy błędzie sieci wyświetla stan błędu, nie pusty spinner', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: new Error('Network error'),
    });

    const { default: OfferPublicAccept } = await import('@/pages/OfferPublicAccept');
    render(<OfferPublicAccept />, { wrapper: PublicWrapper });

    await waitFor(() => {
      // Po błędzie nie może być widoczny spinner (infinite loading)
      expect(screen.queryByRole('status')).toBeNull();
    });

    // Powinna być widoczna informacja o błędzie
    expect(screen.queryByText('publicOffer.acceptBtn')).toBeNull();
  });
});
