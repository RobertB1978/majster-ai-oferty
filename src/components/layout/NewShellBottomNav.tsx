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

/** 4 zakładki + 1 slot środkowy (FAB) — FAB jest osobnym komponentem */
const NAV_ITEMS: NavItem[] = [
  { id: 'home',     path: '/app/home',     icon: Home,          labelKey: 'newShell.nav.home' },
  { id: 'offers',   path: '/app/offers',   icon: FileText,      labelKey: 'newShell.nav.offers' },
  // slot środkowy (id='fab') jest renderowany jako pusty spacer — FAB renderuje NewShellFAB
  { id: 'projects', path: '/app/jobs',     icon: FolderKanban,  labelKey: 'newShell.nav.projects' },
  { id: 'more',     path: '/app/more',     icon: MoreHorizontal, labelKey: 'newShell.nav.more' },
];

/**
 * NewShellBottomNav — dolna nawigacja 5-zakładkowa.
 *
 * Układ: Home | Oferty | [FAB — slot pusty] | Projekty | Więcej
 * FAB jest renderowany przez NewShellFAB (osobny komponent, absolutnie pozycjonowany).
 */
export function NewShellBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-card safe-area-bottom"
      style={{ zIndex: 'var(--z-nav, 50)' }}
      aria-label={t('newShell.nav.ariaLabel', 'Nawigacja')}
    >
      <div className="flex h-16 items-center justify-around px-1">
        {/* Zakładka 1: Home */}
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <TabItem key={item.id} item={item} active={location.pathname.startsWith(item.path)} t={t} />
        ))}

        {/* Slot FAB — pusty spacer, FAB wychodzi ponad nav */}
        <div className="flex flex-col items-center justify-center min-w-[64px] h-16" aria-hidden="true" />

        {/* Zakładka 4-5: Projekty + Więcej */}
        {NAV_ITEMS.slice(2).map((item) => (
          <TabItem key={item.id} item={item} active={location.pathname.startsWith(item.path)} t={t} />
        ))}
      </div>
    </nav>
  );
}

function TabItem({
  item,
  active,
  t,
}: {
  item: NavItem;
  active: boolean;
  t: (key: string) => string;
}) {
  return (
    <NavLink
      to={item.path}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 px-2 py-2 min-w-[60px] rounded-lg transition-colors',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <item.icon className={cn('h-5 w-5', active && 'text-primary')} />
      <span className="text-[11px] font-medium leading-tight truncate max-w-[64px]">
        {t(item.labelKey)}
      </span>
    </NavLink>
  );
}
