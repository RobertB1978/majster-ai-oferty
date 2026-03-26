/**
 * TabletSidebar — Tablet Hybrid Mode (768–1023px) — roadmap §17
 *
 * Collapsed icon-only sidebar, 64px wide.
 * Shown exclusively on the tablet breakpoint: hidden md:flex lg:hidden.
 *
 * Rules from §17:
 *  - Dense Mode WYŁĄCZONY (touch-first)
 *  - Touch targets min. 44px
 *  - Amber left border on active item
 *  - Positioned fixed, below TopBar (top-16 = 64px)
 */

import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavItems } from '@/hooks/useNavItems';

export function TabletSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navItems = useNavItems();

  return (
    <aside
      className={cn(
        // Only visible on tablet range: 768–1023px
        'hidden md:flex lg:hidden',
        // Fixed left column, below TopBar (h-16 = top-16)
        'fixed left-0 top-16 bottom-0 z-30',
        'w-16 flex-col items-center',
        'border-r border-border bg-card',
        'py-3 gap-1 overflow-y-auto',
      )}
      aria-label={t('nav.menu')}
    >
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.to);
        return (
          <Tooltip key={item.to} delayDuration={300}>
            <TooltipTrigger asChild>
              <NavLink
                to={item.to}
                aria-label={item.label}
                className={cn(
                  'relative flex items-center justify-center rounded-md transition-colors',
                  // Touch target ≥ 44px (§17 requirement)
                  'w-11 min-h-[44px]',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  // Amber left border on active — brand signature §12
                  isActive && [
                    'before:absolute before:left-[-4px] before:top-2 before:bottom-2',
                    'before:w-[3px] before:rounded-full before:bg-primary before:content-[""]',
                  ],
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {item.label}
              {item.comingSoon && (
                <span className="ml-1.5 text-[10px] text-muted-foreground">
                  {t('nav.comingSoon')}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </aside>
  );
}
