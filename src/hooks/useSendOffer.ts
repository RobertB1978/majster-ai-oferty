/**
 * useSendOffer — PR-11
 *
 * Mutation hook that finalizes a DRAFT offer by transitioning it to SENT status.
 *
 * Behaviour:
 *  - Idempotent: if offer is already SENT, returns early without double-counting
 *  - Quota gating is done at the component level (via useFreeTierOfferQuota)
 *  - Generates PDF and uploads to Supabase Storage (non-fatal on failure)
 *  - Sends email via send-offer-email EF if clientEmail provided (non-fatal on failure)
 *  - Invalidates offers list + wizard cache + quota cache on success
 *
 * ADR-0004 compliance:
 *  - Only SEND action counts toward monthly quota (not draft save)
 *  - Re-sending same SENT offer = idempotent, sent_at not overwritten
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { offersKeys } from '@/hooks/useOffers';
import { offerWizardKeys } from '@/hooks/useOfferWizard';
import { uploadOfferPdf } from '@/lib/offerPdfGenerator';
import { generateOfferPdfWithServer } from '@/lib/generateServerPdf';
import { trackEvent } from '@/lib/analytics/track';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { logger } from '@/lib/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SendOfferParams {
  /** UUID of the offer to finalize */
  offerId: string;
  /** Client email — if provided, triggers email send (best-effort) */
  clientEmail?: string;
}

export interface SendOfferResult {
  offerId: string;
  /** true when offer was already SENT before this call — no quota counted */
  alreadySent: boolean;
  /** Public URL of the generated PDF, or null if PDF generation failed */
  pdfUrl: string | null;
  /** true when email was sent successfully */
  emailSent: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSendOffer() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation<SendOfferResult, Error, SendOfferParams>({
    mutationFn: async ({ offerId, clientEmail }): Promise<SendOfferResult> => {
      if (!user) throw new Error('Not authenticated');

      // ── 1. Load current offer (idempotency check) ──────────────────────
      const { data: offerRow, error: offerErr } = await supabase
        .from('offers')
        .select('id, status, sent_at, title, total_gross, total_net, currency')
        .eq('id', offerId)
        .single();

      if (offerErr) throw offerErr;

      // Idempotent: if already SENT (or beyond), return early
      const alreadyFinalized = ['SENT', 'ACCEPTED', 'REJECTED'].includes(offerRow.status as string);
      if (alreadyFinalized) {
        return {
          offerId,
          alreadySent: true,
          pdfUrl: null,
          emailSent: false,
        };
      }

      // ── 2. Transition offer to SENT ────────────────────────────────────
      const sentAt = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('offers')
        .update({
          status: 'SENT',
          sent_at: sentAt,
          last_activity_at: sentAt,
        })
        .eq('id', offerId)
        .eq('status', 'DRAFT'); // Safety guard: only transition from DRAFT

      if (updateErr) throw updateErr;

      // ── 3. Generate + upload PDF (non-fatal) ──────────────────────────
      let pdfUrl: string | null = null;
      try {
        const translateFn = (key: string, opts?: Record<string, unknown>) => t(key, opts as never) as string;
        const pdfBlob = await generateOfferPdfWithServer(offerId, user.id, translateFn, i18n.language);
        const { publicUrl } = await uploadOfferPdf({
          projectId: offerId,
          pdfBlob,
          userId: user.id,
          fileName: `oferta-${offerId.slice(0, 8)}.pdf`,
        });
        pdfUrl = publicUrl;
      } catch (pdfErr) {
        // Non-fatal: offer is SENT even if PDF fails
        logger.error('[useSendOffer] PDF generation failed (non-fatal):', pdfErr);
      }

      // ── 3.5. Create acceptance link BEFORE email (non-fatal) ──────────
      // Link must exist before email so the token (and 1-click accept_token)
      // can be included in the message.
      let acceptanceLinkToken: string | undefined;
      let acceptanceLinkAcceptToken: string | undefined;
      try {
        // Fetch existing link first (upsert with ignoreDuplicates=true returns nothing on conflict)
        const { data: existingLink } = await supabase
          .from('acceptance_links')
          .select('token, accept_token')
          .eq('offer_id', offerId)
          .maybeSingle();

        if (existingLink) {
          const link = existingLink as { token: string; accept_token: string };
          acceptanceLinkToken = link.token;
          acceptanceLinkAcceptToken = link.accept_token;
        } else {
          const { data: newLink } = await supabase
            .from('acceptance_links')
            .insert({ user_id: user.id, offer_id: offerId })
            .select('token, accept_token')
            .single();
          const link = newLink as { token: string; accept_token: string } | null;
          acceptanceLinkToken = link?.token;
          acceptanceLinkAcceptToken = link?.accept_token;
        }
      } catch (linkErr) {
        // Non-fatal: email sends without action button
        logger.error('[useSendOffer] Acceptance link creation failed (non-fatal):', linkErr);
      }

      // ── 4. Send email (non-fatal) ─────────────────────────────────────
      let emailSent = false;
      let emailSubject = '';
      let emailMessage = '';
      if (clientEmail) {
        const title = offerRow.title as string | null;
        const gross = offerRow.total_gross as number | null;
        const net = offerRow.total_net as number | null;
        const currency = (offerRow.currency as string) ?? 'PLN';
        const amount = (gross ?? net ?? 0).toFixed(2);
        const offerTitle = title ?? t('sendOffer.autoSubjectNoTitle');
        emailSubject = t('sendOffer.autoSubject', { title: offerTitle });
        emailMessage = t('sendOffer.autoMessage', { amount, currency });

        try {
          const { error: emailErr } = await supabase.functions.invoke('send-offer-email', {
            body: {
              to: clientEmail,
              subject: emailSubject,
              message: emailMessage,
              projectName: offerTitle,
              pdfUrl: pdfUrl ?? undefined,
              publicToken: acceptanceLinkToken,
              acceptToken: acceptanceLinkAcceptToken,
              locale: i18n.language,
            },
          });
          if (!emailErr) emailSent = true;
        } catch (emailErr) {
          // Non-fatal: SENT status was already set
          logger.error('[useSendOffer] Email send failed (non-fatal):', emailErr);
        }

        // ── 4.5. Record send history (non-fatal) ───────────────────────
        // Persists who received the offer so the send-history panel and
        // future tracking logic can identify the recipient.
        try {
          await supabase.from('offer_sends').insert({
            project_id: offerId,
            user_id: user.id,
            client_email: clientEmail,
            subject: emailSubject,
            message: emailMessage,
            status: emailSent ? 'sent' : 'pending',
            pdf_url: pdfUrl ?? null,
            tracking_status: 'sent',
          });
        } catch (histErr) {
          logger.error('[useSendOffer] offer_sends insert failed (non-fatal):', histErr);
        }
      }

      return { offerId, alreadySent: false, pdfUrl, emailSent };
    },

    onSuccess: (result, { offerId }) => {
      // Fire OFFER_SENT only on a fresh transition (not idempotent re-send)
      if (!result.alreadySent) {
        trackEvent(ANALYTICS_EVENTS.OFFER_SENT, { offerId });
      }
      queryClient.invalidateQueries({ queryKey: offersKeys.all });
      queryClient.invalidateQueries({ queryKey: offerWizardKeys.detail(offerId) });
      // Refresh quota indicator
      queryClient.invalidateQueries({ queryKey: ['monthly-offer-quota'] });
      // Refresh acceptance link so share panel shows immediately after send
      queryClient.invalidateQueries({ queryKey: ['acceptanceLink', offerId] });
    },
  });
}
