-- ============================================================
-- ARCH-05: Close L-6 (accept_token one-click email accept)
--          in the canonical public offer acceptance flow.
--
-- PR:     PR-CANON-05
-- Date:   2026-04-19
-- Branch: claude/canonical-status-accept-token-a78Mr
--
-- Background:
--   COMPATIBILITY_MATRIX L-6 (OPEN): process_offer_acceptance_action must
--   handle accept_token for 1-click accept from email.
--   The legacy flow (approve-offer Edge Function) already supports this via
--   offer_approvals.accept_token. This migration brings parity to the
--   canonical flow (/a/:token + acceptance_links).
--
-- Changes:
--   1. ADD COLUMN acceptance_links.accept_token — separate UUID used only for
--      1-click accept from email (different from the public view token).
--   2. UPDATE upsert_acceptance_link — generates and returns accept_token.
--      Regenerated on each call so old email links are invalidated on refresh.
--   3. UPDATE process_offer_acceptance_action — add optional p_accept_token
--      parameter. When provided, validates it and forces ACCEPT action.
--      Backward compatible: p_accept_token DEFAULT NULL.
--
-- Security:
--   - accept_token is only readable by the authenticated offer owner (RLS).
--   - Public anon key can call process_offer_acceptance_action with
--     p_accept_token, but the value must match the stored secret.
--   - Wrong accept_token returns {error: 'invalid_accept_token'} — no hint.
--   - Accept token is regenerated on upsert — old email 1-click links expire
--     when the contractor refreshes the acceptance link.
--
-- Idempotency:
--   - ADD COLUMN IF NOT EXISTS — safe to run multiple times.
--   - CREATE OR REPLACE — replaces the function, no DROP needed.
--   - UPDATE SET accept_token = gen_random_uuid() WHERE accept_token IS NULL
--     is a defensive backfill for any rows without a value.
--
-- Rollback:
--   1. Revert process_offer_acceptance_action to ARCH-03 version (3-param).
--   2. Revert upsert_acceptance_link to 20260403160000 version.
--   3. ALTER TABLE acceptance_links DROP COLUMN IF EXISTS accept_token;
-- ============================================================

-- ── 1. Add accept_token column to acceptance_links ───────────────────────────

ALTER TABLE public.acceptance_links
  ADD COLUMN IF NOT EXISTS accept_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Unique index: fast lookup + ensures no two links share the same accept_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_acceptance_links_accept_token
  ON public.acceptance_links (accept_token);

-- Defensive backfill for rows that received a NULL before NOT NULL was enforced
-- (harmless no-op when all rows already have a value)
UPDATE public.acceptance_links
  SET accept_token = gen_random_uuid()
  WHERE accept_token IS NULL;

COMMENT ON COLUMN public.acceptance_links.accept_token IS
  '1-click accept token for email (separate from the public view token). '
  'Included in email as ?t=<accept_token>. Regenerated on each upsert. '
  'ARCH-05 (PR-CANON-05, 2026-04-19).';

-- ── 2. Update upsert_acceptance_link to include accept_token ─────────────────
-- Signature unchanged except new optional p_accept_token param (backward compat).
-- On refresh (UPDATE branch), accept_token is regenerated — invalidates old emails.

CREATE OR REPLACE FUNCTION public.upsert_acceptance_link(
  p_offer_id        UUID,
  p_user_id         UUID,
  p_token           UUID DEFAULT gen_random_uuid(),
  p_expires_at      TIMESTAMPTZ DEFAULT now() + INTERVAL '30 days',
  p_accept_token    UUID DEFAULT gen_random_uuid()
)
RETURNS acceptance_links
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO acceptance_links (offer_id, user_id, token, expires_at, accept_token)
  VALUES (p_offer_id, p_user_id, p_token, p_expires_at, p_accept_token)
  ON CONFLICT (offer_id)
  DO UPDATE SET
    token        = EXCLUDED.token,
    expires_at   = EXCLUDED.expires_at,
    accept_token = EXCLUDED.accept_token,
    updated_at   = now()
  RETURNING *;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_acceptance_link TO authenticated;

COMMENT ON FUNCTION public.upsert_acceptance_link IS
  'Atomic UPSERT for acceptance_links. Eliminates DELETE+INSERT race condition. '
  'Returns full row including accept_token for 1-click email links. '
  'Original: 20260403160000. ARCH-05 (2026-04-19): added accept_token support.';

-- ── 3. Update process_offer_acceptance_action with p_accept_token ────────────
-- New 4th parameter p_accept_token UUID DEFAULT NULL — fully backward compatible.
-- When provided: validates it against acceptance_links.accept_token and forces
-- the action to ACCEPT (no p_action validation needed).
-- All existing callers that omit p_accept_token are unaffected.

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
  -- Determine effective action (may be overridden by valid accept_token)
  v_action := p_action;

  -- Validate action when not using accept_token path
  IF p_accept_token IS NULL AND p_action NOT IN ('ACCEPT', 'REJECT') THEN
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
  -- When p_accept_token is supplied, it must match the stored secret.
  -- A match forces v_action = 'ACCEPT' regardless of p_action value.
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

  -- Idempotency gate: already decided — short-circuit before any side-effects
  IF v_offer.status IN ('ACCEPTED', 'REJECTED') THEN
    RETURN jsonb_build_object(
      'success',    true,
      'idempotent', true,
      'status',     v_offer.status
    );
  END IF;

  -- Only SENT offers can be decided
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

  -- Record action in audit log
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
  IS 'Public (anon key) ACCEPT/REJECT via canonical acceptance token. SECURITY DEFINER. '
     'Original: PR-12 (2026-03-01). '
     'ARCH-03 (2026-04-15): added L-1 (idempotent v2_project auto-create on ACCEPT) '
     'and L-2 (in-app notification INSERT for offer owner on ACCEPT/REJECT). '
     'ARCH-05 (2026-04-19): added L-6 (p_accept_token one-click accept from email).';
