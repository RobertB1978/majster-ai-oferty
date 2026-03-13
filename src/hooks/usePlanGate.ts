import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlanFeatures, useUserSubscription } from './useSubscription';
import { toast } from 'sonner';
import { getLimitsForPlan, normalizePlanId } from '@/config/plans';

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
  /** Internal API rate-limit — not shown on the pricing page. */
  maxApiCalls: number;
  maxStorageMB: number;
}

/**
 * maxApiCalls is an internal rate-limit not present on the public pricing page
 * (plans.ts). Kept here as an extension alongside the canonical limits.
 */
const MAX_API_CALLS: Record<string, number> = {
  free: 0,
  pro: 100,
  business: 1000,
  enterprise: Infinity,
};

/**
 * Plan limits derived from the canonical source of truth (src/config/plans.ts).
 * Only canonical plan ids are listed here; legacy aliases (e.g. 'starter') are
 * resolved via normalizePlanId() before this table is consulted.
 */
const PLAN_LIMITS: Record<string, PlanLimits> = (['free', 'pro', 'business', 'enterprise'] as const).reduce(
  (acc, id) => {
    const canonical = getLimitsForPlan(id);
    acc[id] = { ...canonical, maxApiCalls: MAX_API_CALLS[id] ?? 0 };
    return acc;
  },
  {} as Record<string, PlanLimits>
);

/**
 * Feature requirements use canonical plan ids only.
 * 'starter' is NOT listed — it is normalised to 'pro' before any lookup here.
 */
const FEATURE_REQUIREMENTS: Record<PlanFeature, string[]> = {
  ai: ['business', 'enterprise'],
  voice: ['business', 'enterprise'],
  documents: ['business', 'enterprise'],
  excelExport: ['pro', 'business', 'enterprise'],
  calendarSync: ['business', 'enterprise'],
  prioritySupport: ['business', 'enterprise'],
  api: ['enterprise'],
  customTemplates: ['enterprise'],
  team: ['pro', 'business', 'enterprise'],
  marketplace: ['business', 'enterprise'],
  advancedAnalytics: ['business', 'enterprise'],
  photoEstimation: ['business', 'enterprise'],
  ocr: ['business', 'enterprise'],
  unlimitedProjects: ['enterprise'],
  unlimitedClients: ['enterprise'],
};

// Feature name i18n keys (resolved at call time via t())
const FEATURE_NAME_KEYS: Record<PlanFeature, string> = {
  ai: 'planGate.features.ai',
  voice: 'planGate.features.voice',
  documents: 'planGate.features.documents',
  excelExport: 'planGate.features.excelExport',
  calendarSync: 'planGate.features.calendarSync',
  prioritySupport: 'planGate.features.prioritySupport',
  api: 'planGate.features.api',
  customTemplates: 'planGate.features.customTemplates',
  team: 'planGate.features.team',
  marketplace: 'planGate.features.marketplace',
  advancedAnalytics: 'planGate.features.advancedAnalytics',
  photoEstimation: 'planGate.features.photoEstimation',
  ocr: 'planGate.features.ocr',
  unlimitedProjects: 'planGate.features.unlimitedProjects',
  unlimitedClients: 'planGate.features.unlimitedClients',
};

export function usePlanGate() {
  const { t } = useTranslation();
  const { data: subscription } = useUserSubscription();
  const { currentPlan, features, isPremium } = usePlanFeatures();

  /** Canonical plan id — resolves legacy aliases (e.g. 'starter' → 'pro'). */
  const normalizedPlan = useMemo(() => normalizePlanId(currentPlan), [currentPlan]);

  const limits = useMemo(() => {
    return PLAN_LIMITS[normalizedPlan] ?? PLAN_LIMITS.free;
  }, [normalizedPlan]);

  const canUseFeature = (feature: PlanFeature): boolean => {
    const requiredPlans = FEATURE_REQUIREMENTS[feature];
    return requiredPlans.includes(normalizedPlan);
  };

  const checkFeature = (feature: PlanFeature): boolean => {
    const allowed = canUseFeature(feature);
    if (!allowed) {
      const featureName = t(FEATURE_NAME_KEYS[feature]);
      toast.error(t('planGate.featureRequiresUpgrade', { feature: featureName }), {
        description: t('planGate.goToSettings'),
        action: {
          label: t('planGate.changePlan'),
          onClick: () => window.location.href = '/app/plan',
        },
      });
    }
    return allowed;
  };

  const checkLimit = (type: keyof PlanLimits, currentCount: number): boolean => {
    const limit = limits[type];
    if (currentCount >= limit) {
      const limitNameKeys: Record<keyof PlanLimits, string> = {
        maxProjects: 'planGate.limits.projects',
        maxClients: 'planGate.limits.clients',
        maxTeamMembers: 'planGate.limits.teamMembers',
        maxApiCalls: 'planGate.limits.apiCalls',
        maxStorageMB: 'planGate.limits.storageMB',
      };
      const limitName = t(limitNameKeys[type]);
      toast.error(t('planGate.limitReached', { type: limitName }), {
        description: t('planGate.limitDescription', {
          plan: currentPlan,
          limit: limit === Infinity ? t('planGate.unlimited') : limit,
          type: limitName,
        }),
        action: {
          label: t('planGate.changePlan'),
          onClick: () => window.location.href = '/app/plan',
        },
      });
      return false;
    }
    return true;
  };

  const getUpgradeMessage = (feature: PlanFeature): string => {
    const requiredPlans = FEATURE_REQUIREMENTS[feature];
    const minPlan = requiredPlans[0];
    const PLAN_DISPLAY_NAMES: Record<string, string> = {
      pro: 'Pro',
      business: t('planGate.planNames.business'),
      enterprise: 'Enterprise',
    };
    const displayName = PLAN_DISPLAY_NAMES[minPlan] ?? minPlan;
    return t('planGate.upgradeMessage', { plan: displayName });
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
  /**
   * UI wyświetlane gdy użytkownik nie ma dostępu do feature.
   *
   * WAŻNE: Zawsze podawaj fallback — bez niego komponent zwraca null,
   * co zostawia użytkownika bez wyjaśnienia dlaczego zawartość zniknęła.
   * Minimalne fallback: <UpgradeModal> lub <p>Wymaga planu Pro</p>.
   */
  fallback?: React.ReactNode;
}) {
  const { canUseFeature } = usePlanGate();

  if (!canUseFeature(feature)) {
    if (fallback) return fallback;
    // Brak fallbacka — w trybie deweloperskim loguj ostrzeżenie,
    // aby author komponentu wiedział, że musi go dostarczyć.
    if (import.meta.env.DEV) {
      console.warn(
        `[PlanGateWrapper] feature="${feature}" jest zablokowany, ale nie podano fallback. ` +
        'Użytkownik widzi pustą przestrzeń bez wyjaśnienia. Dodaj prop fallback={<UpgradeModal />}.'
      );
    }
    return null;
  }

  return children;
}
