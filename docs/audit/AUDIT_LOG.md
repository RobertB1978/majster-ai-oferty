# Audit Log — Majster.AI

Append-only log of audit sessions. One entry per session. Most recent at top.

---

## 2026-02-20 — 360° Enterprise Reality Audit (Full Stack)

**Session:** `claude/add-app-testing-audit-dSKf8`
**Branch:** `claude/add-app-testing-audit-dSKf8`
**HEAD Commit:** `2f7d9ec`
**Auditor:** Claude Opus 4.6
**Method:** Full 360° audit: repo QA (tsc/lint/tests/build), 8 known bugs verification, 12-dimension scoring, domain constraint check, MVP% computation.

**Pre-Flight:**
- Working tree: CLEAN
- Node: v22.22.0
- Package manager: npm
- Dependencies: installed via `npm ci`

**Repo QA Results:**
- `tsc --noEmit`: EXIT 0, 0 errors ✅
- `npm run lint`: EXIT 0, 0 errors, 16 warnings ✅
- `npm test -- --run`: 519 passed, 5 skipped (37 files) ✅
- `npm run build`: Success, 35.34s ✅
- `npm audit`: 21 vulnerabilities (1 moderate, 20 high) — all exceljs/archiver chain, no fix available

**Known Bugs (8/8 FIXED):**
- BUG-01 (P0) Quote Editor crash: FIXED
- BUG-02 (P0) Logout race condition: FIXED
- BUG-03 (P0) Sitemap domain: FIXED (0 majster.ai hits)
- BUG-04 (P1) Calendar crash: FIXED
- BUG-05 (P1) i18n raw keys: FIXED (1236/1236/1236, 0 missing)
- BUG-06 (P1) Cookie consent: FIXED
- BUG-07 (P1) AI Edge Function: FIXED
- BUG-08 (P2) TypeScript unsafe: FIXED

**New Findings (P2):**
- NEW-01: @majster.ai email addresses in 10 files (domain not owned)
- NEW-02: Bundle size ~1.1MB gzipped (target: 500KB) — exportUtils/exceljs 272KB gzip
- NEW-03: .env.example defaults VITE_PUBLIC_SITE_URL to majster.ai
- NEW-04: 21 npm audit vulns (no upstream fix)

**MVP% Score: 84%** (weighted: Core 50%×88%, UX 20%×78%, Security 20%×80%, SEO/i18n 10%×82%)

**Artifacts:**
- `docs/audit/AUDIT_REPORT_2026-02-20.md` (full 360° report)
- `docs/audit/AUDIT_STATUS.md` (updated domain matrix)
- `docs/audit/AUDIT_LOG.md` (this entry)
- `STAN_PROJEKTU.md` (LOG ZMIAN appended)
- `docs/mvp-gate/STATUS.md` (to be updated)

---

## 2026-02-18 — Re-Audit: Findings FIX-1 (P2-A), FIX-2 (P2-C), FIX-3 (P1-B)

**Session:** `claude/audit-and-fix-WpVlK`
**Branch:** `claude/audit-and-fix-WpVlK`
**Auditor:** Staff+ SaaS Engineer (Claude Sonnet 4.6)
**Method:** Evidence-first re-audit of prior fix session; verify fixes hold; fix regressions.

**Pre-Flight:**
- Working tree: CLEAN
- Required files: all present (note: actual paths are `src/pages/QuoteEditor.tsx` and `src/i18n/locales/uk.json` — scope fence path discrepancies documented in prior session)
- robots.txt Sitemap line: `Sitemap: https://majster-ai-oferty.vercel.app/sitemap.xml` PASS
- BOM/line endings baseline: `en.json: bom=no crlf=0 lf=1260`; `uk.json: bom=no crlf=0 lf=1259`

**Fixes Attempted and Verdicts:**

- **FIX-1 (P2-A) — Sitemap domain:** PASS (no changes). Baseline grep: 0 hits for majster.ai in both `public/sitemap.xml` and `scripts/generate-sitemap.js`. Prior fix confirmed holding.

- **FIX-2 (P2-C / G3) — QuoteEditor id! guard:** PASS (no changes). Baseline grep: 0 hits for `id!` in `src/pages/QuoteEditor.tsx`. Prior fix confirmed holding.

- **FIX-3 (P1-B) — i18n key coverage:** PASS after fix. Baseline check (nested, pl_total_paths=1070): missing_en=0, missing_ua=1 (`errors.logoutFailed` missing from uk.json — regression). Applied targeted string insertion: added comma to prior last key `invalidFileType` and inserted `"logoutFailed": "Не вдалося вийти. Спробуйте ще раз."` before closing brace of `errors` block at uk.json:888-889. JSON valid. BOM/line endings unchanged (lf=1259→1260, +1 for new line). Post-fix: missing_en=0, missing_ua=0.

**Post-Fix Verification Suite (V1–V5) outputs:**
- V1: `sitemap_majsterai=0` ✅
- V2: `generator_majsterai=0` ✅
- V3: `id_bang=0` ✅
- V4: `missing_en=0, missing_ua=0` (pl_total_paths=1070) ✅
- V5: `tsc_exit=0` ✅

**Info-only scan (route param non-null assertions):** 0 matches found. No new P2 items.

**Files Modified (actual writes):**
- `src/i18n/locales/uk.json` (FIX-3; note: scope fence listed ua.json — same prior discrepancy)
- `docs/audit/AUDIT_STATUS.md` (artifact update)
- `docs/audit/AUDIT_LOG.md` (this entry)

**Notable path discrepancies vs audit prompt spec (unchanged from prior session):**
- Scope fence: `src/components/quotes/QuoteEditor.tsx` → Actual: `src/pages/QuoteEditor.tsx`
- Scope fence: `src/i18n/locales/ua.json` → Actual: `src/i18n/locales/uk.json`

---

## 2026-02-17 — Fix Pack: Audit Findings P2-A, P2-C (G3), P1-B

**Session:** `fix/audit-fixpack-20260217-p2a-p2c-p1b`
**Branch:** `fix/audit-fixpack-20260217-p2a-p2c-p1b`
**Auditor:** Staff+ SaaS Engineer (Claude Sonnet 4.6)
**Method:** Evidence-first, sequential fix execution per prompt specification

**Fixes Attempted and Verdicts:**

- **FIX-1 (P2-A) — Sitemap domain:** PASS. Introduced `BASE_URL` constant in `scripts/generate-sitemap.js` using `VITE_PUBLIC_SITE_URL || PUBLIC_SITE_URL || "https://majster-ai-oferty.vercel.app"`. Updated warn message and fallback return to use `BASE_URL`. Regenerated `public/sitemap.xml`. V1=sitemap_majsterai=0, V2=generator_majsterai=0.

- **FIX-2 (P2-C / G3) — QuoteEditor id! guard:** PASS. File located at `src/pages/QuoteEditor.tsx` (audit scope fence listed incorrect path `src/components/quotes/QuoteEditor.tsx`). Added `Navigate` to react-router-dom imports. Replaced `id!` with `id || ''` for hook calls at lines 24-25 to preserve Rules of Hooks. Added `if (!id) return <Navigate to="/app/jobs" replace />;` guard after all hooks. Replaced remaining `id!` at lines 221 and 246 with `id`. V3=id_bang=0. tsc exit 0.

- **FIX-3 (P1-B) — i18n key coverage:** PASS (already complete). Running the key diff revealed pl_total=46, missing_en=0, missing_ua=0. The locale file is `uk.json` (not `ua.json` as specified in audit). Prior fix packs had already resolved the coverage gap. No file changes were required.

**Post-Fix Verification Suite (V1–V5) outputs:**
- V1: sitemap_majsterai=0 ✅
- V2: generator_majsterai=0 ✅
- V3: id_bang=0 ✅ (checked `src/pages/QuoteEditor.tsx`)
- V4: missing_en=0, missing_ua=0 ✅ (checked `src/i18n/locales/uk.json`)
- V5: tsc_exit=0 ✅

**Files Modified (actual writes):**
- `scripts/generate-sitemap.js` (FIX-1)
- `public/sitemap.xml` (FIX-1, regenerated output)
- `src/pages/QuoteEditor.tsx` (FIX-2; note: scope fence listed wrong path)
- `docs/audit/AUDIT_STATUS.md` (artifact update)
- `docs/audit/AUDIT_LOG.md` (this entry)

**Notable path discrepancies vs audit prompt spec:**
- Scope fence: `src/components/quotes/QuoteEditor.tsx` → Actual: `src/pages/QuoteEditor.tsx`
- Scope fence: `src/i18n/locales/ua.json` → Actual: `src/i18n/locales/uk.json`

---

## 2026-02-17 — Post-Merge Snapshot Audit

**Session:** `claude/audit-snapshot-majster-eG4Om`
**HEAD Commit:** `8aa30fb` (fix: P0-CALENDAR — calendar event creation error boundary crash)
**Auditor:** Staff+ Enterprise SaaS Auditor (Claude Sonnet 4.6)
**Method:** Full repository static analysis — no live UI claims

**Scope Covered:** Domains A (Auth/Logout), B (Calendar null safety), C (i18n), D (Admin separation), E (Legal routing), F (SEO sitemap/robots), G (Quote edit flow), H (AI error handling) + static verification (TypeCheck, Lint, Tests).

**Summary:** Both P0 items from prior sessions (Quote Editor crash, Calendar error boundary crash) are confirmed fixed with evidence at file:line. Logout race condition eliminated with correct sequence: `supabase.auth.signOut()` → `setUser(null)/setSession(null)` → `queryClient.clear()` → `navigate('/login')`. TypeScript compiles clean (exit 0). One concrete FAIL: `public/sitemap.xml` is committed with hardcoded `https://majster.ai` URLs — unowned domain incorrectly served to SEO bots. Lint and test results are UNKNOWN due to absent `node_modules` in audit sandbox; this must be verified in CI. No new P0 blockers found. Three P2 open items remain: sitemap domain fix (actionable), i18n gap closure (known/ongoing), and RLS policy confirmation for `user_roles` (owner action). Admin role guard reads from Supabase DB (server-authoritative) but RLS policy cannot be verified from repo alone.

**Artifacts Created:**
- `docs/audit/AUDIT_REPORT_2026-02-17.md` (full report with evidence log and matrix)
- `docs/audit/AUDIT_STATUS.md` (tracker with P1/P2 targets and AC + verification commands)
- `docs/audit/AUDIT_LOG.md` (this file)
