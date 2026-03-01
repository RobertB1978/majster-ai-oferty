/**
 * AcceptanceLinkPanel — PR-12
 *
 * Shown inside offer detail for SENT offers.
 * Allows the owner to:
 *  1. Create a tokenized acceptance link (30-day TTL)
 *  2. Copy the link
 *  3. See expiry status
 *  4. See if the offer was already ACCEPTED/REJECTED via this link
 *
 * Security: token is UUID v4, expiry enforced server-side (SECURITY DEFINER fn).
 * Works with FF_NEW_SHELL ON/OFF.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Link2, Copy, Check, Loader2, CheckCircle2, XCircle, FolderPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useAcceptanceLink,
  useCreateAcceptanceLink,
  buildAcceptanceLinkUrl,
  daysUntilExpiry,
} from '@/hooks/useAcceptanceLink';

interface Props {
  offerId: string;
  offerStatus: string;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
}

export function AcceptanceLinkPanel({ offerId, offerStatus, acceptedAt, rejectedAt }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: link, isLoading } = useAcceptanceLink(offerId);
  const createLink = useCreateAcceptanceLink(offerId);

  const isAccepted = offerStatus === 'ACCEPTED';
  const isRejected = offerStatus === 'REJECTED';
  const isSent = offerStatus === 'SENT';

  const handleCreate = async () => {
    try {
      await createLink.mutateAsync();
      toast.success(t('acceptanceLink.createSuccess'));
    } catch {
      toast.error(t('acceptanceLink.createError'));
    }
  };

  const handleCopy = async () => {
    if (!link) return;
    const url = buildAcceptanceLinkUrl(link.token);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t('acceptanceLink.linkCopied'));
    setTimeout(() => setCopied(false), 2500);
  };

  const days = link ? daysUntilExpiry(link.expires_at) : 0;
  const isExpired = days <= 0;

  // ── ACCEPTED state ──────────────────────────────────────────────────────────
  if (isAccepted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <p className="font-semibold text-green-700 dark:text-green-400">
            {t('acceptanceLink.statusAccepted')}
          </p>
        </div>
        {acceptedAt && (
          <p className="text-sm text-green-600 dark:text-green-500">
            {t('acceptanceLink.acceptedAt', { date: new Date(acceptedAt).toLocaleString('pl-PL') })}
          </p>
        )}
        <div className="pt-1">
          <p className="text-xs text-green-600 dark:text-green-500 mb-2">
            {t('acceptanceLink.createProjectHint')}
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/app/jobs/new')}
            className="gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            {t('acceptanceLink.createProjectCta')}
          </Button>
        </div>
      </div>
    );
  }

  // ── REJECTED state ──────────────────────────────────────────────────────────
  if (isRejected) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="font-semibold text-red-700 dark:text-red-400">
            {t('acceptanceLink.statusRejected')}
          </p>
        </div>
        {rejectedAt && (
          <p className="text-sm text-red-600 dark:text-red-500 mt-1">
            {t('acceptanceLink.rejectedAt', { date: new Date(rejectedAt).toLocaleString('pl-PL') })}
          </p>
        )}
      </div>
    );
  }

  // ── Not SENT ────────────────────────────────────────────────────────────────
  if (!isSent) {
    return (
      <div className="rounded-lg border bg-muted/40 px-4 py-3">
        <p className="text-sm text-muted-foreground">{t('acceptanceLink.onlySent')}</p>
      </div>
    );
  }

  // ── SENT — link panel ───────────────────────────────────────────────────────
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-medium">{t('acceptanceLink.panelTitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : link && !isExpired ? (
        // Link exists and valid
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {t('acceptanceLink.expiresIn', { days })}
            </Badge>
          </div>
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
            <span className="flex-1 text-xs text-muted-foreground truncate font-mono">
              {buildAcceptanceLinkUrl(link.token)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleCopy}
              aria-label={t('acceptanceLink.copyLink')}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? t('acceptanceLink.linkCopied') : t('acceptanceLink.copyLink')}
          </Button>
        </div>
      ) : (
        // No link or expired
        <div className="space-y-2">
          {link && isExpired && (
            <Badge variant="destructive" className="text-xs">
              {t('acceptanceLink.expired')}
            </Badge>
          )}
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={createLink.isPending}
            className="gap-2"
          >
            {createLink.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {createLink.isPending
              ? t('acceptanceLink.creating')
              : t('acceptanceLink.createBtn')}
          </Button>
        </div>
      )}
    </div>
  );
}
