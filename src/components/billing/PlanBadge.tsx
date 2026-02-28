import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useUserSubscription } from '@/hooks/useSubscription';

const PLAN_FALLBACK_IDS = ['free', 'pro', 'starter', 'business', 'enterprise'] as const;
type PlanId = typeof PLAN_FALLBACK_IDS[number];

export function PlanBadge() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: subscription, isLoading } = useUserSubscription();

  if (isLoading) return null;

  const planId = (subscription?.plan_id ?? 'free') as string;
  const i18nPlanId: PlanId = PLAN_FALLBACK_IDS.includes(planId as PlanId) ? planId as PlanId : 'free';
  const planLabel = t(`billing.plans.${i18nPlanId}.name`, planId);
  const isPaid = planId !== 'free';

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
