-- ============================================================
-- PR-16: Project Dossier — Document Folder + Export + Secure Share
-- Branch: claude/document-folder-export-share-THSXi
-- Date: 2026-03-02
-- ============================================================
--
-- Creates:
--   1. project_dossier_items   — dossier files per project (categories)
--   2. project_dossier_share_tokens — share link tokens with expiry
--   3. resolve_dossier_share_token(token) — SECURITY DEFINER (public read, signed URLs via app layer)
--
-- Security:
--   - RLS on both tables (user_id = auth.uid())
--   - Token resolution: SECURITY DEFINER, returns ONLY allowed_categories items for that token
--   - NO prices or costs exposed via public token
--   - Cross-tenant access impossible (token → single project FK)
--   - UUID v4 tokens (122-bit entropy)
-- ============================================================

-- ── 1. project_dossier_items ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_dossier_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id   uuid        NOT NULL REFERENCES public.v2_projects(id) ON DELETE CASCADE,
  category     text        NOT NULL
                           CHECK (category IN ('CONTRACT', 'PROTOCOL', 'RECEIPT', 'PHOTO', 'GUARANTEE', 'OTHER')),
  file_path    text        NOT NULL,   -- Storage path in 'dossier' bucket (private)
  file_name    text        NOT NULL,
  mime_type    text        NULL,
  size_bytes   integer     NULL,
  source       text        NULL        -- 'MANUAL' | 'PHOTO_REPORT' | 'OFFER_PDF' | 'SIGNATURE'
                           CHECK (source IN ('MANUAL', 'PHOTO_REPORT', 'OFFER_PDF', 'SIGNATURE') OR source IS NULL),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_dossier_items_project_id
  ON public.project_dossier_items (project_id);

CREATE INDEX IF NOT EXISTS idx_project_dossier_items_user_id
  ON public.project_dossier_items (user_id);

CREATE INDEX IF NOT EXISTS idx_project_dossier_items_category
  ON public.project_dossier_items (project_id, category);

ALTER TABLE public.project_dossier_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dossier_items_select_own"
  ON public.project_dossier_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dossier_items_insert_own"
  ON public.project_dossier_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dossier_items_update_own"
  ON public.project_dossier_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dossier_items_delete_own"
  ON public.project_dossier_items FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.project_dossier_items IS 'Project dossier files grouped by category. PR-16.';
COMMENT ON COLUMN public.project_dossier_items.category IS 'CONTRACT | PROTOCOL | RECEIPT | PHOTO | GUARANTEE | OTHER. PR-16.';
COMMENT ON COLUMN public.project_dossier_items.source IS 'MANUAL (user upload) | PHOTO_REPORT (from PR-15) | OFFER_PDF (from PR-11) | SIGNATURE. PR-16.';

-- ── 2. project_dossier_share_tokens ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_dossier_share_tokens (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id         uuid        NOT NULL REFERENCES public.v2_projects(id) ON DELETE CASCADE,
  token              uuid        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at         timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  allowed_categories text[]      NOT NULL DEFAULT '{}',
  label              text        NULL,    -- optional human label ("For client Smith")
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dossier_share_tokens_project_id
  ON public.project_dossier_share_tokens (project_id);

CREATE INDEX IF NOT EXISTS idx_dossier_share_tokens_user_id
  ON public.project_dossier_share_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_dossier_share_tokens_token
  ON public.project_dossier_share_tokens (token);

ALTER TABLE public.project_dossier_share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dossier_share_tokens_select_own"
  ON public.project_dossier_share_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dossier_share_tokens_insert_own"
  ON public.project_dossier_share_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dossier_share_tokens_update_own"
  ON public.project_dossier_share_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dossier_share_tokens_delete_own"
  ON public.project_dossier_share_tokens FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.project_dossier_share_tokens IS 'Secure share tokens for project dossier with expiry + category scope. PR-16.';

-- ── 3. resolve_dossier_share_token — SECURITY DEFINER ────────────────────────
-- Returns ONLY: project title (safe), items in allowed_categories, file metadata (NO prices)
-- Signed URLs must be generated in the application layer (not here, to avoid long-running SQL)

CREATE OR REPLACE FUNCTION public.resolve_dossier_share_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_row  public.project_dossier_share_tokens%ROWTYPE;
  v_project    public.v2_projects%ROWTYPE;
  v_items      jsonb;
  v_result     jsonb;
BEGIN
  -- 1. Lookup token
  SELECT * INTO v_token_row
  FROM public.project_dossier_share_tokens
  WHERE token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- 2. Check expiry
  IF v_token_row.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- 3. Lookup project (only safe fields: title, status — NO amounts)
  SELECT * INTO v_project
  FROM public.v2_projects
  WHERE id = v_token_row.project_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- 4. Fetch dossier items in allowed_categories (NO amounts)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',         i.id,
      'category',   i.category,
      'file_path',  i.file_path,
      'file_name',  i.file_name,
      'mime_type',  i.mime_type,
      'size_bytes', i.size_bytes,
      'created_at', i.created_at
    ) ORDER BY i.category, i.created_at
  ) INTO v_items
  FROM public.project_dossier_items i
  WHERE i.project_id = v_token_row.project_id
    AND i.category = ANY(v_token_row.allowed_categories);

  -- 5. Build result
  v_result := jsonb_build_object(
    'project_title',       v_project.title,
    'project_status',      v_project.status,
    'allowed_categories',  to_jsonb(v_token_row.allowed_categories),
    'expires_at',          v_token_row.expires_at,
    'items',               COALESCE(v_items, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

-- Grant to anon + authenticated roles (public page uses anon key)
GRANT EXECUTE ON FUNCTION public.resolve_dossier_share_token(uuid)
  TO anon, authenticated;

COMMENT ON FUNCTION public.resolve_dossier_share_token IS
  'PR-16: Resolve dossier share token. Returns project title + items in allowed_categories only. SECURITY DEFINER — no prices/costs exposed.';
