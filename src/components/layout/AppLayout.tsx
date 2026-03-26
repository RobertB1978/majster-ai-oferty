import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Navigation } from './Navigation';
import { MobileBottomNav } from './MobileBottomNav';
import { Footer } from './Footer';
import { PageTransition } from './PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { isTradeOnboardingDone } from '@/hooks/useTradeOnboarding';
import { useDenseMode } from '@/hooks/useDenseMode';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFieldSafety } from '@/hooks/useFieldSafety';
import { FieldSafetyBanner } from './FieldSafetyBanner';
import { GlobalSearch } from './GlobalSearch';
import { TabletSidebar } from './TabletSidebar';

// Lazy-load heavy layout components that are not needed for initial render
const AiChatAgent = lazy(() => import('@/components/ai/AiChatAgent').then(m => ({ default: m.AiChatAgent })));
const OnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const TradeOnboardingModal = lazy(() => import('@/components/onboarding/TradeOnboardingModal').then(m => ({ default: m.TradeOnboardingModal })));

export function AppLayout() {
  const { user, isLoading } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const { t } = useTranslation();

  /**
   * Track whether the trade onboarding is done (completed or skipped).
   * Initialized from localStorage so returning users never see it again.
   * When the user finishes the trade modal, `onDone` flips this to true,
   * which unmounts TradeOnboardingModal and allows OnboardingModal to show.
   */
  const [tradeOnboardingDone, setTradeOnboardingDone] = useState(isTradeOnboardingDone);
  const { effectiveDense } = useDenseMode();
  useKeyboardShortcuts(effectiveDense);

  // Field Safety — activates high-glare, battery-saver and reduced-motion modes.
  // Sets data-field-* attributes on <html> that CSS reads for Field-Safe variants.
  useFieldSafety();

  // Show content when auth is resolved; reset on logout or re-loading
  useEffect(() => {
    setShowContent(!isLoading && !!user);
  }, [isLoading, user]);

  // Auth guard is handled by ProtectedRoute (single source of truth).
  // This loading state is only for the fade-in animation.
  if (isLoading) {
    return <LoadingScreen message={t('app.loading')} variant="fullscreen" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {t('nav.skipToContent')}
      </a>
      <TopBar />
      <FieldSafetyBanner />
      <Navigation />

      {/* Tablet icon sidebar — visible only on 768–1023px (roadmap §17) */}
      <TabletSidebar />

      {/*
        Main content area.
        md:pl-16 — offset for TabletSidebar (64px) on 768-1023px.
        lg:pl-0  — reset for desktop (Navigation is top bar, no sidebar).
        pb-20    — bottom padding so MobileBottomNav never overlaps content.
        lg:pb-6  — desktop has no bottom nav so reduce bottom padding.
      */}
      <main
        id="main-content"
        className={`flex-1 container py-6 px-4 md:px-6 md:pl-[calc(1rem+4rem)] lg:pl-6 pb-20 lg:pb-6 transition-opacity duration-150 ${showContent ? 'opacity-100' : 'opacity-0'}`}
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile bottom navigation — md:hidden (tablet uses TabletSidebar) */}
      <MobileBottomNav />

      {/* Global Search palette — always mounted, opens with / or Ctrl+K */}
      <GlobalSearch />

      {/* AI Chat Agent - Lazy-loaded to avoid blocking route transitions */}
      <Suspense fallback={null}>
        <AiChatAgent />
      </Suspense>

      {/* Trade Onboarding — shown on first login; gates the company setup modal */}
      <Suspense fallback={null}>
        <TradeOnboardingModal
          open={!tradeOnboardingDone}
          onDone={() => setTradeOnboardingDone(true)}
        />
      </Suspense>

      {/* Company setup modal — shown after trade onboarding is done */}
      <Suspense fallback={null}>
        <OnboardingModal enabled={tradeOnboardingDone} />
      </Suspense>
    </div>
  );
}
