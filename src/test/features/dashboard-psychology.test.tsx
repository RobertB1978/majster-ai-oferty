/**
 * dashboard-psychology.test.tsx
 *
 * Tests for Prompt 3 — product psychology & trust surfaces:
 *  1. DashboardNextStep — shows next onboarding step with progress
 *  2. DashboardTrustBar — renders 3 trust signals (autosave, encryption, RODO)
 *  3. DashboardOnboardingProgress — shows percentage bar
 *  4. OnboardingWizard — step numbers, time estimates, celebration particles
 *  5. EmptyDashboard — warmer copy with time estimate
 *  6. Empty states — contextual hints in RecentProjects and ActivityFeed
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---------- Mock navigate ----------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------- Mock supabase ----------

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

// ---------- Mock AuthContext ----------

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' }, isLoading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------- Mock i18next ----------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    },
    i18n: { language: 'pl', changeLanguage: vi.fn() },
  }),
}));

// ---------- Mock framer-motion (minimal) ----------

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, prop: string) => {
      // Return a forwardRef component for any HTML element
      return ({ children, ...props }: Record<string, unknown>) => {
        const Tag = prop as keyof JSX.IntrinsicElements;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <Tag {...(props as any)}>{children as React.ReactNode}</Tag>;
      };
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------- Wrapper ----------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/app/dashboard']}>{children}</MemoryRouter>
);

// ---------- Tests ----------

describe('DashboardTrustBar — trust signals', () => {
  it('renders 3 trust signal labels', async () => {
    const { DashboardTrustBar } = await import('@/components/dashboard/DashboardTrustBar');
    render(<DashboardTrustBar />, { wrapper: Wrapper });

    expect(screen.getByText('dashboard.trust.autosave')).toBeDefined();
    expect(screen.getByText('dashboard.trust.encrypted')).toBeDefined();
    expect(screen.getByText('dashboard.trust.rodo')).toBeDefined();
  });
});

describe('DashboardOnboardingProgress — progress bar', () => {
  it('renders progress percentage for in-progress onboarding', async () => {
    const { DashboardOnboardingProgress } = await import(
      '@/components/dashboard/DashboardOnboardingProgress'
    );

    const progress = {
      id: '1',
      user_id: 'u1',
      current_step: 3,
      completed_steps: [1, 2],
      is_completed: false,
      skipped_at: null,
      completed_at: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    render(<DashboardOnboardingProgress progress={progress} />, { wrapper: Wrapper });

    // 2 of 5 = 40%
    expect(screen.getByText('40%')).toBeDefined();
    expect(screen.getByText('dashboard.profileProgress.label')).toBeDefined();
  });

  it('renders nothing when onboarding is completed', async () => {
    const { DashboardOnboardingProgress } = await import(
      '@/components/dashboard/DashboardOnboardingProgress'
    );

    const progress = {
      id: '1',
      user_id: 'u1',
      current_step: 5,
      completed_steps: [1, 2, 3, 4, 5],
      is_completed: true,
      skipped_at: null,
      completed_at: '2026-01-01',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    const { container } = render(<DashboardOnboardingProgress progress={progress} />, {
      wrapper: Wrapper,
    });

    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when onboarding is skipped', async () => {
    const { DashboardOnboardingProgress } = await import(
      '@/components/dashboard/DashboardOnboardingProgress'
    );

    const progress = {
      id: '1',
      user_id: 'u1',
      current_step: 1,
      completed_steps: [],
      is_completed: false,
      skipped_at: '2026-01-01',
      completed_at: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    const { container } = render(<DashboardOnboardingProgress progress={progress} />, {
      wrapper: Wrapper,
    });

    expect(container.innerHTML).toBe('');
  });
});

describe('DashboardNextStep — next step guidance', () => {
  it('renders next step card with step info', async () => {
    const { DashboardNextStep } = await import('@/components/dashboard/DashboardNextStep');

    const progress = {
      id: '1',
      user_id: 'u1',
      current_step: 2,
      completed_steps: [1],
      is_completed: false,
      skipped_at: null,
      completed_at: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    render(<DashboardNextStep progress={progress} onOpenWizard={vi.fn()} />, {
      wrapper: Wrapper,
    });

    // Should show step 2 title (first client)
    expect(screen.getByText('onboarding.steps.firstClient.title')).toBeDefined();
    // Should show step label "Step 2 of 5"
    expect(
      screen.getByText((text) => text.includes('dashboard.nextStep.label'))
    ).toBeDefined();
  });

  it('renders nothing when onboarding is completed', async () => {
    const { DashboardNextStep } = await import('@/components/dashboard/DashboardNextStep');

    const progress = {
      id: '1',
      user_id: 'u1',
      current_step: 5,
      completed_steps: [1, 2, 3, 4, 5],
      is_completed: true,
      skipped_at: null,
      completed_at: '2026-01-01',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    const { container } = render(
      <DashboardNextStep progress={progress} onOpenWizard={vi.fn()} />,
      { wrapper: Wrapper }
    );

    expect(container.innerHTML).toBe('');
  });
});

describe('EmptyDashboard — warmer copy', () => {
  it('shows time estimate and warmer welcome title', async () => {
    const { EmptyDashboard } = await import('@/components/dashboard/EmptyDashboard');

    render(<EmptyDashboard />, { wrapper: Wrapper });

    expect(screen.getByText('dashboard.emptyWelcomeTitle')).toBeDefined();
    expect(screen.getByText('dashboard.emptyWelcomeSubtitle')).toBeDefined();
    expect(screen.getByText('dashboard.emptyTimeEstimate')).toBeDefined();
  });
});

describe('OnboardingWizard — step time estimates', () => {
  // Mock useOnboarding for this test
  vi.mock('@/hooks/useOnboarding', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/hooks/useOnboarding')>();
    return {
      ...actual,
      useOnboardingProgress: () => ({
        data: { completed_steps: [1], is_completed: false, skipped_at: null },
        isLoading: false,
      }),
      useSkipOnboarding: () => ({ mutateAsync: vi.fn() }),
    };
  });

  it('shows time estimate and encouragement for partial progress', async () => {
    const { OnboardingWizard } = await import('@/components/onboarding/OnboardingWizard');

    render(<OnboardingWizard open={true} onClose={vi.fn()} />, { wrapper: Wrapper });

    // Should show remaining time estimate
    const timeText = screen.getByText((text) => text.includes('onboarding.timeRemaining'));
    expect(timeText).toBeDefined();

    // Should show encouragement message (1 of 5 completed)
    const encouragement = screen.getByText((text) =>
      text.includes('onboarding.encouragement')
    );
    expect(encouragement).toBeDefined();

    // Should show step time estimates for incomplete steps
    const stepTimes = screen.getAllByText((text) =>
      text.includes('onboarding.stepTimeEstimate')
    );
    expect(stepTimes.length).toBe(4); // 4 incomplete steps
  });
});
