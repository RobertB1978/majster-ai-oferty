-- ============================================================
-- Fix: polityka storage dla anonimowych pobierań z publicznej teczki
--
-- Branch: claude/fix-dossier-download-aKGGG
-- Data: 2026-04-03
-- ============================================================
--
-- Problem:
--   Publiczna strona teczki (/d/:token) wywołuje createSignedUrl()
--   za pomocą klienta anonimowego. Istniejąca polityka storage
--   "dossier_objects_select_own" wymaga auth.uid() = ścieżka[1],
--   więc dla anonimowych użytkowników zwraca false → signed_url = ''
--   → brak przycisków Podgląd i Pobierz.
--
-- Rozwiązanie:
--   Nowa polityka "dossier_objects_select_via_share_token" pozwala
--   KAŻDEMU użytkownikowi (anonimowemu lub zalogowanemu) odczytywać
--   obiekty dossier, jeśli plik należy do projektu z aktywnym tokenem
--   udostępniania.
--
-- Model bezpieczeństwa:
--   - file_path jest nieprzegadywalny (user_id/project_id/kategoria/ts_nazwa)
--   - Dostęp przez ten zasób wymaga znajomości ścieżki pliku
--   - Ścieżkę pliku można uzyskać TYLKO przez resolve_dossier_share_token()
--     (która waliduje token — UUID v4, 122 bity entropii)
--   - Odwołanie WSZYSTKICH tokenów projektu natychmiast cofa dostęp
--   - Polityka nie rozszerza dostępu do plików bez aktywnego tokenu
--
-- Rollback:
--   DROP POLICY IF EXISTS "dossier_objects_select_via_share_token"
--     ON storage.objects;
--   DROP INDEX IF EXISTS idx_project_dossier_items_file_path;
-- ============================================================

-- ── 1. Indeks na file_path dla wydajnych JOIN-ów w polityce ──────────────────

CREATE INDEX IF NOT EXISTS idx_project_dossier_items_file_path
  ON public.project_dossier_items (file_path);

-- ── 2. Polityka storage: dostęp przez token udostępniania ────────────────────

DO $$
BEGIN
  CREATE POLICY "dossier_objects_select_via_share_token"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'dossier'
      AND EXISTS (
        SELECT 1
        FROM public.project_dossier_share_tokens pdt
        JOIN public.project_dossier_items pdi
          ON pdi.project_id = pdt.project_id
          AND pdi.file_path = storage.objects.name
        WHERE pdt.expires_at > NOW()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
