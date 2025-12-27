# 🔍 AUDYT VERCEL PRODUCTION — MAJSTER.AI
**Repo:** RobertB1978/majster-ai-oferty
**Data:** 2025-12-27
**Tryb:** Audyt lokalny (bez dostępu do Vercel API)

---

## 📋 EXECUTIVE VERDICT

**STATUS: ⚠️ WARUNKOWO OK — wymaga weryfikacji env vars na Vercel**

### Powody:

1. ✅ **Konfiguracja lokalna POPRAWNA** — vercel.json, package.json, vite.config.ts zgodne z best practices
2. ✅ **Security headers DOBRE** — CSP, HSTS, XFO, XCTO prawidłowo skonfigurowane
3. ✅ **Build DZIAŁA** — 30s, bez errors/warnings, 17MB total (OK po gzip)
4. ⚠️ **Bundle size DUŻY** — exportUtils 940KB (272KB gzipped) — potencjalny problem UX
5. ❌ **BRAK WERYFIKACJI** — nie można sprawdzić env vars, deployment protection, actual production URL bez Vercel API token

---

## 🔬 EVIDENCE LOG

| # | Check | Źródło | Wynik | Status | Impact | Fix |
|---|-------|--------|-------|--------|--------|-----|
| 1 | **Repo identyfikacja** | git remote | RobertB1978/majster-ai-oferty | ✅ PASS | Info | - |
| 2 | **Branch** | git | claude/audit-vercel-production-hTSEB | ✅ PASS | Info | - |
| 3 | **Node version (pkg)** | package.json:8 | 20.x | ✅ PASS | Build parity | - |
| 4 | **Node version (local)** | node --version | 22.21.1 | ⚠️ WARN | Dev/prod mismatch | Δ3 |
| 5 | **Package manager** | package.json:6 | npm@10.9.2 (locked) | ✅ PASS | Deterministic | - |
| 6 | **Lockfile** | package-lock.json | v3 (npm 7+) | ✅ PASS | Reproducible | - |
| 7 | **Framework preset** | vercel.json:67 | vite | ✅ PASS | Auto-detect | - |
| 8 | **Build command** | vercel.json:65 | npm run build | ✅ PASS | Standard | - |
| 9 | **Install command** | vercel.json:64 | npm ci | ✅ PASS | Lockfile-based | - |
| 10 | **Output directory** | vercel.json:66 | dist | ✅ PASS | Vite default | - |
| 11 | **SPA rewrites** | vercel.json:58-62 | /(.*)  → /index.html | ✅ PASS | React Router | - |
| 12 | **Clean URLs** | vercel.json:68 | true | ✅ PASS | SEO | - |
| 13 | **Trailing slash** | vercel.json:69 | false | ✅ PASS | Consistency | - |
| 14 | **X-Frame-Options** | vercel.json:8 | DENY | ✅ PASS | Clickjacking ⛔ | - |
| 15 | **X-Content-Type-Options** | vercel.json:12 | nosniff | ✅ PASS | MIME sniffing ⛔ | - |
| 16 | **X-XSS-Protection** | vercel.json:16 | 1; mode=block | ✅ PASS | XSS legacy | - |
| 17 | **Referrer-Policy** | vercel.json:20 | strict-origin-when-cross-origin | ✅ PASS | Privacy | - |
| 18 | **Permissions-Policy** | vercel.json:24 | camera=(), microphone=(), geolocation=() | ✅ PASS | Privacy | - |
| 19 | **HSTS** | vercel.json:28 | max-age=31536000; includeSubDomains; preload | ✅ PASS | HTTPS enforce | - |
| 20 | **CSP: default-src** | vercel.json:32 | 'self' | ✅ PASS | Baseline | - |
| 21 | **CSP: script-src** | vercel.json:32 | 'self' + CDNs | ✅ PASS | External scripts | - |
| 22 | **CSP: style-src** | vercel.json:32 | 'unsafe-inline' (Tailwind) | 🟡 OK | Tailwind needs | - |
| 23 | **CSP: connect-src** | vercel.json:32 | Supabase, AI APIs, Sentry | ✅ PASS | API whitelist | - |
| 24 | **CSP: frame-ancestors** | vercel.json:32 | 'none' | ✅ PASS | Iframe ⛔ | - |
| 25 | **CSP: unsafe-eval** | vercel.json:32 | BRAK | ✅ PASS | No eval ⛔ | - |
| 26 | **Offer route headers** | vercel.json:37-56 | X-Frame: SAMEORIGIN | ✅ PASS | PDF embed | - |
| 27 | **Build success** | npm run build | ✓ 30.47s | ✅ PASS | Production ready | - |
| 28 | **Build warnings** | build log | 0 warnings | ✅ PASS | Clean build | - |
| 29 | **Build errors** | build log | 0 errors | ✅ PASS | Stable | - |
| 30 | **Dist size total** | du -sh dist | 17MB | ✅ PASS | Before gzip | - |
| 31 | **JS bundle size** | du -sh dist/assets/js | 17MB | ⚠️ WARN | Large pre-gzip | Δ3 |
| 32 | **CSS size** | du -sh dist/assets/css | 131KB | ✅ PASS | Tailwind OK | - |
| 33 | **Largest chunk** | build output | exportUtils 940KB (272KB gz) | ⚠️ WARN | Initial load | Δ3 |
| 34 | **2nd largest chunk** | build output | index 492KB (152KB gz) | 🟡 OK | Code-split | - |
| 35 | **3rd largest chunk** | build output | ProjectDetail 481KB (154KB gz) | 🟡 OK | Lazy-loaded | - |
| 36 | **Chunk size limit** | vite.config.ts:84 | 1500 KB | ✅ PASS | No violations | - |
| 37 | **Code splitting** | vite.config.ts:54-66 | Manual chunks | ✅ PASS | Vendor split | - |
| 38 | **Sourcemaps** | vite.config.ts:48 | mode === 'production' | ✅ PASS | Sentry | - |
| 39 | **Minification** | vite.config.ts:50 | esbuild | ✅ PASS | Fast | - |
| 40 | **CSS minification** | vite.config.ts:51 | true | ✅ PASS | Optimized | - |
| 41 | **CI/CD: Lint** | .github/workflows/ci.yml:13 | ✓ configured | ✅ PASS | Quality gate | - |
| 42 | **CI/CD: Tests** | .github/workflows/ci.yml:43 | ✓ configured | ✅ PASS | Regression ⛔ | - |
| 43 | **CI/CD: Build** | .github/workflows/ci.yml:86 | ✓ configured | ✅ PASS | Deploy gate | - |
| 44 | **CI/CD: Security audit** | .github/workflows/ci.yml:121 | ✓ configured | ✅ PASS | Vuln scan | - |
| 45 | **CI/CD: Node version** | .github/workflows/ci.yml:25 | 20.x | ✅ PASS | Prod parity | - |
| 46 | **Required env vars** | .env.example:20,24 | VITE_SUPABASE_URL, ANON_KEY | ❌ **UNKNOWN** | **BLOCKER** | **Δ1** |
| 47 | **Optional env vars** | .env.example:33-43 | Sentry (4 vars) | ❌ UNKNOWN | Monitoring | Δ2 |
| 48 | **npm audit** | npm audit | 2 moderate | 🟡 OK | Low risk | Δ3 |
| 49 | **Production URL** | Vercel API | ❌ BRAK DOSTĘPU | ❌ FAIL | Cannot verify | **Δ1** |
| 50 | **403 status** | Vercel API | ❌ BRAK DOSTĘPU | ❌ FAIL | Cannot verify | **Δ1** |
| 51 | **Deployment Protection** | Vercel API | ❌ BRAK DOSTĘPU | ❌ FAIL | May block users | **Δ1** |
| 52 | **Last deployment logs** | Vercel API | ❌ BRAK DOSTĘPU | ❌ FAIL | Cannot verify | **Δ1** |

---

## 🚨 FIX PACK Δ1 — P0 BLOKERY (WERYFIKACJA WYMAGANA)

**Cel:** Potwierdzić że production faktycznie działa, bez 403, z prawidłowymi env vars.

### Δ1.1: Weryfikacja Environment Variables (P0 — BLOCKER)

**Problem:**
Nie można zweryfikować czy na Vercel są ustawione krytyczne zmienne środowiskowe.

**Wymagane zmienne:**
- `VITE_SUPABASE_URL` (format: https://[project-id].supabase.co)
- `VITE_SUPABASE_ANON_KEY` (eyJ...)

**Opcjonalne (ale zalecane):**
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ORG`
- `VITE_SENTRY_PROJECT`
- `VITE_SENTRY_AUTH_TOKEN`

**Weryfikacja:**
```bash
# 1. Otwórz Vercel Dashboard
https://vercel.com/dashboard

# 2. Przejdź do projektu majster-ai-oferty

# 3. Settings → Environment Variables

# 4. Sprawdź czy KAŻDA zmienna jest ustawiona dla:
#    - Production ✓
#    - Preview ✓
#    - Development (opcjonalnie)

# 5. Jeśli BRAK którejkolwiek — dodaj:
#    - Kliknij: Add New
#    - Name: VITE_SUPABASE_URL
#    - Value: [wartość z Supabase Dashboard]
#    - Environments: Production, Preview
#    - Save
```

**Test plan:**
1. Sprawdź listę env vars w Vercel
2. Porównaj z listą wymaganą powyżej
3. Dodaj brakujące
4. Triggeruj redeploy (Deploy → Redeploy)
5. Sprawdź czy build się powiódł

**Rollback:**
- Jeśli redeploy fail → przywróć poprzednią wartość env var
- Vercel → Deployments → [previous] → Promote to Production

---

### Δ1.2: Sprawdzenie Deployment Protection (P0 — 403 FIX)

**Problem:**
Użytkownik może widzieć 403 jeśli Deployment Protection jest włączone.

**Weryfikacja:**
```bash
# 1. Otwórz production URL (np. https://majster-ai-oferty.vercel.app)

# 2. Jeśli widzisz 403 z komunikatem "Deployment Protection":
#    → Przejdź do Vercel Dashboard
#    → Project → Settings → Deployment Protection
#    → Wyłącz dla Production (pozostaw dla Preview jeśli chcesz)

# 3. Jeśli widzisz 403 bez "Deployment Protection":
#    → Sprawdź Vercel → Settings → Firewall
#    → Sprawdź czy IP nie jest zablokowane
#    → Sprawdź logi: Deployments → [Latest] → Function Logs
```

**Fix:**
- Deployment Protection → **Disabled** dla Production
- (Opcjonalnie: włącz dla Preview deployments)

**Test plan:**
1. Otwórz production URL w inkognito
2. Sprawdź czy strona ładuje się bez 403
3. Przetestuj kilka route: /, /dashboard, /projects

**Rollback:**
- Jeśli wyłączenie protection spowodowało problemy → włącz z powrotem
- Dodaj IP whitelist jeśli potrzebny partial access

---

### Δ1.3: Weryfikacja ostatniego Production Deployment (P0)

**Problem:**
Nie wiadomo czy ostatni production deploy się powiódł.

**Weryfikacja przez Vercel API (wymaga VERCEL_TOKEN):**
```bash
# Uzyskaj token:
# https://vercel.com/account/tokens
# Scope: Read-only (wystarczy do audytu)

export VERCEL_TOKEN="twój_token"
export PROJECT="majster-ai-oferty"
export TEAM="robertb1978"  # lub twoja nazwa użytkownika

# Pobierz ostatni deployment:
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$PROJECT&teamId=$TEAM&limit=1&target=production"

# Sprawdź status:
# - state: "READY" → OK
# - state: "ERROR" → FAIL
# - state: "BUILDING" → W trakcie

# Pobierz build logs:
DEPLOYMENT_ID="[deployment_id z powyższego]"
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v2/deployments/$DEPLOYMENT_ID/events"
```

**Test plan:**
1. Sprawdź deployment status w Vercel Dashboard
2. Jeśli ERROR → przeczytaj logi, napraw problem
3. Jeśli READY → sprawdź URL czy działa

**Rollback:**
- Vercel → Deployments → [working deployment] → Promote to Production

---

## 🔒 FIX PACK Δ2 — SECURITY HARDENING (P1-P2)

### Δ2.1: Włączenie Sentry monitoring (P2 — observability)

**Problem:**
Sentry może być nie skonfigurowane, brak visibility na production errors.

**Weryfikacja:**
- Sprawdź czy `VITE_SENTRY_DSN` jest ustawione w Vercel env vars
- Jeśli brak → błędy produkcyjne nie są logowane

**Fix:**
1. Utwórz projekt Sentry: https://sentry.io
2. Pobierz DSN
3. Dodaj do Vercel env vars:
   - `VITE_SENTRY_DSN=https://...@sentry.io/...`
   - `VITE_SENTRY_ORG=twoja-org`
   - `VITE_SENTRY_PROJECT=majster-ai`
   - `VITE_SENTRY_AUTH_TOKEN=...` (do sourcemaps upload)
4. Redeploy

**Test plan:**
1. Wejdź na production
2. Wywołaj celowy error (np. throw new Error('test'))
3. Sprawdź Sentry dashboard czy error został zarejestrowany

**Rollback:**
- Usuń env vars jeśli Sentry powoduje problemy

---

### Δ2.2: Audit npm dependencies (P2 — CVE)

**Problem:**
2 moderate vulnerabilities w dependencies.

**Weryfikacja:**
```bash
npm audit --audit-level=moderate

# Sprawdź:
# - Czy moderate są w dev dependencies? (niskie ryzyko)
# - Czy w runtime dependencies? (wyższe ryzyko)
```

**Fix:**
```bash
# Automatyczny fix (jeśli możliwy):
npm audit fix

# Jeśli wymaga breaking changes:
npm audit fix --force
# (UWAGA: testuj dokładnie po tym!)

# Jeśli nie da się naprawić:
# - Sprawdź czy vulnerability dotyczy Twojego use case
# - Rozważ alternative package
# - Dodaj do .npmrc: audit-level=high (ignoruj moderate)
```

**Test plan:**
1. Po `npm audit fix`: uruchom testy `npm test`
2. Zbuduj `npm run build`
3. Sprawdź czy aplikacja działa

**Rollback:**
- `git checkout package-lock.json`
- `npm ci`

---

## ⚡ FIX PACK Δ3 — PERFORMANCE & QUALITY (P3)

### Δ3.1: Optymalizacja exportUtils bundle (P3 — UX)

**Problem:**
exportUtils-De9ULNQp.js ma 940 KB (272 KB gzipped) — najcięższy chunk.

**Analiza:**
```bash
# Sprawdź co jest w exportUtils:
npm run build:analyze
# (otwiera wizualizację bundle w przeglądarce)

# Potencjalne przyczyny:
# - jsPDF + autotable (duża biblioteka PDF)
# - ExcelJS (export do Excel)
# - html2canvas (screenshots)
```

**Fix (opcje):**
1. **Lazy load export functionality:**
   ```ts
   // Zamiast:
   import { exportToPDF } from './exportUtils';

   // Użyj:
   const { exportToPDF } = await import('./exportUtils');
   ```

2. **Code split per export type:**
   ```ts
   // vite.config.ts
   rollupOptions: {
     output: {
       manualChunks: {
         'pdf-export': ['jspdf', 'jspdf-autotable'],
         'excel-export': ['exceljs'],
         'image-export': ['html2canvas'],
       }
     }
   }
   ```

3. **Alternative libraries:**
   - Rozważ lżejsze alternatywy dla jsPDF/ExcelJS
   - Użyj server-side PDF generation (Supabase Edge Function)

**Test plan:**
1. Zmień kod zgodnie z Fix
2. `npm run build`
3. Sprawdź nowy rozmiar exportUtils
4. Przetestuj export funkcjonalność

**Rollback:**
- `git revert [commit]`

**Priorytet:** P3 (nice-to-have, nie blocker)

---

### Δ3.2: Node version parity (P3 — consistency)

**Problem:**
Lokalne środowisko ma Node 22.x, projekt wymaga 20.x.

**Fix:**
```bash
# Opcja 1: nvm (Node Version Manager)
nvm install 20
nvm use 20

# Opcja 2: .nvmrc file
echo "20" > .nvmrc
nvm use

# Opcja 3: asdf
asdf install nodejs 20.x.x
asdf local nodejs 20.x.x
```

**Weryfikacja:**
- Vercel automatycznie użyje Node 20.x (z package.json engines)
- Lokalnie: użyj nvm/asdf dla parity

**Test plan:**
1. `node --version` → v20.x.x
2. `npm ci && npm run build`
3. Sprawdź czy build działa identycznie

**Rollback:**
- `nvm use 22` (jeśli potrzebujesz Node 22 do czegoś innego)

---

### Δ3.3: Aktualizacja moderate vulnerabilities (P3 — security)

Patrz: **Δ2.2** (duplikat, już opisane w security hardening)

---

## ✅ SMOKE TEST PLAN (5–10 MINUT)

Po każdym deployment / fix, wykonaj poniższe testy:

### 1. **Podstawowa dostępność (2 min)**
```
1. Otwórz production URL w inkognito
   ✓ Strona ładuje się bez 403
   ✓ Brak błędów console
   ✓ CSS załadowane prawidłowo

2. Sprawdź route:
   ✓ / (landing page)
   ✓ /login
   ✓ /dashboard (po zalogowaniu)
   ✓ /projects
   ✓ /offers
```

### 2. **Core functionality (3 min)**
```
1. Zaloguj się
   ✓ Login działa
   ✓ Redirect do /dashboard

2. Utwórz projekt
   ✓ Formularz działa
   ✓ Zapis do Supabase
   ✓ Redirect do project detail

3. Utwórz quote
   ✓ Quote editor ładuje się
   ✓ Dodawanie items działa
   ✓ PDF preview generuje się
```

### 3. **Performance check (2 min)**
```
1. Otwórz Chrome DevTools → Network
   ✓ Initial load < 3s (Fast 3G)
   ✓ JS bundle download < 2s
   ✓ No 404/500 errors

2. Lighthouse audit:
   ✓ Performance > 70
   ✓ Accessibility > 90
   ✓ Best Practices > 90
   ✓ SEO > 90
```

### 4. **Security check (1 min)**
```
1. Sprawdź headers (DevTools → Network → pierwszy request → Headers):
   ✓ Content-Security-Policy present
   ✓ Strict-Transport-Security present
   ✓ X-Frame-Options: DENY

2. Sprawdź console:
   ✓ Brak CSP violations
   ✓ Brak mixed content warnings
```

### 5. **Error handling (2 min)**
```
1. Spróbuj złych danych:
   ✓ Puste formularze → validation errors
   ✓ Nieistniejący route → 404 page
   ✓ Wyloguj → redirect do login

2. Network offline:
   ✓ Supabase offline handler działa
   ✓ Graceful error messages
```

**Total: ~10 minut**

---

## 🔙 ROLLBACK PROCEDURES

### Rollback deployment (instant)
```bash
# W Vercel Dashboard:
1. Deployments
2. Znajdź ostatni working deployment
3. Kliknij "..." → "Promote to Production"
4. Potwierdź

# Przez CLI (jeśli masz token):
vercel rollback [deployment-url]
```

### Rollback env vars
```bash
1. Vercel → Settings → Environment Variables
2. Kliknij na zmienną
3. Przywróć poprzednią wartość
4. Save
5. Redeploy (aby zastosować)
```

### Rollback code changes
```bash
git revert [commit-hash]
git push origin claude/audit-vercel-production-hTSEB

# Vercel auto-deploy zaciągnie revert
```

### Emergency: całkowity rollback
```bash
# Znajdź ostatni stabilny deployment:
# Vercel → Deployments → [data z przed problemu]
# → Promote to Production

# + Przywróć env vars do wersji z tamtego czasu
```

---

## 📝 PODSUMOWANIE

### ✅ CO DZIAŁA DOBRZE:
- Build configuration (vercel.json, vite.config.ts)
- Security headers (CSP, HSTS, XFO, XCTO, Referrer, Permissions)
- CI/CD pipeline (lint, test, build, security audit)
- Code splitting (vendor chunks)
- SPA routing (rewrites configured)
- Build process (no warnings/errors)

### ⚠️ DO WERYFIKACJI (wymaga Vercel API/Dashboard):
- Environment variables (CRITICAL — BLOCKER jeśli brak)
- Deployment Protection (może powodować 403)
- Production deployment status
- Actual production URL accessibility

### 🔧 DO OPTYMALIZACJI (opcjonalne):
- Bundle size (exportUtils 940KB → lazy load)
- Node version parity (local 22.x vs required 20.x)
- Sentry monitoring (jeśli nie skonfigurowane)
- npm moderate vulnerabilities (2 found)

---

## 🎯 NASTĘPNE KROKI

1. **PRIORYTET P0 (TERAZ):**
   - Sprawdź env vars w Vercel (Δ1.1)
   - Sprawdź deployment protection (Δ1.2)
   - Potwierdź production URL działa (Δ1.3)

2. **PRIORYTET P1 (W TYM TYGODNIU):**
   - Włącz Sentry monitoring (Δ2.1)
   - Fix npm audit moderate (Δ2.2)

3. **PRIORYTET P2-P3 (BACKLOG):**
   - Optymalizuj exportUtils bundle (Δ3.1)
   - Ustaw Node 20.x lokalnie (Δ3.2)

4. **CONTINUOUS:**
   - Smoke test po każdym deploy
   - Monitor Sentry errors
   - npm audit przed każdym PR
