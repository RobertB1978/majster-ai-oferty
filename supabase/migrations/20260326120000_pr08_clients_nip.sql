-- PR-08: CRM + Cennik
-- Dodaje kolumnę NIP (numer identyfikacji podatkowej) do tabeli clients
-- NIP jest opcjonalny — majster może mieć zarówno firmy jak i osoby prywatne jako klientów

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS nip TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.clients.nip IS 'NIP klienta (opcjonalny) — 10-cyfrowy numer identyfikacji podatkowej PL';
