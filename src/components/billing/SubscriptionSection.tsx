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
import { formatDateLong } from '@/lib/formatters';

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
    active: {
      variant: 'default',
      icon: <CheckCircle className="h-3 w-3" />,
      label: t('billing.subscription.statusActive'),
    },
    trial: {
      variant: 'secondary',
      icon: <CheckCircle className="h-3 w-3" />,
      label: t('billing.subscription.statusTrialing'),
    },
    cancelled: {
      variant: 'outline',
      icon: <XCircle className="h-3 w-3" />,
      label: t('billing.subscription.statusCanceled'),
    },
    expired: {
      variant: 'destructive',
      icon: <AlertCircle className="h-3 w-3" />,
      label: t('billing.subscription.statusExpired'),
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: subscription, isLoading } = useUserSubscription();
  const { mutate: openPortal, isPending: isPortalLoading } = useCustomerPortal();

  const plan = subscription?.plan_id ?? 'free';
  const status = subscription?.status ?? 'active';
  const isPaid = plan !== 'free';
  // Portal Stripe jest dostępny tylko wtedy, gdy istnieje powiązany klient Stripe.
  // Użytkownicy z manualnie ustawionym planem (bez Stripe) nie mają stripe_customer_id.
  const hasStripeCustomer = !!subscription?.stripe_customer_id;
  const periodEnd = subscription?.current_period_end
    ? formatDateLong(subscription.current_period_end, i18n.language)
    : null;

  const handleManageBilling = () => {
    openPortal(undefined, {
      onError: () => {
        toast.error(t('billing.subscription.portalError'));
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('billing.subscription.title')}
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
          {t('billing.subscription.title')}
        </CardTitle>
        <CardDescription>
          {t('billing.subscription.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Plan + status row */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {t('billing.subscription.plan')}
            </p>
            <p className="font-semibold capitalize text-lg">{plan}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {t('billing.subscription.status')}
            </p>
            <StatusBadge status={status} />
          </div>

          {periodEnd && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {t('billing.subscription.periodEnd')}
              </p>
              <p className="text-sm font-medium">{periodEnd}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {isPaid && hasStripeCustomer ? (
            // Płatny plan + klient Stripe — pokaż portal zarządzania
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isPortalLoading}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isPortalLoading
                ? t('common.loading')
                : t('billing.subscription.manageBilling')}
            </Button>
          ) : isPaid && !hasStripeCustomer ? (
            // Płatny plan bez Stripe (np. manualnie ustawiony przez admina) — brak portalu
            <p className="text-xs text-muted-foreground">
              {t('billing.subscription.noPortalAdmin')}
            </p>
          ) : (
            // Plan darmowy — CTA do upgrade
            <Button onClick={() => navigate('/app/plan')} className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              {t('billing.subscription.upgradeCta')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
