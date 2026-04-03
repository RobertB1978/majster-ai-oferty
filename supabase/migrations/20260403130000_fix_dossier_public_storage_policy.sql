-- ============================================================
-- Fix: polityka storage dla publicznej teczki — SECURITY DEFINER
--
-- Branch: claude/fix-dossier-delivery-BRxY3
-- Data: 2026-04-03
-- ============================================================
--
-- Problem:
--   Polityka "dossier_objects_select_via_share_token" (migracja 20260403120000)
--   używa EXISTS z JOIN na tabelach project_dossier_share_tokens i
--   project_dossier_items. Obie tabele mają RLS (auth.uid() = user_id).
--   Dla anonimowych użytkowników auth.uid() = NULL → RLS blokuje odczyt →
--   EXISTS zawsze zwraca false → createSignedUrl z kluczem anon nie działa →
--   publiczna strona teczki nie może wygenerować podpisanych URL-i.
--
-- Rozwiązanie:
--   1. Funkcja SECURITY DEFINER sprawdzająca, czy plik ma aktywny token
--      (omija RLS tabel dossier, bo działa z uprawnieniami właściciela funkcji)
--   2. Zastąpienie starej polityki nową, używającą tej funkcji
--
-- Model bezpieczeństwa:
--   - Funkcja sprawdza TYLKO istnienie aktywnego tokenu — nie eksponuje danych
--   - Ścieżkę pliku można uzyskać TYLKO przez resolve_dossier_share_token()
--     (UUID v4, 122 bity entropii, walidacja tokenu server-side)
--   - Odwołanie tokenu natychmiast cofa dostęp
--   - immutable + SECURITY DEFINER = bezpieczne użycie w polityce RLS
--
-- Rollback:
--   DROP POLICY IF EXISTS "dossier_objects_select_via_share_token"
--     ON storage.objects;
--   DROP FUNCTION IF EXISTS public.dossier_file_has_active_token(text);
--   -- Potem ponownie zastosuj migrację 20260403120000 jeśli potrzeba
-- ============================================================

-- ── 1. Funkcja SECURITY DEFINER ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.dossier_file_has_active_token(p_file_path text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE                              -- deterministyczna w ramach transakcji
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_dossier_share_tokens pdt
    JOIN public.project_dossier_items pdi
      ON pdi.project_id = pdt.project_id
    WHERE pdi.file_path = p_file_path
      AND pdt.expires_at > NOW()
  )
$$;

-- Dostęp wymagany: anon (publiczna strona) + authenticated (własne pliki)
GRANT EXECUTE ON FUNCTION public.dossier_file_has_active_token(text)
  TO anon, authenticated;

COMMENT ON FUNCTION public.dossier_file_has_active_token IS
  'Sprawdza czy plik dossier ma aktywny token udostępniania. SECURITY DEFINER — omija RLS. Używana w polityce storage.';

-- ── 2. Zastąpienie starej polityki ──────────────────────────────────────────

DROP POLICY IF EXISTS "dossier_objects_select_via_share_token" ON storage.objects;

DO $$
BEGIN
  CREATE POLICY "dossier_objects_select_via_share_token"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'dossier'
      AND public.dossier_file_has_active_token(name)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
