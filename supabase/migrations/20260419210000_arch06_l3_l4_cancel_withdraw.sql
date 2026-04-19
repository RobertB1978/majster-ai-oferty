-- ============================================================
-- ARCH-06: Close L-3 (CANCEL_ACCEPT) + L-4 (WITHDRAW)
--          in process_offer_acceptance_action.
--
-- PR:     PR-CANON-06
-- Date:   2026-04-19
-- Branch: claude/cancel-withdraw-legacy-redirect-k9HMq
--
-- Background:
--   COMPATIBILITY_MATRIX L-3 (OPEN): CANCEL_ACCEPT within 10-min window.
--   COMPATIBILITY_MATRIX L-4 (OPEN): WITHDRAW with JWT verification.
--   Both actions were present in the legacy flow (approve-offer Edge Function)
--   but missing from the canonical process_offer_acceptance_action RPC.
--
-- Changes:
--   1. ALTER offers.status check constraint — add 'WITHDRAWN' value.
--      Additive and idempotent via DROP + ADD.
--   2. UPDATE process_offer_acceptance_action — add CANCEL_ACCEPT + WITHDRAW.
--      Backward compatible: existing callers with ACCEPT/REJECT unaffected.
--   3. ADD FUNCTION resolve_legacy_to_canonical_token — looks up the canonical
--      acceptance_links.token for a given offer_approvals.public_token.
--      Enables the 30-day redirect window from /offer/:token → /a/:token.
--
-- Security:
--   - CANCEL_ACCEPT: no auth required (client cancels their own acceptance).
--     Time-gated: only within 10 minutes of accepted_at.
--   - WITHDRAW: requires auth.uid() = offer.user_id (JWT ownership check).
--   - resolve_legacy_to_canonical_token: SECURITY DEFINER, anon-callable.
--     Only returns canonical token (public) — no private data exposed.
--
-- Idempotency:
--   - DROP CONSTRAINT + ADD CONSTRAINT: safe sequence (check constraint by name).
--   - CREATE OR REPLACE: replaces functions without DROP.
--
-- Rollback:
--   1. Revert process_offer_acceptance_action to ARCH-05 version.
--   2. DROP FUNCTION resolve_legacy_to_canonical_token;
--   3. ALTER TABLE offers DROP CONSTRAINT offers_status_check;
--      ALTER TABLE offers ADD CONSTRAINT offers_status_check
--        CHECK (status IN ('DRAFT','SENT','ACCEPTED','REJECTED','ARCHIVED'));
-- ============================================================

-- ── 1. Add WITHDRAWN to offers.status allowed values ────────────────────────

ALTER TABLE public.offers
  DROP CONSTRAINT IF EXISTS offers_status_check;

ALTER TABLE public.offers
  ADD CONSTRAINT offers_status_check
    CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED', 'WITHDRAWN'));

COMMENT ON COLUMN public.offers.status IS
  'Offer lifecycle: DRAFT → SENT → ACCEPTED | REJECTED | ARCHIVED | WITHDRAWN. '
  'WITHDRAWN added ARCH-06 (2026-04-19): contractor-initiated withdrawal of a SENT offer.';

-- ── 2. Update process_offer_acceptance_action ────────────────────────────────
-- Adds CANCEL_ACCEPT (client, time-gated) and WITHDRAW (owner, JWT-gated).
-- Fully backward compatible: ACCEPT/REJECT/L-6 accept_token paths unchanged.

CREATE OR REPLACE FUNCTION public.process_offer_acceptance_action(
  p_token        uuid,
  p_action       text,
  p_comment      text DEFAULT NULL,
  p_accept_token uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link       acceptance_links%ROWTYPE;
  v_offer      offers%ROWTYPE;
  v_project_id uuid;
  v_action     text;
BEGIN
  -- Determine effective action
  v_action := p_action;

  -- Validate action when not using accept_token path
  IF p_accept_token IS NULL
     AND v_action NOT IN ('ACCEPT', 'REJECT', 'CANCEL_ACCEPT', 'WITHDRAW') THEN
    RETURN jsonb_build_object('error', 'invalid_action');
  END IF;

  -- Sanitize comment length
  IF p_comment IS NOT NULL THEN
    p_comment := left(p_comment, 1000);
  END IF;

  -- Find link
  SELECT * INTO v_link FROM acceptance_links WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- ── L-6: Validate accept_token (1-click from email) ──────────────────────
  IF p_accept_token IS NOT NULL THEN
    IF v_link.accept_token IS DISTINCT FROM p_accept_token THEN
      RETURN jsonb_build_object('error', 'invalid_accept_token');
    END IF;
    v_action := 'ACCEPT';
  END IF;

  -- Expiry check
  IF v_link.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- Get offer
  SELECT * INTO v_offer FROM offers WHERE id = v_link.offer_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'offer_not_found');
  END IF;

  -- ── L-3: CANCEL_ACCEPT — client reverses acceptance within 10 minutes ─────
  -- Must be handled BEFORE the idempotency gate (offer is ACCEPTED at this point).
  IF v_action = 'CANCEL_ACCEPT' THEN
    IF v_offer.status <> 'ACCEPTED' THEN
      RETURN jsonb_build_object('error', 'not_accepted');
    END IF;
    IF v_offer.accepted_at IS NULL
       OR now() - v_offer.accepted_at > INTERVAL '10 minutes' THEN
      RETURN jsonb_build_object('error', 'cancel_window_expired');
    END IF;

    -- Reverse: back to SENT
    UPDATE offers
      SET status = 'SENT', accepted_at = NULL
      WHERE id = v_offer.id;

    -- Audit log
    INSERT INTO offer_public_actions (offer_id, token, action, comment)
      VALUES (v_offer.id, p_token, 'CANCEL_ACCEPT', p_comment);

    -- Notify owner
    INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (
        v_offer.user_id,
        'Akceptacja oferty cofnięta',
        'Klient cofnął akceptację oferty' ||
          COALESCE(' "' || v_offer.title || '"', '') || '.',
        'info',
        '/app/offers/' || v_offer.id::text
      );

    RETURN jsonb_build_object('success', true, 'status', 'SENT');
  END IF;

  -- ── L-4: WITHDRAW — authenticated offer owner pulls back a SENT offer ─────
  IF v_action = 'WITHDRAW' THEN
    IF auth.uid() IS NULL OR auth.uid() <> v_offer.user_id THEN
      RETURN jsonb_build_object('error', 'not_authorized');
    END IF;
    IF v_offer.status <> 'SENT' THEN
      RETURN jsonb_build_object('error', 'not_withdrawable');
    END IF;

    UPDATE offers
      SET status = 'WITHDRAWN'
      WHERE id = v_offer.id;

    -- Audit log
    INSERT INTO offer_public_actions (offer_id, token, action, comment)
      VALUES (v_offer.id, p_token, 'WITHDRAW', p_comment);

    RETURN jsonb_build_object('success', true, 'status', 'WITHDRAWN');
  END IF;

  -- ── Idempotency gate for ACCEPT / REJECT ──────────────────────────────────
  IF v_offer.status IN ('ACCEPTED', 'REJECTED') THEN
    RETURN jsonb_build_object(
      'success',    true,
      'idempotent', true,
      'status',     v_offer.status
    );
  END IF;

  -- Only SENT offers can be accepted/rejected
  IF v_offer.status <> 'SENT' THEN
    RETURN jsonb_build_object('error', 'not_actionable');
  END IF;

  -- Update offer status
  IF v_action = 'ACCEPT' THEN
    UPDATE offers
      SET status = 'ACCEPTED', accepted_at = now()
      WHERE id = v_offer.id;
  ELSE
    UPDATE offers
      SET status = 'REJECTED', rejected_at = now()
      WHERE id = v_offer.id;
  END IF;

  -- Audit log
  INSERT INTO offer_public_actions (offer_id, token, action, comment)
    VALUES (v_offer.id, p_token, v_action, p_comment);

  -- ── L-1: Auto-create v2_project on ACCEPT (idempotent) ───────────────────
  IF v_action = 'ACCEPT' THEN
    IF NOT EXISTS (
      SELECT 1 FROM v2_projects WHERE source_offer_id = v_offer.id
    ) THEN
      INSERT INTO v2_projects (
        user_id,
        client_id,
        source_offer_id,
        title,
        status,
        total_from_offer
      ) VALUES (
        v_offer.user_id,
        v_offer.client_id,
        v_offer.id,
        COALESCE(v_offer.title, 'Projekt z oferty'),
        'ACTIVE',
        v_offer.total_gross
      )
      RETURNING id INTO v_project_id;
    ELSE
      SELECT id INTO v_project_id
        FROM v2_projects
        WHERE source_offer_id = v_offer.id
        LIMIT 1;
    END IF;
  END IF;

  -- ── L-2: Notify offer owner on ACCEPT / REJECT ────────────────────────────
  INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      v_offer.user_id,
      CASE WHEN v_action = 'ACCEPT'
        THEN 'Oferta zaakceptowana'
        ELSE 'Oferta odrzucona'
      END,
      CASE WHEN v_action = 'ACCEPT'
        THEN 'Klient zaakceptował ofertę' ||
             COALESCE(' "' || v_offer.title || '"', '') || '.'
        ELSE 'Klient odrzucił ofertę' ||
             COALESCE(' "' || v_offer.title || '"', '') || '.' ||
             CASE
               WHEN p_comment IS NOT NULL AND p_comment <> ''
                 THEN ' Komentarz: ' || p_comment
               ELSE ''
             END
      END,
      CASE WHEN v_action = 'ACCEPT' THEN 'success' ELSE 'warning' END,
      '/app/offers/' || v_offer.id::text
    );

  RETURN jsonb_build_object(
    'success', true,
    'status',  CASE WHEN v_action = 'ACCEPT' THEN 'ACCEPTED' ELSE 'REJECTED' END
  ) || CASE
    WHEN v_action = 'ACCEPT' AND v_project_id IS NOT NULL
      THEN jsonb_build_object('project_id', v_project_id)
    ELSE '{}'::jsonb
  END;
END;
$$;

COMMENT ON FUNCTION public.process_offer_acceptance_action(uuid, text, text, uuid)
  IS 'Public (anon key) ACCEPT/REJECT/CANCEL_ACCEPT via canonical acceptance token. '
     'WITHDRAW requires authenticated JWT (auth.uid() = offer.user_id). '
     'SECURITY DEFINER. '
     'Original: PR-12 (2026-03-01). '
     'ARCH-03 (2026-04-15): L-1 v2_project auto-create + L-2 notifications. '
     'ARCH-05 (2026-04-19): L-6 accept_token 1-click accept. '
     'ARCH-06 (2026-04-19): L-3 CANCEL_ACCEPT (10-min window) + L-4 WITHDRAW (JWT).';

-- ── 3. resolve_legacy_to_canonical_token ─────────────────────────────────────
-- Public SECURITY DEFINER function for the 30-day redirect window.
-- Given an offer_approvals.public_token, returns the acceptance_links.token
-- for the same offer (if one exists). Returns {canonical_token: null} otherwise.
-- Callable by anon key — used by LegacyOfferRedirect page component.

CREATE OR REPLACE FUNCTION public.resolve_legacy_to_canonical_token(
  p_legacy_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_canonical_token uuid;
BEGIN
  SELECT al.token INTO v_canonical_token
  FROM offer_approvals oa
  JOIN acceptance_links al ON al.offer_id = oa.offer_id
  WHERE oa.public_token = p_legacy_token
    AND oa.offer_id IS NOT NULL
  ORDER BY al.created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object('canonical_token', v_canonical_token);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_legacy_to_canonical_token TO anon, authenticated;

COMMENT ON FUNCTION public.resolve_legacy_to_canonical_token IS
  'Redirect helper: looks up the canonical acceptance_links.token for a given '
  'offer_approvals.public_token. Returns {canonical_token: uuid} or '
  '{canonical_token: null} when no canonical link exists for that offer. '
  'Used by LegacyOfferRedirect page for the 30-day backward-compat redirect window. '
  'ARCH-06 (PR-CANON-06, 2026-04-19).';
