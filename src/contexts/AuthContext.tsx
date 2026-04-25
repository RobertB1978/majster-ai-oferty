import { logger } from '@/lib/logger';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { writePendingAcceptances } from '@/lib/legal/acceptance';

/** Safety timeout — if auth state is not resolved within this time, force isLoading=false.
 *  Prevents the app from being stuck on the loading spinner forever (e.g. Supabase unreachable). */
const AUTH_TIMEOUT_MS = 10_000;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null; data?: { user: User | null; session: Session | null } }>;
  register: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<{ error: string | null }>;
  loginWithApple: () => Promise<{ error: string | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Boot checkpoint helper
const win = typeof window !== 'undefined' ? window as Window & { __BOOT?: (c: string, d?: string) => void } : null;
const boot = win?.__BOOT ?? ((_c: string, _d?: string) => {});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const resolvedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    boot('BOOT_5', 'Auth init start');

    const markResolved = (s: Session | null) => {
      if (!isMounted || resolvedRef.current) return;
      resolvedRef.current = true;
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
      boot('BOOT_6', 'Auth init done — user=' + (s?.user?.email ?? 'anonymous'));
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        // Always update session/user on auth events (login, logout, token refresh)
        setSession(session);
        setUser(session?.user ?? null);
        if (!resolvedRef.current) {
          resolvedRef.current = true;
          setIsLoading(false);
          boot('BOOT_6', 'Auth init done (via listener) — user=' + (session?.user?.email ?? 'anonymous'));
        }
        // Write any pending legal acceptances stored during signup (deferred because
        // legal_acceptances INSERT requires an authenticated session, which is only
        // available after email confirmation fires SIGNED_IN).
        if (event === 'SIGNED_IN' && session?.user?.id) {
          writePendingAcceptances(session.user.id).catch((err: unknown) => {
            logger.error('[legal] pending acceptance write failed:', err);
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      markResolved(session);
    }).catch((err) => {
      logger.error('Failed to get session:', err);
      markResolved(null);
    });

    // Safety timeout — prevent eternal loading if Supabase is unreachable
    const timeout = setTimeout(() => {
      if (!resolvedRef.current) {
        logger.error('Auth timeout: session not resolved within', AUTH_TIMEOUT_MS, 'ms');
        boot('BOOT_6', 'Auth init done (TIMEOUT — Supabase unreachable)');
        markResolved(null);
      }
    }, AUTH_TIMEOUT_MS);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null; data?: { user: User | null; session: Session | null } }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Enhanced logging in dev mode
      if (import.meta.env.MODE === 'development') {
        logger.log('🔐 Login attempt:', {
          email,
          success: !error,
          error: error?.message || null,
          hasSession: !!data?.session,
          hasUser: !!data?.user,
        });
      }

      if (error) {
        // Log full error in dev
        if (import.meta.env.MODE === 'development') {
          logger.error('❌ Login error details:', error);
        }

        // User-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Nieprawidłowy email lub hasło', data: undefined };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Email nie został potwierdzony. Sprawdź skrzynkę pocztową.', data: undefined };
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return { error: 'Błąd połączenia. Sprawdź konfigurację Supabase w .env', data: undefined };
        }

        return { error: error.message, data: undefined };
      }

      // Eager state update — don't wait for onAuthStateChange callback
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }

      return { error: null, data: { user: data.user, session: data.session } };
    } catch (err) {
      // Catch network errors or other unexpected errors
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (import.meta.env.MODE === 'development') {
        logger.error('❌ Login exception:', err);
      }

      return {
        error: `Błąd logowania: ${errorMessage}. Sprawdź czy Supabase jest poprawnie skonfigurowany.`,
        data: undefined
      };
    }
  };

  const register = async (email: string, password: string): Promise<{ error: string | null }> => {
    // Use /auth/callback so the SDK can exchange the confirmation token and
    // fire onAuthStateChange(SIGNED_IN) before redirecting to the app.
    // Matches the redirect used by resendVerificationEmail() — single source of truth.
    const redirectUrl = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        return { error: 'Konto z tym adresem email już istnieje' };
      }
      return { error: error.message };
    }

    return { error: null };
  };

  const loginWithGoogle = async (): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { error: message };
    }
  };

  const loginWithApple = async (): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { error: message };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          return { error: 'Za dużo prób. Spróbuj ponownie za chwilę.' };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { error: message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Explicitly clear state to eliminate race condition.
      // onAuthStateChange fires asynchronously — without this,
      // navigate('/login') in the caller runs before state updates,
      // leaving stale auth state. Also fixes mock-client path where
      // onAuthStateChange callback is never invoked.
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, register, logout, loginWithGoogle, loginWithApple, resendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
