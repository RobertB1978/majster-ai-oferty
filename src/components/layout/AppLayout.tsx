import { Outlet, Navigate } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Navigation } from './Navigation';
import { useAuth } from '@/contexts/AuthContext';

export function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Navigation />
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
