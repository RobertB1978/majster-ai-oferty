import { useTranslation } from 'react-i18next';
import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, Users, FolderKanban, Menu, X, Building2, Package, Calendar, BarChart3, UsersRound, TrendingUp, Store, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navigation() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/clients', label: t('nav.clients'), icon: Users },
    { to: '/projects', label: t('nav.projects'), icon: FolderKanban },
    { to: '/calendar', label: t('nav.calendar'), icon: Calendar },
    { to: '/team', label: t('nav.team'), icon: UsersRound },
    { to: '/finance', label: t('nav.finance'), icon: TrendingUp },
    { to: '/marketplace', label: t('nav.marketplace'), icon: Store },
    { to: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
    { to: '/templates', label: t('nav.templates'), icon: Package },
    { to: '/profile', label: 'Profil', icon: Building2 },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <nav className="border-b border-border bg-card">
      <div className="container">
        {/* Mobile menu button */}
        <div className="flex h-12 items-center justify-between sm:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            Menu
          </Button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden sm:flex sm:h-12 sm:items-center sm:gap-1 overflow-x-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              activeClassName="bg-accent text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Mobile navigation */}
        {isOpen && (
          <div className="flex flex-col gap-1 pb-3 sm:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                activeClassName="bg-accent text-accent-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
