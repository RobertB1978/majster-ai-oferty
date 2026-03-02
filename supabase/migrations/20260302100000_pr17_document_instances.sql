-- ============================================================
-- PR-17: Document Templates Library — document_instances table
-- Branch: claude/document-templates-library-l0viJ
-- Date: 2026-03-02
-- ============================================================
--
-- Creates:
--   1. document_instances  — filled template instances per user/project
--
-- Design:
--   - Templates are stored as code (src/data/documentTemplates.ts) — versioned in repo
--   - This table stores FILLED instances: form data + references snapshot + PDF path
--   - Integrates with project_dossier_items (PR-16) via dossier_item_id FK (nullable)
--
-- Security:
--   - RLS: user_id = auth.uid()
--   - Users can only read/write their own instances (no cross-tenant access)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_instances (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id         uuid        NULL REFERENCES public.v2_projects(id) ON DELETE SET NULL,
  client_id          uuid        NULL,   -- references clients (soft FK — no FK constraint to avoid tight coupling)
  offer_id           uuid        NULL,   -- references offers  (soft FK — no FK constraint)
  template_key       text        NOT NULL,   -- e.g. 'contract_fixed_price'
  template_version   text        NOT NULL DEFAULT '1.0',
  locale             text        NOT NULL DEFAULT 'pl'
                                CHECK (locale IN ('pl', 'en', 'uk')),
  title              text        NULL,   -- custom title set by user (optional)
  data_json          jsonb       NOT NULL DEFAULT '{}',   -- filled form field values
  references_json    jsonb       NOT NULL DEFAULT '[]',   -- snapshot of template references at fill time
  pdf_path           text        NULL,   -- Storage path in 'dossier' bucket after generation
  dossier_item_id    uuid        NULL,   -- FK to project_dossier_items (set after save-to-dossier)
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_doc_instances_user_id
  ON public.document_instances (user_id);

CREATE INDEX IF NOT EXISTS idx_doc_instances_project_id
  ON public.document_instances (project_id);

CREATE INDEX IF NOT EXISTS idx_doc_instances_template_key
  ON public.document_instances (user_id, template_key);

CREATE INDEX IF NOT EXISTS idx_doc_instances_created_at
  ON public.document_instances (user_id, created_at DESC);

-- ── Auto-update updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_document_instances_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doc_instances_updated_at ON public.document_instances;
CREATE TRIGGER trg_doc_instances_updated_at
  BEFORE UPDATE ON public.document_instances
  FOR EACH ROW EXECUTE FUNCTION public.set_document_instances_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.document_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_instances_select_own"
  ON public.document_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "doc_instances_insert_own"
  ON public.document_instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "doc_instances_update_own"
  ON public.document_instances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "doc_instances_delete_own"
  ON public.document_instances FOR DELETE
  USING (auth.uid() = user_id);

-- ── Comments ──────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.document_instances IS
  'Filled document template instances. Templates are code (src/data/documentTemplates.ts). PR-17.';
COMMENT ON COLUMN public.document_instances.template_key IS
  'Unique template key from code, e.g. contract_fixed_price. PR-17.';
COMMENT ON COLUMN public.document_instances.data_json IS
  'Filled form field values as key→value map. PR-17.';
COMMENT ON COLUMN public.document_instances.references_json IS
  'Snapshot of legal references from template at fill time. Array of {text, url?}. PR-17.';
COMMENT ON COLUMN public.document_instances.pdf_path IS
  'Storage path in dossier bucket after PDF generation. NULL until generated. PR-17.';
COMMENT ON COLUMN public.document_instances.dossier_item_id IS
  'Set after save-to-dossier. References project_dossier_items (soft FK). PR-17.';
