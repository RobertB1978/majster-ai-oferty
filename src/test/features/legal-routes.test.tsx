import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';

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
 * NOTE: We use a minimal TestRouter (not full App) to avoid nested routers.
 * This mirrors the approach in routing-redirects.test.tsx.
 */

// Lazy load legal pages exactly as App.tsx does
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const CookiesPolicy = lazy(() => import("@/pages/legal/CookiesPolicy"));
const DPA = lazy(() => import("@/pages/legal/DPA"));
const GDPRCenter = lazy(() => import("@/pages/legal/GDPRCenter"));

/**
 * Minimal router structure matching App.tsx legal routes (lines 136-148)
 */
function TestRouter({ initialPath }: { initialPath: string }) {
  return (
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Legal pages - exact structure from App.tsx */}
            <Route path="/legal" element={<Navigate to="/legal/privacy" replace />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/terms" element={<TermsOfService />} />
            <Route path="/legal/cookies" element={<CookiesPolicy />} />
            <Route path="/legal/dpa" element={<DPA />} />
            <Route path="/legal/rodo" element={<GDPRCenter />} />

            {/* Legacy legal redirects - from App.tsx lines 144-148 */}
            <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
            <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
            <Route path="/cookies" element={<Navigate to="/legal/cookies" replace />} />
            <Route path="/dpa" element={<Navigate to="/legal/dpa" replace />} />
            <Route path="/rodo" element={<Navigate to="/legal/rodo" replace />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('Legal Routes Mapping', () => {
  describe('Route → Component correctness', () => {
    it('/legal/privacy should show Privacy Policy (NOT terms/cookies/dpa)', async () => {
      render(<TestRouter initialPath="/legal/privacy" />);

      await waitFor(() => {
        // MUST contain Privacy-specific content (use heading to avoid multiple matches)
        expect(screen.getByRole('heading', { name: /Polityka Prywatności/i })).toBeDefined();
        expect(screen.getByText(/Administrator danych/i)).toBeDefined();
      });

      // MUST NOT contain content from other pages
      expect(screen.queryByText(/Postanowienia ogólne/i)).toBeNull(); // Terms
      expect(screen.queryByText(/Czym są pliki cookies/i)).toBeNull(); // Cookies
      expect(screen.queryByText(/Przedmiot umowy/i)).toBeNull(); // DPA
    });

    it('/legal/terms should show Terms of Service (NOT privacy/cookies/dpa)', async () => {
      render(<TestRouter initialPath="/legal/terms" />);

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
      render(<TestRouter initialPath="/legal/cookies" />);

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
      render(<TestRouter initialPath="/legal/dpa" />);

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
      render(<TestRouter initialPath="/privacy" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Polityka Prywatności/i })).toBeDefined();
        expect(screen.getByText(/Administrator danych/i)).toBeDefined();
      });
    });

    it('/terms should redirect to /legal/terms', async () => {
      render(<TestRouter initialPath="/terms" />);

      await waitFor(() => {
        expect(screen.getByText(/Regulamin Serwisu/i)).toBeDefined();
        expect(screen.getByText(/Postanowienia ogólne/i)).toBeDefined();
      });
    });

    it('/cookies should redirect to /legal/cookies', async () => {
      render(<TestRouter initialPath="/cookies" />);

      await waitFor(() => {
        expect(screen.getByText(/Polityka Cookies/i)).toBeDefined();
        expect(screen.getByText(/Czym są pliki cookies/i)).toBeDefined();
      });
    });

    it('/dpa should redirect to /legal/dpa', async () => {
      render(<TestRouter initialPath="/dpa" />);

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
      render(<TestRouter initialPath="/legal" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Polityka Prywatności/i })).toBeDefined();
        expect(screen.getByText(/Administrator danych/i)).toBeDefined();
      });
    });
  });
});
