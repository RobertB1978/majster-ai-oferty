import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminGuard } from '@/components/layout/AdminGuard';

/**
 * AdminGuard RBAC route-protection tests.
 *
 * Verifies that:
 *  - Unauthenticated users are sent to /login
 *  - Authenticated non-admin users are sent to /app/dashboard
 *  - Authenticated admin users see the protected content
 *
 * All three cases must pass for the /admin split DoD to be met.
 */

// --- Module mocks (hoisted before imports are resolved) ---
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useAdminRole', () => ({
  useAdminRole: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

// i18n setup: return fallback string so tested components don't need real i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'pl' },
  }),
}));

// --- Import mocked hooks after vi.mock declarations ---
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';

// --- Test helpers ---

const mockUser = {
  id: 'user-1',
  email: 'user@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

/** Renders AdminGuard in a router with stub routes for the redirect targets. */
function renderWithRouter(initialPath = '/admin/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        <Route path="/app/dashboard" element={<div data-testid="app-dashboard">Dashboard</div>} />
        <Route
          path="/admin/*"
          element={
            <AdminGuard>
              <div data-testid="admin-content">Admin Content</div>
            </AdminGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unauthenticated user', () => {
    it('redirects to /login when no user is present', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithApple: vi.fn(),
      });
      vi.mocked(useAdminRole).mockReturnValue({
        roles: [],
        isAdmin: false,
        isModerator: false,
        hasAnyRole: false,
        isLoading: false,
        refetch: vi.fn(),
      });

      renderWithRouter();

      expect(screen.getByTestId('login-page')).toBeDefined();
      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.queryByTestId('app-dashboard')).toBeNull();
    });
  });

  describe('authenticated non-admin user', () => {
    it('redirects to /app/dashboard and blocks admin content', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as unknown as ReturnType<typeof useAuth>['user'],
        session: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithApple: vi.fn(),
      });
      vi.mocked(useAdminRole).mockReturnValue({
        roles: ['user'],
        isAdmin: false,
        isModerator: false,
        hasAnyRole: true,
        isLoading: false,
        refetch: vi.fn(),
      });

      renderWithRouter();

      expect(screen.getByTestId('app-dashboard')).toBeDefined();
      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.queryByTestId('login-page')).toBeNull();
    });

    it('blocks access for moderator (moderator != platform admin)', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as unknown as ReturnType<typeof useAuth>['user'],
        session: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithApple: vi.fn(),
      });
      vi.mocked(useAdminRole).mockReturnValue({
        roles: ['moderator'],
        isAdmin: false,
        isModerator: true,
        hasAnyRole: true,
        isLoading: false,
        refetch: vi.fn(),
      });

      renderWithRouter();

      expect(screen.getByTestId('app-dashboard')).toBeDefined();
      expect(screen.queryByTestId('admin-content')).toBeNull();
    });
  });

  describe('authenticated admin user', () => {
    it('renders protected children for a platform admin', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as unknown as ReturnType<typeof useAuth>['user'],
        session: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithApple: vi.fn(),
      });
      vi.mocked(useAdminRole).mockReturnValue({
        roles: ['admin'],
        isAdmin: true,
        isModerator: true,
        hasAnyRole: true,
        isLoading: false,
        refetch: vi.fn(),
      });

      renderWithRouter();

      expect(screen.getByTestId('admin-content')).toBeDefined();
      expect(screen.queryByTestId('login-page')).toBeNull();
      expect(screen.queryByTestId('app-dashboard')).toBeNull();
    });
  });

  describe('loading state', () => {
    it('renders a skeleton loader while auth is resolving', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        loginWithGoogle: vi.fn(),
        loginWithApple: vi.fn(),
      });
      vi.mocked(useAdminRole).mockReturnValue({
        roles: [],
        isAdmin: false,
        isModerator: false,
        hasAnyRole: false,
        isLoading: false,
        refetch: vi.fn(),
      });

      const { container } = renderWithRouter();

      // Should not render any page yet — only the skeleton
      expect(screen.queryByTestId('admin-content')).toBeNull();
      expect(screen.queryByTestId('login-page')).toBeNull();
      expect(screen.queryByTestId('app-dashboard')).toBeNull();
      // Container should have something (the skeleton div)
      expect(container.firstChild).not.toBeNull();
    });
  });
});
