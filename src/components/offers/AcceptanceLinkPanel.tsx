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
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link2, Copy, Check, Loader2, CheckCircle2, XCircle, FolderPlus, FolderOpen, Ban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useAcceptanceLink,
  useCreateAcceptanceLink,
  buildAcceptanceLinkUrl,
  daysUntilExpiry,
} from '@/hooks/useAcceptanceLink';
import { useCreateProjectV2, useProjectBySourceOffer } from '@/hooks/useProjectsV2';
import { formatDateTime } from '@/lib/formatters';

interface Props {
  offerId: string;
  offerStatus: string;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
}

export function AcceptanceLinkPanel({ offerId, offerStatus, acceptedAt, rejectedAt }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const { data: link, isLoading } = useAcceptanceLink(offerId);
  const createLink = useCreateAcceptanceLink(offerId);
  const createProject = useCreateProjectV2();

  const isAccepted = offerStatus === 'ACCEPTED';
  const isRejected = offerStatus === 'REJECTED';
  const isSent = offerStatus === 'SENT';
  const isWithdrawn = offerStatus === 'WITHDRAWN';

  // Eager project lookup — only runs when offer is ACCEPTED.
  // Allows showing "Open project" immediately instead of "Create project".
  const { data: existingProject, isLoading: existingProjectLoading } =
    useProjectBySourceOffer(isAccepted ? offerId : undefined);

  const handleCreate = async () => {
    try {
      await createLink.mutateAsync();
      toast.success(t('acceptanceLink.createSuccess'));
    } catch {
      toast.error(t('acceptanceLink.createError'));
    }
  };

  // ── L-4: WITHDRAW — authenticated owner pulls back a SENT offer ──────────────
  const handleWithdraw = async () => {
    if (!link) return;
    if (!window.confirm(t('acceptanceLink.withdrawConfirm'))) return;
    setWithdrawing(true);
    try {
      const { data: raw, error } = await supabase.rpc(
        'process_offer_acceptance_action',
        { p_token: link.token, p_action: 'WITHDRAW', p_comment: null },
      );
      if (error) throw error;
      const res = raw as { error?: string };
      if (res?.error) throw new Error(res.error);
      toast.success(t('acceptanceLink.withdrawSuccess'));
      queryClient.invalidateQueries({ queryKey: ['offerMeta', offerId] });
    } catch {
      toast.error(t('acceptanceLink.withdrawError'));
    } finally {
      setWithdrawing(false);
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
      <div className="rounded-lg border border-success/30 bg-success/5 dark:border-success/40 dark:bg-success/10 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <p className="font-semibold text-success">
            {t('acceptanceLink.statusAccepted')}
          </p>
        </div>
        {acceptedAt && (
          <p className="text-sm text-success/80">
            {t('acceptanceLink.acceptedAt', { date: formatDateTime(acceptedAt, i18n.language) })}
          </p>
        )}
        <div className="pt-1">
          {existingProjectLoading ? (
            // Checking if project already exists
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : existingProject ? (
            // Project already exists — go straight to it, no misleading "Create" path
            <Button
              size="sm"
              onClick={() => navigate(`/app/projects/${existingProject.id}`)}
              className="gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              {t('acceptanceLink.openProjectCta')}
            </Button>
          ) : (
            // No project yet — offer creation
            <>
              <p className="text-xs text-success/80 mb-2">
                {t('acceptanceLink.createProjectHint')}
              </p>
              <Button
                size="sm"
                onClick={async () => {
                  setCreatingProject(true);
                  try {
                    // useCreateProjectV2 handles race-condition 23505 internally
                    // (returns existing project when DB unique index rejects duplicate)
                    const project = await createProject.mutateAsync({
                      title: t('projectsV2.defaultTitle'),
                      source_offer_id: offerId,
                    });
                    toast.success(t('projectsV2.createSuccess'));
                    navigate(`/app/projects/${project.id}`);
                  } catch {
                    toast.error(t('projectsV2.createError'));
                  } finally {
                    setCreatingProject(false);
                  }
                }}
                disabled={creatingProject}
                className="gap-2"
              >
                {creatingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                {creatingProject ? t('projectsV2.creating') : t('acceptanceLink.createProjectCta')}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── REJECTED state ──────────────────────────────────────────────────────────
  if (isRejected) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 dark:border-destructive/40 dark:bg-destructive/10 p-4">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="font-semibold text-destructive">
            {t('acceptanceLink.statusRejected')}
          </p>
        </div>
        {rejectedAt && (
          <p className="text-sm text-destructive/80 mt-1">
            {t('acceptanceLink.rejectedAt', { date: formatDateTime(rejectedAt, i18n.language) })}
          </p>
        )}
      </div>
    );
  }

  // ── WITHDRAWN state — L-4 ───────────────────────────────────────────────────
  if (isWithdrawn) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <div className="flex items-center gap-2">
          <Ban className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="font-semibold text-muted-foreground">
            {t('acceptanceLink.statusWithdrawn')}
          </p>
        </div>
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
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? t('acceptanceLink.linkCopied') : t('acceptanceLink.copyLink')}
            </Button>
            {/* L-4: WITHDRAW — only shown when link exists (token required for RPC) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            >
              {withdrawing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Ban className="h-3.5 w-3.5" />
              )}
              {withdrawing ? t('acceptanceLink.withdrawing') : t('acceptanceLink.withdrawBtn')}
            </Button>
          </div>
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
