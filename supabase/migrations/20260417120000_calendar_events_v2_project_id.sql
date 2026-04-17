-- PR-CALENDAR-V2-01: Add v2_project_id to calendar_events
--
-- Problem: calendar_events.project_id references legacy projects(id), but Calendar UI
-- now reads projects exclusively from v2_projects (useProjectsV2List). Sending a V2
-- UUID into project_id causes a FK violation on insert/update.
--
-- Fix: additive column v2_project_id with FK to v2_projects(id).
-- The existing project_id FK (→ legacy projects) is preserved — existing legacy-linked
-- events remain intact. New events link via v2_project_id.

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS v2_project_id UUID REFERENCES public.v2_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_v2_project
  ON public.calendar_events(v2_project_id);
