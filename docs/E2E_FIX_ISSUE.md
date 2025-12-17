# Issue: Fix E2E Tests in CI

**Labels:** `bug`, `tests`, `technical-debt`
**Priority:** P3 (Low - doesn't block production)

## Problem

E2E tests (Playwright) hang indefinitely in GitHub Actions CI:
- Tests never stop running (infinite timeout)
- CI jobs must be manually cancelled
- Blocks PR merge unnecessarily

## Root Causes Identified

1. **Infinite Timeouts**
   - `page.waitForFunction()` has default timeout = 0 (infinite)
   - Need explicit timeouts on all async operations

2. **Network Activity**
   - Analytics/tracking requests prevent 'networkidle' state
   - React Query polling keeps page "loading"

3. **Routing Assumptions**
   - Tests assumed `/auth` route, app only has `/login`
   - Tests used CSS selectors instead of WCAG-compliant role selectors

## Attempted Fixes

All fixes in commits:
- `e53fc87`: React hydration helpers
- `075dd32`: Explicit timeouts + analytics blocking
- `d23a598`: Route fixes + role-based selectors + CodeQL compliance

**Status:** Tests still hang in CI (work fine locally)

## Current Workaround

E2E workflow changed to manual-only (`workflow_dispatch`):
- Doesn't block PRs
- Can be run manually when needed
- See: `.github/workflows/e2e.yml`

## Acceptance Criteria

- [ ] E2E tests run reliably in CI without hanging
- [ ] Tests complete within 5 minutes (currently: infinite)
- [ ] Tests use proper WCAG selectors (role-based)
- [ ] No false positives (tests fail only on real issues)
- [ ] Can re-enable automatic runs on PR/push

## Suggested Approach

1. **Investigate CI-specific issues**
   - Run with DEBUG mode: `DEBUG=pw:api npx playwright test`
   - Compare CI environment vs local
   - Check if issue is GitHub Actions specific

2. **Consider alternative strategies**
   - Use `page.waitForLoadState('load')` instead of 'networkidle'
   - Mock external services (analytics, Supabase, etc.)
   - Use fixture data instead of real backend

3. **Simplify tests**
   - Focus on critical paths only
   - Remove flaky tests
   - Use more robust selectors

## Resources

- Playwright docs: https://playwright.dev/docs/test-timeouts
- Related issue: microsoft/playwright#19835 (infinite waitForLoadState)
- CI logs: Check GitHub Actions runs on PR #48

## Related Files

- `e2e/smoke.spec.ts` - Main smoke tests
- `e2e/global-setup.ts` - Dev server setup
- `playwright.config.ts` - Playwright configuration
- `.github/workflows/e2e.yml` - CI workflow (now manual)

---

**Create this issue on GitHub:** Copy this content when creating the issue.
