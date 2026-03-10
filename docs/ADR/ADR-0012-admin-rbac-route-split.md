# ADR-0012: Admin / App Route Split and RBAC Enforcement

**Date:** 2026-03-10
**Status:** Accepted
**Deciders:** RobertB1978, Claude Sonnet 4.6

---

## Context

Audit findings identified that admin-like functionality was mixed into the main user experience and lacked a formally documented access-control model.

---

## Decision

### Route Zones

| Zone | Path prefix | Auth required | Role required |
|------|------------|---------------|---------------|
| Public | `/`, `/login`, `/register`, `/legal/*`, `/offer/*`, `/a/*`, `/p/*`, `/d/*` | No | None |
| App | `/app/*` | Yes (any authenticated user) | None beyond valid session |
| Admin console | `/admin/*` | Yes | `user_roles.role = 'admin'` |

### Role Model

Roles are stored in the `public.user_roles` table (one row per user per role):

| Role | Table | Scope | Can access `/admin/*` |
|------|-------|-------|-----------------------|
| `admin` | `user_roles` | Platform-wide | **Yes** |
| `moderator` | `user_roles` | Platform-wide | No |
| `owner` / `admin` / `member` | `organization_members` | Per-org | No |
| (no role) | — | — | No |

Only `user_roles.role = 'admin'` is required to enter the Owner Console.

### Enforcement layers

1. **Route guard**: `AdminLayout` wraps all `/admin/*` routes. It renders `AdminGuard` which:
   - Redirects unauthenticated users → `/login`
   - Redirects authenticated non-admin users → `/app/dashboard`
   - Shows a loading skeleton while roles are being fetched
2. **DB/RLS**: `user_roles` table has Row Level Security enabled. Users can only read their own roles (`auth.uid() = user_id`).
3. **Navigation**: The admin shield icon in `TopBar` is conditionally rendered only when `isAdmin === true`. `MobileBottomNav` and `Navigation` contain no admin links.
4. **Granting admin**: Done exclusively via `public.grant_admin_role(email)` — a `SECURITY DEFINER` function callable only by service_role. `anon` and `authenticated` roles cannot invoke it.

### Files

| File | Role |
|------|------|
| `src/components/layout/AdminGuard.tsx` | Route guard (redirect logic) |
| `src/components/layout/AdminLayout.tsx` | Layout wrapper for `/admin/*` |
| `src/hooks/useAdminRole.ts` | Queries `user_roles`, exposes `isAdmin` |
| `src/components/layout/TopBar.tsx` | Admin icon — visible only to `isAdmin` |
| `supabase/migrations/20251206221151_*` | Creates `user_roles` table + RLS |
| `supabase/migrations/20260208190000_grant_admin_role_function.sql` | Service-only grant/revoke helpers |
| `src/test/components/AdminGuard.test.tsx` | Component-level RBAC tests |
| `src/test/features/admin-access.test.ts` | Role-logic unit tests |

### Legacy note

`src/pages/Admin.tsx` is dead code — it is **not mounted** in `App.tsx` and is not reachable via any URL. It contains its own internal guard but that guard is irrelevant since the file is unrouted.

---

## Consequences

- `/admin/*` routes are inaccessible to all users who lack `user_roles.role = 'admin'`.
- Normal users (and moderators, org admins) see no admin navigation elements.
- `/app/*` routes remain fully accessible to any authenticated user.
- Adding a new admin requires a direct call to `grant_admin_role()` from the Supabase SQL editor — no UI-based escalation is possible.
