-- ============================================================
-- ARCH-03: Close L-1 (auto-create v2_projects) and L-2 (notifications)
--          gaps in process_offer_acceptance_action (FLOW-B canonical)
--
-- PR:     PR-ARCH-03
-- Date:   2026-04-15
-- Branch: claude/arch-03-close-remaining-gaps-GKpt1
--
-- Background:
--   process_offer_acceptance_action was created in PR-12 (2026-03-01).
--   PR-ARCH-01/02 designated FLOW-B (/a/:token) as canonical and documented
--   two P0 gaps (L-1, L-2) that prevented full deprecation of legacy routes.
--   This migration closes both gaps.
--
-- Changes:
--   L-1: On ACCEPT → idempotent INSERT INTO v2_projects (source_offer_id = offer.id)
--        Priority: P0 (COMPATIBILITY_MATRIX line 143, ADR-0014 line 122)
--   L-2: On ACCEPT/REJECT → INSERT INTO notifications for the offer owner
--        Priority: P0 (COMPATIBILITY_MATRIX line 144, ADR-0014 line 123)
--
-- Idempotency:
--   L-1: Guard "IF NOT EXISTS (v2_projects WHERE source_offer_id = v_offer.id)"
--        Ensures at most one project per source offer, even on retry.
--   L-2: Always inserts a new notification — a client action is a unique event.
--        The outer idempotency gate (status already ACCEPTED/REJECTED short-circuits
--        before reaching L-2) prevents duplicate notifications on accidental retry.
--
-- Security:
--   SECURITY DEFINER (unchanged from PR-12). The function runs with the privilege
--   of its defining role (postgres), which bypasses RLS for the inserts into
--   v2_projects and notifications — both are intentional trusted server-side writes.
--
-- Rollback plan:
--   git revert <arch-03-commit-sha>
--   The previous function definition (PR-12 body) is preserved in git history.
--   After revert: v2_projects auto-creation and notifications will stop, but
--   already-created records are not removed (requires separate cleanup if needed).
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_offer_acceptance_action(
  p_token   uuid,
  p_action  text,
  p_comment text DEFAULT NULL
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
BEGIN
  -- Validate action
  IF p_action NOT IN ('ACCEPT', 'REJECT') THEN
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
  IF p_action = 'ACCEPT' THEN
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
    VALUES (v_offer.id, p_token, p_action, p_comment);

  -- ── L-1: Auto-create v2_project on ACCEPT (idempotent) ──────────────────────
  -- Creates an ACTIVE project linked to this offer if one does not already exist.
  -- source_offer_id column (nullable FK) is the idempotency key.
  IF p_action = 'ACCEPT' THEN
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
      -- Already exists (idempotent retry): return the existing project id
      SELECT id INTO v_project_id
        FROM v2_projects
        WHERE source_offer_id = v_offer.id
        LIMIT 1;
    END IF;
  END IF;

  -- ── L-2: Notify offer owner on ACCEPT / REJECT ───────────────────────────────
  -- In-app notification inserted directly for the contractor who owns this offer.
  -- type values: 'success' | 'warning' | 'info' | 'error' (see useNotifications.ts)
  INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      v_offer.user_id,
      CASE WHEN p_action = 'ACCEPT'
        THEN 'Oferta zaakceptowana'
        ELSE 'Oferta odrzucona'
      END,
      CASE WHEN p_action = 'ACCEPT'
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
      CASE WHEN p_action = 'ACCEPT' THEN 'success' ELSE 'warning' END,
      '/app/offers/' || v_offer.id::text
    );

  -- Return result; on ACCEPT include project_id for optional client-side use
  RETURN jsonb_build_object(
    'success', true,
    'status',  CASE WHEN p_action = 'ACCEPT' THEN 'ACCEPTED' ELSE 'REJECTED' END
  ) || CASE
    WHEN p_action = 'ACCEPT' AND v_project_id IS NOT NULL
      THEN jsonb_build_object('project_id', v_project_id)
    ELSE '{}'::jsonb
  END;
END;
$$;

COMMENT ON FUNCTION public.process_offer_acceptance_action(uuid, text, text)
  IS 'Public (anon key) ACCEPT/REJECT via canonical acceptance token. SECURITY DEFINER. '
     'Original: PR-12 (2026-03-01). '
     'ARCH-03 (2026-04-15): added L-1 (idempotent v2_project auto-create on ACCEPT) '
     'and L-2 (in-app notification INSERT for offer owner on ACCEPT/REJECT).';
