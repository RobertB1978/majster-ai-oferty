/**
 * SubscriptionSection — PR-20
 *
 * Shows in Settings → Subscription tab.
 * Displays real subscription data from user_subscriptions table and
 * provides upgrade CTA (free plan) or manage billing link (paid plan).
 *
 * Security: No Stripe keys in browser. All Stripe actions go through
 * Edge Functions (create-checkout-session, customer-portal).
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, ExternalLink, ArrowUpRight, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useUserSubscription } from '@/hooks/useSubscription';
import { useCustomerPortal } from '@/hooks/useStripe';
import { toast } from 'sonner';

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
    active: {
      variant: 'default',
      icon: <CheckCircle className="h-3 w-3" />,
      label: t('billing.subscription.statusActive', 'Aktywny'),
    },
    trial: {
      variant: 'secondary',
      icon: <CheckCircle className="h-3 w-3" />,
      label: t('billing.subscription.statusTrialing', 'Testowy'),
    },
    cancelled: {
      variant: 'outline',
      icon: <XCircle className="h-3 w-3" />,
      label: t('billing.subscription.statusCanceled', 'Anulowany'),
    },
    expired: {
      variant: 'destructive',
      icon: <AlertCircle className="h-3 w-3" />,
      label: t('billing.subscription.statusExpired', 'Wygasły'),
    },
  };

  const cfg = config[status] ?? {
    variant: 'secondary' as const,
    icon: <AlertCircle className="h-3 w-3" />,
    label: status,
  };

  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

export function SubscriptionSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useUserSubscription();
  const { mutate: openPortal, isPending: isPortalLoading } = useCustomerPortal();

  const plan = subscription?.plan_id ?? 'free';
  const status = subscription?.status ?? 'active';
  const isPaid = plan !== 'free';
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const handleManageBilling = () => {
    openPortal(undefined, {
      onError: () => {
        toast.error(t('billing.subscription.portalError', 'Nie można otworzyć portalu płatności'));
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('billing.subscription.title', 'Subskrypcja')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t('billing.subscription.title', 'Subskrypcja')}
        </CardTitle>
        <CardDescription>
          {t('billing.subscription.description', 'Twój aktualny plan i status płatności')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Plan + status row */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {t('billing.subscription.plan', 'Plan')}
            </p>
            <p className="font-semibold capitalize text-lg">{plan}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {t('billing.subscription.status', 'Status')}
            </p>
            <StatusBadge status={status} />
          </div>

          {periodEnd && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {t('billing.subscription.periodEnd', 'Ważny do')}
              </p>
              <p className="text-sm font-medium">{periodEnd}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {isPaid ? (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isPortalLoading}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isPortalLoading
                ? t('common.loading', 'Ładowanie...')
                : t('billing.subscription.manageBilling', 'Portal płatności')}
            </Button>
          ) : (
            <Button onClick={() => navigate('/app/plan')} className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              {t('billing.subscription.upgradeCta', 'Ulepsz do Pro')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
