import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Palette,
  FileText,
  Database,
  Settings,
  Key,
  Activity,
  Sliders,
  CreditCard,
  Navigation as NavigationIcon,
  HeartPulse,
  HardHat,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ElementType;
  isShell?: boolean;
}

const navItemDefs: NavItem[] = [
  { to: '/admin/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/admin/users', labelKey: 'admin.users', icon: Users },
  { to: '/admin/app-config', labelKey: 'adminNav.config', icon: Sliders, isShell: true },
  { to: '/admin/theme', labelKey: 'admin.theme', icon: Palette },
  { to: '/admin/plans', labelKey: 'adminNav.plans', icon: CreditCard, isShell: true },
  { to: '/admin/content', labelKey: 'admin.content', icon: FileText },
  { to: '/admin/navigation', labelKey: 'adminNav.pageTitle', icon: NavigationIcon, isShell: true },
  { to: '/admin/audit', labelKey: 'admin.logs', icon: Activity },
  { to: '/admin/database', labelKey: 'admin.database', icon: Database },
  { to: '/admin/system', labelKey: 'admin.system', icon: Settings },
  { to: '/admin/api', labelKey: 'admin.api', icon: Key },
  { to: '/admin/diagnostics', labelKey: 'adminNav.diagnostics', icon: HeartPulse, isShell: true },
];

export function AdminSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-sidebar-primary" />
            <span className="text-sm font-semibold">Owner Console</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label={collapsed ? t('adminNav.expandMenu') : t('adminNav.collapseMenu')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul className="space-y-1">
          {navItemDefs.map((item) => {
            const isActive = location.pathname === item.to;
            const label = t(item.labelKey);
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    'min-h-[44px]',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    collapsed && 'justify-center px-0'
                  )}
                  aria-label={collapsed ? label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{label}</span>
                  )}
                  {!collapsed && item.isShell && (
                    <span className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-sidebar-accent-foreground">
                      {t('nav.comingSoon')}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <NavLink
            to="/app/dashboard"
            className="flex items-center gap-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            {t('adminNav.backToApp')}
          </NavLink>
        </div>
      )}
    </aside>
  );
}
