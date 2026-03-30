-- ============================================================
-- PR-18: Project Warranties — Warranty card + PDF + reminders
-- Branch: claude/document-templates-library-l0viJ
-- Date: 2026-03-02
-- ============================================================
--
-- Creates:
--   1. project_warranties — one warranty record per project
--
-- Security:
--   - RLS enabled (user_id = auth.uid())
--   - No public-facing API — reminders sent via service-role Edge Function only
-- ============================================================

-- ── 1. project_warranties ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_warranties (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id          uuid        NOT NULL REFERENCES public.v2_projects(id) ON DELETE CASCADE,
  client_email        text        NULL,
  client_name         text        NULL,
  contact_phone       text        NULL,
  warranty_months     integer     NOT NULL DEFAULT 24
                                  CHECK (warranty_months > 0 AND warranty_months <= 120),
  start_date          date        NOT NULL DEFAULT CURRENT_DATE,
  scope_of_work       text        NULL,
  exclusions          text        NULL,
  pdf_storage_path    text        NULL,     -- path in 'dossier' bucket after save-to-dossier
  reminder_30_sent_at timestamptz NULL,
  reminder_7_sent_at  timestamptz NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- one warranty per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_warranties_project_unique
  ON public.project_warranties (project_id);

CREATE INDEX IF NOT EXISTS idx_project_warranties_user_id
  ON public.project_warranties (user_id);

CREATE INDEX IF NOT EXISTS idx_project_warranties_end_date
  ON public.project_warranties (
    ((start_date + make_interval(months => warranty_months))::date)
  )
  WHERE reminder_30_sent_at IS NULL OR reminder_7_sent_at IS NULL;

ALTER TABLE public.project_warranties ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "warranties_select_own"
    ON public.project_warranties FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "warranties_insert_own"
    ON public.project_warranties FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "warranties_update_own"
    ON public.project_warranties FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "warranties_delete_own"
    ON public.project_warranties FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. updated_at trigger ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_project_warranties_updated_at'
  ) THEN
    CREATE TRIGGER trg_project_warranties_updated_at
      BEFORE UPDATE ON public.project_warranties
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── 3. Helper view (end_date computed) ───────────────────────────────────────

CREATE OR REPLACE VIEW public.project_warranties_with_end
  WITH (security_invoker = on)
AS
SELECT
  id,
  user_id,
  project_id,
  client_email,
  client_name,
  contact_phone,
  warranty_months,
  start_date,
  ((start_date + make_interval(months => warranty_months))::date) AS end_date,
  scope_of_work,
  exclusions,
  pdf_storage_path,
  reminder_30_sent_at,
  reminder_7_sent_at,
  created_at,
  updated_at
FROM public.project_warranties;
