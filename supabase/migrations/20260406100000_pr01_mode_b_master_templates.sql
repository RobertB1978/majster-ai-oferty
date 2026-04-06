-- ============================================================
-- PR-01 (Mode B Foundation): document_master_templates
-- Branch: claude/mode-b-foundation-HHW1Y
-- Date: 2026-04-06
-- ============================================================
--
-- Tworzy rejestr master templates dla Trybu B (DOCX-based documents).
--
-- ZAKRES PR-01:
--   - Tylko tabela + RLS + indeksy
--   - Brak Edge Functions, brak DOCX pilot, brak UI
--   - Dane wstawiane ręcznie przez admina lub w PR-02 (seed)
--
-- Model master / working / final (szczegóły: docs/MODE_B_FOUNDATION.md):
--   master  = nienaruszalny wzorzec DOCX przechowywany przez admina w storage
--   working = kopia tworzona per instancja przy rozpoczęciu edycji (PR-02+)
--   final   = zatwierdzona wersja PDF/DOCX po akceptacji klienta (PR-02+)
--
-- RLS:
--   - SELECT: każdy zalogowany użytkownik może przeglądać aktywne szablony
--   - INSERT/UPDATE/DELETE: brak polis dla zwykłych użytkowników
--     (zarządzanie wyłącznie przez service_role w Edge Functions — PR-02+)
-- ============================================================

-- ── ENUM quality_tier ─────────────────────────────────────────────────────────
-- Zdefiniowany w bazie jako typ domeny — single source of truth.
-- Odpowiada typowi QualityTier w src/types/document-mode-b.ts.

DO $$ BEGIN
  CREATE TYPE public.quality_tier AS ENUM ('short_form', 'standard', 'premium');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Tabela ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.document_master_templates (
  id                  uuid              PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Unikalny klucz kodu, np. 'contract_fixed_price_standard'
  -- Musi być stabilny — zmiany klucza wymagają migracji
  template_key        text              NOT NULL UNIQUE,

  -- Czytelna nazwa, np. 'Umowa o dzieło — wariant standardowy'
  name                text              NOT NULL,

  -- Kategoria: CONTRACTS | PROTOCOLS | ANNEXES | COMPLIANCE | OTHER
  -- Spójność z TemplateCategory w src/data/documentTemplates.ts
  category            text              NOT NULL
                      CHECK (category IN ('CONTRACTS', 'PROTOCOLS', 'ANNEXES', 'COMPLIANCE', 'OTHER')),

  -- Poziom jakości / wariant dokumentu
  quality_tier        public.quality_tier NOT NULL DEFAULT 'standard',

  -- Ścieżka do master DOCX w prywatnym bucket 'document-masters'
  -- NULL w PR-01 (pilota DOCX nie ma jeszcze) — wypełniany w PR-02+
  docx_master_path    text              NULL,

  -- Ścieżka do preview PDF (podgląd przed wypełnieniem)
  -- NULL w PR-01 — wypełniany w PR-02+
  preview_pdf_path    text              NULL,

  -- Wersja semantyczna szablonu, np. '1.0', '2.1'
  version             text              NOT NULL DEFAULT '1.0',

  -- Soft delete / aktywacja bez DROP
  is_active           boolean           NOT NULL DEFAULT true,

  created_at          timestamptz       NOT NULL DEFAULT now(),
  updated_at          timestamptz       NOT NULL DEFAULT now()
);

-- ── Indeksy ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_doc_master_tpl_key
  ON public.document_master_templates (template_key);

CREATE INDEX IF NOT EXISTS idx_doc_master_tpl_category_active
  ON public.document_master_templates (category, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_doc_master_tpl_quality_tier
  ON public.document_master_templates (quality_tier, is_active)
  WHERE is_active = true;

-- ── Auto-update updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_doc_master_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doc_master_templates_updated_at
  ON public.document_master_templates;

CREATE TRIGGER trg_doc_master_templates_updated_at
  BEFORE UPDATE ON public.document_master_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_doc_master_templates_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.document_master_templates ENABLE ROW LEVEL SECURITY;

-- Zalogowani użytkownicy mogą przeglądać AKTYWNE szablony (read-only)
CREATE POLICY "doc_master_tpl_select_active"
  ON public.document_master_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- BRAK polis INSERT / UPDATE / DELETE dla zwykłych użytkowników.
-- Zarządzanie master templates wyłącznie przez service_role w Edge Functions (PR-02+).

-- ── Komentarze ────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.document_master_templates IS
  'Registry master templates dla Trybu B (DOCX-based). PR-01. Szczegóły: docs/MODE_B_FOUNDATION.md.';
COMMENT ON COLUMN public.document_master_templates.template_key IS
  'Stabilny unikalny klucz kodu. Zmiana wymaga migracji. PR-01.';
COMMENT ON COLUMN public.document_master_templates.quality_tier IS
  'Poziom jakości: short_form | standard | premium. Enum DB. PR-01.';
COMMENT ON COLUMN public.document_master_templates.docx_master_path IS
  'Ścieżka do nienaruszalnego wzorca DOCX w bucket document-masters. NULL do PR-02. PR-01.';
COMMENT ON COLUMN public.document_master_templates.preview_pdf_path IS
  'Podgląd PDF dla biblioteki szablonów (przed wypełnieniem). NULL do PR-02. PR-01.';
COMMENT ON COLUMN public.document_master_templates.is_active IS
  'Soft delete / aktywacja. Zalogowani widzą tylko is_active=true. PR-01.';
