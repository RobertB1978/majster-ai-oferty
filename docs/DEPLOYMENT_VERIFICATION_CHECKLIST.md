# Majster.AI - Deployment Verification Checklist

> **Cel:** Upewnić się, że wszystko działa poprawnie po wdrożeniu na Vercel i Supabase.

## 📋 Użycie

Przejdź przez wszystkie sekcje po kolei i zaznacz każdy punkt po weryfikacji.

**Szacowany czas:** 20-30 minut (kompletna weryfikacja)

---

## 🔍 Pre-Deployment Checks

### Lokalne środowisko

- [ ] Projekt buduje się bez błędów: `npm run build`
- [ ] Testy przechodzą: `npm test`
- [ ] Linting przechodzi: `npm run lint`
- [ ] TypeScript type checking przechodzi: `npm run type-check`
- [ ] Plik `.env` skonfigurowany lokalnie
- [ ] Aplikacja działa lokalnie: `npm run dev`

### Konfiguracja Git

- [ ] Wszystkie zmiany są commitowane
- [ ] Pracujesz na właściwej branży
- [ ] Branch jest push-nięty na GitHub
- [ ] `.env` **NIE** jest w repozytorium (sprawdź: `git status`)

---

## ☁️ Vercel Deployment

### Podstawowa konfiguracja

- [ ] Projekt podłączony do Vercel
- [ ] Framework preset: `Vite`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install --legacy-peer-deps`

### Environment Variables (Vercel Dashboard)

**Wymagane:**
- [ ] `VITE_SUPABASE_URL` ustawione dla Production
- [ ] `VITE_SUPABASE_URL` ustawione dla Preview
- [ ] `VITE_SUPABASE_URL` ustawione dla Development
- [ ] `VITE_SUPABASE_ANON_KEY` ustawione dla Production
- [ ] `VITE_SUPABASE_ANON_KEY` ustawione dla Preview
- [ ] `VITE_SUPABASE_ANON_KEY` ustawione dla Development

**Opcjonalne (Sentry):**
- [ ] `VITE_SENTRY_DSN` ustawione dla Production
- [ ] `VITE_SENTRY_ORG` ustawione dla Production
- [ ] `VITE_SENTRY_PROJECT` ustawione dla Production
- [ ] `VITE_SENTRY_AUTH_TOKEN` ustawione dla Production

### Deployment Status

- [ ] Build zakończony sukcesem (zielony status)
- [ ] Brak błędów w deployment logs
- [ ] Brak ostrzeżeń krytycznych w logs
- [ ] Deployment URL działa (otwiera się w przeglądarce)

---

## 🗄️ Supabase Configuration

### Projekt Supabase

- [ ] Projekt utworzony na Supabase
- [ ] Project ID zapisany: `________________`
- [ ] Database password zapisane w bezpiecznym miejscu
- [ ] Region wybrany (np. Europe West - London)

### Database Migrations

- [ ] Wszystkie migracje uruchomione (`supabase db push` lub SQL Editor)
- [ ] Tabele utworzone (sprawdź w Table Editor):
  - [ ] `profiles`
  - [ ] `clients`
  - [ ] `projects`
  - [ ] `quotes`
  - [ ] `quote_items`
  - [ ] `offers`
  - [ ] `offer_sends`
  - [ ] `invoices`
  - [ ] `expenses`
  - [ ] `materials`
  - [ ] `tasks`
  - [ ] `team_members`

### Edge Functions Secrets

**Podstawowe (wymagane):**
- [ ] `SUPABASE_URL` ustawione
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ustawione
- [ ] `FRONTEND_URL` ustawione (URL z Vercel)

**Email (opcjonalne, ale zalecane):**
- [ ] `RESEND_API_KEY` ustawione

**AI Provider (wybierz jeden):**
- [ ] `OPENAI_API_KEY` ustawione, LUB
- [ ] `ANTHROPIC_API_KEY` ustawione, LUB
- [ ] `GEMINI_API_KEY` (lub `GOOGLE_AI_API_KEY`) ustawione

### Edge Functions Deployment

- [ ] Edge Functions wdrożone (`supabase functions deploy`)
- [ ] Wszystkie funkcje mają status "deployed" (zielony)
- [ ] Testowa invocation działa (np. healthcheck)

### Authentication Configuration

- [ ] Site URL ustawiony: `https://twoja-domena.vercel.app`
- [ ] Redirect URLs dodane:
  - [ ] `https://twoja-domena.vercel.app/**`
  - [ ] `https://twoja-domena.vercel.app/auth/callback`
- [ ] Email templates działają (opcjonalnie dostosowane)

---

## ✅ Post-Deployment Verification

### 1. Podstawowa funkcjonalność strony

**URL aplikacji:** `https://________________.vercel.app`

- [ ] Strona się otwiera (nie ma błędu 404/500)
- [ ] Strona główna ładuje się poprawnie
- [ ] Logo i grafiki wyświetlają się
- [ ] CSS i style działają poprawnie
- [ ] Brak białego ekranu (WSOD)
- [ ] Menu nawigacyjne działa

### 2. Konsola przeglądarki (F12 → Console)

- [ ] Brak czerwonych błędów związanych z Supabase
- [ ] Brak błędów "Failed to load resource"
- [ ] Brak błędów CORS
- [ ] Brak błędów "Missing environment variables"

**Akceptowalne ostrzeżenia (żółte):**
- React development warnings
- Third-party library warnings

### 3. Network Tab (F12 → Network)

- [ ] Request do Supabase (`*.supabase.co`) przechodzi (status 200)
- [ ] Brak błędów 401 Unauthorized (oprócz przed logowaniem)
- [ ] Brak błędów 500 Internal Server Error
- [ ] CSS i JS pliki ładują się poprawnie

### 4. Autentykacja i rejestracja

**Rejestracja nowego użytkownika:**
- [ ] Formularz rejestracji wyświetla się
- [ ] Możesz wprowadzić email i hasło
- [ ] Po wysłaniu formularza nie ma błędów
- [ ] Otrzymujesz email weryfikacyjny (sprawdź spam!)
- [ ] Link weryfikacyjny w emailu działa
- [ ] Po kliknięciu jesteś przekierowany na aplikację

**Logowanie:**
- [ ] Formularz logowania wyświetla się
- [ ] Możesz się zalogować z nowym kontem
- [ ] Po zalogowaniu widzisz dashboard
- [ ] Profil użytkownika jest utworzony w bazie

**Wylogowanie:**
- [ ] Możesz się wylogować
- [ ] Po wylogowaniu jesteś przekierowany na stronę główną

### 5. Dashboard

Po zalogowaniu:

- [ ] Dashboard się ładuje
- [ ] Widoczne są sekcje: Projekty, Oferty, Klienci, itd.
- [ ] Statystyki wyświetlają się (mogą być puste dla nowego konta)
- [ ] Brak błędów w konsoli
- [ ] Nawigacja między sekcjami działa

### 6. Zarządzanie klientami

- [ ] Możesz otworzyć "Klienci"
- [ ] Lista klientów wyświetla się (pusta dla nowego konta)
- [ ] Możesz kliknąć "Dodaj klienta"
- [ ] Formularz nowego klienta wyświetla się
- [ ] Możesz wypełnić dane klienta
- [ ] Możesz zapisać klienta
- [ ] Klient pojawia się na liście
- [ ] Klient jest zapisany w bazie (sprawdź Table Editor → clients)

### 7. Tworzenie oferty/kosztorysu

**Nowa oferta:**
- [ ] Możesz otworzyć "Oferty"
- [ ] Możesz kliknąć "Nowa oferta"
- [ ] Formularz oferty wyświetla się
- [ ] Możesz wybrać klienta (utworzonego wcześniej)
- [ ] Możesz wprowadzić nazwę projektu
- [ ] Możesz dodać pozycje do oferty

**AI Suggestions (jeśli masz API key):**
- [ ] Przycisk "AI Suggestions" jest widoczny
- [ ] Po kliknięciu wysyła request do Edge Function
- [ ] AI generuje sugestie (sprawdź logi Edge Function)
- [ ] Sugestie wyświetlają się w UI
- [ ] Możesz dodać sugestię do oferty

**Jeśli NIE masz AI API key:**
- [ ] Brak przycisku AI lub jest wyłączony
- [ ] Możesz dodawać pozycje ręcznie

**Zapisywanie oferty:**
- [ ] Możesz zapisać ofertę
- [ ] Oferta pojawia się na liście
- [ ] Oferta jest w bazie (sprawdź Table Editor → quotes)

### 8. Generowanie PDF

- [ ] Możesz otworzyć zapisaną ofertę
- [ ] Przycisk "Generuj PDF" lub "Podgląd PDF" jest widoczny
- [ ] Po kliknięciu PDF się generuje
- [ ] PDF wyświetla się w przeglądarce lub downloaduje
- [ ] PDF zawiera wszystkie dane z oferty
- [ ] Formatowanie PDF jest poprawne

### 9. Wysyłka emaili (jeśli masz RESEND_API_KEY)

- [ ] Możesz kliknąć "Wyślij ofertę emailem"
- [ ] Formularz wysyłki wyświetla się
- [ ] Możesz wprowadzić email odbiorcy
- [ ] Możesz wprowadzić temat i wiadomość
- [ ] Po wysłaniu nie ma błędów
- [ ] Email jest dostarczony (sprawdź skrzynkę)
- [ ] Email zawiera PDF lub link do oferty
- [ ] Status wysyłki jest zapisany w bazie (Table Editor → offer_sends)

**Jeśli NIE masz RESEND_API_KEY:**
- [ ] Funkcja wysyłki nie działa (spodziewany błąd)
- [ ] Błąd jest zrozumiały dla użytkownika

### 10. Analiza zdjęć (jeśli masz AI API key)

- [ ] Możesz przejść do funkcji analizy zdjęć
- [ ] Możesz uploadować zdjęcie
- [ ] AI analizuje zdjęcie
- [ ] Wyniki analizy wyświetlają się
- [ ] Możesz dodać wyniki do oferty

### 11. Inne funkcje

**Projekty:**
- [ ] Lista projektów działa
- [ ] Możesz utworzyć nowy projekt
- [ ] Projekt zapisuje się w bazie

**Faktury:**
- [ ] Lista faktur działa
- [ ] Możesz utworzyć fakturę
- [ ] Faktura zapisuje się w bazie

**Materiały:**
- [ ] Lista materiałów działa
- [ ] Możesz dodać materiał
- [ ] Materiał zapisuje się w bazie

**Zadania:**
- [ ] Lista zadań działa
- [ ] Możesz utworzyć zadanie
- [ ] Zadanie zapisuje się w bazie

**Zespół:**
- [ ] Lista członków zespołu działa
- [ ] Możesz zaprosić członka zespołu

---

## 🔍 Database Verification

### Sprawdź dane w Supabase Table Editor

- [ ] Tabela `profiles` zawiera Twój profil
- [ ] Tabela `clients` zawiera utworzonego klienta
- [ ] Tabela `quotes` zawiera utworzoną ofertę
- [ ] Tabela `quote_items` zawiera pozycje oferty
- [ ] Tabela `offer_sends` zawiera wysłane emaile (jeśli wysyłałeś)

### Row Level Security (RLS)

- [ ] Możesz widzieć tylko swoje dane (nie innych użytkowników)
- [ ] Nie możesz edytować danych innych użytkowników
- [ ] RLS policies są aktywne (sprawdź w Table Editor → RLS)

---

## 📊 Edge Functions Verification

### Sprawdź logi funkcji

Dla każdej używanej funkcji:

**send-offer-email:**
- [ ] Funkcja się wywołuje przy wysyłce emaila
- [ ] Logi pokazują sukces (status 200)
- [ ] Brak błędów w logach

**ai-quote-suggestions:**
- [ ] Funkcja się wywołuje przy użyciu AI
- [ ] Logi pokazują sukces
- [ ] AI provider odpowiada poprawnie

**analyze-photo:**
- [ ] Funkcja się wywołuje przy uploadzie zdjęcia
- [ ] AI analizuje zdjęcie
- [ ] Wyniki są zwracane

**approve-offer:**
- [ ] Funkcja działa przy zatwierdzaniu oferty przez klienta

### Rate Limiting

- [ ] Rate limiting działa (sprawdź logi przy wielu requestach)
- [ ] Nie ma błędów związanych z przekroczeniem limitów

---

## 🔒 Security Verification

### Headers

Otwórz DevTools → Network → wybierz główny request → Headers:

- [ ] `X-Frame-Options: DENY` obecny
- [ ] `X-Content-Type-Options: nosniff` obecny
- [ ] `Strict-Transport-Security` obecny
- [ ] `Content-Security-Policy` obecny
- [ ] `Referrer-Policy` obecny

### HTTPS

- [ ] Cała aplikacja działa przez HTTPS
- [ ] Brak mixed content warnings
- [ ] Certyfikat SSL jest ważny (kłódka w przeglądarce)

### Environment Variables

- [ ] `service_role` key **NIE** jest eksponowany w przeglądarce
- [ ] Tylko `anon` key jest w kodzie frontend
- [ ] Brak API keys w publicznym kodzie

---

## 📱 Mobile & Responsiveness

### Responsywność

Testuj na różnych rozdzielczościach (F12 → Toggle Device Toolbar):

- [ ] Desktop (1920x1080) - wszystko działa
- [ ] Laptop (1366x768) - wszystko działa
- [ ] Tablet (768x1024) - layout się dostosowuje
- [ ] Mobile (375x667) - layout jest responsywny
- [ ] Mobile landscape - działa poprawnie

### Różne przeglądarki

- [ ] Chrome/Edge (Chromium) - działa
- [ ] Firefox - działa
- [ ] Safari (jeśli dostępna) - działa
- [ ] Mobile Safari (iPhone) - działa
- [ ] Chrome Mobile (Android) - działa

---

## 🚀 Performance Check

### Lighthouse Audit

Uruchom Lighthouse audit (F12 → Lighthouse):

**Minimum acceptable scores:**
- [ ] Performance: > 70
- [ ] Accessibility: > 80
- [ ] Best Practices: > 80
- [ ] SEO: > 70

**Jeśli niższe:**
- Sprawdź Core Web Vitals
- Zoptymalizuj obrazki
- Zmniejsz bundle size

### Loading Speed

- [ ] Strona główna ładuje się < 3s (Fast 3G)
- [ ] Dashboard ładuje się < 5s po zalogowaniu
- [ ] Brak długiego białego ekranu przy ładowaniu

### Bundle Size

Sprawdź w build output:

```bash
npm run build
```

- [ ] Total bundle size < 5MB
- [ ] Largest chunk < 1MB
- [ ] Brak ostrzeżeń o zbyt dużych chunkach (lub akceptowalne)

---

## 🔄 CI/CD Verification

### GitHub Actions

- [ ] GitHub Actions workflow uruchamia się przy push
- [ ] Linting passes
- [ ] Tests pass
- [ ] Build passes
- [ ] Security audit passes (lub znane issues są akceptowalne)

### Vercel Auto-Deploy

- [ ] Push do main brancha triggeruje deployment
- [ ] Deployment kończy się sukcesem
- [ ] Preview deployments działają dla PR-ów

---

## 📋 Documentation Check

- [ ] README.md jest aktualny
- [ ] CLAUDE.md jest aktualny
- [ ] .env.example jest kompletny
- [ ] Dokumentacja w `/docs` jest aktualna
- [ ] VERCEL_DEPLOYMENT_GUIDE.md istnieje
- [ ] ENVIRONMENT_VARIABLES_CHECKLIST.md istnieje

---

## ✅ Final Sign-off

### Wszystko działa?

- [ ] Podstawowa funkcjonalność aplikacji działa
- [ ] Autentykacja działa
- [ ] Database zapisuje dane poprawnie
- [ ] Edge Functions działają (te które są skonfigurowane)
- [ ] Brak krytycznych błędów
- [ ] Security headers są ustawione
- [ ] Performance jest akceptowalna

### Znane ograniczenia (dokumentuj jeśli dotyczy)

AI Features:
- [ ] Działa (mam API key) / Nie działa (brak API key)

Email Sending:
- [ ] Działa (mam Resend key) / Nie działa (brak key)

Monitoring:
- [ ] Sentry skonfigurowany / Nie skonfigurowany

---

## 🎯 Next Steps

Po pozytywnej weryfikacji:

1. **Produkcja:**
   - [ ] Skonfiguruj domenę własną (jeśli masz)
   - [ ] Włącz monitoring (Sentry)
   - [ ] Skonfiguruj backupy bazy danych
   - [ ] Ustaw alerty dla błędów

2. **Bezpieczeństwo:**
   - [ ] Włącz 2FA na Vercel
   - [ ] Włącz 2FA na Supabase
   - [ ] Zapisz hasła w menedżerze haseł
   - [ ] Dokumentuj wszystkie API keys

3. **Team:**
   - [ ] Dodaj współpracowników do Vercel (jeśli trzeba)
   - [ ] Dodaj współpracowników do Supabase (jeśli trzeba)
   - [ ] Podziel się dokumentacją

---

## 🆘 Jeśli coś nie działa

1. Sprawdź [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) → Troubleshooting
2. Sprawdź logi:
   - Vercel Deployment Logs
   - Supabase Edge Functions Logs
   - Browser Console (F12)
3. Sprawdź konfigurację:
   - Environment Variables w Vercel
   - Secrets w Supabase
4. Porównaj z [ENVIRONMENT_VARIABLES_CHECKLIST.md](./ENVIRONMENT_VARIABLES_CHECKLIST.md)

---

**Data weryfikacji:** _______________

**Wykonane przez:** _______________

**Status:** ✅ Sukces / ⚠️ Częściowy sukces / ❌ Błędy wymagają naprawy

**Notatki:**
```
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
```

**🎉 Gratulacje! Jeśli wszystkie checkpoints są zaznaczone, Twoja aplikacja jest gotowa do użycia!**
