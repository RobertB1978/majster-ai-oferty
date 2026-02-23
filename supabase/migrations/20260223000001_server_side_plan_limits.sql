-- =============================================================================
-- Migration: Server-side plan limit enforcement (P0)
-- Date:      2026-02-23
-- Purpose:   Enforce plan-based resource quotas at the database layer so that
--            limits cannot be bypassed via direct API calls or client-side
--            tampering.
--
-- Resources enforced:
--   • projects        (BEFORE INSERT trigger)
--   • offer_approvals (BEFORE INSERT trigger)
--   • clients         (BEFORE INSERT trigger)
--
-- Error contract:
--   Every violation raises EXCEPTION with MESSAGE = 'PLAN_LIMIT_REACHED'.
--   The frontend can reliably detect this via error.message.
--
-- Rollback: see docs/ops/plan-limits.md → "Rollback procedure"
-- =============================================================================

BEGIN;

-- ============================================================================
-- 1.  PLAN LIMITS TABLE
--     Authoritative server-side mapping: plan_id → numeric resource limits.
--     Mirrors the constants in src/hooks/usePlanGate.ts  (PLAN_LIMITS).
--     Values here are the source of truth for enforcement; client constants
--     are UI-only hints and will converge on these values.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan_id      TEXT    PRIMARY KEY
                         CHECK (plan_id IN ('free','pro','starter','business','enterprise')),
  max_projects INTEGER NOT NULL DEFAULT 3,
  max_clients  INTEGER NOT NULL DEFAULT 5,
  max_offers   INTEGER NOT NULL DEFAULT 3
);

COMMENT ON TABLE public.plan_limits IS
  'Authoritative per-plan numeric limits. Mirrors src/hooks/usePlanGate.ts PLAN_LIMITS. '
  'Modify here when plan limits change; then update the frontend constant to match.';

COMMENT ON COLUMN public.plan_limits.max_offers IS
  'Maximum number of distinct projects for which a user may send offer_approvals. '
  'Resending an offer to the same project does NOT count against this limit.';

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- plan_limits are not sensitive – anyone may read them
DROP POLICY IF EXISTS "plan_limits_select_all" ON public.plan_limits;
CREATE POLICY "plan_limits_select_all"
  ON public.plan_limits FOR SELECT
  USING (true);

-- Seed / upsert authoritative plan data
-- integer 2147483647 = INT max  ≈  "unlimited" for all practical purposes
INSERT INTO public.plan_limits (plan_id, max_projects, max_clients, max_offers)
VALUES
  ('free',       3,           5,           3          ),
  ('pro',        15,          30,          15         ),
  ('starter',    15,          30,          15         ),
  ('business',   100,         200,         100        ),
  ('enterprise', 2147483647,  2147483647,  2147483647 )
ON CONFLICT (plan_id) DO UPDATE
  SET max_projects = EXCLUDED.max_projects,
      max_clients  = EXCLUDED.max_clients,
      max_offers   = EXCLUDED.max_offers;

-- ============================================================================
-- 2.  HELPER FUNCTION – resolve plan limits for a given user
--     SECURITY DEFINER so triggers can read user_subscriptions even when
--     invoked from a context where the calling role has no direct SELECT
--     on that table (e.g. anon-issued inserts routed through RLS).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_plan_limits(p_user_id UUID)
RETURNS public.plan_limits
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Active / trial subscription wins
  SELECT pl.*
  FROM   public.plan_limits        pl
  JOIN   public.user_subscriptions us ON us.plan_id = pl.plan_id
  WHERE  us.user_id = p_user_id
  AND    us.status  IN ('active', 'trial')

  UNION ALL

  -- Fallback: no active subscription → free tier
  SELECT pl.*
  FROM   public.plan_limits pl
  WHERE  pl.plan_id = 'free'
  AND    NOT EXISTS (
           SELECT 1
           FROM   public.user_subscriptions us
           WHERE  us.user_id = p_user_id
           AND    us.status  IN ('active', 'trial')
         )

  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_plan_limits(UUID) IS
  'Returns the plan_limits row for a user. '
  'Falls back to the "free" row when no active/trial subscription exists. '
  'SECURITY DEFINER – safe: read-only, scoped to a single user_id.';

-- ============================================================================
-- 3.  TRIGGER FUNCTION – enforce project limit
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_project_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits  public.plan_limits;
  v_count   INTEGER;
BEGIN
  SELECT * INTO v_limits
  FROM   public.get_user_plan_limits(NEW.user_id);

  SELECT COUNT(*) INTO v_count
  FROM   public.projects
  WHERE  user_id = NEW.user_id;

  IF v_count >= v_limits.max_projects THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED'
      USING
        DETAIL = format(
          'Project limit reached. Your plan allows a maximum of %s project(s). '
          'Current count: %s.',
          v_limits.max_projects, v_count
        ),
        HINT = 'Upgrade your plan to create more projects.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_project_limit() IS
  'BEFORE INSERT trigger on public.projects. '
  'Raises PLAN_LIMIT_REACHED when user has reached their plan''s max_projects quota.';

DROP TRIGGER IF EXISTS trg_enforce_project_limit ON public.projects;
CREATE TRIGGER trg_enforce_project_limit
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_project_limit();

-- ============================================================================
-- 4.  TRIGGER FUNCTION – enforce offer limit
--     Counts DISTINCT project_ids to avoid penalising resends/retries.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_offer_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits  public.plan_limits;
  v_count   INTEGER;
BEGIN
  -- Resend: this project already has an offer → always allow (no new slot used)
  IF EXISTS (
    SELECT 1
    FROM   public.offer_approvals
    WHERE  user_id   = NEW.user_id
    AND    project_id = NEW.project_id
  ) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_limits
  FROM   public.get_user_plan_limits(NEW.user_id);

  -- Count distinct projects that already have at least one offer
  SELECT COUNT(DISTINCT project_id) INTO v_count
  FROM   public.offer_approvals
  WHERE  user_id = NEW.user_id;

  IF v_count >= v_limits.max_offers THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED'
      USING
        DETAIL = format(
          'Offer limit reached. Your plan allows offers for a maximum of %s project(s). '
          'Current count: %s. Resending to an existing project is always permitted.',
          v_limits.max_offers, v_count
        ),
        HINT = 'Upgrade your plan to send offers for more projects.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_offer_limit() IS
  'BEFORE INSERT trigger on public.offer_approvals. '
  'Raises PLAN_LIMIT_REACHED when the user tries to start an offer for a new project '
  'beyond their plan''s max_offers quota. Resends to existing projects are free.';

DROP TRIGGER IF EXISTS trg_enforce_offer_limit ON public.offer_approvals;
CREATE TRIGGER trg_enforce_offer_limit
  BEFORE INSERT ON public.offer_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_offer_limit();

-- ============================================================================
-- 5.  TRIGGER FUNCTION – enforce client limit
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_client_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits  public.plan_limits;
  v_count   INTEGER;
BEGIN
  SELECT * INTO v_limits
  FROM   public.get_user_plan_limits(NEW.user_id);

  SELECT COUNT(*) INTO v_count
  FROM   public.clients
  WHERE  user_id = NEW.user_id;

  IF v_count >= v_limits.max_clients THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED'
      USING
        DETAIL = format(
          'Client limit reached. Your plan allows a maximum of %s client(s). '
          'Current count: %s.',
          v_limits.max_clients, v_count
        ),
        HINT = 'Upgrade your plan to add more clients.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_client_limit() IS
  'BEFORE INSERT trigger on public.clients. '
  'Raises PLAN_LIMIT_REACHED when user has reached their plan''s max_clients quota.';

DROP TRIGGER IF EXISTS trg_enforce_client_limit ON public.clients;
CREATE TRIGGER trg_enforce_client_limit
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_client_limit();

-- ============================================================================
-- 6.  VERIFICATION HELPER (callable to smoke-test limits without UI)
--     Usage: SELECT * FROM public.verify_plan_limits_enforced(<user_id>);
--     Returns a table of checks with PASS/FAIL status for operators.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_plan_limits_enforced(p_user_id UUID)
RETURNS TABLE (
  check_name   TEXT,
  plan_id      TEXT,
  limit_value  INTEGER,
  current_count BIGINT,
  status       TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limits public.plan_limits;
BEGIN
  SELECT * INTO v_limits
  FROM   public.get_user_plan_limits(p_user_id);

  RETURN QUERY
  SELECT
    'projects'::TEXT                                AS check_name,
    v_limits.plan_id                               AS plan_id,
    v_limits.max_projects                          AS limit_value,
    COUNT(*)                                       AS current_count,
    CASE WHEN COUNT(*) < v_limits.max_projects
         THEN 'UNDER_LIMIT'
         ELSE 'AT_OR_OVER_LIMIT'
    END                                            AS status
  FROM public.projects
  WHERE user_id = p_user_id

  UNION ALL

  SELECT
    'clients'::TEXT,
    v_limits.plan_id,
    v_limits.max_clients,
    COUNT(*),
    CASE WHEN COUNT(*) < v_limits.max_clients
         THEN 'UNDER_LIMIT'
         ELSE 'AT_OR_OVER_LIMIT'
    END
  FROM public.clients
  WHERE user_id = p_user_id

  UNION ALL

  SELECT
    'offers (distinct projects)'::TEXT,
    v_limits.plan_id,
    v_limits.max_offers,
    COUNT(DISTINCT project_id),
    CASE WHEN COUNT(DISTINCT project_id) < v_limits.max_offers
         THEN 'UNDER_LIMIT'
         ELSE 'AT_OR_OVER_LIMIT'
    END
  FROM public.offer_approvals
  WHERE user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.verify_plan_limits_enforced(UUID) IS
  'Operator smoke-test: returns current vs allowed counts for a given user. '
  'Does NOT perform inserts. Call from Supabase SQL editor or psql.';

COMMIT;
