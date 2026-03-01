-- ============================================================
-- PR-14: Burn Bar BASIC — Budget vs Costs
-- Branch: claude/add-burn-bar-feature-UWliG
-- Date: 2026-03-01
-- ============================================================
--
-- Changes:
--   1. v2_projects — add budget fields
--        budget_net         numeric(14,2) nullable
--        budget_source      text nullable ('OFFER_NET' | 'MANUAL')
--        budget_updated_at  timestamptz nullable
--   2. project_costs — new table (cost entries per project)
--
-- Security:
--   - RLS enabled on project_costs (user_id = auth.uid())
--   - 4 standard policies (SELECT/INSERT/UPDATE/DELETE)
-- ============================================================

-- ── 1. Budget columns on v2_projects ─────────────────────────────────────────

ALTER TABLE public.v2_projects
  ADD COLUMN IF NOT EXISTS budget_net        numeric(14,2) NULL,
  ADD COLUMN IF NOT EXISTS budget_source     text          NULL
    CHECK (budget_source IN ('OFFER_NET', 'MANUAL')),
  ADD COLUMN IF NOT EXISTS budget_updated_at timestamptz   NULL;

COMMENT ON COLUMN public.v2_projects.budget_net
  IS 'Project budget (net). Default: offer total_net at creation. Editable by user.';
COMMENT ON COLUMN public.v2_projects.budget_source
  IS 'OFFER_NET = auto-set from source offer; MANUAL = user override.';
COMMENT ON COLUMN public.v2_projects.budget_updated_at
  IS 'When budget_net was last changed.';

-- ── 2. project_costs table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_costs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id   uuid        NOT NULL REFERENCES public.v2_projects(id) ON DELETE CASCADE,
  cost_type    text        NOT NULL DEFAULT 'OTHER'
                           CHECK (cost_type IN ('MATERIAL', 'LABOR', 'TRAVEL', 'OTHER')),
  amount_net   numeric(14,2) NOT NULL CHECK (amount_net >= 0),
  note         text        NULL,
  incurred_at  date        NOT NULL DEFAULT CURRENT_DATE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_costs_project_id
  ON public.project_costs (project_id);

CREATE INDEX IF NOT EXISTS idx_project_costs_user_id
  ON public.project_costs (user_id);

CREATE INDEX IF NOT EXISTS idx_project_costs_user_project
  ON public.project_costs (user_id, project_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.project_costs_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER project_costs_updated_at
  BEFORE UPDATE ON public.project_costs
  FOR EACH ROW EXECUTE FUNCTION public.project_costs_set_updated_at();

-- RLS
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_costs_select_own"
  ON public.project_costs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "project_costs_insert_own"
  ON public.project_costs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "project_costs_update_own"
  ON public.project_costs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "project_costs_delete_own"
  ON public.project_costs FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.project_costs
  IS 'Project cost entries. RLS: user_id = auth.uid(). PR-14.';
COMMENT ON COLUMN public.project_costs.cost_type
  IS 'MATERIAL | LABOR | TRAVEL | OTHER';
COMMENT ON COLUMN public.project_costs.amount_net
  IS 'Cost amount (net, without VAT). >= 0.';
