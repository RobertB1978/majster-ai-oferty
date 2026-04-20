import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CookieConsent } from '@/components/legal/CookieConsent';

// Mock Supabase so DB writes in saveConsent() don't throw
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

function renderBanner() {
  return render(
    <BrowserRouter>
      <CookieConsent />
    </BrowserRouter>
  );
}

describe('CookieConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no prior consent stored → banner should be visible
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});
  });

  describe('Widoczność banera', () => {
    it('pokazuje baner gdy brak zapisanej zgody', async () => {
      renderBanner();
      await waitFor(() => {
        expect(screen.getByText(/Ustawienia plików cookies/i)).toBeDefined();
      });
    });

    it('ukrywa baner gdy zgoda została już zapisana', async () => {
      vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
        if (key === 'cookie_consent') {
          return JSON.stringify({ essential: true, analytics: false, marketing: false });
        }
        return null;
      });

      renderBanner();

      // Baner nie powinien się renderować
      expect(screen.queryByText(/Ustawienia plików cookies/i)).toBeNull();
    });
  });

  describe('Ścieżka odrzucenia (Odrzuć wszystkie)', () => {
    it('kliknięcie "Odrzuć wszystkie" zapisuje zgodę tylko na niezbędne i ukrywa baner', async () => {
      const user = userEvent.setup();
      renderBanner();

      await waitFor(() => {
        expect(screen.getByText(/Odrzuć wszystkie/i)).toBeDefined();
      });

      const rejectBtn = screen.getByRole('button', { name: /Odrzuć wszystkie/i });
      await user.click(rejectBtn);

      // Sprawdź, że zapisano minimalną zgodę
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'cookie_consent',
        JSON.stringify({ essential: true, analytics: false, marketing: false })
      );

      // Baner powinien zniknąć
      await waitFor(() => {
        expect(screen.queryByText(/Ustawienia plików cookies/i)).toBeNull();
      });
    });
  });

  describe('Ścieżka zarządzania preferencjami (Dostosuj)', () => {
    it('kliknięcie "Dostosuj" pokazuje panel preferencji ze switchami', async () => {
      const user = userEvent.setup();
      renderBanner();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Dostosuj/i })).toBeDefined();
      });

      const customizeBtn = screen.getByRole('button', { name: /Dostosuj/i });
      await user.click(customizeBtn);

      // Panel preferencji powinien być widoczny — wystarczy sprawdzić
      // unikalny element "Analityczne" (etykieta switcha) i nowy przycisk.
      // "Marketingowe" jest celowo ukryte (brak aktywnego vendora marketingowego).
      await waitFor(() => {
        expect(screen.getAllByText(/Analityczne/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/Marketingowe/i)).toBeNull();
        // Przycisk zmienia się na "Zapisz wybrane"
        expect(screen.getByRole('button', { name: /Zapisz wybrane/i })).toBeDefined();
      });
    });

    it('"Zapisz wybrane" po wybraniu preferencji zapisuje zgodę i ukrywa baner', async () => {
      const user = userEvent.setup();
      renderBanner();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Dostosuj/i })).toBeDefined();
      });

      // Otwórz panel preferencji
      await user.click(screen.getByRole('button', { name: /Dostosuj/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Zapisz wybrane/i })).toBeDefined();
      });

      // Kliknij "Zapisz wybrane" bez zmiany (analytics=false, marketing=false)
      await user.click(screen.getByRole('button', { name: /Zapisz wybrane/i }));

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'cookie_consent',
        expect.stringContaining('"essential":true')
      );

      await waitFor(() => {
        expect(screen.queryByText(/Ustawienia plików cookies/i)).toBeNull();
      });
    });
  });

  describe('Ścieżka akceptacji wszystkich', () => {
    it('kliknięcie "Akceptuję wszystkie" zapisuje pełną zgodę i ukrywa baner', async () => {
      const user = userEvent.setup();
      renderBanner();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Akceptuję wszystkie/i })).toBeDefined();
      });

      await user.click(screen.getByRole('button', { name: /Akceptuję wszystkie/i }));

      // marketing is always false: no marketing vendor is currently active
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'cookie_consent',
        JSON.stringify({ essential: true, analytics: true, marketing: false })
      );

      await waitFor(() => {
        expect(screen.queryByText(/Ustawienia plików cookies/i)).toBeNull();
      });
    });
  });

  describe('Linki do stron prawnych w banerze', () => {
    it('baner zawiera link do Polityki prywatności', async () => {
      renderBanner();

      await waitFor(() => {
        expect(screen.getByText(/Polityka prywatności/i)).toBeDefined();
      });

      const privacyLink = screen.getByRole('link', { name: /Polityka prywatności/i });
      expect(privacyLink.getAttribute('href')).toBe('/legal/privacy');
    });

    it('baner zawiera link do Regulaminu', async () => {
      renderBanner();

      await waitFor(() => {
        expect(screen.getByText(/Regulamin/i)).toBeDefined();
      });

      const termsLink = screen.getByRole('link', { name: /Regulamin/i });
      expect(termsLink.getAttribute('href')).toBe('/legal/terms');
    });
  });
});
