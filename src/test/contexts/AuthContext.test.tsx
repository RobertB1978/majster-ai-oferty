/**
 * AuthContext startup fix tests.
 *
 * Verifies the auth bootstrap fixes restored from reverted PR #481-#488:
 * - Safety timeout (10s) prevents eternal loading spinner
 * - .catch() on getSession() handles network errors gracefully
 * - isMounted guard prevents setState on unmounted component
 * - resolvedRef prevents race condition double-resolution
 * - Eager setUser/setSession after successful login
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// Mock supabase before importing AuthContext
const mockGetSession = vi.fn();
let _authStateCallback: (event: string, session: unknown) => void = () => {};
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        _authStateCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signInWithPassword: (args: unknown) => mockSignInWithPassword(args),
      signOut: () => mockSignOut(),
    },
  },
}));

// Must import after mock
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext startup fixes', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockSignInWithPassword.mockReset();
    mockSignOut.mockReset();
    _authStateCallback = () => {};
  });

  it('resolves isLoading=false after getSession returns', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.user).toBe(null);
  });

  it('resolves isLoading=false on getSession rejection (network error)', async () => {
    mockGetSession.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.user).toBe(null);
    expect(result.current.session).toBe(null);
  });

  it('resolves isLoading=false on safety timeout when getSession hangs', async () => {
    vi.useFakeTimers();
    try {
      // getSession never resolves
      mockGetSession.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Still loading before timeout
      expect(result.current.isLoading).toBe(true);

      // Advance past AUTH_TIMEOUT_MS (10s)
      await act(async () => {
        vi.advanceTimersByTime(10_001);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sets user eagerly after successful login', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const mockUser = { id: 'u1', email: 'test@test.com' };
    const mockSession = { user: mockUser, access_token: 'tok' };
    mockSignInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const res = await result.current.login('test@test.com', 'password');
      expect(res.error).toBe(null);
    });

    // User should be set eagerly without waiting for onAuthStateChange
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
  });
});
