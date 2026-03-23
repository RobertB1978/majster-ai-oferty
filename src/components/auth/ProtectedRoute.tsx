/**
 * ProtectedRoute — enforces authentication at route level.
 *
 * Wraps any route that requires a logged-in user. Redirects unauthenticated
 * visitors to /login, preserving the intended destination for post-login redirect.
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
  const { user, isLoading } = useAuth();
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

  if (!user) {
    // Preserve the intended URL for post-login redirect
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
