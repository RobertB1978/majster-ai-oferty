-- ============================================================
-- PR-02 (Mode B DOCX Pilot): seed document_master_templates
-- Branch: claude/mode-b-pr02-docx-pilot-HHW1Y
-- Date: 2026-04-06
-- Wymaga: 20260406100000_pr01_mode_b_master_templates.sql
-- ============================================================
--
-- Wstawia pierwszy aktywny master template dla pilota Trybu B:
--   "Protokół odbioru końcowego — wariant standardowy"
--
-- W PR-02 (pilot) Edge Function generate-mode-b-docx generuje DOCX
-- programatycznie (npm:docx) — docx_master_path wskazuje ścieżkę
-- docelową w bucket document-masters, ale plik zostanie tam umieszczony
-- dopiero w PR-03+ (gdy admin wgra ręcznie lub CI uploaduje binarny wzorzec).
--
-- Nie duplikujemy danych: ON CONFLICT DO NOTHING — bezpieczne przy re-run.
-- ============================================================

INSERT INTO public.document_master_templates (
  template_key,
  name,
  category,
  quality_tier,
  docx_master_path,
  preview_pdf_path,
  version,
  is_active
)
VALUES (
  'protocol_final_acceptance_standard',
  'Protokół odbioru końcowego — wariant standardowy',
  'PROTOCOLS',
  'standard',
  'master/protocol_final_acceptance/1.0.docx',  -- docelowa ścieżka w bucket document-masters (plik w PR-03+)
  NULL,                                          -- podgląd PDF — dodać po wygenerowaniu próbki
  '1.0',
  true
)
ON CONFLICT (template_key) DO NOTHING;
