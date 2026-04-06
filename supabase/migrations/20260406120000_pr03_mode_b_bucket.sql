-- ============================================================
-- PR-03 (Mode B File Flow): Storage bucket `document-masters`
-- Branch: claude/mode-b-file-flow-sSoAI
-- Date: 2026-04-06
-- Wymaga: 20260406110000_pr01_mode_b_document_instances_ext.sql
-- ============================================================
--
-- Tworzy prywatny bucket `document-masters` dla Trybu B (DOCX-based documents).
--
-- Konwencja ścieżek:
--
--   masters/{template_key}/v{version}/{template_key}.docx
--     — nienaruszalne wzorce master DOCX
--     — dostęp wyłącznie przez service_role w Edge Functions
--     — użytkownicy NIE mają bezpośredniego dostępu
--
--   working/{user_id}/{instance_id}/v{version_number}.docx
--     — kopie robocze per instancja (document_instances.file_docx)
--     — dostęp user-scoped: tylko właściciel może czytać/zapisywać
--
-- RLS Storage:
--   SELECT/INSERT/UPDATE/DELETE na working/* tylko przez właściciela (user_id = auth.uid())
--   masters/* — brak polisy dla authenticated; dostęp tylko przez service_role (Edge Functions)
--
-- Bezpieczeństwo:
--   public = false — brak publicznych URL
--   Signed URLs jako jedyna ścieżka dostępu dla working copy (TTL 1h)
--   Signed URLs dla dostępu przez Edge Functions do masters (TTL 5min — edge-side)
-- ============================================================

-- ── 1. Utwórz prywatny bucket ─────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('document-masters', 'document-masters', false)
ON CONFLICT (id) DO NOTHING;

-- ── 2. RLS dla working copy — SELECT (właściciel czyta własne pliki) ──────────
-- Ścieżka: working/{user_id}/{instance_id}/v{version_number}.docx
-- storage.foldername('working/uid/inst/v1.docx') → {working, uid, inst}
-- [2] to user_id

DO $$
BEGIN
  CREATE POLICY "doc_masters_working_select_own"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'document-masters'
      AND name LIKE 'working/%'
      AND auth.uid()::text = (storage.foldername(name))[2]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. RLS dla working copy — INSERT ─────────────────────────────────────────

DO $$
BEGIN
  CREATE POLICY "doc_masters_working_insert_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'document-masters'
      AND name LIKE 'working/%'
      AND auth.uid()::text = (storage.foldername(name))[2]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. RLS dla working copy — UPDATE ─────────────────────────────────────────

DO $$
BEGIN
  CREATE POLICY "doc_masters_working_update_own"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'document-masters'
      AND name LIKE 'working/%'
      AND auth.uid()::text = (storage.foldername(name))[2]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 5. RLS dla working copy — DELETE ─────────────────────────────────────────
-- Używane przy usuwaniu instancji (cleanup storage)

DO $$
BEGIN
  CREATE POLICY "doc_masters_working_delete_own"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'document-masters'
      AND name LIKE 'working/%'
      AND auth.uid()::text = (storage.foldername(name))[2]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Uwaga na masters/* ────────────────────────────────────────────────────────
-- Brak polis SELECT/INSERT/UPDATE/DELETE dla authenticated na masters/*.
-- Wzorce master DOCX są dostępne wyłącznie przez service_role (Edge Functions).
-- Zwykły użytkownik nie może bezpośrednio odczytać surowego master DOCX.
-- Signed URLs na masters/* są generowane wyłącznie server-side (Edge Functions).
