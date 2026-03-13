/**
 * beta-surface-visibility.test.tsx
 *
 * Sprint I — Beta Surface Cleanup
 *
 * Weryfikuje, że powierzchnie beta są spójne i wiarygodne:
 *
 * 1. Settings — brak zakładki kalendarza (BETA-CAL-01: zero działających dostawców OAuth)
 * 2. Navigation — Team/Marketplace/Analytics nie pojawiają się w nawigacji użytkownika
 * 3. SocialLoginButtons — Apple login ukryty (APPLE_LOGIN_ENABLED = false)
 * 4. SocialLoginButtons — Google login widoczny (prawidłowo skonfigurowany lub obsługuje błędy)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'pl' },
  }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    loginWithGoogle: vi.fn(),
    loginWithApple: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/ConfigContext', () => ({
  useConfig: () => ({
    config: {
      navigation: {
        mainItems: [
          { id: 'dashboard',   label: 'Pulpit',     path: '/app/dashboard',   icon: 'LayoutDashboard', visible: true,  comingSoon: false, requiredPlan: 'free',     order: 0 },
          { id: 'offers',      label: 'Oferty',      path: '/app/offers',      icon: 'FileText',        visible: true,  comingSoon: false, requiredPlan: 'free',     order: 1 },
          { id: 'jobs',        label: 'Projekty',    path: '/app/projects',    icon: 'Briefcase',       visible: true,  comingSoon: false, requiredPlan: 'free',     order: 2 },
          { id: 'clients',     label: 'Klienci',     path: '/app/customers',   icon: 'Users',           visible: true,  comingSoon: false, requiredPlan: 'free',     order: 3 },
          { id: 'calendar',    label: 'Kalendarz',   path: '/app/calendar',    icon: 'Calendar',        visible: true,  comingSoon: false, requiredPlan: 'free',     order: 4 },
          { id: 'finance',     label: 'Finanse',     path: '/app/finance',     icon: 'Wallet',          visible: true,  comingSoon: false, requiredPlan: 'free',     order: 5 },
          { id: 'templates',   label: 'Szablony',    path: '/app/templates',   icon: 'Package',         visible: true,  comingSoon: false, requiredPlan: 'free',     order: 6 },
          { id: 'team',        label: 'Zespół',      path: '/app/team',        icon: 'UserPlus',        visible: false, comingSoon: true,  requiredPlan: 'pro',      order: 7 },
          { id: 'marketplace', label: 'Marketplace', path: '/app/marketplace', icon: 'Store',           visible: false, comingSoon: true,  requiredPlan: 'business', order: 8 },
          { id: 'analytics',   label: 'Analityka',   path: '/app/analytics',   icon: 'BarChart3',       visible: false, comingSoon: true,  requiredPlan: 'business', order: 9 },
          { id: 'plan',        label: 'Mój plan',    path: '/app/plan',        icon: 'CreditCard',      visible: true,  comingSoon: false, requiredPlan: 'free',     order: 10 },
        ],
      },
    },
  }),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Stub Settings sub-components
vi.mock('@/pages/CompanyProfile', () => ({ default: () => <div data-testid="company-profile" /> }));
vi.mock('@/components/settings/LanguageSwitcher', () => ({ LanguageSwitcher: () => <div /> }));
vi.mock('@/components/settings/ContactEmailSettings', () => ({ ContactEmailSettings: () => <div /> }));
vi.mock('@/components/settings/DeleteAccountSection', () => ({ DeleteAccountSection: () => <div /> }));
vi.mock('@/components/calendar/CalendarSync', () => ({ CalendarSync: () => <div data-testid="calendar-sync" /> }));
vi.mock('@/components/documents/CompanyDocuments', () => ({ CompanyDocuments: () => <div /> }));
vi.mock('@/components/notifications/PushNotificationSettings', () => ({ PushNotificationSettings: () => <div /> }));
vi.mock('@/components/settings/BiometricSettings', () => ({ BiometricSettings: () => <div /> }));
vi.mock('@/components/billing/SubscriptionSection', () => ({ SubscriptionSection: () => <div /> }));

// ─── Importy ────────────────────────────────────────────────────────────────

import Settings from '@/pages/Settings';
import { Navigation } from '@/components/layout/Navigation';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { PLANS } from '@/config/plans';

// ─── 1. Settings — brak zakładki kalendarza ──────────────────────────────────

describe('Settings — BETA-CAL-01: zakładka kalendarza ukryta', () => {
  function renderSettings() {
    return render(<MemoryRouter><Settings /></MemoryRouter>);
  }

  it('nie renderuje mobilnej pozycji nawigacyjnej dla kalendarza', () => {
    renderSettings();
    expect(screen.queryByTestId('settings-mobile-nav-calendar')).toBeNull();
  });

  it('nie renderuje komponentu CalendarSync w DOM', () => {
    renderSettings();
    // CalendarSync stub has data-testid="calendar-sync"
    // It should not appear since the tab is hidden
    expect(screen.queryByTestId('calendar-sync')).toBeNull();
  });

  it('renderuje pozostałe wymagane sekcje ustawień', () => {
    renderSettings();
    const requiredSections = [
      'settings-mobile-nav-company',
      'settings-mobile-nav-general',
      'settings-mobile-nav-documents',
      'settings-mobile-nav-email',
      'settings-mobile-nav-subscription',
      'settings-mobile-nav-privacy',
      'settings-mobile-nav-account',
    ];
    for (const testId of requiredSections) {
      expect(screen.getByTestId(testId), `Brakuje sekcji ${testId}`).toBeDefined();
    }
  });
});

// ─── 2. Navigation — Team/Marketplace/Analytics niewidoczne ──────────────────

describe('Navigation — niedokończone moduły niewidoczne w nawigacji użytkownika', () => {
  function renderNav() {
    return render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Navigation />
      </MemoryRouter>
    );
  }

  it('renderuje się bez błędu', () => {
    expect(() => renderNav()).not.toThrow();
  });

  it('nie wyświetla linku do /app/team (comingSoon, visible: false)', () => {
    renderNav();
    const teamLinks = screen.queryAllByRole('link', { name: /zesp/i });
    // Even if found by label, should not link to /app/team
    const teamNavLink = screen.queryByRole('link', { name: /^zesp/i });
    if (teamNavLink) {
      expect((teamNavLink as HTMLAnchorElement).href).not.toContain('/app/team');
    }
  });

  it('nie wyświetla linku do /app/marketplace (comingSoon, visible: false)', () => {
    renderNav();
    const marketplaceLinks = screen.queryAllByRole('link');
    const hasMarketplace = marketplaceLinks.some(
      (link) => (link as HTMLAnchorElement).href?.includes('/app/marketplace')
    );
    expect(hasMarketplace).toBe(false);
  });

  it('nie wyświetla linku do /app/analytics (comingSoon, visible: false)', () => {
    renderNav();
    const allLinks = screen.queryAllByRole('link');
    const hasAnalytics = allLinks.some(
      (link) => (link as HTMLAnchorElement).href?.includes('/app/analytics')
    );
    expect(hasAnalytics).toBe(false);
  });
});

// ─── 3. SocialLoginButtons — Apple ukryty, Google widoczny ───────────────────

describe('SocialLoginButtons — stan beta', () => {
  function renderSocial() {
    return render(
      <MemoryRouter>
        <SocialLoginButtons />
      </MemoryRouter>
    );
  }

  it('renderuje przycisk Google (APPLE_LOGIN_ENABLED = false, Google aktywny)', () => {
    renderSocial();
    const googleBtn = screen.queryByRole('button', { name: /google/i });
    expect(googleBtn).not.toBeNull();
  });

  it('nie renderuje przycisku Apple (AUDIT-AUTH-01: Apple OAuth niekompletny)', () => {
    renderSocial();
    const appleBtn = screen.queryByRole('button', { name: /apple/i });
    expect(appleBtn).toBeNull();
  });
});

// ─── 4. Plans — excelExport nie obiecywany bez UI (BETA-EXCEL-01) ─────────────

describe('Plans — excelExport nieobecny w cennikowych featuresKeys (BETA-EXCEL-01)', () => {
  it('żaden plan nie zawiera klucza excelExport w featuresKeys', () => {
    for (const plan of PLANS) {
      const hasExcel = plan.featuresKeys.some((k) => k.includes('excelExport'));
      expect(hasExcel, `Plan "${plan.id}" zawiera excelExport w featuresKeys — brak UI przycisku`).toBe(false);
    }
  });

  it('żaden plan nie zawiera "Eksport Excel" w fallback features[]', () => {
    for (const plan of PLANS) {
      const hasExcel = plan.features.some((f) => f.toLowerCase().includes('excel'));
      expect(hasExcel, `Plan "${plan.id}" zawiera Excel w features[] — brak UI przycisku`).toBe(false);
    }
  });
});
