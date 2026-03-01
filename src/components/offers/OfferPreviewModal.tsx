/**
 * OfferPreviewModal — PR-11
 *
 * Full-screen modal showing an HTML preview of a DRAFT offer + action buttons:
 *   - Download PDF (generate via jsPDF)
 *   - Send to client (quota check → SENT status → email best-effort)
 *   - Back to Edit
 *
 * Works with FF_NEW_SHELL ON/OFF (no shell-specific code).
 * Quota gating via useFreeTierOfferQuota + FreeTierPaywallModal (PR-06).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Download,
  Send,
  Loader2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFreeTierOfferQuota } from '@/hooks/useFreeTierOfferQuota';
import { FreeTierPaywallModal } from '@/components/billing/FreeTierPaywallModal';
import { useSendOffer } from '@/hooks/useSendOffer';
import { buildOfferPdfPayloadFromOffer } from '@/lib/offerPdfPayloadBuilder';
import { generateOfferPdf } from '@/lib/offerPdfGenerator';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OfferPreviewModalProps {
  open: boolean;
  onClose: () => void;
  offerId: string;
  onSent?: () => void;
}

interface OfferPreviewData {
  id: string;
  title: string | null;
  status: string;
  currency: string;
  total_net: number | null;
  total_vat: number | null;
  total_gross: number | null;
  created_at: string;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  items: Array<{
    id: string;
    name: string;
    unit: string | null;
    qty: number;
    unit_price_net: number;
    vat_rate: number | null;
    line_total_net: number;
  }>;
  company: {
    company_name: string;
    nip: string | null;
    street: string | null;
    postal_code: string | null;
    city: string | null;
    phone: string | null;
    email_for_offers: string | null;
    logo_url: string | null;
  } | null;
}

// ── Data fetcher ──────────────────────────────────────────────────────────────

function useOfferPreviewData(offerId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['offerPreview', offerId],
    queryFn: async (): Promise<OfferPreviewData> => {
      // Load offer
      const { data: offer, error: offerErr } = await supabase
        .from('offers')
        .select('id, title, status, currency, total_net, total_vat, total_gross, client_id, created_at')
        .eq('id', offerId)
        .single();
      if (offerErr) throw offerErr;

      // Load items
      const { data: itemsData, error: itemsErr } = await supabase
        .from('offer_items')
        .select('id, name, unit, qty, unit_price_net, vat_rate, line_total_net')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true });
      if (itemsErr) throw itemsErr;

      // Load client
      let client: OfferPreviewData['client'] = null;
      if (offer.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('name, email, phone, address')
          .eq('id', offer.client_id)
          .maybeSingle();
        if (clientData) {
          client = clientData as OfferPreviewData['client'];
        }
      }

      // Load company profile
      let company: OfferPreviewData['company'] = null;
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('company_name, nip, street, postal_code, city, phone, email_for_offers, logo_url')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profileData) {
          company = profileData as OfferPreviewData['company'];
        }
      }

      return {
        id: offer.id as string,
        title: offer.title as string | null,
        status: offer.status as string,
        currency: (offer.currency as string) ?? 'PLN',
        total_net: offer.total_net as number | null,
        total_vat: offer.total_vat as number | null,
        total_gross: offer.total_gross as number | null,
        created_at: offer.created_at as string,
        client,
        items: (itemsData ?? []) as OfferPreviewData['items'],
        company,
      };
    },
    enabled: !!offerId && !!user,
    staleTime: 0,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: number, currency = 'PLN'): string {
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val) + ` ${currency}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL');
}

function validUntilDate(issuedIso: string): string {
  const d = new Date(issuedIso);
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('pl-PL');
}

function docId(offerId: string, issuedIso: string): string {
  const year = new Date(issuedIso).getFullYear();
  const suffix = offerId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `OF/${year}/${suffix}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OfferPreviewModal({ open, onClose, offerId, onSent }: OfferPreviewModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data, isLoading, isError } = useOfferPreviewData(offerId);
  const offerQuota = useFreeTierOfferQuota();
  const sendOffer = useSendOffer();

  const [showPaywall, setShowPaywall] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sentPdfUrl, setSentPdfUrl] = useState<string | null>(null);

  const isSent = data?.status === 'SENT';

  // ── PDF download ───────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!user || !data) return;
    setIsPdfGenerating(true);
    try {
      const payload = await buildOfferPdfPayloadFromOffer(offerId, user.id);
      const pdfBlob = await generateOfferPdf(payload);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `oferta-${offerId.slice(0, 8)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('offerPreview.pdfDownloaded'));
    } catch {
      toast.error(t('offerPreview.pdfError'));
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!data) return;

    // Quota gate (PR-06)
    if (!offerQuota.canSend && !isSent) {
      setShowPaywall(true);
      return;
    }

    const clientEmail = data.client?.email ?? undefined;

    sendOffer.mutate(
      { offerId, clientEmail },
      {
        onSuccess: (result) => {
          setSentPdfUrl(result.pdfUrl);
          if (result.alreadySent) {
            toast.info(t('offerPreview.alreadySent'));
          } else {
            toast.success(t('offerPreview.sentSuccess'));
            if (result.emailSent) {
              toast.info(t('offerPreview.emailSentInfo'));
            } else if (clientEmail) {
              toast.info(t('offerPreview.emailNotSent'));
            }
          }
          onSent?.();
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
  };

  // ── Copy share link ────────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/app/offers/${offerId}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    toast.success(t('offerPreview.linkCopied'));
    setTimeout(() => setLinkCopied(false), 2500);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <FreeTierPaywallModal open={showPaywall} onOpenChange={setShowPaywall} />

      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base font-semibold">
                {t('offerPreview.title')}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {data && (
                  <Badge variant={isSent ? 'default' : 'secondary'}>
                    {isSent ? t('offerPreview.statusBadgeSent') : t('offerPreview.statusBadgeDraft')}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="px-6 pb-6">
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">{t('offerPreview.loading')}</span>
              </div>
            )}

            {isError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('offerPreview.loadError')}</AlertDescription>
              </Alert>
            )}

            {data && (
              <>
                {/* Quota warning for free plan */}
                {!isSent && offerQuota.plan === 'free' && !offerQuota.isLoading && (
                  <Alert className={`mt-4 ${!offerQuota.canSend ? 'border-destructive/50 bg-destructive/10' : 'border-amber-300 bg-amber-50 dark:bg-amber-900/20'}`}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {offerQuota.canSend
                        ? t('offerPreview.quotaWarning', {
                            used: offerQuota.used,
                            limit: offerQuota.limit,
                          })
                        : t('offerPreview.quotaBlocked')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* ── A4 preview ───────────────────────────────────────────── */}
                <div className="mt-4 bg-white text-black rounded-lg border shadow-sm overflow-hidden">
                  <div className="p-8" style={{ minHeight: '500px' }}>

                    {/* Header: Company info + Offer ID */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
                      <div>
                        {data.company?.logo_url && (
                          <img
                            src={data.company.logo_url}
                            alt="Logo"
                            className="h-12 mb-2 object-contain"
                          />
                        )}
                        <h2 className="text-xl font-bold text-gray-900">
                          {data.company?.company_name || '—'}
                        </h2>
                        {data.company?.nip && (
                          <p className="text-sm text-gray-600">NIP: {data.company.nip}</p>
                        )}
                        {(data.company?.street || data.company?.city) && (
                          <p className="text-sm text-gray-600">
                            {[data.company.street, data.company.postal_code, data.company.city]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                        {data.company?.phone && (
                          <p className="text-sm text-gray-600">Tel: {data.company.phone}</p>
                        )}
                        {data.company?.email_for_offers && (
                          <p className="text-sm text-gray-600">{data.company.email_for_offers}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <h3 className="text-lg font-bold text-gray-800">
                          {data.title || t('offerPreview.title')}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('offerPreview.offerNumber')}: {docId(data.id, data.created_at)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('offerPreview.issuedAt')}: {formatDate(data.created_at)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('offerPreview.validUntil')}: {validUntilDate(data.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Client section */}
                    {data.client ? (
                      <div className="mb-6">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {t('offerPreview.client')}
                        </h4>
                        <p className="font-semibold text-gray-900">{data.client.name}</p>
                        {data.client.address && (
                          <p className="text-sm text-gray-600">{data.client.address}</p>
                        )}
                        {data.client.phone && (
                          <p className="text-sm text-gray-600">Tel: {data.client.phone}</p>
                        )}
                        {data.client.email && (
                          <p className="text-sm text-gray-600">{data.client.email}</p>
                        )}
                      </div>
                    ) : (
                      <div className="mb-6">
                        <p className="text-sm text-gray-400 italic">{t('offerPreview.noClient')}</p>
                      </div>
                    )}

                    {/* Items table */}
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {t('offerPreview.items')}
                      </h4>

                      {data.items.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">{t('offerPreview.noItems')}</p>
                      ) : (
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                                {t('offerPreview.itemName')}
                              </th>
                              <th className="border border-gray-200 px-3 py-2 text-right font-medium text-gray-700 w-16">
                                {t('offerPreview.itemQty')}
                              </th>
                              <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 w-16">
                                {t('offerPreview.itemUnit')}
                              </th>
                              <th className="border border-gray-200 px-3 py-2 text-right font-medium text-gray-700 w-28">
                                {t('offerPreview.itemUnitPrice')}
                              </th>
                              <th className="border border-gray-200 px-3 py-2 text-right font-medium text-gray-700 w-20">
                                {t('offerPreview.itemVat')}
                              </th>
                              <th className="border border-gray-200 px-3 py-2 text-right font-medium text-gray-700 w-28">
                                {t('offerPreview.itemTotal')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.items.map((item, idx) => (
                              <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="border border-gray-200 px-3 py-2 text-gray-900">
                                  {item.name}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-right text-gray-700">
                                  {Number(item.qty)}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-center text-gray-700">
                                  {item.unit || '—'}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-right text-gray-700">
                                  {fmt(Number(item.unit_price_net), data.currency)}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-right text-gray-700">
                                  {item.vat_rate !== null ? `${item.vat_rate}%` : '—'}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-right font-medium text-gray-900">
                                  {fmt(Number(item.line_total_net), data.currency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="ml-auto max-w-xs space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('offerPreview.totalsNet')}</span>
                        <span className="font-medium">{fmt(data.total_net ?? 0, data.currency)}</span>
                      </div>
                      {data.total_vat !== null && data.total_vat !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('offerPreview.totalsVat')}</span>
                          <span>{fmt(data.total_vat ?? 0, data.currency)}</span>
                        </div>
                      )}
                      {(data.total_vat === null || data.total_vat === 0) && (
                        <p className="text-xs text-gray-400 italic">{t('offerPreview.vatExempt')}</p>
                      )}
                      <div className="flex justify-between border-t border-gray-300 pt-1 font-bold text-base">
                        <span>{t('offerPreview.totalsGross')}</span>
                        <span>{fmt(data.total_gross ?? data.total_net ?? 0, data.currency)}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                      <p>{t('offerPreview.validDays')}</p>
                    </div>
                  </div>
                </div>

                {/* Share link section (after send) */}
                {(isSent || sentPdfUrl) && (
                  <div className="mt-4 rounded-lg border bg-muted/40 p-4 space-y-2">
                    <p className="text-sm font-medium">{t('offerPreview.shareLink')}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleCopyLink}
                      >
                        {linkCopied ? (
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        {linkCopied ? t('offerPreview.linkCopied') : t('offerPreview.copyLink')}
                      </Button>
                      {sentPdfUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={sentPdfUrl} target="_blank" rel="noopener noreferrer" download>
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sticky footer actions */}
          <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={sendOffer.isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('offerPreview.backToEdit')}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isPdfGenerating || isLoading || !data}
              >
                {isPdfGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isPdfGenerating ? t('offerPreview.generatingPdf') : t('offerPreview.downloadPdf')}
              </Button>

              {!isSent && (
                <Button
                  onClick={handleSend}
                  disabled={sendOffer.isPending || isLoading || !data}
                >
                  {sendOffer.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {sendOffer.isPending ? t('offerPreview.sending') : t('offerPreview.send')}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
