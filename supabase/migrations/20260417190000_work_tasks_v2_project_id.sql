-- PR-GANTT-V2-01: Add v2_project_id to work_tasks
--
-- Problem: work_tasks.project_id references legacy projects(id), but WorkTasksGantt UI
-- reads projects exclusively from v2_projects (useProjectsV2List). A V2 project UUID
-- stored in project_id violates the legacy FK; reading by project_id against v2_projects
-- returns undefined → unknownProject label in the Gantt chart.
--
-- Fix: additive column v2_project_id with FK to v2_projects(id).
-- The existing project_id FK (→ legacy projects) is preserved — existing legacy-linked
-- tasks remain intact. New tasks link via v2_project_id.

ALTER TABLE public.work_tasks
  ADD COLUMN IF NOT EXISTS v2_project_id UUID REFERENCES public.v2_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_work_tasks_v2_project
  ON public.work_tasks(v2_project_id);
