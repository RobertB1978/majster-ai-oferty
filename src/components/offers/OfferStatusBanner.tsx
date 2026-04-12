import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { canCancel } from './offerApprovalTypes';
import { formatDateTime } from '@/lib/formatters';

interface OfferStatusBannerProps {
  isAccepted: boolean;
  acceptedAt: string | null | undefined;
  acceptedVia: string | null | undefined;
  cancelCountdown: number;
  isSubmitting: boolean;
  onCancel: () => Promise<void>;
}

export function OfferStatusBanner({
  isAccepted,
  acceptedAt,
  acceptedVia,
  cancelCountdown,
  isSubmitting,
  onCancel,
}: OfferStatusBannerProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={
        isAccepted
          ? 'border-success bg-success/5 dark:bg-success/10'
          : 'border-destructive bg-destructive/5 dark:bg-destructive/10'
      }
    >
      <CardContent className="py-6">
        <div className="flex items-center gap-3">
          {isAccepted ? (
            <CheckCircle className="h-8 w-8 text-success shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-destructive shrink-0" />
          )}
          <div>
            <p className={`font-semibold ${isAccepted ? 'text-success' : 'text-destructive'}`}>
              {isAccepted
                ? t('offerApproval.status.approved')
                : t('offerApproval.status.rejected')}
            </p>
            {acceptedAt && isAccepted && (
              <p className="text-sm text-success/80">
                {formatDateTime(acceptedAt)}
                {acceptedVia === 'email_1click' && ' (1-klik email)'}
              </p>
            )}
          </div>
        </div>

        {/* 10-minute cancel window */}
        {isAccepted && canCancel(acceptedAt) && (
          <div className="mt-4 pt-4 border-t border-success/20 dark:border-success/30">
            <p className="text-sm text-success mb-2">
              {t('offerApproval.cancelWindow.timeLeft', { seconds: cancelCountdown })}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="border-success/40 text-success hover:bg-success/10"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('offerApproval.cancelWindow.buttonLabel')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
