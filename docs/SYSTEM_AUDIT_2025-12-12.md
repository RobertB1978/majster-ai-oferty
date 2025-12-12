# System Audit Report - Majster.AI
**Date:** 2025-12-12
**Auditor:** Claude Code (Systemowy Audyt Produkcyjny)
**Repository:** majster-ai-oferty
**Branch:** claude/code-review-audit-DRuJK
**Scope:** Full system audit with evidence-based findings

---

## Executive Summary

### Go/No-Go Decision: ⚠️ **CONDITIONAL GO**

**Current Status:** The application CANNOT be run or built in its current state without dependencies installation. Critical toolchain and security issues must be resolved before production deployment.

**Blocking Issues:**
1. ❌ Dependencies not installed (`node_modules` missing)
2. ❌ Dual lockfile conflict (bun.lockb + package-lock.json)
3. ❌ TypeScript strict mode disabled (violates CLAUDE.md standards)
4. ❌ .env file tracked in git history (security risk)
5. ❌ Node version mismatch (using v22, required v20)

**Recommendation:** Fix Critical and High severity issues in Fix Pack Δ1 before production deployment.

---

### Top 10 Critical Risks

| # | Risk | Severity | Impact | Evidence |
|---|------|----------|--------|----------|
| 1 | **No node_modules installed** | CRITICAL | Application cannot run or build | `ls node_modules` → "No such file or directory" |
| 2 | **Dual lockfile conflict** | CRITICAL | Non-deterministic builds, dependency chaos | `bun.lockb` (197KB) + `package-lock.json` (385KB) both exist |
| 3 | **TypeScript strict mode disabled** | CRITICAL | No type safety, violates CLAUDE.md | `tsconfig.app.json:18` → `"strict": false` |
| 4 | **.env tracked in git** | HIGH | Security risk, credential exposure | `git ls-files` shows `.env` tracked since commit 1cb6d8f8 |
| 5 | **Node version mismatch** | HIGH | Runtime inconsistency, CI/CD issues | Using Node v22.21.1, `.nvmrc` + CI require v20 |
| 6 | **--legacy-peer-deps in CI** | HIGH | Masks dependency conflicts | `.github/workflows/ci.yml:28,54,92` |
| 7 | **npm audit vulnerabilities** | MODERATE | esbuild, js-yaml, vite CVEs | `npm audit` shows 3 moderate vulnerabilities |
| 8 | **No lazy loading** | MODERATE | Large initial bundle, poor performance | No `React.lazy()` usage in codebase |
| 9 | **Husky hooks not installed** | MODERATE | No pre-commit validation | `.git/hooks/` contains only `.sample` files |
| 10 | **Security audit continues on error** | LOW | Vulnerabilities don't block CI | `.github/workflows/ci.yml:125` → `continue-on-error: true` |

---

### Top 10 Strengths

| # | Strength | Evidence |
|---|----------|----------|
| 1 | **Defensive web-vitals integration** | `src/lib/sentry.ts:96,108,121` → try/catch wrapping all metrics |
| 2 | **Excellent Supabase config validation** | `src/integrations/supabase/client.ts:8-77` → detects placeholder values |
| 3 | **Global ErrorBoundary** | `src/App.tsx:65` → `<ErrorBoundary>` wraps entire app |
| 4 | **Comprehensive test coverage** | 18 test files across lib, hooks, features |
| 5 | **Well-structured CI/CD pipeline** | `.github/workflows/ci.yml` → lint, test, build, security jobs |
| 6 | **Bundle optimization configured** | `vite.config.ts:47-59` → manual chunks for vendors |
| 7 | **Sensitive data filtering in Sentry** | `src/lib/sentry.ts:36-58` → removes email, password, tokens |
| 8 | **Proper .gitignore** | `.gitignore:24-29` → .env files excluded (though .env was committed once) |
| 9 | **Clear environment variable docs** | `.env.example:1-95` → comprehensive setup guide |
| 10 | **Code splitting in Vite** | `vite.config.ts:47-72` → optimized chunk naming and asset handling |

---

## Findings Register

| ID | Severity | Category | Problem | Evidence | Impact | Recommendation | Effort | Acceptance Criteria |
|----|----------|----------|---------|----------|--------|----------------|--------|---------------------|
| **A-01** | CRITICAL | Toolchain | Dependencies not installed | `ls /home/user/majster-ai-oferty/node_modules` → "No such file or directory"<br>`npm run build` → "vite: not found" | Cannot run `npm run dev` or `npm run build` | Run `npm ci` after resolving lockfile conflict | 5 min | `npm run build` completes successfully |
| **A-02** | CRITICAL | Toolchain | Dual lockfile conflict | `ls -lh bun.lockb package-lock.json`:<br>- bun.lockb (197KB)<br>- package-lock.json (385KB) | Non-deterministic installs, different results per manager | Delete `bun.lockb`, commit only `package-lock.json` | 5 min | Only one lockfile exists in repo |
| **A-03** | CRITICAL | TypeScript | Strict mode disabled | `tsconfig.app.json:18` → `"strict": false`<br>`tsconfig.json:14` → `"strictNullChecks": false` | No type safety, runtime errors, violates CLAUDE.md "NEVER disable TypeScript strict mode" | Enable `"strict": true` in tsconfig.app.json | 2 days | `tsc --noEmit` passes with strict mode |
| **A-04** | HIGH | Toolchain | Node version mismatch | `.nvmrc:1` → "20"<br>Actual: `node --version` → "v22.21.1"<br>CI: `.github/workflows/ci.yml:24,50,88` → node-version: '20' | Inconsistent runtime behavior, potential breakage in CI | Use Node 20 locally: `nvm use 20` or update .nvmrc to 22 | 5 min | `node --version` matches `.nvmrc` |
| **A-05** | HIGH | Toolchain | Husky hooks not installed | `ls -la .git/hooks/` → only `.sample` files<br>`package.json:22` → prepare script exists but not executed | No pre-commit validation, bad commits can be pushed | Run `npm install` (triggers prepare script) or `npx husky install` | 1 min | `.git/hooks/pre-commit` exists (non-sample) |
| **B-01** | HIGH | Dependencies | --legacy-peer-deps in CI | `.github/workflows/ci.yml:28` → `npm ci --legacy-peer-deps`<br>Lines 54, 92 same flag | Masks peer dependency conflicts, technical debt | Resolve peer deps properly, remove flag | 4 hours | CI runs `npm ci` without --legacy-peer-deps |
| **B-02** | MODERATE | Security | npm audit vulnerabilities | `npm audit --json` output:<br>- esbuild <=0.24.2 (GHSA-67mh-4wv8-2f99)<br>- js-yaml 4.0.0-4.1.0 (GHSA-mh29-5h37-fv8m)<br>- vite <=5.4.19 (2 CVEs) | Moderate severity CVEs, dev-only impact | Run `npm audit fix` | 10 min | `npm audit --audit-level=moderate` passes |
| **D-01** | HIGH | Security | .env tracked in git | `git ls-files` → `.env` listed<br>`git log --all -- .env` → commit 1cb6d8f8 | Credential exposure risk (even if placeholders now) | Remove from git: `git rm --cached .env` | 2 min | `.env` not in `git ls-files` output |
| **D-02** | MODERATE | Security | No CSP headers configured | No `vercel.json` or CSP meta tags found<br>No public/\_headers or netlify.toml | XSS risk, no defense-in-depth | Add CSP headers in hosting config | 1 hour | CSP headers present in production |
| **D-03** | LOW | Security | Security audit continues on error | `.github/workflows/ci.yml:125` → `continue-on-error: true` | High/Critical vulnerabilities won't block merge | Change to `continue-on-error: false` for critical issues | 5 min | CI fails on audit-level=high |
| **E-01** | MODERATE | QA/CI | No integration tests | Only 18 unit/hook tests found<br>No E2E tests (no Playwright/Cypress config) | Critical user flows not tested | Add smoke tests for auth + quote creation | 2 days | At least 2 smoke tests pass in CI |
| **F-01** | MODERATE | Performance | No lazy loading | `grep -r "React.lazy\|lazy(" src/` → No files found | Large initial bundle, slow FCP/LCP | Lazy load routes with React.lazy() | 4 hours | Main bundle < 500KB, routes lazy loaded |
| **F-02** | LOW | Performance | Chunk size warning limit raised | `vite.config.ts:75` → `chunkSizeWarningLimit: 1000` (default 500) | Hides bundle bloat warnings | Lower to 600, investigate chunks > 500KB | 2 hours | All chunks under 600KB or justified |
| **C-01** | LOW | Runtime | initSentry() called synchronously | `src/main.tsx:8` → `initSentry()` before render | If web-vitals import fails BEFORE ErrorBoundary, app won't start | Wrap in try/catch or dynamic import | 15 min | App starts even if Sentry fails |

**Total Findings:** 14
**Critical:** 3 | **High:** 4 | **Moderate:** 5 | **Low:** 2

---

## Fix Pack Δ1 - Critical Path to Green Build

### Prerequisites
- Windows PowerShell or WSL
- Node.js 20.x installed (via nvm: `nvm install 20 && nvm use 20`)
- Git access to repository

### Phase 1: Immediate Blockers (Est: 15 minutes)

#### Fix 1.1: Resolve Lockfile Conflict
**Problem:** Dual lockfiles cause non-deterministic builds
**Files:** `bun.lockb`, `package-lock.json`

```powershell
# Remove bun lockfile
Remove-Item bun.lockb

# Verify only npm lockfile remains
Get-ChildItem *lock* -Name
# Expected: package-lock.json only
```

**Acceptance:** Only `package-lock.json` exists

#### Fix 1.2: Align Node Version
**Problem:** Using Node 22, project requires Node 20

```powershell
# Check current version
node --version  # Should show v22.x.x

# Switch to Node 20 (via nvm)
nvm install 20
nvm use 20
node --version  # Should show v20.x.x
```

**Acceptance:** `node --version` outputs v20.x.x

#### Fix 1.3: Install Dependencies
**Problem:** node_modules missing

```powershell
# Clean install (uses package-lock.json)
npm ci --legacy-peer-deps

# Verify vite binary exists
Test-Path node_modules/.bin/vite  # Should return True
```

**Acceptance:** `node_modules/.bin/vite` exists

#### Fix 1.4: Verify Build Works
**Problem:** Cannot build application

```powershell
# Try production build
npm run build

# Expected output: dist/ folder created
# If fails, capture error for Phase 2
```

**Acceptance:** `npm run build` completes, `dist/` folder exists

---

### Phase 2: Security & Compliance (Est: 30 minutes)

#### Fix 2.1: Remove .env from Git History
**Problem:** .env tracked in git since commit 1cb6d8f8

```powershell
# Remove from git index (keep local file)
git rm --cached .env

# Verify it's untracked
git status
# Should show: "deleted: .env" (staged for commit)

# Commit the removal
git commit -m "security: Remove .env from git tracking

.env file should never be committed to version control.
Only .env.example should be tracked for reference.

Evidence: git ls-files showed .env tracked since 1cb6d8f8
Fix: git rm --cached .env"
```

**Acceptance:** `git ls-files | grep .env` returns only `.env.example`

#### Fix 2.2: Update npm Audit Vulnerabilities
**Problem:** 3 moderate CVEs in dependencies

```powershell
# Try automatic fix
npm audit fix

# Check remaining issues
npm audit --audit-level=moderate

# If fixable vulnerabilities remain, document in TODO
```

**Acceptance:** `npm audit --audit-level=high` shows 0 high/critical

#### Fix 2.3: Add CSP Headers (Vercel)
**Problem:** No Content Security Policy configured

Create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://o4506996297949184.ingest.us.sentry.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

**Acceptance:** `vercel.json` exists with security headers

---

### Phase 3: TypeScript Strict Mode (Est: 2-4 days)

#### Fix 3.1: Enable Strict Mode
**Problem:** TypeScript strict mode disabled (CRITICAL violation of CLAUDE.md)

**File:** `tsconfig.app.json`

```diff
--- a/tsconfig.app.json
+++ b/tsconfig.app.json
@@ -15,11 +15,11 @@
     "jsx": "react-jsx",

     /* Linting */
-    "strict": false,
+    "strict": true,
     "noUnusedLocals": false,
     "noUnusedParameters": false,
-    "noImplicitAny": false,
-    "noFallthroughCasesInSwitch": false,
+    "noImplicitAny": true,
+    "noFallthroughCasesInSwitch": true,

     "baseUrl": ".",
     "paths": {
```

**File:** `tsconfig.json`

```diff
--- a/tsconfig.json
+++ b/tsconfig.json
@@ -8,11 +8,11 @@
     },
-    "noImplicitAny": false,
+    "noImplicitAny": true,
     "noUnusedParameters": false,
     "skipLibCheck": true,
     "allowJs": true,
     "noUnusedLocals": false,
-    "strictNullChecks": false
+    "strictNullChecks": true
   }
 }
```

#### Fix 3.2: Fix Type Errors Iteratively

```powershell
# Run type check to see errors
npm run type-check

# Expected: 100+ errors
# Fix in batches of 10-20 files per commit
```

**Strategy:**
1. Start with low-hanging fruit: add explicit return types
2. Fix `any` types with proper interfaces
3. Add null checks for nullable values
4. Use type guards for union types

**Acceptance:** `npm run type-check` passes with 0 errors

---

### Phase 4: CI/CD Hardening (Est: 1 hour)

#### Fix 4.1: Remove --legacy-peer-deps from CI

**File:** `.github/workflows/ci.yml`

```diff
--- a/.github/workflows/ci.yml
+++ b/.github/workflows/ci.yml
@@ -25,7 +25,7 @@
           cache: 'npm'

       - name: Install dependencies
-        run: npm ci --legacy-peer-deps
+        run: npm ci

       - name: Run ESLint
         run: npm run lint
@@ -51,7 +51,7 @@
           cache: 'npm'

       - name: Install dependencies
-        run: npm ci --legacy-peer-deps
+        run: npm ci

       - name: Run tests with coverage
         run: npm test -- --coverage
@@ -89,7 +89,7 @@
           cache: 'npm'

       - name: Install dependencies
-        run: npm ci --legacy-peer-deps
+        run: npm ci

       - name: Build application
         run: npm run build
@@ -122,7 +122,7 @@

       - name: Run npm audit
-        run: npm audit --audit-level=moderate
-        continue-on-error: true
+        run: npm audit --audit-level=high
+        continue-on-error: false
```

**Note:** First resolve peer dependencies before applying this fix, or CI will fail.

#### Fix 4.2: Install Husky Hooks

```powershell
# Trigger prepare script (installs husky)
npm install

# Verify pre-commit hook exists
Test-Path .git/hooks/pre-commit  # Should return True
```

**Acceptance:** `.git/hooks/pre-commit` exists and is executable

---

### Phase 5: Performance Optimization (Est: 4 hours)

#### Fix 5.1: Add Lazy Loading for Routes

**File:** `src/App.tsx`

```diff
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -1,3 +1,4 @@
+import { lazy, Suspense } from "react";
 import { Toaster } from "@/components/ui/toaster";
-import Admin from "./pages/Admin";
 import { Toaster as Sonner } from "@/components/ui/sonner";
@@ -13,20 +14,29 @@
 import { ErrorBoundary } from "@/components/ErrorBoundary";
 import { CookieConsent } from "@/components/legal/CookieConsent";
+import { Loader2 } from "lucide-react";

 // Auth pages
 import Login from "./pages/Login";
 import Register from "./pages/Register";
-import ForgotPassword from "./pages/ForgotPassword";
-import ResetPassword from "./pages/ResetPassword";
+
+// Lazy load heavy pages
+const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
+const ResetPassword = lazy(() => import("./pages/ResetPassword"));
+const Admin = lazy(() => import("./pages/Admin"));
+const Dashboard = lazy(() => import("./pages/Dashboard"));
+const Projects = lazy(() => import("./pages/Projects"));
+const Finance = lazy(() => import("./pages/Finance"));
+const Analytics = lazy(() => import("./pages/Analytics"));
+// ... add more lazy loads
+
+const LoadingFallback = () => (
+  <div className="flex items-center justify-center min-h-screen">
+    <Loader2 className="h-8 w-8 animate-spin text-primary" />
+  </div>
+);

-// Main app pages
-import Dashboard from "./pages/Dashboard";
-// ... rest of imports

 const App = () => (
   <ErrorBoundary>
     <HelmetProvider>
       <QueryClientProvider client={queryClient}>
         <TooltipProvider>
           <BrowserRouter>
             <AuthProvider>
+              <Suspense fallback={<LoadingFallback />}>
               <Toaster />
               <Sonner />
               <OfflineFallback />
@@ -96,6 +106,7 @@
                 <Route path="*" element={<NotFound />} />
               </Routes>
+              </Suspense>
             </AuthProvider>
           </BrowserRouter>
         </TooltipProvider>
```

**Acceptance:** Main bundle size < 500KB, route chunks created

---

## Verification Checklist (Windows PowerShell)

After applying Fix Pack Δ1, verify all fixes:

```powershell
# ✅ Phase 1: Build Works
npm run build
# Expected: ✓ built in XXXms, dist/ folder exists

# ✅ Phase 2: Security
git ls-files | Select-String ".env"
# Expected: Only .env.example

npm audit --audit-level=high
# Expected: 0 high/critical vulnerabilities

Test-Path vercel.json
# Expected: True

# ✅ Phase 3: TypeScript
npm run type-check
# Expected: No errors (after fixing all type issues)

# ✅ Phase 4: CI/CD
Get-Content .github/workflows/ci.yml | Select-String "legacy-peer-deps"
# Expected: No matches

Test-Path .git/hooks/pre-commit
# Expected: True

# ✅ Phase 5: Performance
npm run build
# Check output for chunk sizes
# Expected: All chunks < 600KB
```

---

## Quality Gates - Production Readiness

Before deploying to production, ensure:

| Gate | Requirement | Verification Command | Status |
|------|-------------|---------------------|--------|
| **Build** | Production build succeeds | `npm run build` | ⚠️ BLOCKED |
| **TypeScript** | No type errors with strict mode | `npm run type-check` | ❌ FAIL |
| **Linting** | No ESLint errors | `npm run lint` | 🔶 UNKNOWN |
| **Tests** | All tests pass | `npm test` | 🔶 UNKNOWN |
| **Security** | No high/critical CVEs | `npm audit --audit-level=high` | ⚠️ MODERATE |
| **Dependencies** | Single lockfile, no conflicts | Check lockfiles | ❌ FAIL |
| **Node Version** | Matches .nvmrc | `node --version` | ❌ FAIL |
| **Git Hygiene** | No secrets in repo | `git ls-files \| grep .env` | ❌ FAIL |
| **Performance** | Main bundle < 500KB | Check build output | 🔶 UNKNOWN |
| **CI/CD** | All jobs pass | GitHub Actions | ⚠️ MASKED |

**Legend:**
✅ PASS | ❌ FAIL | ⚠️ WARNING | 🔶 UNKNOWN

---

## Estimated Effort Summary

| Phase | Description | Effort | Priority |
|-------|-------------|--------|----------|
| Phase 1 | Immediate Blockers | 15 min | P0 (CRITICAL) |
| Phase 2 | Security & Compliance | 30 min | P0 (CRITICAL) |
| Phase 3 | TypeScript Strict Mode | 2-4 days | P1 (HIGH) |
| Phase 4 | CI/CD Hardening | 1 hour | P1 (HIGH) |
| Phase 5 | Performance Optimization | 4 hours | P2 (MEDIUM) |

**Total:** ~3-5 days (with 1 developer)

---

## Recommendations for Next Steps

### Immediate (Today)
1. ✅ Execute Phase 1 (15 min) - Get build working
2. ✅ Execute Phase 2 (30 min) - Resolve security issues
3. ✅ Commit fixes to current branch
4. ✅ Push to remote: `git push -u origin claude/code-review-audit-DRuJK`

### Short-term (This Week)
1. 🔶 Start Phase 3 - Enable strict mode, fix incrementally
2. 🔶 Execute Phase 4 - Harden CI/CD
3. 🔶 Add integration/smoke tests (Finding E-01)

### Medium-term (Next Sprint)
1. 🔶 Execute Phase 5 - Performance optimization
2. 🔶 Set up Dependabot/Renovate for automated updates
3. 🔶 Implement CSP in production (test in staging first)
4. 🔶 Add E2E tests for critical user journeys

---

## Conclusion

**Current State:** The project has a solid foundation with good defensive patterns (ErrorBoundary, Sentry error handling, Supabase validation), but critical toolchain and compliance issues prevent it from running or deploying safely.

**Key Blockers:**
- Cannot run without `npm ci` (due to missing node_modules)
- Dual lockfiles create non-deterministic behavior
- TypeScript strict mode disabled violates project standards
- Security issues (tracked .env, CVEs, no CSP)

**Path Forward:** Fix Pack Δ1 provides a clear, evidence-based remediation plan. Phase 1-2 (45 minutes) unblocks development. Phase 3-5 (3-4 days) brings project to production-ready state.

**Risk Assessment:** MEDIUM → LOW (after Fix Pack Δ1)
**Deployment Readiness:** NOT READY → READY (after Phase 1-4)

---

**Report Generated:** 2025-12-12
**Next Audit Recommended:** After Phase 3 completion (TypeScript strict mode fixes)
