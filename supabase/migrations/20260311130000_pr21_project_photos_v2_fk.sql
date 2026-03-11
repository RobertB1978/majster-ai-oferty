-- ============================================================
-- PR-21: Project Photos — v2_projects FK fix + photo upload MVP
-- Branch: claude/add-photo-upload-HkaLh
-- Date: 2026-03-11
-- ============================================================
--
-- Problem:
--   project_photos.project_id has FK → public.projects(id) (legacy table).
--   usePhotoReport (PR-15) inserts rows with v2_projects.id as project_id.
--   This causes a FK violation on every photo upload from ProjectHub.
--
-- Fix:
--   1. Drop the legacy FK constraint on project_photos.project_id.
--   2. Make project_id nullable (old rows keep their value; new v2 rows omit it).
--   3. Add v2_project_id column with FK → v2_projects(id) ON DELETE CASCADE.
--   4. Add indexes for fast lookup by v2_project_id (and phase).
--   5. Add photo count constraint (max 10 photos per v2 project) via trigger.
--
-- Backward-compat:
--   - Old project_photos rows (AI estimation, legacy projects) keep project_id value.
--   - Photos.tsx page still works: it selects by user_id (RLS), not by FK.
--   - The legacy project_id column is left in place (nullable) — no data loss.
--
-- Security:
--   - RLS policies on project_photos are unchanged (user_id = auth.uid()).
--   - Storage bucket policies are unchanged.
-- ============================================================

-- ── 1. Drop legacy FK constraint ──────────────────────────────────────────────

ALTER TABLE public.project_photos
  DROP CONSTRAINT IF EXISTS project_photos_project_id_fkey;

-- ── 2. Make project_id nullable (backward compat) ────────────────────────────

ALTER TABLE public.project_photos
  ALTER COLUMN project_id DROP NOT NULL;

-- ── 3. Add v2_project_id column ──────────────────────────────────────────────

ALTER TABLE public.project_photos
  ADD COLUMN IF NOT EXISTS v2_project_id uuid NULL
    REFERENCES public.v2_projects(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.project_photos.v2_project_id
  IS 'FK to v2_projects. Used by ProjectHub photo report (PR-21). Nullable for backward compat with legacy rows.';

-- ── 4. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_project_photos_v2_project_id
  ON public.project_photos (v2_project_id);

CREATE INDEX IF NOT EXISTS idx_project_photos_v2_project_phase
  ON public.project_photos (v2_project_id, phase)
  WHERE v2_project_id IS NOT NULL;

-- ── 5. Max 10 photos per v2 project (trigger-based guard) ────────────────────

CREATE OR REPLACE FUNCTION public.project_photos_check_v2_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_count integer;
BEGIN
  -- Only enforce for v2 photo rows
  IF NEW.v2_project_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
    FROM public.project_photos
   WHERE v2_project_id = NEW.v2_project_id;

  IF v_count >= 10 THEN
    RAISE EXCEPTION 'photo_limit_exceeded'
      USING DETAIL = 'Project already has 10 photos. Delete one before adding more.',
            ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_photos_v2_limit ON public.project_photos;

CREATE TRIGGER project_photos_v2_limit
  BEFORE INSERT ON public.project_photos
  FOR EACH ROW EXECUTE FUNCTION public.project_photos_check_v2_limit();

COMMENT ON FUNCTION public.project_photos_check_v2_limit()
  IS 'Rejects inserts when v2_project already has >= 10 photos. PR-21.';

-- ── END PR-21 ─────────────────────────────────────────────────────────────────
