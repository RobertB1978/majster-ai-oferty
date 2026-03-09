import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, XCircle, Clock, Ban, AlertTriangle, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OfferStatusBanner } from '@/components/offers/OfferStatusBanner';
import { OfferDetailsCard } from '@/components/offers/OfferDetailsCard';
import { OfferApprovalForm } from '@/components/offers/OfferApprovalForm';
import type { OfferData, OfferStatus } from '@/components/offers/offerApprovalTypes';

export default function OfferApproval() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const acceptToken = searchParams.get('t');

  const [offer, setOffer] = useState<OfferData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [comment, setComment] = useState('');
  const [rejectedReason, setRejectedReason] = useState('');
  const [signature, setSignature] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelCountdown, setCancelCountdown] = useState(0);

  const offerQuery = useQuery({
    queryKey: ['offerApprovalPublic', token],
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
    queryFn: async () => {
      if (!token) throw new Error('missing_token');
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
      return data as OfferData;
    },
  });

  useEffect(() => {
    if (!offerQuery.data) return;
    setOffer(offerQuery.data);
    setError(null);
    if (offerQuery.data.client_name) setClientName(offerQuery.data.client_name);
    if (offerQuery.data.client_email) setClientEmail(offerQuery.data.client_email);

    const finalStatuses: OfferStatus[] = ['approved', 'accepted', 'rejected', 'expired', 'withdrawn'];
    if (finalStatuses.includes(offerQuery.data.status as OfferStatus)) {
      setSubmitted(true);
    }
  }, [offerQuery.data]);

  useEffect(() => {
    if (offerQuery.isError) {
      setError(t('offerApproval.notFound.description'));
    }
  }, [offerQuery.isError, t]);

  // Handle 1-click accept via ?t= query param
  useEffect(() => {
    if (acceptToken && token && !offerQuery.isLoading && offer && offer.status === 'pending') {
      void handleOneClickAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptToken, token, offerQuery.isLoading, offer]);

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

  const callApproveEndpoint = async (body: Record<string, unknown>) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-offer`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || t('common.error'));
    return result;
  };

  const handleOneClickAccept = async () => {
    if (!token || !acceptToken) return;
    if (offer?.status === 'accepted' || offer?.status === 'approved') {
      setSubmitted(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await callApproveEndpoint({ token, acceptToken, action: 'approve', accepted_via: 'email_1click' });
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
    if (offer?.status === 'accepted' || offer?.status === 'approved') {
      setSubmitted(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await callApproveEndpoint({ token, action: 'approve', clientName, clientEmail, comment, signatureData: signature, accepted_via: 'web_button' });
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
    if (offer?.status === 'rejected') {
      setSubmitted(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await callApproveEndpoint({ token, action: 'reject', clientName, clientEmail, comment, rejected_reason: rejectedReason });
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
      await callApproveEndpoint({ token, action: 'cancel_accept' });
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
  if (offerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Error / Not Found ─────────────────────────────
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

  // ─── EXPIRED ──────────────────────────────────────
  if (status === 'expired') {
    const expiredDate = offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : null;
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
              <a href={`tel:${offer.company.phone}`} className="mt-6 inline-flex items-center gap-2 text-primary hover:underline font-medium">
                <Phone className="h-4 w-4" />
                {offer.company.phone}
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── WITHDRAWN ────────────────────────────────────
  if (status === 'withdrawn') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Ban className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-2">{t('offerApproval.withdrawn.title')}</h1>
            <p className="text-muted-foreground">{t('offerApproval.withdrawn.description')}</p>
            {offer.company?.phone && (
              <a href={`tel:${offer.company.phone}`} className="mt-6 inline-flex items-center gap-2 text-primary hover:underline font-medium">
                <Phone className="h-4 w-4" />
                {offer.company.phone}
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── 1-click accept in progress ───────────────────
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
            <p className="text-muted-foreground">{t('offerApproval.subtitle')}</p>
          </div>

          {/* Status banner */}
          {submitted && (
            <OfferStatusBanner
              isAccepted={isAccepted}
              acceptedAt={acceptedAt}
              acceptedVia={offer.accepted_via}
              cancelCountdown={cancelCountdown}
              isSubmitting={isSubmitting}
              onCancel={handleCancel}
            />
          )}

          {/* Offer details */}
          <OfferDetailsCard offer={offer} />

          {/* Contractor contact (post-acceptance) */}
          {isAccepted && offer.company && (
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="space-y-2 pt-6">
                <p className="font-semibold">{t('offerApproval.contractor.title')}</p>
                {offer.company.company_name && <p className="font-medium">{offer.company.company_name}</p>}
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
            <OfferApprovalForm
              clientName={clientName}
              setClientName={setClientName}
              clientEmail={clientEmail}
              setClientEmail={setClientEmail}
              comment={comment}
              setComment={setComment}
              rejectedReason={rejectedReason}
              setRejectedReason={setRejectedReason}
              setSignature={setSignature}
              contactEmail={offer.company?.contact_email}
              isSubmitting={isSubmitting}
              onApprove={handleApprove}
              onReject={handleReject}
            />
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
