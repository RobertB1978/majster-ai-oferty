-- ============================================================
-- PR-LEGAL-09: Signature parity for canonical public acceptance
--
-- PR:     PR-LEGAL-09
-- Date:   2026-04-20
-- Branch: claude/signature-parity-acceptance-TPXKd
--
-- Background:
--   Legacy flows (/offer/:token, /oferta/:token) already capture a client
--   signature via SignatureCanvas and store it in offer_approvals.signature_data.
--   The canonical /a/:token flow (ARCH-01, PR-12) lacked this capability.
--   This migration brings parity: captured acceptance signatures can now be
--   persisted in the canonical flow's audit table.
--
-- Changes:
--   1. ADD COLUMN offer_public_actions.signature_data text NULL
--      Additive, nullable — existing rows unaffected; backward compatible.
--   2. CREATE OR REPLACE process_offer_acceptance_action — add optional
--      p_signature_data text DEFAULT NULL parameter. Existing callers that
--      omit this param are fully unaffected (DEFAULT NULL).
--
-- Security:
--   - signature_data stored as base64 PNG data URL (same as legacy approach).
--   - No eIDAS claims; column comment explicitly limits scope.
--   - Truncated at 500 KB client-side; stored as-is (no processing in DB).
--   - RLS on offer_public_actions: owner SELECT only; writes via SECURITY DEFINER.
--
-- Idempotency:
--   ADD COLUMN IF NOT EXISTS — safe to re-run.
--   CREATE OR REPLACE — replaces function without DROP.
--
-- Rollback:
--   1. Revert process_offer_acceptance_action to ARCH-06 version.
--   2. ALTER TABLE offer_public_actions DROP COLUMN signature_data;
-- ============================================================

-- ── 1. Add signature_data column to offer_public_actions ──────────────────────

ALTER TABLE public.offer_public_actions
  ADD COLUMN IF NOT EXISTS signature_data text;

COMMENT ON COLUMN public.offer_public_actions.signature_data IS
  'Optional base64 PNG data URL of client acceptance signature. '
  'Captures acceptance artifact only — no eIDAS / legal claims. '
  'PR-LEGAL-09 (2026-04-20).';

-- ── 2. Update process_offer_acceptance_action ────────────────────────────────
-- Adds optional p_signature_data parameter stored in the audit record on ACCEPT.
-- Fully backward compatible: all existing call sites omit the param → DEFAULT NULL.

CREATE OR REPLACE FUNCTION public.process_offer_acceptance_action(
  p_token          uuid,
  p_action         text,
  p_comment        text DEFAULT NULL,
  p_accept_token   uuid DEFAULT NULL,
  p_signature_data text DEFAULT NULL
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
  IF v_action = 'CANCEL_ACCEPT' THEN
    IF v_offer.status <> 'ACCEPTED' THEN
      RETURN jsonb_build_object('error', 'not_accepted');
    END IF;
    IF v_offer.accepted_at IS NULL
       OR now() - v_offer.accepted_at > INTERVAL '10 minutes' THEN
      RETURN jsonb_build_object('error', 'cancel_window_expired');
    END IF;

    UPDATE offers
      SET status = 'SENT', accepted_at = NULL
      WHERE id = v_offer.id;

    INSERT INTO offer_public_actions (offer_id, token, action, comment)
      VALUES (v_offer.id, p_token, 'CANCEL_ACCEPT', p_comment);

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

  -- Audit log — include signature_data on ACCEPT (NULL on REJECT, always optional)
  INSERT INTO offer_public_actions (offer_id, token, action, comment, signature_data)
    VALUES (
      v_offer.id,
      p_token,
      v_action,
      p_comment,
      CASE WHEN v_action = 'ACCEPT' THEN p_signature_data ELSE NULL END
    );

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

COMMENT ON FUNCTION public.process_offer_acceptance_action(uuid, text, text, uuid, text)
  IS 'Public (anon key) ACCEPT/REJECT/CANCEL_ACCEPT via canonical acceptance token. '
     'WITHDRAW requires authenticated JWT (auth.uid() = offer.user_id). '
     'p_signature_data: optional base64 PNG of client acceptance signature (PR-LEGAL-09). '
     'SECURITY DEFINER. '
     'Original: PR-12 (2026-03-01). '
     'ARCH-03 (2026-04-15): L-1 v2_project auto-create + L-2 notifications. '
     'ARCH-05 (2026-04-19): L-6 accept_token 1-click accept. '
     'ARCH-06 (2026-04-19): L-3 CANCEL_ACCEPT (10-min window) + L-4 WITHDRAW (JWT). '
     'PR-LEGAL-09 (2026-04-20): p_signature_data — optional acceptance signature.';
