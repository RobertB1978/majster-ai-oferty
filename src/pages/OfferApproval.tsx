import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SignatureCanvas } from '@/components/offers/SignatureCanvas';
import {
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  Building,
  Calendar,
  DollarSign,
  AlertTriangle,
  Download,
  Phone,
  Mail,
  Clock,
  Ban,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

interface QuotePosition {
  name: string;
  qty: number;
  unit: string;
  price: number;
}

type OfferStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'expired'
  | 'withdrawn';

interface OfferData {
  id: string;
  status: OfferStatus;
  client_name: string | null;
  client_email: string | null;
  created_at: string;
  accepted_at?: string | null;
  approved_at?: string | null;
  valid_until?: string | null;
  withdrawn_at?: string | null;
  accepted_via?: string | null;
  project: {
    project_name: string;
    status: string;
  } | null;
  quote: {
    total: number;
    positions: QuotePosition[];
  } | null;
  company?: {
    company_name: string | null;
    owner_name: string | null;
    phone: string | null;
    contact_email?: string | null;
  } | null;
}

/** Returns true when the current time is within 600 seconds of the accepted_at timestamp */
function canCancel(acceptedAt: string | null | undefined): boolean {
  if (!acceptedAt) return false;
  const diffMs = Date.now() - new Date(acceptedAt).getTime();
  return diffMs < 600_000;
}

export default function OfferApproval() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const acceptToken = searchParams.get('t');

  const [offer, setOffer] = useState<OfferData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [comment, setComment] = useState('');
  const [rejectedReason, setRejectedReason] = useState('');
  const [signature, setSignature] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelCountdown, setCancelCountdown] = useState(0);

  const fetchOffer = useCallback(async () => {
    if (!token) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('offer_approvals')
        .select(`
          *,
          project:projects(project_name, status),
          quote:quotes(total, positions)
        `)
        .eq('public_token', token)
        .single();

      if (fetchError) throw fetchError;

      setOffer(data as OfferData);
      if (data.client_name) setClientName(data.client_name);
      if (data.client_email) setClientEmail(data.client_email);

      const finalStatuses: OfferStatus[] = ['approved', 'accepted', 'rejected', 'expired', 'withdrawn'];
      if (finalStatuses.includes(data.status as OfferStatus)) {
        setSubmitted(true);
      }
    } catch {
      setError(t('offerApproval.notFound.description'));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

  // Handle 1-click accept via ?t= query param
  useEffect(() => {
    if (acceptToken && token && !isLoading && offer && offer.status === 'pending') {
      handleOneClickAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptToken, token, isLoading, offer]);

  useEffect(() => {
    fetchOffer();
  }, [fetchOffer]);

  // Countdown timer for cancel window
  useEffect(() => {
    if (!submitted) return;
    const acceptedAt = offer?.accepted_at ?? offer?.approved_at;
    if (!acceptedAt) return;

    const update = () => {
      const diffMs = Date.now() - new Date(acceptedAt).getTime();
      const remaining = Math.max(0, Math.ceil((600_000 - diffMs) / 1000));
      setCancelCountdown(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [submitted, offer]);

  const handleOneClickAccept = async () => {
    if (!token || !acceptToken) return;

    // Idempotency — already accepted
    if (offer?.status === 'accepted' || offer?.status === 'approved') {
      setSubmitted(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-offer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            acceptToken,
            action: 'approve',
            accepted_via: 'email_1click',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('offerApproval.errors.approvalFailed'));
      }

      toast.success(t('offerApproval.success.approved'));
      setSubmitted(true);
      setOffer((prev) => prev ? { ...prev, status: 'accepted', accepted_via: 'email_1click', accepted_at: new Date().toISOString() } : null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!clientName.trim()) {
      toast.error(t('offerApproval.errors.nameRequired'));
      return;
    }
    if (!signature) {
      toast.error(t('offerApproval.errors.signatureRequired'));
      return;
    }

    // Idempotency
    if (offer?.status === 'accepted' || offer?.status === 'approved') {
      setSubmitted(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-offer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            action: 'approve',
            clientName,
            clientEmail,
            comment,
            signatureData: signature,
            accepted_via: 'web_button',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('offerApproval.errors.approvalFailed'));
      }

      toast.success(t('offerApproval.success.approved'));
      setSubmitted(true);
      setOffer((prev) => prev ? { ...prev, status: 'accepted', accepted_via: 'web_button', accepted_at: new Date().toISOString() } : null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    // Idempotency
    if (offer?.status === 'rejected') {
      setSubmitted(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-offer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            action: 'reject',
            clientName,
            clientEmail,
            comment,
            rejected_reason: rejectedReason,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('offerApproval.errors.rejectionFailed'));
      }

      toast.success(t('offerApproval.success.rejected'));
      setSubmitted(true);
      setOffer((prev) => prev ? { ...prev, status: 'rejected' } : null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-offer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'cancel_accept' }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('offerApproval.errors.cancelFailed'));
      }

      toast.success(t('offerApproval.success.canceledWithNotification'));
      setSubmitted(false);
      setOffer((prev) => prev ? { ...prev, status: 'pending', accepted_at: null } : null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Error / Not Found ──────────────────────────────
  if (error || !offer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center py-12">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-xl font-bold mb-2">{t('offerApproval.notFound.title')}</h1>
            <p className="text-muted-foreground text-center">
              {error ?? t('offerApproval.notFound.description')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = offer.status;

  // ─── EXPIRED ───────────────────────────────────────
  if (status === 'expired') {
    const expiredDate = offer.valid_until
      ? new Date(offer.valid_until).toLocaleDateString()
      : null;
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Clock className="h-16 w-16 text-amber-500 mb-4" />
            <h1 className="text-xl font-bold mb-2">{t('offerApproval.expired.title')}</h1>
            <p className="text-muted-foreground">
              {expiredDate
                ? t('offerApproval.expired.expiredOnDate', { date: expiredDate })
                : t('offerApproval.expired.alreadyExpired')}
              {' '}{t('offerApproval.expired.contactContractor')}
            </p>
            {offer.company?.phone && (
              <a
                href={`tel:${offer.company.phone}`}
                className="mt-6 inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <Phone className="h-4 w-4" />
                {offer.company.phone}
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── WITHDRAWN ─────────────────────────────────────
  if (status === 'withdrawn') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Ban className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-2">{t('offerApproval.withdrawn.title')}</h1>
            <p className="text-muted-foreground">
              {t('offerApproval.withdrawn.description')}
            </p>
            {offer.company?.phone && (
              <a
                href={`tel:${offer.company.phone}`}
                className="mt-6 inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <Phone className="h-4 w-4" />
                {offer.company.phone}
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── 1-click accept in progress ────────────────────
  if (isSubmitting && acceptToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">{t('offerApproval.states.accepting')}</p>
      </div>
    );
  }

  const isAccepted = status === 'accepted' || status === 'approved';
  const isRejected = status === 'rejected';
  const acceptedAt = offer.accepted_at ?? offer.approved_at;

  return (
    <>
      <Helmet>
        <title>{t('offerApproval.pageTitle')} | Majster.AI</title>
        <meta name="description" content={t('offerApproval.pageDescription')} />
      </Helmet>

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">{t('offerApproval.title')}</h1>
            <p className="text-muted-foreground">
              {t('offerApproval.subtitle')}
            </p>
          </div>

          {/* Status banner */}
          {submitted && (
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
                        {new Date(acceptedAt).toLocaleString()}
                        {offer.accepted_via === 'email_1click' && ' (1-klik email)'}
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
                      onClick={handleCancel}
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
          )}

          {/* Offer details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('offerApproval.details.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('offerApproval.details.project')}</p>
                    <p className="font-medium">{offer.project?.project_name ?? t('offerApproval.details.noName')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('offerApproval.details.date')}</p>
                    <p className="font-medium">{new Date(offer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {offer.valid_until && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('offerApproval.details.validUntil')}</p>
                      <p className="font-medium">{new Date(offer.valid_until).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 md:col-span-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('offerApproval.details.value')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {offer.quote ? formatCurrency(offer.quote.total) : t('offerApproval.details.noQuote')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote line items */}
              {offer.quote && Array.isArray(offer.quote.positions) && offer.quote.positions.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">{t('offerApproval.positions.title')}</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">{t('offerApproval.positions.item')}</th>
                          <th className="text-right p-3">{t('offerApproval.positions.quantity')}</th>
                          <th className="text-right p-3">{t('offerApproval.positions.price')}</th>
                          <th className="text-right p-3">{t('offerApproval.positions.value')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offer.quote.positions.map((pos: QuotePosition, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="p-3">{pos.name}</td>
                            <td className="text-right p-3">{pos.qty} {pos.unit}</td>
                            <td className="text-right p-3">{formatCurrency(pos.price)}</td>
                            <td className="text-right p-3 font-medium">{formatCurrency(pos.qty * pos.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PDF download */}
              <div className="pt-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('offerApproval.actions.downloadPdf')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contractor contact (post-acceptance) */}
          {isAccepted && offer.company && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-lg">{t('offerApproval.contractor.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {offer.company.company_name && (
                  <p className="font-medium">{offer.company.company_name}</p>
                )}
                {offer.company.phone && (
                  <a href={`tel:${offer.company.phone}`} className="flex items-center gap-2 text-primary hover:underline text-sm">
                    <Phone className="h-4 w-4" />
                    {offer.company.phone}
                  </a>
                )}
                {offer.company.contact_email && (
                  <a href={`mailto:${offer.company.contact_email}`} className="flex items-center gap-2 text-primary hover:underline text-sm">
                    <Mail className="h-4 w-4" />
                    {offer.company.contact_email}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Approval form — only when pending/sent/viewed */}
          {!submitted && ['pending', 'sent', 'viewed'].includes(status) && (
            <Card>
              <CardHeader>
                <CardTitle>{t('offerApproval.form.title')}</CardTitle>
                <CardDescription>
                  {t('offerApproval.form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>{t('offerApproval.form.name')} *</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Jan Kowalski"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <Label>{t('auth.email', 'Email')}</Label>
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="jan@example.com"
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
                    onClick={handleApprove}
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
                    onClick={handleReject}
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
                {offer.company?.contact_email && (
                  <div className="text-center text-sm text-muted-foreground">
                    {t('offerApproval.form.questionPrefix')}{' '}
                    <a
                      href={`mailto:${offer.company.contact_email}?subject=Pytanie dot. oferty`}
                      className="text-primary hover:underline"
                    >
                      {t('offerApproval.form.contactLink')}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Idempotency: already processed — read-only view */}
          {submitted && !isAccepted && isRejected && (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm">{t('offerApproval.readonly.alreadyRejected')}</p>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Powered by Majster.AI</p>
          </div>
        </div>
      </div>
    </>
  );
}
