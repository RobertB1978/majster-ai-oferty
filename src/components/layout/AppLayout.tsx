import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { BackToDashboard } from './BackToDashboard';
import { PageTransition } from './PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { AiChatAgent } from '@/components/ai/AiChatAgent';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useEffect, useState } from 'react';

export function AppLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [showContent, setShowContent] = useState(false);

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

  // Smooth transition after loading
  useEffect(() => {
    if (!isLoading && user) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user]);

  if (isLoading) {
    return <LoadingScreen message="Uruchamianie aplikacji" variant="fullscreen" />;
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
        Przejdź do treści głównej
      </a>
      <TopBar />
      <Navigation />
      <main id="main-content" className={`flex-1 container py-6 px-4 md:px-6 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      
      {/* Footer */}
      <Footer />

      {/* Back to Dashboard floating button */}
      <BackToDashboard />

      {/* AI Chat Agent - Global floating assistant */}
      <AiChatAgent />

      {/* Onboarding Modal - shown on first login */}
      <OnboardingModal />
    </div>
  );
}
