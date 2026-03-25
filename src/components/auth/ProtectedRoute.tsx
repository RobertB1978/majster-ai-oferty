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

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Redirect destination when not authenticated. Defaults to /login */
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // While auth state is being resolved, show minimal loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    // Preserve the intended URL for post-login redirect
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
