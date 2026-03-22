-- Fix: Add CANCELLED to v2_projects status CHECK constraint.
-- The code uses 'CANCELLED' for soft-delete (useDeleteProjectV2),
-- but the original CHECK constraint only allowed ACTIVE, COMPLETED, ON_HOLD.
-- This caused "new row violates check constraint" errors when archiving projects.

ALTER TABLE public.v2_projects
  DROP CONSTRAINT IF EXISTS v2_projects_status_check;

ALTER TABLE public.v2_projects
  ADD CONSTRAINT v2_projects_status_check
  CHECK (status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'));
