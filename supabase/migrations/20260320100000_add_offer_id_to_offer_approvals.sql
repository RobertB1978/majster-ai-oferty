-- ============================================================
-- PR-09-fix: Add offer_id FK to offer_approvals
-- Fixes K-1 audit bug: source_offer_id FK violation
--
-- Problem:
--   approve-offer edge function passed approval.id (offer_approvals.id)
--   into v2_projects.source_offer_id which has FK to offers(id).
--   This caused a 23503 FK violation on every offer acceptance.
--
-- Fix:
--   1. Add offer_id column to offer_approvals with FK to offers(id).
--   2. Backfill existing rows via acceptance_links (offer_id → offer_approvals
--      through project_id matching).
--   3. Edge function now reads approval.offer_id and passes it to
--      v2_projects.source_offer_id.
-- ============================================================

-- 1. Add nullable offer_id column with FK to offers
ALTER TABLE public.offer_approvals
  ADD COLUMN IF NOT EXISTS offer_id uuid NULL
    REFERENCES public.offers(id) ON DELETE SET NULL;

-- 2. Index for lookups
CREATE INDEX IF NOT EXISTS idx_offer_approvals_offer_id
  ON public.offer_approvals (offer_id)
  WHERE offer_id IS NOT NULL;

-- 3. Backfill from acceptance_links where possible
--    acceptance_links has (offer_id, user_id) and offer_approvals has (user_id, project_id).
--    offers also has (project_id) so we can join through offers directly.
UPDATE public.offer_approvals oa
SET offer_id = o.id
FROM public.offers o
WHERE o.project_id = oa.project_id
  AND o.user_id = oa.user_id
  AND oa.offer_id IS NULL;

-- 4. Backfill v2_projects.source_offer_id for existing accepted approvals
--    that already have a v2_project_id linked but source_offer_id is NULL.
UPDATE public.v2_projects vp
SET source_offer_id = oa.offer_id
FROM public.offer_approvals oa
WHERE oa.v2_project_id = vp.id
  AND oa.offer_id IS NOT NULL
  AND vp.source_offer_id IS NULL;

COMMENT ON COLUMN public.offer_approvals.offer_id IS
  'FK to offers(id) — the actual offer this approval is for. '
  'Added by PR-09-fix to close the schema gap that caused FK violations '
  'when creating v2_projects with source_offer_id.';
