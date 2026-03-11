import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  FolderKanban,
  Users,
  CalendarDays,
  BookOpen,
  TrendingUp,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  path: string;
  icon: LucideIcon;
  labelKey: string;
}

interface NavSection {
  id: string;
  labelKey: string;
  items: NavItem[];
}

/**
 * Sekcje nawigacji desktopowej.
 *
 * Mobile korzysta z NewShellBottomNav (4 zakładki + FAB) — bez zmian.
 * Desktop dostaje pełny sidebar z bezpośrednim dostępem do kluczowych modułów.
 */
const NAV_SECTIONS: NavSection[] = [
  {
    id: 'main',
    labelKey: 'newShell.nav.sectionMain',
    items: [
      { id: 'home',      path: '/app/home',      icon: Home,         labelKey: 'newShell.nav.home' },
      { id: 'offers',    path: '/app/offers',    icon: FileText,     labelKey: 'newShell.nav.offers' },
      { id: 'projects',  path: '/app/projects',  icon: FolderKanban, labelKey: 'newShell.nav.projects' },
      { id: 'customers', path: '/app/customers', icon: Users,        labelKey: 'newShell.nav.customers' },
    ],
  },
  {
    id: 'tools',
    labelKey: 'newShell.nav.sectionTools',
    items: [
      { id: 'calendar',  path: '/app/calendar',           icon: CalendarDays, labelKey: 'newShell.nav.calendar' },
      { id: 'documents', path: '/app/document-templates', icon: BookOpen,     labelKey: 'newShell.nav.documents' },
      { id: 'finance',   path: '/app/finance',            icon: TrendingUp,   labelKey: 'newShell.nav.finance' },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'settings', path: '/app/settings', icon: Settings, labelKey: 'newShell.nav.settings' },
];

/**
 * NewShellDesktopSidebar — lewy pasek nawigacji widoczny tylko na desktop (lg+).
 *
 * Zawiera pogrupowane linki do wszystkich kluczowych modułów, bez konieczności
 * przechodzenia przez ekran "Więcej" (który pozostaje dla mobile).
 *
 * Na mobile jest ukryty — tam za nawigację odpowiada NewShellBottomNav.
 */
export function NewShellDesktopSidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  const renderItem = (item: NavItem) => {
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
            className="h-5 w-5 shrink-0"
            strokeWidth={isActive ? 2.5 : 1.8}
          />
          <span className="truncate">{t(item.labelKey)}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-card sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto"
      aria-label={t('newShell.nav.ariaLabel', 'Nawigacja')}
    >
      <nav className="flex flex-col flex-1 py-4 px-3">
        {/* Sekcje główne */}
        <div className="flex-1 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id}>
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                {t(section.labelKey)}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(renderItem)}
              </ul>
            </div>
          ))}
        </div>

        {/* Ustawienia przypięte na dole */}
        <div className="border-t border-border pt-3 mt-4">
          <ul className="space-y-0.5">
            {BOTTOM_ITEMS.map(renderItem)}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
