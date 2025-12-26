// import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  // Building2,
  Users,
  BarChart3,
  Mic,
  Bot,
  FileText,
  type LucideIcon
} from 'lucide-react';
import { usePlanGate, PlanFeature } from '@/hooks/usePlanGate';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: PlanFeature;
  featureName?: string;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    popular: false,
    features: [
      '15 projektów',
      '30 klientów',
      'Eksport Excel/CSV',
      'Szablony podstawowe',
      'Email wsparcie',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    popular: true,
    features: [
      'Nielimitowane projekty',
      'Nielimitowani klienci',
      'Asystent AI',
      'Wycena głosowa',
      'Foto-wycena AI',
      'OCR faktur',
      'Sync kalendarza',
      'Priorytetowe wsparcie',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    popular: false,
    features: [
      'Wszystko z Business',
      'API publiczne',
      'Niestandardowe szablony',
      'Zarządzanie zespołem',
      'Zaawansowana analityka',
      'Dedykowany opiekun',
      'SLA 99.9%',
    ],
  },
];

const featureIcons: Record<string, LucideIcon> = {
  ai: Bot,
  voice: Mic,
  documents: FileText,
  team: Users,
  advancedAnalytics: BarChart3,
};

export function UpgradeModal({ open, onClose, feature, featureName }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { currentPlan, getUpgradeMessage } = usePlanGate();

  const handleSelectPlan = (planId: string) => {
    onClose();
    navigate('/billing', { state: { selectedPlan: planId } });
  };

  const upgradeMessage = feature ? getUpgradeMessage(feature) : '';
  const FeatureIcon = feature ? (featureIcons[feature] || Sparkles) : Sparkles;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-white">
              <FeatureIcon className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {featureName ? `Odblokuj: ${featureName}` : 'Zmień plan'}
              </DialogTitle>
              <DialogDescription>
                {upgradeMessage || 'Wybierz plan, który najlepiej odpowiada Twoim potrzebom'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 p-4 transition-all ${
                plan.popular 
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-glow">
                  Najpopularniejszy
                </Badge>
              )}
              
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> zł/mies.</span>
                </div>
              </div>
              
              <ul className="space-y-2 mb-4">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? (
                  'Aktualny plan'
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Wybierz
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            Wszystkie plany zawierają 14-dniowy okres próbny. Możesz anulować w dowolnym momencie.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
