import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect } from 'vitest';
import Landing from './Landing';

// Minimal i18n mock — returns defaultValue (2nd arg) when provided, key otherwise
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
    i18n: {
      language: 'pl',
      changeLanguage: () => Promise.resolve(),
    },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

function renderLanding() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('Landing', () => {
  it('renders without crashing', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('H1 contains expected copy', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Zarządzaj firmą');
  });

  it('features section exists', () => {
    renderLanding();
    const featuresSection = document.getElementById('features');
    expect(featuresSection).toBeInTheDocument();
  });

  it('coming soon section is not rendered (removed per truth-sync requirement)', () => {
    renderLanding();
    // ComingSoonSection ("Co planujemy") was removed from landing — no "beta/wkrótce" claims
    expect(screen.queryByText(/Co planujemy/i)).not.toBeInTheDocument();
  });

  it('footer is rendered on landing page', () => {
    renderLanding();
    // Footer contains Majster.AI text and copyright
    const footerEl = screen.getByRole('contentinfo');
    expect(footerEl).toBeInTheDocument();
  });

  it('CTA buttons link to /register', () => {
    renderLanding();
    const ctaLinks = screen.getAllByRole('link', { name: /Zacznij za darmo/i });
    expect(ctaLinks.length).toBeGreaterThan(0);
    ctaLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register');
    });
  });

  it('pricing section exists', () => {
    renderLanding();
    const pricingSection = document.getElementById('pricing');
    expect(pricingSection).toBeInTheDocument();
  });

  it('FAQ section exists', () => {
    renderLanding();
    const faqSection = document.getElementById('faq');
    expect(faqSection).toBeInTheDocument();
  });
});
