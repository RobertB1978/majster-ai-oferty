/**
 * ProtectedRoute — enforces authentication at route level.
 *
 * Wraps any route that requires a logged-in user. Redirects unauthenticated
 * visitors to /login, preserving the intended destination for post-login redirect.
 *
 * Explicit error states:
 *   a) loading            — spinner
 *   b) slow loading >5s   — "taking too long" hint + refresh button
 *   c) timeout >10s       — auth init failed card with error description
 *   d) auth init failed   — network-error card with retry
 *
 * Usage in router:
 *   <Route path="/app/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
 *
 * This component is the SINGLE source of truth for auth enforcement.
 * Do NOT duplicate auth checks in layout components — use this instead.
 */

import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

/** After this many ms of auth loading we show a "taking too long" hint. */
const SLOW_AUTH_THRESHOLD_MS = 5_000;

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Redirect destination when not authenticated. Defaults to /login */
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { t } = useTranslation();
  const { user, isLoading, authInitError } = useAuth();
  const location = useLocation();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsSlow(false);
      return;
    }
    const timer = setTimeout(() => setIsSlow(true), SLOW_AUTH_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // While auth state is being resolved, show minimal loading indicator
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        {isSlow && (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {t('common.authSlow')}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm text-primary underline hover:no-underline"
            >
              {t('common.refreshPage')}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Auth init failed — show explicit error state instead of silently redirecting
  if (!user && authInitError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <div className="max-w-sm w-full rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">
            {authInitError === 'timeout'
              ? t('common.authTimeout', { defaultValue: 'Nie udało się połączyć z serwerem uwierzytelniania.' })
              : t('common.authNetworkError', { defaultValue: 'Błąd połączenia z serwerem. Sprawdź połączenie internetowe.' })
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {t('common.authInitFailedHint', { defaultValue: 'Możesz spróbować odświeżyć stronę lub przejść do logowania.' })}
          </p>
          <div className="flex gap-2 justify-center pt-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t('common.refreshPage')}
            </button>
            <a
              href={redirectTo}
              className="text-sm px-4 py-2 rounded-md border border-input bg-background hover:bg-accent transition-colors"
            >
              {t('common.goToLogin', { defaultValue: 'Zaloguj się' })}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Preserve the intended URL for post-login redirect
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
