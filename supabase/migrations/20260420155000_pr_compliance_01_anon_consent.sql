-- ============================================================
-- PR-COMPLIANCE-01: Anonimowy audit trail zgód (P0-02)
-- ============================================================
-- Problem: migracja 20251207110925 (FIX PACK Δ1) usunęła politykę
-- "Anyone can insert consents" i zastąpiła ją wyłącznie politykami
-- TO authenticated. Skutek: anonimowi użytkownicy strony (przed
-- zalogowaniem) nie mogą zapisać swojej decyzji o cookies do bazy,
-- co narusza GDPR Art. 7(1) — administrator nie może wykazać zgody.
--
-- Oryginalna migracja 20251206073947 CELOWO miała "Anyone can insert
-- consents". Niniejsza migracja przywraca ten intent w sposób bezpieczny
-- i jawny jako osobna, idempotentna zmiana.
--
-- Bezpieczeństwo:
-- - INSERT (anon) — tylko zapis; SELECT/UPDATE/DELETE nadal wymagają auth
-- - Tabela user_consents zawiera wyłącznie: consent_type, granted,
--   user_agent, granted_at, created_at — brak PII poza UA
-- - Brak user_id przy anonimowym insertze jest prawidłowy (kolumna nullable)
-- ============================================================

-- Usuń politykę jeśli istnieje (idempotentna migracja)
DROP POLICY IF EXISTS "Anonymous users can insert cookie consents" ON public.user_consents;

-- Dodaj politykę INSERT dla roli anon (anonimowi odwiedzający stronę)
CREATE POLICY "Anonymous users can insert cookie consents"
ON public.user_consents
FOR INSERT
TO anon
WITH CHECK (
  -- user_id musi być NULL przy anonimowym insertze
  user_id IS NULL
  AND
  -- Dozwolone typy zgód dla anonimowych użytkowników (bez newsletter)
  consent_type IN ('cookies_essential', 'cookies_analytics', 'cookies_marketing')
);
