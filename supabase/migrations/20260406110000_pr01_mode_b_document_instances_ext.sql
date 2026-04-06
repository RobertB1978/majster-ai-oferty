-- ============================================================
-- PR-01 (Mode B Foundation): rozszerzenie document_instances
-- Branch: claude/mode-b-foundation-HHW1Y
-- Date: 2026-04-06
-- Wymaga: 20260406100000_pr01_mode_b_master_templates.sql
-- ============================================================
--
-- Addytywnie rozszerza tabelę document_instances o kolumny potrzebne
-- dla Trybu B. NIE modyfikuje istniejących kolumn ani RLS Trybu A.
--
-- DECYZJE PROJEKTOWE (evidence-first):
--
--   pdf_path (istniejące pole z PR-17):
--     Służy jako ścieżka do finalnego PDF-a dla OBU trybów.
--     Tryb A: generowany przez jsPDF/Edge Function generate-document-pdf.
--     Tryb B: renderowany z DOCX przez (przyszłą) Edge Function (PR-02+).
--     → Nie duplikujemy jako `file_pdf`. Pole pdf_path jest reużywane.
--
--   file_docx (NOWE):
--     Unikalny dla Trybu B — ścieżka do edytowalnego pliku DOCX
--     (kopia robocza master template per instancja). Nie istnieje w Trybie A.
--
--   source_mode (NOWE):
--     Pozwala odróżnić instancje Trybu A od Trybu B bez JOIN-ów.
--     Domyślnie 'mode_a' — backward-compatible z istniejącymi rekordami.
--
--   status (NOWE):
--     Statusy cyklu życia dokumentu w Trybie B.
--     NULL dla istniejących rekordów Trybu A (brak wymaganego statusu).
--     Wartości: draft | ready | sent | final | archived
--
--   master_template_id / master_template_version (NOWE):
--     Wskaźnik do rejestru master templates (PR-01).
--     NULL dla Trybu A (brak powiązania z master templates).
--
--   version_number (NOWE):
--     Numer wersji roboczej dokumentu (inkrementowany przy zapisie w PR-02+).
--     Domyślnie 1 — zgodne z istniejącymi rekordami.
--
--   edited_at / sent_at (NOWE):
--     Znaczniki czasu dla audytu cyklu życia w Trybie B.
--     NULL dla istniejących rekordów (nie były edytowane/wysłane przez Tryb B).
--
-- ============================================================

-- ── source_mode ───────────────────────────────────────────────────────────────

ALTER TABLE public.document_instances
  ADD COLUMN IF NOT EXISTS source_mode text NOT NULL DEFAULT 'mode_a'
  CHECK (source_mode IN ('mode_a', 'mode_b'));

COMMENT ON COLUMN public.document_instances.source_mode IS
  'Tryb generowania dokumentu: mode_a (jsPDF/template-as-code, PR-17) | mode_b (DOCX master, PR-01+). PR-01.';

-- ── status ────────────────────────────────────────────────────────────────────
-- NULL = nie dotyczy (Tryb A lub instancja przed pierwszym zapisem statusu)

ALTER TABLE public.document_instances
  ADD COLUMN IF NOT EXISTS status text NULL
  CHECK (status IS NULL OR status IN ('draft', 'ready', 'sent', 'final', 'archived'));

COMMENT ON COLUMN public.document_instances.status IS
  'Status cyklu życia dokumentu Trybu B: draft|ready|sent|final|archived. NULL dla Trybu A. PR-01.';

-- ── master_template_id ────────────────────────────────────────────────────────

ALTER TABLE public.document_instances
  ADD COLUMN IF NOT EXISTS master_template_id uuid NULL;

-- FK NOT VALID — walidacja asynchroniczna (tabela może być pusta w PR-01)
ALTER TABLE public.document_instances
  ADD CONSTRAINT doc_instances_master_template_id_fkey
  FOREIGN KEY (master_template_id)
  REFERENCES public.document_master_templates (id)
  ON DELETE SET NULL
  NOT VALID;

COMMENT ON COLUMN public.document_instances.master_template_id IS
  'Wskaźnik na master template (Tryb B). NULL dla Trybu A. FK NOT VALID — walidacja w PR-02. PR-01.';

-- ── master_template_version ───────────────────────────────────────────────────

ALTER TABLE public.document_instances
  ADD COLUMN IF NOT EXISTS master_template_version text NULL;

COMMENT ON COLUMN public.document_instances.master_template_version IS
  'Wersja master template użyta przy tworzeniu instancji (snapshot). NULL dla Trybu A. PR-01.';

-- ── file_docx ─────────────────────────────────────────────────────────────────
-- Ścieżka do edytowalnej kopii roboczej DOCX w bucket 'document-masters'
-- NULL w PR-01 (pilota DOCX nie ma jeszcze) — wypełniany w PR-02+

ALTER TABLE public.document_instances
  ADD COLUMN IF NOT EXISTS file_docx text NULL;

COMMENT ON COLUMN public.document_instances.file_docx IS
  'Ścieżka do kopii roboczej DOCX (Tryb B) w bucket document-masters. NULL do PR-02. PR-01.';

-- ── version_number ────────────────────────────────────────────────────────────

ALTER TABLE public.document_instances
  ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.document_instances.version_number IS
  'Numer wersji roboczej. Inkrementowany przy zapisie (Tryb B). Domyślnie 1. PR-01.';

-- ── edited_at ─────────────────────────────────────────────────────────────────

ALTER TABLE public.document_instances
  ADD COLUMN IF NOT EXISTS edited_at timestamptz NULL;

COMMENT ON COLUMN public.document_instances.edited_at IS
  'Czas ostatniej edycji kopii roboczej (Tryb B). NULL = nigdy nie edytowano w Trybie B. PR-01.';

-- ── sent_at ───────────────────────────────────────────────────────────────────

ALTER TABLE public.document_instances
  ADD COLUMN IF NOT EXISTS sent_at timestamptz NULL;

COMMENT ON COLUMN public.document_instances.sent_at IS
  'Czas wysłania dokumentu do klienta (Tryb B). NULL = nie wysłano. PR-01.';

-- ── Indeks na source_mode (filtrowanie listy wg trybu) ───────────────────────

CREATE INDEX IF NOT EXISTS idx_doc_instances_source_mode
  ON public.document_instances (user_id, source_mode);

-- ── Indeks na master_template_id (lookup odwrotny) ───────────────────────────

CREATE INDEX IF NOT EXISTS idx_doc_instances_master_template_id
  ON public.document_instances (master_template_id)
  WHERE master_template_id IS NOT NULL;

-- ── Aktualizacja komentarza tabeli ───────────────────────────────────────────

COMMENT ON TABLE public.document_instances IS
  'Instancje dokumentów. Tryb A: jsPDF/template-as-code (PR-17). Tryb B: DOCX master (PR-01+). Szczegóły: docs/MODE_B_FOUNDATION.md.';
