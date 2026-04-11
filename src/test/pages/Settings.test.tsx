import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Minimal stubs so Settings.tsx can render without full app context ──

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Stub every imported settings sub-component with a simple div
vi.mock('@/components/settings/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));
vi.mock('@/components/settings/ContactEmailSettings', () => ({
  ContactEmailSettings: () => <div data-testid="contact-email-settings" />,
}));
vi.mock('@/components/settings/DeleteAccountSection', () => ({
  DeleteAccountSection: () => <div data-testid="delete-account-section" />,
}));
vi.mock('@/components/calendar/CalendarSync', () => ({
  CalendarSync: () => <div data-testid="calendar-sync" />,
}));
vi.mock('@/components/documents/CompanyDocuments', () => ({
  CompanyDocuments: () => <div data-testid="company-documents" />,
}));
vi.mock('@/components/notifications/PushNotificationSettings', () => ({
  PushNotificationSettings: () => <div data-testid="push-notifications" />,
}));
vi.mock('@/components/settings/BiometricSettings', () => ({
  BiometricSettings: () => <div data-testid="biometric-settings" />,
}));
vi.mock('@/components/billing/SubscriptionSection', () => ({
  SubscriptionSection: () => <div data-testid="subscription-section" />,
}));
vi.mock('@/hooks/useDenseMode', () => ({
  useDenseMode: () => ({ dense: false, toggleDense: vi.fn() }),
}));

import Settings from '@/pages/Settings';

const renderSettings = () =>
  render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  );

describe('Settings — mobile navigation', () => {
  it('renderuje mobilne pozycje nawigacyjne dla aktywnych sekcji (bez kalendarza w beta, bez zakładki firmy)', () => {
    renderSettings();

    // Company Profile tab was removed from Settings — it lives at /app/profile (no duplication)
    // BETA-CAL-01: calendar tab is hidden (CALENDAR_SYNC_SETTINGS_VISIBLE = false)
    const sections = [
      'settings-mobile-nav-general',
      'settings-mobile-nav-documents',
      'settings-mobile-nav-email',
      'settings-mobile-nav-subscription',
      'settings-mobile-nav-privacy',
      'settings-mobile-nav-account',
    ];

    for (const testId of sections) {
      expect(screen.getByTestId(testId)).toBeDefined();
    }
  });

  it('nie renderuje zakładki firmy w ustawieniach — profil firmy dostępny pod /app/profile', () => {
    renderSettings();

    // Company Profile was deduplicated: it's only accessible via MoreScreen → /app/profile
    expect(screen.queryByTestId('settings-mobile-nav-company')).toBeNull();
  });

  it('nie renderuje zakładki kalendarza w ustawieniach (BETA-CAL-01: zero działających dostawców)', () => {
    renderSettings();
    // BETA-CAL-01: CalendarSync tab hidden — all OAuth providers are "coming soon"
    expect(screen.queryByTestId('settings-mobile-nav-calendar')).toBeNull();
  });

  it('domyślnie pokazuje listę sekcji (level 1 — żadna sekcja nie jest otwarta)', () => {
    renderSettings();

    // All section buttons are visible in the list view (mobileSection === null)
    expect(screen.getByTestId('settings-mobile-nav-general')).toBeDefined();
    expect(screen.getByTestId('settings-mobile-nav-account')).toBeDefined();
  });

  it('kliknięcie w "subscription" wyświetla sekcję subskrypcji (level 2 drill-down)', () => {
    renderSettings();

    fireEvent.click(screen.getByTestId('settings-mobile-nav-subscription'));

    expect(screen.getByTestId('subscription-section')).toBeDefined();
  });

  it('kliknięcie w "account" wyświetla sekcję konta (level 2 drill-down)', () => {
    renderSettings();

    fireEvent.click(screen.getByTestId('settings-mobile-nav-account'));

    expect(screen.getByTestId('delete-account-section')).toBeDefined();
  });

  it('po wejściu w drill-down lista sekcji jest ukryta', () => {
    renderSettings();

    fireEvent.click(screen.getByTestId('settings-mobile-nav-subscription'));

    // Section list buttons should no longer be in the DOM (conditional render)
    expect(screen.queryByTestId('settings-mobile-nav-general')).toBeNull();
    expect(screen.queryByTestId('settings-mobile-nav-account')).toBeNull();
  });

  it('mobilna nawigacja nie zawiera poziomego paska przewijania', () => {
    const { container } = renderSettings();

    // Mobile nav element is a <nav>, not a horizontally scrollable div
    const mobileNav = container.querySelector('nav[aria-label]');
    expect(mobileNav).not.toBeNull();
    expect(mobileNav?.className).not.toContain('overflow-x-auto');
  });
});
