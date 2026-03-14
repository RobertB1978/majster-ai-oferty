import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
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
  Clock,
  Ban,
  Phone,
  MessageSquare,
  Printer,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import {
  fetchPublicOffer,
  acceptPublicOffer,
  recordOfferViewed,
  sendClientQuestion,
  type PublicOfferData,
  type PublicOfferPosition,
} from '@/lib/publicOfferApi';

export default function OfferPublicPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();

  const [offer, setOffer] = useState<PublicOfferData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Accept form
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [signature, setSignature] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Question form
  const [questionText, setQuestionText] = useState('');
  const [isSendingQuestion, setIsSendingQuestion] = useState(false);
  const [questionSent, setQuestionSent] = useState(false);

  const offerQuery = useQuery({
    queryKey: ['publicOffer', token],
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 1,
    queryFn: async () => {
      if (!token) throw new Error('missing_token');
      return fetchPublicOffer(token);
    },
  });

  useEffect(() => {
    if (!offerQuery.data || !token) return;

    setOffer(offerQuery.data);
    setError(null);
    if (offerQuery.data.client_name) setClientName(offerQuery.data.client_name);
    if (['accepted', 'approved'].includes(offerQuery.data.status)) setAccepted(true);
    void recordOfferViewed(token);
  }, [offerQuery.data, token]);

  useEffect(() => {
    if (offerQuery.isError) {
      setError(t('offerPublicPage.notFoundError'));
    }
  }, [offerQuery.isError, t]);

  const handleAccept = async () => {
    if (!token) return;
    if (!clientName.trim()) {
      toast.error(t('offerPublicPage.nameRequired'));
      return;
    }
    if (!signature) {
      toast.error(t('offerPublicPage.signatureRequired'));
      return;
    }

    setIsAccepting(true);
    try {
      await acceptPublicOffer(token, clientName.trim(), signature, clientEmail.trim() || undefined);
      toast.success(t('offerPublicPage.acceptSuccess'));
      setAccepted(true);
      setOffer((prev) =>
        prev ? { ...prev, status: 'accepted', accepted_at: new Date().toISOString(), accepted_via: 'web_button' } : null,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('offerPublicPage.acceptError'));
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSendQuestion = async () => {
    if (!token) return;
    if (!questionText.trim()) {
      toast.error(t('offerPublicPage.questionRequired'));
      return;
    }
    if (questionText.trim().length < 3) {
      toast.error(t('offerPublicPage.questionTooShort'));
      return;
    }

    setIsSendingQuestion(true);
    try {
      await sendClientQuestion(token, questionText.trim());
      toast.success(t('offerPublicPage.questionSentSuccess'));
      setQuestionSent(true);
      setQuestionText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('offerPublicPage.questionError'));
    } finally {
      setIsSendingQuestion(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────
  if (offerQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Error / Not Found ────────────────────────────────────────
  if (error || !offer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-xl font-bold mb-2">{t('offerPublicPage.notFoundTitle')}</h1>
            <p className="text-muted-foreground">{error ?? t('offerPublicPage.notFoundDesc')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Expired ─────────────────────────────────────────────────
  if (offer.status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Clock className="h-16 w-16 text-amber-500 mb-4" />
            <h1 className="text-xl font-bold mb-2">{t('offerPublicPage.expiredTitle')}</h1>
            <p className="text-muted-foreground">
              {offer.valid_until
                ? t('offerPublicPage.expiredDescDate', { date: new Date(offer.valid_until).toLocaleDateString() })
                : t('offerPublicPage.expiredDescNoDate')}
              {' '}{t('offerPublicPage.expiredContactHint')}
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

  // ─── Withdrawn ───────────────────────────────────────────────
  if (offer.status === 'withdrawn') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Ban className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-2">{t('offerPublicPage.withdrawnTitle')}</h1>
            <p className="text-muted-foreground">
              {t('offerPublicPage.withdrawnDesc')}
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

  const isOfferAccepted = accepted || ['accepted', 'approved'].includes(offer.status);
  const canAct = !isOfferAccepted && ['pending', 'sent', 'viewed'].includes(offer.status);
  const positions: PublicOfferPosition[] = Array.isArray(offer.quote?.positions) ? offer.quote.positions : [];
  const total = offer.quote?.total ?? 0;

  return (
    <>
      <Helmet>
        <title>{t('offerPublicPage.pageTitle')}</title>
        <meta name="description" content={t('offerPublicPage.metaDescription')} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* ─── Header ─────────────────────────────────────────── */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-1">{t('offerPublicPage.offerHeading')}</h1>
            <p className="text-muted-foreground text-sm">{t('offerPublicPage.offerSubtitle')}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-2 print:hidden"
              onClick={() => window.print()}
              aria-label={t('offerPublicPage.printAriaLabel')}
            >
              <Printer className="h-4 w-4" />
              {t('offerPublicPage.printButton')}
            </Button>
          </div>

          {/* ─── Accepted banner with celebration ───────────────── */}
          {isOfferAccepted && (
            <Card className={`border-green-500 bg-green-50 dark:bg-green-950/20 ${accepted ? 'animate-[celebration_0.6s_ease-in-out]' : ''}`}>
              <CardContent className="py-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className={`h-8 w-8 text-green-600 shrink-0 ${accepted ? 'animate-bounce' : ''}`} />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400 text-lg">
                      {accepted ? t('offerPublicPage.justAccepted') : t('offerPublicPage.acceptedBanner')}
                    </p>
                    {(offer.accepted_at ?? offer.approved_at) && (
                      <p className="text-sm text-green-600 dark:text-green-500">
                        {new Date(offer.accepted_at ?? offer.approved_at!).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Offer details ─────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                {t('offerPublicPage.detailsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('offerPublicPage.projectLabel')}</p>
                    <p className="font-medium">{offer.project?.project_name ?? t('offerPublicPage.noProjectName')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('offerPublicPage.issuedLabel')}</p>
                    <p className="font-medium">{new Date(offer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {offer.valid_until && (() => {
                  const daysLeft = Math.ceil(
                    (new Date(offer.valid_until).getTime() - Date.now()) / 86_400_000
                  );
                  const isUrgent = daysLeft >= 0 && daysLeft <= 3;
                  const isWarning = daysLeft > 3 && daysLeft <= 7;
                  return (
                    <div className="flex items-start gap-3">
                      <Clock className={`h-5 w-5 mt-0.5 shrink-0 ${isUrgent ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('offerPublicPage.validUntilLabel')}</p>
                        <p className={`font-medium ${isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : ''}`}>
                          {new Date(offer.valid_until).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Positions table */}
              {positions.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-3 text-sm">{t('offerPublicPage.scopeTitle')}</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3 font-medium">{t('offerPublicPage.colName')}</th>
                          <th className="text-right p-3 font-medium">{t('offerPublicPage.colQty')}</th>
                          <th className="text-right p-3 font-medium">{t('offerPublicPage.colPrice')}</th>
                          <th className="text-right p-3 font-medium">{t('offerPublicPage.colTotal')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos: PublicOfferPosition, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="p-3">{pos.name}</td>
                            <td className="text-right p-3 whitespace-nowrap">{pos.qty} {pos.unit}</td>
                            <td className="text-right p-3 whitespace-nowrap">{formatCurrency(pos.price)}</td>
                            <td className="text-right p-3 font-medium whitespace-nowrap">{formatCurrency(pos.qty * pos.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Total summary */}
              <div className="border-t pt-4 flex flex-col gap-1 items-end">
                <div className="flex justify-between w-full sm:w-auto sm:gap-12">
                  <span className="text-sm text-muted-foreground">{t('offerPublicPage.totalLabel')}</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('offerPublicPage.vatNote')}</p>
              </div>
            </CardContent>
          </Card>

          {/* ─── Acceptance form (only when actionable) ────────── */}
          {canAct && (
            <Card>
              <CardHeader>
                <CardTitle>{t('offerPublicPage.decisionTitle')}</CardTitle>
                <CardDescription>
                  {t('offerPublicPage.decisionDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="clientName">{t('offerPublicPage.fullNameLabel')}</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={t('offerPublicPage.fullNamePlaceholder')}
                      aria-required="true"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="clientEmail">{t('offerPublicPage.emailLabel')}</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="jan@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('offerPublicPage.signatureLabel')}</Label>
                  <p className="text-sm text-muted-foreground">{t('offerPublicPage.signatureHint')}</p>
                  <SignatureCanvas onSignatureChange={setSignature} />
                </div>

                <Button
                  onClick={handleAccept}
                  className="w-full min-h-[48px] text-base"
                  disabled={isAccepting}
                >
                  {isAccepting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  )}
                  {t('offerPublicPage.acceptButton')}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {t('offerPublicPage.acceptTermsNote')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ─── Question form ─────────────────────────────────── */}
          {!isOfferAccepted && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5" />
                  {t('offerPublicPage.questionTitle')}
                </CardTitle>
                <CardDescription>
                  {t('offerPublicPage.questionDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {questionSent ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 py-2">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{t('offerPublicPage.questionSentConfirm')}</p>
                  </div>
                ) : (
                  <>
                    <Textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder={t('offerPublicPage.questionPlaceholder')}
                      rows={4}
                      maxLength={2000}
                      aria-label={t('offerPublicPage.questionAriaLabel')}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {questionText.length}/2000
                      </span>
                      <Button
                        variant="outline"
                        onClick={handleSendQuestion}
                        disabled={isSendingQuestion || questionText.trim().length < 3}
                      >
                        {isSendingQuestion && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {t('offerPublicPage.sendQuestion')}
                      </Button>
                    </div>
                  </>
                )}
                {questionSent && !isOfferAccepted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuestionSent(false)}
                    className="text-muted-foreground"
                  >
                    {t('offerPublicPage.anotherQuestion')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Footer ───────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-1.5 pb-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-500" />
                {t('publicOffer.secureConnection')}
              </span>
              <span aria-hidden>·</span>
              <span>
                Powered by <span className="font-medium">Majster.AI</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
