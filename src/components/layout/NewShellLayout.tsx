import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { NewShellBottomNav } from './NewShellBottomNav';
import { NewShellFAB } from './NewShellFAB';
import { PageTransition } from './PageTransition';

const NewShellOnboarding = lazy(
  () => import('@/components/onboarding/NewShellOnboarding').then(m => ({ default: m.NewShellOnboarding }))
);

/**
 * NewShellLayout — nowy shell aplikacji za flagą FF_NEW_SHELL=true.
 *
 * Zawiera:
 *  - Dolną nawigację 5-zakładkową (Home / Oferty / FAB / Projekty / Więcej)
 *  - FAB otwierający bottom sheet z akcjami
 *  - Lekki onboarding (3 kroki) przy pierwszym uruchomieniu
 *
 * Stary shell (AppLayout) pozostaje nienaruszony.
 */
export function NewShellLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setShowContent(!isLoading && !!user);
  }, [isLoading, user]);

  if (isLoading) {
    return <LoadingScreen message={t('app.loading', 'Uruchamianie aplikacji')} variant="fullscreen" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <main
        id="main-content"
        className={`flex-1 pb-20 transition-all duration-500 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {/* Dolna nawigacja 5 zakładek */}
      <NewShellBottomNav />

      {/* FAB — Floating Action Button */}
      <NewShellFAB />

      {/* Lekki onboarding przy pierwszym uruchomieniu */}
      <Suspense fallback={null}>
        <NewShellOnboarding />
      </Suspense>
    </div>
  );
}
