import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ErrorStateProps {
  /** Short error headline shown to the user. */
  title: string;
  /** Optional description with more detail or resolution hint. */
  description?: string;
  /** Called when the user clicks the retry button. Omit to hide the button. */
  onRetry?: () => void;
  /** Label for the retry button — defaults to "Try again". */
  retryLabel?: string;
  className?: string;
}

/**
 * Inline error state component for content areas.
 *
 * Use this for recoverable API or data errors inside panels/sections.
 * Do NOT show `ErrorState` for form validation — use inline field errors instead.
 * Do NOT use `toast.error` for these; errors surface here so the user can retry.
 *
 * @example
 * <ErrorState
 *   title={t('errors.loadFailed')}
 *   description={t('errors.checkConnection')}
 *   onRetry={() => refetch()}
 * />
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 px-6 py-10 text-center',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="min-h-[44px] gap-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
