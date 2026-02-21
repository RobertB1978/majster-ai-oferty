# MVP Gate — Work Priority Ordering

**Last Updated**: 2026-02-18 (Reality-Sync Reconciliation `claude/reality-sync-reconciliation-lzHqT`)
**Status Source**: docs/mvp-gate/STATUS.md + docs/audit/AUDIT_STATUS.md + docs/TRUTH.md

---

## Ordered P0/P1 Work Queue

Items ranked by: Priority tier → Impact → Blockedness.
All P0 items are PASS. P1 items with UNKNOWN are the active queue.

---

### Tier P0 — Production Blockers (ALL RESOLVED)

| Rank | ID | Summary | Status | Fixed In |
|------|----|---------|--------|---------|
| P0-1 | P0-LOGOUT | Logout race condition — session/cache not cleared before navigate | ✅ PASS | commit `447f044` (2026-02-17) |
| P0-2 | P0-CALENDAR | Calendar event creation causes error boundary crash | ✅ PASS | commit `8aa30fb` (2026-02-17) |
| P0-3 | P0-QUOTE | Quote editor `ReferenceError: projectId is not defined` | ✅ PASS | commit `d602a76` (2026-02-17) |

**P0 Gate**: ✅ **CLOSED** — 3/3 PASS. No P0 blockers remaining.

---

### Tier P1 — High Priority (1 UNKNOWN, rest PASS)

| Rank | ID | Summary | Status | Next Action |
|------|----|---------|--------|------------|
| **P1-1** | **P1-LINT** | **ESLint infrastructure not verifiable — node_modules absent** | **❓ UNKNOWN** | **`npm install && npm run lint` — NEXT SESSION TARGET** |
| P1-2 | P1-I18N | i18n key coverage gap (EN/UK) | ✅ PASS | None — missing_en=0, missing_uk=0 (2026-02-18) |
| P1-3 | P1-SITEMAP | Sitemap hardcoded `majster-ai-oferty.vercel.app (TEMP)` domain | ✅ PASS | None — grep confirms 0 hits (2026-02-18) |
| P1-4 | P1-AI | AI assistant/edge function error handling | ✅ PASS | None — try/catch/finally at `AiChatAgent.tsx:119` |
| P1-5 | P1-COOKIE | Cookie consent banner | ✅ PASS | None — `<CookieConsent />` at `App.tsx:113` |

**P1 Gate**: 🟡 **4/5 PASS · 1 UNKNOWN (P1-LINT)**

---

### Tier P2 — Quality/Polish (OPEN items require owner action or environment)

| Rank | ID | Summary | Status | Blocker |
|------|----|---------|--------|--------|
| P2-1 | P2-TESTS | Unit/E2E test suite execution verification | ❓ UNKNOWN | node_modules absent; last PASS 2026-02-07 (281 tests) |
| P2-2 | P2-RLS | user_roles RLS policy — non-admins cannot read others' roles | ❓ UNKNOWN | OWNER_ACTION_REQUIRED: Supabase Dashboard → Policies → user_roles |
| P2-3 | P2-FINANCE | Finance page / shell completeness | ✅ PASS | None — FinanceDashboard fully implemented (AI analysis, Recharts, tabs) |
| P2-4 | P2-ADMIN-RLS | Admin role server-authoritative (code-level) | ✅ PASS (code) / ❓ UNKNOWN (RLS) | Depends on P2-RLS |

---

## Next SESSION TARGET

### → P1-LINT: ESLint Infrastructure Verification

**Evidence of current state:**
```
$ npm run lint
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@eslint/js'
  imported from /home/user/majster-ai-oferty/eslint.config.js
EXIT_CODE: non-zero
```

**Root cause (candidate):** `node_modules` not installed — `@eslint/js` is listed as devDependency in `package.json` but not present in working environment.

**Acceptance Criteria (binary):**
- `npm install && npm run lint` exits 0
- Output: 0 errors (warnings ≤25 acceptable per 2026-02-07 baseline)

**Verification:**
```bash
npm install && npm run lint 2>&1 | grep -E "(error|warning|✅|❌|problems)" | tail -10
```

**Files involved:**
- `eslint.config.js` — ESLint flat config importing `@eslint/js`
- `package.json` — devDependencies should include `@eslint/js`
- `package-lock.json` — lock file present; `npm install` should restore correctly

**If PASS:** Mark P1-LINT PASS in STATUS.md and TRUTH.md. Move to P2-TESTS.
**If FAIL:** Read full error, fix eslint config or devDependency, re-run. `tsc --noEmit` must remain exit 0 after any fix.

---

## Ordering Rationale

1. **P1-LINT before P2-TESTS**: ESLint is a faster CI gate check. If lint fails it may surface issues in the test suite too.
2. **P2-TESTS before P2-RLS**: Test suite can be run locally; RLS requires owner action (Supabase Dashboard).
3. **P2-RLS last**: Owner action — cannot be unblocked by code changes. Document the check command and wait for evidence.

---

*Generated: 2026-02-18 | Session: claude/reality-sync-reconciliation-lzHqT*
