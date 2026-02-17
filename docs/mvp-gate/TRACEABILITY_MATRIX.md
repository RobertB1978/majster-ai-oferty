# MVP Gate Traceability Matrix

**Purpose**: Single source of truth mapping Evidence → Tracker Row → Test Implementation

**Date**: 2026-02-17
**Evidence Source**: docs/evidence/2026-02-17/INDEX.md
**Fix Results**: docs/MVP_FIX_PACK_2026-02-17_RESULTS.md

---

## Traceability Table

| Evidence ID | Tracker ID | Priority | Issue Description | Test File | Test Name | Required Env Vars | Fix Commit | Status |
|-------------|------------|----------|-------------------|-----------|-----------|-------------------|------------|--------|
| E-001-P0-001 | MVP-QE-001 | P0 | Quote editor crash (projectId undefined) | e2e/mvp-gate.spec.ts | quote editor loads without crash | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY | d602a76 | ✅ FIXED |
| E-001-P1-001 | MVP-AUTH-001 | P1 | Logout race condition (session/cache not cleared) | e2e/mvp-gate.spec.ts | logout flow works end-to-end | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY | d602a76 | ✅ FIXED |
| E-001-P1-002 | MVP-SEO-001 | P1 | Sitemap base URL missing documentation | e2e/mvp-gate.spec.ts | sitemap has correct base URL | VITE_PUBLIC_SITE_URL | d602a76 (docs only) | ⏳ BLOCKED (owner action) |
| E-001-P2-001 | MVP-CAL-001 | P2 | Calendar delete handler missing error handling | e2e/mvp-gate.spec.ts | calendar add/delete events work | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY | d602a76 | ✅ FIXED |
| E-001-P2-002 | MVP-TS-001 | P2 | TypeScript strict mode error (unsafe error.message) | CI type-check | npm run type-check | None (build-time) | d602a76 | ✅ FIXED |
| E-001-NI-001 | MVP-COOKIE-001 | P2 | Cookie consent banner (verified exists) | e2e/mvp-gate.spec.ts | cookie consent banner appears on landing | None | N/A | ✅ VERIFIED |
| E-001-NI-002 | MVP-CAL-002 | P2 | Calendar add event (verified works) | e2e/mvp-gate.spec.ts | calendar add/delete events work | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY | N/A | ✅ VERIFIED |
| E-001-NI-003 | MVP-AI-001 | P2 | AI assistant (verified graceful errors) | Manual verification | N/A (requires OpenAI API key) | OPENAI_API_KEY | N/A | ✅ VERIFIED |
| N/A | MVP-I18N-001 | P2 | i18n language switching consistency | e2e/mvp-gate.spec.ts | language switching works | None | N/A | ✅ BASELINE |
| N/A | MVP-SMOKE-001 | Baseline | Landing page for unauthenticated users | e2e/smoke.spec.ts | unauthenticated user sees landing page | None | N/A | ✅ BASELINE |
| N/A | MVP-SMOKE-002 | Baseline | Login page renders with accessible form | e2e/smoke.spec.ts | login page renders with accessible form | None | N/A | ✅ BASELINE |
| N/A | MVP-SMOKE-003 | Baseline | Protected routes redirect to login | e2e/smoke.spec.ts | protected route redirects to login | None | N/A | ✅ BASELINE |
| N/A | MVP-SMOKE-004 | Baseline | Static assets serve correctly | e2e/smoke.spec.ts | app serves static assets correctly | None | N/A | ✅ BASELINE |

---

## Evidence Details

### P0 - Production Blockers (MUST PASS)

#### E-001-P0-001: Quote Editor Crash
- **Evidence**: Page crashed immediately on load with `ReferenceError: projectId is not defined`
- **Root Cause**: `src/hooks/useQuoteVersions.ts` - Parameter named `_projectId` but code referenced `projectId`
- **Fix**: Changed parameter from `_projectId` to `projectId`
- **Test Path**: `/app/jobs/:id/quote` (requires valid job ID or mock)
- **Test Strategy**: Navigate to quote editor route, verify no error boundary, verify editor UI renders
- **Success Criteria**: Page loads without JavaScript error, quote editor UI is visible

---

### P1 - Security/UX Critical (HIGH PRIORITY)

#### E-001-P1-001: Logout Race Condition
- **Evidence**: Logout button navigated to `/login` before session cleared
- **Root Cause**: `src/components/layout/TopBar.tsx` - `logout()` not awaited, navigation fired immediately
- **Fix**: Added async/await + `queryClient.clear()` + error handling
- **Test Path**: Login flow → Dashboard → Logout → Verify session cleared
- **Test Strategy**:
  1. Start at /login (without auth, should redirect from /dashboard)
  2. Verify redirect to /login
  3. Attempt to navigate to /app/dashboard (should redirect back to /login)
  4. Verify cannot access protected routes
- **Success Criteria**: Cannot access /app routes after logout, redirect to /login works

**Note**: Full integration test (actual login/logout) is BLOCKED - requires test user credentials. Current test validates UI flow only.

#### E-001-P1-002: Sitemap Base URL
- **Evidence**: Missing `VITE_PUBLIC_SITE_URL` documentation
- **Root Cause**: `.env.example` didn't document sitemap configuration variable
- **Fix**: Documented in `.env.example`
- **Test Path**: `public/sitemap.xml` (generated at build time)
- **Test Strategy**: Read sitemap.xml, verify all `<loc>` tags use correct base URL
- **Success Criteria**: All URLs in sitemap start with `https://majster.ai` (or configured URL)
- **Blocked By**: Requires `VITE_PUBLIC_SITE_URL` to be set in Vercel environment variables

---

### P2 - Quality/Polish (MEDIUM PRIORITY)

#### E-001-P2-001: Calendar Delete Handler
- **Evidence**: `handleDeleteEvent()` missing try/catch, causing unhandled rejection warnings
- **Root Cause**: Inconsistent error handling (save had try/catch, delete didn't)
- **Fix**: Added try/catch to `handleDeleteEvent`
- **Test Path**: `/app/calendar`
- **Test Strategy**: Navigate to calendar, verify page loads without errors, check for event creation/deletion UI
- **Success Criteria**: Calendar page loads, event controls are visible, no error boundary

**Note**: Full integration test (actual add/delete events) is BLOCKED - requires test user credentials and test data. Current test validates UI flow only.

#### E-001-P2-002: TypeScript Strict Mode Error
- **Evidence**: Unsafe property access on `unknown` error type in `useAiSuggestions.ts`
- **Root Cause**: Error handler accessed `.message` directly on `unknown` type without type guard
- **Fix**: Added type guard for error message extraction
- **Test Path**: CI build (npm run type-check)
- **Test Strategy**: Run `npm run type-check` in CI, verify 0 errors
- **Success Criteria**: TypeScript strict mode build passes with 0 errors

#### E-001-NI-001: Cookie Consent Banner
- **Evidence**: Already implemented in `src/App.tsx` line 113
- **Test Path**: `/` (public landing page)
- **Test Strategy**: Navigate to landing page, verify cookie consent banner is visible
- **Success Criteria**: Banner appears on first visit to landing page

#### E-001-NI-002: Calendar Add Event
- **Evidence**: Event dialog implementation correct with validation + error handling
- **Test Path**: `/app/calendar`
- **Test Strategy**: Navigate to calendar, verify page loads, verify event controls exist
- **Success Criteria**: Calendar page loads without crash, event UI is accessible

#### MVP-I18N-001: i18n Language Switching
- **Evidence**: General UX requirement
- **Test Path**: Any page with language selector
- **Test Strategy**: Switch language (PL ↔ EN), verify UI updates, verify consistent labels
- **Success Criteria**: Language selector works, UI text changes, no mixed language text

---

## Test Implementation Map

### e2e/mvp-gate.spec.ts (NEW)
```typescript
test.describe('MVP Gate - Authentication', () => {
  test('logout flow works end-to-end', ...)                    // E-001-P1-001
});

test.describe('MVP Gate - Quote Management', () => {
  test('quote editor loads without crash', ...)                // E-001-P0-001
});

test.describe('MVP Gate - Calendar', () => {
  test('calendar add/delete events work', ...)                 // E-001-P2-001, E-001-NI-002
});

test.describe('MVP Gate - Public Pages', () => {
  test('cookie consent banner appears on landing', ...)        // E-001-NI-001
  test('sitemap has correct base URL', ...)                    // E-001-P1-002
});

test.describe('MVP Gate - i18n', () => {
  test('language switching works', ...)                        // MVP-I18N-001
});
```

### e2e/smoke.spec.ts (EXISTING)
- `unauthenticated user sees landing page at root` - MVP-SMOKE-001
- `login page renders with accessible form` - MVP-SMOKE-002
- `protected route redirects to login` - MVP-SMOKE-003
- `app serves static assets correctly` - MVP-SMOKE-004

### CI Type Check (EXISTING)
- `npm run type-check` - E-001-P2-002

---

## Blocked Items (Missing Data)

### Authentication Integration Tests
**Status**: ⏳ BLOCKED

**Affected Tests**:
- `logout flow works end-to-end` (full integration with actual login)
- `calendar add/delete events work` (full integration with actual CRUD)
- `quote editor loads without crash` (full integration with actual job data)

**Missing Data**:
1. Test user credentials (email + password)
2. Supabase test database with seeded test data

**Current Workaround**: Tests validate UI rendering and navigation flows only (no actual backend operations).

**How to Unblock**:
1. Create test user in Supabase Auth
2. Add credentials to GitHub Secrets: `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`
3. Seed test data in Supabase test project (1 job, 1 quote, 1 calendar event)
4. Update E2E workflow to use real credentials for authenticated tests

### Sitemap Base URL Verification
**Status**: ⏳ BLOCKED

**Affected Tests**:
- `sitemap has correct base URL` (production URL verification)

**Missing Data**: `VITE_PUBLIC_SITE_URL` environment variable in Vercel

**Current Workaround**: Test verifies sitemap.xml exists and has valid XML structure (not full URL verification).

**How to Unblock**:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add: `VITE_PUBLIC_SITE_URL` = `https://majster.ai`
3. Scope: Production, Preview, Development
4. Redeploy

---

## Verification Commands

### Local (Development)
```bash
# Run all MVP Gate tests
npm run e2e

# Run specific test
npx playwright test e2e/mvp-gate.spec.ts

# Run with UI (interactive)
npm run e2e:ui

# View HTML report
npm run e2e:report
```

### CI (Automated)
```bash
# Workflow: .github/workflows/e2e.yml
# Trigger: PR + push to main/develop
# Artifacts: playwright-report, test-results (uploaded on failure)
```

### Build-Time Checks
```bash
# TypeScript strict mode (P2-002)
npm run type-check

# Build with sitemap generation (P1-002)
npm run build
# Verify: public/sitemap.xml exists and has correct URLs
```

---

## Definition of Done per Test

| Test | PASS Criteria | FAIL Criteria | BLOCKED Criteria |
|------|---------------|---------------|------------------|
| Quote editor loads | Page loads, no JS error, editor UI visible | Error boundary, crash, 404 | Missing job ID or mock data |
| Logout flow works | Cannot access /app after logout, redirect to /login | Can access /app after logout, session not cleared | Missing test user credentials |
| Calendar events work | Page loads, event controls visible, no crash | Error boundary, crash, missing UI | Missing test user + test data |
| Cookie consent appears | Banner visible on landing page | Banner not visible | N/A (public page) |
| Sitemap base URL correct | All `<loc>` URLs start with production URL | Wrong base URL or missing sitemap | VITE_PUBLIC_SITE_URL not set |
| Language switching works | Language selector works, UI updates, no mixed text | UI doesn't update or mixed languages | N/A |
| TypeScript type-check | 0 errors in strict mode | Type errors present | N/A |
| Smoke tests (4) | All 4 pass (landing, login, redirect, assets) | Any smoke test fails | N/A |

---

**Last Updated**: 2026-02-17
**Total Tests**: 12 (8 MVP Gate + 4 Smoke)
**Status**: Ready for implementation
**Next**: Implement e2e/mvp-gate.spec.ts
