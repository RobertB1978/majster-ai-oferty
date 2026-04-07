-- ============================================================
-- PR-05a: Walidacja FK master_template_id na document_instances
-- Branch: claude/pr-05a-master-docx-HI9Bm
-- Date: 2026-04-07
-- Wymaga: 20260407100000_pr05a_seed_master_templates.sql
-- ============================================================
--
-- FK doc_instances_master_template_id_fkey zostało dodane w PR-01
-- z opcją NOT VALID (tabela document_master_templates była pusta).
-- Po seed PR-05a możemy bezpiecznie walidować.
--
-- Krok 1: Wyczyść ewentualne osierocone rekordy (SET NULL).
-- Krok 2: VALIDATE CONSTRAINT.
-- ============================================================

-- Krok 1: cleanup orphans
UPDATE public.document_instances
SET master_template_id = NULL
WHERE master_template_id IS NOT NULL
  AND master_template_id NOT IN (SELECT id FROM public.document_master_templates);

-- Krok 2: validate
ALTER TABLE public.document_instances
  VALIDATE CONSTRAINT doc_instances_master_template_id_fkey;
