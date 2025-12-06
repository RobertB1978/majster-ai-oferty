import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { PageTransition } from './PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { AiChatAgent } from '@/components/ai/AiChatAgent';
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
      <TopBar />
      <Navigation />
      <main className={`flex-1 container py-6 px-4 md:px-6 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* AI Chat Agent - Global floating assistant */}
      <AiChatAgent />
    </div>
  );
}
