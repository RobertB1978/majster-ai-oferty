import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle } from 'lucide-react';
import { PricingPlans } from './PricingPlans';
import { toast } from 'sonner';

export function BillingDashboard() {
  const { t } = useTranslation();
  const [currentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (planId: string, priceId?: string) => {
    if (!priceId) {
      toast.info(t('billing.freePlanActive'));
      return;
    }

    setIsLoading(true);

    // Stripe checkout będzie obsługiwany tutaj po integracji
    toast.info(t('billing.stripeSetupRequired'));

    setIsLoading(false);
  };

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
              <Badge variant="secondary">{t('billing.active')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('common.status')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">OK</span>
              <Badge variant="outline" className="text-success border-success">
                {t('billing.active')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <PricingPlans
        currentPlan={currentPlan}
        onSelectPlan={handleSelectPlan}
        isLoading={isLoading}
      />
    </div>
  );
}
