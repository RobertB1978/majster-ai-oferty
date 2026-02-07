import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  DollarSign
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

interface OfferData {
  id: string;
  status: string;
  client_name: string | null;
  client_email: string | null;
  created_at: string;
  project: {
    project_name: string;
    status: string;
  } | null;
  quote: {
    total: number;
    positions: QuotePosition[];
  } | null;
}

export default function OfferApproval() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<OfferData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [comment, setComment] = useState('');
  const [signature, setSignature] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!token) return;

      try {
        const { data, error } = await supabase
          .from('offer_approvals')
          .select(`
            *,
            project:projects(project_name, status),
            quote:quotes(total, positions)
          `)
          .eq('public_token', token)
          .single();

        if (error) throw error;

        setOffer(data as OfferData);
        if (data.client_name) setClientName(data.client_name);
        if (data.client_email) setClientEmail(data.client_email);
        if (data.status !== 'pending') setSubmitted(true);
      } catch (error) {
        console.error('Error fetching offer:', error);
        toast.error(t('offerApproval.errors.notFound'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffer();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() is a stable i18next reference; only re-fetch when token changes
  }, [token]);

  const handleApprove = async () => {
    if (!clientName.trim()) {
      toast.error(t('offerApproval.errors.nameRequired'));
      return;
    }
    if (!signature) {
      toast.error(t('offerApproval.errors.signatureRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          action: 'approve',
          clientName,
          clientEmail,
          comment,
          signatureData: signature,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || t('offerApproval.errors.approvalFailed'));
      }

      toast.success(t('offerApproval.success.approved'));
      setSubmitted(true);
      setOffer((prev) => prev ? { ...prev, status: 'approved' } : null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          action: 'reject',
          clientName,
          clientEmail,
          comment,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || t('offerApproval.errors.rejectionFailed'));
      }

      toast.success(t('offerApproval.success.rejected'));
      setSubmitted(true);
      setOffer((prev) => prev ? { ...prev, status: 'rejected' } : null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center py-12">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-xl font-bold mb-2">{t('offerApproval.notFound.title')}</h1>
            <p className="text-muted-foreground text-center">
              {t('offerApproval.notFound.description')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('offerApproval.pageTitle')}</title>
        <meta name="description" content={t('offerApproval.pageDescription')} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">{t('offerApproval.title')}</h1>
            <p className="text-muted-foreground">
              {t('offerApproval.subtitle')}
            </p>
          </div>

          {/* Status badge */}
          {submitted && (
            <Card className={offer.status === 'approved' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}>
              <CardContent className="flex items-center justify-center gap-3 py-6">
                {offer.status === 'approved' ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700">{t('offerApproval.status.approved')}</p>
                      <p className="text-sm text-green-600">{t('offerApproval.status.approvedThanks')}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-700">{t('offerApproval.status.rejected')}</p>
                      <p className="text-sm text-red-600">{t('offerApproval.status.rejectedInfo')}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Project details */}
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
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('offerApproval.details.project')}</p>
                    <p className="font-medium">{offer.project?.project_name || t('offerApproval.details.noName')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('offerApproval.details.date')}</p>
                    <p className="font-medium">{new Date(offer.created_at).toLocaleDateString('pl-PL')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('offerApproval.details.value')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {offer.quote ? formatCurrency(offer.quote.total) : t('offerApproval.details.noQuote')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote positions */}
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
                            <td className="text-right p-3 font-medium">
                              {formatCurrency(pos.qty * pos.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval form */}
          {!submitted && (
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
                    />
                  </div>
                  <div>
                    <Label>{t('auth.email')}</Label>
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

                <div className="flex gap-4">
                  <Button
                    onClick={handleApprove}
                    className="flex-1"
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
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('offerApproval.form.reject')}
                  </Button>
                </div>
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
