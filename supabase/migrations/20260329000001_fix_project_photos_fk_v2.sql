-- ============================================================
-- Fix: project_photos FK — point to v2_projects instead of projects
-- Branch: claude/fix-photo-report-upload-WAJ9e
-- Date: 2026-03-29
-- ============================================================
--
-- Problem:
--   project_photos.project_id has FK → public.projects(id)  (old table)
--   Photo Report V2 (PR-15) inserts rows with IDs from v2_projects.
--   Result: every upload fails with FK violation → "Upload failed" toast,
--   no DB record saved, "No Photos Yet" after page reload.
--
-- Fix:
--   1. Drop old FK constraint (references legacy projects table)
--   2. Add new FK constraint referencing v2_projects(id) with NOT VALID
--      to avoid breaking legacy rows that pointed to old projects IDs.
--
-- Safety:
--   - NOT VALID skips validation of existing rows (avoids breaking old data)
--   - New INSERT/UPDATE rows ARE validated against v2_projects(id)
--   - ON DELETE CASCADE preserved: deleting a v2_project cleans up its photos
--   - Idempotent: DROP CONSTRAINT IF EXISTS is safe to re-run
-- ============================================================

-- ── 1. Drop old FK (projects → v2_projects) ──────────────────────────────────

ALTER TABLE public.project_photos
  DROP CONSTRAINT IF EXISTS project_photos_project_id_fkey;

-- ── 2. Add new FK to v2_projects (NOT VALID = skip existing legacy rows) ──────
-- Wrapped in DO/EXCEPTION to be idempotent if constraint was manually added.

DO $$
BEGIN
  ALTER TABLE public.project_photos
    ADD CONSTRAINT project_photos_project_id_v2_fkey
    FOREIGN KEY (project_id)
    REFERENCES public.v2_projects(id) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON CONSTRAINT project_photos_project_id_v2_fkey
  ON public.project_photos
  IS 'FK to v2_projects. NOT VALID preserves pre-PR-15 legacy rows. Fixed in fix-photo-report-upload-WAJ9e.';
