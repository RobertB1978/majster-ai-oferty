-- ============================================================
-- PR-L1: Versioned Legal Documents Foundation
-- ============================================================
-- Creates:
--   legal_documents     — source of truth for legal doc versions
--   legal_acceptances   — audit trail of user acceptances
--
-- This is the foundation for all later compliance work:
-- signup acceptance binding, DSAR, audit trail, legal CMS,
-- retention and breach workflows.
--
-- Bootstrap seed: PL versions for privacy/terms/cookies/dpa/rodo
-- at version 1.0, effective 2026-04-20.
-- Content is stored as i18n references until PR-L2 migrates
-- the full text into the DB.
-- ============================================================

-- ----------------------------------------------------------------
-- 1. legal_documents
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text        NOT NULL,
  language       text        NOT NULL,
  version        text        NOT NULL,
  title          text        NOT NULL,
  content        text        NOT NULL,
  status         text        NOT NULL DEFAULT 'draft'
                               CONSTRAINT legal_documents_status_check
                               CHECK (status IN ('draft', 'published', 'archived')),
  published_at   timestamptz NULL,
  effective_at   timestamptz NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Only one published version of a slug+language at a time.
-- Enforced via partial unique index (not a constraint, to allow multiple drafts).
CREATE UNIQUE INDEX IF NOT EXISTS legal_documents_published_slug_lang_uq
  ON public.legal_documents (slug, language)
  WHERE status = 'published';

-- Fast lookups by slug/language/status (frontend fetch path)
CREATE INDEX IF NOT EXISTS legal_documents_slug_lang_status_idx
  ON public.legal_documents (slug, language, status);

-- ----------------------------------------------------------------
-- 2. legal_acceptances
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL,
  legal_document_id   uuid        NOT NULL
                        REFERENCES public.legal_documents(id)
                        ON DELETE RESTRICT,
  accepted_at         timestamptz NOT NULL DEFAULT now(),
  acceptance_source   text        NOT NULL,
  ip_hash             text        NULL,
  user_agent          text        NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Fast "has this user accepted this document?" check
CREATE INDEX IF NOT EXISTS legal_acceptances_user_doc_idx
  ON public.legal_acceptances (user_id, legal_document_id);

-- All acceptances for a user (DSAR export path)
CREATE INDEX IF NOT EXISTS legal_acceptances_user_idx
  ON public.legal_acceptances (user_id);

-- ----------------------------------------------------------------
-- 3. RLS
-- ----------------------------------------------------------------
ALTER TABLE public.legal_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

-- legal_documents: public read for published docs; no user writes.
-- Writes happen only via service role (migrations / legal CMS in future).

DROP POLICY IF EXISTS "legal_documents_select_published" ON public.legal_documents;
CREATE POLICY "legal_documents_select_published"
  ON public.legal_documents
  FOR SELECT
  USING (status = 'published');

-- legal_acceptances: authenticated users can INSERT their own rows.
DROP POLICY IF EXISTS "legal_acceptances_insert_own" ON public.legal_acceptances;
CREATE POLICY "legal_acceptances_insert_own"
  ON public.legal_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- authenticated users can SELECT their own acceptances (DSAR/profile).
DROP POLICY IF EXISTS "legal_acceptances_select_own" ON public.legal_acceptances;
CREATE POLICY "legal_acceptances_select_own"
  ON public.legal_acceptances
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 4. updated_at trigger for legal_documents
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_legal_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_legal_documents_updated_at ON public.legal_documents;
CREATE TRIGGER trg_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_legal_documents_updated_at();

-- ----------------------------------------------------------------
-- 5. Bootstrap seed — PL versions, v1.0, effective 2026-04-20
-- ----------------------------------------------------------------
-- Content is stored as an i18n namespace reference.
-- Full text will be migrated to this column in PR-L2 (Legal CMS).
-- The reference format "i18n:<namespace>" is the explicit interim fallback
-- so no consumer can mistake it for real rendered legal text.

INSERT INTO public.legal_documents
  (slug, language, version, title, content, status, published_at, effective_at)
VALUES
  (
    'privacy', 'pl', '1.0',
    'Polityka Prywatności',
    'i18n:legal.privacy.*',
    'published',
    '2026-04-20T00:00:00Z',
    '2026-04-20T00:00:00Z'
  ),
  (
    'terms', 'pl', '1.0',
    'Regulamin Usługi',
    'i18n:legal.terms.*',
    'published',
    '2026-04-20T00:00:00Z',
    '2026-04-20T00:00:00Z'
  ),
  (
    'cookies', 'pl', '1.0',
    'Polityka Cookies',
    'i18n:legal.cookies.*',
    'published',
    '2026-04-20T00:00:00Z',
    '2026-04-20T00:00:00Z'
  ),
  (
    'dpa', 'pl', '1.0',
    'Umowa Powierzenia Danych (DPA)',
    'i18n:legal.dpa.*',
    'published',
    '2026-04-20T00:00:00Z',
    '2026-04-20T00:00:00Z'
  ),
  (
    'rodo', 'pl', '1.0',
    'Centrum RODO',
    'i18n:legal.rodo.*',
    'published',
    '2026-04-20T00:00:00Z',
    '2026-04-20T00:00:00Z'
  )
ON CONFLICT DO NOTHING;
