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
  { id: 'jobs', path: '/app/projects', icon: Briefcase, labelKey: 'nav.projects' },
  { id: 'quickEstimate', path: '/app/szybka-wycena', icon: Zap, labelKey: 'nav.quickEstimate', primary: true },
  { id: 'clients', path: '/app/customers', icon: Users, labelKey: 'nav.clients' },
  { id: 'finance', path: '/app/finance', icon: Wallet, labelKey: 'nav.finance' },
];

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t border-border/60 bg-card/95 backdrop-blur-md md:hidden safe-area-bottom"
      style={{ zIndex: 'var(--z-nav, 40)' }}
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
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
              // Inline style avoids matching .dark a[class*="bg-primary"] selector
              // (index.css dark mode pass) which would add unwanted amber glow to a nav tab
              style={item.primary ? { backgroundColor: 'hsl(var(--primary) / 0.10)' } : undefined}
            >
              <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold leading-tight truncate max-w-[64px]">
                {t(item.labelKey)}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
