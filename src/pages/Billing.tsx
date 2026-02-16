import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Check, Zap, Building, Crown, Receipt, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Dla początkujących',
    icon: <Zap className="h-6 w-6" />,
    features: [
      '3 projekty',
      '10 klientów',
      'Podstawowe raporty',
      'Wsparcie email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    description: 'Dla rozwijających się firm',
    icon: <Crown className="h-6 w-6" />,
    popular: true,
    features: [
      'Nieograniczone projekty',
      'Nieograniczeni klienci',
      'Zaawansowane raporty',
      'Integracja z kalendarzem',
      'API dostęp',
      'Priorytetowe wsparcie',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 199,
    description: 'Dla dużych zespołów',
    icon: <Building className="h-6 w-6" />,
    features: [
      'Wszystko z Pro',
      'Nieograniczeni użytkownicy',
      'Własne integracje',
      'Dedykowany opiekun',
      'SLA 99.9%',
      'Szkolenia zespołu',
    ],
  },
];

export default function Billing() {
  const { t } = useTranslation();

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      toast.info(t('billing.alreadyFree', 'Plan darmowy jest już aktywny'));
      return;
    }
    toast.info(t('billing.addStripeKey', 'Dodaj klucz API Stripe w ustawieniach, aby aktywować płatności'));
  };

  return (
    <>
      <Helmet>
        <title>{t('billing.title')} | Majster.AI</title>
        <meta name="description" content={t('billing.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              {t('billing.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('billing.subtitle')}
            </p>
          </div>
        </div>

        {/* Current plan summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('billing.currentPlan')}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{t('billing.plans.free')}</span>
                <Badge variant="secondary">{t('billing.active')}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('billing.nextPayment', 'Następna płatność')}</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">{t('billing.freePlan', 'Plan darmowy')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('billing.usage', 'Wykorzystanie')}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2/3</div>
              <p className="text-xs text-muted-foreground">{t('billing.projects', 'projektów')}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans">{t('billing.pricingPlans', 'Plany cenowe')}</TabsTrigger>
            <TabsTrigger value="history">{t('billing.history', 'Historia')}</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
                    plan.popular && 'ring-2 ring-primary shadow-lg md:scale-105'
                  )}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-tl-none rounded-br-none">
                        {t('billing.mostPopular')}
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'p-2 rounded-lg',
                        plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        {plan.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">PLN/mies.</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {plan.id === 'free' ? 'Aktualny plan' : (
                        <>
                          Wybierz
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historia płatności</CardTitle>
                <CardDescription>Twoje ostatnie transakcje</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Brak historii płatności</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Płatności pojawią się tutaj po zakupie planu
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
