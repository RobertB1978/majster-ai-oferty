/**
 * offer-entry-points.test.tsx
 *
 * Weryfikuje, że wszystkie główne punkty wejścia do tworzenia oferty/wyceny
 * prowadzą do JEDNEGO kanonicznego flow: /app/offers/new
 *
 * Testowane entry pointy:
 *  1. FAB (NewShellFAB) — akcja "Nowa Oferta"
 *  2. TopBar quick-create (NewShellTopBar) — akcja "Nowa Oferta" (pośrednia weryfikacja przez import)
 *  3. HomeLobby — przycisk "Nowa wycena"
 *  4. HomeLobby — przycisk "Szybka wycena"
 *
 * Intentionally NOT unified (osobna ścieżka biznesowa):
 *  - EmptyDashboard CTA "Utwórz pierwszy projekt" → /app/projects/new
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const CANONICAL_OFFER_ROUTE = '/app/offers/new';

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
  useAuth: () => ({ user: { email: 'test@example.com' }, isLoading: false, logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------- Mock i18next ----------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'pl', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------- Wrapper ----------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/app/home']}>{children}</MemoryRouter>
);

// ---------- Tests ----------

describe('Kanoniczny route oferty = /app/offers/new', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ---- HomeLobby ----

  describe('HomeLobby — Quick Start buttons', () => {
    it('"Nowa wycena" naviguje do /app/offers/new', async () => {
      const { default: HomeLobby } = await import('@/pages/HomeLobby');

      render(<HomeLobby />, { wrapper: Wrapper });

      const newOfferBtn = screen.getByText('Nowa wycena');
      fireEvent.click(newOfferBtn);

      expect(mockNavigate).toHaveBeenCalledWith(CANONICAL_OFFER_ROUTE);
    });

    it('"Szybka wycena" naviguje do /app/offers/new (nie /app/szybka-wycena)', async () => {
      const { default: HomeLobby } = await import('@/pages/HomeLobby');

      render(<HomeLobby />, { wrapper: Wrapper });

      const quickEstBtn = screen.getByText('Szybka wycena');
      fireEvent.click(quickEstBtn);

      expect(mockNavigate).toHaveBeenCalledWith(CANONICAL_OFFER_ROUTE);
      expect(mockNavigate).not.toHaveBeenCalledWith('/app/szybka-wycena');
      expect(mockNavigate).not.toHaveBeenCalledWith('/app/quick-est');
    });

    it('"Projekty" naviguje do /app/projects (nie zmienione)', async () => {
      const { default: HomeLobby } = await import('@/pages/HomeLobby');

      render(<HomeLobby />, { wrapper: Wrapper });

      // Używamy getByRole('button') zamiast getByText, bo 'Projekty' pojawia
      // się też w liczniku TodayCounter (span, nie button)
      const projectsBtn = screen.getByRole('button', { name: 'Projekty' });
      fireEvent.click(projectsBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/app/projects');
    });
  });

  // ---- NewShellFAB ----

  describe('NewShellFAB — akcja new-offer', () => {
    it('kliknięcie "Nowa Oferta" w FAB naviguje do /app/offers/new', async () => {
      const { NewShellFAB } = await import('@/components/layout/NewShellFAB');

      render(<NewShellFAB />, { wrapper: Wrapper });

      // Otwórz bottom sheet klikając FAB
      const fabBtn = screen.getByRole('button', { name: /Utwórz/i });
      fireEvent.click(fabBtn);

      // Kliknij akcję oferty w otwartym bottom sheet
      const offerActionBtn = await screen.findByText('newShell.fab.newOffer');
      fireEvent.click(offerActionBtn);

      expect(mockNavigate).toHaveBeenCalledWith(CANONICAL_OFFER_ROUTE);
      expect(mockNavigate).not.toHaveBeenCalledWith('/app/quick-est');
    });
  });

  // ---- Negatywne: EmptyDashboard CTA pozostaje na /app/projects/new ----

  describe('EmptyDashboard — tworzenie projektu jest osobną ścieżką', () => {
    it('CTA "Utwórz pierwszy projekt" naviguje do /app/projects/new (nie do /app/offers/new)', async () => {
      const { EmptyDashboard } = await import('@/components/dashboard/EmptyDashboard');

      render(<EmptyDashboard />, { wrapper: Wrapper });

      // Tekst przycisku pochodzi z klucza i18n 'dashboard.createFirstProject'.
      // Mock i18n zwraca klucz bez fallbacku (nie ma drugiego argumentu),
      // więc szukamy przycisku po fragmencie klucza.
      const buttons = screen.getAllByRole('button');
      const createBtn = buttons.find((btn) =>
        btn.textContent?.includes('createFirstProject')
      );
      expect(createBtn).toBeDefined();

      fireEvent.click(createBtn!);

      expect(mockNavigate).toHaveBeenCalledWith('/app/projects/new');
      expect(mockNavigate).not.toHaveBeenCalledWith(CANONICAL_OFFER_ROUTE);
    });
  });
});
