# Source of Truth — Majster.AI

**Last Updated**: 2026-02-18 (Reality-Sync Reconciliation session `claude/reality-sync-reconciliation-lzHqT`)

## Authoritative References

| Artifact | Path | Purpose |
|----------|------|---------|
| Project overview | CLAUDE.md | Tech stack, repo structure, rules |
| MVP Gate status | docs/mvp-gate/STATUS.md | Per-item PASS/FAIL/UNKNOWN with evidence |
| Priority ordering | docs/mvp-gate/ORDERING.md | P0/P1 ranked work queue |
| Evidence index (Feb 17) | docs/evidence/2026-02-17/INDEX.md | Evidence pack artifacts |
| Audit report (Feb 17) | docs/audit/AUDIT_REPORT_2026-02-17.md | Full static analysis with evidence chain |
| Audit status (Feb 18) | docs/audit/AUDIT_STATUS.md | Per-item tracker (re-audit 2026-02-18) |
| Audit log | docs/audit/AUDIT_LOG.md | Append-only session log |
| Change log | STAN_PROJEKTU.md | Session-level change log |

## Confirmed Working (Do Not Break)

- Landing page load (`/`)
- Login flow (`/login`)
- Dashboard route (`/app/dashboard`)
- Jobs list (`/app/jobs`) + manual job creation
- Clients list + edit + delete confirm (`/app/customers`)
- Templates list (`/app/templates`)
- Admin blocked for non-admin (`/admin/*`)
- Calendar route (`/app/calendar`) — error boundary crash FIXED (commit `8aa30fb`)
- Quote editor route (`/app/jobs/:id/quote`) — ReferenceError FIXED (commit `d602a76`)
- Logout flow — race condition FIXED, cache cleared (commits `447f044`, `d602a76`)
- Finance dashboard (`/app/finance`) — fully implemented with AI analysis and charts
- Cookie consent banner — rendered at `src/App.tsx:113`
- Legal routes (`/legal/privacy`, `/legal/terms`, `/legal/cookies`, `/legal/dpa`, `/legal/rodo`)
- i18n — pl/en/uk coverage: pl_total_paths=1070, missing_en=0, missing_uk=0 (as of 2026-02-18)
- Sitemap — `public/sitemap.xml` contains 0 `[unowned-domain]` references (fix confirmed 2026-02-18)

## Known Issue Tracker (Reconciled 2026-02-18)

| ID | Priority | Summary | Status | Evidence |
|----|----------|---------|--------|---------|
| P0-LOGOUT | P0 | Logout race condition / stale cache | ✅ PASS | `AuthContext.tsx:120`, `TopBar.tsx:77`; commits `447f044` |
| P0-CALENDAR | P0 | Calendar event creation error boundary crash | ✅ PASS | `useCalendarEvents.ts:38` `(data ?? [])`; commit `8aa30fb` |
| P0-QUOTE | P0 | Quote editor ReferenceError (projectId undefined) | ✅ PASS | `useQuoteVersions.ts:8`; `id!` count=0 in `QuoteEditor.tsx`; commit `d602a76` |
| P1-LINT | P1 | ESLint infrastructure — `@eslint/js` not found in sandbox | ❓ UNKNOWN | node_modules absent; last PASS 2026-02-07 (TRACEABILITY_MATRIX.md, 0 errors/25 warnings) |
| P1-I18N | P1 | i18n key coverage gap (EN/UK) | ✅ PASS | missing_en=0, missing_uk=0 (verified 2026-02-18); regression fixed commit `ad2a555` |
| P1-SITEMAP | P1/P2 | Sitemap hardcoded [unowned-domain] domain | ✅ PASS | `grep -c "[unowned-domain]" sitemap.xml`=0 (verified 2026-02-18); fix commit `14ac892` |
| P1-AI | P1 | AI assistant error handling | ✅ PASS | `AiChatAgent.tsx:119-156` try/catch/finally; 2026-02-17 audit domain H |
| P1-COOKIE | P1 | Cookie consent banner | ✅ PASS | `src/App.tsx:113` renders `<CookieConsent />`; 2026-02-17 audit domain E |
| P2-FINANCE | P2 | Finance shell / Finance page | ✅ PASS | `/app/finance` → PASS (maturity audit 2026-02-15); `FinanceDashboard.tsx` fully implemented with AI analysis, Recharts |
| P2-RLS | P2 | user_roles table RLS policy unverifiable | ❓ UNKNOWN | Cannot verify from repo; requires Supabase Dashboard inspection (OWNER_ACTION_REQUIRED) |
| P2-TESTS | P2 | Unit/E2E test suite execution | ❓ UNKNOWN | vitest not in PATH (node_modules absent); last PASS 2026-02-07 (281 tests) |
| P2-ADMIN-RLS | P2 | Admin role check server-authoritative | ✅ PASS (code) / ❓ UNKNOWN (RLS) | `useAdminRole.ts:17-27` queries Supabase; RLS unverifiable from repo |

## Reconciliation Summary (2026-02-17 vs 2026-02-18)

| Conflicting Claim | 2026-02-17 Status | 2026-02-18 Status | Verdict |
|-------------------|-------------------|-------------------|---------|
| Sitemap domain | FAIL (hardcoded [unowned-domain]) | RESOLVED | ✅ PASS — `grep` confirms 0 [unowned-domain] hits |
| i18n key coverage | PARTIAL (EN/UK gap) | RESOLVED (regression fixed) | ✅ PASS — missing_en=0, missing_uk=0 |
| QuoteEditor `id!` assertions | PARTIAL (structurally safe) | RESOLVED (guard added) | ✅ PASS — `id!` count=0 in QuoteEditor.tsx |
| Lint | UNKNOWN (node_modules absent) | UNKNOWN (same gap) | ❓ UNKNOWN — install node_modules to verify |
| Tests | UNKNOWN (vitest not found) | UNKNOWN (same gap) | ❓ UNKNOWN — install node_modules to verify |
| Finance shell | Not audited | Checked 2026-02-18 | ✅ PASS — fully implemented module |

## Next SESSION TARGET

**P1-LINT** — ESLint Infrastructure Verification

- **Why**: Only P1-level item still UNKNOWN; lint catches regressions before they reach CI. Last confirmed PASS was 2026-02-07.
- **Command**: `npm install && npm run lint 2>&1 | tail -20`
- **Acceptance Criteria (binary)**: `npm run lint` exits 0, ≤25 warnings, 0 errors on HEAD commit.
- **Fallback if fails**: Read `eslint.config.js` + error output; fix import/config issues; `tsc --noEmit` must remain exit 0 after any fix.

---

*Reconciliation auditor: Claude Sonnet 4.6 | Session: claude/reality-sync-reconciliation-lzHqT | 2026-02-18*
