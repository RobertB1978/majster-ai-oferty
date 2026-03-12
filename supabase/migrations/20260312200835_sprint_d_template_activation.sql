-- ============================================================
-- Sprint D: Template Activation
-- Branch: claude/sprint-d-template-activation-ZlNhw
-- Date: 2026-03-12
-- ============================================================
--
-- D1: Add source_template_id to offers table
--   Stores the id of the industry starter pack template that was
--   used to create the offer (e.g. 'glazurnik', 'malarz').
--   NULL for manually created offers.
--   Backward-compatible: existing rows remain NULL.
--
-- D2: No migration needed.
--   stages_json (jsonb NOT NULL DEFAULT '[]') already exists in
--   v2_projects (PR-13). Sprint D activates it via the CreateProjectInput
--   type and useCreateProjectV2 hook.
-- ============================================================

-- D1: Track offer template origin
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS source_template_id text NULL;

COMMENT ON COLUMN public.offers.source_template_id
  IS 'Sprint D: id of the industry starter pack used to create this offer (e.g. ''glazurnik''). NULL for manually created offers.';
