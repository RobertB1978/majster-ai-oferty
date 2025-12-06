import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Receipt, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { PricingPlans } from './PricingPlans';
import { toast } from 'sonner';

export function BillingDashboard() {
  const { t } = useTranslation();
  const [currentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (planId: string, priceId?: string) => {
    if (!priceId) {
      toast.info('Plan darmowy jest już aktywny');
      return;
    }
    
    setIsLoading(true);
    
    // Stripe checkout would be handled here
    // For now, show a message that Stripe needs to be configured
    toast.info('Dodaj klucz API Stripe w ustawieniach, aby aktywować płatności');
    
    setIsLoading(false);
  };

  const handleManageBilling = () => {
    toast.info('Dodaj klucz API Stripe, aby zarządzać płatnościami');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('billing.title')}</h2>
          <p className="text-muted-foreground">Zarządzaj swoją subskrypcją i płatnościami</p>
        </div>
        <Button variant="outline" onClick={handleManageBilling}>
          <Settings className="h-4 w-4 mr-2" />
          {t('billing.manageBilling')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktualny plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold capitalize">{currentPlan}</span>
              <Badge variant="secondary">Aktywny</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Następna płatność</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Plan darmowy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">OK</span>
              <Badge variant="outline" className="text-success border-success">
                Aktywny
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Plany cenowe</TabsTrigger>
          <TabsTrigger value="history">Historia płatności</TabsTrigger>
          <TabsTrigger value="invoices">Faktury</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <PricingPlans
            currentPlan={currentPlan}
            onSelectPlan={handleSelectPlan}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historia płatności</CardTitle>
              <CardDescription>Twoje ostatnie transakcje</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Brak historii płatności</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Płatności pojawią się tutaj po zakupie planu
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Faktury</CardTitle>
              <CardDescription>Pobierz faktury za płatności</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Brak faktur</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Faktury pojawią się tutaj po zakupie planu
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
