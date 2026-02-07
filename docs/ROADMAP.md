# Majster.AI — ENTERPRISE ROADMAP

> **SUPERSEDED** — This document has been replaced by [`ROADMAP_ENTERPRISE.md`](./ROADMAP_ENTERPRISE.md) (v4) as per [ADR-0000](./ADR/ADR-0000-source-of-truth.md). This file is kept for historical reference only. Do not update this file.

## Production-Ready Repository (Existing Codebase)

**Version**: 1.0 (ARCHIVED)
**Date**: February 3, 2026
**Status**: SUPERSEDED by ROADMAP_ENTERPRISE.md v4
**Last Updated**: After PR#6 merged
**Repository**: RobertB1978/majster-ai-oferty
**Current Grade**: **A+ (95/100)** (FINAL_GRADE_2026.md) — *Note: grade contested in v4 assessment*

---

## 📋 CORE PRINCIPLES

### "No Green No Finish" Protocol
Every PR MUST pass before merge:
- ✅ `npm run lint` (0 errors allowed)
- ✅ `npm test` (281/281 tests passing)
- ✅ `npm run build` (production build succeeds)
- ✅ `npm run type-check` (TypeScript strict mode, 0 errors)
- ✅ CI/CD workflows (5 workflows green)
- ✅ Security audit (`npm audit --audit-level=high`)

### Development Rules
1. **1 PR = 1 Goal** — Single responsibility per PR
2. **PRE-FLIGHT Always** — Run all checks before starting work
3. **Zero Refactor "At the Same Time"** — No scope creep
4. **Docs-Only PRs Separate** — Documentation changes isolated
5. **Evidence-Based** — Every decision backed by data (git log, test output, audit reports)

### PR Size Limits (Quality Gate)
- **Preferred**: <120 LOC, <10 files
- **Maximum**: 200-300 LOC, 10-15 files
- **Exception**: Generated code, migrations, dependency updates

---

## ✅ ZROBIONE (Merged & Verified)

| PR # | Goal | Evidence (Commit/PR) | Risk Level | Status |
|------|------|---------------------|-----------|--------|
| **PR-1** | Admin Control Plane + Audit Log | Commit: `92e8d80`, PR #121<br/>Tables: `admin_system_settings`, `admin_audit_log`, `admin_theme_config`<br/>RLS policies verified | 🔴 CRITICAL | ✅ **MERGED**<br/>2025-01-18 |
| **PR-2** | Critical i18n (Error/Success Messages) | Commit: `f33af96`, PR #122<br/>~90 strings wrapped with `t()`<br/>Namespaces: `errors.json`, `auth.json` | 🟡 MEDIUM | ✅ **MERGED**<br/>2025-01-18 |
| **PR-3** | Admin Panel i18n | Commit: `16d6487`, PR #123<br/>ACTION_LABELS moved to i18n<br/>~40 admin strings localized | 🟡 MEDIUM | ✅ **MERGED**<br/>2025-01-18 |
| **PR-4A** | i18n Coverage (Login.tsx, OfferApproval.tsx) | Commits: `c4247f5`, `92de880`<br/>2/8 components completed | 🟢 LOW | ⚠️ **PARTIAL**<br/>50% done |
| **PR-5** | E2E & CI/CD Hardening | Commits: `73a5142` (#124), `8f1a91a`<br/>E2E required checks, npm audit aligned | 🟡 MEDIUM | ✅ **MERGED**<br/>2025-01-18 |
| **PR-6** | Security Hardening (RLS, npm audit) | Commits: `91c3382`, `67a5599`<br/>Admin panel RLS + dual-role auth<br/>Critical npm vulns fixed | 🟠 HIGH | ✅ **MERGED**<br/>2025-01-22 |

### Summary of Achievements
- **Admin Control**: localStorage → database-backed with realtime sync + audit trail ✅
- **i18n Foundation**: 130+ strings localized (Polish/English) ✅
- **CI/CD Pipeline**: 5 workflows, blocking checks enforced ✅
- **Security Grade**: A (92/100) — RLS, Sentry, server-side validation ✅
- **Test Coverage**: 281/281 tests passing (100%) ✅
- **Build Health**: All checks green (lint/test/build/type-check) ✅

---

## 🎯 NASTĘPNE (Planned — Remaining Work)

### PR-4B: Complete i18n Coverage (FINISH PR-4)
**Status**: IN PROGRESS (50% complete)
**Priority**: 🟢 MEDIUM (Polish before v1.0)
**Estimated Effort**: 150-200 LOC, 6-8 files
**Timeline**: 2-3 days

#### Scope Fence
**Folders/Files to Change:**
- `src/components/offers/*.tsx` (placeholders, helper text)
- `src/components/projects/*.tsx` (empty states)
- `src/components/settings/*.tsx` (descriptions)
- `src/pages/*.tsx` (remaining 6 pages)
- `src/i18n/namespaces/offers.json` (new)
- `src/i18n/namespaces/projects.json` (new)
- `src/i18n/namespaces/settings.json` (new)
- `src/i18n/namespaces/messages.json` (new)

**OUT OF SCOPE:**
- ❌ Admin panel (already done in PR-3)
- ❌ Error messages (already done in PR-2)
- ❌ Auth components (already done in PR-2)
- ❌ Refactoring existing i18n structure

#### Acceptance Criteria
```gherkin
GIVEN a user views any page in the application
WHEN they switch language (en/pl)
THEN all placeholders, helper text, and empty states are translated
AND no hardcoded Polish strings remain in /src/components or /src/pages
AND ESLint rule prevents new hardcoded strings (optional enhancement)
```

#### Verification Commands
```bash
# Pre-flight
npm ci
npm run lint          # Must pass: 0 errors
npm test              # Must pass: 281/281
npm run build         # Must succeed

# i18n coverage check
grep -r "placeholder=" src/components/ | grep -v "t('"  # Should return 0 results
grep -r "Brak" src/components/ | grep -v "t('"          # Should return 0 results (Polish word "No")
grep -r "Dodaj" src/components/ | grep -v "t('"         # Should return 0 results (Polish word "Add")

# Post-merge
npm run type-check    # 0 TypeScript errors
```

---

### PR-7 (THIS PR): Roadmap Documentation
**Status**: ✅ IN PROGRESS (docs-only)
**Priority**: 🟢 LOW (Documentation)
**Estimated Effort**: 1 file (docs/ROADMAP.md)

#### Scope Fence
**Files to Change:**
- ✅ `docs/ROADMAP.md` (new, this file)

**OUT OF SCOPE:**
- ❌ Code changes (zero changes in src/, supabase/, workflows/)
- ❌ Config changes
- ❌ Refactoring

#### Verification Commands
```bash
git diff --stat              # Only docs/ROADMAP.md changed
npm run lint                 # Must pass (no code changed)
npm run build                # Must pass (no code changed)
```

---

## 🔒 QUALITY GATES (Every PR)

### Pre-Flight Checklist (MANDATORY)
Run these commands BEFORE starting any PR work:
```bash
# 1. Verify clean state
git status                    # Should show: "nothing to commit, working tree clean"

# 2. Install dependencies
npm ci --engine-strict=false  # (Node 22.x requires --engine-strict=false)

# 3. Run all checks
npm run lint                  # Target: 0 errors (warnings OK if <30)
npm run type-check            # Target: 0 TypeScript errors
npm test                      # Target: 281/281 passing
npm run build                 # Target: Build succeeds, dist/ created

# 4. Check recent commits
git log --oneline -10         # Verify main branch health
```

**STOP if any check fails.** Fix issues before starting PR work.

---

### CI/CD Workflows (Automated)
All PRs trigger 5 workflows:

| Workflow | File | Purpose | Required |
|----------|------|---------|----------|
| **CI Pipeline** | `.github/workflows/ci.yml` | lint → test → build (sequential) | ✅ YES |
| **E2E Tests** | `.github/workflows/e2e.yml` | Playwright smoke tests (4 suites) | ✅ YES |
| **Security Audit** | `.github/workflows/security.yml` | npm audit + CodeQL | ✅ YES |
| **Bundle Analysis** | `.github/workflows/bundle-analysis.yml` | Track bundle size | ⚠️ INFO |
| **Supabase Deploy** | `.github/workflows/supabase-deploy.yml` | Migrations + Edge Functions | Manual |

**Required Checks (must pass to merge):**
- ✅ CI: lint + test + build
- ✅ E2E: All smoke tests passing
- ✅ Security: npm audit level `high`, CodeQL clean
- ✅ TypeScript: 0 errors (strict mode)

---

### Code Review Standards
Before submitting PR:
- ✅ Self-review completed (read your own diff)
- ✅ Commit message follows convention: `<type>: <description>`
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`
  - Example: `feat(i18n): add i18n coverage to Projects page`
- ✅ PR description includes:
  - Summary of changes
  - Testing performed
  - Screenshots (if UI change)
  - Link to issue/task (if applicable)
- ✅ No console.log() statements (use logger utility)
- ✅ No commented-out code (delete it)
- ✅ No TODOs without context/issue link

---

## ⚠️ RYZYKA I ANTY-SCOPE

### What We DON'T Do (Scope Fence)
This roadmap explicitly **excludes**:
- ❌ **Biometric feature enhancements** — Optional, not blocking v1.0
- ❌ **New features** — Only finishing PR-4, no new features
- ❌ **Database schema changes** — PR-1 already migrated, no new migrations
- ❌ **Refactoring "while we're at it"** — Zero refactor without explicit approval
- ❌ **UI redesigns** — Existing UI is production-ready (A+ grade)
- ❌ **Performance tuning** — Already A+ (96/100), no further optimization needed
- ❌ **Dependency upgrades** — Not blocking, defer to maintenance window
- ❌ **Documentation rewrites** — Only roadmap + PR-specific docs

### STOP Conditions (When to Halt Work)
Stop work immediately if:
1. **2x Same Test Failure** — Same test fails twice in a row → investigate root cause
2. **Build Breaks on Main** — Main branch health degraded → rollback + fix
3. **Security Audit Fails** — npm audit finds HIGH/CRITICAL vuln → address first
4. **Missing Data** — Cannot verify PR success due to missing logs/evidence → gather data
5. **Out of Scope Detected** — Work drifts beyond defined scope → reassess with owner

### Risk Mitigation Table

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **PR-4B breaks i18n** | LOW | MEDIUM | All tests include i18n mocks, gradual rollout |
| **New hardcoded strings added** | MEDIUM | LOW | Code review catches, ESLint rule can be added |
| **Translation keys missing** | MEDIUM | MEDIUM | Pre-merge check: `grep "undefined" locales/*.json` |
| **Node version mismatch** | LOW | LOW | CI enforces Node 20.x, local uses `--engine-strict=false` |
| **E2E flaky tests** | MEDIUM | LOW | Retry logic in place, can disable if needed |
| **Bundle size increase** | LOW | LOW | Bundle analysis workflow tracks, 940KB is acceptable |

---

## 📊 EXPECTED IMPACT (Post-PR-4B Completion)

### Metrics: Before vs. After

| Metric | Before (Jan 2025) | After (Feb 2026) | Change |
|--------|------------------|------------------|--------|
| **i18n Coverage** | 70% (130/200 strings) | 100% (200/200 strings) | +30% ✅ |
| **Hardcoded Polish Strings** | ~70 remaining | 0 | -100% ✅ |
| **Multi-language Support** | Partial (errors/admin only) | Full (all UI) | Complete ✅ |
| **Production Readiness** | 90% (PR-4 blocker) | 100% (all PRs done) | +10% ✅ |
| **Test Coverage** | 281 tests | 281+ tests (i18n tests added) | Maintained ✅ |
| **Build Health** | 100% passing | 100% passing | Maintained ✅ |
| **Security Grade** | A (92/100) | A (92/100) | Maintained ✅ |
| **Overall Grade** | A+ (95/100) | A+ (95/100) | Maintained ✅ |

### Success Criteria (Definition of Done for Roadmap)
✅ **All PRs 1-6**: Merged and verified
⚠️ **PR-4B**: 50% complete, needs 2-3 days to finish
✅ **Quality Gates**: All checks passing (lint/test/build/E2E)
✅ **Documentation**: Roadmap (this file) + ATOMIC_PR_PLAN.md aligned
✅ **No Regressions**: Grade remains A+ (95/100)

---

## 🚀 NEXT ACTIONS

### Immediate (Owner/Team)
1. **Review this ROADMAP** — Approve scope for PR-4B
2. **Schedule PR-4B** — Allocate 2-3 days for completion
3. **Assign Work** — Who will complete remaining 6 components?

### For Claude Code (Next Session)
1. **Resume PR-4B** — Complete remaining i18n coverage (6 components)
2. **Follow Pre-Flight** — Run all checks before starting
3. **Verify Quality Gates** — Ensure 0 errors, 281/281 tests
4. **Create PR** — Small, focused PR with evidence

### Maintenance (Ongoing)
- **Weekly**: Run `npm audit --audit-level=high` (security.yml automates)
- **Monthly**: Review bundle size trends (bundle-analysis.yml tracks)
- **Quarterly**: Re-run comprehensive audit (update FINAL_GRADE_2026.md)

---

## 📚 REFERENCE DOCUMENTS

### Source Documents (Single Source of Truth)
- **ATOMIC_PR_PLAN.md** (root) — Original PR breakdown
- **REPO_HEALTH_AUDIT_2025-01-18.md** (root) — Health audit report
- **FINAL_GRADE_2026.md** (docs/) — A+ (95/100) grading
- **CLAUDE.md** (root) — Development standards and rules

### Supporting Documentation
- **COMPREHENSIVE_AUDIT_2026.md** (docs/) — Detailed technical audit
- **CI_STATUS.md** (docs/) — CI/CD pipeline status
- **PRODUCTION_READINESS.md** (docs/) — Deployment checklist
- **DEPLOYMENT_VERIFICATION_CHECKLIST.md** (docs/) — Pre-deploy verification

### Related PRs (GitHub)
- PR #121 — Admin Control Plane (feat: implement admin control plane with database-backed settings and audit logging)
- PR #122 — Critical i18n (feat: wrap critical i18n strings in error and success messages)
- PR #123 — Admin Panel i18n (feat: add admin panel i18n keys foundation)
- PR #124 — E2E & CI/CD Hardening (feat: CI/CD hardening and MVP verification)

---

## 🔐 SIGN-OFF

**Prepared By**: Claude Code Web (Session: claude/add-roadmap-docs-82rIq)
**Date**: February 3, 2026
**Status**: ✅ **READY FOR REVIEW**
**Next Step**: Owner approval → Schedule PR-4B completion

**Verification Hash** (for integrity):
```
git log --oneline -5:
91c3382 feat(security): harden admin panel with server-side RLS and dual-role authorization
8f1a91a feat(ci): harden E2E workflow and standardize security audit
92de880 feat(i18n): add i18n coverage to OfferApproval.tsx (PR-4A complete)
c4247f5 feat(i18n): add i18n coverage to Login.tsx (PR-4A partial)
3731d99 fix(p0): prevent runtime crashes in notifications/templates/offer-approval
```

**Repository Health**: ✅ All checks GREEN
**Production Ready**: ⚠️ 90% (PR-4B needed for 100%)

---

_This roadmap is the single source of truth for project planning. Update this document when PRs are completed or scope changes occur._
