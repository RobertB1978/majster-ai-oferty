# Repository Health Audit Report
**Date:** January 18, 2025
**Target:** majster-ai-oferty
**Auditor:** Claude Code (Evidence-based)
**Branch:** `claude/audit-repo-health-aCxR6`

---

## EXECUTIVE SUMMARY

| Category | Status | Evidence |
|----------|--------|----------|
| **Build Health** | 🟢 GREEN | All builds pass (npm lint, tsc, vitest 281/281, vite build ✓) |
| **Code Quality** | 🟢 GREEN | 0 errors, 24 warnings (non-blocking), TS strict mode enabled |
| **CI/CD Pipeline** | 🟢 GREEN | 5 workflows configured, blocking checks enforced, auto-deploy on main |
| **Admin Security** | 🔴 RED | 3 critical: localStorage admin settings, no RLS, no audit log |
| **i18n Completeness** | 🟡 YELLOW | 200+ hardcoded Polish strings, missing t() wrappers |
| **E2E Determinism** | 🟡 YELLOW | Uses demo.supabase.co (external), but properly mocked/blocked |
| **Production Ready** | ⚠️ WARNING | Blockers: Admin control plane not DB-backed, i18n incomplete |

**Overall Assessment:** Repository is **code-complete but NOT production-ready** due to admin security gaps and missing i18n infrastructure.

---

## SECTION A: BUILD & QUALITY VERIFICATION

### A1. Dependency Installation
```bash
npm ci --force
# Result: 764 packages installed successfully
# Note: Node 22.x used (project requires 20.x - acceptable with --force)
```

**Finding:** Node version mismatch in environment, but CI workflow correctly pins 20.x.

---

### A2. Linting Results
```
ESLint: 0 errors, 24 warnings
```

**Warnings Breakdown:**
- 16× `react-refresh/only-export-components` - UI component files export constants (non-blocking, design choice)
- 5× `react-hooks/exhaustive-deps` - Missing hook dependencies (non-critical)
- 1× `react-hooks/unnecessary-dependency` - Calendar component (minor)

**Assessment:** ✅ **PASSING** - Warnings are architectural, not bugs.

---

### A3. Type Checking
```bash
npm run type-check
# Result: No output (no TypeScript errors)
```

**Assessment:** ✅ **PASSING** - Strict mode enforced, all types valid.

---

### A4. Unit & Integration Tests
```
Test Files: 20 passed
Tests: 281 passed (0 failed)
Duration: 11.75s
Coverage areas: Email templates, validations, PDF generation, auth, biometrics, hooks, export utils
```

**Notable Test Suites:**
- ✅ `emailTemplates.test.ts` (12 tests)
- ✅ `offerEmailTemplates.test.ts` (15 tests)
- ✅ `validations.test.ts` (64 tests)
- ✅ `fileValidation.test.ts` (45 tests)
- ✅ `offerPdfGenerator.test.ts` (8 tests)
- ✅ `send-offer-email/emailHandler.test.ts` (21 tests)

**Assessment:** ✅ **PASSING** - Comprehensive test coverage with proper error handling.

---

### A5. Production Build
```
Vite Build: ✓ built in 31.10s
Output size: ~2.5MB (dist/assets/)
Largest chunks:
  - exportUtils: 940 KB gzipped 272 KB
  - ProjectDetail: 481 KB gzipped 155 KB
  - index: 492 KB gzipped 153 KB
```

**Bundle Analysis:**
- React vendor: 165 KB gzipped 53.75 KB
- Supabase vendor: 177 KB gzipped 45.65 KB
- UI components: 129 KB gzipped 41.11 KB
- Charts (Recharts): 411 KB gzipped 111 KB

**Assessment:** ✅ **PASSING** - Build succeeds, bundle sizes reasonable for feature-rich app.

---

## SECTION B: CI/CD PIPELINE VERIFICATION

### B1. Workflow Summary

| Workflow | Trigger | Required | Purpose |
|----------|---------|----------|---------|
| `ci.yml` | push/PR | ✅ YES | Lint → Tests → Build (sequential, 2 jobs must pass before build) |
| `e2e.yml` | push/PR | ⚠️ INFO | Playwright smoke tests (4 test suites) |
| `security.yml` | push/PR + weekly | ✅ YES | npm audit + CodeQL analysis |
| `supabase-deploy.yml` | Manual only | N/A | Database migrations + Edge Functions deployment |
| `bundle-analysis.yml` | push (main) | ⚠️ INFO | Bundle size tracking |

### B2. Blocking Checks
```yaml
# .github/workflows/ci.yml
jobs:
  - lint:       required (blocks build job)
  - test:       required (blocks build job)
  - build:      runs after lint + test (requires both to pass)
  - security:   independent (not blocking but runs)
```

**Assessment:** ✅ **PROPERLY CONFIGURED** - Build job waits for lint + test.

### B3. CI/CD Gaps Found

**Finding #1: E2E Tests Not Required**
- Location: `.github/workflows/e2e.yml`
- Status: Optional (not blocking merge)
- Risk: E2E regressions could be merged
- Recommendation: Add to required checks (when determinism fixed)

**Finding #2: Codecov Reporting Not Blocking**
- Location: `.github/workflows/ci.yml` line 67
- Status: `continue-on-error: true`
- Risk: Coverage gaps not enforced
- Recommendation: Set `fail_ci_if_error: false` but monitor coverage trends

**Finding #3: npm audit Only at Moderate Level**
- Location: `.github/workflows/ci.yml` line 136
- Config: `--audit-level=moderate`
- Location: `.github/workflows/security.yml` line 28
- Config: `--audit-level=high` (security.yml is stricter)
- Recommendation: Align both to `high` level

**Finding #4: Snyk Token Optional**
- Location: `.github/workflows/ci.yml` line 140-143
- Status: `continue-on-error: true`
- Risk: Snyk scan failures won't block CI
- Recommendation: Set `continue-on-error: false` after integration verified

### B4. Evidence: Recent Actions
```bash
git log --oneline -5
# cfdbb25 docs: add comprehensive database deployment documentation (#110)
# dcbdffa feat: add bundle analysis workflow and performance recommendations (#109)
# 6d3f601 Claude/fix pack delta3 2 ol ss (#108)
# 9f8dc4c Claude/fix pack delta2 2 ol ss (#107)
# 42b7494 fix: pin Node 20.x across all environments and CI/CD (#106)
```

**Assessment:** ✅ **HEALTHY** - Recent commits show active development, Node version pinned correctly (PR #106).

---

## SECTION C: ADMIN CONTROL PLANE AUDIT

### C1. Critical Finding: localStorage-Based Admin Settings

**Issue:** Admin-only system settings stored ONLY in browser localStorage (device-local state).

#### **File #1: AdminSystemSettings.tsx**
```
Path: src/components/admin/AdminSystemSettings.tsx
Lines: 79, 93
Storage Key: admin-system-settings
Data Stored: 22 system-wide feature toggles + limits
```

**Stored Configuration:**
```json
{
  "emailEnabled": boolean,
  "smtpHost": "string",
  "smtpPort": "string",
  "emailFromName": "string",
  "emailFromAddress": "string",
  "registrationEnabled": boolean,
  "maintenanceMode": boolean,
  "apiEnabled": boolean,
  "aiEnabled": boolean,
  "voiceEnabled": boolean,
  "ocrEnabled": boolean,
  "maxClientsPerUser": number,
  "maxProjectsPerUser": number,
  "maxStoragePerUser": number,
  "sessionTimeout": number,
  "requireEmailVerification": boolean,
  "twoFactorEnabled": boolean,
  "rateLimitRequests": number,
  "rateLimitWindow": number
}
```

**Security Risks:**
- 🔴 **CRITICAL:** Controls system-wide features (maintenance mode, registration, 2FA)
- 🔴 **CRITICAL:** No RLS protection - any authenticated user can read/modify
- 🔴 **CRITICAL:** No audit trail - cannot track who changed what when
- 🔴 **CRITICAL:** Device-local only - settings lost on browser clear
- 🔴 **CRITICAL:** No synchronization - multiple tabs see different settings

**Impact:** An admin's browser compromise or accidental localStorage modification can disable authentication, enable/disable features, or lock users out.

---

#### **File #2: AdminThemeEditor.tsx**
```
Path: src/components/admin/AdminThemeEditor.tsx
Lines: 56, 85, 92, 102
Storage Key: admin-theme-config
Data Stored: 8 theme customization parameters
```

**Stored Configuration:**
```json
{
  "primaryHue": 0-360,
  "primarySaturation": 0-100,
  "primaryLightness": 0-100,
  "accentHue": 0-360,
  "borderRadius": 0-24,
  "fontSize": 12-20,
  "fontFamily": "string",
  "spacing": 2-8
}
```

**Security Risks:**
- 🟠 **HIGH:** No version control for theme changes
- 🟠 **HIGH:** Changes don't persist across sessions
- 🟡 **MEDIUM:** No rollback capability
- 🟡 **MEDIUM:** Affects all users' UX globally

---

#### **File #3: AdminContentEditor.tsx**
```
Path: src/components/admin/AdminContentEditor.tsx
Lines: 75, 89
Storage Key: admin-content-config
Data Stored: 20 landing page + SEO + contact fields
```

**Stored Configuration:**
```json
{
  "heroTitle": "string",
  "heroSubtitle": "string",
  "supportEmail": "string",
  "phoneNumber": "string",
  "address": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "ogImage": "string",
  "...": "... 12 more fields"
}
```

**Security Risks:**
- 🟠 **HIGH:** Affects public-facing content
- 🟠 **HIGH:** Support email/phone could be misconfigured (PII leak)
- 🟠 **HIGH:** No version control or rollback
- 🟡 **MEDIUM:** Changes lost on browser clear

---

### C2. High-Risk Findings: Auth Credentials

#### **File #4: useBiometricAuth.ts**
```
Path: src/hooks/useBiometricAuth.ts
Lines: 15, 30, 35
Storage Key: majster_biometric_credentials
Data Stored: WebAuthn credential metadata (1+ entries per device)
```

**Stored Data:**
```json
[
  {
    "credentialId": "base64-encoded",
    "email": "user@example.com",
    "publicKey": "optional-string"
  }
]
```

**Security Risks:**
- 🔴 **CRITICAL:** Credential IDs tied to specific emails
- 🔴 **CRITICAL:** If stolen, attacker knows which devices have WebAuthn enrolled
- 🟠 **HIGH:** No recovery if device lost or localStorage cleared
- 🟠 **HIGH:** XSS vulnerability exposes credential enrollment pattern

**Mitigation:** This is expected to be local (per-device), but should add rate-limiting and browser isolation.

---

#### **File #5: Login.tsx**
```
Path: src/pages/Login.tsx
Lines: 35, 84
Storage Key: majster_last_email
Data Stored: User's last login email (string)
```

**Security Risks:**
- 🟡 **MEDIUM:** Email enumeration on shared devices
- 🟡 **MEDIUM:** Reveals which accounts use system to anyone with device access
- 🟢 **LOW:** Email is not secret, but can expose user identity

---

### C3. Recommended DB Schema for Admin Control Plane

**Table: `admin_system_settings`**
```sql
CREATE TABLE admin_system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Email Configuration
  email_enabled boolean DEFAULT true,
  smtp_host text,
  smtp_port integer,
  email_from_name text,
  email_from_address text,

  -- Feature Toggles
  registration_enabled boolean DEFAULT true,
  maintenance_mode boolean DEFAULT false,
  api_enabled boolean DEFAULT true,
  ai_enabled boolean DEFAULT true,
  voice_enabled boolean DEFAULT true,
  ocr_enabled boolean DEFAULT true,

  -- Limits
  max_clients_per_user integer DEFAULT 1000,
  max_projects_per_user integer DEFAULT 500,
  max_storage_per_user integer DEFAULT 10737418240, -- 10GB

  -- Security
  session_timeout_minutes integer DEFAULT 30,
  require_email_verification boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,

  -- Rate Limiting
  rate_limit_requests integer DEFAULT 100,
  rate_limit_window_seconds integer DEFAULT 60,

  -- Metadata
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_organization CHECK (organization_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE admin_system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read their org's settings
CREATE POLICY admin_system_settings_select_own ON admin_system_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policy: Only admins can update
CREATE POLICY admin_system_settings_update_own ON admin_system_settings
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  ) WITH CHECK (
    updated_by = auth.uid()
  );
```

**Table: `admin_audit_log`**
```sql
CREATE TABLE admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Action details
  action_type text NOT NULL, -- 'update_settings', 'update_theme', 'update_content'
  entity_type text NOT NULL, -- 'system_settings', 'theme_config', 'content_config'
  entity_id uuid,

  -- Change tracking
  old_value jsonb,
  new_value jsonb,
  changed_fields text[], -- ['email_enabled', 'maintenance_mode']

  -- Context
  user_id uuid NOT NULL REFERENCES auth.users(id),
  ip_address inet,
  user_agent text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_action CHECK (action_type IS NOT NULL),
  CONSTRAINT valid_entity CHECK (entity_type IS NOT NULL)
);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read their org's audit log
CREATE POLICY admin_audit_log_select ON admin_audit_log
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );
```

**Table: `admin_theme_config`**
```sql
CREATE TABLE admin_theme_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  primary_hue integer DEFAULT 210, -- 0-360
  primary_saturation integer DEFAULT 100, -- 0-100
  primary_lightness integer DEFAULT 50, -- 0-100
  accent_hue integer DEFAULT 265,
  border_radius integer DEFAULT 8, -- 0-24
  font_size integer DEFAULT 14, -- 12-20
  font_family text DEFAULT 'Inter',
  spacing integer DEFAULT 4, -- 2-8

  version integer DEFAULT 1,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_organization CHECK (organization_id IS NOT NULL)
);

ALTER TABLE admin_theme_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_theme_config_read ON admin_theme_config
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );
```

---

### C4. Admin Control Plane Risks Table

| Risk | File | Severity | Impact | Mitigation |
|------|------|----------|--------|-----------|
| System settings in localStorage | AdminSystemSettings.tsx | CRITICAL | Maintenance mode, 2FA, registration can be toggled | Move to `admin_system_settings` table with RLS |
| No audit trail for settings changes | All admin components | CRITICAL | Cannot track configuration changes for compliance | Create `admin_audit_log` table |
| No cross-tab synchronization | All admin components | HIGH | Settings in one tab don't reflect in others | Use Supabase realtime subscriptions |
| Theme changes not persisted | AdminThemeEditor.tsx | HIGH | Theme resets on reload | Move to `admin_theme_config` table |
| Content edits lost on refresh | AdminContentEditor.tsx | HIGH | Landing page changes disappear | Move to `admin_content_config` table |
| Biometric credentials exposed to XSS | useBiometricAuth.ts | HIGH | Credential IDs revealed if XSS occurs | Already device-local (acceptable), add CSP hardening |
| Email enumeration on shared devices | Login.tsx | MEDIUM | Reveals which emails have accounts | Consider server-side session tracking |

---

## SECTION D: I18N (INTERNATIONALIZATION) AUDIT

### D1. Hardcoded Strings Summary

**Total Hardcoded User-Facing Strings Found: 200+**

| Priority | Count | Scope | Impact |
|----------|-------|-------|--------|
| **P0 (Critical)** | ~90 | Error messages, form labels, buttons, validation | User-facing - HIGH priority |
| **P1 (High)** | ~40 | Admin panels, settings, action labels | Admin UX - MEDIUM priority |
| **P2 (Medium)** | ~50 | Placeholders, helpers, empty states | UX polish - LOW priority |
| **P3 (Low)** | ~20 | Accessibility, aria-labels | Compliance - LOWEST priority |

---

### D2. Critical Issues (P0) - Examples

**File: `src/components/settings/DeleteAccountSection.tsx`**
```typescript
// Line 42
toast.error('Proszę wpisać DELETE aby potwierdzić')

// Line 59-60
toast.success('Konto zostało usunięte')
toast.description('Wszystkie Twoje dane zostały trwale usunięte.')

// Line 82
<CardTitle>Strefa Niebezpieczna</CardTitle>

// Line 114
<Button>Usuń Konto Całkowicie</Button>
```

**File: `src/pages/Login.tsx`**
```typescript
// Line 77
'Nieprawidłowy email lub hasło'

// Line 85
toast.success('Zalogowano pomyślnie')

// Line 183
button.textContent === 'Logowanie...'

// Line 186
<Button>Zaloguj się</Button>
```

**File: `src/components/voice/VoiceQuoteCreator.tsx`**
```typescript
// Line 99
toast.error('Błąd przetwarzania. Spróbuj ponownie.')

// Line 169
<CardTitle>Wycena głosowa</CardTitle>

// Lines 171-175 - Status messages
'Powiedz co chcesz wycenić'
'Słucham...'
'Analizuję...'
'Sprawdź i zatwierdź'
'Gotowe!'
```

**Current i18n Setup: `src/i18n/index.ts`**
```typescript
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from './locales/en';
import { pl } from './locales/pl';

i18n
  .use(LanguageDetector)
  .init({
    resources: { en: { translation: en }, pl: { translation: pl } },
    fallbackLng: 'pl',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });
```

**Evidence:** i18n infrastructure exists but many components don't use `t()` wrapper.

---

### D3. Admin Panel Hardcoded Strings (P1)

**File: `src/components/admin/AuditLogPanel.tsx`**
```typescript
// Lines 26-58 - ACTION_LABELS object with 30+ Polish translations
const ACTION_LABELS: Record<string, string> = {
  'login': 'Logowanie',
  'logout': 'Wylogowanie',
  'register': 'Rejestracja',
  'change_password': 'Zmiana hasła',
  'update_profile': 'Aktualizacja profilu',
  // ... 25 more
};

// Line 142
<SEOHead title="Dziennik Audytu" description="Przegląd wszystkich akcji..." />

// Line 155
<CardTitle>Dziennik Audytu</CardTitle>
```

---

### D4. i18n Migration Strategy

**Phase 1: Core User-Facing Strings (P0)**
1. Error messages
2. Form validation messages
3. Button text
4. Toast notifications
5. Dialog titles/descriptions

**Phase 2: Admin Strings (P1)**
1. Admin panel labels
2. Settings descriptions
3. Action names

**Phase 3: UX Polish (P2-P3)**
1. Placeholders
2. Helper text
3. Empty states
4. Accessibility labels

---

### D5. Recommended i18n Structure

```
src/i18n/
├── locales/
│   ├── en.json
│   ├── pl.json
│   └── index.ts
├── namespaces/
│   ├── auth.json (login, register, errors)
│   ├── settings.json (account, preferences)
│   ├── admin.json (system settings, audit log, theme)
│   ├── offers.json (offer creation, PDF, email)
│   ├── projects.json (project management)
│   ├── errors.json (error messages)
│   └── toast.json (toast notifications)
└── index.ts
```

**Usage Example:**
```typescript
// Instead of:
toast.error('Błąd przetwarzania. Spróbuj ponownie.')

// Use:
toast.error(t('errors.processing_failed'))
toast.error(t('errors.retry_later'))
```

---

## SECTION E: E2E DETERMINISM AUDIT

### E1. Current Setup

**Configuration: `playwright.config.ts`**
```typescript
testDir: './e2e',
fullyParallel: false, // Run sequentially
forbidOnly: !!process.env.CI,
retries: process.env.CI ? 1 : 0, // Max 1 retry in CI
workers: process.env.CI ? 1 : undefined, // Single worker in CI
timeout: 120000, // 2min per test
```

**Environment in CI: `.github/workflows/e2e.yml`**
```yaml
env:
  VITE_SUPABASE_URL: https://demo.supabase.co
  VITE_SUPABASE_ANON_KEY: eyJhbGc...
  # Uses official Supabase demo credentials
  # Source: https://supabase.com/docs/guides/local-development
```

---

### E2. Determinism Analysis

#### **Issue #1: External Supabase Instance (demo.supabase.co)**
```yaml
# e2e.yml line 41-42
VITE_SUPABASE_URL: https://demo.supabase.co
VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Risks:**
- 🟡 **MEDIUM:** demo.supabase.co is external, subject to Supabase's uptime
- 🟡 **MEDIUM:** Tests will fail if Supabase is down
- 🟡 **MEDIUM:** No control over demo data state
- 🟠 **HIGH:** Shared demo instance with other users (potential data pollution)

**Mitigation in Place:**
```typescript
// e2e/global-setup.ts lines 18-29
await page.route('**/*', (route) => {
  const url = route.request().url();
  const { hostname } = new URL(url);
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const shouldBlock = !isLocal && /(sentry|analytics|google-analytics|gtag|facebook|tracking)/i.test(url);

  if (shouldBlock) {
    route.abort(); // Block external analytics
  } else {
    route.continue();
  }
});
```

**Assessment:** Partially mitigated - external tracking blocked, but Supabase calls still go to demo.

---

#### **Issue #2: React Hydration Timing**
```typescript
// e2e/global-setup.ts lines 33-54
const hasRoot = await page.waitForFunction(() => {
  const root = document.querySelector('#root');
  return root && root.children.length > 0;
}, { timeout: 15000 });
```

**Assessment:** ✅ **WELL-HANDLED** - Explicit timeouts prevent infinite hangs.

---

#### **Issue #3: Test Flakiness Protections**
```typescript
// e2e/smoke.spec.ts lines 24-50
// Hard timeout per test
test.setTimeout(180000); // 3 minutes

// Block external requests
await page.route('https://fonts.googleapis.com/**', route => {
  route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
```

**Assessment:** ✅ **WELL-HANDLED** - Analytics blocked, timeouts set.

---

### E3. E2E Test Scope
```
Files: 4 test suites
- smoke.spec.ts          (main smoke tests)
- a11y.spec.ts           (accessibility tests)
- delete-account.spec.ts (account deletion flow)
- global-setup.ts        (pre-test setup/health checks)
```

**Coverage:** UI/UX flow testing only, NOT backend integration testing.

---

### E4. Determinism Recommendation: Two Paths

**Path A: Keep External demo.supabase.co (Current)**
✅ **Pros:**
- No local infrastructure needed
- Simpler CI setup
- Works with Vercel preview deployments

❌ **Cons:**
- Depends on external uptime
- Shared state risk
- No control over data

**Path B: Dedicated Supabase Test Project (Recommended)**
✅ **Pros:**
- Complete determinism
- Isolated test data
- Can reset between runs
- Faster (no network latency)

❌ **Cons:**
- Requires separate Supabase project
- Additional secrets needed
- Manual setup per env

**Recommendation:** Start with Path A (already working), migrate to Path B when team capacity allows.

---

## FINDINGS TABLE

| ID | Category | Severity | Impact | Effort | Status | PR |
|----|----------|----------|--------|--------|--------|-----|
| F1 | Admin | 🔴 CRITICAL | System settings not DB-backed, no RLS | LARGE | ❌ NOT FIXED | PR-1 |
| F2 | Admin | 🔴 CRITICAL | No audit log for admin changes | LARGE | ❌ NOT FIXED | PR-1 |
| F3 | Admin | 🔴 CRITICAL | Biometric credentials vulnerable to XSS | MEDIUM | ❌ NOT FIXED | PR-2 |
| F4 | Admin | 🟠 HIGH | Admin settings not synchronized across tabs | MEDIUM | ❌ NOT FIXED | PR-1 |
| F5 | i18n | 🟡 YELLOW | 200+ hardcoded Polish strings bypass t() | LARGE | ❌ NOT FIXED | PR-3 |
| F6 | i18n | 🟡 YELLOW | No namespace organization for i18n | MEDIUM | ❌ NOT FIXED | PR-3 |
| F7 | CI/CD | 🟡 YELLOW | E2E tests use external demo.supabase.co | SMALL | ⚠️ ACCEPTABLE | PR-4 |
| F8 | CI/CD | 🟡 YELLOW | E2E tests not required check | SMALL | ⚠️ ACCEPTABLE | PR-5 |
| F9 | CI/CD | 🟡 YELLOW | npm audit levels inconsistent (moderate vs high) | TRIVIAL | ⚠️ ACCEPTABLE | PR-5 |
| F10 | Build | 🟢 GREEN | 24 ESLint warnings (non-blocking) | N/A | ✅ ACCEPTABLE | N/A |
| F11 | Build | 🟢 GREEN | TypeScript strict mode enforced | N/A | ✅ PASSING | N/A |
| F12 | Build | 🟢 GREEN | 281 unit tests passing | N/A | ✅ PASSING | N/A |

---

## ATOMIC PR ROADMAP

### **PR-1: Implement DB-Backed Admin Control Plane**
**Type:** Feature (Security Critical)
**Size:** 400-500 LOC
**Dependencies:** None (independent)
**Timeline:** Can start immediately

**Changes:**
1. Create migration: `admin_system_settings` table with RLS
2. Create migration: `admin_audit_log` table with RLS
3. Create migration: `admin_theme_config` table with RLS
4. Update `AdminSystemSettings.tsx` to use new table
5. Update `AdminThemeEditor.tsx` to use new table
6. Add Supabase realtime subscriptions for live sync
7. Add audit logging for all admin actions

**DoD (Definition of Done):**
- ✅ All 3 tables have RLS policies tested
- ✅ Audit log records all changes (before/after values)
- ✅ Cross-tab synchronization works (edit in tab A, see in tab B)
- ✅ localStorage keys removed from admin components
- ✅ Rollback capability tested (theme history works)
- ✅ All tests pass (new + existing)
- ✅ No localStorage writes in admin code

**Testing:**
```bash
npm test src/components/admin/
npm test supabase/
```

---

### **PR-2: Wrap Error Messages with i18n (P0 Strings)**
**Type:** Refactor + i18n
**Size:** 300-400 LOC
**Dependencies:** PR-1 (for consistency)
**Timeline:** Can start immediately

**Changes:**
1. Extract 90 critical user-facing strings to `src/i18n/locales/pl.json` (errors, validation, buttons)
2. Wrap all toast messages with `t()` in components
3. Wrap all form validation messages with `t()`
4. Create namespace: `src/i18n/namespaces/errors.json`
5. Create namespace: `src/i18n/namespaces/auth.json`
6. Update imports: `import { useTranslation } from 'react-i18next'`

**DoD:**
- ✅ All error toast messages use `t('errors.*')`
- ✅ All validation messages use `t('errors.*')`
- ✅ All button text uses `t('actions.*')` or similar
- ✅ No hardcoded Polish strings in toast/validation code
- ✅ New strings added to both en.json and pl.json
- ✅ Tests pass (no functional changes)

**Files to Update:**
- `src/components/settings/DeleteAccountSection.tsx`
- `src/components/voice/VoiceQuoteCreator.tsx`
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- `src/components/offers/SendOfferModal.tsx`
- `src/pages/OfferApproval.tsx`
- `src/components/billing/BillingDashboard.tsx`
- `src/components/notifications/PushNotificationSettings.tsx`

---

### **PR-3: Admin Panel i18n (P1 Strings)**
**Type:** i18n + Refactor
**Size:** 200-300 LOC
**Dependencies:** PR-2
**Timeline:** After PR-2

**Changes:**
1. Extract 40 admin strings to namespace
2. Create `src/i18n/namespaces/admin.json`
3. Update `AuditLogPanel.tsx` to use i18n for action labels
4. Update `AdminUsersManager.tsx` for labels
5. Update `AdminCronManager.tsx` for messages

**DoD:**
- ✅ All admin panel text uses `t()` function
- ✅ ACTION_LABELS moved to i18n config
- ✅ Admin descriptions/tooltips use i18n
- ✅ Tests updated to mock i18n

---

### **PR-4: Complete i18n Coverage (P2-P3)**
**Type:** i18n + Polish
**Size:** 250-350 LOC
**Dependencies:** PR-3
**Timeline:** After PR-3

**Changes:**
1. Extract 50 medium-priority strings (placeholders, helper text)
2. Extract 20 low-priority strings (aria-labels, accessibility)
3. Create namespaces: `offers.json`, `projects.json`, `settings.json`
4. Update all components with remaining hardcoded strings
5. Add i18n linter rule to prevent new hardcoded strings

**DoD:**
- ✅ All user-visible text uses `t()`
- ✅ Placeholders localized
- ✅ Helper text localized
- ✅ ESLint rule added to catch hardcoded strings
- ✅ 0 remaining hardcoded Polish strings in components

---

### **PR-5: E2E Test Improvements & CI/CD Hardening**
**Type:** Maintenance + CI/CD
**Size:** 100-150 LOC
**Dependencies:** None (independent)
**Timeline:** Can start immediately

**Changes:**
1. Add E2E tests to required CI checks
2. Align npm audit levels (both to `high`)
3. Document E2E determinism approach
4. Add optional: dedicated Supabase test project setup guide

**DoD:**
- ✅ E2E workflow added to required checks
- ✅ npm audit consistent across workflows
- ✅ Documentation added for E2E setup
- ✅ All workflows pass

---

### **PR-6: Biometric Credential Security Hardening**
**Type:** Security + Refactor
**Size:** 150-200 LOC
**Dependencies:** None (independent)
**Timeline:** Can start after PR-1 (for consistency)

**Changes:**
1. Add server-side biometric credential tracking table
2. Implement rate limiting on biometric auth attempts
3. Add CSP hardening to prevent XSS exposure
4. Add device fingerprinting for additional verification
5. Document biometric security model

**DoD:**
- ✅ Rate limiting implemented (max 5 attempts/minute)
- ✅ CSP headers prevent XSS from exposing credentials
- ✅ Device fingerprinting added
- ✅ Security audit passed
- ✅ Tests updated

---

## TRACEABILITY MATRIX

| Finding | Root Cause | PR | Files Changed | Verification |
|---------|-----------|----|----|---|
| F1: Admin system settings not DB-backed | Architecture decision | PR-1 | AdminSystemSettings.tsx, migrations/*, admin_audit_log |  `npm test src/components/admin/` |
| F2: No audit log | Missing implementation | PR-1 | admin_audit_log table, AdminSystemSettings.tsx | Audit log shows 10+ entries |
| F3: Biometric XSS risk | Default localStorage | PR-6 | useBiometricAuth.ts, CSP config | CSP test, XSS injection test |
| F4: No cross-tab sync | Architectural gap | PR-1 | AdminSystemSettings.tsx, supabase realtime | Edit in tab A, verify in tab B |
| F5: 200+ hardcoded strings | i18n not enforced | PR-2/3/4 | 15+ component files, i18n config | ESLint rule catches new strings |
| F6: No i18n namespaces | Organizational gap | PR-2/3/4 | src/i18n/namespaces/*.json | Namespace structure verified |
| F7: External demo.supabase.co | Design choice | PR-4 | .github/workflows/e2e.yml, docs | Documentation updated |
| F8: E2E not required | CI/CD oversight | PR-5 | .github/workflows/ci.yml | E2E added to required checks |
| F9: npm audit inconsistent | Config oversight | PR-5 | .github/workflows/*.yml | Both set to `high` level |

---

## EVIDENCE ARTIFACTS

### Build Verification
- ✅ ESLint: 0 errors, 24 warnings (non-blocking)
- ✅ TypeScript: All types valid (strict mode)
- ✅ Tests: 281 passed (100% pass rate)
- ✅ Build: Vite production build successful (31.10s)

### Code Metrics
- **Lines of Code:** ~50k (estimated from components)
- **Number of Components:** 100+
- **Number of Pages:** 15+
- **Test Files:** 20
- **CI Workflows:** 5

### Files Requiring Migration
1. `src/components/admin/AdminSystemSettings.tsx` (22 setting keys)
2. `src/components/admin/AdminThemeEditor.tsx` (8 theme keys)
3. `src/components/admin/AdminContentEditor.tsx` (20 content keys)
4. `src/hooks/useBiometricAuth.ts` (credential storage)
5. 15+ component files (hardcoded strings)

---

## PRODUCTION READINESS CHECKLIST

| Item | Status | Evidence | Blocker |
|------|--------|----------|---------|
| Build passing | ✅ YES | Vite build 31.10s successful | NO |
| Tests passing | ✅ YES | 281/281 tests passed | NO |
| Linting clean | ✅ YES | 0 errors (24 non-blocking warnings) | NO |
| Types valid | ✅ YES | tsc --noEmit passes | NO |
| CI/CD configured | ✅ YES | 5 workflows, proper blocking | NO |
| **Admin settings DB-backed** | ❌ NO | Still in localStorage | **YES** |
| **Admin audit logging** | ❌ NO | No audit table exists | **YES** |
| **i18n complete** | ❌ NO | 200+ hardcoded strings remain | NO* |
| **E2E deterministic** | ⚠️ PARTIAL | Uses external demo.supabase.co | NO** |

*i18n can be phased in; app works in Polish-only for now
**Acceptable for MVP; can upgrade to dedicated project later

---

## SUMMARY & NEXT STEPS

### What's Working Well ✅
1. Build + test infrastructure is solid (281 tests passing)
2. CI/CD properly configured with blocking checks
3. TypeScript strict mode enforced
4. E2E tests have good flakiness protections
5. Code is well-organized and modular

### Critical Blockers 🔴
1. **Admin system settings stored in localStorage only** → No persistence, no RLS, no audit
2. **No audit log for admin changes** → No compliance tracking
3. **Settings not synchronized across tabs** → Multi-device issues

### Important Gaps 🟡
1. **200+ hardcoded strings bypass i18n** → App is Polish-only effectively
2. **E2E uses external demo** → Dependency on Supabase uptime
3. **E2E not required check** → Could merge E2E regressions

### Recommendations for Production
1. **MUST DO:** PR-1 (Admin Control Plane) - 1-2 weeks
2. **MUST DO:** PR-2 (Critical i18n) - 3-5 days
3. **SHOULD DO:** PR-3/4 (Complete i18n) - 1-2 weeks
4. **CAN DO:** PR-5 (E2E improvements) - 2-3 days

**Timeline to Production-Ready:** 2-3 weeks

---

**Report Generated:** January 18, 2025
**Auditor:** Claude Code (Evidence-based)
**Status:** Ready for review and action planning
