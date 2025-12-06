import { Outlet, Navigate } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Navigation } from './Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AiChatAgent } from '@/components/ai/AiChatAgent';
import { useEffect } from 'react';

export function AppLayout() {
  const { user, isLoading } = useAuth();

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-primary/20 animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <TopBar />
      <Navigation />
      <main className="container py-6 animate-fade-in">
        <Outlet />
      </main>
      
      {/* AI Chat Agent - Global floating assistant */}
      <AiChatAgent />
    </div>
  );
}
