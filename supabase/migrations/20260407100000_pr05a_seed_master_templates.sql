-- ============================================================
-- PR-05a: Seed 5 master contract templates into document_master_templates
-- Branch: claude/pr-05a-master-docx-HI9Bm
-- Date: 2026-04-07
-- Wymaga: 20260406100000_pr01_mode_b_master_templates.sql
-- ============================================================
--
-- Wstawia 5 umow budowlanych jako master templates dla Trybu B.
-- Kazdy wpis wskazuje na realny plik DOCX w bucket 'document-masters'
-- (sciezka wg konwencji: masters/{template_key}/v{version}/{template_key}.docx).
--
-- Pliki DOCX sa zrodlem prawdy (nie kod TS).
-- Upload plikow do bucketu jest osobnym krokiem operacyjnym (admin).
--
-- template_key jest spojny z kluczami w src/data/documentTemplates.ts (Tryb A)
-- ale z sufiksem _standard dla quality_tier = standard.
--
-- UWAGA: ON CONFLICT DO NOTHING -- bezpieczne ponowne uruchomienie.
-- ============================================================

INSERT INTO public.document_master_templates
  (template_key, name, category, quality_tier, docx_master_path, preview_pdf_path, version, is_active)
VALUES
  (
    'contract_fixed_price_standard',
    'Umowa o roboty budowlane - ryczalt',
    'CONTRACTS',
    'standard',
    'masters/contract_fixed_price_standard/v1.0/contract_fixed_price_standard.docx',
    NULL,
    '1.0',
    true
  ),
  (
    'contract_cost_plus_standard',
    'Umowa kosztorysowa (koszt + marza)',
    'CONTRACTS',
    'standard',
    'masters/contract_cost_plus_standard/v1.0/contract_cost_plus_standard.docx',
    NULL,
    '1.0',
    true
  ),
  (
    'contract_with_materials_standard',
    'Umowa z klauzula materialowa',
    'CONTRACTS',
    'standard',
    'masters/contract_with_materials_standard/v1.0/contract_with_materials_standard.docx',
    NULL,
    '1.0',
    true
  ),
  (
    'contract_with_advance_standard',
    'Umowa z zaliczka i etapami',
    'CONTRACTS',
    'standard',
    'masters/contract_with_advance_standard/v1.0/contract_with_advance_standard.docx',
    NULL,
    '1.0',
    true
  ),
  (
    'contract_simple_order_standard',
    'Zlecenie / mini-umowa',
    'CONTRACTS',
    'standard',
    'masters/contract_simple_order_standard/v1.0/contract_simple_order_standard.docx',
    NULL,
    '1.0',
    true
  )
ON CONFLICT (template_key) DO NOTHING;

-- ============================================================
-- Komentarz: kazdy template_key jest unikalny (UNIQUE constraint).
-- docx_master_path wskazuje na lokalizacje w bucket 'document-masters'
-- zgodnie z konwencja z modeBFileFlow.ts:
--   masters/{template_key}/v{version}/{template_key}.docx
-- preview_pdf_path = NULL -- podglad PDF nie jest jeszcze wspierany.
-- ============================================================
