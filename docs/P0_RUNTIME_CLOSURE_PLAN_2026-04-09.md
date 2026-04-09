# P0 Runtime Closure Plan — Majster.AI
**Data:** 2026-04-09 | **Wersja:** 1.0 | **Właściciel:** Robert B.

---

## Podsumowanie (5 punktów)

- **Vercel** jest wdrożony, ale owner nie potwierdził jeszcze, że auto-deploy działa z właściwego brancha — bez tego nie ma pewności, że zmiany w kodzie docierają do użytkowników.
- **Supabase** ma 79 migracji w repozytorium — owner musi potwierdzić, że wszystkie są wdrożone na produkcji (1 komenda w terminalu lub screenshot).
- **Resend i Stripe** wymagają potwierdzenia, że sekrety (klucze API) są ustawione w Supabase Dashboard — bez tego e-maile i płatności nie działają.
- **Healthcheck** to gotowy endpoint diagnostyczny — jedno otwarcie linku w przeglądarce powie od razu, co działa, a co nie.
- **Live smoke flow** to ostateczna weryfikacja: 5 kroków w aplikacji, które potwierdzają, że cały system działa end-to-end dla prawdziwego użytkownika.

---

## Jak korzystać z tej listy

1. Idź od góry do dołu — każdy wiersz to jeden obszar.
2. Wykonaj opisaną akcję.
3. Porównaj wynik z kolumną „Oczekiwany wynik PASS".
4. Jeśli wynik jest inny — patrz kolumna „Co zrobić przy FAIL".
5. Zaznacz wiersz jako ✅ PASS lub ❌ FAIL.
6. Gdy wszystkie wiersze mają ✅ PASS — P0 runtime jest zamknięty.

---

## Tabela weryfikacji P0

---

### 1. VERCEL — prawda o runtime

| # | Co dokładnie sprawdzić | Gdzie to zrobić | Oczekiwany wynik PASS | Co oznacza FAIL | Co zrobić przy FAIL |
|---|---|---|---|---|---|
| V1 | Czy ostatni deploy ma status **Ready** | Zaloguj się na [vercel.com](https://vercel.com) → Twój projekt → zakładka **Deployments** | Pierwszy wiersz na liście ma zielony napis **Ready** + data maksymalnie z ostatnich 7 dni | Status **Error**, **Building** lub data sprzed miesięcy | Kliknij „Redeploy" przy ostatnim deployu. Jeśli nie pomaga — sprawdź logi błędów klikając w nazwę deploymentu |
| V2 | Czy auto-deploy jest podłączony do właściwego brancha | Vercel → Twój projekt → **Settings** → **Git** | W polu „Production Branch" widnieje `main`. W polu „Repository" widnieje `robertb1978/majster-ai-oferty` | Inne repozytorium, inny branch, lub brak połączenia | W Settings → Git → kliknij „Connect Git Repository" i wybierz właściwe repo + branch `main` |
| V3 | Czy zmienne środowiskowe są ustawione | Vercel → Settings → **Environment Variables** | Widać co najmniej: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — obie zaznaczone jako **Production** | Brak zmiennych lub brak zaznaczenia **Production** | Dodaj brakujące zmienne: kliknij **Add New**, wpisz nazwę i wartość, zaznacz **Production** |
| V4 | Czy aplikacja otwiera się pod produkcyjnym URL | Otwórz w przeglądarce adres Twojej aplikacji (np. `https://majster-ai.vercel.app`) | Strona główna ładuje się w ciągu 5 sekund, brak błędu `404` ani `500` | Biała strona, błąd `504`, lub komunikat o błędzie | Sprawdź logi w Vercel → zakładka **Functions** lub napisz do wsparcia Vercel |
| V5 | Czy certyfikat SSL jest aktywny | Vercel → Settings → **Domains** | Przy domenie widnieje zielona kłódka lub napis **Valid** | Czerwona kłódka, napis **Invalid** lub **Pending** | Kliknij domenę → **Refresh Certificate**. Poczekaj 30 minut i sprawdź ponownie |

---

### 2. SUPABASE — prawda o migracjach

| # | Co dokładnie sprawdzić | Gdzie to zrobić | Oczekiwany wynik PASS | Co oznacza FAIL | Co zrobić przy FAIL |
|---|---|---|---|---|---|
| S1 | Czy baza danych jest dostępna | Zaloguj się na [supabase.com](https://supabase.com) → Twój projekt → **Table Editor** | Widać listę tabel (np. `profiles`, `projects`, `offers`) | Komunikat „No tables found" lub błąd połączenia | Przejdź do **Project Settings** → **Database** i sprawdź, czy projekt nie jest „paused". Kliknij **Resume** jeśli jest wstrzymany |
| S2 | Ile migracji jest wdrożonych na produkcji | Supabase → **SQL Editor** → wklej i wykonaj: `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;` | Ostatnia wersja to `20260409100000` (lub nowsza). Lista zawiera co najmniej 79 pozycji | Ostatnia wersja jest starsza niż `20260409100000` lub jest mniej niż 79 migracji | Skontaktuj się z deweloperem — potrzebne jest ręczne wyrównanie migracji (`supabase db push` z właściwego środowiska) |
| S3 | Czy Edge Functions są wdrożone | Supabase → **Edge Functions** (lewa nawigacja) | Widać co najmniej 10 funkcji na liście, w tym: `healthcheck`, `send-offer-email`, `create-checkout-session`, `generate-pdf-v2` | Mniej niż 10 funkcji lub brak kluczowych | Skontaktuj się z deweloperem — potrzebne jest wdrożenie brakujących funkcji przez CI/CD |
| S4 | Czy wymagane sekrety są ustawione | Supabase → **Project Settings** → **Edge Functions** → **Secrets** | Widać co najmniej nazwy (nie wartości!): `RESEND_API_KEY`, `SENDER_EMAIL`, `FRONTEND_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Brakujące nazwy sekretów | Kliknij **Add new secret** dla każdego brakującego. Wartości pobierz z odpowiednich paneli (Resend, Stripe) |
| S5 | Czy RLS (zabezpieczenia) są aktywne | Supabase → **Authentication** → **Policies** | Przy każdej tabeli (np. `profiles`, `projects`, `offers`) widnieje napis „RLS enabled" lub kłódka | Któraś z głównych tabel nie ma włączonego RLS | Natychmiast powiadom dewelopera — wyłączone RLS to krytyczne zagrożenie bezpieczeństwa |

---

### 3. RESEND — prawda o e-mailach

| # | Co dokładnie sprawdzić | Gdzie to zrobić | Oczekiwany wynik PASS | Co oznacza FAIL | Co zrobić przy FAIL |
|---|---|---|---|---|---|
| R1 | Czy klucz API Resend jest aktywny | Zaloguj się na [resend.com](https://resend.com) → **API Keys** | Widoczny aktywny klucz API (zielony status lub data utworzenia) | Brak kluczy lub klucz nieaktywny | Kliknij **Create API Key**, skopiuj wartość i wklej do Supabase Secrets jako `RESEND_API_KEY` |
| R2 | Czy domena nadawcy jest zweryfikowana | Resend → **Domains** | Twoja domena (np. `majster-ai.pl`) ma status **Verified** (zielony) | Status **Pending** lub **Failed** | Dodaj brakujące rekordy DNS w panelu swojej domeny (Resend pokaże dokładnie jakie). Po dodaniu kliknij **Verify** |
| R3 | Czy `SENDER_EMAIL` w Supabase jest ustawiony poprawnie | Supabase → Project Settings → Edge Functions → Secrets | Wartość `SENDER_EMAIL` to adres z Twojej własnej domeny, np. `oferty@majster-ai.pl` — NIE może to być Gmail, Yahoo, WP, Onet | Ustawiony jest adres Gmail/Yahoo/WP/Onet lub brakuje sekretu | Zmień wartość na adres z Twojej zweryfikowanej domeny (np. `noreply@twoja-domena.pl`) |
| R4 | Czy e-mail testowy dociera | W aplikacji Majster.AI → utwórz ofertę → kliknij **Wyślij do klienta** → wpisz swój prywatny e-mail | Po max. 3 minutach e-mail z ofertą trafia do skrzynki. Brak spamu, poprawny nadawca | E-mail nie dotarł po 5 minutach, wylądował w spamie, lub wystąpił błąd w aplikacji | Sprawdź logi w Resend → **Logs**. Jeśli status **Delivered** ale nie dotarł → problem pocztowy odbiorcy. Jeśli status **Failed** → sprawdź punkt R2 i R3 |

---

### 4. STRIPE — prawda o płatnościach

| # | Co dokładnie sprawdzić | Gdzie to zrobić | Oczekiwany wynik PASS | Co oznacza FAIL | Co zrobić przy FAIL |
|---|---|---|---|---|---|
| P1 | Czy jesteś w trybie Live (nie Test) | Zaloguj się na [dashboard.stripe.com](https://dashboard.stripe.com) → górny pasek | W prawym górnym rogu widnieje **Live mode** (nie „Test mode") | Widnieje „Test mode" lub przełącznik jest wyłączony | Kliknij przełącznik Live/Test w prawym górnym rogu, aby przejść na Live. UWAGA: w Live potrzebne są prawdziwe klucze API |
| P2 | Czy klucze API (Live) są w Supabase | Stripe → **Developers** → **API keys** → skopiuj klucz `sk_live_...`. Sprawdź w Supabase Secrets, czy `STRIPE_SECRET_KEY` zaczyna się od `sk_live_` | Sekret `STRIPE_SECRET_KEY` w Supabase zaczyna się od `sk_live_` (nie `sk_test_`) | Klucz zaczyna się od `sk_test_` lub brakuje sekretu | Zaktualizuj `STRIPE_SECRET_KEY` w Supabase Secrets kluczem z przedrostkiem `sk_live_` |
| P3 | Czy webhook Stripe jest zarejestrowany | Stripe → **Developers** → **Webhooks** | Widoczny endpoint kończący się na `/functions/v1/stripe-webhook` ze statusem **Enabled** i przynajmniej zdarzeniami: `customer.subscription.updated`, `checkout.session.completed` | Brak endpointu lub status Disabled | Kliknij **Add endpoint**. URL: `https://TWÓJ_PROJEKT.supabase.co/functions/v1/stripe-webhook`. Wybierz zdarzenia: `customer.subscription.*` i `checkout.session.completed` |
| P4 | Czy sekret webhooka jest w Supabase | Stripe → Webhooks → kliknij endpoint → **Signing secret** → kliknij **Reveal**. Sprawdź, czy wartość zgadza się z `STRIPE_WEBHOOK_SECRET` w Supabase | Obie wartości są identyczne | Wartości różnią się lub brakuje sekretu | Skopiuj nowy sekret ze Stripe i wklej do Supabase Secrets jako `STRIPE_WEBHOOK_SECRET` |
| P5 | Czy płatność testowa przechodzi | W aplikacji → zakładka **Plan** → kliknij **Wybierz plan** → przejdź do kasy Stripe → użyj numeru karty testowej `4242 4242 4242 4242`, data przyszła, CVC `123` | Przekierowanie na stronę sukcesu, subskrypcja aktywna w aplikacji po 30 sekundach | Błąd Stripe, brak przekierowania lub plan nie aktywuje się | Sprawdź Stripe → **Events** → szukaj `checkout.session.completed`. Jeśli brak — webhook nie działa (wróć do P3/P4). Jeśli jest — problem z Edge Function, powiadom dewelopera |

---

### 5. HEALTHCHECK — prawda diagnostyczna

| # | Co dokładnie sprawdzić | Gdzie to zrobić | Oczekiwany wynik PASS | Co oznacza FAIL | Co zrobić przy FAIL |
|---|---|---|---|---|---|
| H1 | Uruchom pełny healthcheck | Otwórz w przeglądarce: `https://TWÓJ_PROJEKT_REF.supabase.co/functions/v1/healthcheck` (zamień `TWÓJ_PROJEKT_REF` na ID z Supabase → Project Settings → General → Reference ID) | Strona wyświetla JSON. Pole `"status"` ma wartość `"healthy"`. Pola `database`, `storage`, `auth`, `email` — wszystkie mają `"status": "pass"` | Pole `"status"` ma wartość `"degraded"` lub `"unhealthy"`. Któreś pole ma `"status": "fail"` | Patrz poniżej: tabela interpretacji |
| H2 | Interpretacja: `database: fail` | — | — | Baza danych nie odpowiada | Przejdź do Supabase → sprawdź czy projekt nie jest „paused". Kliknij **Resume** jeśli tak. Poczekaj 5 min i sprawdź ponownie |
| H3 | Interpretacja: `storage: fail` | — | — | Nie można odczytać plików (zdjęcia, PDF-y mogą nie działać) | Supabase → **Storage** → sprawdź czy widoczne są buckets (`offer-photos`, `project-photos`, `pdf-documents`) |
| H4 | Interpretacja: `email: not_configured` | — | — | Brakuje sekretów `RESEND_API_KEY` lub `SENDER_EMAIL` lub `FRONTEND_URL` | Ustaw brakujące sekrety w Supabase → Project Settings → Edge Functions → Secrets |
| H5 | Interpretacja: `email: misconfigured` | — | — | Sekret `SENDER_EMAIL` używa niedozwolonej domeny (Gmail, Yahoo itp.) | Zmień `SENDER_EMAIL` na adres z własnej domeny zweryfikowanej w Resend |

**Jak znaleźć Reference ID projektu Supabase:**
Supabase Dashboard → Twój projekt → **Project Settings** (ikona zębatki) → **General** → pole **Reference ID** (wygląda np. tak: `abcdefghijklmnop`)

---

### 6. LIVE SMOKE FLOW — prawda end-to-end

Wykonaj te 6 kroków jako normalny użytkownik. Użyj nowego konta testowego (nie Twojego głównego).

| # | Co zrobić | Gdzie | Oczekiwany wynik PASS | Co oznacza FAIL | Co zrobić przy FAIL |
|---|---|---|---|---|---|
| L1 | Rejestracja nowego konta | Otwórz aplikację → kliknij **Zarejestruj się** → wpisz nowy e-mail i hasło → kliknij **Zarejestruj** | E-mail weryfikacyjny dociera w ciągu 3 minut. Po kliknięciu linku konto jest aktywne | E-mail nie dociera lub link nie działa | Sprawdź Resend → Logs. Jeśli błąd — wróć do punktów R1–R3. Jeśli e-mail dotarł ale link nie działa — powiadom dewelopera |
| L2 | Logowanie | Aplikacja → **Zaloguj się** → wpisz dane nowego konta | Zalogowany, widoczny dashboard aplikacji | Błąd logowania, biała strona | Sprawdź czy `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` są poprawne w Vercel → Environment Variables |
| L3 | Tworzenie projektu | Aplikacja → **Projekty** → **Nowy projekt** → wpisz nazwę → zapisz | Projekt pojawia się na liście w ciągu 5 sekund | Błąd zapisu, projekt nie pojawia się | Sprawdź Supabase → **Logs** → Edge Functions. Powiadom dewelopera z opisem błędu |
| L4 | Tworzenie oferty z pozycjami | Aplikacja → **Oferty** → **Nowa oferta** → dodaj 3 pozycje → zapisz | Oferta zapisana, widoczna kwota łączna | Błąd zapisu lub nieprawidłowe obliczenia | Sprawdź Supabase → **Logs**. Powiadom dewelopera |
| L5 | Wysłanie oferty e-mailem | W ofercie → kliknij **Wyślij do klienta** → wpisz Twój prywatny e-mail → wyślij | E-mail z ofertą dociera w ciągu 5 minut. Zawiera link do akceptacji | E-mail nie dociera lub link w e-mailu nie otwiera się | Sprawdź Resend → Logs. Jeśli `Delivered` ale nie dotarł → sprawdź spam. Jeśli `Failed` → wróć do punktów R1–R3 |
| L6 | Akceptacja oferty przez klienta | Otwórz link z e-maila (punkt L5) w trybie incognito (nowe okno bez logowania) | Strona z ofertą otwiera się. Widoczny przycisk **Akceptuję ofertę**. Po kliknięciu pojawia się potwierdzenie. Status oferty w aplikacji zmienia się na **Zaakceptowana** | Strona nie otwiera się (błąd 404) lub status nie zmienia się | Powiadom dewelopera — problem z tokenem publicznym lub Edge Function `approve-offer` |

---

## Notatki do weryfikacji

Używaj tej sekcji do zapisywania wyników:

```
Data weryfikacji: ___________

V1: ✅/❌  V2: ✅/❌  V3: ✅/❌  V4: ✅/❌  V5: ✅/❌
S1: ✅/❌  S2: ✅/❌  S3: ✅/❌  S4: ✅/❌  S5: ✅/❌
R1: ✅/❌  R2: ✅/❌  R3: ✅/❌  R4: ✅/❌
P1: ✅/❌  P2: ✅/❌  P3: ✅/❌  P4: ✅/❌  P5: ✅/❌
H1: ✅/❌  H2: n/a  H3: n/a  H4: n/a  H5: n/a
L1: ✅/❌  L2: ✅/❌  L3: ✅/❌  L4: ✅/❌  L5: ✅/❌  L6: ✅/❌

Uwagi:
___________________________________________
```

---

## Priorytet przy FAIL

Jeśli nie masz czasu na wszystko naraz, napraw w tej kolejności:

1. **S1** (baza danych niedostępna) — bez bazy nic nie działa
2. **H1** (healthcheck degraded) — szybka diagnoza
3. **V1 + V2** (Vercel nie deployuje) — zmiany w kodzie nie docierają do użytkowników
4. **S2** (brakujące migracje) — brak tabel = błędy w aplikacji
5. **R1–R3** (e-maile nie działają) — oferty nie docierają do klientów
6. **P1–P4** (płatności nie działają) — brak przychodów
7. **L1–L6** (smoke flow) — ostateczna weryfikacja całości

---

**Gdy wszystkie wiersze mają status PASS, P0 runtime jest zamknięty.**
