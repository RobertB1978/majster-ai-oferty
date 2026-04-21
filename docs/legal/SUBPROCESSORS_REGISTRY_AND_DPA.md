# PR-L5 — Subprocessors Registry and DPA Dynamic Section

## Co było (stan przed PR-L5)

Sekcja 4 ("Podprzetwarzcy") w DPA była **statyczna** — jej treść była zapisana jako klucz `legal.dpa.s4content` w plikach i18n (`pl.json`, `en.json`, `uk.json`) oraz jako snapshot w tabeli `legal_documents` (migracja `20260420170000_pr_legal_l1b_content_snapshot.sql`).

Dodanie lub zmiana podprocesora wymagała:
1. Edycji pliku JSON (i18n)
2. Nowej migracji SQL aktualizującej snapshot
3. Deploymentu aplikacji

Było to niezgodne z wymaganiami operacyjnymi (art. 28 RODO wymaga aktualnej listy).

## Co jest teraz (źródło prawdy po PR-L5)

Tabela `public.subprocessors` w Supabase jest jedynym źródłem prawdy dla listy podprocesorów.

```
supabase/migrations/20260420200000_pr_l5_subprocessors_registry.sql
```

Sekcja s4 w DPA (`src/pages/legal/DPA.tsx`) renderuje dane dynamicznie przez hook `usePublicSubprocessors` (`src/hooks/usePublicSubprocessors.ts`).

Dodanie nowego podprocesora = INSERT do tabeli (przyszły PR admin-CRUD).

## Schemat tabeli

```sql
public.subprocessors (
  id              uuid PRIMARY KEY,
  slug            text UNIQUE NOT NULL,    -- identyfikator maszynowy
  name            text NOT NULL,           -- wyświetlana nazwa
  category        text NOT NULL,           -- infrastructure|email|monitoring|payments|ai|analytics
  purpose         text NOT NULL,           -- cel przetwarzania
  data_categories text NULL,              -- kategorie danych (może być UNKNOWN)
  location        text NULL,              -- kraj/region
  transfer_basis  text NULL,              -- podstawa transferu (SCC/NULL dla EU)
  dpa_url         text NULL,              -- link do DPA dostawcy
  privacy_url     text NULL,              -- link do polityki prywatności
  status          text NOT NULL DEFAULT 'active',  -- active|inactive|planned
  display_order   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL,
  updated_at      timestamptz NOT NULL
)
```

## Zaseedowani podprzetwarzcy i ich evidencja

### Aktywni (status = 'active')

| slug | Nazwa | Evidencja w repo |
|------|-------|-----------------|
| `supabase` | Supabase Inc. | `src/integrations/supabase/client.ts`, `package.json: @supabase/supabase-js` |
| `resend` | Resend | `supabase/functions/send-offer-email/index.ts` — `RESEND_API_KEY` env var |
| `sentry` | Sentry Inc. | `src/lib/sentry.ts`, `package.json: @sentry/react`, `vite.config.ts: sentryVitePlugin` |
| `stripe` | Stripe Inc. | `src/hooks/useStripe.ts`, `src/components/billing/`, migracja `20251217000000_add_stripe_integration.sql` |
| `openai` | OpenAI | `supabase/functions/_shared/ai-provider.ts` — primary provider, model `gpt-4o-mini` |
| `anthropic` | Anthropic | `supabase/functions/_shared/ai-provider.ts` — alternative provider, model `claude-3-5-sonnet` |
| `gemini` | Google LLC (Gemini) | `supabase/functions/_shared/ai-provider.ts` — alternative provider, model `gemini-2.5-flash` |
| `plausible` | Plausible Insights OÜ | `src/lib/analytics/plausible.ts`, `index.html` (script injection via CookieConsent) |

### Planowani (status = 'planned')

| slug | Nazwa | Evidencja | Powód 'planned' |
|------|-------|-----------|-----------------|
| `vercel` | Vercel Inc. | `vite.config.ts: VERCEL_ENV`, `VERCEL_GIT_COMMIT_SHA` | Konfiguracja deploymentu obecna, ale rola procesora art.28 niepotwierdzna — wymaga weryfikacji przez Roberta |

## Pola UNKNOWN / nullable i dlaczego

| Pole | Rekord | Status | Wyjaśnienie |
|------|--------|--------|-------------|
| `dpa_url` | `anthropic` | UNKNOWN | Anthropic nie publikował dedykowanego DPA URL w momencie seedowania — należy sprawdzić i uzupełnić |
| `data_categories` | `vercel` | NULL | Niepewne jakie dane osobowe przechodzą przez Vercel — zależy od konfiguracji (edge functions, analytics) |
| `transfer_basis` | `plausible` | NULL (intentional) | Plausible jest hostowany w EU (Estonia) — brak transferu do krajów trzecich, SCC nie jest wymagane |

## Zachowanie frontendu

| Stan | Wynik |
|------|-------|
| DB OK, dane istnieją | Dynamiczna lista podprocesorów z linkami DPA/Privacy |
| DB OK, brak active | Empty state: "Brak zarejestrowanych podprocesorów" |
| DB niedostępne (error) | Fallback: statyczna treść z i18n `legal.dpa.s4content` + komunikat |
| Ładowanie | Brak spinnerów — React Query zarządza stanem, default `[]` podczas ładowania |

Pliki i18n zachowują klucz `s4content` jako fallback dla błędów DB. Nie został usunięty.

## RLS — polityka dostępu

```sql
-- Tylko wiersze active są widoczne publicznie (anonimowo i dla zalogowanych)
CREATE POLICY "subprocessors_select_public_active"
  ON public.subprocessors FOR SELECT TO anon, authenticated
  USING (status = 'active');
```

- Brak polityk INSERT/UPDATE/DELETE — tylko admin CRUD (follow-up PR)
- Wiersze `status='planned'` i `status='inactive'` są **niewidoczne** dla frontendu
- DPA shows only confirmed active processors to the public

## Co przyszły PR admin-management doda

- Panel `/admin/legal/subprocessors` — CRUD lista podprocesorów
- Polityki RLS dla roli admin (INSERT/UPDATE na admin role)
- Historia zmian / changelog wpisów (audit trail przez `compliance_audit_log`)
- Powiadomienia email o nowych podprocesorach (14-dniowe uprzedzenie per art. 28 RODO)
- Publiczna strona `/legal/subprocessors` (pełna lista z paginacją)

## Rollback

W razie konieczności cofnięcia PR-L5:

1. **Frontend** — przywróć poprzednią wersję `DPA.tsx` (git revert lub git checkout):
   ```bash
   git revert <commit-hash>
   ```

2. **Baza danych** — DROP tabeli (tylko jeśli migracja nie jest w produkcji):
   ```sql
   DROP TABLE IF EXISTS public.subprocessors CASCADE;
   DROP FUNCTION IF EXISTS public.subprocessors_set_updated_at() CASCADE;
   ```
   **UWAGA:** Jeśli migracja jest w produkcji, nie droppuj — dezaktywuj UI zamiast tego.

3. **i18n** — pliki `pl.json`, `en.json`, `uk.json` zachowują klucz `s4content` z oryginalną treścią — fallback działa bez zmian.

4. **Hook i typ** — usuń `src/hooks/usePublicSubprocessors.ts` i `src/types/subprocessors.ts`.

## Uwagi compliance

- Providery AI (OpenAI, Anthropic, Gemini) **nie były wymienione** w poprzednim DPA s4. PR-L5 je dodaje.
- Plausible **nie był wymieniony** w DPA. PR-L5 go dodaje.
- Vercel jest w `status='planned'` — wymaga decyzji Roberta czy jest art.28 procesorem.
- Transfer basis dla AI providerów: SCC — zgodnie z obecną praktyką OpenAI/Anthropic/Google.
- Anthropic DPA URL: **UNKNOWN** — należy sprawdzić `https://www.anthropic.com/legal` i uzupełnić.
