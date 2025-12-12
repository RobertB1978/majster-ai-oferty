# ✅ Vercel Setup Checklist

**Cel:** Wdrożyć aplikację na Vercel z poprawnymi zmiennymi środowiskowymi.

**Czas:** ~5 minut

**Wymagania:** Musisz mieć gotowe z SUPABASE_SETUP_CHECKLIST.md:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`

---

## 📋 Przed startem - przygotuj wartości

Będziesz potrzebować tych wartości (skopiuj z Supabase Dashboard):

```bash
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (długi token)
```

---

## Krok 1: Otwórz Vercel Dashboard

1. Przejdź do: https://vercel.com
2. Zaloguj się (GitHub, GitLab lub email)
3. Jeśli to Twój pierwszy deployment:
   - Kliknij **Add New...** → **Project**
   - Wybierz repository `majster-ai-oferty` z GitHuba
   - Jeśli nie widzisz repo → kliknij **Adjust GitHub App Permissions** i dodaj dostęp do repo

---

## Krok 2: Import projektu (tylko jeśli nowy deployment)

**Jeśli projekt już istnieje w Vercel - pomiń ten krok.**

1. Kliknij **Import** przy swoim repo `majster-ai-oferty`
2. **Framework Preset:** Vite (powinno wykryć automatycznie)
3. **Root Directory:** `.` (domyślnie, nie zmieniaj)
4. **Build Command:** `npm run build` (domyślnie)
5. **Output Directory:** `dist` (domyślnie)
6. **NIE klikaj jeszcze "Deploy"** - najpierw dodamy zmienne środowiskowe!

---

## Krok 3: Dodaj Environment Variables

### 3.1 Otwórz ustawienia ENV

**Jeśli dopiero importujesz projekt:**
- Rozwiń sekcję **Environment Variables** (przed kliknięciem Deploy)

**Jeśli projekt już istnieje:**
1. Otwórz swój projekt w Vercel Dashboard
2. Kliknij **Settings** (góra)
3. W lewym menu kliknij **Environment Variables**

### 3.2 Dodaj zmienne (WAŻNE: dla Production I Preview!)

Dla każdej zmiennej:
1. Kliknij **Add New** (lub wypełnij pola Key/Value)
2. Wpisz **Name** (klucz)
3. Wpisz **Value** (wartość)
4. **Environments:** zaznacz **WSZYSTKIE** checkboxy:
   - ✅ **Production** (deployment produkcyjny z main branch)
   - ✅ **Preview** (deployment z feature branches)
   - ⬜ **Development** (lokalnie - NIE zaznaczaj, nie używamy Vercel dev lokalnie)

---

### 🔑 Zmienne do dodania

#### 1️⃣ VITE_SUPABASE_URL (WYMAGANE)

```
Name:         VITE_SUPABASE_URL
Value:        https://[YOUR_PROJECT_ID].supabase.co
Environments: ✅ Production  ✅ Preview
```

**Przykład:**
```
Value: https://abcdefghijklmnop.supabase.co
```

---

#### 2️⃣ VITE_SUPABASE_ANON_KEY (WYMAGANE)

```
Name:         VITE_SUPABASE_ANON_KEY
Value:        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (twój długi klucz)
Environments: ✅ Production  ✅ Preview
```

**WAŻNE:**
- ✅ To jest `anon/public` key (bezpieczny dla frontendu)
- ❌ NIE używaj `service_role` key (to tylko dla backendu!)
- Token powinien mieć ~200-300 znaków

**Przykład (SKRÓCONY, użyj PEŁNEGO klucza):**
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.signature_here
```

---

#### 3️⃣ VITE_SENTRY_DSN (OPCJONALNE - monitoring błędów)

**OPCJONALNE:** Tylko jeśli chcesz monitoring błędów przez Sentry.

```
Name:         VITE_SENTRY_DSN
Value:        https://[YOUR_KEY]@o[ORG_ID].ingest.sentry.io/[PROJECT_ID]
Environments: ✅ Production  ✅ Preview
```

**Jak zdobyć:**
1. Załóż konto na https://sentry.io (free tier wystarczy)
2. Utwórz nowy projekt (wybierz platform: **React**)
3. Skopiuj DSN z Project Settings → Client Keys (DSN)

**Jeśli NIE używasz Sentry:**
- Po prostu nie dodawaj tej zmiennej - aplikacja będzie działać bez monitoringu

---

#### 4️⃣ VITE_SENTRY_ORG (OPCJONALNE)

Tylko jeśli używasz Sentry:

```
Name:         VITE_SENTRY_ORG
Value:        [your-sentry-org-slug]
Environments: ✅ Production  ✅ Preview
```

---

#### 5️⃣ VITE_SENTRY_PROJECT (OPCJONALNE)

Tylko jeśli używasz Sentry:

```
Name:         VITE_SENTRY_PROJECT
Value:        [your-sentry-project-name]
Environments: ✅ Production  ✅ Preview
```

---

#### 6️⃣ VITE_SENTRY_AUTH_TOKEN (OPCJONALNE)

Tylko jeśli używasz Sentry i chcesz source maps:

```
Name:         VITE_SENTRY_AUTH_TOKEN
Value:        [your-sentry-auth-token]
Environments: ✅ Production  ✅ Preview
```

**Jak zdobyć:**
1. Sentry → Settings → Auth Tokens
2. Create New Token → Scope: `project:releases` + `org:read`
3. Skopiuj token

---

## Krok 4: Zapisz i Deploy

### 4.1 Zapisz zmienne

**Jeśli dopiero importujesz projekt:**
- Sprawdź czy masz co najmniej 2 zmienne (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
- Kliknij **Deploy**
- ⏱️ Poczekaj 2-3 minuty na build

**Jeśli projekt już istnieje:**
- Sprawdź czy wszystkie zmienne są dodane
- Kliknij **Save** (każda zmienna)
- Przejdź do **Deployments** (górne menu)
- Kliknij **...** (trzy kropki) przy ostatnim deploymencie → **Redeploy**
- Wybierz **Use existing Build Cache** (szybszy build)
- Kliknij **Redeploy**

### 4.2 Poczekaj na build

1. Vercel pokaże live logs z buildu
2. Sprawdź czy nie ma błędów (czerwone linie)
3. Build powinien zakończyć się: **✅ Build Completed** (~2-3 min)

---

## Krok 5: Weryfikacja Deployment ✅

### 5.1 Sprawdź czy deployment się udał

1. Po zakończeniu buildu kliknij **Visit** (przycisk przy deploymencie)
2. Vercel otworzy Twoją aplikację w nowej karcie
3. URL będzie wyglądał tak:
   ```
   https://[YOUR_PROJECT].vercel.app
   ```
   lub (dla preview deployments):
   ```
   https://[YOUR_PROJECT]-git-[branch-name]-[your-username].vercel.app
   ```

### 5.2 Test podstawowy

1. Otwórz aplikację w przeglądarce
2. Powinieneś zobaczyć stronę logowania (lub redirect na `/login`)
3. **Sprawdź Developer Console (F12 → Console):**
   - ✅ Brak błędów "Invalid Supabase configuration"
   - ✅ Brak błędów "VITE_SUPABASE_URL contains placeholder"
   - ⚠️ Jeśli widzisz te błędy → env variables nie są załadowane poprawnie

### 5.3 Sprawdź czy ENV są załadowane

**Metoda 1: Developer Console**

Otwórz Developer Console (F12) i wpisz:

```javascript
// Sprawdź czy Supabase URL jest załadowany (powinno pokazać URL, nie undefined)
console.log('Supabase URL length:', window.location.origin)

// UWAGA: NIE loguj całego klucza publicznie! To tylko test czy jest załadowany
```

**Metoda 2: Auth Diagnostics Panel (tylko na localhost)**

Auth Diagnostics panel nie działa na Vercel (tylko dev mode), więc użyj Developer Console.

---

## Krok 6: Zapisz Production URL

1. Skopiuj Production URL Twojej aplikacji:
   ```
   https://[YOUR_PROJECT].vercel.app
   ```

2. **WAŻNE:** Sprawdź czy ten URL pasuje do wartości w Supabase:
   - Otwórz Supabase Dashboard → Authentication → URL Configuration
   - **Site URL** powinno być: `https://[YOUR_PROJECT].vercel.app`
   - **Redirect URLs** powinny zawierać:
     - `https://[YOUR_PROJECT].vercel.app`
     - `https://[YOUR_PROJECT].vercel.app/dashboard`
     - `https://[YOUR_PROJECT]-*.vercel.app` (wildcard dla preview)

Jeśli nie pasuje → wróć do **SUPABASE_SETUP_CHECKLIST.md Krok 3** i zaktualizuj URLs.

---

## Krok 7: Weryfikacja Build Logs (troubleshooting)

Jeśli coś nie działa, sprawdź build logs:

1. W Vercel → **Deployments** → kliknij deployment → **View Build Logs**
2. Szukaj błędów:

### ✅ POPRAWNY BUILD powinien pokazać:

```
Running build command: npm run build
...
vite v5.4.x building for production...
✓ xxx modules transformed.
dist/index.html                   x.xx kB
dist/assets/xxx.js               xxx.xx kB
✓ built in xxxms
Build Completed
```

### ❌ BŁĘDY do sprawdzenia:

**Błąd: "VITE_SUPABASE_URL is not set"**
- **Rozwiązanie:** Zmienne ENV nie są ustawione lub nie są przypisane do **Production**
- Wróć do **Krok 3** i sprawdź checkboxy **Environments**

**Błąd: "Build failed" lub "npm ERR!"**
- **Rozwiązanie:** Sprawdź czy `package.json` dependencies są OK
- Spróbuj **Redeploy** (może być chwilowy błąd npm registry)

**Ostrzeżenie: "Chunk size exceeds 500kB"**
- **Nie szkodzi:** To tylko warning, build powinien się udać
- Aplikacja ma już optymalizacje chunków w `vite.config.ts`

---

## Krok 8: Ustaw Custom Domain (OPCJONALNIE)

Jeśli masz własną domenę (np. `majster.ai`):

1. W Vercel → Projekt → **Settings** → **Domains**
2. Kliknij **Add**
3. Wpisz swoją domenę (np. `majster.ai`)
4. Vercel pokaże instrukcje DNS:
   - **Typ A:** wskazujący na `76.76.21.21`
   - lub **CNAME:** wskazujący na `cname.vercel-dns.com`
5. Dodaj te rekordy w swoim dostawcy domeny (np. cloudflare, namecheap)
6. ⏱️ Poczekaj 10-60 minut na propagację DNS
7. **WAŻNE:** Zaktualizuj **Site URL** w Supabase na swoją domenę!

---

## ✅ CHECKLIST KOŃCOWA

Zaznacz każdy punkt po wykonaniu:

- [ ] **Krok 1:** Otworzyłem Vercel Dashboard i znalazłem projekt
- [ ] **Krok 2:** (Jeśli nowy) Zaimportowałem repo z GitHuba
- [ ] **Krok 3.2:** Dodałem `VITE_SUPABASE_URL` dla **Production + Preview**
- [ ] **Krok 3.2:** Dodałem `VITE_SUPABASE_ANON_KEY` dla **Production + Preview**
- [ ] **Krok 4:** Zapisałem zmienne i kliknąłem Deploy (lub Redeploy)
- [ ] **Krok 5.1:** Build się powiódł (✅ Build Completed)
- [ ] **Krok 5.2:** Otworzyłem aplikację - widzę stronę logowania
- [ ] **Krok 5.2:** Console (F12) NIE pokazuje błędów konfiguracji
- [ ] **Krok 6:** Zapisałem Production URL i sprawdziłem że pasuje do Supabase Site URL
- [ ] **Krok 7:** (Troubleshooting) Sprawdziłem build logs - brak błędów

---

## 🚨 Troubleshooting

### Problem: Build się udał, ale strona pokazuje białą stronę (blank page)

**Rozwiązanie:**
1. Otwórz Developer Console (F12)
2. Sprawdź zakładkę **Console** - powinny być błędy
3. Szukaj błędów typu:
   - ❌ "Invalid Supabase configuration" → ENV variables nie załadowane
   - ❌ "Failed to fetch" → Problem z połączeniem do Supabase
   - ❌ "Redirect URL mismatch" → URLs w Supabase nie pasują

### Problem: ENV variables nie są załadowane (console pokazuje undefined)

**Rozwiązanie:**
1. W Vercel → **Settings** → **Environment Variables**
2. Sprawdź czy zmienne mają zaznaczone checkboxy: ✅ Production ✅ Preview
3. **WAŻNE:** Po zmianie ENV musisz **Redeploy** (zmienne są "baked in" podczas buildu, nie runtime!)
4. Przejdź do **Deployments** → **...** → **Redeploy**

### Problem: Logowanie przekierowuje na "Invalid redirect URL"

**Rozwiązanie:**
1. Skopiuj DOKŁADNY URL z paska adresu przeglądarki (podczas błędu)
2. Dodaj ten URL do **Redirect URLs** w Supabase (SUPABASE_SETUP_CHECKLIST.md Krok 3.3)
3. Sprawdź czy nie ma trailing slash (`/`) lub różnic `http` vs `https`

### Problem: Preview deployment (branch) nie działa, a Production działa

**Rozwiązanie:**
1. Sprawdź czy ENV variables mają zaznaczone **✅ Preview**
2. Sprawdź czy wildcard `https://[PROJECT]-*.vercel.app` jest w Supabase Redirect URLs
3. Redeploy preview branch

---

## Następne kroki

Gdy skończysz tę checklistę, przejdź do:
- 🧪 **LOGIN_VERIFICATION_PLAN.md** - 5-minutowy test plan logowania

---

## 📊 Monitoring (opcjonalnie)

Po deploymencie możesz monitorować aplikację:

**Vercel Analytics:**
- Vercel → Projekt → **Analytics** (zakładka)
- Widzisz: page views, performance, geographic data
- Free tier: 100k requests/miesiąc

**Vercel Logs:**
- Vercel → Projekt → **Logs** (zakładka)
- Realtime logs z aplikacji (console.log, błędy)

**Sentry (jeśli skonfigurowałeś):**
- https://sentry.io → Twój projekt
- Widzisz: błędy runtime, stack traces, user context

---

**To wszystko! Po wykonaniu tych kroków Vercel będzie gotowy. 🎉**
