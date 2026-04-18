-- GANTT-BOOTSTRAP-PROD-01: production-safe bootstrap for public.work_tasks
--
-- Context:
--   public.work_tasks does NOT exist in production (confirmed 2026-04-18).
--   Sprint 6 migration (20251205230527_143aedf1...) was never applied to prod.
--   Gantt V2 migration (20260417190000_work_tasks_v2_project_id) was never applied to prod.
--   This single migration supersedes both unapplied migrations for the work_tasks table.
--
-- Key design choices vs Sprint 6 original:
--   1. project_id is NULLABLE with no FK to public.projects.
--      Rationale: the V2 migration explicitly documented that storing a v2_project UUID
--      in project_id violated the legacy FK.  In the V2 flow, project lookup in
--      WorkTasksGantt.tsx resolves `task.v2_project_id ?? task.project_id` against
--      v2_projects — so project_id is a legacy fallback, not the authoritative FK.
--      Making it nullable without FK allows pure-V2 tasks (v2_project_id set,
--      project_id null) without any constraint violation.
--   2. v2_project_id carries the real V2 link (FK to public.v2_projects).
--   3. task_type and color are NOT NULL with DEFAULT (matches WorkTask TS interface).
--   4. assigned_team_member_id FK to team_members is preserved (already in prod).
--   5. Uses CREATE TABLE IF NOT EXISTS — safe to run twice.

CREATE TABLE IF NOT EXISTS public.work_tasks (
  id                      UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id              UUID,
  v2_project_id           UUID        REFERENCES public.v2_projects(id) ON DELETE SET NULL,
  user_id                 UUID        NOT NULL,
  title                   TEXT        NOT NULL,
  description             TEXT,
  assigned_team_member_id UUID        REFERENCES public.team_members(id) ON DELETE SET NULL,
  task_type               TEXT        NOT NULL DEFAULT 'work',
  status                  TEXT        NOT NULL DEFAULT 'planned'
                            CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  start_date              TIMESTAMPTZ NOT NULL,
  end_date                TIMESTAMPTZ NOT NULL,
  color                   TEXT        NOT NULL DEFAULT '#3b82f6',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.work_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "work_tasks_all_own"
  ON public.work_tasks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes driven by actual query patterns in useWorkTasks.ts:
--   .eq('user_id', ...)                                  → idx_work_tasks_user_id
--   .gte('start_date', ...).lte('end_date', ...)         → idx_work_tasks_user_start_date
--   v2_project_id join / filter                          → idx_work_tasks_v2_project
--   .eq('project_id', projectId)  (legacy filter path)  → idx_work_tasks_project_id

CREATE INDEX IF NOT EXISTS idx_work_tasks_user_id
  ON public.work_tasks (user_id);

CREATE INDEX IF NOT EXISTS idx_work_tasks_user_start_date
  ON public.work_tasks (user_id, start_date);

CREATE INDEX IF NOT EXISTS idx_work_tasks_v2_project
  ON public.work_tasks (v2_project_id);

CREATE INDEX IF NOT EXISTS idx_work_tasks_project_id
  ON public.work_tasks (project_id);
