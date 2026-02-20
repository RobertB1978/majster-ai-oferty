import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useUserSubscription } from '@/hooks/useSubscription';

export function PlanBadge() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: subscription, isLoading } = useUserSubscription();

  if (isLoading) return null;

  const planId = subscription?.plan_id ?? 'free';

  // t() is reactive — badge updates instantly on language change without page reload
  const planNames: Record<string, string> = {
    free: t('plan.names.free'),
    pro: t('plan.names.pro'),
    starter: t('plan.names.starter'),
    business: t('plan.names.business'),
    enterprise: t('plan.names.enterprise'),
  };

  const planLabel = planNames[planId] ?? planId;
  const isPaid = planId !== 'free';

  return (
    <button
      onClick={() => navigate('/app/plan')}
      className="flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label={`Plan: ${planLabel}. Kliknij, by zobaczyć plany`}
    >
      <span className={isPaid ? 'text-primary font-semibold' : ''}>
        Plan: {planLabel}
      </span>
      <ChevronDown className="h-3 w-3 opacity-50" />
    </button>
  );
}
