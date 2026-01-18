# Atomic PR Roadmap
**Target Branch:** `claude/audit-repo-health-aCxR6`
**Review Date:** January 18, 2025
**Status:** Ready for implementation

---

## Overview
This roadmap breaks down repository hardening into atomic PRs following "No Green, No Finish" principles. Each PR is:
- **Independent** (can be merged individually)
- **Focused** (single responsibility)
- **Testable** (clear DoD acceptance criteria)
- **Traceable** (maps to findings in audit report)

---

## PR-1: Admin Control Plane (DB-Backed Settings + Audit Log)
**Severity:** 🔴 CRITICAL
**Type:** Security + Architecture
**Estimated Effort:** 400-500 LOC
**Timeline:** 5-7 days
**Blocks:** PR-2 (for consistency), production deployment

### Problem
Admin system settings (maintenance mode, feature toggles, rate limits, 2FA) stored ONLY in device localStorage:
- No RLS protection
- No cross-tab synchronization
- No audit trail
- Settings lost on browser clear
- Vulnerable to localStorage injection

### Solution
1. **New Migration:** `admin_system_settings` table
   - 22 system-wide configuration fields
   - RLS policy: only org admins can read/write
   - Timestamps: created_by, updated_by, created_at, updated_at

2. **New Migration:** `admin_audit_log` table
   - Tracks all admin changes (before/after values)
   - 30+ action types (login, config changes, etc.)
   - User context: user_id, ip_address, user_agent

3. **New Migration:** `admin_theme_config` table
   - 8 theme customization parameters
   - Version history for rollback capability
   - Per-organization themes

4. **Update Components:**
   - `AdminSystemSettings.tsx`: Replace localStorage with Supabase table
   - `AdminThemeEditor.tsx`: Add realtime subscriptions
   - Add audit logging wrapper utility

5. **Add Realtime Sync:**
   - Supabase realtime subscriptions
   - Cross-tab updates (edit in tab A, see in tab B)
   - Optimistic updates with rollback

### Files to Change
- `src/components/admin/AdminSystemSettings.tsx`
- `src/components/admin/AdminThemeEditor.tsx`
- `src/components/admin/AdminContentEditor.tsx`
- `supabase/migrations/[timestamp]_admin_control_plane.sql`
- `src/hooks/useAdminSettings.ts` (new)
- `src/integrations/supabase/admin.ts` (new)

### DoD (Definition of Done)
- [ ] All 3 tables created with correct RLS policies
- [ ] RLS tested: admins can read/write, non-admins cannot
- [ ] Audit log records all changes with before/after values
- [ ] localStorage keys removed from admin components
- [ ] Realtime subscriptions implemented
- [ ] Cross-tab synchronization tested (open 2 tabs, edit in tab A, verify in tab B)
- [ ] Theme rollback capability works (can revert to previous version)
- [ ] All existing tests pass
- [ ] New tests added for RLS policies + audit logging
- [ ] No console errors or warnings

### Testing
```bash
# Unit tests
npm test src/components/admin/

# Type check
npm run type-check

# Build
npm run build

# Integration test (manual)
# 1. Open admin panel in 2 tabs
# 2. Enable maintenance mode in tab A
# 3. Verify it updates in tab B immediately
# 4. Check audit_log table has entry
```

### Acceptance Criteria
```
GIVEN an admin changes system settings
WHEN the change is saved
THEN the change persists to admin_system_settings table
AND an entry is created in admin_audit_log
AND all other logged-in admins see the change immediately (realtime)
AND the change cannot be undone via localStorage (it's local-only now)
```

### Rollback Plan
If this PR causes issues:
1. Revert to previous commit
2. Settings will be read from localStorage as fallback
3. No data loss (audit log preserved)

---

## PR-2: Wrap Critical User-Facing Strings with i18n (P0)
**Severity:** 🟡 YELLOW (UI/UX focused, not blocking)
**Type:** i18n + Refactor
**Estimated Effort:** 300-400 LOC
**Timeline:** 3-5 days
**Depends On:** None (can run in parallel with PR-1)
**Blocks:** PR-3

### Problem
~90 critical user-facing strings (error messages, form labels, buttons) hardcoded in Polish, bypassing i18next `t()` function:
- App is effectively Polish-only (no i18n path for other languages)
- Users in English locale see Polish text
- Difficult to maintain/update copy

### Solution
1. **Extract Critical Strings:**
   - Error messages (toast.error, validation errors)
   - Form validation messages
   - Button text (Login, Register, Submit, Cancel, etc.)
   - Dialog titles/descriptions
   - Toast success/info messages

2. **Update i18n Config:**
   - Create namespace: `src/i18n/namespaces/errors.json`
   - Create namespace: `src/i18n/namespaces/auth.json`
   - Update `src/i18n/locales/en.json` with translations
   - Update `src/i18n/locales/pl.json` with Polish strings

3. **Update Components:**
   - Import `useTranslation` hook
   - Replace hardcoded strings with `t('namespace.key')`
   - Update toast messages to use i18n

### Files to Change
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- `src/components/settings/DeleteAccountSection.tsx`
- `src/components/voice/VoiceQuoteCreator.tsx`
- `src/components/offers/SendOfferModal.tsx`
- `src/pages/OfferApproval.tsx`
- `src/components/billing/BillingDashboard.tsx`
- `src/components/notifications/PushNotificationSettings.tsx`
- `src/i18n/namespaces/errors.json` (new)
- `src/i18n/namespaces/auth.json` (new)

### DoD
- [ ] All error toast messages use `t('errors.*')`
- [ ] All validation messages use `t('errors.*')`
- [ ] All button text uses `t('actions.*')`
- [ ] All dialog titles use `t('dialogs.*')`
- [ ] No hardcoded Polish strings remain in error/validation code
- [ ] English translations added to `locales/en.json`
- [ ] Polish translations added to `locales/pl.json`
- [ ] App works in both English and Polish locales
- [ ] Tests pass (mock i18n in test setup)
- [ ] No missing translation keys (no 'errors.undefined')

### Testing
```bash
# Type check
npm run type-check

# Build
npm run build

# Test locale switching
# 1. Open app
# 2. Change language to English (if language switcher exists)
# 3. Verify error messages are in English
# 4. Switch to Polish, verify messages are in Polish
```

### Acceptance Criteria
```
GIVEN a user triggers a form validation error
WHEN they see the error message
THEN the message is shown in the user's locale (en or pl)
AND the same message is not hardcoded in the component
AND both locales have the same message (translation)
```

---

## PR-3: Admin Panel Strings with i18n (P1)
**Severity:** 🟡 YELLOW
**Type:** i18n + Refactor
**Estimated Effort:** 200-300 LOC
**Timeline:** 2-3 days
**Depends On:** PR-2 (for consistency)
**Blocks:** PR-4

### Problem
~40 admin panel strings hardcoded (action labels, panel titles, descriptions) not translatable.

### Solution
1. Create `src/i18n/namespaces/admin.json`
2. Extract ACTION_LABELS from AuditLogPanel (30+ action types)
3. Extract admin panel descriptions/tooltips
4. Update components with `t()` wrapper

### Files to Change
- `src/components/admin/AuditLogPanel.tsx`
- `src/components/admin/AdminUsersManager.tsx`
- `src/components/admin/AdminCronManager.tsx`
- `src/i18n/namespaces/admin.json` (new)

### DoD
- [ ] All admin panel text uses `t()` function
- [ ] ACTION_LABELS moved from code to i18n config
- [ ] Admin descriptions/tooltips localized
- [ ] English translations for admin strings
- [ ] Polish translations match original strings
- [ ] Tests updated to mock i18n

---

## PR-4: Complete i18n Coverage (P2-P3)
**Severity:** 🟢 GREEN (Polish/UX improvement)
**Type:** i18n + Polish
**Estimated Effort:** 250-350 LOC
**Timeline:** 4-5 days
**Depends On:** PR-3
**Blocks:** None (but should complete before v1.0)

### Problem
~50 medium/low priority strings (placeholders, helper text, empty states, aria-labels) still hardcoded.

### Solution
1. Create namespaces: `offers.json`, `projects.json`, `settings.json`, `messages.json`
2. Extract remaining hardcoded strings
3. Add ESLint rule to prevent new hardcoded strings
4. Update all affected components

### Files to Change
- 8+ component files (placeholders, helpers)
- `src/i18n/namespaces/*.json` (4 new files)
- `.eslintrc` (new rule to catch hardcoded strings)

### DoD
- [ ] All user-visible text uses `t()`
- [ ] Placeholders localized
- [ ] Helper text localized
- [ ] Empty state messages localized
- [ ] Aria-labels localized for accessibility
- [ ] ESLint rule prevents new hardcoded strings
- [ ] 0 remaining hardcoded Polish strings in `/src/components`
- [ ] 0 remaining hardcoded Polish strings in `/src/pages`
- [ ] Build passes with new ESLint rule

---

## PR-5: E2E & CI/CD Hardening
**Severity:** 🟡 YELLOW (Maintenance)
**Type:** CI/CD + Maintenance
**Estimated Effort:** 100-150 LOC
**Timeline:** 2-3 days
**Depends On:** None (can run in parallel)
**Blocks:** None (improvement, not blocker)

### Problem
1. E2E tests are optional (not required check) - E2E regressions can be merged
2. npm audit levels inconsistent across workflows (moderate vs high)
3. E2E uses external demo.supabase.co - subject to uptime

### Solution
1. Add E2E tests to required CI checks
2. Align npm audit levels (both to `high`)
3. Document E2E determinism approach
4. Create guide for optional: dedicated Supabase test project

### Files to Change
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/e2e.yml`
- `docs/E2E_SETUP.md` (new guide)

### DoD
- [ ] E2E workflow added to required checks in ci.yml
- [ ] E2E workflow cannot be skipped
- [ ] npm audit levels consistent (both `high`)
- [ ] Documentation added for E2E determinism
- [ ] All CI workflows pass
- [ ] E2E guide explains demo vs dedicated project approach

---

## PR-6: Biometric Security Hardening (Optional)
**Severity:** 🟠 HIGH (Security polish)
**Type:** Security + Refactor
**Estimated Effort:** 150-200 LOC
**Timeline:** 2-3 days
**Depends On:** PR-1 (for audit log consistency)
**Blocks:** None (improvement)

### Problem
Biometric credential IDs stored in localStorage vulnerable to XSS exposure.

### Solution
1. Add server-side credential tracking table
2. Implement rate limiting on biometric auth attempts
3. Add CSP hardening
4. Add device fingerprinting for additional verification
5. Document biometric security model

### Files to Change
- `src/hooks/useBiometricAuth.ts`
- `src/integrations/supabase/biometric.ts`
- `supabase/migrations/[timestamp]_biometric_credentials.sql`
- CSP configuration

### DoD
- [ ] Rate limiting: max 5 attempts/minute per device
- [ ] CSP headers prevent XSS from exposing credentials
- [ ] Device fingerprinting implemented
- [ ] Server-side credential metadata table created
- [ ] Security audit passed
- [ ] Tests updated

---

## PR Merge Order & Timeline

### Fast Track (Blocks Production)
1. **Week 1:** PR-1 (Admin Control Plane) - 5-7 days
2. **Week 1-2:** PR-2 (Critical i18n) - 3-5 days (parallel with PR-1 part-way)
3. **Week 2:** PR-3 (Admin i18n) - 2-3 days
4. **Week 2-3:** PR-4 (Complete i18n) - 4-5 days

**Subtotal: 14-20 days to production-ready**

### Enhancements (After Production)
5. **Week 3+:** PR-5 (E2E Hardening) - 2-3 days
6. **Week 3+:** PR-6 (Biometric Security) - 2-3 days

---

## Parallel Development
- PR-2, PR-3, PR-4 can run in parallel during PR-1 review
- PR-5 can run independently at any time
- PR-6 can start after PR-1

---

## Quality Gates for Each PR

### Before Submitting Any PR
```bash
npm ci
npm run lint
npm run type-check
npm test
npm run build
```

### Before Merge
- [ ] Code review passed
- [ ] All tests passing (281+ tests)
- [ ] ESLint: 0 errors
- [ ] TypeScript: 0 errors
- [ ] No console warnings/errors
- [ ] Bundle size not increased (or justified)

---

## Risk Mitigation

| PR | Risk | Mitigation |
|----|------|-----------|
| PR-1 | Data migration | Migrations are additive, no deletes; can rollback |
| PR-2 | Missing translations | ESLint rule in PR-4 catches new hardcodes |
| PR-3 | Admin UX broken | Tests verify all admin panel strings work |
| PR-4 | Performance hit from i18n | i18n already loaded, just more strings |
| PR-5 | E2E false positives | Can disable if needed, not critical path |
| PR-6 | Biometric auth broken | Feature optional, rate limiting allows retry |

---

## Expected Impact Post-PRs

| Metric | Before | After |
|--------|--------|-------|
| Admin settings persistence | ❌ localStorage only | ✅ database + realtime |
| Audit trail for admins | ❌ none | ✅ full history with user context |
| i18n coverage | ❌ 70% (200 hardcoded strings) | ✅ 100% (all user-visible) |
| Multi-language support | ❌ Polish only | ✅ English + Polish (extensible) |
| Cross-tab admin sync | ❌ manual refresh | ✅ realtime (instant) |
| E2E required | ❌ optional | ✅ required check |

---

## Sign-Off

**Prepared by:** Claude Code (Evidence-based Audit)
**Status:** Ready for prioritization and execution
**Next Step:** Schedule PR-1 kickoff meeting

