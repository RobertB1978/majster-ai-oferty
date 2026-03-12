/**
 * MoreScreen.test.tsx
 *
 * Weryfikuje strukturę informacyjną ekranu "Więcej":
 *  - Dwie grupy zamiast starego układu (Narzędzia + Firma i konto)
 *  - Poprawna liczba elementów w każdej grupie
 *  - Kluczowe trasy dostępne jako przyciski (navigate po kliknięciu)
 *  - Ustawienia są w grupie konfiguracyjnej, nie wśród narzędzi operacyjnych
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

import MoreScreen from '@/pages/MoreScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/app/more']}>{children}</MemoryRouter>
);

// ---------- Testy ----------

describe('MoreScreen — struktura informacyjna', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderuje nagłówek "Więcej"', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
  });

  it('renderuje dwie grupy (sekcje)', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');
    expect(sections.length).toBe(2);
  });

  it('pierwsza grupa to "Narzędzia" z 4 elementami', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');
    const toolsSection = sections[0];

    // Nagłówek grupy
    const heading = toolsSection.querySelector('h2');
    expect(heading).not.toBeNull();

    // 5 przycisków: Kalendarz, Wzory dokumentów, Finanse, Zdjęcia, Klienci
    const buttons = toolsSection.querySelectorAll('button');
    expect(buttons.length).toBe(5);
  });

  it('druga grupa to "Firma i konto" z 2 elementami', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');
    const accountSection = sections[1];

    // 2 przyciski: Profil firmy, Ustawienia
    const buttons = accountSection.querySelectorAll('button');
    expect(buttons.length).toBe(2);
  });

  it('łącznie 7 przycisków nawigacyjnych (5 narzędzia + 2 firmowe)', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    // Wszystkie przyciski w grupach (nie liczymy headerów)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(7);
  });

  it('Ustawienia są w drugiej grupie ("Firma i konto"), nie w pierwszej', () => {
    render(<MoreScreen />, { wrapper: Wrapper });
    const sections = screen.getAllByRole('region');

    const toolsSection = sections[0];
    const accountSection = sections[1];

    const toolsButtons = Array.from(toolsSection.querySelectorAll('button'));
    const accountButtons = Array.from(accountSection.querySelectorAll('button'));

    // "settings" klucz tłumaczenia → fallback to key "newShell.more.settings"
    const settingsInTools = toolsButtons.some(btn =>
      btn.textContent?.includes('settings') || btn.textContent?.includes('Ustawienia')
    );
    const settingsInAccount = accountButtons.some(btn =>
      btn.textContent?.includes('settings') || btn.textContent?.includes('Ustawienia')
    );

    expect(settingsInTools).toBe(false);
    expect(settingsInAccount).toBe(true);
  });

  it('kliknięcie Kalendarza wywołuje navigate do /app/calendar', async () => {
    const user = userEvent.setup();
    render(<MoreScreen />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    // Kalendarz to pierwszy element w pierwszej grupie
    const calendarBtn = buttons.find(btn =>
      btn.textContent?.includes('calendar') || btn.textContent?.includes('Kalendarz')
    );
    expect(calendarBtn).not.toBeUndefined();
    await user.click(calendarBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/calendar');
  });

  it('kliknięcie Ustawień wywołuje navigate do /app/settings', async () => {
    const user = userEvent.setup();
    render(<MoreScreen />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    const settingsBtn = buttons.find(btn =>
      btn.textContent?.includes('settings') || btn.textContent?.includes('Ustawienia')
    );
    expect(settingsBtn).not.toBeUndefined();
    await user.click(settingsBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/settings');
  });

  it('kliknięcie Profilu firmy wywołuje navigate do /app/profile', async () => {
    const user = userEvent.setup();
    render(<MoreScreen />, { wrapper: Wrapper });

    const buttons = screen.getAllByRole('button');
    const profileBtn = buttons.find(btn =>
      btn.textContent?.includes('profile') || btn.textContent?.includes('Profil')
    );
    expect(profileBtn).not.toBeUndefined();
    await user.click(profileBtn!);
    expect(mockNavigate).toHaveBeenCalledWith('/app/profile');
  });
});
