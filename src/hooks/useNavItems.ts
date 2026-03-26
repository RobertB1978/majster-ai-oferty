/**
 * useNavItems — shared navigation items for Navigation and TabletSidebar.
 *
 * Single source of truth for the app's main nav items so both the top
 * nav bar (desktop) and the icon sidebar (tablet hybrid §17) stay in sync.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Building2,
  Package,
  Calendar,
  BarChart3,
  UsersRound,
  TrendingUp,
  Store,
  Settings,
  CreditCard,
  Briefcase,
  Wallet,
  FileText,
  UserPlus,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Users, FolderKanban, Building2, Package, Calendar,
  BarChart3, UsersRound, TrendingUp, Store, Settings, CreditCard,
  Briefcase, Wallet, FileText, UserPlus, Zap,
};

const NAV_LABEL_KEYS: Record<string, string> = {
  dashboard: 'nav.dashboard',
  offers: 'nav.offers',
  jobs: 'nav.projects',
  clients: 'nav.clients',
  calendar: 'nav.calendar',
  finance: 'nav.finance',
  templates: 'nav.templates',
  team: 'nav.team',
  marketplace: 'nav.marketplace',
  analytics: 'nav.analytics',
  plan: 'nav.plan',
  quickEstimate: 'nav.quickEstimate',
};

const ADMIN_ONLY_IDS = new Set(['analytics']);

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  comingSoon: boolean;
  badge?: string;
}

export function useNavItems(): NavItem[] {
  const { t, i18n } = useTranslation();
  const { config } = useConfig();

  return useMemo(() => {
    const items = config.navigation.mainItems
      .filter((item) => item.visible && !ADMIN_ONLY_IDS.has(item.id))
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        to: item.path,
        label: NAV_LABEL_KEYS[item.id] ? t(NAV_LABEL_KEYS[item.id]) : item.label,
        icon: ICON_MAP[item.icon] || LayoutDashboard,
        comingSoon: item.comingSoon,
      }));

    const paths = new Set(items.map((i) => i.to));
    if (!paths.has('/app/offers')) {
      items.splice(1, 0, { to: '/app/offers', label: t('nav.offers'), icon: FileText, comingSoon: false });
    }
    if (!paths.has('/app/profile')) {
      items.push({ to: '/app/profile', label: t('nav.profile'), icon: Building2, comingSoon: false });
    }
    if (!paths.has('/app/settings')) {
      items.push({ to: '/app/settings', label: t('nav.settings'), icon: Settings, comingSoon: false });
    }

    return items;
  // i18n.language is needed to force recompute on language switch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.navigation.mainItems, t, i18n.language]);
}
