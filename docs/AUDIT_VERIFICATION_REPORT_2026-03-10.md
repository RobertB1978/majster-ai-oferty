# Audit Verification Report — 2026-03-10

**Auditor:** Independent verification agent (Claude Opus 4.6)
**Subject:** Implementation claims from commit `28561e6` ("Add dashboard task list, real activity feed, and security hardening #357")
**Branch under audit:** `master` @ `28561e6`
**Date:** 2026-03-10

---

## Executive Summary

| Metric | Count |
|---|---|
| **Overall Verdict** | **ACCEPT WITH CONDITIONS** |
| VERIFIED | 8 |
| PARTIALLY VERIFIED | 6 |
| ALREADY EXISTED (satisfies requirement) | 1 |
| ALREADY EXISTED (does NOT satisfy requirement) | 1 |
| NOT VERIFIED | 0 |
| FAILED / REGRESSED | 1 |

**17 claims examined. 8 fully verified. 6 partially delivered with gaps. 1 feature already existed and meets requirements. 1 feature already existed but is overstated. 1 claim fails on inspection.**

---

## Build and Test Evidence

| Check | Result |
|---|---|
| `npm run build` (via `npx vite build`) | **PASS** — built in 20.90s, no errors |
| `npx vitest run` | **PASS** — 51 test files, 731 passed, 5 skipped, 0 failed |
| `npm audit` | **1 HIGH (minimatch ReDoS), 1 MODERATE (ajv ReDoS)** — both in dev/build tooling, not runtime |
| htmlEscape tests | **8 tests present and passing** at `src/test/security/htmlEscape.test.ts` |

---

## Claim-by-Claim Verification

### [SEC-01] XSS in email templates fixed

- **Status: PARTIALLY VERIFIED**
- **Files checked:** `supabase/functions/_shared/sanitization.ts`, `supabase/functions/send-expiring-offer-reminders/index.ts`, `supabase/functions/send-offer-email/emailHandler.ts`
- **Evidence:**
  - `htmlEscape()` correctly escapes all 5 HTML metacharacters (`& < > " '`) and handles null/undefined.
  - In `send-expiring-offer-reminders/index.ts`: `companyName`, `projectName`, `clientName` are all escaped via `htmlEscape()` before insertion into HTML body. **This is correct.**
  - **Bug found:** HTML-escaped values (`&amp;` etc.) are used in email **subject lines** (plain text), causing display corruption for names with `&`, `<`, `>`, `"`, `'`.
- **What is missing:**
  - `send-offer-email/emailHandler.ts` line 71: The user-supplied `message` field is **NOT escaped** — only `\n` → `<br>` replacement is applied. This is an **active XSS vulnerability** in a different email function.
  - `pdfUrl` in `emailHandler.ts` line 108 is inserted into `href` without validation.
  - The fix was applied to only ONE of TWO email-sending functions.
- **Risk level: HIGH** — XSS remains in `send-offer-email`.

---

### [PRJ-01] FK "none" as client_id fixed

- **Status: VERIFIED**
- **Files checked:** `src/pages/NewProjectV2.tsx` line 46
- **Evidence:** `client_id: clientId && clientId !== 'none' ? clientId : null` — correctly converts the `'none'` select value to `null` before database insertion.
- **Risk level: LOW** — fix is correct and complete.

---

### [SEC-04] npm vulnerabilities fixed

- **Status: PARTIALLY VERIFIED**
- **Files checked:** `package-lock.json` (242 lines changed), `npm audit` output
- **Evidence:**
  - `package-lock.json` was updated (dependency tree changed).
  - Current state: **1 HIGH** (minimatch ReDoS in dev tooling), **1 MODERATE** (ajv ReDoS in dev tooling).
  - Both are in build-time/lint-time dependencies, not shipped to production.
  - The claim said "rollup, tar" vulnerabilities were fixed — if those previously existed and are now gone, the fix is valid.
- **What is missing:** Cannot verify the "before" state. The remaining HIGH is in `minimatch` (transitive of `@typescript-eslint`, `glob`, `rimraf`), fixable via `npm audit fix`.
- **Risk level: LOW** — remaining vulns are in dev dependencies only.

---

### [DEMO-01] ActivityFeed real data fixed

- **Status: VERIFIED**
- **Files checked:** `src/components/dashboard/ActivityFeed.tsx`, `src/hooks/useRecentActivity.ts`
- **Evidence:**
  - `useRecentActivity` hook queries Supabase `offers` and `clients` tables with proper auth gating.
  - `ActivityFeed` uses this hook; no demo data is rendered.
  - `React.memo` applied to both `ActivityFeed` and `ActivityItem`.
- **Minor issue:** `Activity` type is still imported from `@/data/demoActivities` (type-only import). The `demoActivities.ts` data file may still exist.
- **Risk level: LOW**

---

### [DEMO-02] Hardcoded trends removed

- **Status: VERIFIED**
- **Files checked:** `src/components/dashboard/DashboardStats.tsx`
- **Evidence:**
  - No `trend` prop is passed to any `StatsCard` instance. The trend UI is hidden since `trend` is optional and undefined.
  - Sparkline charts use deterministic pseudo-random data generated from current values — **cosmetic only, not real historical data**.
- **What is actually true:** Hardcoded trends were **removed** (not replaced with real calculations). The sparklines are decorative filler.
- **Risk level: LOW** — functional but misleading sparklines remain.

---

### [AUTH-01] Biometric auth hidden

- **Status: PARTIALLY VERIFIED**
- **Files checked:** `src/pages/Login.tsx` line 23, `src/config/featureFlags.ts`, `src/pages/Settings.tsx`, `src/pages/CompanyProfile.tsx`
- **Evidence:**
  - `Login.tsx` has `const FF_BIOMETRIC_AUTH = false` (file-scoped, hardcoded). Biometric login button is gated and never rendered. **This works.**
  - **However:** Biometric registration and management UI is fully accessible in:
    - `Settings.tsx` (biometric tab) — **no feature flag**
    - `CompanyProfile.tsx` (`<BiometricSetup>`) — **no feature flag**
  - Users can register biometric credentials but cannot use them to log in.
- **What is missing:** The flag only covers the Login page. The rest of the biometric UI is fully exposed, creating a confusing UX where users can set up biometrics that don't work.
- **Risk level: MEDIUM** — user confusion, not a security issue.

---

### [SEC-09] PII logging fixed

- **Status: PARTIALLY VERIFIED**
- **Files checked:** `supabase/functions/send-expiring-offer-reminders/index.ts`
- **Evidence:**
  - `console.log` statements no longer log email addresses directly — they log offer/warranty IDs.
  - **However:** Lines 255, 372 collect raw `clientEmail` into arrays (`sentEmails`, `warrantySent`), and line 389 returns the **full list of client email addresses in the HTTP response body**.
  - This is a PII leak in the API response, not in console logs.
- **What is missing:** Response body still contains raw client emails. Should return counts or redacted values.
- **Risk level: MEDIUM** — PII in HTTP response to authorized caller (cron).

---

### [SEC-02] Withdraw auth check added

- **Status: VERIFIED**
- **Files checked:** `supabase/functions/approve-offer/index.ts` lines 238-263
- **Evidence:**
  - Authorization header is required (401 if missing).
  - JWT is validated via `supabase.auth.getUser(token)` (cryptographic verification, not just presence check).
  - Caller identity is checked against `approval.user_id` (403 if mismatch).
  - Public token flow cannot reach withdraw without passing all three checks.
- **Minor note:** Variable shadowing of `token` at line 246 (public token vs JWT token) — cosmetic issue.
- **Risk level: LOW** — properly implemented.

---

### [SEC-05] CSP on /offer/* added

- **Status: PARTIALLY VERIFIED**
- **Files checked:** `vercel.json` lines 64-83
- **Evidence:**
  - CSP header exists for `/offer/(.*)` routes with proper scope.
  - Includes `script-src`, `style-src`, `img-src`, `connect-src`, `frame-ancestors`, `upgrade-insecure-requests`.
- **Issues found:**
  - `script-src 'self' 'unsafe-inline'` — weakens XSS protection. The global CSP does NOT use `'unsafe-inline'` for scripts.
  - `img-src ... https:` — allows images from any HTTPS source (overly broad).
  - `X-Frame-Options: SAMEORIGIN` contradicts `frame-ancestors 'none'` (the CSP directive wins in modern browsers, but the inconsistency should be resolved).
- **Risk level: MEDIUM** — `'unsafe-inline'` in script-src significantly weakens the CSP.

---

### [OFF-01] Offer archive (soft delete)

- **Status: PARTIALLY VERIFIED**
- **Files checked:** `src/hooks/useOffers.ts` lines 106-121, `src/pages/Offers.tsx` lines 179-184, 216-223
- **Evidence:**
  - `useArchiveOffer` mutation exists — sets `status: 'ARCHIVED'`, updates `updated_at`.
  - UI dropdown menu shows "Archiwizuj" action (conditionally hidden when already archived).
  - Toast notifications on success/error.
- **Issues found:**
  - **No server-side enforcement:** The archive is a simple client-side status update. There is no RLS policy or database trigger that prevents un-archiving.
  - **No query filter:** `useOffers` with status `'ALL'` does NOT exclude archived offers. Archived offers remain visible in the default "All" view.
  - This is a status change, not a proper soft delete with `deleted_at` timestamp.
- **Risk level: LOW** — functional but incomplete (archived offers still visible in "All" tab).

---

### [PRJ-02/03] Project status/delete

- **Status: PARTIALLY VERIFIED**
- **Files checked:** `src/hooks/useProjectsV2.ts` lines 21, 216-233
- **Evidence:**
  - `ProjectStatus` type includes `'CANCELLED'`.
  - `useDeleteProjectV2` mutation exists — sets `status: 'CANCELLED'` (soft delete via status change).
- **Critical gap:**
  - `useDeleteProjectV2` is **exported but never imported or called** by any UI component.
  - No "Delete" or "Cancel" button exists in any project list or detail view.
  - No status badge rendering for `CANCELLED` in any UI component.
  - The hook is dead code — users cannot trigger project deletion from the UI.
- **Risk level: MEDIUM** — feature exists only as an unused hook.

---

### [AUTH-02] Redirect unification (/dashboard → /app/dashboard)

- **Status: PARTIALLY VERIFIED**
- **Files checked:** All `.tsx`/`.ts` files containing `/dashboard`
- **Evidence:**
  - Most navigation calls now use `/app/dashboard` (Login, Register, ResetPassword, AuthCallback, Admin, OnboardingWizard, etc.).
  - A redirect shim exists in `App.tsx` line 293: `<Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />`
- **Remaining issues (3 files):**
  1. `src/pages/Index.tsx:4` — navigates to `/dashboard` → causes **double redirect** (/ → /dashboard → /app/dashboard).
  2. `src/contexts/AuthContext.tsx:100` — email confirmation `redirectUrl` uses `${origin}/dashboard` instead of `${origin}/app/dashboard`.
  3. `e2e/smoke.spec.ts:162` — e2e test navigates to `/dashboard` (low severity).
- **Risk level: LOW** — works via shim but 3 references remain unconverted.

---

### [Phase 3] CRM — clients module "already exists"

- **Status: ALREADY EXISTED BUT DOES NOT FULLY SATISFY REQUIREMENT**
- **Files checked:** `src/App.tsx` routing, `src/hooks/useClients.ts`, `src/pages/Customers.tsx`
- **Evidence:**
  - Route `/app/customers` exists with full CRUD hooks, Zod validation, paginated search, and RLS.
  - Integrated into offer wizard and project creation.
- **What it actually is:** A contact directory / address book with 4 fields (name, phone, email, address).
- **What a CRM module would need:** Client detail pages, activity/interaction history, relationship views (linked offers/projects), NIP/tax ID field, tags/segments, import/export.
- **Verdict: CLAIM OVERSTATED** — describing this as "CRM" is inaccurate. It's a client contact list.

---

### [Phase 3] Item templates library "already exists"

- **Status: ALREADY EXISTED AND SATISFIES REQUIREMENT**
- **Files checked:** `src/App.tsx` routing, `src/hooks/useItemTemplates.ts`, `src/pages/ItemTemplates.tsx`
- **Evidence:**
  - Route `/app/templates` exists with full CRUD hooks, paginated search, category filter, RLS.
  - Integrated into offer wizard (`WizardStepItems.tsx`) and quote editor (`TemplateSelector`).
  - Bulk import from predefined construction-specific template sets.
- **Verdict:** This genuinely satisfies an "item templates library" requirement.

---

### [Phase 4] React.memo added to components

- **Status: VERIFIED**
- **Files checked:** `src/components/dashboard/ActivityFeed.tsx`, `src/components/dashboard/DashboardStats.tsx`, `src/components/dashboard/TodayTasks.tsx`
- **Evidence:**
  - `React.memo` applied to: `ActivityFeed`, `ActivityItem`, `DashboardStats`, `TodayTasks`.
  - `StatsCard` (inner component of DashboardStats) is **NOT** memoized.
  - Memoization is structurally correct for the components it's applied to.
- **Risk level: LOW** — correctly applied but `StatsCard` omission is minor.

---

### [Phase 5] TodayTasks widget

- **Status: VERIFIED**
- **Files checked:** `src/components/dashboard/TodayTasks.tsx` (155 lines), `src/pages/Dashboard.tsx` line 218
- **Evidence:**
  - Shows 3 categories: pending offers (no response >3 days), expiring offer approvals (<3 days), inactive projects (>7 days).
  - All data from live Supabase queries via `useTodayTasks` hook.
  - Rendered on Dashboard after QuickActions and before the two-column grid.
  - Returns `null` when empty (no clutter).
- **Risk level: NONE** — well-implemented.

---

### [Phase 5] Celebration animation on offer acceptance

- **Status: FAILED**
- **Files checked:** `src/pages/OfferPublicPage.tsx` lines 233-252, all CSS files, `tailwind.config.ts`
- **Evidence:**
  - Code references `animate-[celebration_0.6s_ease-in-out]` — a Tailwind arbitrary animation.
  - **The `@keyframes celebration` is NEVER DEFINED** in any CSS file, global stylesheet, or Tailwind config.
  - Without the keyframe definition, the animation class is applied but **does nothing**.
  - `animate-bounce` on the checkmark icon **does work** (Tailwind built-in).
- **What is actually true:** There is a bouncing checkmark icon and a different success message ("Oferta zaakceptowana!") on fresh acceptance. The "celebration" CSS animation is broken/missing.
- **Risk level: LOW** — cosmetic feature, no data impact.

---

### [Testing] 8 htmlEscape unit tests

- **Status: VERIFIED**
- **Files checked:** `src/test/security/htmlEscape.test.ts`
- **Evidence:**
  - 8 test cases present and passing: angle brackets, ampersand, double quotes, single quotes, null/undefined, empty string, safe strings, complex XSS attempts.
  - Tests replicate the `htmlEscape` function locally (since the real one is in Deno runtime).
- **Coverage gap:** No tests for `client_id` none/null guard, no tests for offer archive, no tests for withdraw auth.

---

## Security Review — Still-Open Concerns

| # | Issue | Severity | Location |
|---|---|---|---|
| 1 | **XSS in send-offer-email:** `message` field not escaped before HTML insertion | **HIGH** | `supabase/functions/send-offer-email/emailHandler.ts:71` |
| 2 | **PII in HTTP response:** Client emails returned in response body | **MEDIUM** | `supabase/functions/send-expiring-offer-reminders/index.ts:389` |
| 3 | **CSP `unsafe-inline`:** `/offer/*` CSP allows inline scripts | **MEDIUM** | `vercel.json:80` |
| 4 | **Biometric UI exposed:** Users can register credentials they can't use | **MEDIUM** | `Settings.tsx`, `CompanyProfile.tsx` |
| 5 | **Email subject corruption:** HTML entities in plain-text subjects | **LOW** | `send-expiring-offer-reminders/index.ts:235` |
| 6 | **No `celebration` keyframe:** CSS animation referenced but undefined | **LOW** | `OfferPublicPage.tsx:235` |
| 7 | **Archived offers visible:** No filter excludes `ARCHIVED` from "All" view | **LOW** | `useOffers.ts` |
| 8 | **Project delete dead code:** `useDeleteProjectV2` exported but never called | **LOW** | `useProjectsV2.ts` |

---

## Regression / Overstatement Findings

| Claim | Issue |
|---|---|
| "SEC-01 XSS fixed" | Fixed in 1 of 2 email functions. `send-offer-email` still vulnerable. |
| "SEC-09 PII logging fixed" | Console logs cleaned, but PII now leaks in HTTP response body. |
| "AUTH-01 biometric hidden" | Hidden on Login page only. Registration/management UI still fully exposed. |
| "AUTH-02 redirect unification" | 3 files still use bare `/dashboard`. Works via shim but incomplete. |
| "OFF-01 offer archive" | Archived offers not filtered from "All" view. |
| "PRJ-02/03 project delete" | Hook exists but is dead code — no UI triggers it. |
| "CRM module already exists" | Address book, not CRM. Overstated. |
| "Celebration animation" | CSS keyframe undefined — animation is broken. |
| "SEC-04 npm vulns fixed" | 1 HIGH still remains (minimatch, dev dependency). |

---

## Final Recommendation

### **ACCEPT WITH CONDITIONS**

The commit delivers genuine value: real activity feed, TodayTasks widget, XSS escaping in the reminder function, proper withdraw auth, CSP headers, and the client_id FK fix. The test suite passes and the build succeeds.

However, accepting this as "all phases complete" would create a false sense of security. The XSS gap in `send-offer-email` is the most critical finding — it was not addressed despite being the same class of vulnerability as SEC-01. Several features are partially delivered (project delete is dead code, offer archive doesn't filter, biometric flag only covers login).

---

## Mandatory Next Actions

1. **[P0 SECURITY]** Escape `message` field in `supabase/functions/send-offer-email/emailHandler.ts:71` with `htmlEscape()` before HTML insertion.
2. **[P0 SECURITY]** Remove raw client emails from HTTP response in `send-expiring-offer-reminders/index.ts:389` — return counts only.
3. **[P1 SECURITY]** Replace `'unsafe-inline'` with nonce-based or hash-based CSP for `script-src` on `/offer/*` in `vercel.json`.
4. **[P1]** Add `@keyframes celebration` to global CSS or Tailwind config, or remove the broken class reference.
5. **[P1]** Gate biometric settings UI behind `FF_BIOMETRIC_AUTH` in `Settings.tsx` and `CompanyProfile.tsx`.
6. **[P1]** Wire `useDeleteProjectV2` to a UI action (delete/cancel button) in project views, or remove the dead code.
7. **[P2]** Exclude `ARCHIVED` offers from default "All" query in `useOffers.ts`.
8. **[P2]** Fix email subject to use raw (unescaped) values instead of HTML-escaped values.
9. **[P2]** Convert remaining `/dashboard` references to `/app/dashboard` in `Index.tsx`, `AuthContext.tsx`.
10. **[P2]** Run `npm audit fix` to resolve remaining minimatch HIGH vulnerability.
11. **[P3]** Move `Activity` type from `@/data/demoActivities` to a proper types file.

---

*Report generated by independent verification agent. No code was modified during this audit.*
