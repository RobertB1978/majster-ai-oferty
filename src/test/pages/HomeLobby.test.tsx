/**
 * HomeLobby.test.tsx
 *
 * Lobby Honesty — weryfikuje, że HomeLobby nie wyświetla pustych danych
 * wyglądających jak placeholdery (zera, niedziałające linki).
 *
 * Kontrakty:
 *  1. Komponent renderuje się bez błędu
 *  2. Sekcja "Dziś" z hardkodowanymi zerami NIE jest wyświetlana
 *  3. Sekcja "Szybki start" jest dostępna
 *  4. Przycisk "Szybka wycena" prowadzi do /app/szybka-wycena (nie /app/offers/new)
 *  5. Sekcja "Kontynuuj" wyświetla uczciwy komunikat o braku elementów
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// ---------- Mocks ----------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'pl' },
  }),
}));

// ---------- Komponent ----------

import HomeLobby from '@/pages/HomeLobby';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/app/home']}>{children}</MemoryRouter>
);

// ---------- Testy ----------

describe('HomeLobby — Lobby Honesty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderuje się bez błędu', () => {
    render(<HomeLobby />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
  });

  it('sekcja "Dziś" z hardkodowanymi zerami nie jest wyświetlana', () => {
    render(<HomeLobby />, { wrapper: Wrapper });
    // Upewniamy się, że nagłówek "Dziś" nie istnieje
    expect(screen.queryByText('Dziś')).toBeNull();
    // Upewniamy się, że etykiety liczników (Oferty/Projekty/Zadania w kontekście Today) nie istnieją
    // jako odizolowane elementy counter — sprawdzamy czy nie ma liczb "0" w rolach counter
    const zeroElements = screen.queryAllByText('0');
    expect(zeroElements.length).toBe(0);
  });

  it('sekcja "Szybki start" jest wyświetlana', () => {
    render(<HomeLobby />, { wrapper: Wrapper });
    expect(screen.getByText('newShell.home.quickStartTitle')).toBeDefined();
  });

  it('przycisk "Szybka wycena" prowadzi do /app/szybka-wycena', async () => {
    const user = userEvent.setup();
    render(<HomeLobby />, { wrapper: Wrapper });

    const quickEstBtn = screen.getByText('newShell.home.qs.quickEst');
    expect(quickEstBtn).toBeDefined();
    await user.click(quickEstBtn.closest('button')!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/szybka-wycena');
    expect(mockNavigate).not.toHaveBeenCalledWith('/app/offers/new');
  });

  it('sekcja "Kontynuuj" wyświetla uczciwy komunikat o braku elementów', () => {
    render(<HomeLobby />, { wrapper: Wrapper });
    expect(screen.getByText('newShell.home.continueEmpty')).toBeDefined();
  });

  it('"Nowa wycena" prowadzi do /app/offers/new', async () => {
    const user = userEvent.setup();
    render(<HomeLobby />, { wrapper: Wrapper });

    const newOfferBtn = screen.getByText('newShell.home.qs.newOffer');
    await user.click(newOfferBtn.closest('button')!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/offers/new');
  });

  it('łącznie 4 przyciski Quick Start (bez duplikatów tras)', () => {
    render(<HomeLobby />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
  });
});
