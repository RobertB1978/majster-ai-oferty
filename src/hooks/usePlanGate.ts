import { useMemo } from 'react';
import { usePlanFeatures, useUserSubscription } from './useSubscription';
import { toast } from 'sonner';

export type PlanFeature = 
  | 'ai'
  | 'voice'
  | 'documents'
  | 'excelExport'
  | 'calendarSync'
  | 'prioritySupport'
  | 'api'
  | 'customTemplates'
  | 'team'
  | 'marketplace'
  | 'advancedAnalytics'
  | 'photoEstimation'
  | 'ocr'
  | 'unlimitedProjects'
  | 'unlimitedClients';

interface PlanLimits {
  maxProjects: number;
  maxClients: number;
  maxTeamMembers: number;
  maxApiCalls: number;
  maxStorageMB: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxProjects: 3,
    maxClients: 5,
    maxTeamMembers: 0,
    maxApiCalls: 0,
    maxStorageMB: 50,
  },
  pro: {
    maxProjects: 15,
    maxClients: 30,
    maxTeamMembers: 2,
    maxApiCalls: 100,
    maxStorageMB: 500,
  },
  starter: {
    maxProjects: 15,
    maxClients: 30,
    maxTeamMembers: 2,
    maxApiCalls: 100,
    maxStorageMB: 500,
  },
  business: {
    maxProjects: 100,
    maxClients: 200,
    maxTeamMembers: 10,
    maxApiCalls: 1000,
    maxStorageMB: 2048,
  },
  enterprise: {
    maxProjects: Infinity,
    maxClients: Infinity,
    maxTeamMembers: Infinity,
    maxApiCalls: Infinity,
    maxStorageMB: Infinity,
  },
};

const FEATURE_REQUIREMENTS: Record<PlanFeature, string[]> = {
  ai: ['business', 'enterprise'],
  voice: ['business', 'enterprise'],
  documents: ['business', 'enterprise'],
  excelExport: ['pro', 'starter', 'business', 'enterprise'],
  calendarSync: ['business', 'enterprise'],
  prioritySupport: ['business', 'enterprise'],
  api: ['enterprise'],
  customTemplates: ['enterprise'],
  team: ['pro', 'starter', 'business', 'enterprise'],
  marketplace: ['business', 'enterprise'],
  advancedAnalytics: ['business', 'enterprise'],
  photoEstimation: ['business', 'enterprise'],
  ocr: ['business', 'enterprise'],
  unlimitedProjects: ['enterprise'],
  unlimitedClients: ['enterprise'],
};

const FEATURE_NAMES: Record<PlanFeature, string> = {
  ai: 'Asystent AI',
  voice: 'Wycena głosowa',
  documents: 'Dokumenty firmowe',
  excelExport: 'Eksport Excel',
  calendarSync: 'Synchronizacja kalendarza',
  prioritySupport: 'Priorytetowe wsparcie',
  api: 'API publiczne',
  customTemplates: 'Szablony niestandardowe',
  team: 'Zarządzanie zespołem',
  marketplace: 'Marketplace podwykonawców',
  advancedAnalytics: 'Zaawansowana analityka',
  photoEstimation: 'Foto-wycena AI',
  ocr: 'OCR faktur',
  unlimitedProjects: 'Nieograniczone projekty',
  unlimitedClients: 'Nieograniczeni klienci',
};

export function usePlanGate() {
  const { data: subscription } = useUserSubscription();
  const { currentPlan, features, isPremium } = usePlanFeatures();
  
  const limits = useMemo(() => {
    return PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;
  }, [currentPlan]);

  const canUseFeature = (feature: PlanFeature): boolean => {
    const requiredPlans = FEATURE_REQUIREMENTS[feature];
    return requiredPlans.includes(currentPlan);
  };

  const checkFeature = (feature: PlanFeature): boolean => {
    const allowed = canUseFeature(feature);
    if (!allowed) {
      const featureName = FEATURE_NAMES[feature];
      toast.error(`Funkcja "${featureName}" wymaga wyższego planu`, {
        description: 'Przejdź do ustawień, aby zmienić plan.',
        action: {
          label: 'Zmień plan',
          onClick: () => window.location.href = '/billing',
        },
      });
    }
    return allowed;
  };

  const checkLimit = (type: keyof PlanLimits, currentCount: number): boolean => {
    const limit = limits[type];
    if (currentCount >= limit) {
      const limitNames: Record<keyof PlanLimits, string> = {
        maxProjects: 'projektów',
        maxClients: 'klientów',
        maxTeamMembers: 'członków zespołu',
        maxApiCalls: 'wywołań API',
        maxStorageMB: 'MB przestrzeni',
      };
      toast.error(`Osiągnięto limit ${limitNames[type]}`, {
        description: `Twój plan "${currentPlan}" pozwala na ${limit === Infinity ? 'nieograniczoną liczbę' : limit} ${limitNames[type]}.`,
        action: {
          label: 'Zmień plan',
          onClick: () => window.location.href = '/billing',
        },
      });
      return false;
    }
    return true;
  };

  const getUpgradeMessage = (feature: PlanFeature): string => {
    const requiredPlans = FEATURE_REQUIREMENTS[feature];
    const minPlan = requiredPlans[0];
    return `Ta funkcja wymaga planu ${minPlan.toUpperCase()} lub wyższego.`;
  };

  return {
    currentPlan,
    isPremium,
    limits,
    features,
    canUseFeature,
    checkFeature,
    checkLimit,
    getUpgradeMessage,
    subscription,
  };
}

export function PlanGateWrapper({ 
  feature, 
  children, 
  fallback 
}: { 
  feature: PlanFeature; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { canUseFeature } = usePlanGate();
  
  if (!canUseFeature(feature)) {
    return fallback ? fallback : null;
  }
  
  return children;
}
