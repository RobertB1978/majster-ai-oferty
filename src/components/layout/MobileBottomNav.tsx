import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, Calendar, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const BOTTOM_NAV_ITEMS = [
  { id: 'dashboard', path: '/app/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { id: 'jobs', path: '/app/jobs', icon: Briefcase, labelKey: 'nav.projects' },
  { id: 'clients', path: '/app/clients', icon: Users, labelKey: 'nav.clients' },
  { id: 'calendar', path: '/app/calendar', icon: Calendar, labelKey: 'nav.calendar' },
  { id: 'finance', path: '/app/finance', icon: Wallet, labelKey: 'nav.finance' },
] as const;

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card lg:hidden safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-w-[56px] rounded-lg transition-colors',
                'text-muted-foreground',
                isActive && 'text-primary'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="text-[10px] font-medium leading-tight truncate max-w-[60px]">
                {t(item.labelKey)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
