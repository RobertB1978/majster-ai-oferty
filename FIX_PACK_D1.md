# FIX PACK Δ1 - CRITICAL P0 FIXES
**Priorytet:** P0 (MUST FIX przed produkcją)  
**Timeline:** 15 minut  
**Audytor:** Majster Auditor

---

## 🚨 CRITICAL BLOCKERS

### ✅ BLOCKER #1: offer_approvals RLS Policy (RESOLVED)

**Status:** ~~P0 BLOCKER~~ → ✅ **JUŻ NAPRAWIONE**

**Problem:**  
Migracja `20251205230527` zawierała niebezpieczną politykę RLS:
```sql
CREATE POLICY "Public can view offers by token"
ON public.offer_approvals FOR SELECT
USING (true);  -- ❌ KAŻDY ANON MOŻE ZOBACZYĆ WSZYSTKIE OFERTY!
```

**Naprawa:**  
Migracja `20251207110925_fd116312-a252-4680-870a-632e137bf7ef.sql` (FIX PACK SECURITY Δ1) już naprawiła ten problem:

```sql
-- Drop old dangerous policies
DROP POLICY IF EXISTS "Public can view offers by token" ON public.offer_approvals;
DROP POLICY IF EXISTS "Public can update offers by token" ON public.offer_approvals;

-- Create secure policies with token validation
CREATE POLICY "Public can view pending offers by valid token" 
ON public.offer_approvals FOR SELECT 
TO anon
USING (
  (status = 'pending') 
  AND (public_token IS NOT NULL) 
  AND public.validate_offer_token(public_token)
);

CREATE POLICY "Public can update pending offers with valid token" 
ON public.offer_approvals FOR UPDATE 
TO anon
USING (
  (status = 'pending') 
  AND (public_token IS NOT NULL) 
  AND public.validate_offer_token(public_token)
)
WITH CHECK (
  (status = ANY (ARRAY['approved', 'rejected'])) 
  AND (public_token IS NOT NULL)
);
```

**Weryfikacja:**
```bash
# Sprawdź czy migracja została zastosowana
supabase db migrations list

# Powinno pokazać:
# ✅ 20251207110925_fd116312-a252-4680-870a-632e137bf7ef.sql
```

**Action:** ✅ **BRAK** - Już naprawione. Przejdź do następnego blockera.

---

### ❌ BLOCKER #2: Node.js Version Mismatch

**Status:** ❌ **WYMAGA NAPRAWY**  
**Severity:** P0  
**Impact:** Deployment failure, npm ci nie działa

**Problem:**
```bash
$ npm ci
npm error engine Not compatible with your version of node/npm
npm error notsup Required: {"node":"20.x","npm":"10.x"}
npm error notsup Actual:   {"npm":"10.9.4","node":"v22.21.1"}
```

**Root Cause:**  
`package.json` wymaga Node 20.x, ale system/CI używa Node 22.x.

**Fix (3 kroki):**

#### **Krok 1: Vercel Environment Variable**
1. Idź do Vercel Dashboard → Settings → Environment Variables
2. Dodaj nową zmienną:
   - **Name:** `NODE_VERSION`
   - **Value:** `20.18.1` (lub `20.x` dla latest 20)
   - **Environments:** Production, Preview, Development
3. Kliknij **Save**

**Komenda (via Vercel CLI - opcjonalnie):**
```bash
vercel env add NODE_VERSION
# Enter value: 20.18.1
# Select environments: Production, Preview, Development
```

#### **Krok 2: GitHub Actions Workflows**
Zaktualizuj wszystkie workflows aby używały Node 20.x:

**Pliki do edycji:**
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/supabase-deploy.yml`

**Zmiana:**
```yaml
# PRZED:
- uses: actions/setup-node@v4
  with:
    node-version: '20.x'  # ✅ To jest OK, sprawdź czy już jest
    cache: 'npm'

# JEŚLI brakuje lub jest inna wersja, ustaw na '20.x'
```

**Przykład (ci.yml):**
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'  # ✅ Force 20.x
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
```

#### **Krok 3: Lokalne środowisko (dla deweloperów)**

**Option A: nvm (Node Version Manager)**
```bash
# Install Node 20 (jeśli nie masz)
nvm install 20

# Use Node 20 w tym projekcie
nvm use 20

# Auto-switch przy cd (opcjonalnie)
echo "20" > .nvmrc
```

**Option B: fnm (Fast Node Manager)**
```bash
# Install Node 20
fnm install 20

# Use Node 20
fnm use 20

# Auto-switch
echo "20" > .node-version
```

**Option C: Docker (jeśli używasz)**
```dockerfile
FROM node:20.18.1-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

---

### Weryfikacja Naprawy

Po wykonaniu kroków 1-3, sprawdź:

**1. Vercel:**
```bash
# Trigger nowy deployment
git commit --allow-empty -m "chore: trigger rebuild with Node 20"
git push origin main

# Sprawdź build logs:
# https://vercel.com/[your-project]/deployments
# Powinno pokazać: "Using Node.js 20.x"
```

**2. GitHub Actions:**
```bash
# Push zmian w workflows
git add .github/workflows/*.yml
git commit -m "fix: enforce Node 20.x in CI workflows"
git push

# Sprawdź workflow run:
# https://github.com/RobertB1978/majster-ai-oferty/actions
# Powinno pokazać: "Setup Node.js 20.x"
```

**3. Lokalnie:**
```bash
node -v
# Expected: v20.x.x

npm ci
# Expected: Success (no engine errors)

npm run build
# Expected: Success
```

---

## ✅ CHECKLIST FIX PACK Δ1

- [x] **BLOCKER #1:** offer_approvals RLS ← ✅ JUŻ NAPRAWIONE
- [ ] **BLOCKER #2.1:** Vercel NODE_VERSION env var
- [ ] **BLOCKER #2.2:** GitHub Actions workflows (Node 20.x)
- [ ] **BLOCKER #2.3:** Lokalnie - nvm/fnm use 20
- [ ] **VERIFY #1:** Vercel deployment success
- [ ] **VERIFY #2:** GitHub Actions success
- [ ] **VERIFY #3:** Lokalnie npm ci + build

---

## 🎯 SUCCESS CRITERIA

Po wykonaniu FIX PACK Δ1:
- ✅ `npm ci` działa bez błędów engine
- ✅ Vercel deployment builds on Node 20.x
- ✅ GitHub Actions używają Node 20.x
- ✅ offer_approvals ma bezpieczne RLS policies (już ✅)

**Timeline:** 15 minut  
**Risk:** LOW (proste zmiany konfiguracji)

---

**Następny krok:** FIX PACK Δ2 (Security Hardening)
