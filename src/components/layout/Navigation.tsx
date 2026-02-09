import { useTranslation } from 'react-i18next';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Menu,
  X,
  Building2,
  Package,
  Calendar,
  BarChart3,
  UsersRound,
  TrendingUp,
  Store,
  Settings,
  CreditCard,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function Navigation() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { to: '/app/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/app/clients', label: t('nav.clients'), icon: Users },
    { to: '/app/jobs', label: t('nav.projects'), icon: FolderKanban },
    { to: '/app/calendar', label: t('nav.calendar'), icon: Calendar },
    { to: '/app/team', label: t('nav.team'), icon: UsersRound },
    { to: '/app/finance', label: t('nav.finance'), icon: TrendingUp },
    { to: '/app/marketplace', label: t('nav.marketplace'), icon: Store },
    { to: '/app/analytics', label: t('nav.analytics'), icon: BarChart3 },
    { to: '/app/templates', label: t('nav.templates'), icon: Package },
    { to: '/app/plan', label: t('nav.billing'), icon: CreditCard, badge: 'Pro' },
    { to: '/app/profile', label: t('nav.profile'), icon: Building2 },
    { to: '/app/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <nav className="border-b border-border bg-card sticky top-16 z-40">
      <div className="container">
        {/* Mobile menu button */}
        <div className="flex h-12 items-center justify-between sm:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-foreground min-h-[48px]"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="font-medium">Menu</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </div>

        {/* Desktop navigation with horizontal scroll */}
        <ScrollArea className="hidden sm:block w-full">
          <div className="flex h-12 items-center gap-0.5 py-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "min-h-[40px]"
                )}
                activeClassName="bg-primary/10 text-primary border border-primary/20"
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 py-0 text-[10px] font-semibold hidden xl:flex"
                  >
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* Mobile navigation grid */}
        {isOpen && (
          <div className="pb-4 sm:hidden animate-fade-in">
            <div className="grid grid-cols-2 gap-2 pt-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors",
                    "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "min-h-[48px]"
                  )}
                  activeClassName="bg-primary/10 text-primary border border-primary/20"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[9px] px-1.5 py-0 shrink-0"
                    >
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
