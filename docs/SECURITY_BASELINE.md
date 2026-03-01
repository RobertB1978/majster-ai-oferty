# Majster.AI — Security Baseline & RLS Standard

> **Status:** ACTIVE — stosowany od PR-02 (2026-03-01)
> **Właściciel:** Tech Lead (Claude) + Product Owner (Robert B.)
> **Powiązane:** [`ROADMAP.md`](./ROADMAP.md) · [`ADR-0002-csp-frame-ancestors.md`](./ADR/ADR-0002-csp-frame-ancestors.md) · [`security/ai-safety.md`](./security/ai-safety.md)

---

## Dla laika (bez żargonu)

Ten dokument to **zbiór reguł bezpieczeństwa**, które obowiązują każdego dewelopera pracującego nad Majster.AI.

- **RLS** = zamki w bazie danych — użytkownik A nie zobaczy danych użytkownika B
- **IDOR** = test, gdzie próbujemy przekraść się do cudzych danych — i powinno to być niemożliwe
- **CSP** = lista zaufanych stron, które przeglądarka ma prawo załadować
- **Rate limiting** = ograniczenie liczby zapytań — ochrona przed spamem i atakami

---

## 1. RLS-by-Default: Zasada Obowiązkowa

### Reguła

> **Każda nowa tabela zawierająca dane użytkowników MUSI mieć:**
> 1. Kolumnę `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
> 2. `ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;`
> 3. Cztery polityki: SELECT, INSERT, UPDATE, DELETE oparte na `auth.uid() = user_id`

Nie ma wyjątków. Tabele bez RLS = luka bezpieczeństwa klasy krytycznej.

### Uzasadnienie

Supabase domyślnie **nie blokuje** dostępu do danych bez RLS. Jeśli tabela nie ma włączonego RLS, każdy zalogowany użytkownik może odczytać dane każdego innego użytkownika przez API. RLS to pierwsza i najważniejsza linia obrony.

### Konwencja nazewnictwa polityk

```sql
-- Format: <tabela>_<akcja>_<zakres>
-- Przykłady:
clients_select_own          -- użytkownik widzi tylko swoje
projects_insert_own         -- użytkownik tworzy tylko swoje
quotes_update_own           -- użytkownik edytuje tylko swoje
offers_delete_own           -- użytkownik usuwa tylko swoje
admin_settings_select_org_admin   -- admin org widzi ustawienia org
```

---

## 2. Szablon Migracji — Copy/Paste

Przy tworzeniu **każdej nowej tabeli** skopiuj poniższy szablon i dostosuj do nazwy tabeli:

```sql
-- ============================================================
-- SZABLON RLS — skopiuj i dostosuj do nowej tabeli
-- Plik: supabase/migrations/YYYYMMDDHHMMSS_<uuid>.sql
-- ============================================================

-- 1. Utwórz tabelę z obowiązkowym user_id
CREATE TABLE public.<tabela> (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... pozostałe kolumny ...
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Włącz RLS (ZAWSZE, bez wyjątku)
ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;

-- 3. Polityka SELECT — użytkownik widzi tylko swoje wiersze
CREATE POLICY "<tabela>_select_own"
  ON public.<tabela> FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Polityka INSERT — użytkownik tworzy tylko pod swoim user_id
CREATE POLICY "<tabela>_insert_own"
  ON public.<tabela> FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Polityka UPDATE — użytkownik edytuje tylko swoje
CREATE POLICY "<tabela>_update_own"
  ON public.<tabela> FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Polityka DELETE — użytkownik usuwa tylko swoje
CREATE POLICY "<tabela>_delete_own"
  ON public.<tabela> FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Indeks na user_id (obowiązkowy dla wydajności + RLS scan)
CREATE INDEX idx_<tabela>_user_id ON public.<tabela>(user_id);

-- ============================================================
-- WERYFIKACJA (uruchom ręcznie na lokalnej bazie):
-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE tablename = '<tabela>' AND schemaname = 'public';
-- -- rowsecurity musi być TRUE
-- ============================================================
```

### Szablon dla tabel organizacyjnych (wiele użytkowników w jednej org)

Gdy tabela należy do organizacji (nie do pojedynczego użytkownika):

```sql
CREATE TABLE public.<tabela_org> (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  -- ... pozostałe kolumny ...
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.<tabela_org> ENABLE ROW LEVEL SECURITY;

-- Wszyscy członkowie org mogą czytać
CREATE POLICY "<tabela_org>_select_org_member"
  ON public.<tabela_org> FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Tylko admini org mogą tworzyć
CREATE POLICY "<tabela_org>_insert_org_admin"
  ON public.<tabela_org> FOR INSERT
  WITH CHECK (
    public.current_user_is_org_admin(organization_id)
    AND created_by = auth.uid()
  );

-- Tylko admini org mogą edytować
CREATE POLICY "<tabela_org>_update_org_admin"
  ON public.<tabela_org> FOR UPDATE
  USING (public.current_user_is_org_admin(organization_id));

-- Tylko admini org mogą usuwać
CREATE POLICY "<tabela_org>_delete_org_admin"
  ON public.<tabela_org> FOR DELETE
  USING (public.current_user_is_org_admin(organization_id));

CREATE INDEX idx_<tabela_org>_organization_id
  ON public.<tabela_org>(organization_id);
```

---

## 3. Procedura IDOR — Test Izolacji Tenantów

**IDOR** (Insecure Direct Object Reference) = błąd, gdy użytkownik A może
odczytać/zmodyfikować dane użytkownika B podając właściwy identyfikator.

### Kiedy przeprowadzać test

- Przy każdej nowej tabeli z danymi użytkownika (PR-08, PR-13, itp.)
- Po każdej modyfikacji polityk RLS
- Przed każdym merge PR dotyczącym danych wrażliwych

### Procedura (ręczna / semiautomatyczna)

#### Krok 1: Przygotowanie środowiska

```bash
# Lokalny Supabase musi być uruchomiony
npx supabase start

# Alternatywnie: użyj środowiska testowego (nie produkcji!)
```

#### Krok 2: Utwórz dwóch użytkowników testowych

```
Użytkownik A:  test-user-a@majster-test.local  /  hasło: TestPass123!
Użytkownik B:  test-user-b@majster-test.local  /  hasło: TestPass123!
```

Uwaga: używaj adresów e-mail w domenie `*.local` lub `*.test` — nigdy prawdziwych adresów.

#### Krok 3: Zaloguj się jako Użytkownik A i utwórz dane

```typescript
// Przykład dla tabeli 'clients' (dostosuj do testowanej tabeli)
const { data: recordA } = await supabase
  .from('clients')
  .insert({ name: 'Klient testowy A', user_id: userA.id })
  .select()
  .single();

console.log('ID rekordu A:', recordA.id);
// Zapisz ID — będzie potrzebne w kroku 4
```

#### Krok 4: Zaloguj się jako Użytkownik B i próbuj dostać się do danych A

```typescript
// Test 1: SELECT — próba odczytu cudzego rekordu
const { data: stolen, error: selectError } = await supabase
  .from('clients')
  .select('*')
  .eq('id', recordA.id)  // ID należące do Użytkownika A
  .single();

// OCZEKIWANE: data === null, error.code === 'PGRST116' (not found)
// BŁĄD BEZPIECZEŃSTWA: data zawiera dane Użytkownika A

// Test 2: UPDATE — próba modyfikacji cudzego rekordu
const { error: updateError } = await supabase
  .from('clients')
  .update({ name: 'Hakowane przez B' })
  .eq('id', recordA.id);

// OCZEKIWANE: error (0 wierszy zmienione lub permission denied)
// BŁĄD BEZPIECZEŃSTWA: brak błędu lub wiersze zmienione > 0

// Test 3: DELETE — próba usunięcia cudzego rekordu
const { error: deleteError } = await supabase
  .from('clients')
  .delete()
  .eq('id', recordA.id);

// OCZEKIWANE: error lub 0 wierszy usuniętych
// BŁĄD BEZPIECZEŃSTWA: wiersz usunięty
```

#### Krok 5: Weryfikacja przez bezpośrednie API (anon key)

```bash
# Zastąp <ANON_KEY>, <PROJECT_URL>, <JWT_USER_B>, <RECORD_A_ID>
curl -X GET \
  "<PROJECT_URL>/rest/v1/clients?id=eq.<RECORD_A_ID>" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <JWT_USER_B>" \
  -H "Accept: application/json"

# OCZEKIWANE: [] (pusta tablica)
# BŁĄD BEZPIECZEŃSTWA: tablica zawiera dane Użytkownika A
```

#### Krok 6: Zapis wyników

Dodaj do PR description:

```markdown
### Test IDOR — wyniki
- Tabela: `clients`
- Data: 2026-XX-XX
- SELECT: ✅ DENIED (empty result)
- UPDATE: ✅ DENIED (0 rows affected)
- DELETE: ✅ DENIED (0 rows affected)
- API curl: ✅ DENIED (empty array)
```

### Automatyzacja (przyszłość)

W PR-08 i późniejszych, gdy powstaną tabele produkcyjne, testy IDOR
zostaną zaimplementowane jako testy Vitest w pliku
`src/test/security/idor.test.ts`. Procedura ręczna obowiązuje do PR-07 włącznie.

---

## 4. Logowanie i Higiena Danych

### Zasady logowania

```
❌ NIGDY nie loguj:
   - haseł, tokenów JWT, kluczy API
   - imion i nazwisk, adresów e-mail, numerów telefonu
   - NIP, PESEL, numerów kont bankowych
   - treści wiadomości od użytkowników
   - pełnych obiektów z request.body (mogą zawierać PII)

✅ LOGUJ:
   - user_id (UUID — nie jest PII, nie pozwala zidentyfikować osoby bez bazy)
   - request_id (do korelacji logów)
   - kody błędów i statusy HTTP
   - nazwy akcji (np. "offer.created", "pdf.generated")
   - czasy wykonania (ms)
```

### Request ID — standard korelacji

Każda Edge Function powinna propagować `request_id` w logach:

```typescript
// supabase/functions/_shared/request-id.ts (wzorzec do stosowania)

export function getRequestId(req: Request): string {
  return req.headers.get('x-request-id') ??
         req.headers.get('cf-ray') ??       // Cloudflare Ray ID
         crypto.randomUUID();
}

export function logWithRequestId(
  requestId: string,
  level: 'info' | 'warn' | 'error',
  action: string,
  meta: Record<string, unknown> = {}
): void {
  // meta NIE może zawierać PII — sprawdź przed wywołaniem
  console[level](JSON.stringify({
    request_id: requestId,
    action,
    ts: new Date().toISOString(),
    ...meta,
  }));
}
```

**Użycie w Edge Function:**

```typescript
import { getRequestId, logWithRequestId } from '../_shared/request-id.ts';

Deno.serve(async (req) => {
  const requestId = getRequestId(req);

  logWithRequestId(requestId, 'info', 'offer.create.start', {
    user_id: userId,  // ✅ UUID jest OK
    // email: user.email  ❌ NIE loguj emaila
  });

  // ... logika ...

  logWithRequestId(requestId, 'info', 'offer.create.done', {
    offer_id: offer.id,
    duration_ms: Date.now() - startTime,
  });

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,  // zwróć request_id w nagłówku
    },
  });
});
```

### Komunikaty błędów dla użytkownika

```
❌ Zbyt szczegółowe (ujawniają strukturę systemu):
   "User with email jan@example.com not found in database"
   "Column 'user_id' violates foreign key constraint"
   "JWT expired at 2026-03-01T10:00:00Z"

✅ Poprawne (generyczne, bezpieczne):
   "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie."
   "Wystąpił błąd. Spróbuj ponownie za chwilę."
   "Sesja wygasła. Zaloguj się ponownie."
```

---

## 5. Content Security Policy (CSP)

### Stan obecny (AKTYWNY)

Majster.AI ma już wdrożone nagłówki bezpieczeństwa w `vercel.json`.
Poniżej dokumentacja obecnego stanu i uzasadnienia.

#### Aktualna polityka CSP (vercel.json)

```
default-src 'self';
script-src 'self' https://cdn.jsdelivr.net https://unpkg.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https: blob:;
connect-src 'self'
  https://*.supabase.co
  wss://*.supabase.co
  https://api.openai.com
  https://api.anthropic.com
  https://generativelanguage.googleapis.com
  https://sentry.io
  https://*.sentry.io;
media-src 'self' blob:;
object-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests
```

#### Inne nagłówki bezpieczeństwa (aktywne)

| Nagłówek | Wartość | Cel |
|----------|---------|-----|
| `X-Frame-Options` | `DENY` | Blokuje osadzanie w iframe (clickjacking) |
| `X-Content-Type-Options` | `nosniff` | Blokuje MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Starsze przeglądarki (legacy) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Minimalizacja danych w nagłówku Referer |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Wymusza HTTPS |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Blokuje uprawnienia urządzenia domyślnie |

#### Oczekująca decyzja: frame-ancestors dla `/offer/`

Patrz: [`ADR-0002-csp-frame-ancestors.md`](./ADR/ADR-0002-csp-frame-ancestors.md)

Obecne zachowanie: strony ofert (`/offer/*`) są blokowane przed osadzaniem
w iframe mimo ustawienia `X-Frame-Options: SAMEORIGIN` — globalne CSP
`frame-ancestors 'none'` ma pierwszeństwo.

**Rekomendacja (potwierdzona przez ADR-0002):** Pozostaw opcję A (maksymalne
bezpieczeństwo) dopóki nie ma konkretnego wymagania biznesowego dla iframe.

#### Przyszłe zmiany CSP — procedura

Każda zmiana CSP wymaga:
1. Osobnego ADR dokumentującego decyzję
2. Testu w przeglądarce (DevTools → Console, brak błędów CSP)
3. Osobnego PR z zakresem tylko `vercel.json`
4. Zatwierdzenia przez Product Ownera

#### CSP Reporting (TODO)

Edge Function `csp-report` jest już zarejestrowana w `config.toml`.
Należy podłączyć ją do nagłówka `report-uri` lub `report-to` w vercel.json:

```json
// Do dodania w przyszłym PR (CSP Reporting):
{
  "key": "Content-Security-Policy",
  "value": "... ; report-uri /functions/v1/csp-report"
}
```

---

## 6. Rate Limiting — Stanowisko

### Gdzie stosować

| Punkt wejścia | Podejście | Priorytet |
|---------------|-----------|-----------|
| Edge Functions (publiczne) | Limit per IP w kodzie funkcji | PR-12 (approve-offer), PR-13 |
| Edge Functions (auth) | Supabase Auth wbudowany limit | Aktywny domyślnie |
| `public-api` (Edge Function) | Rate limiting per API key | PR-08 lub osobny PR |
| `client-question` (publiczny) | Limit per IP + per offer token | PR-12 |

### Co NIE jest teraz implementowane

Rate limiting aplikacyjny (per-user, per-endpoint) zostanie wdrożony
przy konkretnych funkcjach w późniejszych PR-ach. Nie implementujemy
generycznego rate limitera "na zapas".

### Wzorzec dla Edge Functions (do użycia gdy potrzebny)

```typescript
// supabase/functions/_shared/rate-limit.ts (wzorzec referencyjny)
// Implementuj TYLKO gdy konkretna funkcja tego wymaga

const RATE_LIMIT_WINDOW_MS = 60_000;  // 1 minuta
const RATE_LIMIT_MAX_REQUESTS = 10;   // 10 zapytań / minutę / IP

// Prosta implementacja in-memory (działa per-instance Deno)
// Dla produkcji rozważ Redis lub Supabase KV (gdy dostępne)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;  // dozwolone
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // przekroczono limit
  }

  record.count++;
  return true;
}
```

---

## 7. Cookies i Sesje

### Supabase Auth — stan obecny

Supabase zarządza sesjami automatycznie przez:
- **JWT** w `localStorage` (domyślne dla Supabase JS v2 w SPA)
- **httpOnly cookies** — opcja dostępna, wymaga server-side rendering

### Uwagi bezpieczeństwa (stan informacyjny)

```
Obecne: JWT w localStorage
Ryzyko: XSS może ukraść token (React JSX auto-escape minimalizuje ryzyko)
Mitygacja: CSP blokuje zewnętrzne skrypty; React nie używa innerHTML z danymi

Alternatywa: httpOnly cookies (wymaga SSR lub proxy — poza zakresem MVP)
```

### Konfiguracja Supabase (aktywna)

```typescript
// src/integrations/supabase/client.ts
// Supabase automatycznie obsługuje:
// - Odświeżanie tokenów
// - Wygasanie sesji
// - Wylogowanie po zamknięciu przeglądarki (sessionStorage option)
```

Zmiana na httpOnly cookies: osobny ADR + PR gdy platforma przejdzie na SSR.

---

## 8. Kopie zapasowe i Usuwanie Danych

### Backup (stan informacyjny — zarządza Supabase)

- **Retencja:** Supabase Pro/Team utrzymuje Point-in-Time Recovery (PITR) przez 7 dni (Plan Pro) lub dłużej.
- **Rekomendacja:** Dla danych produkcyjnych skonfiguruj PITR na min. 30 dni.
- **Backupy codzienne:** Automatyczne na Supabase — weryfikuj w Dashboard → Database → Backups.

### Usuwanie danych użytkownika (RODO / Apple)

Gdy użytkownik żąda usunięcia konta (funkcja `delete-user-account`):

1. **Dane w bazie:** `ON DELETE CASCADE` na `user_id` zapewnia kaskadowe usunięcie rekordów powiązanych
2. **Pliki w Storage:** Edge Function musi jawnie usunąć pliki z Supabase Storage (`supabase.storage.from('...').remove([...])`)
3. **Dane w backupach:** Backupy przechowują historyczne snapshoty — usunięcie z backupów następuje po upłynięciu okresu retencji. Należy to udokumentować w Polityce Prywatności.
4. **Dane eksportowe/emailowe:** Jeśli dane trafiły do zewnętrznych systemów (Resend, Sentry), obsłużyć per wymagania tych platform.

---

## 9. Checklista Bezpieczeństwa per PR (Scope: tabele z danymi)

Skopiuj do opisu PR gdy PR tworzy lub modyfikuje tabele z danymi użytkownika:

```markdown
### Checklista bezpieczeństwa RLS — PR-XX

**RLS:**
- [ ] Nowa tabela ma kolumnę `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- [ ] `ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;` w migracji
- [ ] Polityki SELECT / INSERT / UPDATE / DELETE oparte na `auth.uid() = user_id`
- [ ] Nazwy polityk zgodne z konwencją: `<tabela>_<akcja>_<zakres>`
- [ ] Indeks `idx_<tabela>_user_id` utworzony

**Test IDOR:**
- [ ] Test SELECT: Użytkownik B nie widzi rekordów Użytkownika A → `[]`
- [ ] Test UPDATE: Użytkownik B nie może edytować rekordów A → 0 wierszy
- [ ] Test DELETE: Użytkownik B nie może usunąć rekordów A → 0 wierszy
- [ ] Wyniki testu wklejone w opis PR (sekcja "Test IDOR — wyniki")

**Logowanie:**
- [ ] Logi nie zawierają PII (e-mail, imię, telefon)
- [ ] Request ID propagowany w nowych Edge Functions
- [ ] Komunikaty błędów dla użytkownika są generyczne
```

---

## 10. Co Muszą Spełniać Przyszłe PR-y

Każdy PR, który **tworzy nowe tabele z danymi użytkownika**, musi:

1. Użyć szablonu migracji z **Sekcji 2** tego dokumentu.
2. Przeprowadzić test IDOR z **Sekcji 3** i wkleić wyniki do opisu PR.
3. Upewnić się, że logi przestrzegają reguł z **Sekcji 4**.
4. Wypełnić checklistę z **Sekcji 9** w opisie PR.

PR-y, które **nie dotykają tabel z danymi**, mogą pominąć sekcje 2, 3 i 9,
ale nadal obowiązuje reguła logowania (Sekcja 4).

Zmiany w `vercel.json` (CSP, nagłówki) wymagają osobnego ADR zgodnie z **Sekcją 5**.

---

*Dokument: v1.0 | Data: 2026-03-01 | PR-02 Security Baseline + RLS Standard*
*Autor: Claude (Tech Lead Majster.AI) | Właściciel: Robert B.*
