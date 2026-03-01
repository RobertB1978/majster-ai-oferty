import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wrench, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';

/**
 * OAuth callback handler for Supabase social login (Google, Apple).
 *
 * Supabase processes the code/token from the URL hash automatically via
 * onAuthStateChange. This page shows a loading indicator while that happens,
 * then redirects to the dashboard on success or shows an error state.
 */
export default function AuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase JS automatically exchanges the code/token present in the URL.
    // We listen for the resulting session change and redirect accordingly.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/app/dashboard', { replace: true });
      } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        setError(t('auth.social.callbackError'));
      }
    });

    // Fallback: if there's already a session (e.g. PKCE flow completed before listener registered)
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setError(t('auth.social.callbackError'));
        return;
      }
      if (session) {
        navigate('/app/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, t]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full border-b border-border bg-card">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">{'Majster.AI'}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        {error ? (
          <div className="w-full max-w-md space-y-4">
            <ErrorState
              title={t('auth.social.callbackError')}
              description={t('auth.social.callbackErrorDesc')}
            />
            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link to="/login">{t('auth.social.backToLogin')}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('auth.social.callbackLoading')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
