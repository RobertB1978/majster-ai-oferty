import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, FolderKanban, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  path: string;
  icon: LucideIcon;
  labelKey: string;
}

/** Te same zakładki co w dolnej nawigacji mobilnej */
const NAV_ITEMS: NavItem[] = [
  { id: 'home',     path: '/app/home',     icon: Home,           labelKey: 'newShell.nav.home' },
  { id: 'offers',   path: '/app/offers',   icon: FileText,       labelKey: 'newShell.nav.offers' },
  { id: 'projects', path: '/app/projects', icon: FolderKanban,   labelKey: 'newShell.nav.projects' },
  { id: 'more',     path: '/app/more',     icon: MoreHorizontal, labelKey: 'newShell.nav.more' },
];

/**
 * NewShellDesktopSidebar — lewy pasek nawigacji widoczny tylko na desktop (lg+).
 * Na mobile jest ukryty — tam za nawigację odpowiada NewShellBottomNav.
 */
export function NewShellDesktopSidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <aside
      className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-card sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto"
      aria-label={t('newShell.nav.ariaLabel', 'Nawigacja')}
    >
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn('h-5 w-5 shrink-0')}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span className="truncate">{t(item.labelKey)}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
