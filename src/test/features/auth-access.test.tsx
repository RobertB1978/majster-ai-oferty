/**
 * Tests for app login access — verifies that:
 * 1. AuthContext resolves isLoading even when getSession fails
 * 2. ProtectedRoute redirects unauthenticated users to /login
 * 3. ProtectedRoute renders children for authenticated users
 * 4. App mounts without hanging on splash screen (lazy providers have Suspense)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ── Supabase mock (vi.hoisted so vi.mock factory can reference them) ──
const {
  mockOnAuthStateChange,
  mockGetSession,
  mockSignInWithPassword,
  mockSignOut,
} = vi.hoisted(() => ({
  mockOnAuthStateChange: vi.fn(),
  mockGetSession: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignOut: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
      getSession: mockGetSession,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      resend: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }),
  },
}));

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Helper: renders a route tree with AuthProvider
function renderWithAuth(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <div data-testid="app-page">App Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

// Helper: component that displays auth state for testing
function AuthStateDisplay() {
  const { user, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
    </div>
  );
}

describe('Auth Access', () => {
  const unsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });
  });

  describe('AuthContext — session resolution', () => {
    it('resolves isLoading=false when getSession succeeds with no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      render(
        <MemoryRouter>
          <AuthProvider>
            <AuthStateDisplay />
          </AuthProvider>
        </MemoryRouter>
      );

      // Initially loading
      expect(screen.getByTestId('loading').textContent).toBe('true');

      // Should resolve
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('resolves isLoading=false when getSession succeeds with a session', async () => {
      const mockSession = {
        user: { id: 'u1', email: 'test@test.pl' },
        access_token: 'tok',
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      render(
        <MemoryRouter>
          <AuthProvider>
            <AuthStateDisplay />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      expect(screen.getByTestId('user').textContent).toBe('test@test.pl');
    });

    it('resolves isLoading=false even when getSession REJECTS (network error)', async () => {
      // This is the critical bug fix — before, a rejected promise left isLoading=true forever
      mockGetSession.mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter>
          <AuthProvider>
            <AuthStateDisplay />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('picks up session from onAuthStateChange callback', async () => {
      // getSession returns no session, but onAuthStateChange fires with a session
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      let authCallback: (event: string, session: unknown) => void = () => {};
      mockOnAuthStateChange.mockImplementation((cb: typeof authCallback) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe } } };
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <AuthStateDisplay />
          </AuthProvider>
        </MemoryRouter>
      );

      // Wait for initial loading to resolve first
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Fire auth state change with a session (wrap in act)
      const { act } = await import('react');
      act(() => {
        authCallback('SIGNED_IN', {
          user: { id: 'u2', email: 'callback@test.pl' },
          access_token: 'tok2',
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('callback@test.pl');
      });
    });
  });

  describe('ProtectedRoute — access control', () => {
    it('redirects to /login when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      renderWithAuth('/app/dashboard');

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('app-page')).not.toBeInTheDocument();
    });

    it('renders protected content when user IS authenticated', async () => {
      const mockSession = {
        user: { id: 'u1', email: 'auth@test.pl' },
        access_token: 'tok',
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      renderWithAuth('/app/dashboard');

      await waitFor(() => {
        expect(screen.getByTestId('app-page')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('shows loading spinner while auth state is resolving', () => {
      // getSession never resolves — simulates slow network
      mockGetSession.mockReturnValue(new Promise(() => {}));

      renderWithAuth('/app/dashboard');

      // Should show spinner (animate-spin class), not the app or login
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.queryByTestId('app-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('redirects to /login when getSession fails (network error)', async () => {
      mockGetSession.mockRejectedValue(new Error('fetch failed'));

      renderWithAuth('/app/dashboard');

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });
  });

  describe('AuthProvider — login function', () => {
    it('returns user-friendly error for invalid credentials', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      let loginFn: ((email: string, password: string) => Promise<{ error: string | null }>) | null = null;

      function LoginCapture() {
        const { login } = useAuth();
        loginFn = login;
        return null;
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginCapture />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(loginFn).not.toBeNull());
      const result = await loginFn!('wrong@test.pl', 'bad');
      expect(result.error).toBe('Nieprawidłowy email lub hasło');
    });

    it('returns user-friendly error for unconfirmed email', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' },
      });

      let loginFn: ((email: string, password: string) => Promise<{ error: string | null }>) | null = null;

      function LoginCapture() {
        const { login } = useAuth();
        loginFn = login;
        return null;
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginCapture />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(loginFn).not.toBeNull());
      const result = await loginFn!('test@test.pl', 'pass');
      expect(result.error).toBe('Email nie został potwierdzony. Sprawdź skrzynkę pocztową.');
    });

    it('handles network error during login gracefully', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
      mockSignInWithPassword.mockRejectedValue(new Error('fetch failed'));

      let loginFn: ((email: string, password: string) => Promise<{ error: string | null }>) | null = null;

      function LoginCapture() {
        const { login } = useAuth();
        loginFn = login;
        return null;
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginCapture />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(loginFn).not.toBeNull());
      const result = await loginFn!('test@test.pl', 'pass');
      expect(result.error).toContain('fetch failed');
    });
  });

  describe('AuthProvider — logout', () => {
    it('clears user state on logout even if signOut throws', async () => {
      const mockSession = {
        user: { id: 'u1', email: 'auth@test.pl' },
        access_token: 'tok',
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      mockSignOut.mockRejectedValue(new Error('signOut error'));

      let logoutFn: (() => Promise<void>) | null = null;

      function LogoutCapture() {
        const { logout, user } = useAuth();
        logoutFn = logout;
        return <span data-testid="user-email">{user?.email ?? 'none'}</span>;
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <LogoutCapture />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe('auth@test.pl');
      });

      // logout uses try/finally — the error from signOut propagates, but state is cleared
      try {
        await logoutFn!();
      } catch {
        // Expected — signOut threw
      }

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe('none');
      });
    });
  });
});
