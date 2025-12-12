# 🧪 Login Verification Plan (5-Minute Test)

**Cel:** Szybka weryfikacja czy logowanie działa i zdiagnozowanie gdzie jest problem (redirect vs RLS vs ENV).

**Czas:** 5 minut

**Wymagania:**
- ✅ Ukończone: SUPABASE_SETUP_CHECKLIST.md
- ✅ Ukończone: VERCEL_SETUP_CHECKLIST.md

---

## 🎯 Quick Decision Tree

**START TUTAJ** - odpowiedz na pytania i przejdź do odpowiedniej sekcji:

### Q1: Gdzie testujesz?

- **Localhost (`http://localhost:8080`)** → Przejdź do **Test #1: Localhost**
- **Vercel Production (`https://[project].vercel.app`)** → Przejdź do **Test #2: Vercel Production**
- **Vercel Preview (`https://[project]-git-[branch].vercel.app`)** → Przejdź do **Test #3: Vercel Preview**

---

## Test #1: Localhost (5 min)

### Krok 1.1: Uruchom dev server

```bash
# W katalogu projektu
npm run dev
```

**Oczekiwany output:**
```
  VITE v5.4.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

**❌ Jeśli błąd:**
- `Error: Invalid Supabase configuration` → `.env` ma placeholdery → **Fix 1A**
- `Cannot find module` → `npm install` → uruchom ponownie

---

### Krok 1.2: Otwórz aplikację

```
Otwórz: http://localhost:8080
```

**Oczekiwane:** Redirect na `/login` (strona logowania)

**❌ Jeśli biała strona:**
- Otwórz Console (F12) → sprawdź błędy → **Troubleshooting #1**

---

### Krok 1.3: Sprawdź Auth Diagnostics Panel

**Auth Diagnostics panel pojawia się TYLKO w dev mode (localhost).**

1. Na stronie `/login` - dolny prawy róg powinieneś zobaczyć **Auth Diagnostics** panel
2. Kliknij aby rozwinąć
3. Sprawdź wartości:

```
✅ POPRAWNE:
  Environment:
    - Mode: development
    - Supabase URL: https://abcdefg.supabase.co (twój prawdziwy URL, NIE placeholder)
    - Anon Key: ✅ (200+ chars)

  Auth State:
    - Loading: No (po załadowaniu strony)
    - User: ❌ (nie zalogowany jeszcze)
    - Session: ❌ (nie zalogowany jeszcze)

  Client:
    - Initialized: ✅
    - LocalStorage: No token (jeszcze nie logowany)
```

**❌ BŁĘDY:**

| Co widzisz | Problem | Fix |
|------------|---------|-----|
| `Supabase URL: https://your-project.supabase.co` | Placeholder w `.env` | **Fix 1A** |
| `Anon Key: ❌ Missing` | Brak klucza w `.env` | **Fix 1A** |
| `Anon Key: ✅ (20 chars)` | Klucz za krótki (placeholder) | **Fix 1A** |
| `Initialized: ❌` | Supabase client nie zainicjalizowany | **Fix 1B** |

4. Kliknij **Test Connection** (przycisk w panelu)

**Oczekiwane:** Alert: `✅ Connection successful!`

**❌ Jeśli błąd:**
```
❌ Error: Failed to fetch
```
→ Supabase URL niepoprawny lub Supabase nie działa → **Fix 1C**

---

### Krok 1.4: Przetestuj rejestrację

**WAŻNE:** Najpierw rejestracja (aby mieć użytkownika do logowania!)

1. Na stronie `/login` kliknij **"Zarejestruj się"** (link na dole)
2. Przejdź na `/register`
3. Wypełnij formularz:
   ```
   Email: test@example.com
   Hasło: TestPassword123!
   Powtórz hasło: TestPassword123!
   ```
4. Kliknij **"Zarejestruj się"**

**✅ SUKCES:**
```
Toast (powiadomienie): "Sprawdź email - wysłaliśmy link aktywacyjny"
```

**Następne kroki:**
1. Otwórz Supabase Dashboard → **Authentication** → **Users**
2. Powinieneś zobaczyć nowego użytkownika: `test@example.com`
3. Kolumna **Confirmed At:** pusty (nie potwierdzony)
4. **OPCJA A (szybki test):** Kliknij `...` → **Send Magic Link** → potwierdź email
5. **OPCJA B (pełny test):** Sprawdź skrzynkę email i kliknij link aktywacyjny

**⚠️ UWAGA:** Supabase FREE tier używa domyślnych Supabase emaili (mogą trafić do SPAM!)
- Sprawdź folder SPAM
- Jeśli nie ma emaila → użyj **OPCJA A** (dashboard)

**❌ BŁĘDY:**

| Toast message | Problem | Fix |
|---------------|---------|-----|
| `"Konto z tym adresem email już istnieje"` | Użytkownik już istnieje | Użyj innego emaila lub przejdź do **Krok 1.5** |
| `"Błąd logowania: fetch..."` | Brak połączenia z Supabase | **Fix 1C** |
| Brak toasta (nic się nie dzieje) | Sprawdź Console (F12) | **Troubleshooting #1** |

---

### Krok 1.5: Przetestuj logowanie

1. Wróć na `/login`
2. Wpisz dane:
   ```
   Email: test@example.com
   Hasło: TestPassword123!
   ```
3. Kliknij **"Zaloguj się"**

**✅ SUKCES:**
```
Toast: "Zalogowano pomyślnie"
→ Redirect na /dashboard
→ Widzisz Dashboard aplikacji
```

**❌ BŁĘDY:**

| Toast message | Problem | Diagnoza |
|---------------|---------|----------|
| `"Nieprawidłowy email lub hasło"` | Złe hasło LUB użytkownik nie istnieje | Sprawdź Supabase Dashboard → Users |
| `"Email nie został potwierdzony"` | Email nie aktywowany | Potwierdź email (Krok 1.4) |
| `"Invalid redirect URL"` | URL nie pasuje do Supabase Redirect URLs | **Fix 1D** |
| `"Błąd połączenia. Sprawdź konfigurację"` | ENV niepoprawne lub Supabase down | **Fix 1C** |

---

### Krok 1.6: Sprawdź Auth State po zalogowaniu

1. Po pomyślnym logowaniu - rozwień **Auth Diagnostics** panel
2. Sprawdź wartości:

```
✅ POPRAWNE (po zalogowaniu):
  Auth State:
    - Loading: No
    - User: ✅
    - Session: ✅
    - Email: test@example.com
    - Expires: [data w przyszłości]

  Client:
    - LocalStorage: Has token
```

**❌ Jeśli User: ❌ po "zalogowaniu":**
→ Session nie została utworzona → **Troubleshooting #2**

---

### Krok 1.7: Sprawdź RLS (Row Level Security)

**WAŻNE:** To sprawdza czy profile został utworzony i czy RLS działa.

1. Otwórz Console (F12) → **Console**
2. Wpisz i uruchom:

```javascript
// Sprawdź czy user ma profile
const { data: profile, error } = await window.supabase
  .from('profiles')
  .select('*')
  .single();

console.log('Profile:', profile);
console.log('Error:', error);
```

**✅ SUKCES:**
```javascript
Profile: {
  id: "uuid-here",
  email: "test@example.com",
  first_name: null,
  last_name: null,
  ...
}
Error: null
```

**❌ BŁĘDY:**

| Error | Problem | Fix |
|-------|---------|-----|
| `null` (profile jest null) | Profile nie istnieje (trigger nie zadziałał) | **Fix 1E** |
| `"permission denied for table profiles"` | RLS policy blokuje | **Fix 1F** |
| `"relation 'profiles' does not exist"` | Migracje nie uruchomione | **Fix 1G** |

---

## Test #2: Vercel Production (5 min)

### Krok 2.1: Otwórz Production URL

```
Otwórz: https://[YOUR_PROJECT].vercel.app
```

**Oczekiwane:** Redirect na `/login`

**❌ Jeśli biała strona:** → **Troubleshooting #3**

---

### Krok 2.2: Sprawdź Console (brak Auth Diagnostics na prod!)

1. Otwórz Console (F12) → **Console**
2. Sprawdź czy NIE MA błędów:

```
✅ BRAK BŁĘDÓW (poprawne)

❌ BŁĘDY do szukania:
  - "Invalid Supabase configuration"
  - "VITE_SUPABASE_URL contains placeholder"
  - "Failed to fetch"
  - "Redirect URL mismatch"
```

**Jeśli widzisz błędy** → Zapisz treść błędu → **Troubleshooting #4**

---

### Krok 2.3: Przetestuj rejestrację i logowanie

**Użyj tego samego procesu co w Test #1:**
- Krok 2.3.1: Zarejestruj użytkownika (`test-prod@example.com`)
- Krok 2.3.2: Potwierdź email (Dashboard lub link z emaila)
- Krok 2.3.3: Zaloguj się

**✅ SUKCES:** Redirect na `/dashboard`

**❌ BŁĘDY:** Patrz tabela z **Test #1 Krok 1.5**

---

### Krok 2.4: Sprawdź redirect po logowaniu

Po zalogowaniu sprawdź URL w pasku:

```
✅ POPRAWNE:
https://[YOUR_PROJECT].vercel.app/dashboard

❌ BŁĘDY:
https://[YOUR_PROJECT].vercel.app/login?error=redirect_url_mismatch
→ Fix 2A
```

---

## Test #3: Vercel Preview (5 min)

**Preview deployment** = deployment z feature branch (np. `https://project-git-feature.vercel.app`)

### Krok 3.1: Znajdź Preview URL

1. Push do feature brancha
2. Vercel automatycznie tworzy preview deployment
3. URL wygląda tak:
   ```
   https://[PROJECT]-git-[BRANCH]-[USERNAME].vercel.app
   ```

**Przykład:**
```
https://majster-ai-oferty-git-feature-auth-robertb1978.vercel.app
```

---

### Krok 3.2: Sprawdź Supabase Redirect URLs

**WAŻNE:** Preview URL MUSI być w Supabase Redirect URLs!

1. Otwórz Supabase Dashboard → **Authentication** → **URL Configuration**
2. Sprawdź czy lista zawiera **wildcard**:
   ```
   ✅ https://[YOUR_PROJECT]-*.vercel.app
   ✅ https://[YOUR_PROJECT]-*.vercel.app/dashboard
   ```

**Jeśli NIE MA wildcard:**
→ Dodaj (patrz SUPABASE_SETUP_CHECKLIST.md Krok 3.3)
→ **LUB** dodaj konkretny Preview URL ręcznie

---

### Krok 3.3: Przetestuj logowanie na Preview

Użyj tego samego procesu co **Test #1** i **Test #2**.

**❌ Częsty błąd:**
```
Toast: "Invalid redirect URL"
```
→ **Fix 3A** (brak wildcard lub konkretnego preview URL w Supabase)

---

## 🔧 FIXES - Konkretne rozwiązania

### Fix 1A: `.env` ma placeholdery lub brak wartości

**Problem:** Supabase URL/KEY w `.env` to `your-project.supabase.co` lub brak pliku.

**Rozwiązanie:**
1. Otwórz Supabase Dashboard → **Settings** → **API**
2. Skopiuj prawdziwe wartości:
   ```bash
   VITE_SUPABASE_URL=https://[YOUR_REAL_PROJECT_ID].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG... (pełny długi klucz)
   ```
3. Utwórz/zaktualizuj plik `.env` w root projektu:
   ```bash
   # .env
   VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. **RESTART dev server:**
   ```bash
   # Ctrl+C aby zatrzymać
   npm run dev
   ```

---

### Fix 1B: Supabase client nie zainicjalizowany

**Problem:** `Initialized: ❌` w Auth Diagnostics

**Możliwe przyczyny:**
1. `.env` wartości są niepoprawne (URL ma literówkę)
2. `src/integrations/supabase/client.ts` rzuca błąd

**Rozwiązanie:**
1. Sprawdź Console (F12) - szukaj czerwonych błędów
2. Sprawdź czy `VITE_SUPABASE_URL` zaczyna się od `https://` (bez spacji!)
3. Sprawdź czy klucz nie ma enter/newline w środku (cały klucz w jednej linii)

**Komenda do weryfikacji:**
```bash
# Sprawdź czy .env jest poprawnie załadowany
npm run dev

# W logach powinno NIE być:
# ❌ SUPABASE CONFIGURATION ERROR
```

---

### Fix 1C: Brak połączenia z Supabase (Failed to fetch)

**Problem:** `Failed to fetch` lub `Network error`

**Możliwe przyczyny:**
1. Supabase URL niepoprawny (literówka w `.env`)
2. Supabase project nie istnieje lub został usunięty
3. Supabase jest down (rzadko)
4. Firewall/VPN blokuje połączenie

**Rozwiązanie:**

**1. Sprawdź URL:**
```bash
# Otwórz .env i skopiuj VITE_SUPABASE_URL
# Wklej w przeglądarce - powinno pokazać:
# {"msg":"ok"} lub Supabase page
```

**2. Sprawdź status Supabase:**
```
Otwórz: https://status.supabase.com
```

**3. Test curl:**
```bash
# Zastąp [YOUR_URL] swoim URL
curl https://[YOUR_PROJECT_ID].supabase.co/rest/v1/

# Oczekiwany output:
# {"message":"The server is running"}
```

**4. Sprawdź czy projekt istnieje:**
- Supabase Dashboard → Projects → Czy widzisz swój projekt?

---

### Fix 1D: "Invalid redirect URL" podczas logowania

**Problem:** Po kliknięciu "Zaloguj się" URL zmienia się na `/login?error=redirect_url_mismatch`

**Przyczyna:** URL aplikacji NIE jest w Supabase Redirect URLs.

**Rozwiązanie:**

1. **Sprawdź DOKŁADNY URL** z paska przeglądarki (podczas błędu):
   ```
   Przykład: http://localhost:8080/dashboard
   ```

2. **Dodaj do Supabase:**
   - Supabase Dashboard → **Authentication** → **URL Configuration**
   - **Redirect URLs** → kliknij **Add URL**
   - Wklej DOKŁADNY URL (z `http://` lub `https://`)
   - Kliknij **Save**

3. **Dla localhost dodaj:**
   ```
   http://localhost:8080
   http://localhost:8080/dashboard
   ```

4. **Poczekaj 10 sekund** (Supabase cache) i spróbuj ponownie

---

### Fix 1E: Profile nie został utworzony (trigger nie zadziałał)

**Problem:** Po rejestracji `profiles` tabela jest pusta dla nowego użytkownika.

**Przyczyna:** Database trigger `on_auth_user_created` nie istnieje lub nie działa.

**Rozwiązanie:**

**1. Sprawdź czy trigger istnieje:**
```sql
-- W Supabase Dashboard → SQL Editor uruchom:
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Oczekiwane:** Co najmniej 1 wynik

**2. Jeśli brak triggera → uruchom migracje:**
```bash
npx supabase db push
```

**3. Ręcznie utwórz profile (workaround):**
```sql
-- W Supabase Dashboard → SQL Editor:
INSERT INTO profiles (id, email, created_at, updated_at)
SELECT
  id,
  email,
  now(),
  now()
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT (id) DO NOTHING;
```

---

### Fix 1F: RLS policy blokuje dostęp

**Problem:** `permission denied for table profiles`

**Przyczyna:** Row Level Security (RLS) policy nie pozwala użytkownikowi czytać własnego profilu.

**Rozwiązanie:**

**1. Sprawdź czy RLS policies istnieją:**
```sql
-- W Supabase Dashboard → SQL Editor:
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Oczekiwane:** Co najmniej 1 policy z `cmd = 'SELECT'`

**2. Jeśli brak policies → uruchom migracje:**
```bash
npx supabase db push
```

**3. Sprawdź czy RLS jest włączony:**
```sql
-- W Supabase Dashboard → SQL Editor:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';
```

**Oczekiwane:** `rowsecurity = true`

---

### Fix 1G: Tabela 'profiles' nie istnieje

**Problem:** `relation 'profiles' does not exist`

**Przyczyna:** Database migrations nie zostały uruchomione.

**Rozwiązanie:**

```bash
# Uruchom wszystkie migracje
npx supabase db push

# Sprawdź czy tabele istnieją
npx supabase db remote commit
```

**Alternatywa (Dashboard):**
1. Otwórz każdy plik z `supabase/migrations/`
2. Skopiuj SQL
3. Supabase Dashboard → **SQL Editor** → wklej i uruchom
4. Uruchamiaj w kolejności chronologicznej (po nazwie pliku)!

---

### Fix 2A: Redirect URL mismatch na Vercel

**Problem:** Po logowaniu URL = `.../login?error=redirect_url_mismatch`

**Przyczyna:** Production URL Vercel nie jest w Supabase Redirect URLs.

**Rozwiązanie:**

1. **Skopiuj DOKŁADNY URL** z Vercel:
   ```
   https://[YOUR_PROJECT].vercel.app
   ```

2. **Dodaj do Supabase Redirect URLs:**
   ```
   https://[YOUR_PROJECT].vercel.app
   https://[YOUR_PROJECT].vercel.app/dashboard
   https://[YOUR_PROJECT].vercel.app/reset-password
   ```

3. **Sprawdź Site URL:**
   ```
   Site URL: https://[YOUR_PROJECT].vercel.app
   ```

4. Kliknij **Save** i spróbuj ponownie (może być cache 10-30s)

---

### Fix 3A: Preview deployment - redirect URL mismatch

**Problem:** Logowanie nie działa na `https://[project]-git-[branch].vercel.app`

**Rozwiązanie:**

**OPCJA A: Wildcard (zalecane)**

Dodaj do Supabase Redirect URLs:
```
https://[YOUR_PROJECT]-*.vercel.app
https://[YOUR_PROJECT]-*.vercel.app/dashboard
```

**OPCJA B: Konkretny URL**

Dodaj każdy preview URL ręcznie:
```
https://majster-ai-oferty-git-feature-auth-robertb.vercel.app
https://majster-ai-oferty-git-feature-auth-robertb.vercel.app/dashboard
```

---

## 🚨 Troubleshooting - Błędy w Console

### Troubleshooting #1: Biała strona (localhost)

**Sprawdź Console (F12) → Console**

| Błąd | Fix |
|------|-----|
| `Invalid Supabase configuration` | **Fix 1A** |
| `Failed to fetch` | **Fix 1C** |
| `Cannot read property 'user' of undefined` | AuthContext problem - sprawdź czy App.tsx ma `<AuthProvider>` |
| `Module not found` | `npm install` i restart |

---

### Troubleshooting #2: User ❌ po "zalogowaniu"

**Możliwe przyczyny:**
1. Session nie została zapisana w localStorage
2. AuthContext nie odświeżył state

**Debug:**
```javascript
// Console (F12)
// Sprawdź localStorage
localStorage.getItem(Object.keys(localStorage).find(k => k.includes('auth-token')))

// Powinno zwrócić JSON z access_token
```

**Jeśli brak tokena:**
→ Problem z `supabase.auth.signInWithPassword`
→ Sprawdź Console czy są błędy podczas logowania

---

### Troubleshooting #3: Biała strona (Vercel)

**Sprawdź:**

1. **Build logs** (Vercel → Deployments → View Build Logs)
   - Szukaj błędów: `ERROR` lub `Failed`

2. **Console** (F12 na białej stronie)
   - Szukaj błędów JavaScript

3. **ENV variables** (Vercel → Settings → Environment Variables)
   - Sprawdź czy `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` są ustawione
   - Sprawdź czy mają checkboxy: ✅ Production

4. **Redeploy** (po zmianie ENV):
   ```
   Vercel → Deployments → ... → Redeploy
   ```

---

### Troubleshooting #4: Błędy konfiguracji na Vercel

| Błąd w Console | Problem | Fix |
|----------------|---------|-----|
| `VITE_SUPABASE_URL contains placeholder` | ENV nie załadowane lub mają placeholder | Sprawdź Vercel ENV + Redeploy |
| `Failed to fetch` | Supabase URL niepoprawny | Sprawdź wartość w Vercel ENV |
| `Redirect URL mismatch` | Vercel URL nie pasuje do Supabase | **Fix 2A** |

---

## ✅ VERIFICATION CHECKLIST (5-min speedrun)

**Speedrun checklist - zaznacz każdy test:**

### Localhost:
- [ ] `npm run dev` działa bez błędów
- [ ] Auth Diagnostics panel: ✅ URL, ✅ Key, ✅ Initialized
- [ ] Test Connection: ✅ successful
- [ ] Rejestracja: użytkownik utworzony w Supabase Dashboard
- [ ] Logowanie: redirect na `/dashboard`
- [ ] Console query: `profiles` zwraca dane użytkownika

### Vercel Production:
- [ ] Strona otwiera się (nie biała)
- [ ] Console (F12): brak błędów konfiguracji
- [ ] Logowanie: redirect na `/dashboard`
- [ ] Dashboard pokazuje dane użytkownika

### Vercel Preview (opcjonalnie):
- [ ] Wildcard `*` dodany do Supabase Redirect URLs
- [ ] Preview URL otwiera się
- [ ] Logowanie działa

---

## 📊 Quick Diagnostic Commands

**Uruchom te komendy aby szybko sprawdzić stan:**

```bash
# === LOKALNIE ===

# 1. Sprawdź .env
cat .env
# Oczekiwane: prawdziwe wartości (nie placeholder)

# 2. Sprawdź czy migrations są zsynchronizowane
npx supabase db remote commit
# Oczekiwane: lista migracji

# 3. Test connection do Supabase
curl https://[YOUR_PROJECT_ID].supabase.co/rest/v1/
# Oczekiwane: {"message":"..."}

# 4. Sprawdź build lokalnie (symuluje Vercel)
npm run build
# Oczekiwane: ✓ built in ...ms

# === VERCEL ===

# 5. Sprawdź environment variables (Vercel CLI)
vercel env ls
# Oczekiwane: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# 6. Sprawdź build logs (ostatni deployment)
vercel logs [deployment-url]
```

---

## 🎯 Expected Success Outcome

Po pomyślnym zakończeniu wszystkich testów powinieneś:

✅ **Localhost:**
- Widzisz Auth Diagnostics panel
- Rejestracja działa
- Logowanie przekierowuje na `/dashboard`
- Dashboard pokazuje dane użytkownika

✅ **Vercel:**
- Aplikacja otwiera się
- Brak błędów w Console
- Logowanie działa
- Redirect URLs działają

✅ **Supabase:**
- Tabele istnieją (profiles, organizations, etc.)
- RLS policies działają
- Users są tworzeni po rejestracji
- Profiles są automatycznie tworzone (trigger)

---

**Jeśli wszystkie testy przechodzą - gratulacje! 🎉 Login system działa poprawnie.**

**Jeśli jakiś test failuje - użyj odpowiedniego Fix i sprawdź ponownie.**

---

## 🔍 Debugging Pro Tips

1. **ZAWSZE sprawdź Console (F12) jako pierwsze**
   - 90% problemów pojawia się tam jako błędy

2. **Auth Diagnostics panel to Twój przyjaciel (localhost)**
   - Pokazuje real-time stan auth

3. **Sprawdź Supabase Dashboard → Users**
   - Czy użytkownik istnieje?
   - Czy `Confirmed At` jest ustawione?

4. **Sprawdź Redirect URLs w Supabase**
   - Muszą DOKŁADNIE pasować (http vs https, trailing slash)

5. **Po każdej zmianie ENV w Vercel - REDEPLOY**
   - ENV są "baked in" podczas buildu, nie runtime!

6. **Wildcard `*` oszczędza czas dla Preview deployments**
   - Jeden wpis zamiast 100

7. **Test curl to szybki sposób na sprawdzenie czy Supabase działa**
   ```bash
   curl https://[YOUR_PROJECT].supabase.co/rest/v1/
   ```

---

**Happy debugging! 🚀**
