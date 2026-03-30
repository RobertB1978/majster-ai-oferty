-- ============================================================
-- PR-2: Backfill project_photos → media_library + photo_project_links
-- ============================================================
-- Idempotent migration: safe to re-run.
-- 1. Inserts missing project photos into media_library
-- 2. Inserts missing project links into photo_project_links
-- 3. Normalizes legacy storage paths (strips bucket prefix)
-- 4. Does NOT delete or mutate existing rows
-- ============================================================

-- Step 1: Insert into media_library from project_photos where not already present.
-- Canonical storage_path rule: strip "project-photos/" prefix if present.
INSERT INTO public.media_library (
  id,
  user_id,
  storage_path,
  file_name,
  file_size,
  mime_type,
  width,
  height,
  caption,
  tags,
  ai_analysis,
  created_at,
  updated_at
)
SELECT
  pp.id,                                              -- reuse same UUID for easy linking
  pp.user_id,
  -- Normalize: strip "project-photos/" prefix if present
  CASE
    WHEN pp.photo_url LIKE 'project-photos/%'
      THEN substring(pp.photo_url FROM length('project-photos/') + 1)
    ELSE split_part(pp.photo_url, '?', 1)             -- also strip query params
  END AS storage_path,
  pp.file_name,
  pp.size_bytes,
  pp.mime_type,
  pp.width,
  pp.height,
  NULL AS caption,
  '{}' AS tags,
  pp.analysis_result AS ai_analysis,
  pp.created_at,
  pp.created_at AS updated_at
FROM public.project_photos pp
WHERE NOT EXISTS (
  SELECT 1 FROM public.media_library ml WHERE ml.id = pp.id
)
ON CONFLICT DO NOTHING;

-- Step 2: Insert into photo_project_links for each backfilled photo.
INSERT INTO public.photo_project_links (
  photo_id,
  project_id,
  user_id,
  phase,
  sort_order,
  created_at
)
SELECT
  pp.id AS photo_id,
  pp.project_id,
  pp.user_id,
  pp.phase,
  0 AS sort_order,
  pp.created_at
FROM public.project_photos pp
WHERE EXISTS (
  -- Only link photos that exist in media_library
  SELECT 1 FROM public.media_library ml WHERE ml.id = pp.id
)
AND NOT EXISTS (
  -- Don't duplicate links
  SELECT 1 FROM public.photo_project_links lnk
  WHERE lnk.photo_id = pp.id AND lnk.project_id = pp.project_id
)
ON CONFLICT (photo_id, project_id) DO NOTHING;
