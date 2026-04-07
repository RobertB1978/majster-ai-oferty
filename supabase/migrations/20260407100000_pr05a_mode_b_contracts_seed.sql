-- ============================================================
-- PR-05a (Mode B Base Contracts): seed 5 umów bazowych
-- Branch: claude/mode-b-base-contracts-S01Lh
-- Date: 2026-04-07
-- ============================================================
--
-- Wstawia 5 umów bazowych do document_master_templates.
-- Generacja DOCX jest realizowana przez Edge Function generate-docx-mode-b
-- (używa npm:docx — budowanie struktury od zera, Plan B wg ADR-0013 §7.4).
-- Pole docx_master_path = NULL bo generator nie potrzebuje pliku bazowego.
--
-- template_key jest stabilnym kluczem — NIGDY nie zmieniać.
-- Zmiana wymaga nowej migracji z migracja danych.
-- ============================================================

INSERT INTO public.document_master_templates
  (template_key, name, category, quality_tier, docx_master_path, preview_pdf_path, version, is_active)
VALUES
  (
    'contract_fixed_price_premium',
    'Umowa o roboty budowlane — ryczałt',
    'CONTRACTS',
    'premium',
    NULL,
    NULL,
    '1.0',
    true
  ),
  (
    'contract_cost_plus_standard',
    'Umowa kosztorysowa (koszt + marża)',
    'CONTRACTS',
    'standard',
    NULL,
    NULL,
    '1.0',
    true
  ),
  (
    'contract_materials_standard',
    'Umowa z klauzulą materiałową',
    'CONTRACTS',
    'standard',
    NULL,
    NULL,
    '1.0',
    true
  ),
  (
    'contract_advance_stages_premium',
    'Umowa z zaliczką i etapami',
    'CONTRACTS',
    'premium',
    NULL,
    NULL,
    '1.0',
    true
  ),
  (
    'contract_simple_short',
    'Zlecenie / mini-umowa',
    'CONTRACTS',
    'short_form',
    NULL,
    NULL,
    '1.0',
    true
  )
ON CONFLICT (template_key) DO UPDATE SET
  name        = EXCLUDED.name,
  category    = EXCLUDED.category,
  quality_tier = EXCLUDED.quality_tier,
  version     = EXCLUDED.version,
  is_active   = EXCLUDED.is_active,
  updated_at  = now();

COMMENT ON TABLE public.document_master_templates IS
  'Registry master templates dla Trybu B. PR-01 (schema) + PR-05a (seed umów bazowych).';
