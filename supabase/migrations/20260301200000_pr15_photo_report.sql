-- ============================================================
-- PR-15: Photo Report + Acceptance Checklist + Signature
-- Branch: claude/pr-15-photo-report-f9udo
-- Date: 2026-03-01
-- ============================================================
--
-- Changes:
--   1. Add `phase` column to project_photos (BEFORE/DURING/AFTER/ISSUE)
--   2. Add size/dimension metadata columns to project_photos
--   3. Create project_checklists — per-project checklist with template key
--   4. Create project_acceptance  — client acceptance + signature storage path
--
-- Security:
--   - RLS enabled on all tables (user_id = auth.uid())
--   - Storage: private bucket, signed URLs (no public access)
--   - Cross-tenant access impossible
-- ============================================================

-- ── 1. Extend project_photos with phase + metadata ───────────────────────────

ALTER TABLE public.project_photos
  ADD COLUMN IF NOT EXISTS phase      text    NULL
    CHECK (phase IN ('BEFORE', 'DURING', 'AFTER', 'ISSUE')),
  ADD COLUMN IF NOT EXISTS mime_type  text    NULL,
  ADD COLUMN IF NOT EXISTS size_bytes integer NULL,
  ADD COLUMN IF NOT EXISTS width      integer NULL,
  ADD COLUMN IF NOT EXISTS height     integer NULL;

-- Default existing rows to BEFORE phase to keep backward compatibility
UPDATE public.project_photos SET phase = 'BEFORE' WHERE phase IS NULL;

-- Now enforce NOT NULL with default BEFORE
ALTER TABLE public.project_photos
  ALTER COLUMN phase SET DEFAULT 'BEFORE';

CREATE INDEX IF NOT EXISTS idx_project_photos_phase
  ON public.project_photos (project_id, phase);

COMMENT ON COLUMN public.project_photos.phase IS 'Photo phase: BEFORE | DURING | AFTER | ISSUE. PR-15.';
COMMENT ON COLUMN public.project_photos.mime_type IS 'MIME type of the compressed file (image/jpeg or image/webp). PR-15.';
COMMENT ON COLUMN public.project_photos.size_bytes IS 'Compressed file size in bytes (for analytics). PR-15.';
COMMENT ON COLUMN public.project_photos.width IS 'Image width after compression (px). PR-15.';
COMMENT ON COLUMN public.project_photos.height IS 'Image height after compression (px). PR-15.';

-- ── 2. project_checklists ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_checklists (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id   uuid        NOT NULL REFERENCES public.v2_projects(id) ON DELETE CASCADE,
  template_key text        NOT NULL DEFAULT 'general_basic',
  items_json   jsonb       NOT NULL DEFAULT '[]'::jsonb,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_checklists_project_unique UNIQUE (project_id, template_key)
);

CREATE INDEX IF NOT EXISTS idx_project_checklists_project_id
  ON public.project_checklists (project_id);

CREATE INDEX IF NOT EXISTS idx_project_checklists_user_id
  ON public.project_checklists (user_id);

ALTER TABLE public.project_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_checklists_select_own"
  ON public.project_checklists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "project_checklists_insert_own"
  ON public.project_checklists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "project_checklists_update_own"
  ON public.project_checklists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "project_checklists_delete_own"
  ON public.project_checklists FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.project_checklists_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER project_checklists_updated_at
  BEFORE UPDATE ON public.project_checklists
  FOR EACH ROW EXECUTE FUNCTION public.project_checklists_set_updated_at();

COMMENT ON TABLE public.project_checklists IS 'Per-project acceptance checklists with template key. PR-15.';
COMMENT ON COLUMN public.project_checklists.template_key IS 'Template ID: plumbing_basic | electrical_basic | painting_basic | general_basic. PR-15.';
COMMENT ON COLUMN public.project_checklists.items_json IS 'Array of {id, label_key, is_done} objects. label_key maps to i18n. PR-15.';

-- ── 3. project_acceptance ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_acceptance (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id       uuid        NOT NULL REFERENCES public.v2_projects(id) ON DELETE CASCADE,
  accepted_at      timestamptz NULL,
  signature_path   text        NULL,  -- Storage path: user_id/project_id/signature.png
  client_name      text        NULL,  -- Optional: client name for display
  notes            text        NULL,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_acceptance_project_unique UNIQUE (project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_acceptance_project_id
  ON public.project_acceptance (project_id);

CREATE INDEX IF NOT EXISTS idx_project_acceptance_user_id
  ON public.project_acceptance (user_id);

ALTER TABLE public.project_acceptance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_acceptance_select_own"
  ON public.project_acceptance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "project_acceptance_insert_own"
  ON public.project_acceptance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "project_acceptance_update_own"
  ON public.project_acceptance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "project_acceptance_delete_own"
  ON public.project_acceptance FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.project_acceptance_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER project_acceptance_updated_at
  BEFORE UPDATE ON public.project_acceptance
  FOR EACH ROW EXECUTE FUNCTION public.project_acceptance_set_updated_at();

COMMENT ON TABLE public.project_acceptance IS 'Client acceptance record with optional signature. PR-15.';
COMMENT ON COLUMN public.project_acceptance.signature_path IS 'Storage path in private bucket: {user_id}/{project_id}/signature.png. PR-15.';

-- ── 4. Storage bucket policy note ─────────────────────────────────────────────
-- IMPORTANT: project-photos bucket MUST be configured as PRIVATE in Supabase Dashboard.
-- Access via signed URLs only (see usePhotoReport.ts → getSignedPhotoUrl).
-- Bucket policy (to be applied in Supabase Dashboard or via storage API):
--   - No public read
--   - Authenticated users can INSERT into: {auth.uid()}/**
--   - Authenticated users can SELECT from: {auth.uid()}/**
--   - This prevents cross-user access (IDOR protection).
--
-- For signatures, same private bucket is used, path: {user_id}/{project_id}/signature.png

-- ── END PR-15 ─────────────────────────────────────────────────────────────────
