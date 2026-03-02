-- ============================================================
-- PR-18: Project Inspections — periodic technical inspections
-- Branch: claude/enterprise-compliance-features-48LQF
-- Date: 2026-03-02
-- ============================================================
--
-- Creates:
--   1. project_inspections — periodic inspection records per project
--
-- Inspection types (sourced from /docs/COMPLIANCE/INSPECTIONS_PL.md):
--   ANNUAL_BUILDING          — roczny przegląd budowlany (art. 62 ust. 1 pkt 1 PB)
--   FIVE_YEAR_BUILDING       — 5-letni przegląd budowlany (art. 62 ust. 1 pkt 2 PB)
--   FIVE_YEAR_ELECTRICAL     — 5-letni przegląd elektryczny i odgromowy
--   ANNUAL_GAS_CHIMNEY       — roczny przegląd gazowy i kominiarski
--   LARGE_AREA_SEMIANNUAL    — przegląd obiektu >2000 m² (2x rocznie, art. 62 ust. 1 pkt 1b PB)
--   OTHER                    — inny / niestandardowy
--
-- Security:
--   - RLS enabled (user_id = auth.uid())
--   - IDOR: users see only their own records
-- ============================================================

-- ── 1. project_inspections ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_inspections (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id          uuid        NULL REFERENCES public.v2_projects(id) ON DELETE SET NULL,
  inspection_type     text        NOT NULL
    CHECK (inspection_type IN (
      'ANNUAL_BUILDING',
      'FIVE_YEAR_BUILDING',
      'FIVE_YEAR_ELECTRICAL',
      'ANNUAL_GAS_CHIMNEY',
      'LARGE_AREA_SEMIANNUAL',
      'OTHER'
    )),
  object_address      text        NULL,   -- optional address if no project_id
  due_date            date        NOT NULL,
  completed_at        timestamptz NULL,
  status              text        NOT NULL DEFAULT 'PLANNED'
    CHECK (status IN ('PLANNED', 'DONE', 'OVERDUE')),
  protocol_pdf_path   text        NULL,   -- path in dossier bucket after save
  reminder_30_sent_at timestamptz NULL,
  reminder_7_sent_at  timestamptz NULL,
  notes               text        NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_inspections_user_id
  ON public.project_inspections (user_id);

CREATE INDEX IF NOT EXISTS idx_project_inspections_project_id
  ON public.project_inspections (project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_inspections_due_date_status
  ON public.project_inspections (due_date, status)
  WHERE status != 'DONE';

-- RLS
ALTER TABLE public.project_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inspections_select_own"
  ON public.project_inspections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "inspections_insert_own"
  ON public.project_inspections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "inspections_update_own"
  ON public.project_inspections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "inspections_delete_own"
  ON public.project_inspections FOR DELETE
  USING (auth.uid() = user_id);

-- ── 2. updated_at trigger ────────────────────────────────────────────────────

-- Reuse set_updated_at() created in pr18_warranties migration
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_project_inspections_updated_at'
  ) THEN
    CREATE TRIGGER trg_project_inspections_updated_at
      BEFORE UPDATE ON public.project_inspections
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── 3. Auto-overdue function — marks PLANNED as OVERDUE if due_date < today ───
-- Called on SELECT via view (safe, no side effects)

CREATE OR REPLACE VIEW public.project_inspections_with_status AS
SELECT
  id,
  user_id,
  project_id,
  inspection_type,
  object_address,
  due_date,
  completed_at,
  CASE
    WHEN completed_at IS NOT NULL THEN 'DONE'
    WHEN due_date < CURRENT_DATE THEN 'OVERDUE'
    ELSE 'PLANNED'
  END AS status,
  protocol_pdf_path,
  reminder_30_sent_at,
  reminder_7_sent_at,
  notes,
  created_at,
  updated_at
FROM public.project_inspections;
