import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { canCancel } from './offerApprovalTypes';

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
  const { t, i18n } = useTranslation();

  return (
    <Card
      className={
        isAccepted
          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
          : 'border-red-500 bg-red-50 dark:bg-red-950/20'
      }
    >
      <CardContent className="py-6">
        <div className="flex items-center gap-3">
          {isAccepted ? (
            <CheckCircle className="h-8 w-8 text-green-600 shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600 shrink-0" />
          )}
          <div>
            <p className={`font-semibold ${isAccepted ? 'text-green-700' : 'text-red-700'}`}>
              {isAccepted
                ? t('offerApproval.status.approved')
                : t('offerApproval.status.rejected')}
            </p>
            {acceptedAt && isAccepted && (
              <p className="text-sm text-green-600">
                {new Date(acceptedAt).toLocaleString(i18n.language)}
                {acceptedVia === 'email_1click' && ' (1-klik email)'}
              </p>
            )}
          </div>
        </div>

        {/* 10-minute cancel window */}
        {isAccepted && canCancel(acceptedAt) && (
          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-400 mb-2">
              {t('offerApproval.cancelWindow.timeLeft', { seconds: cancelCountdown })}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="border-green-400 text-green-700 hover:bg-green-100 dark:text-green-400"
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
