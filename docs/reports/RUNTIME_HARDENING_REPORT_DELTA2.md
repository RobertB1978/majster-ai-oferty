# Runtime Hardening Report - Fix Pack Δ2
**Date:** 2025-12-13
**Scope:** ETAP 2 - Runtime Resilience & Production Readiness
**Branch:** `claude/runtime-hardening-production-013UerasHVwj5YWHJgMWZJLD`

---

## Executive Summary

**Status:** 🔴 NO-GO for production deployment
**Critical Issues:** 3
**High Priority:** 4
**Medium Priority:** 2

**Blocking Issues for Production:**
1. Synchronous Sentry initialization blocks critical render path
2. Mixed package manager state (npm + bun lock files)
3. CSP header weakened by `unsafe-inline` and `unsafe-eval`

---

## 1. RUNTIME RESILIENCE ANALYSIS

### 1.1 Critical Render Path Blockers ❌ CRITICAL

**Finding RT-001: Sentry initialization blocks render**
- **Location:** `src/main.tsx:5-8`
- **Evidence:**
  ```typescript
  import { initSentry } from "./lib/sentry";

  // Inicjalizuj Sentry przed renderowaniem aplikacji
  initSentry();  // ← SYNCHRONOUS BLOCKING CALL

  createRoot(document.getElementById("root")!).render(<App />);
  ```
- **Impact:** First paint delayed by Sentry SDK initialization + web-vitals setup
- **Risk:** High - affects Core Web Vitals (FCP, LCP)
- **Root Cause:** `initSentry()` is synchronous and runs before React render

**Finding RT-002: Web Vitals initialized synchronously**
- **Location:** `src/lib/sentry.ts:83`
- **Evidence:**
  ```typescript
  Sentry.init({
    // ... config
  });

  // Inicjalizuj Web Vitals monitoring
  initWebVitals();  // ← SYNCHRONOUS, runs 5 event listeners
  ```
- **Impact:** Registers 5 event listeners (CLS, INP, LCP, FCP, TTFB) before first paint
- **Risk:** Medium - adds overhead to startup

**Finding RT-003: Supabase client created at module load**
- **Location:** `src/integrations/supabase/client.ts:82`
- **Evidence:**
  ```typescript
  export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: localStorage,  // ← Access to localStorage at module load
      persistSession: true,
      autoRefreshToken: true,
    }
  });
  ```
- **Impact:** Module-level side effect, accesses localStorage before render
- **Risk:** Low-Medium - client is lazy-loaded via imports, but not async

### 1.2 External Integration Safety ✅ ACCEPTABLE

**Finding RT-004: ErrorBoundary present but not Sentry-integrated**
- **Location:** `src/components/ErrorBoundary.tsx:26-28`
- **Evidence:**
  ```typescript
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // ← Does NOT report to Sentry!
  }
  ```
- **Impact:** Errors caught by ErrorBoundary are NOT sent to Sentry
- **Risk:** Low - Sentry has its own ErrorBoundary, but inconsistent
- **Note:** `src/lib/sentry.ts:176` exports `SentryErrorBoundary` but it's not used in App.tsx

**Finding RT-005: External integrations have try-catch guards**
- **Status:** ✅ GOOD
- **Evidence:**
  - Web vitals: `try-catch` around metric collection (sentry.ts:96-111)
  - Cookie consent: `try-catch` around Supabase insert (CookieConsent.tsx:36-53)
  - Auth: `try-catch` in login/register (AuthContext.tsx:42-94)

---

## 2. DEPENDENCY STRATEGY ❌ CRITICAL

### 2.1 Mixed Package Managers

**Finding DEP-001: Multiple lock files present**
- **Location:** Project root
- **Evidence:**
  ```bash
  $ ls -la | grep lock
  -rw-r--r--  1 root root 201126 Dec 12 18:18 bun.lockb
  -rw-r--r--  1 root root 394223 Dec 12 18:18 package-lock.json
  ```
- **Impact:** Dependency resolution conflicts, CI/CD ambiguity
- **Risk:** High - different developers/CI may use different package managers
- **Root Cause:** Project history shows both npm and bun usage

**Finding DEP-002: No package manager enforcement**
- **Location:** `package.json`, `.gitignore`
- **Evidence:** No `packageManager` field in package.json, no `.npmrc` or `.yarnrc`
- **Impact:** Developers can freely mix npm/bun/pnpm
- **Risk:** High

**Finding DEP-003: No CI guard against mixed package managers**
- **Location:** CI/CD configuration (if exists)
- **Evidence:** No verification step in build scripts
- **Risk:** Medium

---

## 3. SUPABASE / AUTH / RLS POLICIES

### 3.1 RLS Coverage ✅ EXCELLENT

**Finding SEC-001: 100% RLS coverage**
- **Status:** ✅ GOOD
- **Evidence:**
  ```bash
  $ grep "CREATE TABLE" supabase/migrations/*.sql | wc -l
  32
  $ grep "ENABLE ROW LEVEL SECURITY" supabase/migrations/*.sql | wc -l
  32
  ```
- **Impact:** All tables protected by RLS
- **Note:** Security migration Δ1 was applied (20251207110925)

### 3.2 Tenant Isolation ⚠️ PARTIAL

**Finding SEC-002: Mixed user-level and org-level isolation**
- **Location:** `supabase/migrations/20251207110925_fd116312-a252-4680-870a-632e137bf7ef.sql`
- **Evidence:**
  - **User-level only:** clients, projects, quotes, pdf_data, item_templates, etc.
    ```sql
    USING (auth.uid() = user_id)  -- ← User isolation only
    ```
  - **Org-level:** organizations, organization_members
    ```sql
    USING (public.is_org_member(auth.uid(), organization_id))  -- ← Org isolation
    ```
- **Impact:** Most tables use user_id isolation, not organization_id
- **Risk:** Medium - For SaaS with teams, this limits collaboration
- **Current State:** Organizations exist but most features are single-user scoped

**Finding SEC-003: Public token validation for offer approvals**
- **Location:** `supabase/migrations/20251207110925...sql:554-563`
- **Evidence:**
  ```sql
  CREATE POLICY "Public can view pending offers by valid token"
  ON public.offer_approvals FOR SELECT
  TO anon
  USING ((status = 'pending') AND (public_token IS NOT NULL) AND public.validate_offer_token(public_token));
  ```
- **Status:** ✅ GOOD - properly scoped to anon role with validation function
- **Risk:** Low - IF `validate_offer_token()` is properly implemented

### 3.3 Potential Data Leaks ⚠️ REVIEW NEEDED

**Finding SEC-004: No validation of offer_approvals.public_token uniqueness in policy**
- **Location:** `supabase/migrations/20251205230527...sql`
- **Evidence:**
  ```sql
  public_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  ```
  - UNIQUE constraint exists at DB level ✅
  - Policy trusts `validate_offer_token()` function (not reviewed)
- **Action Required:** Verify `validate_offer_token()` function implementation

**Finding SEC-005: user_consents allows NULL user_id for anonymous consent**
- **Location:** `supabase/migrations/20251207110925...sql:469-472`
- **Evidence:**
  ```sql
  CREATE POLICY "Authenticated users can insert consents"
  ON public.user_consents FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() IS NOT NULL) AND ((user_id IS NULL) OR (user_id = auth.uid())));
  ```
- **Risk:** Low - allows logged-in users to create consents without user_id (intended for GDPR)
- **Status:** ⚠️ REVIEW - verify this is intentional

---

## 4. PRODUCTION READINESS

### 4.1 HTTP Security Headers ⚠️ WEAKENED

**Finding PROD-001: CSP weakened by unsafe-inline and unsafe-eval**
- **Location:** `vercel.json:31-32`
- **Evidence:**
  ```json
  {
    "key": "Content-Security-Policy",
    "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; ..."
  }
  ```
- **Impact:**
  - `'unsafe-inline'` allows inline `<script>` tags → XSS risk
  - `'unsafe-eval'` allows `eval()`, `new Function()` → Code injection risk
- **Risk:** High - significantly weakens CSP protection
- **Root Cause:** Likely needed for React DevTools, TanStack Query Devtools, or legacy code

**Finding PROD-002: Other security headers are strong**
- **Status:** ✅ GOOD
- **Evidence:**
  - `X-Frame-Options: DENY` ✅
  - `X-Content-Type-Options: nosniff` ✅
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` ✅
  - `Referrer-Policy: strict-origin-when-cross-origin` ✅
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` ✅

**Finding PROD-003: HSTS preload not enabled**
- **Location:** `vercel.json:28`
- **Evidence:**
  ```json
  "value": "max-age=31536000; includeSubDomains"
  ```
  Missing: `; preload`
- **Impact:** Domain not eligible for HSTS preload list
- **Risk:** Low - still forces HTTPS after first visit

### 4.2 Cookies & Consent ✅ COMPLIANT

**Finding PROD-004: Cookie consent implementation is GDPR-compliant**
- **Status:** ✅ GOOD
- **Evidence:**
  - Consent UI with granular options (essential/analytics/marketing)
  - Stored in localStorage + database (user_consents table)
  - Essential cookies can't be disabled ✅
  - Consent date recorded ✅
- **Location:** `src/components/legal/CookieConsent.tsx`

**Finding PROD-005: Supabase uses localStorage for auth (not cookies)**
- **Location:** `src/integrations/supabase/client.ts:84`
- **Evidence:**
  ```typescript
  auth: {
    storage: localStorage,  // ← Not httpOnly cookies
    persistSession: true,
  }
  ```
- **Risk:** Low-Medium - localStorage accessible to JS (XSS risk)
- **Note:** This is Supabase default. For better security, consider switching to cookie-based storage

### 4.3 Logging & PII Masking ⚠️ PII LEAKS DETECTED

**Finding PROD-006: Console logs contain PII**
- **Location:** Multiple files
- **Evidence:**
  ```typescript
  // src/hooks/useBiometricAuth.ts:221
  console.log('Biometric disabled for', email);  // ← EMAIL in console

  // src/hooks/usePushNotifications.ts:49
  console.log('Push registration success, token:', token.value);  // ← DEVICE TOKEN

  // src/contexts/AuthContext.tsx:51
  console.log('🔐 Login attempt:', {
    email,  // ← EMAIL in console
    // ...
  });
  ```
- **Impact:** PII leaked to browser console (visible in dev tools)
- **Risk:** Medium - only in development mode, but bad practice
- **Scope:** 112 console.log/error/warn across 40 files

**Finding PROD-007: Sentry has PII filtering**
- **Status:** ✅ GOOD
- **Location:** `src/lib/sentry.ts:36-58`
- **Evidence:**
  ```typescript
  beforeSend(event) {
    // Usuń wrażliwe dane z breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data) {
          delete breadcrumb.data.email;
          delete breadcrumb.data.password;
          delete breadcrumb.data.token;
          delete breadcrumb.data.apiKey;
        }
        return breadcrumb;
      });
    }
    // ...
  }
  ```
- **Coverage:** Email, password, token, apiKey, Authorization header, Cookie header

**Finding PROD-008: Error message in CookieConsent leaks to console**
- **Location:** `src/components/legal/CookieConsent.tsx:52`
- **Evidence:**
  ```typescript
  } catch (error) {
    console.error('Error saving consent:', error);  // ← May contain Supabase error details
  }
  ```
- **Risk:** Low - error object may contain DB details

---

## FIX PACK Δ2 - CONCRETE PATCHES

### PATCH 1: Lazy Sentry Initialization (RT-001, RT-002)

**File:** `src/main.tsx`
**Current:**
```typescript
import { initSentry } from "./lib/sentry";

// Inicjalizuj Sentry przed renderowaniem aplikacji
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
```

**Fixed:**
```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Render first, initialize monitoring async
createRoot(document.getElementById("root")!).render(<App />);

// Lazy load Sentry AFTER first paint
setTimeout(async () => {
  const { initSentry } = await import("./lib/sentry");
  initSentry();
}, 0);
```

**Impact:** Unblocks critical render path, Sentry initializes after first paint

---

### PATCH 2: Async Web Vitals (RT-002)

**File:** `src/lib/sentry.ts`
**Current:**
```typescript
export function initSentry() {
  if (dsn) {
    Sentry.init({ /* ... */ });

    // Inicjalizuj Web Vitals monitoring
    initWebVitals();  // ← SYNCHRONOUS

    console.log(`✅ Sentry zainicjalizowane (${environment})`);
  }
}
```

**Fixed:**
```typescript
export function initSentry() {
  if (dsn) {
    Sentry.init({ /* ... */ });

    // Inicjalizuj Web Vitals ASYNCHRONOUSLY
    requestIdleCallback(() => {
      initWebVitals();
    }, { timeout: 2000 });

    console.log(`✅ Sentry zainicjalizowane (${environment})`);
  }
}
```

**Impact:** Web vitals listeners registered during idle time, not blocking startup

---

### PATCH 3: Integrate ErrorBoundary with Sentry (RT-004)

**File:** `src/components/ErrorBoundary.tsx`
**Current:**
```typescript
public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('ErrorBoundary caught an error:', error, errorInfo);
}
```

**Fixed:**
```typescript
import { logError } from '@/lib/sentry';

public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('ErrorBoundary caught an error:', error, errorInfo);

  // Report to Sentry
  logError(error, {
    componentStack: errorInfo.componentStack,
    boundary: 'RootErrorBoundary'
  });
}
```

**Impact:** Errors caught by ErrorBoundary are now sent to Sentry

---

### PATCH 4: Canonical Package Manager (DEP-001, DEP-002)

**File:** `package.json`
**Add:**
```json
{
  "name": "vite_react_shadcn_ts",
  "packageManager": "npm@10.9.2",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "preinstall": "node -e \"if (process.env.npm_execpath.indexOf('pnpm') !== -1 || process.env.npm_execpath.indexOf('bun') !== -1) { console.error('❌ Please use npm install'); process.exit(1); }\""
  }
}
```

**File:** `.gitignore`
**Add:**
```gitignore
# Enforce npm only - ignore other lock files
bun.lockb
pnpm-lock.yaml
yarn.lock
```

**File:** `.npmrc` (NEW)
**Create:**
```
engine-strict=true
```

**Actions:**
```bash
rm bun.lockb
npm install
git add package-lock.json .npmrc
git rm bun.lockb
```

**Impact:** Enforces npm-only usage, prevents mixed package managers

---

### PATCH 5: Strengthen CSP (PROD-001)

**File:** `vercel.json`
**Current:**
```json
"value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; ..."
```

**Fixed (Option A - Strict, may break DevTools):**
```json
"value": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://sentry.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
```

**Fixed (Option B - Nonce-based, requires Vite plugin):**
*Requires implementation of CSP nonce injection*

**Recommended:** Option A for production builds, keep current CSP for development

**Implementation:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://sentry.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        }
      ]
    }
  ]
}
```

**Note:** Test thoroughly - may require adding nonces or hashes for inline scripts

---

### PATCH 6: Add HSTS Preload (PROD-003)

**File:** `vercel.json`
**Current:**
```json
{
  "key": "Strict-Transport-Security",
  "value": "max-age=31536000; includeSubDomains"
}
```

**Fixed:**
```json
{
  "key": "Strict-Transport-Security",
  "value": "max-age=31536000; includeSubDomains; preload"
}
```

**Additional Step:** Submit domain to https://hstspreload.org/

---

### PATCH 7: PII Masking in Logs (PROD-006, PROD-008)

**File:** `src/lib/logger.ts` (NEW)
**Create:**
```typescript
/**
 * Production-safe logger that masks PII
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info';

const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?48\s?)?\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g,
  token: /\b[A-Za-z0-9_-]{20,}\b/g,
};

function maskPII(value: any): any {
  if (typeof value === 'string') {
    return value
      .replace(PII_PATTERNS.email, '[EMAIL_REDACTED]')
      .replace(PII_PATTERNS.phone, '[PHONE_REDACTED]')
      .replace(PII_PATTERNS.token, '[TOKEN_REDACTED]');
  }

  if (Array.isArray(value)) {
    return value.map(maskPII);
  }

  if (value && typeof value === 'object') {
    const masked: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      // Mask known PII fields
      if (['email', 'password', 'token', 'apiKey', 'phone', 'address'].includes(key)) {
        masked[key] = '[REDACTED]';
      } else {
        masked[key] = maskPII(val);
      }
    }
    return masked;
  }

  return value;
}

function shouldLog(): boolean {
  // Only log in development, or if explicitly enabled
  return import.meta.env.MODE === 'development' || import.meta.env.VITE_ENABLE_LOGGING === 'true';
}

export const logger = {
  log: (...args: any[]) => {
    if (shouldLog()) {
      console.log(...args.map(maskPII));
    }
  },

  warn: (...args: any[]) => {
    if (shouldLog()) {
      console.warn(...args.map(maskPII));
    }
  },

  error: (...args: any[]) => {
    if (shouldLog()) {
      console.error(...args.map(maskPII));
    }
  },

  info: (...args: any[]) => {
    if (shouldLog()) {
      console.info(...args.map(maskPII));
    }
  },
};
```

**Usage Example:**
```typescript
// OLD:
console.log('Login attempt:', { email, password });

// NEW:
import { logger } from '@/lib/logger';
logger.log('Login attempt:', { email, password });  // Automatically masks PII
```

**Replacement Plan:**
1. Create `src/lib/logger.ts` with the code above
2. Use ESLint rule to enforce logger usage:
   ```json
   // .eslintrc.json
   {
     "rules": {
       "no-console": ["error", { "allow": ["assert"] }]
     }
   }
   ```
3. Gradually replace console.* calls with logger.* in critical files

---

### PATCH 8: README - Package Manager Policy (DEP-001)

**File:** `README.md`
**Add section:**
```markdown
## Package Manager Policy

This project uses **npm** as the canonical package manager.

**DO NOT use:**
- ❌ `bun install`
- ❌ `pnpm install`
- ❌ `yarn install`

**ALWAYS use:**
- ✅ `npm install`
- ✅ `npm run dev`
- ✅ `npm run build`

The `preinstall` script will block non-npm package managers.

### Why npm only?

1. **Consistency** - All developers and CI use the same dependency resolution
2. **Lock file** - Single source of truth (`package-lock.json`)
3. **Debugging** - Easier to troubleshoot dependency issues

If you accidentally created `bun.lockb`, `pnpm-lock.yaml`, or `yarn.lock`, delete them:
```bash
rm -f bun.lockb pnpm-lock.yaml yarn.lock
npm install
```
```

---

## IMPLEMENTATION PRIORITY

### 🔴 CRITICAL - Must fix before production

1. **PATCH 1** - Lazy Sentry init (RT-001)
2. **PATCH 4** - Canonical package manager (DEP-001, DEP-002)
3. **PATCH 5** - Strengthen CSP (PROD-001)

### 🟡 HIGH - Should fix before production

4. **PATCH 2** - Async web vitals (RT-002)
5. **PATCH 7** - PII masking logger (PROD-006)
6. **PATCH 3** - ErrorBoundary Sentry integration (RT-004)

### 🟢 MEDIUM - Can defer to post-launch

7. **PATCH 6** - HSTS preload (PROD-003)
8. **PATCH 8** - README documentation (DEP-001)

---

## GO / NO-GO DECISION

### ❌ **NO-GO** for production deployment

**Blocking Issues:**
1. **Sentry blocks critical render path** (RT-001) - Affects Core Web Vitals
2. **Mixed package managers** (DEP-001) - Risk of dependency conflicts in production
3. **Weakened CSP** (PROD-001) - Significant XSS risk exposure

**Required Actions Before Production:**
1. Apply PATCH 1 (Lazy Sentry)
2. Apply PATCH 4 (Package manager enforcement)
3. Apply PATCH 5 (CSP hardening) OR document risk acceptance
4. Test PATCH 5 thoroughly (may break React DevTools in dev, needs conditional CSP)

**Estimated Fix Time:** 2-4 hours

**Recommended Path:**
1. Apply PATCH 1, 2, 3, 4 immediately
2. Test PATCH 5 in staging (may need conditional CSP for dev vs prod)
3. Apply PATCH 7 gradually (can be done post-launch, but start ASAP)
4. Re-audit after patches applied

---

## TEST PLAN for Fix Pack Δ2

### Pre-deployment Verification

1. **Runtime Performance:**
   ```bash
   npm run build
   npm run preview
   # Open Chrome DevTools → Lighthouse
   # Verify FCP < 1.8s, LCP < 2.5s, CLS < 0.1
   ```

2. **Package Manager Enforcement:**
   ```bash
   rm -rf node_modules package-lock.json
   bun install  # Should FAIL with error message
   npm install  # Should SUCCEED
   ```

3. **CSP Compliance:**
   ```bash
   npm run build
   # Deploy to staging
   # Open browser console - verify NO CSP violations
   # Test all features: auth, file upload, PDF generation, AI chat
   ```

4. **Sentry Integration:**
   ```bash
   # In staging:
   # 1. Trigger error (e.g., throw error in component)
   # 2. Verify error appears in Sentry dashboard
   # 3. Verify error caught by ErrorBoundary is sent to Sentry
   ```

5. **PII Masking:**
   ```bash
   # Open browser console in dev mode
   # Perform login
   # Verify email/password are masked in console logs
   ```

### Regression Tests

- [ ] User can log in
- [ ] User can create project
- [ ] User can generate quote
- [ ] User can send offer email
- [ ] Client can approve offer via public link
- [ ] PDF generation works
- [ ] AI chat works
- [ ] File uploads work
- [ ] Dark mode toggle works
- [ ] Cookie consent banner appears for new users

---

## APPENDIX A: Commands Run for Audit

```bash
# Lock files check
ls -la | grep -E "lock|package"

# RLS policy count
grep -h "CREATE TABLE" supabase/migrations/*.sql | wc -l
grep -h "ENABLE ROW LEVEL SECURITY" supabase/migrations/*.sql | wc -l

# Console.log count
grep -r "console\.(log|error|warn|info)" src/**/*.{ts,tsx} | wc -l

# PII in logs
grep -ri "console\..*\(email\|password\|phone\|token\)" src/**/*.{ts,tsx}

# Organization isolation check
grep -h "organization_id" supabase/migrations/*.sql
```

---

## APPENDIX B: Risk Matrix

| Finding | Severity | Likelihood | Risk Level | CVSS v3 (est.) |
|---------|----------|------------|------------|----------------|
| RT-001  | High     | High       | Critical   | N/A (perf)     |
| RT-002  | Medium   | High       | High       | N/A (perf)     |
| DEP-001 | High     | Medium     | High       | N/A (ops)      |
| PROD-001| High     | Medium     | High       | 6.1 (XSS)      |
| PROD-006| Medium   | High       | Medium     | 4.3 (info leak)|

---

**Report Compiled By:** Claude Code (Sonnet 4.5)
**Review Required By:** Project Owner
**Next Steps:** Apply CRITICAL patches, re-test, re-audit
