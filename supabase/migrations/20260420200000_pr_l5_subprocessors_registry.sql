-- PR-L5: Subprocessors registry — source of truth for DPA dynamic section.
-- Replaces the static s4content in legal_documents/i18n with a live DB table.
-- Only repo-evidenced providers are seeded (see docs/legal/SUBPROCESSORS_REGISTRY_AND_DPA.md).

-- ============================================================
-- TABLE: subprocessors
-- ============================================================
CREATE TABLE public.subprocessors (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        NOT NULL,
  name            text        NOT NULL,
  category        text        NOT NULL,
  purpose         text        NOT NULL,
  data_categories text        NULL,
  location        text        NULL,
  transfer_basis  text        NULL,
  dpa_url         text        NULL,
  privacy_url     text        NULL,
  status          text        NOT NULL DEFAULT 'active',
  display_order   integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT subprocessors_slug_unique UNIQUE (slug),
  CONSTRAINT subprocessors_status_check CHECK (
    status IN ('active', 'inactive', 'planned')
  )
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX subprocessors_status_order_idx ON public.subprocessors (status, display_order ASC);
CREATE INDEX subprocessors_slug_idx         ON public.subprocessors (slug);

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.subprocessors_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subprocessors_updated_at
  BEFORE UPDATE ON public.subprocessors
  FOR EACH ROW EXECUTE FUNCTION public.subprocessors_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.subprocessors ENABLE ROW LEVEL SECURITY;

-- Public read-only: anon and authenticated users may read active rows.
-- This is intentional — DPA is a public legal document.
-- No INSERT/UPDATE/DELETE for any non-admin role (admin CRUD is a follow-up PR).
CREATE POLICY "subprocessors_select_public_active"
  ON public.subprocessors
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- ============================================================
-- SEED: repo-evidenced providers only
-- Evidence sources listed in docs/legal/SUBPROCESSORS_REGISTRY_AND_DPA.md
-- ============================================================
INSERT INTO public.subprocessors
  (slug, name, category, purpose, data_categories, location, transfer_basis, dpa_url, privacy_url, status, display_order)
VALUES
  -- src/integrations/supabase/client.ts + package.json @supabase/supabase-js
  (
    'supabase',
    'Supabase Inc.',
    'infrastructure',
    'Hosting bazy danych, autentykacja użytkowników, przechowywanie plików, Edge Functions, realtime subscriptions',
    'Dane konta użytkownika, dane projektów i ofert, pliki firmowe, logi sesji',
    'USA',
    'SCC (Standard Contractual Clauses)',
    'https://supabase.com/legal/dpa',
    'https://supabase.com/privacy',
    'active',
    10
  ),
  -- supabase/functions/send-offer-email/index.ts — RESEND_API_KEY env var
  (
    'resend',
    'Resend',
    'email',
    'Wysyłka emaili transakcyjnych (oferty dla klientów, powiadomienia systemowe)',
    'Adres email odbiorcy, treść oferty lub powiadomienia',
    'USA',
    'SCC (Standard Contractual Clauses)',
    'https://resend.com/legal/dpa',
    'https://resend.com/privacy',
    'active',
    20
  ),
  -- src/lib/sentry.ts + package.json @sentry/react + vite.config.ts sentryVitePlugin
  (
    'sentry',
    'Sentry Inc.',
    'monitoring',
    'Monitoring błędów aplikacji i wydajności (aktywowany wyłącznie za zgodą na analytics)',
    'Anonimizowane dane techniczne przeglądarki, ślady błędów bez danych osobowych',
    'USA',
    'SCC (Standard Contractual Clauses)',
    'https://sentry.io/legal/dpa/',
    'https://sentry.io/privacy/',
    'active',
    30
  ),
  -- src/hooks/useStripe.ts + src/components/billing/ + migration 20251217000000_add_stripe_integration.sql
  (
    'stripe',
    'Stripe Inc.',
    'payments',
    'Obsługa płatności za subskrypcje i zarządzanie planem rozliczeniowym',
    'Dane płatnicze i subskrypcji (przetwarzane bezpośrednio przez Stripe, nie przez Majster.AI)',
    'USA',
    'SCC (Standard Contractual Clauses)',
    'https://stripe.com/legal/dpa',
    'https://stripe.com/privacy',
    'active',
    40
  ),
  -- supabase/functions/_shared/ai-provider.ts — OpenAI primary, gpt-4o-mini default model
  (
    'openai',
    'OpenAI',
    'ai',
    'Generowanie wycen budowlanych, analiza finansowa, obsługa zapytań AI (główny provider AI)',
    'Treść zapytań AI: dane projektów i materiałów budowlanych (bez danych osobowych klientów)',
    'USA',
    'SCC (Standard Contractual Clauses)',
    'https://openai.com/policies/data-processing-addendum',
    'https://openai.com/policies/privacy-policy',
    'active',
    50
  ),
  -- supabase/functions/_shared/ai-provider.ts — Anthropic alternative, claude-3-5-sonnet default
  -- NOTE: dpa_url is NULL — Anthropic DPA URL not confirmed at time of seeding (UNKNOWN)
  (
    'anthropic',
    'Anthropic',
    'ai',
    'Generowanie wycen budowlanych, analiza finansowa, obsługa zapytań AI (alternatywny provider AI)',
    'Treść zapytań AI: dane projektów i materiałów budowlanych (bez danych osobowych klientów)',
    'USA',
    'SCC (Standard Contractual Clauses)',
    NULL,
    'https://www.anthropic.com/privacy',
    'active',
    51
  ),
  -- supabase/functions/_shared/ai-provider.ts — Gemini alternative, gemini-2.5-flash default
  (
    'gemini',
    'Google LLC (Gemini)',
    'ai',
    'Generowanie wycen budowlanych, analiza finansowa, obsługa zapytań AI (alternatywny provider AI)',
    'Treść zapytań AI: dane projektów i materiałów budowlanych (bez danych osobowych klientów)',
    'USA',
    'SCC (Standard Contractual Clauses)',
    'https://cloud.google.com/terms/data-processing-addendum',
    'https://policies.google.com/privacy',
    'active',
    52
  ),
  -- src/lib/analytics/plausible.ts + index.html script injection via CookieConsent
  -- EU-hosted (Plausible Insights OÜ, Estonia) — no third-country transfer
  (
    'plausible',
    'Plausible Insights OÜ',
    'analytics',
    'Analityka odwiedzin strony (aktywowana wyłącznie za zgodą, bez plików cookie, bez odcisków palca)',
    'Anonimizowane dane odwiedzin (brak danych osobowych, brak identyfikatorów sesji)',
    'EU (Estonia)',
    NULL,
    'https://plausible.io/dpa',
    'https://plausible.io/privacy',
    'active',
    60
  ),
  -- vite.config.ts VERCEL_ENV + VERCEL_GIT_COMMIT_SHA — hosting evidence
  -- status='planned': deployment target evidenced by config but not confirmed as art.28 processor
  (
    'vercel',
    'Vercel Inc.',
    'infrastructure',
    'Hosting aplikacji frontendowej i sieć CDN (potencjalny podmiot przetwarzający — zależny od konfiguracji deploymentu)',
    NULL,
    'USA',
    'SCC (Standard Contractual Clauses)',
    'https://vercel.com/legal/dpa',
    'https://vercel.com/legal/privacy-policy',
    'planned',
    70
  );
