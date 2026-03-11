import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowUpRight } from 'lucide-react';
import { PricingPlans } from './PricingPlans';
import { useUserSubscription } from '@/hooks/useSubscription';
import { useCreateCheckoutSession } from '@/hooks/useStripe';
import { toast } from 'sonner';

export function BillingDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useUserSubscription();
  const { mutate: createCheckout, isPending: isCheckoutLoading } = useCreateCheckoutSession();

  const currentPlan = subscription?.plan_id ?? 'free';
  const status = subscription?.status ?? 'active';

  const handleSelectPlan = async (planId: string, priceId?: string) => {
    if (!priceId || planId === 'free') {
      navigate('/app/plan');
      return;
    }
    createCheckout(
      { priceId },
      {
        onError: () => {
          toast.info(t('billing.stripeSetupRequired'));
          navigate('/app/plan');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t('billing.title')}</h2>
        <p className="text-muted-foreground">{t('billing.managementSubtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('billing.currentPlan')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold capitalize">{currentPlan}</span>
              <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                {status === 'trial'
                  ? t('billing.subscription.statusTrialing', 'Testowy')
                  : status === 'cancelled'
                  ? t('billing.subscription.statusCanceled', 'Anulowany')
                  : t('billing.active')}
              </Badge>
            </div>
            {currentPlan === 'free' && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-2"
                onClick={() => navigate('/app/plan')}
              >
                <ArrowUpRight className="h-4 w-4" />
                {t('billing.subscription.upgradeCta', 'Ulepsz do Pro')}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('billing.subscription.periodEnd', 'Ważny do')}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {subscription?.current_period_end ? (
              <div className="text-2xl font-bold">
                {new Date(subscription.current_period_end).toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">—</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {currentPlan === 'free'
                ? t('billing.freePlan', 'Plan darmowy')
                : t('billing.paidSubscription', 'Subskrypcja aktywna')}
            </p>
          </CardContent>
        </Card>
      </div>

      <PricingPlans
        currentPlan={currentPlan}
        onSelectPlan={handleSelectPlan}
        isLoading={isCheckoutLoading}
      />
    </div>
  );
}
