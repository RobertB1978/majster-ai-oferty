/**
 * cleanup-pack-point5.test.tsx
 *
 * Testy dla Point 5 Cleanup Pack:
 *
 * 1. AdminSidebar — brak badge "Wkrótce" na w pełni działających stronach admina
 *    (/admin/app-config, /admin/plans, /admin/navigation, /admin/diagnostics)
 *
 * 2. CalendarSync — brak aktywnych przycisków "Połącz" (martwy punkt),
 *    widoczny uczciwy baner beta oraz badge "Wkrótce" przy każdym dostawcy
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'owner@example.com' },
    isLoading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Importy komponentów ──────────────────────────────────────────────────────

import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { CalendarSync } from '@/components/calendar/CalendarSync';

// ─── Wrapper helpers ──────────────────────────────────────────────────────────

function renderInRouter(ui: React.ReactNode, initialPath = '/admin/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
  );
}

// ─── 1. AdminSidebar — brak "Wkrótce" na działających stronach ───────────────

describe('AdminSidebar — brak misleading badge "Wkrótce"', () => {
  it('renderuje się bez błędu', () => {
    expect(() => renderInRouter(<AdminSidebar />)).not.toThrow();
  });

  it('nie wyświetla żadnego badge "Wkrótce" (nav.comingSoon)', () => {
    renderInRouter(<AdminSidebar />);
    // Żaden element nie powinien zawierać tekstu "Wkrótce"
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain('Wkrótce');
  });

  it('wszystkie 12 pozycji admina są klikalne linki (żaden nie jest wyłączony)', () => {
    renderInRouter(<AdminSidebar />);
    const links = screen.getAllByRole('link');
    // Minimum 12 pozycji nav + 1 link "Powrót do aplikacji" w stopce
    expect(links.length).toBeGreaterThanOrEqual(12);
    links.forEach((link) => {
      expect(link).not.toBeDisabled();
    });
  });
});

// ─── 2. CalendarSync — brak martwych przycisków "Połącz" ─────────────────────

describe('CalendarSync — uczciwy stan beta', () => {
  it('renderuje się bez błędu', () => {
    expect(() => render(<CalendarSync />)).not.toThrow();
  });

  it('nie wyświetla żadnego przycisku "Połącz" (martwy punkt)', () => {
    render(<CalendarSync />);
    // Przycisk "Połącz" był martwym punktem — nie powinien już istnieć
    const connectBtn = screen.queryByRole('button', { name: /Po\u0142\u0105cz/i });
    expect(connectBtn).toBeNull();
  });

  it('wyświetla baner informacyjny o statusie beta funkcji', () => {
    render(<CalendarSync />);
    // Baner musi informować użytkownika, że funkcja jest w przygotowaniu
    const bannerText = document.body.textContent ?? '';
    // Tekst z klucza calendarSync.betaNotice lub fallback
    expect(bannerText).toMatch(/przygotowan|kolejn/i);
  });

  it('każdy dostawca kalendarza pokazuje badge "Wkrótce"', () => {
    render(<CalendarSync />);
    const comingSoonBadges = screen.getAllByText('Wkrótce');
    // Musi być co najmniej 3 badge (Google, Outlook, Apple)
    expect(comingSoonBadges.length).toBeGreaterThanOrEqual(3);
  });

  it('nie ma aktywnych przycisków "Synchronizuj" ani "Rozłącz"', () => {
    render(<CalendarSync />);
    const syncBtn = screen.queryByRole('button', { name: /Synchronizuj/i });
    const disconnectBtn = screen.queryByRole('button', { name: /Roz\u0142\u0105cz/i });
    expect(syncBtn).toBeNull();
    expect(disconnectBtn).toBeNull();
  });
});
