import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Rocket, Star, Sparkles } from 'lucide-react';
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
  gradient: string;
  iconGradient: string;
}

const getPlans = (t: (key: string) => string): PricingPlan[] => [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: t('billing.plans.free.description'),
    icon: <Zap className="h-6 w-6" />,
    hasAds: true,
    gradient: 'from-slate-500/10 to-gray-500/5',
    iconGradient: 'from-slate-500 to-gray-600',
    features: [
      t('billing.plans.free.features.projects'),
      t('billing.plans.free.features.clients'),
      t('billing.plans.free.features.basicQuotes'),
      t('billing.plans.free.features.simplePdf'),
    ],
    limitations: [
      t('billing.plans.free.limitations.ads'),
      t('billing.plans.free.limitations.noAi'),
      t('billing.plans.free.limitations.noExcel'),
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39,
    priceId: 'price_pro_monthly',
    description: t('billing.plans.pro.description'),
    icon: <Star className="h-6 w-6" />,
    gradient: 'from-primary/10 to-primary/5',
    iconGradient: 'from-primary to-primary',
    features: [
      t('billing.plans.pro.features.projects'),
      t('billing.plans.pro.features.clients'),
      t('billing.plans.pro.features.noAds'),
      t('billing.plans.pro.features.allPdfTemplates'),
      t('billing.plans.pro.features.excelExport'),
      t('billing.plans.pro.features.emailSupport'),
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    priceId: 'price_business_monthly',
    description: t('billing.plans.business.description'),
    icon: <Crown className="h-6 w-6" />,
    popular: true,
    gradient: 'from-amber-500/10 to-orange-500/5',
    iconGradient: 'from-amber-500 to-orange-600',
    features: [
      t('billing.plans.business.features.unlimitedProjects'),
      t('billing.plans.business.features.unlimitedClients'),
      t('billing.plans.business.features.aiAssistant'),
      t('billing.plans.business.features.voiceQuotes'),
      t('billing.plans.business.features.calendarIntegration'),
      t('billing.plans.business.features.companyDocuments'),
      t('billing.plans.business.features.prioritySupport'),
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 129,
    priceId: 'price_enterprise_monthly',
    description: t('billing.plans.enterprise.description'),
    icon: <Rocket className="h-6 w-6" />,
    gradient: 'from-primary/10 to-primary/5',
    iconGradient: 'from-primary to-primary',
    features: [
      t('billing.plans.enterprise.features.allBusiness'),
      t('billing.plans.enterprise.features.unlimitedAi'),
      t('billing.plans.enterprise.features.customTemplates'),
      t('billing.plans.enterprise.features.apiAccess'),
      t('billing.plans.enterprise.features.dedicatedManager'),
      t('billing.plans.enterprise.features.sla'),
      t('billing.plans.enterprise.features.teamTraining'),
      t('billing.plans.enterprise.features.priorityFeatures'),
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
  const plans = getPlans(t);

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan, index) => (
        <Card
          key={plan.id}
          className={cn(
            'relative overflow-hidden transition-all duration-500 hover:shadow-2xl group',
            `bg-gradient-to-br ${plan.gradient}`,
            plan.popular && 'ring-2 ring-primary shadow-xl scale-[1.02] z-10',
            currentPlan === plan.id && 'ring-2 ring-green-500'
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Decorative elements */}

          {plan.popular && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-primary text-primary-foreground shadow-sm flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {t('billing.mostPopular')}
              </Badge>
            </div>
          )}
          {plan.hasAds && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="text-xs opacity-70">
                {t('billing.withAds')}
              </Badge>
            </div>
          )}
          {currentPlan === plan.id && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-green-500 text-white">
                {t('billing.active')}
              </Badge>
            </div>
          )}
          
          <CardHeader className="pb-4 pt-8 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'p-3 rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110',
                plan.iconGradient
              )}>
                <div className="text-white">{plan.icon}</div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl sm:text-5xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground text-sm">{t('billing.pricePerMonth')}</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 relative">
            <ul className="space-y-2.5">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-green-500" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
              {plan.limitations?.map((limitation, i) => (
                <li key={`lim-${i}`} className="flex items-start gap-2.5 text-sm text-muted-foreground/70">
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs">✕</span>
                  </div>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
            
            <Button
              className={cn(
                'w-full mt-4 transition-all duration-300',
                plan.popular
                  ? 'bg-primary hover:bg-primary/90 shadow-sm'
                  : 'hover:bg-primary/10'
              )}
              variant={plan.popular ? 'default' : 'outline'}
              size="lg"
              disabled={currentPlan === plan.id || isLoading}
              onClick={() => onSelectPlan?.(plan.id, plan.priceId)}
            >
              {currentPlan === plan.id
                ? t('billing.currentPlan')
                : plan.price === 0
                  ? t('billing.startFree')
                  : t('billing.selectPlan')
              }
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
