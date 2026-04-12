import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import Settings from '@/pages/Settings';
import Plan from '@/pages/Plan';

// Mock ResizeObserver for Recharts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
});

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
      language: 'en',
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: '1' } } }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com' },
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock admin hooks
vi.mock('@/hooks/useAdminRole', () => ({
  useAdminRole: () => ({
    isAdmin: true,
    isModerator: false,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useOrganizationAdmin', () => ({
  useOrganizationAdmin: () => ({
    isOrgAdmin: true,
    isLoading: false,
  }),
}));

// Mock hooks used by Plan.tsx
vi.mock('@/hooks/useSubscription', () => ({
  useUserSubscription: () => ({
    data: null,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useStripe', () => ({
  useCreateCheckoutSession: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCustomerPortal: () => ({ mutateAsync: vi.fn(), isPending: false }),
  STRIPE_PRICE_IDS: {},
  isRealStripePriceId: () => false,
  isStripeConfigured: () => false,
}));

vi.mock('@/contexts/ConfigContext', () => ({
  useConfig: () => ({
    config: {
      plans: {
        tiers: [
          { id: 'free', name: 'billing.plans.free.name', price: 0, features: [], limits: { maxProjects: 3, maxClients: 5, maxTeamMembers: 0, maxStorageMB: 100 } },
        ],
      },
    },
    isLoading: false,
  }),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        {children}
      </HelmetProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

describe('Typography Consistency - H1 Standardization', () => {
  it('Settings page H1 has responsive sizing (text-2xl sm:text-3xl)', () => {
    const { container } = render(<Settings />, { wrapper: TestWrapper });

    const h1 = container.querySelector('h1');
    expect(h1).toBeDefined();
    expect(h1?.className).toContain('text-2xl');
    expect(h1?.className).toContain('sm:text-3xl');
  });

  it('Plan page H1 has responsive sizing (text-2xl sm:text-3xl)', () => {
    const { container } = render(<Plan />, { wrapper: TestWrapper });

    const h1 = container.querySelector('h1');
    expect(h1).toBeDefined();
    expect(h1?.className).toContain('text-2xl');
    expect(h1?.className).toContain('sm:text-3xl');
  });

  it('all app page H1s use the semantic type-title class', () => {
    const pages = [
      <Settings />,
      <Plan />,
    ];

    pages.forEach((page) => {
      const { container } = render(page, { wrapper: TestWrapper });
      const h1 = container.querySelector('h1');
      expect(h1?.className).toContain('type-title');
    });
  });

  it('H1 elements maintain semantic structure (not divs styled as headings)', () => {
    const { container } = render(<Settings />, { wrapper: TestWrapper });

    const h1Elements = container.querySelectorAll('h1');
    expect(h1Elements.length).toBeGreaterThan(0);

    // Ensure H1s are actual h1 elements, not divs with heading classes
    h1Elements.forEach(h1 => {
      expect(h1.tagName).toBe('H1');
    });
  });
});
