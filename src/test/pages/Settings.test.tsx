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
vi.mock('@/pages/CompanyProfile', () => ({
  default: () => <div data-testid="company-profile" />,
}));
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

import Settings from '@/pages/Settings';

const renderSettings = () =>
  render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
  );

describe('Settings — mobile navigation', () => {
  it('renderuje mobilne pozycje nawigacyjne dla wszystkich sekcji', () => {
    renderSettings();

    const sections = [
      'settings-mobile-nav-company',
      'settings-mobile-nav-general',
      'settings-mobile-nav-documents',
      'settings-mobile-nav-calendar',
      'settings-mobile-nav-email',
      'settings-mobile-nav-subscription',
      'settings-mobile-nav-privacy',
      'settings-mobile-nav-account',
    ];

    for (const testId of sections) {
      expect(screen.getByTestId(testId)).toBeDefined();
    }
  });

  it('domyślnie aktywna sekcja to "company"', () => {
    renderSettings();

    const companyBtn = screen.getByTestId('settings-mobile-nav-company');
    // Active button gets bg-primary/10 class via conditional join
    expect(companyBtn.className).toContain('bg-primary/10');
  });

  it('kliknięcie w "calendar" przełącza aktywną sekcję', () => {
    renderSettings();

    const calendarBtn = screen.getByTestId('settings-mobile-nav-calendar');
    fireEvent.click(calendarBtn);

    expect(calendarBtn.className).toContain('bg-primary/10');
    // previously active company button should no longer have active class
    const companyBtn = screen.getByTestId('settings-mobile-nav-company');
    expect(companyBtn.className).not.toContain('bg-primary/10');
  });

  it('kliknięcie w "subscription" wyświetla sekcję subskrypcji', () => {
    renderSettings();

    fireEvent.click(screen.getByTestId('settings-mobile-nav-subscription'));

    expect(screen.getByTestId('subscription-section')).toBeDefined();
  });

  it('kliknięcie w "account" wyświetla sekcję konta', () => {
    renderSettings();

    fireEvent.click(screen.getByTestId('settings-mobile-nav-account'));

    expect(screen.getByTestId('delete-account-section')).toBeDefined();
  });

  it('mobilna nawigacja nie zawiera poziomego paska przewijania', () => {
    const { container } = renderSettings();

    // Mobile nav element is a <nav>, not a horizontally scrollable div
    const mobileNav = container.querySelector('nav[aria-label]');
    expect(mobileNav).not.toBeNull();
    expect(mobileNav?.className).not.toContain('overflow-x-auto');
  });
});
