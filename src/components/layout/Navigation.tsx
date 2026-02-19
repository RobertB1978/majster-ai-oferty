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
  ChevronDown,
  Briefcase,
  Wallet,
  FileText,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useConfig } from '@/contexts/ConfigContext';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Users, FolderKanban, Building2, Package, Calendar,
  BarChart3, UsersRound, TrendingUp, Store, Settings, CreditCard,
  Briefcase, Wallet, FileText, UserPlus,
};

export function Navigation() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { config } = useConfig();

  // Items that belong in admin panel only - never show in user navigation
  // 'plan' is intentionally excluded — users should access their subscription page
  const ADMIN_ONLY_IDS = new Set(['marketplace', 'analytics', 'team']);

  const navItems = useMemo(() => {
    const configItems = config.navigation.mainItems
      .filter((item) => item.visible && !ADMIN_ONLY_IDS.has(item.id))
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        to: item.path,
        label: item.label,
        icon: ICON_MAP[item.icon] || LayoutDashboard,
        comingSoon: item.comingSoon,
      }));

    // Always include profile + settings at the end if not in config
    const paths = new Set(configItems.map((i) => i.to));
    if (!paths.has('/app/profile')) {
      configItems.push({ to: '/app/profile', label: t('nav.profile'), icon: Building2, comingSoon: false });
    }
    if (!paths.has('/app/settings')) {
      configItems.push({ to: '/app/settings', label: t('nav.settings'), icon: Settings, comingSoon: false });
    }
    return configItems;
  }, [config.navigation.mainItems, t]);

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
                {item.comingSoon && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 py-0 text-[10px] font-semibold hidden xl:flex"
                  >
                    Soon
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
