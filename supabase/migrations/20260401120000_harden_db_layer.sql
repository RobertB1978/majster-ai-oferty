-- ============================================================
-- Harden DB layer: document_instances FK + indexes
-- Branch: claude/harden-db-layer-9YQYt
-- Date: 2026-04-01
-- ============================================================
--
-- Zakres tej migracji (co zostało zmienione):
--   1. Partial indexes na kolumnach FK w document_instances
--      (client_id, offer_id, dossier_item_id) WHERE NOT NULL
--      — wymagane dla wydajnych skanów ON DELETE SET NULL
--      — przydatne dla zapytań aplikacji po FK
--   2. FK constraints NOT VALID na miękkich FK w document_instances
--      (client_id → clients, offer_id → offers,
--       dossier_item_id → project_dossier_items)
--      — NOT VALID = brak pełnego skanu tabeli, zero ryzyka locka
--      — ON DELETE SET NULL zachowuje oryginalny zamiar projektu
--        (dokument przeżywa usunięcie klienta/oferty)
--
-- Co zostało ocenione ale NIE zmienione (celowo):
--
--   A. Precyzja numeryczna offer_items (unit_price_net, qty, vat_rate, line_total_net)
--      — ODROCZONE: ALTER COLUMN TYPE wymaga przepisania tabeli (table rewrite)
--        z lockiem ACCESS EXCLUSIVE — ryzyko przestoju na produkcji
--      — Aktualne zachowanie jest poprawne: line_total_net zapisywany przez
--        ROUND(,2) w save_offer_items; sumy w offers są już numeric(14,2)
--      — Brak rzeczywistego buga; ryzyko zmiany > korzyść
--      — Wymaga osobnego okna serwisowego + zatwierdzenia właściciela
--
--   B. Unikalne ograniczenie na media_library.storage_path
--      — ODROCZONE: PostgreSQL nie obsługuje UNIQUE NOT VALID
--        (NOT VALID działa tylko dla FK i CHECK)
--      — Wymagałoby najpierw audytu istniejących danych pod kątem duplikatów
--      — Wymaga zatwierdzenia właściciela
--
--   C. Indeksy media_library i photo_project_links
--      — BRAK ZMIAN: obie tabele mają już kompletne indeksy z migracji PR-1
--        (20260330120000_media_library_foundation.sql)
--      — Nie zidentyfikowano brakujących indeksów o praktycznej wartości
--
-- Kompatybilność wsteczna: w pełni zachowana
--   — Constrainty NOT VALID nie odrzucają istniejących wierszy
--   — Indeksy są tylko addytywne
--   — Kod aplikacji nie wymaga zmian
--
-- Rollback:
--   ALTER TABLE public.document_instances
--     DROP CONSTRAINT IF EXISTS doc_instances_client_id_fkey;
--   ALTER TABLE public.document_instances
--     DROP CONSTRAINT IF EXISTS doc_instances_offer_id_fkey;
--   ALTER TABLE public.document_instances
--     DROP CONSTRAINT IF EXISTS doc_instances_dossier_item_id_fkey;
--   DROP INDEX IF EXISTS idx_doc_instances_client_id;
--   DROP INDEX IF EXISTS idx_doc_instances_offer_id;
--   DROP INDEX IF EXISTS idx_doc_instances_dossier_item_id;
--
-- Ryzyko lockowania:
--   — ADD CONSTRAINT NOT VALID: zajmuje ShareRowExclusiveLock na krótko
--     (tylko aktualizacja metadanych, bez skanu tabeli) — bezpieczne
--   — CREATE INDEX: zajmuje ShareLock — nie blokuje odczytów, blokuje zapisy
--     na czas budowania indeksu. Dla małej tabeli (nowa funkcja) jest to
--     akceptowalne. Na dużej tabeli należałoby użyć CONCURRENTLY (wymaga
--     osobnego skryptu poza transakcją).
-- ============================================================

-- ── Krok 1: Partial indexes na kolumnach FK ──────────────────────────────────
-- WHERE NOT NULL: indeks obejmuje tylko wiersze z faktycznym powiązaniem,
-- co redukuje rozmiar indeksu i przyspiesza skany ON DELETE SET NULL.

CREATE INDEX IF NOT EXISTS idx_doc_instances_client_id
  ON public.document_instances (client_id)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_doc_instances_offer_id
  ON public.document_instances (offer_id)
  WHERE offer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_doc_instances_dossier_item_id
  ON public.document_instances (dossier_item_id)
  WHERE dossier_item_id IS NOT NULL;

-- ── Krok 2: FK constraints NOT VALID ────────────────────────────────────────
-- NOT VALID: constraint egzekwowany tylko dla NOWYCH wierszy.
-- Istniejące osierocone wiersze (jeśli są) nie są odrzucane.
-- ON DELETE SET NULL: usunięcie rodzica → kolumna staje się NULL,
-- dokument jest zachowany (zgodnie z oryginalnym projektem soft-FK).
--
-- Aby zwalidować istniejące dane w przyszłości (opcjonalnie, po audycie):
--   ALTER TABLE public.document_instances
--     VALIDATE CONSTRAINT doc_instances_client_id_fkey;
--   (itd. dla pozostałych)

ALTER TABLE public.document_instances
  ADD CONSTRAINT doc_instances_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES public.clients(id)
  ON DELETE SET NULL
  NOT VALID;

ALTER TABLE public.document_instances
  ADD CONSTRAINT doc_instances_offer_id_fkey
  FOREIGN KEY (offer_id)
  REFERENCES public.offers(id)
  ON DELETE SET NULL
  NOT VALID;

ALTER TABLE public.document_instances
  ADD CONSTRAINT doc_instances_dossier_item_id_fkey
  FOREIGN KEY (dossier_item_id)
  REFERENCES public.project_dossier_items(id)
  ON DELETE SET NULL
  NOT VALID;

-- ── Komentarze ────────────────────────────────────────────────────────────────

COMMENT ON CONSTRAINT doc_instances_client_id_fkey ON public.document_instances IS
  'FK NOT VALID: egzekwowany dla nowych wierszy. ON DELETE SET NULL zachowuje dokument po usunięciu klienta. Dodano 2026-04-01 (harden-db-layer).';

COMMENT ON CONSTRAINT doc_instances_offer_id_fkey ON public.document_instances IS
  'FK NOT VALID: egzekwowany dla nowych wierszy. ON DELETE SET NULL zachowuje dokument po usunięciu oferty. Dodano 2026-04-01 (harden-db-layer).';

COMMENT ON CONSTRAINT doc_instances_dossier_item_id_fkey ON public.document_instances IS
  'FK NOT VALID: egzekwowany dla nowych wierszy. ON DELETE SET NULL zachowuje dokument po usunięciu elementu dossier. Dodano 2026-04-01 (harden-db-layer).';
