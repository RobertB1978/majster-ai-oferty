import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /**
   * Label for the call-to-action button.
   * Preferred API: pass `ctaLabel` + `onCta`.
   */
  ctaLabel?: string;
  /** Handler for the call-to-action button. */
  onCta?: () => void;
  /**
   * Legacy action prop (still supported for backward compatibility).
   * Prefer `ctaLabel` + `onCta`.
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state placeholder used when a list or section has no content.
 *
 * Always include a CTA (`ctaLabel` + `onCta`) when the user can take an action
 * to resolve the empty state (e.g. "Create your first offer").
 *
 * @example
 * <EmptyState
 *   icon={FileText}
 *   title={t('offers.empty.title')}
 *   description={t('offers.empty.desc')}
 *   ctaLabel={t('offers.empty.cta')}
 *   onCta={() => navigate('/app/offers/new')}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
  action,
  className,
}: EmptyStateProps) {
  // Support both the new ctaLabel/onCta API and the legacy action prop.
  const resolvedLabel = ctaLabel ?? action?.label;
  const resolvedHandler = onCta ?? action?.onClick;
  const hasCta = Boolean(resolvedLabel && resolvedHandler);

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
      role="status"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {hasCta && (
        <Button
          onClick={resolvedHandler}
          className="min-h-[44px] min-w-[44px]"
        >
          {resolvedLabel}
        </Button>
      )}
    </div>
  );
}
