import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Zap } from 'lucide-react';

function trialDaysRemaining(createdAt: string): number {
  const trialEndMs = new Date(createdAt).getTime() + 30 * 86_400_000;
  return Math.max(0, Math.ceil((trialEndMs - Date.now()) / 86_400_000));
}

export function TrialBanner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: subscription, isLoading } = useUserSubscription();

  if (isLoading || !user) return null;

  // If user has a paid or non-trial plan, don't show banner
  const isTrialOrFree =
    !subscription ||
    subscription.plan_id === 'free' ||
    subscription.status === 'trial';

  if (!isTrialOrFree) return null;

  const daysLeft = trialDaysRemaining(user.created_at);

  if (daysLeft <= 0) {
    // Trial expired — show lock banner
    return (
      <Alert className="border-destructive bg-destructive/10">
        <Zap className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm">
            <span className="font-semibold text-destructive">{t('billing.trialExpired')}</span>{' '}
            {t('billing.trialExpiredDesc')}
          </span>
          <Button size="sm" onClick={() => navigate('/app/plan')} className="shrink-0">
            {t('billing.selectPlan')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show countdown only when ≤ 7 days left
  if (daysLeft > 7) return null;

  return (
    <Alert className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700">
      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-amber-800 dark:text-amber-300">
          <span className="font-semibold">
            {t('billing.trialDaysRemaining', { count: daysLeft })}
          </span>{' '}
          {t('billing.upgradeToMaintainAccess')}
        </span>
        <Button size="sm" variant="outline" onClick={() => navigate('/app/plan')} className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300">
          {t('billing.selectPlan')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
