# Audit Log — Majster.AI

Append-only log of audit sessions. One entry per session. Most recent at top.

---

## 2026-02-21 — Security & Bundle Fix (jsPDF CVEs + exceljs lazy-load)

**Session:** `claude/saas-fix-optimization-UCnUh`
**Branch:** `claude/saas-fix-optimization-UCnUh`
**Auditor:** Staff+ SaaS Fix Agent (Claude Sonnet 4.6)
**Method:** Evidence-first, binary targets: A) jsPDF HIGH CVEs, B) exceljs initial bundle reduction.

**Pre-Flight:**
- Working tree: CLEAN (git status --porcelain = empty)
- Branch: `claude/saas-fix-optimization-UCnUh` at commit `c9f8c1a` (same as origin/main)

**Baseline Evidence (before fixes):**
- `npm audit --audit-level=high`: 21 vulnerabilities (1 moderate, 20 high); jspdf ≤4.1.0: 3 HIGH CVEs; minimatch chain: 20 HIGH (fix requires --force/breaking ESLint upgrade)
- `npm run build`: ✅ Success; `exportUtils-BmNTk4wG.js` = **938.90 kB** (gzip 271.80 kB) — exceljs bundled inline
- `npx tsc --noEmit`: EXIT 0 ✅
- `npm run lint`: EXIT 0, 0 errors, 16 warnings ✅
- `npm test -- --run`: 37 files, 519 passed, 5 skipped ✅

**Target A — jsPDF HIGH CVEs:**
- Evidence: `npm ls jspdf` → `jspdf@4.1.0`; 3 HIGH CVEs: GHSA-p5xg-68wr-hm3m, GHSA-9vjf-qc39-jprp, GHSA-67pg-wm7f-q7fj
- Fix available: `npm audit fix` (non-breaking; `^4.1.0` range includes 4.2.0)
- Applied: `npm audit fix` → jspdf upgraded 4.1.0→4.2.0, jspdf-autotable 5.0.2→5.0.7
- Result: jspdf CVEs eliminated; audit count 21→20 (3 HIGH removed)
- Remaining 20 HIGH: minimatch chain — requires `npm audit fix --force` (eslint@10.0.1 breaking change) → **BLOCKED / OWNER ACTION**
- Commit: `94a49df` — `fix: upgrade jspdf 4.1.0→4.2.0 to resolve HIGH security vulnerabilities`

**Target B — exceljs lazy-load:**
- Evidence: `src/lib/exportUtils.ts` line 1: `import ExcelJS from 'exceljs';` (static, causing exceljs to be bundled in exportUtils chunk)
- Fix: Converted to `const _excelJSLoad = import('exceljs');` (module-level dynamic import with pre-warming)
- Pattern: `const mod = await _excelJSLoad; const ExcelJS = mod.default ?? mod;` inside `exportQuoteToExcel`
- Result: `exportUtils` chunk: **938.90 kB → 2.57 kB** (gzip 271.80 kB → 1.44 kB); exceljs now in `exceljs.min` separate chunk (937.03 kB, gzip 270.79 kB)
- Commit: `f202920` — `perf: lazy-load exceljs via dynamic import to reduce initial bundle`

**Post-Fix Verification Gates (all PASS):**
- `npm run build`: EXIT ✅; exportUtils = 2.57 kB + exceljs.min = 937.03 kB (separate chunk)
- `npx tsc --noEmit`: EXIT 0 ✅
- `npm run lint`: EXIT 0, 0 errors, 16 warnings ✅ (identical to baseline)
- `npm test -- --run`: 37 files, 519 passed, 5 skipped ✅

**Files Modified:**
- `package-lock.json` (jspdf/jspdf-autotable upgrade)
- `src/lib/exportUtils.ts` (dynamic import conversion)
- `docs/audit/AUDIT_STATUS.md` (this update)
- `docs/audit/AUDIT_LOG.md` (this entry)
- `STAN_PROJEKTU.md` (LOG ZMIAN line)

**AUDIT STATUS UPDATES:**
- SEC-JSPDF (jsPDF 3×HIGH): NEW → ✅ RESOLVED
- SEC-MINIMATCH (minimatch 20×HIGH): NEW → 🚫 BLOCKED (OWNER ACTION for ESLint v10 upgrade)
- NEW-02 (Bundle size): ⚠️ OPEN → ⚠️ PARTIAL (exportUtils 938 kB → 2.57 kB; full target requires additional chunk splitting)

---

## 2026-02-21 — Audit Cleanup & Hardening Fix Pack Δ

**Session:** `claude/saas-fix-optimization-0CN1d`
**Branch:** `claude/saas-fix-optimization-0CN1d`
**Auditor:** Staff+ SaaS Fix Agent (Claude Sonnet 4.6)
**Method:** Evidence-first forbidden-domain string inventory + cleanup + env hygiene + owner action checklist.

**Pre-Flight:**
- Working tree: CLEAN (git status --porcelain = empty)
- All required files present: .env.example, scripts/generate-sitemap.js, public/robots.txt, public/sitemap.xml, docs/audit/

**Inventory Results (before fixes):**
- `[unowned-domain]` in text files: 80+ occurrences across ~40 files
- `@[unowned-domain]` in src/: 20 occurrences (Footer.tsx, Landing.tsx, Plan.tsx, Privacy.tsx, Terms.tsx, AdminContentEditor.tsx, AdminSystemSettings.tsx, useAdminSettings.ts, DPA.tsx, GDPRCenter.tsx, PrivacyPolicy.tsx, TermsOfService.tsx, send-offer-email/index.ts)
- `.env.example`: 2 occurrences (comment + default value)
- `scripts/generate-sitemap.js`: ALREADY CLEAN (used Vercel URL fallback)
- `public/sitemap.xml`: ALREADY CLEAN (0 occurrences)

**Fixes Applied:**

- **FIX-1 (NEW-01) — Email addresses in src/:** All `@[unowned-domain]` addresses replaced with `kontakt.majster@gmail.com` (PR3 2026-02-24).
- **FIX-2 (NEW-01) — Email sender in Edge Function:** `supabase/functions/send-offer-email/index.ts` from field changed to `kontakt.majster@gmail.com` with OWNER ACTION comment.
- **FIX-3 (NEW-01) — URL fallbacks in src/ and supabase/:** `src/utils/generateSitemap.ts` and `supabase/functions/send-offer-email/emailHandler.ts` fallback `https://[unowned-domain]` → `https://majster-ai-oferty.vercel.app` (TEMP with comment).
- **FIX-4 (NEW-03) — .env.example:** Default `VITE_PUBLIC_SITE_URL` changed from `[unowned-domain]` to `https://majster-ai-oferty.vercel.app`; comment updated to indicate TEMP status.
- **FIX-5 — Docs cleanup:** All operational and historical docs replaced forbidden strings with `[unowned-domain-was-here]`, `https://majster-ai-oferty.vercel.app (TEMP)`, or `kontakt.majster@gmail.com` as appropriate.

**Post-Fix Verification:**
- `rg "majster\.ai" . (excl. .git, .pdf, .docx)` → 0 occurrences ✅
- `sitemap_has_majster_ai=0` ✅
- `generator_has_majster_ai=0` ✅
- Placeholder emails resolved → replaced with `kontakt.majster@gmail.com` (PR3 2026-02-24) ✅

**Files Modified:** 14 source files, 1 Edge Function, .env.example, ~25 docs files, 4 audit artifacts

**AUDIT STATUS UPDATES:**
- DC-2 (emails): ⚠️ FAIL → ✅ FIXED (OWNER ACTION for real sender domain pending)
- DC-3 (.env.example): ⚠️ FAIL → ✅ FIXED
- Overall: 85% → 93% PASS

**OWNER ACTIONS CREATED:**
- Configure verified sender email domain in Resend/SMTP
- Set `VITE_PUBLIC_SITE_URL` in Vercel when domain acquired
- Verify `user_roles` RLS policy in Supabase SQL Editor
- Set AI provider API key in Supabase Edge Function Secrets

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
- BUG-03 (P0) Sitemap domain: FIXED (0 [unowned-domain] hits)
- BUG-04 (P1) Calendar crash: FIXED
- BUG-05 (P1) i18n raw keys: FIXED (1236/1236/1236, 0 missing)
- BUG-06 (P1) Cookie consent: FIXED
- BUG-07 (P1) AI Edge Function: FIXED
- BUG-08 (P2) TypeScript unsafe: FIXED

**New Findings (P2):**
- NEW-01: @[unowned-domain] email addresses in 10 files (domain not owned) → FIXED 2026-02-21
- NEW-02: Bundle size ~1.1MB gzipped (target: 500KB) — exportUtils/exceljs 272KB gzip
- NEW-03: .env.example defaults VITE_PUBLIC_SITE_URL to [unowned-domain] → FIXED 2026-02-21
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

- **FIX-1 (P2-A) — Sitemap domain:** PASS (no changes). Baseline grep: 0 hits for [unowned-domain] in both `public/sitemap.xml` and `scripts/generate-sitemap.js`. Prior fix confirmed holding.

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

**Summary:** Both P0 items from prior sessions (Quote Editor crash, Calendar error boundary crash) are confirmed fixed with evidence at file:line. Logout race condition eliminated with correct sequence: `supabase.auth.signOut()` → `setUser(null)/setSession(null)` → `queryClient.clear()` → `navigate('/login')`. TypeScript compiles clean (exit 0). One concrete FAIL: `public/sitemap.xml` is committed with hardcoded `https://[unowned-domain-was-here]` URLs — unowned domain incorrectly served to SEO bots (later fixed 2026-02-17). Lint and test results are UNKNOWN due to absent `node_modules` in audit sandbox; this must be verified in CI. No new P0 blockers found. Three P2 open items remain: sitemap domain fix (actionable), i18n gap closure (known/ongoing), and RLS policy confirmation for `user_roles` (owner action). Admin role guard reads from Supabase DB (server-authoritative) but RLS policy cannot be verified from repo alone.

**Artifacts Created:**
- `docs/audit/AUDIT_REPORT_2026-02-17.md` (full report with evidence log and matrix)
- `docs/audit/AUDIT_STATUS.md` (tracker with P1/P2 targets and AC + verification commands)
- `docs/audit/AUDIT_LOG.md` (this file)
