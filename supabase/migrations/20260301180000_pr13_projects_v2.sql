-- ============================================================
-- PR-13: Projects V2 — List + Hub + QR Public Status
-- Branch: claude/pr-13-projects-module-BilaR
-- Date: 2026-03-01
-- ============================================================
--
-- Creates:
--   1. v2_projects — new projects table (linked to offers + clients)
--   2. project_public_status_tokens — QR token table (30-day TTL)
--   3. resolve_project_public_token(token) — SECURITY DEFINER for public read (NO prices)
--
-- Security notes:
--   - RLS enforced on both tables (user_id = auth.uid())
--   - Token resolution: SECURITY DEFINER, returns ONLY title/stages/progress (NO amounts)
--   - Cross-tenant access impossible: token -> single project (FK)
--   - Tokens: UUID v4, 122-bit entropy
-- ============================================================

-- ── 1. v2_projects ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_projects (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id        uuid        NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  source_offer_id  uuid        NULL REFERENCES public.offers(id) ON DELETE SET NULL,
  title            text        NOT NULL,
  status           text        NOT NULL DEFAULT 'ACTIVE'
                               CHECK (status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD')),
  start_date       date        NULL,
  end_date         date        NULL,
  progress_percent integer     NOT NULL DEFAULT 0
                               CHECK (progress_percent >= 0 AND progress_percent <= 100),
  stages_json      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  total_from_offer numeric(14,2) NULL,  -- stored at creation from offer; NOT exposed in QR view
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v2_projects_user_id
  ON public.v2_projects (user_id);

CREATE INDEX IF NOT EXISTS idx_v2_projects_user_status
  ON public.v2_projects (user_id, status);

CREATE INDEX IF NOT EXISTS idx_v2_projects_source_offer
  ON public.v2_projects (source_offer_id);

ALTER TABLE public.v2_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "v2_projects_select_own"
  ON public.v2_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "v2_projects_insert_own"
  ON public.v2_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "v2_projects_update_own"
  ON public.v2_projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "v2_projects_delete_own"
  ON public.v2_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.v2_projects_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER v2_projects_updated_at
  BEFORE UPDATE ON public.v2_projects
  FOR EACH ROW EXECUTE FUNCTION public.v2_projects_set_updated_at();

COMMENT ON TABLE public.v2_projects IS 'Projects V2 — linked to offers, clients. PR-13.';
COMMENT ON COLUMN public.v2_projects.stages_json IS 'Array of {name, due_date, is_done, sort_order} objects.';
COMMENT ON COLUMN public.v2_projects.total_from_offer IS 'Stored at creation from offer total_net. NOT exposed in QR public view.';

-- ── 2. project_public_status_tokens ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_public_status_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid        NOT NULL REFERENCES public.v2_projects(id) ON DELETE CASCADE,
  token      uuid        NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_public_tokens_token_unique UNIQUE (token),
  CONSTRAINT project_public_tokens_project_unique UNIQUE (project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_public_tokens_project_id
  ON public.project_public_status_tokens (project_id);

CREATE INDEX IF NOT EXISTS idx_project_public_tokens_token
  ON public.project_public_status_tokens (token);

CREATE INDEX IF NOT EXISTS idx_project_public_tokens_user_id
  ON public.project_public_status_tokens (user_id);

ALTER TABLE public.project_public_status_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_public_tokens_select_own"
  ON public.project_public_status_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "project_public_tokens_insert_own"
  ON public.project_public_status_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "project_public_tokens_update_own"
  ON public.project_public_status_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "project_public_tokens_delete_own"
  ON public.project_public_status_tokens FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.project_public_status_tokens IS 'QR/public status tokens for v2_projects. 30-day TTL. PR-13.';
COMMENT ON COLUMN public.project_public_status_tokens.token IS 'UUID v4 — unguessable token in public URL.';

-- ── 3. resolve_project_public_token ─────────────────────────────────────────
-- Returns project status data (safe subset — NO prices/amounts) for public view.
-- Called from browser with anon key — SECURITY DEFINER bypasses RLS.
-- CRITICAL: Must NOT return total_from_offer or any financial data.

CREATE OR REPLACE FUNCTION public.resolve_project_public_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token   project_public_status_tokens%ROWTYPE;
  v_project v2_projects%ROWTYPE;
BEGIN
  -- 1. Find token
  SELECT * INTO v_token FROM project_public_status_tokens WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  -- 2. Expiry check (server-side enforcement)
  IF v_token.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- 3. Get project
  SELECT * INTO v_project FROM v2_projects WHERE id = v_token.project_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'project_not_found');
  END IF;

  -- 4. Return ONLY safe fields — NO total_from_offer, NO financial data
  RETURN jsonb_build_object(
    'project', jsonb_build_object(
      'title',            v_project.title,
      'status',           v_project.status,
      'progress_percent', v_project.progress_percent,
      'start_date',       v_project.start_date,
      'end_date',         v_project.end_date,
      'stages_json',      v_project.stages_json,
      'created_at',       v_project.created_at
    ),
    'expires_at', v_token.expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.resolve_project_public_token(uuid)
  IS 'Public (anon key) read of project status via QR token. SECURITY DEFINER. Returns NO prices. PR-13.';
