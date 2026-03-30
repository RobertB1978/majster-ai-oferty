-- ============================================================
-- Majster.AI — Skonsolidowany skrypt SQL do Supabase SQL Editor
-- Obejmuje: Warranties, Dossier (bucket), Photo Report (FK fix)
-- Data: 2026-03-30
-- Bezpieczny do wielokrotnego uruchomienia (idempotentny)
-- ============================================================
--
-- INSTRUKCJA:
--   1. Otwórz Supabase Dashboard → SQL Editor → New query
--   2. Wklej cały plik i kliknij Run (Ctrl+Enter)
--   3. Sukces = "Success. No rows returned" (brak czerwonych błędów)
--
-- Pokrywa migracje:
--   - 20260302200000_pr18_warranties.sql
--   - 20260329180000_fix_warranty_view_security_invoker.sql
--   - 20260329190000_fix_warranties_make_interval.sql
--   - 20260328000001_dossier_storage_bucket.sql
--   - 20260329000001_fix_project_photos_fk_v2.sql
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- CZĘŚĆ 1: Tabela project_warranties (gwarancje projektów)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.project_warranties (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id          uuid        NOT NULL REFERENCES public.v2_projects(id) ON DELETE CASCADE,
  client_email        text        NULL,
  client_name         text        NULL,
  contact_phone       text        NULL,
  warranty_months     integer     NOT NULL DEFAULT 24
                                  CHECK (warranty_months > 0 AND warranty_months <= 120),
  start_date          date        NOT NULL DEFAULT CURRENT_DATE,
  scope_of_work       text        NULL,
  exclusions          text        NULL,
  pdf_storage_path    text        NULL,
  reminder_30_sent_at timestamptz NULL,
  reminder_7_sent_at  timestamptz NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Indeksy
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_warranties_project_unique
  ON public.project_warranties (project_id);

CREATE INDEX IF NOT EXISTS idx_project_warranties_user_id
  ON public.project_warranties (user_id);

-- Indeks na obliczoną datę końca gwarancji (make_interval — poprawna wersja)
DROP INDEX IF EXISTS public.idx_project_warranties_end_date;

CREATE INDEX idx_project_warranties_end_date
  ON public.project_warranties (
    ((start_date + make_interval(months => warranty_months))::date)
  )
  WHERE reminder_30_sent_at IS NULL OR reminder_7_sent_at IS NULL;

-- RLS
ALTER TABLE public.project_warranties ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "warranties_select_own"
    ON public.project_warranties FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "warranties_insert_own"
    ON public.project_warranties FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "warranties_update_own"
    ON public.project_warranties FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "warranties_delete_own"
    ON public.project_warranties FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger: automatyczna aktualizacja updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_project_warranties_updated_at'
  ) THEN
    CREATE TRIGGER trg_project_warranties_updated_at
      BEFORE UPDATE ON public.project_warranties
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════
-- CZĘŚĆ 2: Widok project_warranties_with_end
-- (security_invoker + make_interval — finalna wersja)
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.project_warranties_with_end
  WITH (security_invoker = on)
AS
SELECT
  id,
  user_id,
  project_id,
  client_email,
  client_name,
  contact_phone,
  warranty_months,
  start_date,
  ((start_date + make_interval(months => warranty_months))::date) AS end_date,
  scope_of_work,
  exclusions,
  pdf_storage_path,
  reminder_30_sent_at,
  reminder_7_sent_at,
  created_at,
  updated_at
FROM public.project_warranties;


-- ════════════════════════════════════════════════════════════
-- CZĘŚĆ 3: Prywatny bucket `dossier` + polityki RLS storage
-- ════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('dossier', 'dossier', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  CREATE POLICY "dossier_objects_select_own"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'dossier'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "dossier_objects_insert_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'dossier'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "dossier_objects_update_own"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'dossier'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "dossier_objects_delete_own"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'dossier'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ════════════════════════════════════════════════════════════
-- CZĘŚĆ 4: project_photos — naprawa FK → v2_projects
-- ════════════════════════════════════════════════════════════

-- Usuń stare FK (do starej tabeli projects)
ALTER TABLE public.project_photos
  DROP CONSTRAINT IF EXISTS project_photos_project_id_fkey;

-- Dodaj nowe FK do v2_projects (NOT VALID = nie waliduje starych wierszy)
DO $$
BEGIN
  ALTER TABLE public.project_photos
    ADD CONSTRAINT project_photos_project_id_v2_fkey
    FOREIGN KEY (project_id)
    REFERENCES public.v2_projects(id) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON CONSTRAINT project_photos_project_id_v2_fkey
  ON public.project_photos
  IS 'FK do v2_projects. NOT VALID zachowuje stare rekordy sprzed PR-15.';


-- ════════════════════════════════════════════════════════════
-- KONIEC SKRYPTU
-- ════════════════════════════════════════════════════════════
