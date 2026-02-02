import { useTranslation } from 'react-i18next';
import { NavLink } from '@/components/NavLink';
import {
  FileText,
  Users,
  Menu,
  X,
  Package,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function Navigation() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { to: '/offers', label: t('nav.offers', 'Oferty'), icon: FileText },
    { to: '/clients', label: t('nav.clients'), icon: Users },
    { to: '/templates', label: t('nav.templates'), icon: Package },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-14 z-40">
      <div className="container">
        {/* Mobile menu button */}
        <div className="flex h-14 items-center justify-between sm:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-foreground"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="font-medium">Menu</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </Button>
        </div>

        {/* Desktop navigation with horizontal scroll */}
        <ScrollArea className="hidden sm:block w-full">
          <div className="flex h-14 items-center gap-1 py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 whitespace-nowrap",
                  "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                activeClassName="bg-gradient-to-r from-primary/15 to-accent/10 text-primary shadow-sm"
              >
                <item.icon className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* Mobile navigation - improved grid layout */}
        {isOpen && (
          <div className="pb-4 sm:hidden animate-fade-in">
            <div className="grid grid-cols-2 gap-2 pt-2">
              {navItems.map((item, index) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                    "bg-muted/30 text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 hover:text-foreground active:scale-[0.98]",
                    "animate-fade-in",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                  style={{ animationDelay: `${index * 0.03}s` }}
                  activeClassName="bg-gradient-to-r from-primary/15 to-accent/10 text-primary"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
