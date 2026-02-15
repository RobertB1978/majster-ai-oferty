import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
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
 *
 * NOTE: We use @testing-library/react (not @/test/utils) to avoid nested routers.
 * The test utils wrap in BrowserRouter, but we need MemoryRouter for route control.
 */

/**
 * Create a test QueryClient with retries disabled for faster tests
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/**
 * Helper to render App with routing at a specific route
 * Wraps with required providers but uses only ONE router (MemoryRouter)
 */
function renderWithRouter(ui: React.ReactElement, { initialRoute = '/' } = {}) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/*" element={ui} />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

describe('Legal Routes Mapping', () => {
  describe('Route → Component correctness', () => {
    it('/legal/privacy should show Privacy Policy (NOT terms/cookies/dpa)', async () => {
      renderWithRouter(<App />, { initialRoute: '/legal/privacy' });

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
      renderWithRouter(<App />, { initialRoute: '/legal/terms' });

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
      renderWithRouter(<App />, { initialRoute: '/legal/cookies' });

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
      renderWithRouter(<App />, { initialRoute: '/legal/dpa' });

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
      renderWithRouter(<App />, { initialRoute: '/privacy' });

      await waitFor(() => {
        expect(screen.getByText(/Polityka Prywatności/i)).toBeDefined();
        expect(screen.getByText(/Administrator danych/i)).toBeDefined();
      });
    });

    it('/terms should redirect to /legal/terms', async () => {
      renderWithRouter(<App />, { initialRoute: '/terms' });

      await waitFor(() => {
        expect(screen.getByText(/Regulamin Serwisu/i)).toBeDefined();
        expect(screen.getByText(/Postanowienia ogólne/i)).toBeDefined();
      });
    });

    it('/cookies should redirect to /legal/cookies', async () => {
      renderWithRouter(<App />, { initialRoute: '/cookies' });

      await waitFor(() => {
        expect(screen.getByText(/Polityka Cookies/i)).toBeDefined();
        expect(screen.getByText(/Czym są pliki cookies/i)).toBeDefined();
      });
    });

    it('/dpa should redirect to /legal/dpa', async () => {
      renderWithRouter(<App />, { initialRoute: '/dpa' });

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
      renderWithRouter(<App />, { initialRoute: '/legal' });

      await waitFor(() => {
        expect(screen.getByText(/Polityka Prywatności/i)).toBeDefined();
        expect(screen.getByText(/Administrator danych/i)).toBeDefined();
      });
    });
  });
});
