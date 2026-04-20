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

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { generateOfferPdfWithServer } from '@/lib/generateServerPdf';
import { useAcceptanceLink, useCreateAcceptanceLink, buildAcceptanceLinkUrl } from '@/hooks/useAcceptanceLink';
import { formatNumber, formatDate as formatDateLocale } from '@/lib/formatters';
import { validateSenderProfileForSend } from '@/lib/validations';

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
  /** PR-FIN-10: offer-level markup percent (0..100). Coerced from NUMERIC. */
  margin_percent: number;
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
        .select('id, title, status, currency, total_net, total_vat, total_gross, client_id, created_at, margin_percent')
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

      // PR-FIN-10: NUMERIC may arrive as string from supabase-js — coerce + clamp.
      const rawMargin = Number((offer as { margin_percent?: number | string | null }).margin_percent ?? 0);
      const marginPercent = Number.isFinite(rawMargin)
        ? Math.max(0, Math.min(100, rawMargin))
        : 0;

      return {
        id: offer.id as string,
        title: offer.title as string | null,
        status: offer.status as string,
        currency: (offer.currency as string) ?? 'PLN',
        total_net: offer.total_net as number | null,
        total_vat: offer.total_vat as number | null,
        total_gross: offer.total_gross as number | null,
        margin_percent: marginPercent,
        created_at: offer.created_at as string,
        client,
        items: (itemsData ?? []) as OfferPreviewData['items'],
        company,
      };
    },
    enabled: !!offerId && !!user,
    staleTime: 1000 * 60,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: number, currency = 'PLN', language = 'pl'): string {
  return formatNumber(val, 2, language) + ` ${currency}`;
}

function fmtDate(iso: string, language = 'pl'): string {
  return formatDateLocale(iso, language);
}

function validUntilDate(issuedIso: string, language = 'pl'): string {
  const d = new Date(issuedIso);
  d.setDate(d.getDate() + 30);
  return formatDateLocale(d, language);
}

function docId(offerId: string, issuedIso: string): string {
  const year = new Date(issuedIso).getFullYear();
  const suffix = offerId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `OF/${year}/${suffix}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OfferPreviewModal({ open, onClose, offerId, onSent }: OfferPreviewModalProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const { data, isLoading, isError } = useOfferPreviewData(offerId);
  const offerQuota = useFreeTierOfferQuota();
  const sendOffer = useSendOffer();
  const { data: acceptanceLink } = useAcceptanceLink(offerId);
  const createLink = useCreateAcceptanceLink(offerId);

  const [showPaywall, setShowPaywall] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sentPdfUrl, setSentPdfUrl] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');

  const isSent = data?.status === 'SENT';

  // Auto-fill recipient email from client data; allow manual override afterwards
  useEffect(() => {
    if (data?.client?.email) {
      setRecipientEmail(data.client.email);
    }
  }, [data?.client?.email]);

  // ── PDF download ───────────────────────────────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!user || !data) return;
    setIsPdfGenerating(true);
    try {
      const translateFn = (key: string, opts?: Record<string, unknown>) => t(key, opts as never) as string;
      const pdfBlob = await generateOfferPdfWithServer(offerId, user.id, translateFn, i18n.language);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      // Use sanitized offer title for a meaningful filename
      const safeTitle = data.title
        ? data.title.replace(/[^\w\s\-ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/gi, '').trim().slice(0, 40).replace(/\s+/g, '_')
        : offerId.slice(0, 8);
      link.download = `oferta-${safeTitle}.pdf`;
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

    // SEND-gate: client must be selected
    if (!data.client) {
      toast.error(t('offerPreview.sendBlockedNoClient'));
      return;
    }

    // SEND-gate: sender profile minimum must be complete
    const profileCheck = validateSenderProfileForSend(data.company);
    if (!profileCheck.valid) {
      toast.error(t('offerPreview.sendBlockedIncompleteProfile'));
      return;
    }

    // Quota gate (PR-06)
    if (!offerQuota.canSend && !isSent) {
      setShowPaywall(true);
      return;
    }

    const clientEmail = recipientEmail.trim() || undefined;

    sendOffer.mutate(
      { offerId, clientEmail },
      {
        onSuccess: (result) => {
          setSentPdfUrl(result.pdfUrl);
          // Auto-create public acceptance link so the sender can copy it immediately.
          // Fire-and-forget — non-fatal. AcceptanceLinkPanel also allows manual creation.
          if (!acceptanceLink?.token) {
            createLink.mutate();
          }
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

  // ── Copy share link ─────────────────────────────────────────────────────────
  // Only copies when a real public token exists (never copies internal auth routes)
  const handleCopyLink = async () => {
    if (!acceptanceLink?.token) return;
    const url = buildAcceptanceLinkUrl(acceptanceLink.token);
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
                  <Alert className={`mt-4 ${!offerQuota.canSend ? 'border-destructive/50 bg-destructive/10' : 'border-warning/30 bg-warning/5 dark:bg-warning/10'}`}>
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

                {/* SEND-gate: no client assigned */}
                {!isSent && !data.client && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {t('offerPreview.sendBlockedNoClient')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* SEND-gate: sender profile minimum incomplete */}
                {!isSent && data.client && !validateSenderProfileForSend(data.company).valid && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {t('offerPreview.sendBlockedIncompleteProfile')}
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
                            loading="lazy"
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
                          {t('offerPreview.issuedAt')}: {fmtDate(data.created_at, i18n.language)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('offerPreview.validUntil')}: {validUntilDate(data.created_at, i18n.language)}
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
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted hover:bg-muted">
                                <TableHead className="px-3 py-2 h-auto">
                                  {t('offerPreview.itemName')}
                                </TableHead>
                                <TableHead className="px-3 py-2 h-auto text-right w-16">
                                  {t('offerPreview.itemQty')}
                                </TableHead>
                                <TableHead className="px-3 py-2 h-auto text-center w-16">
                                  {t('offerPreview.itemUnit')}
                                </TableHead>
                                <TableHead className="px-3 py-2 h-auto text-right w-28">
                                  {t('offerPreview.itemUnitPrice')}
                                </TableHead>
                                <TableHead className="px-3 py-2 h-auto text-right w-20">
                                  {t('offerPreview.itemVat')}
                                </TableHead>
                                <TableHead className="px-3 py-2 h-auto text-right w-28">
                                  {t('offerPreview.itemTotal')}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.items.map((item, idx) => (
                                <TableRow key={item.id} className={idx % 2 === 0 ? '' : 'bg-muted/40'}>
                                  <TableCell className="px-3 py-2">{item.name}</TableCell>
                                  <TableCell className="px-3 py-2 text-right">{Number(item.qty)}</TableCell>
                                  <TableCell className="px-3 py-2 text-center">{item.unit || '—'}</TableCell>
                                  <TableCell className="px-3 py-2 text-right">
                                    {fmt(Number(item.unit_price_net), data.currency, i18n.language)}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-right">
                                    {item.vat_rate !== null ? `${item.vat_rate}%` : '—'}
                                  </TableCell>
                                  <TableCell className="px-3 py-2 text-right font-medium">
                                    {fmt(Number(item.line_total_net), data.currency, i18n.language)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="ml-auto max-w-xs space-y-1 text-sm">
                      {/* PR-FIN-10: show margin line transparently when > 0 */}
                      {data.margin_percent > 0 && (
                        <div className="flex justify-between text-xs text-gray-500 italic">
                          <span>{t('offerPreview.marginIncludedLabel', { percent: data.margin_percent })}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('offerPreview.totalsNet')}</span>
                        <span className="font-medium">{fmt(data.total_net ?? 0, data.currency, i18n.language)}</span>
                      </div>
                      {data.total_vat !== null && data.total_vat !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('offerPreview.totalsVat')}</span>
                          <span>{fmt(data.total_vat ?? 0, data.currency, i18n.language)}</span>
                        </div>
                      )}
                      {(data.total_vat === null || data.total_vat === 0) && (
                        <p className="text-xs text-gray-400 italic">{t('offerPreview.vatExempt')}</p>
                      )}
                      <div className="flex justify-between border-t border-gray-300 pt-1 font-bold text-base">
                        <span>{t('offerPreview.totalsGross')}</span>
                        <span>{fmt(data.total_gross ?? data.total_net ?? 0, data.currency, i18n.language)}</span>
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
                    {acceptanceLink?.token ? (
                      <>
                        <p className="text-xs text-muted-foreground">{t('offerPreview.shareLinkHint')}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-h-[44px]"
                            onClick={handleCopyLink}
                          >
                            {linkCopied ? (
                              <Check className="mr-2 h-4 w-4 text-success" />
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
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">{t('offerPreview.noAcceptanceLinkNote')}</p>
                        {sentPdfUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={sentPdfUrl} target="_blank" rel="noopener noreferrer" download>
                              <Download className="mr-2 h-4 w-4" />
                              PDF
                            </a>
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sticky footer actions */}
          <div className="sticky bottom-0 bg-background border-t px-4 sm:px-6 py-4 space-y-3">
            {/* Recipient email — auto-filled from client, editable before send */}
            {!isSent && data?.client && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
                  {t('offerPreview.recipientEmailLabel')}
                </label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder={t('offerPreview.recipientEmailPlaceholder')}
                  className="h-9 flex-1"
                  disabled={sendOffer.isPending}
                />
              </div>
            )}

            <div className="flex flex-wrap justify-between gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={sendOffer.isPending}
              className="min-h-[44px]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('offerPreview.backToEdit')}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isPdfGenerating || isLoading || !data}
                className="min-h-[44px]"
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
                  disabled={
                    sendOffer.isPending ||
                    isLoading ||
                    !data ||
                    !data.client ||
                    !validateSenderProfileForSend(data.company).valid
                  }
                  className="min-h-[44px]"
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
