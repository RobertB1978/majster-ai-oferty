# Audit Status Tracker — Majster.AI

**Last Updated:** 2026-02-21 (Security & Bundle Fix session: `claude/saas-fix-optimization-UCnUh`)
**Audit Session:** `claude/saas-fix-optimization-UCnUh`
**Source Report:** `docs/audit/AUDIT_REPORT_2026-02-20.md`

---

## Domain Status Matrix

| Domain | ID | Status | Risk |
|--------|----|--------|------|
| Auth — Logout invalidation | A1 | ✅ PASS | None |
| Auth — /app route protection | A2 | ✅ PASS | None |
| Auth — No stale data post-logout | A3 | ✅ PASS | None |
| Calendar — Error boundary crash | B1 | ✅ PASS | None |
| Calendar — SelectItem crash | B2 | ✅ PASS | None |
| Calendar — TypeScript clean | B3 | ✅ PASS | None |
| i18n — Full key coverage (PL/EN/UK) | C | ✅ PASS | None |
| Admin separation (code) | D-code | ✅ PASS | None |
| Admin separation (RLS) | D-rls | ❓ UNKNOWN | P2 |
| Legal routing | E | ✅ PASS | None |
| SEO sitemap domain | F-sitemap | ✅ PASS | None |
| SEO robots.txt | F-robots | ✅ PASS | None |
| Quote edit — route + auth | G1 | ✅ PASS | None |
| Quote edit — error handling | G2 | ✅ PASS | None |
| Quote edit — no unsafe assertions | G3 | ✅ PASS | None |
| AI — Error caught | H1 | ✅ PASS | None |
| AI — Type safety | H2 | ✅ PASS | None |
| AI — Fallback state | H3 | ✅ PASS | None |
| TypeScript (`tsc --noEmit`) | TS | ✅ PASS | None |
| Lint (`npm run lint`) | LINT | ✅ PASS | None |
| Tests (`npm test`) | TEST | ✅ PASS | None |
| Build (`npm run build`) | BUILD | ✅ PASS | None |
| Domain constraint (sitemap) | DC-1 | ✅ PASS | None |
| Domain constraint (emails) | DC-2 | ✅ FIXED | OWNER ACTION |
| Domain constraint (.env.example) | DC-3 | ✅ FIXED | None |
| Bundle size (<500KB gzip) | PERF | ⚠️ PARTIAL | P2 |
| jsPDF HIGH CVEs (3x) | SEC-JSPDF | ✅ RESOLVED | None |
| minimatch HIGH CVEs (20x chain) | SEC-MINIMATCH | 🚫 BLOCKED | P2 |
| Cookie consent | COOKIE | ✅ PASS | None |

---

## Summary (2026-02-20)

| Category | Total | ✅ PASS | ⚠️ FAIL | ❓ UNKNOWN |
|----------|-------|---------|---------|------------|
| **Previously Known Bugs** | 8 | 8 | 0 | 0 |
| **Domain Checks** | 27 | 23 | 3 | 1 |
| **TOTAL** | 27 | 25 | 1 | 1 |

**Overall: 93% PASS · 4% FAIL (P2) · 4% UNKNOWN (P2)** *(DC-2 and DC-3 fixed 2026-02-21)*

---

## New P2 Items (from 2026-02-20 audit)

### [NEW-01] @[unowned-domain] emails in codebase
- **Description:** 20+ references to `@[unowned-domain]` email addresses in source. Domain not owned — emails bounce.
- **AC:** `grep -rn "@CHANGE-ME.example" src/ --include="*.tsx" --include="*.ts" | wc -l` → 0 in production (all replaced with `@CHANGE-ME.example` placeholder pending OWNER ACTION to configure real sender domain via Resend/SMTP)
- **Files:** Footer.tsx, Landing.tsx, Plan.tsx, Privacy.tsx, Terms.tsx, AdminContentEditor.tsx, AdminSystemSettings.tsx, useAdminSettings.ts, DPA.tsx, GDPRCenter.tsx, PrivacyPolicy.tsx, TermsOfService.tsx, supabase/functions/send-offer-email/index.ts
- **Status:** ✅ FIXED (2026-02-21) — forbidden domain removed; OWNER ACTION required to configure real sender email

### [NEW-02] Bundle size exceeds target
- **Description:** Total gzipped JS ~1.1MB (target: 500KB). Largest: exportUtils 272KB gzip (exceljs).
- **AC:** No chunk > 150KB gzipped in build output
- **Status:** ⚠️ PARTIAL (2026-02-21)
  - exportUtils chunk: 938.90 kB → **2.57 kB** (exceljs moved to separate lazy chunk)
  - exceljs.min chunk: 937.03 kB (270.79 kB gzip) — loads only when user navigates to Projects/ProjectDetail
  - Remaining heavy chunks still exceed 150 kB gzip target: charts-vendor 113 kB, react-vendor 54 kB, supabase-vendor 46 kB, etc. — further splitting out of scope for this session.
  - Initial bundle no longer includes exceljs code ✅

### [SEC-JSPDF] jsPDF HIGH Security Vulnerabilities
- **Description:** jspdf ≤4.1.0 had 3 HIGH CVEs: GHSA-p5xg-68wr-hm3m (AcroForm PDF injection), GHSA-9vjf-qc39-jprp (addJS object injection), GHSA-67pg-wm7f-q7fj (GIF DoS).
- **Status:** ✅ RESOLVED (2026-02-21) — upgraded jspdf 4.1.0→4.2.0 and jspdf-autotable 5.0.2→5.0.7 via `npm audit fix`. Package-lock.json updated. All 3 CVEs eliminated.

### [SEC-MINIMATCH] minimatch HIGH Vulnerabilities (20 vulns, BLOCKED)
- **Description:** minimatch <10.2.1 (GHSA-3ppc-4f35-3m26 ReDoS). Fix requires `npm audit fix --force` which installs eslint@10.0.1 — breaking change to our ESLint 9 config.
- **Status:** 🚫 BLOCKED — upstream fix requires breaking ESLint upgrade.
- **OWNER ACTION:** To resolve, owner must review ESLint v10 migration guide and upgrade the ESLint stack in a dedicated PR. See: https://eslint.org/docs/latest/use/migrate-to-v10-from-v9

### [NEW-03] .env.example defaults to [unowned-domain]
- **Description:** Line 32 previously defaulted `VITE_PUBLIC_SITE_URL` to the unowned domain.
- **AC:** `grep -c "CHANGE-ME" .env.example` → 0 when owner configures real domain; current default = Vercel URL (TEMP)
- **Status:** ✅ FIXED (2026-02-21) — default changed to `https://majster-ai-oferty.vercel.app` (TEMP); OWNER ACTION to update when domain acquired

---

## Resolved Items (from prior sessions — DO NOT REPEAT)

| Item | Session | Resolution |
|------|---------|------------|
| P0-LOGOUT | 2026-02-17 | FIXED — commit `447f044` |
| P0-CALENDAR (hook) | 2026-02-17 | FIXED — commit `8aa30fb` |
| P0-CALENDAR (SelectItem) | 2026-02-19 | FIXED — commit `bd14e62` |
| P0-QUOTE | 2026-02-17 | FIXED — commit `d602a76` |
| P1-LINT | 2026-02-19 | PASS — 0 errors, 16 warnings |
| P1-I18N | 2026-02-18 | FIXED — 1236/1236/1236, 0 missing |
| P1-SITEMAP | 2026-02-18 | FIXED — 0 [unowned-domain] in sitemap |
| P1-AI | 2026-02-18 | FIXED — Record<string, unknown> |
| P1-COOKIE | verified | PASS — CookieConsent in App.tsx |
| P2-TS-STRICT | 2026-02-17 | FIXED — instanceof guard |
| P2-FINANCE | verified | PASS — fully implemented |
| P2-TESTS | 2026-02-20 | PASS — 519 tests passing |

---

*Updated: 2026-02-21 | Session: claude/saas-fix-optimization-0CN1d (Audit Cleanup Fix Pack Δ — domain string removal)*
