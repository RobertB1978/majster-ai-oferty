-- ============================================================
-- PR-001B: Add private storage bucket `dossier`
--
-- The `dossier` bucket is used by:
--   - project_dossier_items (PR-16) — file_path column references this bucket
--   - Warranty PDF-to-dossier flows (PR-18)
--
-- Security model: private bucket, user-scoped access.
--   Files stored under {user_id}/{filename} path prefix.
--   Only the owning user may read, write, or delete their files.
--
-- Idempotency:
--   - Bucket INSERT uses ON CONFLICT (id) DO NOTHING
--   - Policy CREATE uses DO/EXCEPTION WHEN duplicate_object to skip
--     if a policy with the same name already exists (safe to re-run)
-- ============================================================

-- ── 1. Create private bucket ──────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('dossier', 'dossier', false)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Storage RLS policies ───────────────────────────────────────────────────
-- Path convention: {user_id}/{filename}
-- storage.foldername(name)[1] extracts the first path segment (= user_id)

DO $$
BEGIN
  CREATE POLICY "dossier_objects_select_own"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'dossier'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "dossier_objects_insert_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'dossier'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "dossier_objects_update_own"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'dossier'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "dossier_objects_delete_own"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'dossier'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
