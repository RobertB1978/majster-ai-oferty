-- =============================================================================
-- SEC-01: Harden public offer approval access — least-privilege anon model
-- Date:   2026-04-13
-- PR:     pr-sec-01-harden-public-offer-ItF0m
-- =============================================================================
--
-- PROBLEM (verbatim current RLS policy — lines 554-563 of migration
--          20251207110925_fd116312-a252-4680-870a-632e137bf7ef.sql):
--
--   CREATE POLICY "Public can view pending offers by valid token"
--   ON public.offer_approvals FOR SELECT TO anon
--   USING ((status = 'pending') AND (public_token IS NOT NULL)
--          AND public.validate_offer_token(public_token));
--
--   VULNERABILITY: The USING clause calls validate_offer_token(public_token)
--   where public_token refers to the *current row's own column*, not to any
--   token supplied by the caller.  The function checks:
--     EXISTS (SELECT 1 FROM offer_approvals WHERE public_token = _token ...)
--   A row's own token always validates itself → USING evaluates to TRUE for
--   every pending, non-expired row in the table.
--
--   IMPACT: Any anonymous client can execute:
--     SELECT * FROM offer_approvals        -- without a WHERE clause
--   and receive ALL pending offer rows, including client PII (client_name,
--   client_email), accept_token (usable for 1-click forgery), and signature_data.
--
--   The companion UPDATE policy is equally broken: any anon user can set
--   any pending offer's status to 'approved' or 'rejected'.
--
-- ROOT CAUSE: Application-layer filtering (WHERE public_token = $1) is NOT a
-- security control.  Postgres RLS USING clauses are evaluated per-row against
-- stored column values; they cannot read the client's query predicates.
--
-- FIX (Option B — Dedicated SECURITY DEFINER function):
--   1. DROP both broken anon policies on offer_approvals
--   2. CREATE get_offer_approval_by_token(p_token uuid) SECURITY DEFINER:
--        - Takes the caller-provided token as a parameter
--        - Performs exact lookup: WHERE public_token = p_token
--        - Validates expiry server-side
--        - Returns ONLY minimal display fields; never exposes accept_token,
--          signature_data, user_id, project_id, or internal IDs
--        - Wrong/absent token → {"error":"not_found"}
--        - Expired token       → {"error":"expired"}
--   3. CREATE record_offer_viewed_by_token(p_token uuid) SECURITY DEFINER:
--        - Idempotent view-tracking (pending/sent → viewed, first call only)
--   4. REVOKE direct anon EXECUTE on validate_offer_token (defense-in-depth)
--   5. GRANT new functions to anon
--
-- BACKWARD COMPATIBILITY:
--   - The approve-offer Edge Function uses service_role key → unaffected by RLS.
--   - OfferPublicAccept (/a/:token) uses resolve_offer_acceptance_link RPC → unaffected.
--   - OfferApproval (/ap/:token) and OfferPublicPage (/o/:token) are updated in
--     this PR to call get_offer_approval_by_token instead of direct table queries.
-- =============================================================================

-- ── 1. Drop broken anon policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Public can view pending offers by valid token"
  ON public.offer_approvals;

DROP POLICY IF EXISTS "Public can update pending offers with valid token"
  ON public.offer_approvals;

-- ── 2. SECURITY DEFINER read function ────────────────────────────────────────
--      Returns minimal display payload; never exposes sensitive columns.
CREATE OR REPLACE FUNCTION public.get_offer_approval_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row     offer_approvals%ROWTYPE;
  v_project record;
  v_quote   record;
  v_company record;
BEGIN
  -- Exact token lookup (uses idx_offer_approvals_public_token index).
  -- Only one LIMIT 1 needed because public_token has a UNIQUE constraint.
  SELECT * INTO v_row
  FROM public.offer_approvals
  WHERE public_token = p_token
  LIMIT 1;

  -- Uniform "not found" for any absent or malformed token.
  -- No timing side-channel beyond the single indexed lookup.
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- Link-level TTL expiry (expires_at = 30-day token lifetime set at creation).
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- Offer validity window (valid_until = optional contractor-set deadline).
  -- Only applies to actionable states; accepted/rejected rows remain visible.
  IF v_row.valid_until IS NOT NULL
     AND v_row.valid_until < now()
     AND v_row.status NOT IN ('accepted','approved','rejected','expired','withdrawn')
  THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- Related legacy project — minimal display fields only.
  SELECT project_name, status INTO v_project
  FROM public.projects
  WHERE id = v_row.project_id
  LIMIT 1;

  -- Related quote — total and positions for line-item display.
  SELECT total, positions INTO v_quote
  FROM public.quotes
  WHERE project_id = v_row.project_id
  LIMIT 1;

  -- Company profile — display-only contact fields.
  -- Excluded: legal_form, nip, regon, krs, representative_*, street, postal_code,
  --           city, email_for_offers, logo_url, and all financial columns.
  SELECT company_name, owner_name, phone, contact_email INTO v_company
  FROM public.profiles
  WHERE user_id = v_row.user_id
  LIMIT 1;

  -- Return minimal display payload.
  --
  -- Deliberately EXCLUDED columns (never returned to anonymous callers):
  --   public_token    — caller already holds it; returning it is redundant exposure
  --   accept_token    — used only by approve-offer Edge Function (service_role)
  --   signature_data  — stored document; not needed for offer display
  --   user_id         — internal FK; exposes contractor identity
  --   project_id      — internal FK
  --   offer_id        — internal FK
  --   v2_project_id   — internal FK
  --   expires_at      — link TTL; not a UI concern
  --   client_comment  — not displayed on the public page
  RETURN jsonb_build_object(
    'id',           v_row.id,
    'status',       v_row.status,
    'client_name',  v_row.client_name,
    'client_email', v_row.client_email,
    'created_at',   v_row.created_at,
    'valid_until',  v_row.valid_until,
    'viewed_at',    v_row.viewed_at,
    'accepted_at',  v_row.accepted_at,
    'approved_at',  v_row.approved_at,
    'accepted_via', v_row.accepted_via,
    'withdrawn_at', v_row.withdrawn_at,
    'project', CASE
      WHEN v_project.project_name IS NOT NULL THEN
        jsonb_build_object(
          'project_name', v_project.project_name,
          'status',       v_project.status
        )
      ELSE NULL
    END,
    'quote', CASE
      WHEN v_quote.total IS NOT NULL THEN
        jsonb_build_object(
          'total',     v_quote.total,
          'positions', COALESCE(to_jsonb(v_quote.positions), '[]'::jsonb)
        )
      ELSE NULL
    END,
    'company', CASE
      WHEN v_company.company_name IS NOT NULL THEN
        jsonb_build_object(
          'company_name',  v_company.company_name,
          'owner_name',    v_company.owner_name,
          'phone',         v_company.phone,
          'contact_email', v_company.contact_email
        )
      ELSE NULL
    END
  );
END;
$$;

COMMENT ON FUNCTION public.get_offer_approval_by_token(uuid) IS
  'SEC-01: Public (anon key) read of legacy offer approval via exact public_token match. '
  'SECURITY DEFINER — bypasses RLS safely; all access is scoped to the supplied token. '
  'Returns minimal display fields only. Never exposes accept_token, signature_data, '
  'user_id, project_id, offer_id, v2_project_id, or expires_at. '
  'Missing/wrong token → {"error":"not_found"}. '
  'Expired link or offer → {"error":"expired"}.';

GRANT EXECUTE ON FUNCTION public.get_offer_approval_by_token(uuid) TO anon;

-- ── 3. SECURITY DEFINER view-tracking function ───────────────────────────────
--      Fire-and-forget; idempotent; errors are swallowed by the caller.
CREATE OR REPLACE FUNCTION public.record_offer_viewed_by_token(p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row offer_approvals%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM public.offer_approvals
  WHERE public_token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN; -- Silent no-op for unknown token
  END IF;

  IF v_row.viewed_at IS NOT NULL THEN
    RETURN; -- Already viewed — idempotent
  END IF;

  IF v_row.status NOT IN ('sent', 'pending') THEN
    RETURN; -- Not in a transitionable state
  END IF;

  -- UPDATE with both application-level and DB-level idempotency guards.
  -- The WHERE clause prevents a race condition between the check above and
  -- this update (two simultaneous first-opens).
  UPDATE public.offer_approvals
  SET    viewed_at = now(),
         status    = 'viewed'
  WHERE  id        = v_row.id
    AND  viewed_at IS NULL
    AND  status    IN ('sent', 'pending');
END;
$$;

COMMENT ON FUNCTION public.record_offer_viewed_by_token(uuid) IS
  'SEC-01: Fire-and-forget view tracking for public offer page. '
  'Idempotent: only transitions status pending/sent → viewed on the first call. '
  'Unknown token and already-viewed offers are silently ignored.';

GRANT EXECUTE ON FUNCTION public.record_offer_viewed_by_token(uuid) TO anon;

-- ── 4. Revoke direct anon access to validate_offer_token ─────────────────────
-- Defense-in-depth: this function was only ever used by the now-dropped RLS
-- policies.  Explicit REVOKE prevents accidental re-grant in future migrations.
REVOKE EXECUTE ON FUNCTION public.validate_offer_token(uuid) FROM anon;
