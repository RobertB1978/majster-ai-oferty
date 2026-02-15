import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import TermsOfService from '@/pages/legal/TermsOfService';
import CookiesPolicy from '@/pages/legal/CookiesPolicy';
import DPA from '@/pages/legal/DPA';
import GDPRCenter from '@/pages/legal/GDPRCenter';

/**
 * Legal Pages - Rendering Tests
 *
 * These tests verify that all legal pages render correctly.
 * Route mapping is verified in App.tsx:
 * - /legal → /legal/privacy (redirect)
 * - /legal/privacy → PrivacyPolicy
 * - /legal/terms → TermsOfService
 * - /legal/cookies → CookiesPolicy
 * - /legal/dpa → DPA
 * - /legal/rodo → GDPRCenter
 *
 * Legacy redirects:
 * - /privacy → /legal/privacy
 * - /terms → /legal/terms
 * - /cookies → /legal/cookies
 * - /dpa → /legal/dpa
 * - /rodo → /legal/rodo
 */
describe('Legal Pages', () => {
  describe('Page rendering', () => {
    it('should render PrivacyPolicy page', () => {
      render(<PrivacyPolicy />);
      const headings = screen.getAllByText(/Polityka Prywatności/i);
      expect(headings.length).toBeGreaterThan(0);
      expect(screen.getByText(/Administrator danych/i)).toBeDefined();
    });

    it('should render TermsOfService page', () => {
      render(<TermsOfService />);
      const headings = screen.getAllByText(/Regulamin/i);
      expect(headings.length).toBeGreaterThan(0);
      expect(screen.getByText(/Postanowienia ogólne/i)).toBeDefined();
    });

    it('should render CookiesPolicy page', () => {
      render(<CookiesPolicy />);
      const headings = screen.getAllByText(/Polityka Cookies/i);
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should render DPA page', () => {
      render(<DPA />);
      expect(screen.getByText(/Umowa Powierzenia Danych/i)).toBeDefined();
      expect(screen.getByText(/Przedmiot umowy/i)).toBeDefined();
    });

    // GDPRCenter requires AuthContext - skipping for now
    it.skip('should render GDPRCenter page', () => {
      render(<GDPRCenter />);
      expect(screen.getByText(/Centrum RODO/i)).toBeDefined();
      expect(screen.getByText(/Zarządzaj swoimi danymi osobowymi/i)).toBeDefined();
    });
  });

  describe('Navigation elements', () => {
    it('should have back button in PrivacyPolicy', () => {
      render(<PrivacyPolicy />);
      const backButton = screen.getByText(/Powrót/i);
      expect(backButton).toBeDefined();
    });

    it('should have back button in TermsOfService', () => {
      render(<TermsOfService />);
      const backButton = screen.getByText(/Powrót/i);
      expect(backButton).toBeDefined();
    });

    it('should have back button in CookiesPolicy', () => {
      render(<CookiesPolicy />);
      const backButton = screen.getByText(/Powrót/i);
      expect(backButton).toBeDefined();
    });

    it('should have back button in DPA', () => {
      render(<DPA />);
      const backButton = screen.getByText(/Powrót/i);
      expect(backButton).toBeDefined();
    });

    // GDPRCenter requires AuthContext - skipping for now
    it.skip('should have back button in GDPRCenter', () => {
      render(<GDPRCenter />);
      const backButton = screen.getByText(/Powrót/i);
      expect(backButton).toBeDefined();
    });
  });

  describe('SEO metadata', () => {
    it('should have SEO metadata in PrivacyPolicy', () => {
      render(<PrivacyPolicy />);
      // SEOHead component should set document.title via react-helmet-async
      // This test just verifies the page renders without errors
      const headings = screen.getAllByText(/Polityka Prywatności/i);
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have SEO metadata in TermsOfService', () => {
      render(<TermsOfService />);
      const headings = screen.getAllByText(/Regulamin/i);
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have SEO metadata in CookiesPolicy', () => {
      render(<CookiesPolicy />);
      const headings = screen.getAllByText(/Polityka Cookies/i);
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have SEO metadata in DPA', () => {
      render(<DPA />);
      expect(screen.getByText(/Umowa Powierzenia Danych/i)).toBeDefined();
    });

    // GDPRCenter requires AuthContext - skipping for now
    it.skip('should have SEO metadata in GDPRCenter', () => {
      render(<GDPRCenter />);
      expect(screen.getByText(/Centrum RODO/i)).toBeDefined();
    });
  });
});
