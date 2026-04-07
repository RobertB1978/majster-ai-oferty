-- ============================================================
-- PR-B4: Deactivate seeded master templates until DOCX files are uploaded
-- Branch: claude/premium-docs-publish-gate-nrtmH
-- Date: 2026-04-07
-- Wymaga: 20260407100000_pr05a_seed_master_templates.sql
-- ============================================================
--
-- UZASADNIENIE MIGRACJI:
--   PR-05a (seed) ustawił is_active=true dla 5 szablonów umów PRZED
--   faktycznym przesłaniem plików DOCX do Supabase Storage (bucket 'document-masters').
--   Bramka publish-gate PR-B4 opiera się na regule:
--     is_active=true AND docx_master_path IS NOT NULL
--   Bez tej migracji szablony byłyby widoczne w /app/ready-documents mimo
--   braku rzeczywistych plików — co prowadzi do martwych akcji w UI.
--
-- AKCJA:
--   Reset is_active=false dla szablonów których pliki DOCX nie zostały jeszcze
--   przesłane przez właściciela do bucketu 'document-masters'.
--
-- JAK UDOSTĘPNIĆ SZABLON PO UPLOADZIE:
--   1. Prześlij plik DOCX do Supabase Storage (bucket: document-masters)
--      Ścieżka: masters/{template_key}/v{version}/{template_key}.docx
--   2. Wykonaj w Supabase Dashboard (SQL Editor):
--      UPDATE document_master_templates
--      SET is_active = true, updated_at = now()
--      WHERE template_key = '<template_key>';
--
-- BEZPIECZNE PONOWNE URUCHOMIENIE: idempotent (WHERE is_active = true).
-- ============================================================

UPDATE public.document_master_templates
SET
  is_active  = false,
  updated_at = now()
WHERE
  template_key IN (
    'contract_fixed_price_standard',
    'contract_cost_plus_standard',
    'contract_with_materials_standard',
    'contract_with_advance_standard',
    'contract_simple_order_standard'
  )
  AND is_active = true;

-- ============================================================
-- WERYFIKACJA (opcjonalna, można uruchomić po migracji):
--   SELECT template_key, is_active, docx_master_path
--   FROM document_master_templates
--   ORDER BY template_key;
--   Oczekiwany wynik: is_active = false dla wszystkich 5 rekordów.
-- ============================================================
