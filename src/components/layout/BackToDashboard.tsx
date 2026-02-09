import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function BackToDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Don't show on dashboard or login/register pages
  if (location.pathname === '/app/dashboard' ||
      location.pathname === '/login' ||
      location.pathname === '/register' ||
      location.pathname === '/') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate('/app/dashboard')}
      className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 md:bottom-6"
    >
      <Home className="h-4 w-4 mr-2" />
      {t('nav.dashboard')}
    </Button>
  );
}
