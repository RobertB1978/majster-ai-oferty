import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useUserSubscription } from '@/hooks/useSubscription';
import { normalizePlanId } from '@/config/plans';

// Canonical plan ids that have i18n keys under billing.plans.<id>.name.
// 'starter' is intentionally absent — it is normalised to 'pro' before lookup.
const CANONICAL_PLAN_IDS = ['free', 'pro', 'business', 'enterprise'] as const;
type CanonicalPlanId = typeof CANONICAL_PLAN_IDS[number];

export function PlanBadge() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: subscription, isLoading } = useUserSubscription();

  if (isLoading) return null;

  const rawPlanId = (subscription?.plan_id ?? 'free') as string;
  // Resolve legacy aliases (e.g. 'starter' → 'pro') before i18n lookup.
  const planId = normalizePlanId(rawPlanId);
  const i18nPlanId: CanonicalPlanId = CANONICAL_PLAN_IDS.includes(planId as CanonicalPlanId) ? planId as CanonicalPlanId : 'free';
  const planLabel = t(`billing.plans.${i18nPlanId}.name`, i18nPlanId);
  const isPaid = rawPlanId !== 'free';

  return (
    <button
      onClick={() => navigate('/app/plan')}
      className="flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label={t('billing.planBadge.ariaLabel', { plan: planLabel })}
    >
      <span className={isPaid ? 'text-primary font-semibold' : ''}>
        Plan: {planLabel}
      </span>
      <ChevronDown className="h-3 w-3 opacity-50" />
    </button>
  );
}
