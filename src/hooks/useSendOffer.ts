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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { offersKeys } from '@/hooks/useOffers';
import { offerWizardKeys } from '@/hooks/useOfferWizard';
import { generateOfferPdf, uploadOfferPdf } from '@/lib/offerPdfGenerator';
import { buildOfferPdfPayloadFromOffer } from '@/lib/offerPdfPayloadBuilder';

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
        const payload = await buildOfferPdfPayloadFromOffer(offerId, user.id);
        const pdfBlob = await generateOfferPdf(payload);
        const { publicUrl } = await uploadOfferPdf({
          projectId: offerId,
          pdfBlob,
          userId: user.id,
          fileName: `oferta-${offerId.slice(0, 8)}.pdf`,
        });
        pdfUrl = publicUrl;
      } catch (pdfErr) {
        // Non-fatal: offer is SENT even if PDF fails
        console.error('[useSendOffer] PDF generation failed (non-fatal):', pdfErr);
      }

      // ── 4. Send email (non-fatal) ─────────────────────────────────────
      let emailSent = false;
      if (clientEmail) {
        try {
          const title = offerRow.title as string | null;
          const gross = offerRow.total_gross as number | null;
          const net = offerRow.total_net as number | null;
          const currency = (offerRow.currency as string) ?? 'PLN';
          const amount = (gross ?? net ?? 0).toFixed(2);

          const { error: emailErr } = await supabase.functions.invoke('send-offer-email', {
            body: {
              to: clientEmail,
              subject: `Oferta: ${title ?? 'Oferta'}`,
              message: `Przesyłamy ofertę. Wartość: ${amount} ${currency}.`,
              projectName: title ?? 'Oferta',
              pdfUrl: pdfUrl ?? undefined,
            },
          });
          if (!emailErr) emailSent = true;
        } catch (emailErr) {
          // Non-fatal: SENT status was already set
          console.error('[useSendOffer] Email send failed (non-fatal):', emailErr);
        }
      }

      return { offerId, alreadySent: false, pdfUrl, emailSent };
    },

    onSuccess: (_, { offerId }) => {
      queryClient.invalidateQueries({ queryKey: offersKeys.all });
      queryClient.invalidateQueries({ queryKey: offerWizardKeys.detail(offerId) });
      // Refresh quota indicator
      queryClient.invalidateQueries({ queryKey: ['monthly-offer-quota'] });
    },
  });
}
