import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Navigation } from './Navigation';
import { MobileBottomNav } from './MobileBottomNav';
import { Footer } from './Footer';
import { PageTransition } from './PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

// Lazy-load heavy layout components that are not needed for initial render
const AiChatAgent = lazy(() => import('@/components/ai/AiChatAgent').then(m => ({ default: m.AiChatAgent })));
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));

export function AppLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);
  const { t } = useTranslation();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Show content when auth is resolved; reset on logout or re-loading
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
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {t('nav.skipToContent', 'Przejdź do treści głównej')}
      </a>
      <TopBar />
      <Navigation />
      <main id="main-content" className={`flex-1 container py-6 px-4 md:px-6 pb-20 lg:pb-6 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      
      {/* Footer */}
      <Footer />

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* AI Chat Agent - Lazy-loaded to avoid blocking route transitions */}
      <Suspense fallback={null}>
        <AiChatAgent />
      </Suspense>

      {/* Onboarding Modal - Lazy-loaded, shown on first login */}
      <Suspense fallback={null}>
        <OnboardingModal />
      </Suspense>
    </div>
  );
}
