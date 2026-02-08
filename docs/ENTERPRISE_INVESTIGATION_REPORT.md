# Enterprise Investigation Report

**Date:** 2026-02-08
**Branch:** `claude/enterprise-investigation-fixes-s0uaD`

---

## P0-A: Analytics "CardHeader is not defined" Crash

### Root Cause

Commit `b2e3ea4` ("Claude/frontend audit 2 ol ss #99") performed a mass ESLint
cleanup that enabled `@typescript-eslint/no-unused-vars` and auto-renamed ~50
imports across the codebase. In `src/pages/Analytics.tsx`, the import:

```typescript
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
```

was changed to:

```typescript
import { Card, CardContent, _CardHeader, _CardTitle, CardDescription } from '@/components/ui/card';
```

The JSX still referenced `<CardHeader>` and `<CardTitle>` (un-prefixed), so at
runtime the browser threw `ReferenceError: CardHeader is not defined`.

The same class of bug hit other pages:
- `src/pages/Clients.tsx` — fixed in `88d9be3`
- `src/pages/Marketplace.tsx` — fixed in `1c9add9`
- Other pages with `Badge`, `lucide-react` icons — fixed in `143ba55`

### Fix

- Import names were restored in commit `a4fe476`.
- The current code on `main` is **correct** — no remaining `_CardHeader`-style
  broken imports exist (`grep` across `src/` confirms zero matches).

### Prevention

1. **Regression test added:** `src/test/components/card-exports.test.tsx`
   verifies every named export from `card.tsx` is defined and renderable.
2. **Analytics smoke test added:** `src/test/components/analytics-smoke.test.tsx`
   renders the full Analytics page with mocked data and asserts:
   - KPI cards render with correct numbers
   - All 4 `CardHeader` sections are present in the DOM
   - No crash occurs during rendering
3. **ESLint config already correct:** The rule
   `@typescript-eslint/no-unused-vars` with `varsIgnorePattern: "^_"` does NOT
   auto-fix (it cannot safely rename variables). The original issue was manual
   renaming during the audit. The parser correctly identifies JSX usage.

---

## P0-B: /admin Access — Redirect to /dashboard

### How It Works

The admin panel at `/admin` (`src/pages/Admin.tsx`) checks two role sources:

| Source | Table | Roles | Hook |
|--------|-------|-------|------|
| Platform admin | `user_roles` | `admin`, `moderator` | `useAdminRole()` |
| Organization admin | `organization_members` | `owner`, `admin` | `useOrganizationAdmin()` |

Access is granted if **any** of these conditions is true:
```typescript
const hasAdminAccess = isAppAdmin || isModerator || isOrgAdmin;
```

Non-admin users are redirected via `useEffect`:
```typescript
if (!isLoading && !hasAdminAccess) {
  navigate('/dashboard');
}
```

The TopBar shield icon (link to /admin) only appears for users with
`isAdmin || isModerator` from `useAdminRole()`.

### Why a User Gets Redirected

A user is redirected if:
1. They have **no row** in `user_roles` with `role = 'admin'` or `role = 'moderator'`
2. They are **not** an `owner` or `admin` in any organization via `organization_members`

### How to Grant Admin Access

A new migration (`supabase/migrations/20260208190000_grant_admin_role_function.sql`)
provides two SQL functions:

**Grant admin:**
```sql
SELECT public.grant_admin_role('projektybiznes1978@gmail.com');
```

**Revoke admin:**
```sql
SELECT public.revoke_admin_role('projektybiznes1978@gmail.com');
```

**Where to run:** Supabase Dashboard → SQL Editor → New Query → paste and run.

These functions are `SECURITY DEFINER` and are **not callable** from the frontend
(execution is revoked from `anon` and `authenticated` roles). They can only be
run from the SQL Editor or via the service_role key.

### Security Verification

- RLS on `user_roles` is unchanged and enforced.
- Non-admin users still get redirected to `/dashboard`.
- Admin users see all 8 admin tabs (Dashboard, Users, Theme, Content, Database,
  System, API, Logs).
- The `grant_admin_role` function validates the email exists in `auth.users`
  before inserting.

---

## P1: UI Differences Between Accounts

### Summary

The UI differences between accounts are **intentional and by design**. There is
no bug causing inconsistency — the app uses multiple documented mechanisms to
customize the experience per user.

### Variation Mechanisms

| # | Mechanism | Controlled By | Scope | Key Files |
|---|-----------|---------------|-------|-----------|
| 1 | **Plan-based feature gating** | `subscription_plans` table | Per user | `src/hooks/usePlanGate.ts`, `src/hooks/useSubscription.ts` |
| 2 | **Ad banners** | Plan tier (free only) | Per plan | `src/components/ads/AdBanner.tsx`, `src/pages/Dashboard.tsx` |
| 3 | **Admin panel access** | `user_roles` + `organization_members` | Per role | `src/hooks/useAdminRole.ts`, `src/pages/Admin.tsx` |
| 4 | **Admin shield icon in TopBar** | `user_roles` (admin/moderator) | Per role | `src/components/layout/TopBar.tsx:113` |
| 5 | **Organization theming** | `admin_theme_config` table | Per org | `src/hooks/useAdminTheme.ts` |
| 6 | **Onboarding modal** | Profile completeness | Per user | `src/hooks/useOnboarding.ts` |
| 7 | **Light/Dark theme** | `localStorage('theme')` | Per browser | `src/hooks/useTheme.ts` |
| 8 | **Subscription expiry alerts** | Subscription state | Per user | `src/hooks/useExpirationMonitor.ts` |

### Detail: Plan-Based Feature Gating

The `usePlanGate` hook defines feature access per plan tier:

- **Free:** Basic project/client management only
- **Pro/Starter:** + Excel export, team features
- **Business:** + AI, voice, documents, marketplace, advanced analytics, photos, OCR
- **Enterprise:** + API access, custom templates, unlimited projects/clients

Features are **hidden or disabled** (not removed) for lower tiers, with upgrade
prompts shown.

### Detail: Organization Theming

Organization admins can customize:
- Primary and accent colors (HSL values)
- Border radius, font size, font family, spacing

These are stored in `admin_theme_config` per organization and applied via
CSS custom properties in real-time (Supabase realtime subscription).

### Detail: Ad Banners

Free-tier users see rotating ad banners on the Dashboard. These are suppressed
for paid plans. Controlled by `showAds` flag derived from subscription status.

### Resolution

No fix needed — the variations are controlled by well-defined flags stored in
the database. The main categories are:

1. **Role-based** (admin/moderator/user) → controls admin access
2. **Plan-based** (free/pro/business/enterprise) → controls feature availability
3. **Org-based** (theme config) → controls visual appearance
4. **User preference** (dark/light mode) → persisted in localStorage

If two accounts appear visually different, check:
1. Are they on the same subscription plan? (`subscriptions` table)
2. Are they in the same organization? (`organization_members` table)
3. Does the organization have custom theming? (`admin_theme_config` table)
4. Is one account an admin? (`user_roles` table)
5. Do they have different theme preferences? (localStorage `theme` key)

---

## Files Changed

| File | Change |
|------|--------|
| `src/test/components/card-exports.test.tsx` | NEW — Regression test for card exports |
| `src/test/components/analytics-smoke.test.tsx` | NEW — Analytics page smoke test |
| `supabase/migrations/20260208190000_grant_admin_role_function.sql` | NEW — Admin role grant/revoke functions |
| `docs/ENTERPRISE_INVESTIGATION_REPORT.md` | NEW — This report |

## Quality Gates

All must pass before merge:
- `npm run build` — clean build
- `npx tsc --noEmit` — no type errors
- `npm run lint` — no lint errors
- `npm test` — all tests pass (including new regression tests)
