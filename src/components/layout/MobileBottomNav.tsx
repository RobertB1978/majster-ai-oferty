import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, Wallet, Zap, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BottomNavItem {
  id: string;
  path: string;
  icon: LucideIcon;
  labelKey: string;
  primary?: boolean;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: 'dashboard', path: '/app/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { id: 'jobs', path: '/app/jobs', icon: Briefcase, labelKey: 'nav.projects' },
  { id: 'quickEstimate', path: '/app/szybka-wycena', icon: Zap, labelKey: 'nav.quickEstimate', primary: true },
  { id: 'clients', path: '/app/customers', icon: Users, labelKey: 'nav.clients' },
  { id: 'finance', path: '/app/finance', icon: Wallet, labelKey: 'nav.finance' },
];

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-card lg:hidden safe-area-bottom"
      style={{ zIndex: 'var(--z-nav)' }}
    >
      <div className="flex h-16 items-center justify-around px-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-2 py-2 min-w-[60px] rounded-lg transition-colors',
                item.primary
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground',
                isActive && 'text-primary'
              )}
            >
              <item.icon className={cn('h-5 w-5', item.primary && 'h-6 w-6', isActive && 'text-primary')} />
              <span className="text-[11px] font-medium leading-tight truncate max-w-[64px]">
                {t(item.labelKey)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
