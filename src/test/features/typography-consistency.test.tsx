import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import Settings from '@/pages/Settings';
import Billing from '@/pages/Billing';
import Admin from '@/pages/Admin';

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

  it('Billing page H1 has responsive sizing (text-2xl sm:text-3xl)', () => {
    const { container } = render(<Billing />, { wrapper: TestWrapper });

    const h1 = container.querySelector('h1');
    expect(h1).toBeDefined();
    expect(h1?.className).toContain('text-2xl');
    expect(h1?.className).toContain('sm:text-3xl');
  });

  it('Admin page H1 has responsive sizing (text-2xl sm:text-3xl)', () => {
    const { container } = render(<Admin />, { wrapper: TestWrapper });

    const h1Elements = container.querySelectorAll('h1');
    // Admin page has main H1 (should be responsive)
    const mainH1 = Array.from(h1Elements).find(h1 =>
      h1.textContent?.includes('Panel Administratora')
    );

    expect(mainH1).toBeDefined();
    expect(mainH1?.className).toContain('text-2xl');
    expect(mainH1?.className).toContain('sm:text-3xl');
  });

  it('all app page H1s use consistent font-weight (font-bold)', () => {
    const pages = [
      <Settings />,
      <Billing />,
      <Admin />,
    ];

    pages.forEach((page) => {
      const { container } = render(page, { wrapper: TestWrapper });
      const h1 = container.querySelector('h1');
      expect(h1?.className).toContain('font-bold');
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
