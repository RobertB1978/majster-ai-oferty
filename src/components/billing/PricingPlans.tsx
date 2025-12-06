import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Building, Crown, Rocket, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceId?: string;
  description: string;
  features: string[];
  limitations?: string[];
  icon: React.ReactNode;
  popular?: boolean;
  hasAds?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Do sprawdzenia aplikacji',
    icon: <Zap className="h-6 w-6" />,
    hasAds: true,
    features: [
      '3 projekty',
      '5 klientów',
      'Podstawowe wyceny',
      'Prosty szablon PDF',
    ],
    limitations: [
      'Reklamy w aplikacji',
      'Brak AI asystenta',
      'Brak eksportu Excel',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    priceId: 'price_starter_monthly',
    description: 'Dla początkujących',
    icon: <Star className="h-6 w-6" />,
    features: [
      '15 projektów',
      '30 klientów',
      'Bez reklam',
      'Wszystkie szablony PDF',
      'Eksport do Excel',
      'Wsparcie email',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    priceId: 'price_business_monthly',
    description: 'Dla rozwijających się firm',
    icon: <Crown className="h-6 w-6" />,
    popular: true,
    features: [
      'Nieograniczone projekty',
      'Nieograniczeni klienci',
      'AI Asystent wycen',
      'Głosowe tworzenie ofert',
      'Integracja z kalendarzem',
      'Dokumenty firmowe',
      'Priorytetowe wsparcie',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 139,
    priceId: 'price_enterprise_monthly',
    description: 'Pełne możliwości',
    icon: <Rocket className="h-6 w-6" />,
    features: [
      'Wszystko z Business',
      'Nieograniczone AI zapytania',
      'Własne szablony branżowe',
      'API dostęp',
      'Dedykowany opiekun',
      'SLA 99.9%',
      'Szkolenia zespołu',
      'Priorytetowe funkcje',
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
            plan.popular && 'ring-2 ring-primary shadow-lg scale-[1.02]',
            currentPlan === plan.id && 'bg-accent/50'
          )}
        >
          {plan.popular && (
            <div className="absolute top-0 right-0">
              <Badge className="rounded-tl-none rounded-br-none bg-primary">
                Najpopularniejszy
              </Badge>
            </div>
          )}
          {plan.hasAds && (
            <div className="absolute top-0 left-0">
              <Badge variant="outline" className="rounded-tr-none rounded-bl-none text-xs">
                z reklamami
              </Badge>
            </div>
          )}
          <CardHeader className="pb-4">
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
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
              {plan.limitations?.map((limitation, i) => (
                <li key={`lim-${i}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-4 w-4 shrink-0 flex items-center justify-center text-xs">✕</span>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              variant={plan.popular ? 'default' : 'outline'}
              disabled={currentPlan === plan.id || isLoading}
              onClick={() => onSelectPlan?.(plan.id, plan.priceId)}
            >
              {currentPlan === plan.id ? 'Aktualny plan' : plan.price === 0 ? 'Wybierz' : 'Subskrybuj'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
