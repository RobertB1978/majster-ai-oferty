-- ============================================================
-- PR: PDF Truth Switch — relax pdf_data.project_id FK
-- Branch: claude/pdf-v2-projects-7pYWM
-- Date: 2026-03-11
-- ============================================================
--
-- Problem:
--   pdf_data.project_id has FK → projects(id) (legacy table).
--   v2_projects uses a separate table with its own UUIDs.
--   Saving PDF data for a v2 project fails with FK violation.
--
-- Fix:
--   Drop the FK constraint so pdf_data.project_id accepts any UUID
--   (both legacy projects.id and v2_projects.id).
--   Data isolation is preserved: RLS enforces user_id = auth.uid().
--
-- Risk: LOW — no data is deleted; existing rows are unaffected.
--   UNIQUE(project_id) constraint and user_id RLS remain intact.
-- ============================================================

ALTER TABLE public.pdf_data
  DROP CONSTRAINT IF EXISTS pdf_data_project_id_fkey;
