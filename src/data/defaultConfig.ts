import type { AppConfig } from './appConfigSchema';
import { PLANS } from '@/config/plans';

// Derive prices from plans.ts — single source of truth for pricing.
// Any change to pricePLN in plans.ts is automatically reflected here.
const planPrice = (id: string): number => PLANS.find((p) => p.id === id)?.pricePLN ?? 0;

// Derive limits from plans.ts — single source of truth for plan limits.
// Spreads into tier objects to avoid duplicating values from plans.ts.
const planLimits = (id: string) => {
  const plan = PLANS.find((p) => p.id === id);
  return {
    maxProjects: plan?.limits.maxProjects ?? 0,
    maxClients: plan?.limits.maxClients ?? 0,
    maxTeamMembers: plan?.limits.maxTeamMembers ?? 0,
    maxStorageMB: plan?.limits.maxStorageMB ?? 0,
  };
};

/** Default configuration matching current app state. Used as reset target. */
export const DEFAULT_CONFIG: AppConfig = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),

  theme: {
    primaryHue: 30,
    primarySaturation: 90,
    primaryLightness: 32,
    radiusPx: 8,
    density: 'default',
    logoUrl: '',
  },

  navigation: {
    mainItems: [
      { id: 'dashboard', label: 'Pulpit', path: '/app/dashboard', icon: 'LayoutDashboard', visible: true, comingSoon: false, requiredPlan: 'free', order: 0 },
      { id: 'offers', label: 'Oferty', path: '/app/offers', icon: 'FileText', visible: true, comingSoon: false, requiredPlan: 'free', order: 1 },
      { id: 'jobs', label: 'Projekty', path: '/app/projects', icon: 'Briefcase', visible: true, comingSoon: false, requiredPlan: 'free', order: 2 },
      { id: 'clients', label: 'Klienci', path: '/app/customers', icon: 'Users', visible: true, comingSoon: false, requiredPlan: 'free', order: 3 },
      { id: 'calendar', label: 'Kalendarz', path: '/app/calendar', icon: 'Calendar', visible: true, comingSoon: false, requiredPlan: 'free', order: 4 },
      { id: 'finance', label: 'Finanse', path: '/app/finance', icon: 'Wallet', visible: true, comingSoon: false, requiredPlan: 'free', order: 5 },
      { id: 'templates', label: 'Szablony', path: '/app/templates', icon: 'Package', visible: true, comingSoon: false, requiredPlan: 'free', order: 6 },
      { id: 'team', label: 'Zespół', path: '/app/team', icon: 'UserPlus', visible: false, comingSoon: true, requiredPlan: 'pro', order: 7 },
      { id: 'marketplace', label: 'Marketplace', path: '/app/marketplace', icon: 'Store', visible: false, comingSoon: true, requiredPlan: 'business', order: 8 },
      { id: 'analytics', label: 'Analityka', path: '/app/analytics', icon: 'BarChart3', visible: false, comingSoon: true, requiredPlan: 'business', order: 9 },
      { id: 'plan', label: 'Mój plan', path: '/app/plan', icon: 'CreditCard', visible: true, comingSoon: false, requiredPlan: 'free', order: 10 },
    ],
  },

  plans: {
    tiers: [
      {
        id: 'free',
        name: 'Darmowy',
        pricePLN: planPrice('free'),
        ...planLimits('free'),
        // free plan: no paid features
        features: [],
        highlighted: false,
      },
      {
        id: 'pro',
        name: 'Pro',
        pricePLN: planPrice('pro'),
        ...planLimits('pro'),
        features: ['excelExport', 'team'],
        highlighted: true,
      },
      {
        id: 'business',
        name: 'Business',
        pricePLN: planPrice('business'),
        ...planLimits('business'),
        features: ['excelExport', 'team', 'ai', 'voice', 'documents', 'calendarSync', 'marketplace', 'advancedAnalytics', 'photoEstimation', 'ocr', 'prioritySupport'],
        highlighted: false,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        pricePLN: planPrice('enterprise'),
        ...planLimits('enterprise'),
        features: ['excelExport', 'team', 'ai', 'voice', 'documents', 'calendarSync', 'marketplace', 'advancedAnalytics', 'photoEstimation', 'ocr', 'api', 'prioritySupport', 'customTemplates', 'unlimitedProjects', 'unlimitedClients'],
        highlighted: false,
      },
    ],
  },

  content: {
    landingHeadline: 'Cyfrowe narzędzie dla fachowców',
    landingSubheadline: 'Wyceny, oferty, projekty i faktury — wszystko w jednym miejscu.',
    onboardingEnabled: true,
  },
};
