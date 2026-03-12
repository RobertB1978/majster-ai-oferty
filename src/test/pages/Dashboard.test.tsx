import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Stubs ──────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('@/hooks/useDashboardStats', () => ({
  useDashboardStats: () => ({
    totalProjects: 3,
    totalClients: 2,
    newCount: 1,
    inProgressCount: 1,
    sentCount: 1,
    acceptedCount: 1,
    recentWeekCount: 1,
    recentProjects: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useOnboarding', () => ({
  useOnboardingProgress: () => ({ data: { is_completed: true, skipped_at: null }, isLoading: false }),
  useCreateOnboardingProgress: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/hooks/useSubscription', () => ({
  usePlanFeatures: () => ({ showAds: true, currentPlan: 'free' }),
}));

vi.mock('@/hooks/useExpirationMonitor', () => ({
  useExpirationMonitor: () => ({
    expiringOffersCount: 0,
    subscriptionExpiresIn: null,
    isSubscriptionExpiring: false,
  }),
}));

vi.mock('@/components/dashboard/EmptyDashboard', () => ({
  EmptyDashboard: () => <div data-testid="empty-dashboard" />,
}));
vi.mock('@/components/dashboard/DashboardStats', () => ({
  DashboardStats: () => <div data-testid="dashboard-stats" />,
}));
vi.mock('@/components/dashboard/ProjectStatusBreakdown', () => ({
  ProjectStatusBreakdown: () => <div data-testid="project-status-breakdown" />,
}));
vi.mock('@/components/dashboard/RecentProjects', () => ({
  RecentProjects: () => <div data-testid="recent-projects" />,
}));
vi.mock('@/components/dashboard/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions" />,
}));
vi.mock('@/components/onboarding/OnboardingWizard', () => ({
  OnboardingWizard: () => <div data-testid="onboarding-wizard" />,
}));
vi.mock('@/components/dashboard/QuoteCreationHub', () => ({
  QuoteCreationHub: () => <div data-testid="quote-creation-hub" />,
}));
vi.mock('@/components/ads/AdBanner', () => ({
  AdBanner: ({ variant }: { variant: string }) => (
    <div data-testid={`ad-banner-${variant}`} />
  ),
}));
vi.mock('@/components/billing/TrialBanner', () => ({
  TrialBanner: () => <div data-testid="trial-banner" />,
}));
vi.mock('@/components/ui/skeleton-screens', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton" />,
}));
vi.mock('@/components/dashboard/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));
vi.mock('@/components/dashboard/TodayTasks', () => ({
  TodayTasks: () => <div data-testid="today-tasks" />,
}));

import Dashboard from '@/pages/Dashboard';

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );

describe('Dashboard — density cleanup', () => {
  it('renderuje QuoteCreationHub', () => {
    renderDashboard();
    expect(screen.getByTestId('quote-creation-hub')).toBeDefined();
  });

  it('QuoteCreationHub NIE jest opakowany w border-2/bg-primary/5 (obniżony priorytet wizualny)', () => {
    renderDashboard();
    const hub = screen.getByTestId('quote-creation-hub');
    // Walk up to the immediate wrapper div
    const wrapper = hub.parentElement as HTMLElement;
    expect(wrapper.className).not.toContain('border-2');
    expect(wrapper.className).not.toContain('bg-primary/5');
  });

  it('wyświetla dokładnie jeden baner reklamowy dla użytkownika free (brak duplikacji)', () => {
    renderDashboard();

    // Only horizontal banner should be present; no inline duplicate
    expect(screen.getByTestId('ad-banner-horizontal')).toBeDefined();
    expect(screen.queryByTestId('ad-banner-inline')).toBeNull();
  });

  it('pionowy baner reklamowy pojawia się w siatce z podziałem statusu', () => {
    renderDashboard();
    // vertical ad is rendered inside the status breakdown grid (showAds=true)
    expect(screen.getByTestId('ad-banner-vertical')).toBeDefined();
  });
});
