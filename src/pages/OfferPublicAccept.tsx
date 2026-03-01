/**
 * OfferPublicAccept — PR-12
 *
 * Public acceptance page for offers. Accessible at /a/:token without login.
 * Client can review the offer summary and ACCEPT or REJECT.
 *
 * Data fetched via SECURITY DEFINER DB function (resolve_offer_acceptance_link)
 * so no user auth or cross-tenant leakage is possible.
 *
 * Rate limiting: documented in SECURITY_BASELINE.md (apply at CDN/edge layer).
 * Token entropy: UUID v4 = 122 bits — unguessable.
 * Works with FF_NEW_SHELL ON/OFF (standalone page, no shell).
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  Building2,
  User,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OfferItem {
  id: string;
  name: string;
  unit: string | null;
  qty: number;
  unit_price_net: number;
  vat_rate: number | null;
  line_total_net: number;
}

interface PublicOfferData {
  offer: {
    id: string;
    title: string | null;
    status: string;
    currency: string;
    total_net: number | null;
    total_vat: number | null;
    total_gross: number | null;
    created_at: string;
    accepted_at: string | null;
    rejected_at: string | null;
  };
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
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
  items: OfferItem[];
  expires_at: string;
}

type FetchError = 'not_found' | 'expired' | 'offer_not_found' | 'not_available' | 'unknown';

// ── Data fetcher ──────────────────────────────────────────────────────────────

async function fetchPublicOffer(token: string): Promise<{ data: PublicOfferData | null; fetchError: FetchError | null }> {
  const { data: raw, error } = await supabase.rpc('resolve_offer_acceptance_link', {
    p_token: token,
  });

  if (error) return { data: null, fetchError: 'unknown' };

  const result = raw as { error?: string } & Partial<PublicOfferData>;
  if (result.error) {
    return { data: null, fetchError: result.error as FetchError };
  }

  return { data: result as unknown as PublicOfferData, fetchError: null };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: number, currency = 'PLN'): string {
  return (
    new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) +
    ` ${currency}`
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL');
}

function docId(offerId: string, issuedIso: string): string {
  const year = new Date(issuedIso).getFullYear();
  const suffix = offerId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `OF/${year}/${suffix}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OfferPublicAccept() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();

  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionResult, setActionResult] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: result, isLoading } = useQuery({
    queryKey: ['publicOffer', token],
    queryFn: () => fetchPublicOffer(token!),
    enabled: !!token,
    staleTime: 0,
    retry: false,
  });

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">{t('publicOffer.loading')}</span>
      </div>
    );
  }

  // ── Error states ────────────────────────────────────────────────────────────
  if (!result || result.fetchError) {
    const isExpiredError = result?.fetchError === 'expired';
    return (
      <>
        <Helmet>
          <title>{t('publicOffer.pageTitle')} | Majster.AI</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-sm w-full text-center space-y-4">
            {isExpiredError ? (
              <Clock className="h-16 w-16 text-amber-500 mx-auto" />
            ) : (
              <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
            )}
            <h1 className="text-xl font-bold">
              {isExpiredError ? t('publicOffer.expired') : t('publicOffer.notFound')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isExpiredError ? t('publicOffer.expiredDesc') : t('publicOffer.notFoundDesc')}
            </p>
            <p className="text-xs text-muted-foreground">{t('publicOffer.poweredBy')}</p>
          </div>
        </div>
      </>
    );
  }

  const { data } = result;
  if (!data) return null;

  const offerStatus = actionResult ?? data.offer.status;
  const isAlreadyAccepted = offerStatus === 'ACCEPTED';
  const isAlreadyRejected = offerStatus === 'REJECTED';
  const isSent = offerStatus === 'SENT';
  const daysLeft = differenceInDays(new Date(data.expires_at), new Date());

  // ── Action handler ──────────────────────────────────────────────────────────
  const handleAction = async (action: 'ACCEPT' | 'REJECT') => {
    if (!token) return;
    setSubmitting(true);
    setActionError(null);

    try {
      const { data: raw, error } = await supabase.rpc('process_offer_acceptance_action', {
        p_token: token,
        p_action: action,
        p_comment: comment.trim() || null,
      });

      if (error) throw error;

      const res = raw as { error?: string; success?: boolean; status?: string };
      if (res.error) {
        if (res.error === 'expired') {
          setActionError(t('publicOffer.expiredDesc'));
        } else {
          setActionError(t('publicOffer.actionError'));
        }
        return;
      }

      setActionResult(action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED');
    } catch {
      setActionError(t('publicOffer.actionError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{data.offer.title ?? t('publicOffer.pageTitle')} | Majster.AI</title>
        <meta name="description" content={t('publicOffer.pageDescription')} />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="text-center space-y-1">
            {data.company?.logo_url && (
              <img
                src={data.company.logo_url}
                alt="Logo"
                className="h-10 mx-auto object-contain mb-2"
              />
            )}
            <h1 className="text-2xl font-bold">
              {data.offer.title ?? t('publicOffer.pageTitle')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('publicOffer.offerNumber')}: {docId(data.offer.id, data.offer.created_at)}
              {' · '}
              {t('publicOffer.issuedAt')}: {fmtDate(data.offer.created_at)}
            </p>
            {daysLeft > 0 && isSent && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {t('publicOffer.expiresIn', { days: daysLeft })}
              </Badge>
            )}
          </div>

          {/* ── Decision banner ───────────────────────────────────────────── */}
          {(isAlreadyAccepted || isAlreadyRejected) && (
            <div
              className={cn(
                'rounded-lg border p-4 flex items-center gap-3',
                isAlreadyAccepted
                  ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                  : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
              )}
            >
              {isAlreadyAccepted ? (
                <CheckCircle2 className="h-7 w-7 text-green-600 shrink-0" />
              ) : (
                <XCircle className="h-7 w-7 text-red-600 shrink-0" />
              )}
              <div>
                <p className={cn('font-semibold', isAlreadyAccepted ? 'text-green-700' : 'text-red-700')}>
                  {isAlreadyAccepted ? t('publicOffer.alreadyAccepted') : t('publicOffer.alreadyRejected')}
                </p>
                {isAlreadyAccepted && data.offer.accepted_at && (
                  <p className="text-sm text-green-600">{fmtDate(data.offer.accepted_at)}</p>
                )}
                {isAlreadyRejected && data.offer.rejected_at && (
                  <p className="text-sm text-red-600">{fmtDate(data.offer.rejected_at)}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Offer card ────────────────────────────────────────────────── */}
          <div className="rounded-lg border bg-card text-sm">
            {/* Company section */}
            {data.company && (
              <div className="p-4 border-b">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">{data.company.company_name}</p>
                    {data.company.nip && (
                      <p className="text-xs text-muted-foreground">NIP: {data.company.nip}</p>
                    )}
                    {(data.company.street || data.company.city) && (
                      <p className="text-xs text-muted-foreground">
                        {[data.company.street, data.company.postal_code, data.company.city]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {data.company.phone && (
                      <a href={`tel:${data.company.phone}`} className="text-xs text-primary hover:underline">
                        {data.company.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Client section */}
            {data.client && (
              <div className="p-4 border-b">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">{data.client.name}</p>
                    {data.client.address && (
                      <p className="text-xs text-muted-foreground">{data.client.address}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Items table */}
            <div className="p-4 border-b">
              <p className="font-semibold mb-3">{t('publicOffer.items')}</p>
              {data.items.length === 0 ? (
                <p className="text-muted-foreground text-xs">{t('publicOffer.noItems')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-2 py-1.5 text-left font-medium">
                          {t('publicOffer.itemName')}
                        </th>
                        <th className="border border-border px-2 py-1.5 text-right font-medium w-14">
                          {t('publicOffer.itemQty')}
                        </th>
                        <th className="border border-border px-2 py-1.5 text-center font-medium w-14">
                          {t('publicOffer.itemUnit')}
                        </th>
                        <th className="border border-border px-2 py-1.5 text-right font-medium w-24">
                          {t('publicOffer.itemPrice')}
                        </th>
                        <th className="border border-border px-2 py-1.5 text-right font-medium w-16">
                          {t('publicOffer.itemVat')}
                        </th>
                        <th className="border border-border px-2 py-1.5 text-right font-medium w-24">
                          {t('publicOffer.itemTotal')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? '' : 'bg-muted/40'}>
                          <td className="border border-border px-2 py-1.5">{item.name}</td>
                          <td className="border border-border px-2 py-1.5 text-right">{Number(item.qty)}</td>
                          <td className="border border-border px-2 py-1.5 text-center">{item.unit || '—'}</td>
                          <td className="border border-border px-2 py-1.5 text-right">
                            {fmt(Number(item.unit_price_net), data.offer.currency)}
                          </td>
                          <td className="border border-border px-2 py-1.5 text-right">
                            {item.vat_rate !== null ? `${item.vat_rate}%` : '—'}
                          </td>
                          <td className="border border-border px-2 py-1.5 text-right font-medium">
                            {fmt(Number(item.line_total_net), data.offer.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('publicOffer.totalsNet')}</span>
                <span className="font-medium">{fmt(data.offer.total_net ?? 0, data.offer.currency)}</span>
              </div>
              {data.offer.total_vat !== null && data.offer.total_vat !== 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('publicOffer.totalsVat')}</span>
                  <span>{fmt(data.offer.total_vat, data.offer.currency)}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">{t('publicOffer.vatExempt')}</p>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
                <span>{t('publicOffer.totalsGross')}</span>
                <span>{fmt(data.offer.total_gross ?? data.offer.total_net ?? 0, data.offer.currency)}</span>
              </div>
            </div>
          </div>

          {/* ── Action section (only when SENT) ────────────────────────────── */}
          {isSent && (
            <div className="rounded-lg border bg-card p-4 space-y-4">
              {/* Comment field */}
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="pub-comment">
                  {t('publicOffer.commentLabel')}
                </label>
                <Textarea
                  id="pub-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('publicOffer.commentPlaceholder')}
                  rows={3}
                  maxLength={1000}
                  disabled={submitting}
                />
              </div>

              {/* Action error */}
              {actionError && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {actionError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleAction('ACCEPT')}
                  disabled={submitting}
                  className="flex-1 min-h-[48px] bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  {submitting ? t('publicOffer.accepting') : t('publicOffer.acceptBtn')}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleAction('REJECT')}
                  disabled={submitting}
                  className="min-h-[48px] border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  {submitting ? t('publicOffer.rejecting') : t('publicOffer.rejectBtn')}
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">{t('publicOffer.poweredBy')}</p>
        </div>
      </div>
    </>
  );
}
