/**
 * Navigation — top nav bar for mobile (<768px hamburger) and desktop (≥1024px full bar).
 * On tablet (768–1023px) this component is hidden; TabletSidebar takes over.
 *
 * Breakpoint map:
 *  < 768px  → hamburger menu button (shown via `md:hidden` div)
 *  768–1023px → HIDDEN — TabletSidebar renders instead
 *  ≥ 1024px → horizontal scroll nav bar (shown via `hidden lg:block`)
 *
 * Dense Office Mode (roadmap §12): hovering a desktop nav item for 200ms
 * triggers a background pre-fetch of that route's primary data.
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from '@/components/NavLink';
import {
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useQueryClient } from '@tanstack/react-query';
import { useDenseMode } from '@/hooks/useDenseMode';
import { usePrefetchOnHover } from '@/hooks/usePrefetchOnHover';
import { prefetchRouteData } from '@/lib/prefetch-routes';
import { useNavItems } from '@/hooks/useNavItems';
import type { NavItem } from '@/hooks/useNavItems';

// ── Per-item desktop link with pre-fetch support ──────────────────────────────

interface DesktopNavItemProps {
  item: NavItem;
  effectiveDense: boolean;
}

function DesktopNavItem({ item, effectiveDense }: DesktopNavItemProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const doPrefetch = useCallback(
    () => prefetchRouteData(queryClient, item.to),
    [queryClient, item.to],
  );

  const { onMouseEnter, onMouseLeave } = usePrefetchOnHover(doPrefetch, effectiveDense);

  return (
    <NavLink
      to={item.to}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
        'text-muted-foreground hover:bg-secondary hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'min-h-[40px]',
      )}
      activeClassName="bg-primary/10 text-primary border border-primary/20"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.label}</span>
      {item.comingSoon && (
        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-semibold hidden xl:flex">
          {t('nav.comingSoon')}
        </Badge>
      )}
    </NavLink>
  );
}

// ── Navigation ────────────────────────────────────────────────────────────────

export function Navigation() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { effectiveDense } = useDenseMode();
  const navItems = useNavItems();

  return (
    <nav className="border-b border-border bg-card sticky top-16 z-40">
      <div className="container">
        {/* Mobile menu button — only on < 768px (tablet uses TabletSidebar) */}
        <div className="flex h-12 items-center justify-between md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-foreground min-h-[48px]"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="font-medium">{t('nav.menu')}</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          </Button>
        </div>

        {/* Desktop navigation — only on ≥ 1024px (tablet uses TabletSidebar) */}
        <ScrollArea className="hidden lg:block w-full">
          <div className="flex h-12 items-center gap-0.5 py-1">
            {navItems.map((item) => (
              <DesktopNavItem key={item.to} item={item} effectiveDense={effectiveDense} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* Mobile navigation grid — dropdown on < 768px */}
        {isOpen && (
          <div className="pb-4 md:hidden animate-fade-in">
            <div className="grid grid-cols-2 gap-2 pt-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors',
                    'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    'min-h-[48px]',
                  )}
                  activeClassName="bg-primary/10 text-primary border border-primary/20"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0 shrink-0">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
