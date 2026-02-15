import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { BrowserRouter, Route, Routes, MemoryRouter } from 'react-router-dom';
import App from '@/App';

/**
 * Legal Routes - Route Mapping Tests
 *
 * These tests verify that each route shows the CORRECT page content.
 * This is different from component rendering tests - we're testing the actual routing.
 *
 * Route mapping (MUST be correct):
 * - /legal/privacy → PrivacyPolicy (shows "Polityka Prywatności" + "Administrator danych")
 * - /legal/terms → TermsOfService (shows "Regulamin Serwisu" + "Postanowienia ogólne")
 * - /legal/cookies → CookiesPolicy (shows "Polityka Cookies" + cookie table)
 * - /legal/dpa → DPA (shows "Umowa Powierzenia Danych" + "Przedmiot umowy")
 * - /legal/rodo → GDPRCenter (shows "Centrum RODO")
 *
 * Each test navigates to a route and verifies UNIQUE content markers
 * that distinguish it from other legal pages.
 */
describe('Legal Routes Mapping', () => {
  describe('Route → Component correctness', () => {
    it('/legal/privacy should show Privacy Policy (NOT terms/cookies/dpa)', async () => {
      render(
        <MemoryRouter initialEntries={['/legal/privacy']}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        // MUST contain Privacy-specific content
        expect(screen.getByText(/Polityka Prywatności/i)).toBeDefined();
        expect(screen.getByText(/Administrator danych/i)).toBeDefined();
      });

      // MUST NOT contain content from other pages
      expect(screen.queryByText(/Postanowienia ogólne/i)).toBeNull(); // Terms
      expect(screen.queryByText(/Czym są pliki cookies/i)).toBeNull(); // Cookies
      expect(screen.queryByText(/Przedmiot umowy/i)).toBeNull(); // DPA
    });

    it('/legal/terms should show Terms of Service (NOT privacy/cookies/dpa)', async () => {
      render(
        <MemoryRouter initialEntries={['/legal/terms']}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        // MUST contain Terms-specific content
        expect(screen.getByText(/Regulamin Serwisu/i)).toBeDefined();
        expect(screen.getByText(/Postanowienia ogólne/i)).toBeDefined();
      });

      // MUST NOT contain content from other pages
      expect(screen.queryByText(/Administrator danych/i)).toBeNull(); // Privacy
      expect(screen.queryByText(/Czym są pliki cookies/i)).toBeNull(); // Cookies
      expect(screen.queryByText(/Przedmiot umowy/i)).toBeNull(); // DPA
    });

    it('/legal/cookies should show Cookies Policy (NOT privacy/terms/dpa)', async () => {
      render(
        <MemoryRouter initialEntries={['/legal/cookies']}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        // MUST contain Cookies-specific content
        expect(screen.getByText(/Polityka Cookies/i)).toBeDefined();
        expect(screen.getByText(/Czym są pliki cookies/i)).toBeDefined();
      });

      // MUST NOT contain content from other pages
      expect(screen.queryByText(/Administrator danych/i)).toBeNull(); // Privacy
      expect(screen.queryByText(/Postanowienia ogólne/i)).toBeNull(); // Terms
      expect(screen.queryByText(/Przedmiot umowy/i)).toBeNull(); // DPA
    });

    it('/legal/dpa should show DPA (NOT privacy/terms/cookies)', async () => {
      render(
        <MemoryRouter initialEntries={['/legal/dpa']}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        // MUST contain DPA-specific content
        expect(screen.getByText(/Umowa Powierzenia Danych/i)).toBeDefined();
        expect(screen.getByText(/Przedmiot umowy/i)).toBeDefined();
      });

      // MUST NOT contain content from other pages
      expect(screen.queryByText(/Administrator danych/i)).toBeNull(); // Privacy (also mentions "administrator" but different context)
      expect(screen.queryByText(/Postanowienia ogólne/i)).toBeNull(); // Terms
      expect(screen.queryByText(/Czym są pliki cookies/i)).toBeNull(); // Cookies
    });

    // Note: GDPR Center requires auth, so we skip the full routing test
    // The component itself is tested in LegalPages.test.tsx
    it.skip('/legal/rodo should show GDPR Center (requires auth)', async () => {
      // This route requires authentication context
      // Test will be added when we have proper auth mocking
    });
  });

  describe('Legacy redirects', () => {
    it('/privacy should redirect to /legal/privacy', async () => {
      render(
        <MemoryRouter initialEntries={['/privacy']}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Polityka Prywatności/i)).toBeDefined();
        expect(screen.getByText(/Administrator danych/i)).toBeDefined();
      });
    });

    it('/terms should redirect to /legal/terms', async () => {
      render(
        <MemoryRouter initialEntries={['/terms']}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Regulamin Serwisu/i)).toBeDefined();
        expect(screen.getByText(/Postanowienia ogólne/i)).toBeDefined();
      });
    });

    it('/cookies should redirect to /legal/cookies', async () => {
      render(
        <MemoryRouter initialEntries={['/cookies']}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Polityka Cookies/i)).toBeDefined();
        expect(screen.getByText(/Czym są pliki cookies/i)).toBeDefined();
      });
    });

    it('/dpa should redirect to /legal/dpa', async () => {
      render(
        <MemoryRouter initialEntries={['/dpa']}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Umowa Powierzenia Danych/i)).toBeDefined();
        expect(screen.getByText(/Przedmiot umowy/i)).toBeDefined();
      });
    });

    it.skip('/rodo should redirect to /legal/rodo (requires auth)', async () => {
      // Requires authentication context
    });
  });

  describe('/legal redirect', () => {
    it('/legal should redirect to /legal/privacy', async () => {
      render(
        <MemoryRouter initialEntries={['/legal']}>
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Polityka Prywatności/i)).toBeDefined();
        expect(screen.getByText(/Administrator danych/i)).toBeDefined();
      });
    });
  });
});
