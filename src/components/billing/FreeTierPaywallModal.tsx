/**
 * FreeTierPaywallModal — PR-06
 *
 * Shown when a free-plan user attempts to send/finalize a 4th offer in a month.
 *
 * Behavior:
 *  - Explains the monthly limit clearly
 *  - CTA "Przejdź do płatności" → /app/billing (placeholder until PR-20 Stripe)
 *  - History and CRM remain fully accessible (no data lock)
 *  - User can still create/edit drafts freely
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { FREE_TIER_OFFER_LIMIT } from '@/config/entitlements';

interface FreeTierPaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FreeTierPaywallModal({ open, onOpenChange }: FreeTierPaywallModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/app/billing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Lock className="h-5 w-5 text-destructive" />
            </div>
            <Badge variant="destructive" className="text-xs">
              {t('paywall.freePlan')}
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            {t('paywall.title', { limit: FREE_TIER_OFFER_LIMIT })}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {t('paywall.description', { limit: FREE_TIER_OFFER_LIMIT })}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 space-y-2 rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm font-medium">{t('paywall.retentionTitle')}</p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              {t('paywall.retentionCrm')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              {t('paywall.retentionHistory')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              {t('paywall.retentionDrafts')}
            </li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('paywall.billingComingSoon')}
        </p>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('paywall.close')}
          </Button>
          <Button onClick={handleUpgrade} className="gap-2">
            {t('paywall.upgrade')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
