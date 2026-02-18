# Audit Status Tracker — Majster.AI

**Last Updated:** 2026-02-18 (re-audit session: `claude/audit-and-fix-WpVlK`)
**Audit Session:** `claude/audit-snapshot-majster-eG4Om`
**Source Report:** `docs/audit/AUDIT_REPORT_2026-02-17.md`

---

## Domain Status Matrix

| Domain | ID | Status | Risk |
|--------|----|--------|------|
| Auth — Logout invalidation | A1 | ✅ PASS | None |
| Auth — /app route protection | A2 | ✅ PASS | None |
| Auth — No stale data post-logout | A3 | ✅ PASS | None |
| Calendar — Pre-merge error identified | B1 | ✅ PASS | None |
| Calendar — Fix at file:line confirmed | B2 | ✅ PASS | None |
| Calendar — No `as any` workarounds | B3 | ✅ PASS | None |
| Calendar — TypeScript clean compile | B4 | ✅ PASS | None |
| i18n correctness | C | ✅ PASS | None |
| Admin separation (code) | D-code | ✅ PASS | None |
| Admin separation (RLS) | D-rls | ❓ UNKNOWN | P2 |
| Legal routing | E | ✅ PASS | None |
| SEO sitemap domain | F-sitemap | ✅ RESOLVED | None |
| SEO robots.txt | F-robots | ✅ PASS | None |
| Quote edit — route + auth | G1 | ✅ PASS | None |
| Quote edit — error handling | G2 | ✅ PASS | None |
| Quote edit — no unsafe assertions | G3 | ✅ RESOLVED | None |
| AI — Error caught | H1 | ✅ PASS | None |
| AI — No unhandled rejection | H2 | ✅ PASS | None |
| AI — Fallback state | H3 | ✅ PASS | None |
| TypeScript (`tsc --noEmit`) | TS | ✅ PASS | None |
| Lint (`npm run lint`) | LINT | ❓ UNKNOWN | P1 |
| Tests (`npm test`) | TEST | ❓ UNKNOWN | P1 |

---

## Next Session Targets

### P0 (Blocking)
*None — all prior P0 items resolved as of commit `8aa30fb`*

---

### P1 (High Priority)

#### [P1-A] Lint Infrastructure Verification
- **Description:** `npm run lint` fails in sandbox (missing node_modules). Must be verified in real CI environment.
- **Acceptance Criteria:** `npm run lint` exits 0 with 0 errors after `npm install`.
- **Verification:** `npm install && npm run lint 2>&1 | tail -5`
- **File:** `eslint.config.js:1`
- **Status:** OPEN

#### [P1-B] i18n Key Coverage Gap Resolution
- **Description:** ~55% key coverage (from Feb 15 audit). EN/UA users see raw key strings for untranslated sections. Partial fix in Feb 17 pack. Full coverage not re-measured.
- **Acceptance Criteria:** `diff <(jq 'keys[]' src/i18n/locales/pl.json | sort) <(jq 'keys[]' src/i18n/locales/en.json | sort)` outputs 0 lines.
- **Verification:** `diff <(jq 'keys[]' src/i18n/locales/pl.json | sort) <(jq 'keys[]' src/i18n/locales/en.json | sort)`
- **File:** `src/i18n/locales/pl.json`, `src/i18n/locales/en.json`
- **Status:** ✅ RESOLVED (2026-02-18) — re-audit found regression: errors.logoutFailed missing from uk.json; fixed with targeted insertion; missing_en=0, missing_ua=0; pl_total_paths=1070 (nested); uk_json_valid=true; tsc_exit=0

---

### P2 (Medium Priority)

#### [P2-A] Fix public/sitemap.xml Domain
- **Description:** `public/sitemap.xml` has hardcoded `https://majster.ai` (unowned domain). Served as-is by Vercel.
- **Acceptance Criteria:** `grep -c "majster\.ai" public/sitemap.xml` returns `0`; `grep "majster-ai-oferty.vercel.app" public/sitemap.xml` returns ≥1.
- **Verification:** `grep -c "majster\.ai" public/sitemap.xml` (must be 0)
- **File:** `public/sitemap.xml:4`, `scripts/generate-sitemap.js:31-32`
- **Owner Action Required:** Set `VITE_PUBLIC_SITE_URL=https://majster-ai-oferty.vercel.app` in Vercel env vars and redeploy.
- **Status:** ✅ RESOLVED (2026-02-17) — BASE_URL constant introduced in generate-sitemap.js; sitemap regenerated; V1=0, V2=0

#### [P2-B] Confirm user_roles RLS Policy
- **Description:** Admin guard reads from `user_roles` table. RLS policy not verifiable from repo. If missing, authenticated users could read all role rows.
- **Acceptance Criteria:** Supabase `user_roles` table has SELECT policy with `auth.uid() = user_id` restriction.
- **Verification:** Supabase Dashboard → Authentication → Policies → `user_roles` OR `SELECT * FROM pg_policies WHERE tablename = 'user_roles';` in SQL editor.
- **Status:** OPEN (OWNER_ACTION_REQUIRED)

#### [P2-C] Test Suite Execution Verification
- **Description:** Tests could not be executed in audit sandbox. Suite covers P0 scenarios.
- **Acceptance Criteria:** `npm test` exits 0 with all tests passing.
- **Verification:** `npm install && npm test 2>&1 | tail -20`
- **Status:** OPEN

---

## Resolved Items (from prior sessions)

| Item | Session | Resolution |
|------|---------|------------|
| P2-A / F-sitemap (sitemap domain) | 2026-02-18 | RESOLVED (re-audit confirmed) — no regression; V1=sitemap_majsterai=0, V2=generator_majsterai=0 |
| P2-C / G3 (id! non-null assertion) | 2026-02-18 | RESOLVED (re-audit confirmed) — no regression; V3=id_bang=0; tsc_exit=0 |
| P1-B / C (i18n key coverage) | 2026-02-18 | RESOLVED — re-audit fixed regression (errors.logoutFailed missing from uk.json); pl_total_paths=1070, missing_en=0, missing_ua=0 |
| P0-CALENDAR (error boundary crash) | 2026-02-17 | FIXED — commit `8aa30fb` (`useCalendarEvents.ts`) |
| P0-LOGOUT (race condition + cache) | 2026-02-17 | FIXED — commit `447f044` (`TopBar.tsx`, `AuthContext.tsx`) |
| P0-QUOTE (ReferenceError projectId) | 2026-02-17 | FIXED — commit `d602a76` (`useQuoteVersions.ts`) |
| P1-CRON-AUTH (missing CRON_SECRET) | 2026-02-15 | FIXED — `send-expiring-offer-reminders/index.ts` |
| P2-COOKIE-CONSENT i18n | 2026-02-15 | FIXED — `CookieConsent.tsx` |
| P2-NOTFOUND i18n + SPA nav | 2026-02-15 | FIXED — `NotFound.tsx` |
