import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Check,
  Zap,
  Users,
  BarChart3,
  Mic,
  Bot,
  FileText,
  type LucideIcon
} from 'lucide-react';
import { usePlanGate, PlanFeature } from '@/hooks/usePlanGate';
import { PLANS } from '@/config/plans';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: PlanFeature;
  featureName?: string;
}

/**
 * Plans shown in the upgrade modal — paid only, from PLANS config (single source of truth).
 * Does not include Free plan. Order: pro → business → enterprise.
 */
const UPGRADE_PLAN_IDS = ['pro', 'business', 'enterprise'] as const;

const featureIcons: Record<string, LucideIcon> = {
  ai: Bot,
  voice: Mic,
  documents: FileText,
  team: Users,
  advancedAnalytics: BarChart3,
};

const PLAN_POPULAR: Record<string, boolean> = {
  pro: false,
  business: true,
  enterprise: false,
};

export function UpgradeModal({ open, onClose, feature, featureName }: UpgradeModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentPlan, getUpgradeMessage } = usePlanGate();

  const handleSelectPlan = (planId: string) => {
    onClose();
    navigate('/app/plan', { state: { selectedPlan: planId } });
  };

  const upgradeMessage = feature ? getUpgradeMessage(feature) : '';
  const FeatureIcon = feature ? (featureIcons[feature] || Sparkles) : Sparkles;

  const upgradePlans = UPGRADE_PLAN_IDS
    .map((id) => PLANS.find((p) => p.id === id))
    .filter(Boolean) as typeof PLANS;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FeatureIcon className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {featureName ? t('upgrade.unlockFeature', { feature: featureName }) : t('upgrade.changePlan')}
              </DialogTitle>
              <DialogDescription>
                {upgradeMessage || t('upgrade.choosePlan')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 grid gap-4 md:grid-cols-3">
          {upgradePlans.map((plan) => {
            const isPopular = PLAN_POPULAR[plan.id] ?? false;
            const featureKeys: string[] = t(`upgrade.planFeatures.${plan.id}`, { returnObjects: true }) as string[];
            const featureLabels = Array.isArray(featureKeys) ? featureKeys : plan.features;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-4 transition-all ${
                  isPopular
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    {t('upgrade.mostPopular')}
                  </Badge>
                )}

                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.pricePLN}</span>
                    <span className="text-muted-foreground"> {t('landing.pricing.per_month_suffix')}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {featureLabels.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? (
                    t('upgrade.currentPlan')
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      {t('upgrade.select')}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            {t('upgrade.cancelAnytime')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
