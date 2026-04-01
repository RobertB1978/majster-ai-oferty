import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SignatureCanvas } from '@/components/offers/SignatureCanvas';

interface OfferApprovalFormProps {
  clientName: string;
  setClientName: (v: string) => void;
  clientEmail: string;
  setClientEmail: (v: string) => void;
  comment: string;
  setComment: (v: string) => void;
  rejectedReason: string;
  setRejectedReason: (v: string) => void;
  setSignature: (v: string) => void;
  contactEmail: string | null | undefined;
  isSubmitting: boolean;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}

export function OfferApprovalForm({
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
  comment,
  setComment,
  rejectedReason,
  setRejectedReason,
  setSignature,
  contactEmail,
  isSubmitting,
  onApprove,
  onReject,
}: OfferApprovalFormProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('offerApproval.form.title')}</CardTitle>
        <CardDescription>{t('offerApproval.form.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>{t('offerApproval.form.name')} *</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t('offerApproval.form.namePlaceholder')}
              aria-required="true"
            />
          </div>
          <div>
            <Label>{t('auth.email')}</Label>
            <Input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder={t('offerApproval.form.emailPlaceholder')}
            />
          </div>
        </div>

        <div>
          <Label>{t('offerApproval.form.comment')}</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('offerApproval.form.commentPlaceholder')}
            rows={3}
          />
        </div>

        <div>
          <Label>{t('offerApproval.form.signature')} *</Label>
          <p className="text-sm text-muted-foreground mb-2">
            {t('offerApproval.form.signatureHint')}
          </p>
          <SignatureCanvas onSignatureChange={setSignature} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onApprove}
            className="flex-1 min-h-[48px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {t('offerApproval.form.approve')}
          </Button>
          <Button
            variant="outline"
            onClick={onReject}
            disabled={isSubmitting}
            className="min-h-[48px]"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {t('offerApproval.form.reject')}
          </Button>
        </div>

        {/* Reject reason */}
        <div className="border-t pt-4">
          <details>
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              {t('offerApproval.form.rejectReasonToggle')}
            </summary>
            <div className="mt-3">
              <Textarea
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
                placeholder={t('offerApproval.form.rejectReasonPlaceholder')}
                rows={2}
              />
            </div>
          </details>
        </div>

        {/* Question link */}
        {contactEmail && (
          <div className="text-center text-sm text-muted-foreground">
            {t('offerApproval.form.questionPrefix')}{' '}
            <a
              href={`mailto:${contactEmail}?subject=Pytanie dot. oferty`}
              className="text-primary hover:underline"
            >
              {t('offerApproval.form.contactLink')}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
