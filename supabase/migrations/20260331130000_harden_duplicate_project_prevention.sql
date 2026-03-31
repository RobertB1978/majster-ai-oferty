-- ============================================================
-- Harden duplicate project prevention
-- Branch: claude/prevent-duplicate-projects-QqXt0
-- Date: 2026-03-31
-- ============================================================
--
-- Zmiany:
--   1. Dodanie 'CANCELLED' do CHECK constraint v2_projects.status
--      (naprawia błąd: useDeleteProjectV2 ustawia status = CANCELLED
--       co naruszało CHECK z PR-13 dopuszczający tylko
--       ACTIVE | COMPLETED | ON_HOLD)
--
--   2. Częściowy unikalny indeks na v2_projects(source_offer_id)
--      dla aktywnych projektów — data-level guard przeciwko duplikatom
--      w warunkach race condition (dwa równoczesne żądania tworzenia
--      projektu z tej samej zaakceptowanej oferty).
--
-- Reguły biznesowe zachowane:
--   - Jedna zaakceptowana oferta → co najwyżej jeden aktywny projekt
--   - Po anulowaniu projektu można stworzyć nowy z tej samej oferty
--   - Projekty ręczne (source_offer_id IS NULL) nie są objęte indeksem
--   - Różne oferty mogą tworzyć osobne projekty (różne source_offer_id)
--   - Wiele ofert w jednym projekcie NIE jest blokowane — ta reguła
--     jest po stronie tabeli offers, nie v2_projects
-- ============================================================

-- 1. Fix CANCELLED status in v2_projects CHECK constraint
-- ─────────────────────────────────────────────────────────
-- PR-13 stworzył CHECK: status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD').
-- Soft-delete hook (useDeleteProjectV2) ustawia status = 'CANCELLED',
-- co naruszało ten constraint powodując błąd 23514 przy każdym usunięciu.
-- Naprawka: znajdź i usuń istniejący constraint, dodaj nowy z CANCELLED.

DO $$
DECLARE
  v_conname text;
BEGIN
  -- Znajdź CHECK constraint na kolumnie status w v2_projects
  -- (PostgreSQL auto-nazwuje je {table}_{column}_check)
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'public.v2_projects'::regclass
    AND contype = 'c'
    AND conname LIKE '%status%'
  ORDER BY conname
  LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.v2_projects DROP CONSTRAINT %I', v_conname);
  END IF;
END;
$$;

ALTER TABLE public.v2_projects
  ADD CONSTRAINT v2_projects_status_check
  CHECK (status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'));

COMMENT ON CONSTRAINT v2_projects_status_check ON public.v2_projects IS
  'Dozwolone statusy projektu. CANCELLED = soft-delete (useDeleteProjectV2).';

-- 2. Częściowy unikalny indeks: jeden aktywny projekt per źródłowa oferta
-- ────────────────────────────────────────────────────────────────────────
-- Zapobiega duplikatom ACTIVE/COMPLETED/ON_HOLD projektów z tej samej oferty.
-- Uzupełnia app-level findProjectBySourceOffer() o data-level invariant
-- chroniący przed race condition (dwa równoczesne żądania POST).
--
-- Dlaczego PARTIAL (warunki WHERE):
--   a) source_offer_id IS NOT NULL  — projekty ręczne (null FK) bez ograniczeń
--   b) status != 'CANCELLED'        — anulowane projekty nie blokują nowych
--
-- Reguła biznesowa zachowana:
--   Indeks jest na tabeli v2_projects, nie na offers.
--   Oferta-A, Oferta-B, Oferta-C mogą każda stworzyć własny projekt
--   (różne wartości source_offer_id → brak kolizji).
--   "Wiele ofert do jednego projektu" to relacja po stronie offers
--   i NIE jest blokowana tym indeksem.

CREATE UNIQUE INDEX IF NOT EXISTS uq_v2_projects_active_source_offer
  ON public.v2_projects (source_offer_id)
  WHERE status != 'CANCELLED'
    AND source_offer_id IS NOT NULL;

COMMENT ON INDEX public.uq_v2_projects_active_source_offer IS
  'Data-level guard: co najwyżej jeden aktywny (nie-CANCELLED) projekt '
  'per source_offer_id. Wyklucza NULL source_offer_id (projekty ręczne). '
  'Wyklucza CANCELLED (pozwala na nowy projekt po anulowaniu). '
  'Nie blokuje wielu ofert w jednym projekcie.';
