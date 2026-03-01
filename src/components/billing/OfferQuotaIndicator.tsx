/**
 * OfferQuotaIndicator — PR-06
 *
 * Shows the free-plan user's monthly offer quota usage inline.
 * e.g. "1/3 ofert w tym miesiącu"
 *
 * - Green: 0–1 used
 * - Orange: 2 used
 * - Red: 3/3 (limit reached)
 *
 * For paid plan users this component renders nothing.
 */

import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFreeTierOfferQuota } from '@/hooks/useFreeTierOfferQuota';
import { FREE_TIER_OFFER_LIMIT } from '@/config/entitlements';

interface OfferQuotaIndicatorProps {
  className?: string;
}

export function OfferQuotaIndicator({ className }: OfferQuotaIndicatorProps) {
  const { t } = useTranslation();
  const { used, plan, isLoading } = useFreeTierOfferQuota();

  // Only show for free plan
  if (plan !== 'free') return null;
  if (isLoading) return null;

  const limit = FREE_TIER_OFFER_LIMIT;
  const isAtLimit = used >= limit;
  const isNearLimit = used === limit - 1;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium',
        isAtLimit
          ? 'bg-destructive/10 text-destructive'
          : isNearLimit
            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
            : 'bg-muted text-muted-foreground',
        className
      )}
      aria-label={t('offerQuota.ariaLabel', { used, limit })}
    >
      {isAtLimit ? (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>
        {t('offerQuota.badge', { used, limit })}
      </span>
    </div>
  );
}
