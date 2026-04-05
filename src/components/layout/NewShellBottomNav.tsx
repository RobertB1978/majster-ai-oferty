import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, FolderKanban, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  path: string;
  icon: LucideIcon;
  labelKey: string;
}

/** 4 zakładki + 1 slot środkowy (FAB) — FAB jest osobnym komponentem */
const NAV_ITEMS: NavItem[] = [
  { id: 'home',     path: '/app/dashboard', icon: Home,           labelKey: 'newShell.nav.home' },
  { id: 'offers',   path: '/app/offers',   icon: FileText,       labelKey: 'newShell.nav.offers' },
  { id: 'projects', path: '/app/projects', icon: FolderKanban,   labelKey: 'newShell.nav.projects' },
  { id: 'more',     path: '/app/more',     icon: MoreHorizontal, labelKey: 'newShell.nav.more' },
];

/**
 * NewShellBottomNav — dolna nawigacja 5-zakładkowa z Framer Motion.
 * Układ: Home | Oferty | [FAB — slot pusty] | Projekty | Więcej
 */
export function NewShellBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border/60 bg-card/95 backdrop-blur-md safe-area-bottom shell-bottom-nav"
      style={{ zIndex: 'var(--z-nav, 50)' }}
      aria-label={t('newShell.nav.ariaLabel')}
    >
      <div className="flex h-16 items-stretch justify-around px-1">
        {/* Zakładka 1-2: Home, Oferty */}
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <TabItem
            key={item.id}
            item={item}
            active={location.pathname.startsWith(item.path)}
            t={t}
          />
        ))}

        {/* Slot FAB — pusty spacer, FAB wychodzi ponad nav */}
        <div
          className="flex flex-col items-center justify-center min-w-[64px]"
          aria-hidden="true"
        />

        {/* Zakładka 3-4: Projekty + Więcej */}
        {NAV_ITEMS.slice(2).map((item) => (
          <TabItem
            key={item.id}
            item={item}
            active={location.pathname.startsWith(item.path)}
            t={t}
          />
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
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 min-w-[60px] flex-1 max-w-[90px] focus-visible:outline-none"
    >
      {/* Active background pill */}
      {active && (
        <motion.div
          layoutId="nav-active-pill"
          className="absolute inset-x-2 top-1.5 h-8 rounded-full bg-primary/12 dark:bg-primary/20"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}

      {/* Icon with spring bounce */}
      <motion.div
        animate={{ scale: active ? 1.12 : 1, y: active ? -1 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative z-10"
      >
        <Icon
          className={cn(
            'h-5 w-5 transition-colors duration-200',
            active ? 'text-primary' : 'text-muted-foreground'
          )}
          strokeWidth={active ? 2.5 : 1.8}
        />
      </motion.div>

      {/* Label */}
      <motion.span
        animate={{ opacity: active ? 1 : 0.65 }}
        className={cn(
          'relative z-10 text-[10px] font-semibold leading-tight truncate max-w-[72px] transition-colors duration-200',
          active ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {t(item.labelKey)}
      </motion.span>

      {/* Active dot indicator */}
      {active && (
        <motion.div
          layoutId="nav-dot"
          className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
      )}
    </NavLink>
  );
}
