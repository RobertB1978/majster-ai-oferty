# Majster.AI — Billing Runbook (PR-20)

> **Cel:** Przewodnik operacyjny dla Stripe Billing — konfiguracja, testowanie, rollback.
> **Aktualizacja:** 2026-03-02 (PR-20)

---

## 1. Zmienne środowiskowe

### Frontend (Vercel Environment Variables)

| Zmienna | Wymagana | Opis |
|---------|----------|------|
| `VITE_SUPABASE_URL` | ✅ | URL projektu Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Klucz anon (publiczny) Supabase |
| `VITE_STRIPE_ENABLED` | ✅ | Ustaw `true` aby włączyć Stripe Checkout (domyślnie `false`) |
| `VITE_STRIPE_PRICE_PRO_MONTHLY` | ✅ (gdy Stripe aktywny) | ID ceny Pro miesięcznej z Stripe Dashboard (np. `price_1ABC...`) |
| `VITE_STRIPE_PRICE_PRO_YEARLY` | opcjonalna | ID ceny Pro rocznej |
| `VITE_STRIPE_PRICE_STARTER_MONTHLY` | opcjonalna | ID ceny Starter miesięcznej |
| `VITE_STRIPE_PRICE_BUSINESS_MONTHLY` | opcjonalna | ID ceny Business miesięcznej |
| `VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY` | opcjonalna | ID ceny Enterprise miesięcznej |

### Supabase Edge Functions Secrets

Ustaw w: Supabase Dashboard → Project Settings → Edge Functions → Secrets

| Sekret | Wymagany | Opis |
|--------|----------|------|
| `STRIPE_SECRET_KEY` | ✅ | Klucz tajny Stripe (zaczyna się od `sk_live_` lub `sk_test_`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Sekret webhooka z Stripe Dashboard (zaczyna się od `whsec_`) |
| `FRONTEND_URL` | ✅ | URL aplikacji (np. `https://majsterai.vercel.app`) |
| `SUPABASE_URL` | auto | Injektowany automatycznie przez Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | auto | Injektowany automatycznie przez Supabase |

---

## 2. URL webhooka Stripe

```
https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
```

### Konfiguracja w Stripe Dashboard

1. Zaloguj się na [dashboard.stripe.com](https://dashboard.stripe.com)
2. Idź do: **Developers → Webhooks → Add endpoint**
3. Wpisz URL webhooka (jak wyżej)
4. Wybierz zdarzenia do nasłuchiwania:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Po dodaniu skopiuj **Webhook signing secret** (`whsec_...`) i wstaw jako `STRIPE_WEBHOOK_SECRET` w Supabase secrets

---

## 3. Edge Functions

| Funkcja | Endpoint | Cel |
|---------|----------|-----|
| `create-checkout-session` | `/functions/v1/create-checkout-session` | Tworzy sesję Stripe Checkout |
| `stripe-webhook` | `/functions/v1/stripe-webhook` | Obsługuje zdarzenia Stripe (podpisanie + idempotencja) |
| `customer-portal` | `/functions/v1/customer-portal` | Otwiera Stripe Customer Portal dla użytkownika |

---

## 4. Testowanie w trybie testowym Stripe

### Krok 1: Skonfiguruj środowisko testowe

1. W Stripe Dashboard przełącz na **Test mode** (toggle w lewym górnym rogu)
2. Skopiuj testowy klucz tajny: `sk_test_...`
3. Ustaw go jako `STRIPE_SECRET_KEY` w Supabase secrets (testowe)
4. Utwórz produkt testowy i ceny w Stripe Dashboard → Products
5. Skopiuj Price ID (np. `price_test_abc123`) i ustaw jako `VITE_STRIPE_PRICE_PRO_MONTHLY`

### Krok 2: Testuj Checkout

1. Zaloguj się do aplikacji
2. Przejdź do `/app/plan`
3. Kliknij "Select plan Pro"
4. Zostaniesz przekierowany do Stripe Checkout
5. Użyj testowej karty: **4242 4242 4242 4242** (exp: dowolna przyszła, CVV: 123)
6. Po płatności wrócisz na `/app/plan?success=true`
7. Webhook powinien zaktualizować `user_subscriptions.plan_id` = `pro` i `status` = `active`

### Krok 3: Sprawdź aktualizację subskrypcji

```sql
-- W Supabase SQL Editor:
SELECT user_id, plan_id, status, stripe_customer_id, updated_at
FROM user_subscriptions
WHERE user_id = '<UUID_UZYTKOWNIKA>';
```

Oczekiwany wynik: `plan_id = 'pro'`, `status = 'active'`

### Krok 4: Testuj portal zarządzania

1. Użytkownik Pro → kliknij "Portal płatności"
2. Otwiera się Stripe Billing Portal (testowy)
3. Możesz anulować subskrypcję
4. Webhook `customer.subscription.deleted` → `plan_id` wraca do `free`

### Krok 5: Test odrzucenia nieprawidłowego webhooka

```bash
# Wyślij falszywy webhook (powinen otrzymać 400)
curl -X POST \
  https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=invalid,v1=invalid" \
  -d '{"type":"checkout.session.completed"}'
# Oczekiwana odpowiedź: 400 Webhook signature verification failed
```

### Krok 6: Testuj limit ofert (Free plan)

1. Użytkownik Free — wyślij 3 oferty (wyczerpuje limit)
2. Spróbuj wysłać 4. ofertę — powinna pokazać się `FreeTierPaywallModal`
3. Kliknij "Ulepsz do Pro" → przejdź do `/app/plan`
4. Po ulepszeniu do Pro — 4. oferta powinna przejść (brak blokady DB)

Weryfikacja server-side (SQL):
```sql
-- Wywołaj funkcję weryfikacyjną operatora:
SELECT * FROM public.verify_plan_limits_enforced('<UUID_UZYTKOWNIKA>');
-- Powinno pokazać: offers current_count < limit_value dla Pro
```

---

## 5. Bezpieczeństwo i zgodność

### Co jest chronione

- **Brak kluczy Stripe w przeglądarce:** Wszystkie sesje Checkout i Portal są tworzone server-side w Edge Functions
- **Weryfikacja podpisu webhooka:** `stripe.webhooks.constructEventAsync()` przed jakimkolwiek zapisem do DB
- **Idempotencja:** Tabela `stripe_events` (PRIMARY KEY na `event_id`) — duplikaty są pomijane
- **RLS na user_subscriptions:** Użytkownicy nie mogą sami zmieniać swojego planu przez API. Tylko service_role może pisać
- **Server-side limit ofert:** Trigger `trg_enforce_monthly_offer_send_limit` na tabeli `offers` — blokuje 4. ofertę w DB nawet jeśli klient obejdzie UI

### Logowanie (brak PII)

- Logowane: `user.id` (UUID), `event.type`, `event.id`
- NIE logowane: email, dane karty, kwoty transakcji, dane osobowe

### Retencja danych

| Tabela | Cel | Retencja |
|--------|-----|---------|
| `stripe_events` | Idempotencja | Min. 90 dni (zalecane: pruning po 1 roku) |
| `subscription_events` | Audyt | 5 lat (wymagania rachunkowości PL) |
| `user_subscriptions` | Aktywna subskrypcja | Przez czas życia konta |

**Backup:** Supabase automatyczne kopie zapasowe — retencja 30 dni (plan PRO).

---

## 6. Plan wycofania (Rollback)

### Jeśli webhook przestaje działać

1. Sprawdź logi: Supabase Dashboard → Edge Functions → stripe-webhook → Logs
2. Sprawdź sekrety: `STRIPE_SECRET_KEY` i `STRIPE_WEBHOOK_SECRET` ustawione
3. Stripe automatycznie ponawia zdarzenia przez 3 dni — webhook jest idempotentny

### Jeśli trigger ofert blokuje prawidłowych użytkowników

```sql
-- Tymczasowe wyłączenie triggera (tylko w nagłości!):
ALTER TABLE public.offers DISABLE TRIGGER trg_enforce_monthly_offer_send_limit;
-- Po naprawieniu:
ALTER TABLE public.offers ENABLE TRIGGER trg_enforce_monthly_offer_send_limit;
```

### Pełny rollback migracji PR-20

```sql
-- 1. Usuń trigger i funkcję
DROP TRIGGER IF EXISTS trg_enforce_monthly_offer_send_limit ON public.offers;
DROP FUNCTION IF EXISTS public.enforce_monthly_offer_send_limit();

-- 2. Przywróć NOT NULL na subscription_events.subscription_id (jeśli potrzebne)
-- UWAGA: Spowoduje błąd jeśli są już NULL wartości w tabeli!
-- ALTER TABLE public.subscription_events ALTER COLUMN subscription_id SET NOT NULL;

-- 3. Przywróć polityki INSERT/UPDATE dla authenticated (UWAGA: obniża bezpieczeństwo!)
-- CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions
--   FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
--   FOR UPDATE TO authenticated USING (auth.uid() = user_id);
```

---

## 7. Mapowanie planów Stripe → wewnętrzne

| Stripe Price ID (przykładowy) | Plan wewnętrzny |
|-------------------------------|-----------------|
| `price_pro_monthly` | `pro` |
| `price_pro_yearly` | `pro` |
| `price_starter_monthly` | `starter` |
| `price_business_monthly` | `business` |
| `price_enterprise_monthly` | `enterprise` |

Mapowanie w: `supabase/functions/stripe-webhook/index.ts` → `PRICE_TO_PLAN_MAP`

**Ważne:** Zastąp przykładowe Price ID (`price_pro_monthly`) prawdziwymi ID z Stripe Dashboard.

---

## 8. Kontakt i eskalacja

W razie problemów z płatnościami:
- Stripe Dashboard: [dashboard.stripe.com](https://dashboard.stripe.com)
- Stripe Support: [support.stripe.com](https://support.stripe.com)
- Supabase Edge Functions logs: Supabase Dashboard → Edge Functions → stripe-webhook
