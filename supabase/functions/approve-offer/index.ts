// ============================================
// APPROVE OFFER - Sprint 1 v2
// Dual-token + full lifecycle + cancel window
// ============================================
//
// Acceptance Bridge (PR-Ex2zp):
//   Przy akceptacji oferty tworzy wpis w v2_projects (nowy UI).
//   Legacy projects.status nadal aktualizowany (backward compat).
//   source_offer_id = approval.id (offer_approvals.id) — stored as bridge reference.
//   TODO(PR-09-fix): Add offer_id FK to offer_approvals table, then use actual offers.id.
//   Idempotencja: offer_approvals.v2_project_id śledzi utworzony projekt.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateUUID,
  validateString,
  createValidationErrorResponse
} from "../_shared/validation.ts";
import { checkRateLimit, createRateLimitResponse, getIdentifier } from "../_shared/rate-limiter.ts";
import { sanitizeUserInput } from "../_shared/sanitization.ts";
import { getCorsHeaders, getCorsPreflightHeaders } from "../_shared/cors.ts";

// ── Acceptance Bridge helper ─────────────────────────────────────────────────
// Tworzy wpis w v2_projects z danych legacy projektu i zapisuje ID w offer_approvals.
// Wywołanie bezpieczne wielokrotnie — sprawdza v2_project_id przed tworzeniem.
async function createAndLinkV2Project(
  supabase: ReturnType<typeof createClient>,
  approval: { id: string; project_id: string; user_id: string; v2_project_id?: string | null },
  now: string,
): Promise<string | null> {
  // Idempotencja: v2_project już istnieje
  if (approval.v2_project_id) {
    return approval.v2_project_id;
  }

  // Pobierz tytuł z legacy projektu
  const { data: legacyProject } = await supabase
    .from('projects')
    .select('project_name')
    .eq('id', approval.project_id)
    .maybeSingle();

  // Pobierz kwotę z wyceny (best-effort, nie blokuje przy braku)
  const { data: quoteData } = await supabase
    .from('quotes')
    .select('total')
    .eq('project_id', approval.project_id)
    .maybeSingle();

  const projectTitle = (legacyProject as { project_name?: string } | null)?.project_name ?? 'Projekt z oferty';
  const totalFromOffer = (quoteData as { total?: number } | null)?.total ?? null;

  // Wstaw do v2_projects
  // source_offer_id = approval.id — offer_approvals.id używane jako identyfikator oferty
  const { data: v2Project, error: v2InsertError } = await supabase
    .from('v2_projects')
    .insert({
      user_id: approval.user_id,
      title: projectTitle,
      source_offer_id: approval.id,
      total_from_offer: totalFromOffer,
      status: 'ACTIVE',
      progress_percent: 0,
      stages_json: [],
      budget_net: totalFromOffer,
      budget_source: totalFromOffer != null ? 'OFFER_NET' : null,
      budget_updated_at: totalFromOffer != null ? now : null,
    })
    .select('id')
    .single();

  if (v2InsertError || !v2Project) {
    console.error('[approve-offer] Acceptance Bridge: v2_projects insert failed:', v2InsertError);
    return null;
  }

  const v2ProjectId = (v2Project as { id: string }).id;

  // Zapisz v2_project_id w offer_approvals dla idempotencji
  const { error: linkError } = await supabase
    .from('offer_approvals')
    .update({ v2_project_id: v2ProjectId })
    .eq('id', approval.id);

  if (linkError) {
    console.error('[approve-offer] Acceptance Bridge: v2_project_id link failed:', linkError);
    // v2_project stworzony — zwróć ID mimo błędu zapisu linku
  }

  console.log(`[approve-offer] Acceptance Bridge: v2_project ${v2ProjectId} created for approval ${approval.id}`);
  return v2ProjectId;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsPreflightHeaders(req) });
  }
  const corsHeaders = getCorsHeaders(req);

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
    // v2_project_id dodany przez Acceptance Bridge (PR-Ex2zp)
    const { data: approval, error: fetchError } = await supabase
      .from('offer_approvals')
      .select('id, project_id, user_id, status, public_token, accept_token, expires_at, valid_until, approved_at, accepted_at, accepted_via, v2_project_id')
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
          action_url: `/app/projects/${approval.project_id}`,
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
            action_url: `/app/projects/${approval.project_id}`,
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
            action_url: `/app/projects/${approval.project_id}`,
          });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─── WITHDRAW (contractor action — requires authenticated session) ───
      if (action === 'withdraw') {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized — contractor session required' }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Verify that the JWT belongs to the offer owner
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !caller || caller.id !== approval.user_id) {
          return new Response(JSON.stringify({ error: 'Forbidden — only the offer owner can withdraw' }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

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
        // Acceptance Bridge recovery: jeśli zaakceptowana ale v2_project brakuje
        // (np. poprzednia próba utworzenia v2_project zakończyła się błędem)
        if (['accepted', 'approved'].includes(approval.status) && !approval.v2_project_id) {
          const now = new Date().toISOString();
          await createAndLinkV2Project(supabase, approval, now);
        }

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

      // ─── APPROVE branch: dual-write legacy + v2_projects ────────────────────
      if (action === 'approve') {
        // 1. Aktualizacja statusu legacy projektu (backward compat — nie usuwamy)
        await supabase
          .from('projects')
          .update({ status: 'Zaakceptowany' })
          .eq('id', approval.project_id);

        // 2. Acceptance Bridge: utwórz v2_project widoczny w nowym UI
        //    Idempotencja zapewniona przez createAndLinkV2Project (sprawdza v2_project_id)
        const v2ProjectId = await createAndLinkV2Project(supabase, approval, now);

        // Powiadomienie dla wykonawcy z linkiem do v2 projektu
        const projectUrl = v2ProjectId
          ? `/app/projects/${v2ProjectId}`
          : `/app/projects/${approval.project_id}`;

        await supabase
          .from('notifications')
          .insert({
            user_id: approval.user_id,
            title: '✓ Klient zaakceptował ofertę',
            message: `Klient zaakceptował ofertę${safeAcceptedVia === 'email_1click' ? ' (1-klik z emaila)' : ''}.${safeComment ? ` Komentarz: ${safeComment.substring(0, 100)}` : ''}`,
            type: 'success',
            action_url: projectUrl,
          });
      } else {
        // Powiadomienie dla wykonawcy przy odrzuceniu
        await supabase
          .from('notifications')
          .insert({
            user_id: approval.user_id,
            title: 'Oferta odrzucona',
            message: `Klient odrzucił ofertę.${safeRejectedReason ? ` Powód: ${safeRejectedReason.substring(0, 100)}` : ''}`,
            type: 'warning',
            action_url: `/app/projects/${approval.project_id}`,
          });
      }

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
