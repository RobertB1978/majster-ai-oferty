// ============================================
// APPROVE OFFER - Sprint 1 v2
// Dual-token + full lifecycle + cancel window
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateUUID,
  validateString,
  createValidationErrorResponse
} from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";
import { sanitizeUserInput } from "../_shared/sanitization.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse request body
    let body: {
      token?: unknown;
      acceptToken?: unknown;
      action?: unknown;
      signatureData?: unknown;
      comment?: unknown;
      rejected_reason?: unknown;
      accepted_via?: unknown;
    };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { token, acceptToken, action, signatureData, comment, rejected_reason, accepted_via } = body;

    // Validate public_token (UUID)
    const tokenValidation = validateUUID(token, 'token');
    if (!tokenValidation.valid) {
      return createValidationErrorResponse(tokenValidation.errors, corsHeaders);
    }

    // Rate limiting — max 10 attempts per IP per hour (D8)
    const rateLimitResult = await checkRateLimit(
      getIdentifier(req),
      'approve-offer',
      supabase
    );
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Fetch offer by public_token
    const { data: approval, error: fetchError } = await supabase
      .from('offer_approvals')
      .select('id, project_id, user_id, status, public_token, accept_token, expires_at, valid_until, approved_at, accepted_at, accepted_via')
      .eq('public_token', token)
      .single();

    if (fetchError || !approval) {
      return new Response(JSON.stringify({ error: "Oferta nie została znaleziona" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Token-level expiry check (link itself expired)
    if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        error: "Link do akceptacji wygasł. Skontaktuj się z wykonawcą w celu uzyskania nowego linku."
      }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // valid_until check — offer validity (auto-expire)
    if (approval.valid_until && new Date(approval.valid_until) < new Date()) {
      // Auto-expire if not already expired
      if (!['expired', 'accepted', 'approved', 'withdrawn'].includes(approval.status)) {
        await supabase
          .from('offer_approvals')
          .update({ status: 'expired' })
          .eq('id', approval.id);

        // Trigger: notify contractor of expiry
        await supabase.from('notifications').insert({
          user_id: approval.user_id,
          title: '⏰ Oferta wygasła',
          message: 'Termin ważności oferty minął. Klient nie zaakceptował w wyznaczonym czasie.',
          type: 'warning',
          action_url: `/app/jobs/${approval.project_id}`,
        });
      }
      return new Response(JSON.stringify({
        error: "Oferta wygasła. Skontaktuj się z wykonawcą, aby uzyskać nową wycenę.",
        status: 'expired',
      }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === 'GET') {
      // View-only: mark as viewed if currently pending/sent
      if (['pending', 'sent', 'draft'].includes(approval.status)) {
        const { count } = await supabase
          .from('offer_approvals')
          .update({ status: 'viewed', viewed_at: new Date().toISOString() })
          .eq('id', approval.id)
          .filter('viewed_at', 'is', null) // only set first view
          .select('id', { count: 'exact', head: true });

        // Notify contractor: client just opened the offer (first view only)
        if ((count ?? 0) > 0) {
          await supabase.from('notifications').insert({
            user_id: approval.user_id,
            title: '👁 Klient otworzył ofertę',
            message: 'Klient po raz pierwszy otworzył Twoją ofertę.',
            type: 'info',
            action_url: `/app/jobs/${approval.project_id}`,
          });
        }
      }

      const { data: quote } = await supabase
        .from('quotes')
        .select('id, total, margin_percent, summary_labor, summary_materials, positions')
        .eq('project_id', approval.project_id)
        .single();

      const { data: project } = await supabase
        .from('projects')
        .select('id, project_name')
        .eq('id', approval.project_id)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, owner_name, phone, contact_email, email_for_offers, street, city, postal_code, logo_url')
        .eq('user_id', approval.user_id)
        .single();

      return new Response(JSON.stringify({
        approval: { id: approval.id, status: approval.status },
        quote,
        project,
        company: profile,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === 'POST') {
      // Validate action
      const actionValidation = validateString(action, 'action', { maxLength: 20 });
      if (!actionValidation.valid) {
        return createValidationErrorResponse(actionValidation.errors, corsHeaders);
      }

      const validActions = ['approve', 'reject', 'cancel_accept', 'withdraw'];
      if (!validActions.includes(String(action))) {
        return new Response(JSON.stringify({ error: `Action must be one of: ${validActions.join(', ')}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── CANCEL_ACCEPT (10-minute window) ───────────────
      if (action === 'cancel_accept') {
        const isAccepted = ['accepted', 'approved'].includes(approval.status);
        if (!isAccepted) {
          return new Response(JSON.stringify({ error: "Oferta nie jest zaakceptowana" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const acceptedTs = approval.accepted_at ?? approval.approved_at;
        if (!acceptedTs) {
          return new Response(JSON.stringify({ error: "Nie można ustalić czasu akceptacji" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const diffMs = Date.now() - new Date(acceptedTs).getTime();
        if (diffMs > 600_000) {
          return new Response(JSON.stringify({ error: "Minął 10-minutowy czas na cofnięcie akceptacji" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await supabase
          .from('offer_approvals')
          .update({
            status: 'sent',
            accepted_at: null,
            approved_at: null,
            accepted_via: null,
          })
          .eq('id', approval.id);

        // Notify contractor
        await supabase
          .from('notifications')
          .insert({
            user_id: approval.user_id,
            title: 'Klient cofnął akceptację oferty',
            message: 'Klient cofnął akceptację oferty w oknie 10-minutowym.',
            type: 'warning',
            action_url: `/app/jobs/${approval.project_id}`,
          });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── WITHDRAW (contractor action) ───────────────────
      if (action === 'withdraw') {
        await supabase
          .from('offer_approvals')
          .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
          .eq('id', approval.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── APPROVE / REJECT ────────────────────────────────
      // Idempotency: already processed
      const alreadyFinal = ['accepted', 'approved', 'rejected', 'expired', 'withdrawn'].includes(approval.status);
      if (alreadyFinal) {
        return new Response(JSON.stringify({
          success: true,
          idempotent: true,
          status: approval.status,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For 1-click accept: validate accept_token
      if (action === 'approve' && accepted_via === 'email_1click') {
        if (!acceptToken || String(acceptToken) !== String(approval.accept_token)) {
          return new Response(JSON.stringify({ error: "Nieprawidłowy token akceptacji" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const safeComment = comment ? sanitizeUserInput(String(comment), 1000) : null;
      const safeRejectedReason = rejected_reason ? sanitizeUserInput(String(rejected_reason), 500) : null;
      const safeSignature = signatureData ? String(signatureData).substring(0, 50000) : null;
      const safeAcceptedVia = accepted_via === 'email_1click' ? 'email_1click' : 'web_button';

      const now = new Date().toISOString();
      const updateData: Record<string, unknown> = {
        status: action === 'approve' ? 'accepted' : 'rejected',
        client_comment: safeComment,
      };

      if (action === 'approve') {
        updateData.signature_data = safeSignature;
        updateData.approved_at = now;
        updateData.accepted_at = now;
        updateData.accepted_via = safeAcceptedVia;
      } else {
        updateData.rejected_reason = safeRejectedReason;
      }

      const { error: updateError } = await supabase
        .from('offer_approvals')
        .update(updateData)
        .eq('id', approval.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Update project status on approval
      if (action === 'approve') {
        await supabase
          .from('projects')
          .update({ status: 'Zaakceptowany' })
          .eq('id', approval.project_id);
      }

      // Notification for contractor
      await supabase
        .from('notifications')
        .insert({
          user_id: approval.user_id,
          title: action === 'approve'
            ? '✓ Klient zaakceptował ofertę'
            : 'Oferta odrzucona',
          message: action === 'approve'
            ? `Klient zaakceptował ofertę${safeAcceptedVia === 'email_1click' ? ' (1-klik z emaila)' : ''}.${safeComment ? ` Komentarz: ${safeComment.substring(0, 100)}` : ''}`
            : `Klient odrzucił ofertę.${safeRejectedReason ? ` Powód: ${safeRejectedReason.substring(0, 100)}` : ''}`,
          type: action === 'approve' ? 'success' : 'warning',
          action_url: `/app/jobs/${approval.project_id}`,
        });

      console.log(`[approve-offer] Offer ${approval.id} ${action}d (${safeAcceptedVia ?? 'web'})`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Approve offer error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
