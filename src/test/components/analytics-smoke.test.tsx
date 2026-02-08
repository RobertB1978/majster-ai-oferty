import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          data: [],
          error: null,
          count: 0,
        }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

// Mock AuthContext to provide a fake user
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { access_token: 'test-token' },
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock useAnalyticsStats to return static data (avoids Supabase calls)
vi.mock('@/hooks/useAnalyticsStats', () => ({
  useAnalyticsStats: () => ({
    data: {
      totalProjects: 10,
      statusCounts: { 'Nowy': 3, 'Wycena w toku': 2, 'Oferta wysłana': 3, 'Zaakceptowany': 2 },
      monthlyProjects: [
        { month: 'Sty', projekty: 1 },
        { month: 'Lut', projekty: 2 },
      ],
      projectsTrend: 15,
      thisMonthProjects: 2,
      totalValue: 50000,
      avgValue: 5000,
      conversionRate: 20,
      totalEvents: 5,
      eventsByType: { meeting: 2, deadline: 1, reminder: 1, other: 1 },
      eventsByStatus: { pending: 3, completed: 2 },
      weeklyEvents: [{ week: '3 Lut', wydarzenia: 2 }],
      upcomingEventsCount: 1,
      totalClients: 4,
    },
    isLoading: false,
  }),
}));

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => {
  const MockComponent = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="recharts-mock">{children}</div>
  );
  return {
    ResponsiveContainer: MockComponent,
    BarChart: MockComponent,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    PieChart: MockComponent,
    Pie: MockComponent,
    Cell: () => null,
    AreaChart: MockComponent,
    Area: () => null,
  };
});

import Analytics from '@/pages/Analytics';

function renderAnalytics() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MemoryRouter>
          <Analytics />
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

describe('Analytics page — smoke test (P0 regression guard)', () => {
  it('renders without crashing (CardHeader, CardTitle, CardDescription must be defined)', () => {
    const { container } = renderAnalytics();
    // The page should render content, not an error screen
    expect(container.textContent).toContain('10'); // totalProjects
    expect(container.textContent).toContain('50'); // part of 50000 totalValue
  });

  it('renders KPI cards with project data', () => {
    renderAnalytics();
    // Check that key stats are visible
    expect(screen.getByText('10')).toBeDefined(); // totalProjects
    expect(screen.getByText('4')).toBeDefined(); // totalClients
    expect(screen.getByText('20%')).toBeDefined(); // conversionRate
  });

  it('renders chart sections with CardHeader and CardTitle', () => {
    const { container } = renderAnalytics();
    // CardHeader renders as div with class containing "flex flex-col space-y-1.5 p-6"
    const cardHeaders = container.querySelectorAll('[class*="flex flex-col space-y-1.5"]');
    // Analytics page has 4 CardHeaders (2 project charts + 2 calendar charts)
    expect(cardHeaders.length).toBe(4);
  });
});
