import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { NewShellBottomNav } from './NewShellBottomNav';
import { NewShellFAB } from './NewShellFAB';
import { NewShellTopBar } from './NewShellTopBar';
import { NewShellDesktopSidebar } from './NewShellDesktopSidebar';
import { PageTransition } from './PageTransition';

const NewShellOnboarding = lazy(
  () => import('@/components/onboarding/NewShellOnboarding').then(m => ({ default: m.NewShellOnboarding }))
);
const OnboardingModal = lazy(
  () => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal }))
);

/**
 * NewShellLayout — nowy shell aplikacji za flagą FF_NEW_SHELL=true.
 *
 * Mobile (< lg):
 *  - Dolna nawigacja 5-zakładkowa (Home / Oferty / FAB / Projekty / Więcej)
 *  - FAB otwierający bottom sheet z akcjami
 *
 * Desktop (lg+):
 *  - Lewy sidebar z nawigacją (NewShellDesktopSidebar)
 *  - Przycisk "Utwórz" w topbarze
 *  - Brak dolnej nawigacji i FAB
 *
 * Stary shell (AppLayout) pozostaje nienaruszony.
 */
export function NewShellLayout() {
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const { t: _t } = useTranslation();

  // Auth guard is handled by ProtectedRoute (single source of truth).
  // This effect drives the fade-in animation once the user is confirmed.
  useEffect(() => {
    setShowContent(!!user);
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      {/* Górny pasek z logo, przełącznikami języka i trybu + przycisk Utwórz (desktop) */}
      <NewShellTopBar />

      {/* Obszar poniżej topbara: sidebar (desktop) + treść */}
      <div className="flex flex-1">
        {/* Lewy sidebar — widoczny tylko na desktop (lg+) */}
        <NewShellDesktopSidebar />

        <main
          id="main-content"
          className={`flex-1 pb-20 lg:pb-6 transition-all duration-200 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* Dolna nawigacja 5 zakładek — tylko mobile (lg:hidden wbudowane w komponent) */}
      <NewShellBottomNav />

      {/* FAB — tylko mobile (lg:hidden wbudowane w komponent) */}
      <NewShellFAB />

      {/* Konfiguracja profilu firmy — setup przy pierwszym logowaniu */}
      <Suspense fallback={null}>
        <OnboardingModal />
      </Suspense>

      {/* Lekki onboarding UI przy pierwszym uruchomieniu */}
      <Suspense fallback={null}>
        <NewShellOnboarding />
      </Suspense>
    </div>
  );
}
