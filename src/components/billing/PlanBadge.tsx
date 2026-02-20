import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { useUserSubscription } from '@/hooks/useSubscription';

const PLAN_LABELS: Record<string, { pl: string; en: string; uk: string; color: string }> = {
  free: { pl: 'Darmowy', en: 'Free', uk: 'Безкоштовний', color: 'secondary' },
  pro: { pl: 'Pro', en: 'Pro', uk: 'Про', color: 'default' },
  starter: { pl: 'Pro', en: 'Pro', uk: 'Про', color: 'default' },
  business: { pl: 'Biznes', en: 'Business', uk: 'Бізнес', color: 'default' },
  enterprise: { pl: 'Enterprise', en: 'Enterprise', uk: 'Корпоративний', color: 'default' },
};

export function PlanBadge() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { data: subscription, isLoading } = useUserSubscription();

  if (isLoading) return null;

  const planId = subscription?.plan_id ?? 'free';
  const lang = i18n.language.startsWith('uk') ? 'uk' : i18n.language.startsWith('en') ? 'en' : 'pl';
  const planLabel = PLAN_LABELS[planId]?.[lang] ?? planId;
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
