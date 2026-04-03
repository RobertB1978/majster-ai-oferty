-- ============================================================
-- Walidacja FK constraints na document_instances
-- Branch: claude/fix-race-conditions-audit-Dl0Qk
-- Date: 2026-04-03
-- ============================================================
--
-- Migracja 20260401120000_harden_db_layer.sql dodała FK constraints
-- z opcją NOT VALID (egzekwowane tylko dla nowych wierszy).
-- Ta migracja waliduje istniejące dane.
--
-- UWAGA: Jeśli istnieją osierocone rekordy, VALIDATE się nie uda.
-- Dlatego najpierw czyścimy osierocone FK (SET NULL).
--
-- Rollback: brak potrzeby — VALIDATE nie zmienia schematu,
-- jedynie potwierdza istniejące dane.
-- ============================================================

-- ── Krok 1: Wyczyść ewentualne osierocone rekordy ──────────────
-- SET NULL na FK kolumnach gdzie parent nie istnieje

UPDATE public.document_instances
SET client_id = NULL
WHERE client_id IS NOT NULL
  AND client_id NOT IN (SELECT id FROM public.clients);

UPDATE public.document_instances
SET offer_id = NULL
WHERE offer_id IS NOT NULL
  AND offer_id NOT IN (SELECT id FROM public.offers);

UPDATE public.document_instances
SET dossier_item_id = NULL
WHERE dossier_item_id IS NOT NULL
  AND dossier_item_id NOT IN (SELECT id FROM public.project_dossier_items);

-- ── Krok 2: Walidacja constraintów ─────────────────────────────
-- Po wyczyszczeniu osieroconych rekordów, VALIDATE sprawdzi
-- wszystkie istniejące wiersze i oznaczy constraint jako VALID.

ALTER TABLE public.document_instances
  VALIDATE CONSTRAINT doc_instances_client_id_fkey;

ALTER TABLE public.document_instances
  VALIDATE CONSTRAINT doc_instances_offer_id_fkey;

ALTER TABLE public.document_instances
  VALIDATE CONSTRAINT doc_instances_dossier_item_id_fkey;
