import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Building, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceId?: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

const plans: PricingPlan[] = [
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
    priceId: 'price_pro_monthly',
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
    priceId: 'price_business_monthly',
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

interface PricingPlansProps {
  currentPlan?: string;
  onSelectPlan?: (planId: string, priceId?: string) => void;
  isLoading?: boolean;
}

export function PricingPlans({ currentPlan = 'free', onSelectPlan, isLoading }: PricingPlansProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
            plan.popular && 'ring-2 ring-primary shadow-lg scale-105',
            currentPlan === plan.id && 'bg-accent/50'
          )}
        >
          {plan.popular && (
            <div className="absolute top-0 right-0">
              <Badge className="rounded-tl-none rounded-br-none">
                Popularny
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
              <span className="text-muted-foreground">PLN{t('billing.perMonth')}</span>
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
              disabled={currentPlan === plan.id || isLoading}
              onClick={() => onSelectPlan?.(plan.id, plan.priceId)}
            >
              {currentPlan === plan.id ? 'Aktualny plan' : t('billing.subscribe')}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
