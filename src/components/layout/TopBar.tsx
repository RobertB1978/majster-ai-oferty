import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LogOut, HelpCircle, Globe, ChevronDown, Moon, Sun, Shield, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { PlanBadge } from '@/components/billing/PlanBadge';
import { Logo } from '@/components/branding/Logo';
import { useAdminRole } from '@/hooks/useAdminRole';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const languages = [
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
];

export function TopBar() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminRole();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return savedTheme === 'dark' || (!savedTheme && prefersDark);
    }
    return false;
  });
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      await logout();
      queryClient.clear(); // Clear all cached data
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(t('errors.logoutFailed', 'Nie udało się wylogować. Spróbuj ponownie.'));
    }
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="md" />
          {/* Online/offline indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs" aria-live="polite">
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-success" />
                <span className="text-success font-medium">{t('common.online')}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-destructive" />
                <span className="text-destructive font-medium">{t('common.offline')}</span>
              </>
            )}
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <PlanBadge />
            </div>
            <NotificationCenter />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10"
              aria-label={isDark ? t('landing.header.switchToLight') : t('landing.header.switchToDark')}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3 min-h-[40px]">
                  <Globe className="h-4 w-4" />
                  <span className="text-lg">{currentLanguage.flag}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {languages.map(lang => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={i18n.language === lang.code ? 'bg-primary/10 font-medium' : ''}
                  >
                    <span className="mr-2 text-lg">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin Panel Access - visible to platform admins only */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin/dashboard')}
                className="h-10 w-10 text-primary hover:text-primary hover:bg-primary/10"
                aria-label={t('admin.panelAccess', 'Panel administracyjny')}
              >
                <Shield className="h-5 w-5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label={t('help.menu', 'Menu pomocy')}>
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/app/profile')}>
                  {t('nav.companyProfile', 'Profil firmy')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info(t('help.docsComingSoon', 'Dokumentacja wkrótce dostępna. Sprawdź zakładkę Ustawienia lub napisz do nas.'))}>
                  {t('help.documentation', 'Dokumentacja')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-border">
              <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground min-h-[40px]" data-testid="logout-button">
                <LogOut className="mr-2 h-4 w-4" />
                {t('auth.logout')}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="sm:hidden h-10 w-10 text-muted-foreground"
              aria-label={t('auth.logout', 'Wyloguj')}
              data-testid="logout-button-mobile"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
