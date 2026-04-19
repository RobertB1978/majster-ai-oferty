-- ============================================================
-- PR-COMM-01: acceptance_links schema parity fix
-- Branch: claude/fix-acceptance-links-schema-gxs8t
-- Date: 2026-04-19
-- ============================================================
--
-- Problem: Migrations 20260403150000 and 20260403160000 reference
-- columns that were never added in any prior migration:
--   - views        (referenced: SET views = views + 1)
--   - last_viewed_at (referenced: SET last_viewed_at = now())
--   - updated_at   (referenced: SET updated_at = now())
--
-- Fix: Additive, idempotent ALTER TABLE statements.
-- Safe to apply when columns already exist in production (IF NOT EXISTS).
--
-- Rollback:
--   ALTER TABLE public.acceptance_links DROP COLUMN IF EXISTS views;
--   ALTER TABLE public.acceptance_links DROP COLUMN IF EXISTS last_viewed_at;
--   ALTER TABLE public.acceptance_links DROP COLUMN IF EXISTS updated_at;
-- ============================================================

ALTER TABLE public.acceptance_links
  ADD COLUMN IF NOT EXISTS views         integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.acceptance_links.views IS 'Number of times the public acceptance page was loaded. Bumped by resolve_offer_acceptance_link().';
COMMENT ON COLUMN public.acceptance_links.last_viewed_at IS 'Timestamp of the most recent page view. NULL until first view.';
COMMENT ON COLUMN public.acceptance_links.updated_at IS 'Last modification timestamp. Updated by upsert_acceptance_link() on token refresh.';
