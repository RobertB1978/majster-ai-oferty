-- ============================================================
-- PR-02 (Mode B DOCX Pilot): bucket document-masters + storage RLS
-- Branch: claude/mode-b-pr02-docx-pilot-HHW1Y
-- Date: 2026-04-06
-- ============================================================
--
-- Tworzy prywatny bucket 'document-masters' dla Trybu B:
--
-- Struktura ścieżek w bucket:
--   master/{template_key}/{version}.docx    — master templates (zarządza admin)
--   working/{user_id}/{instance_id}.docx    — kopie robocze per użytkownik
--
-- PR-02 (pilot): Edge Function generate-mode-b-docx zapisuje wyłącznie do
-- working/{user_id}/{instance_id}.docx używając service_role (pomija RLS storage).
-- Polityki poniżej zabezpieczają bezpośredni dostęp z frontendu.
--
-- RLS storage:
--   working/ — użytkownik czyta/zapisuje tylko własny folder (user_id = auth.uid())
--   master/  — wszyscy authenticated czytają (admin zapisuje przez service_role)
-- ============================================================

-- ── Bucket ────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-masters',
  'document-masters',
  false,     -- private — brak publicznego URL
  52428800,  -- 50 MB limit per plik
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream'   -- fallback dla środowisk bez pełnego MIME
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── RLS na storage.objects ────────────────────────────────────────────────────
-- Uwaga: storage.objects ma już RLS włączone przez Supabase — tylko dodajemy polisy.

-- Użytkownik może czytać własne kopie robocze (working/{user_id}/*)
CREATE POLICY "doc_masters_working_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'document-masters'
    AND split_part(name, '/', 1) = 'working'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

-- Użytkownik może wstawiać własne kopie robocze
CREATE POLICY "doc_masters_working_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'document-masters'
    AND split_part(name, '/', 1) = 'working'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

-- Użytkownik może aktualizować własne kopie robocze (np. nowa wersja)
CREATE POLICY "doc_masters_working_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'document-masters'
    AND split_part(name, '/', 1) = 'working'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

-- Użytkownik może usuwać własne kopie robocze
CREATE POLICY "doc_masters_working_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'document-masters'
    AND split_part(name, '/', 1) = 'working'
    AND split_part(name, '/', 2) = auth.uid()::text
  );

-- Wszyscy authenticated mogą czytać master templates (folder master/)
-- Zapis do master/ wyłącznie przez service_role w Edge Functions
CREATE POLICY "doc_masters_master_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'document-masters'
    AND split_part(name, '/', 1) = 'master'
  );

-- ── Komentarz ─────────────────────────────────────────────────────────────────

COMMENT ON TABLE storage.buckets IS
  'Bucket document-masters dodany w PR-02 dla Trybu B (DOCX pilot). Ścieżki: master/ + working/. PR-02.';
