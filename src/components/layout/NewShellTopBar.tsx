import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Moon, Sun, Plus, FileText, Users, DollarSign, CalendarPlus,
  User, LogOut, Settings, ArrowLeft,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/branding/Logo';
import { useAuth } from '@/contexts/AuthContext';

const languages = [
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
];

/** Akcje quick-create dostępne na desktopie (podzbiór akcji FAB) */
const QUICK_CREATE_ACTIONS = [
  { id: 'new-offer',  labelKey: 'newShell.fab.newOffer',  icon: FileText,    route: '/app/offers/new' },
  { id: 'add-client', labelKey: 'newShell.fab.addClient', icon: Users,       route: '/app/customers' },
  { id: 'add-cost',   labelKey: 'newShell.fab.addCost',   icon: DollarSign,  route: '/app/finance' },
  { id: 'add-date',   labelKey: 'newShell.fab.addDate',   icon: CalendarPlus, route: '/app/calendar' },
];

export function NewShellTopBar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { backTo, backLabel } = useBackNavigation();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return savedTheme === 'dark' || (!savedTheme && prefersDark);
    }
    return false;
  });

  // Nasłuchuj zmian preferencji systemowych
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

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <header className="sticky top-0 z-50 safe-area-top w-full shell-header bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/85">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Logo + opcjonalny przycisk powrotu po lewej */}
        <div className="flex items-center gap-1">
          {backTo && (
            <Link
              to={backTo}
              className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${t('common.back')}: ${backLabel}`}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <Logo size="sm" />
        </div>

        {/* Przyciski po prawej */}
        <div className="flex items-center gap-0.5">
          {/* Przycisk "Utwórz" — tylko desktop (lg+); na mobile zastępuje go FAB */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="hidden lg:flex h-8 gap-1.5 px-3"
                aria-label={t('newShell.fab.open')}
              >
                <Plus className="h-4 w-4" />
                <span>{t('newShell.fab.open')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {QUICK_CREATE_ACTIONS.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <div key={action.id}>
                    {idx > 0 && idx % 2 === 0 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => navigate(action.route)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {t(action.labelKey)}
                    </DropdownMenuItem>
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Przełącznik trybu jasny/ciemny */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            aria-label={isDark ? t('landing.header.switchToLight') : t('landing.header.switchToDark')}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Przełącznik języka */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label={t('landing.header.languageSwitch')}
              >
                <span className="text-base leading-none">{currentLanguage.flag}</span>
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

          {/* Konto użytkownika — dropdown z profilem, ustawieniami i wylogowaniem */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label={t('newShell.nav.account')}
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {user?.email && (
                <>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => navigate('/app/profile')}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {t('newShell.nav.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/app/settings')}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {t('newShell.nav.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                {t('newShell.nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
