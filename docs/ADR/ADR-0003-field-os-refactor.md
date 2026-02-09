# ADR-0003: Field OS Refactor - Architecture Decisions

**Status:** Proposed
**Date:** 2026-02-09
**Author:** Claude (Principal Product Engineer)

## Context

Majster.AI is a SaaS platform for construction professionals in Poland. The current codebase has:
- All routes at root level (no zone separation)
- Admin panel as a single tab-based page inside the customer app layout
- Visual identity with gradients, glows, and blur effects (gaming aesthetic)
- No public marketing landing page (/ redirects to /dashboard)
- No config-driven Owner Console

The mission is to transform it into an industrial-grade "Field Service Operating System" with strict routing zones, professional visual identity, and a config-driven owner console.

## Decisions

### D1: Three Routing Zones with Prefix Separation

**Decision:** Introduce `/app/*` prefix for customer routes, `/admin/*` for owner console, `/` for marketing.

**Rationale:** Clean separation enables:
- Independent code splitting (admin bundle not loaded for customers)
- Independent auth guards
- Clear mental model for developers
- SEO-friendly marketing zone without auth walls

**Trade-off:** Breaking change for all existing `/dashboard`, `/projects` etc. URLs. Mitigated with redirects.

### D2: Route Migration with Redirects

**Decision:** All old routes (e.g., `/dashboard`) will redirect to new routes (e.g., `/app/dashboard`) using `<Navigate replace>`.

**Rationale:** Prevents broken bookmarks and links. Redirects can be removed after transition period.

### D3: Preserve "projects" Terminology in Code, Display "Zlecenia" in UI

**Decision:** Keep `projects` as the internal code/data term. Map to `/app/jobs` in routes and "Zlecenia" in Polish UI.

**Rationale:** The domain concept for construction professionals is "jobs/orders" (zlecenia), not "projects". But changing all code references would be a massive refactor with high regression risk. Route + UI label change is sufficient.

### D4: Admin as Independent Route Zone with Own Layout

**Decision:** Move admin from a single page at `/admin` to a full route zone `/admin/*` with its own `AdminLayout` component and separate lazy-loaded pages.

**Rationale:**
- Code splitting: admin bundle stays separate from customer bundle
- Independent auth guard (owner_super_admin only)
- Expandable: each admin section gets its own route/page
- Clean separation of concerns

### D5: Industrial Visual Identity ("Digital Power Tool")

**Decision:** Replace current gradient/glow/blur aesthetic with industrial design tokens:
- Primary: Safety Amber `#F59E0B` (hsl 38 95% 52%)
- Chrome: slate-900
- White content surfaces
- Hard borders, no shadows except subtle card shadow
- No glow, no blur, no gradients

**Rationale:** Target users are construction workers using the app on job sites with gloves and sunlight. High contrast, obvious touch targets, and professional trust cues are essential. The current "premium SaaS" look signals consumer/gaming, not industrial B2B.

**Trade-off:** Significant CSS/token changes across the app. Mitigated by changing CSS variables at root level (theme tokens propagate automatically).

### D6: Config-Driven Owner Console

**Decision:** Implement a versioned, validated, recoverable configuration system for the Owner Console.

**Rationale:** The platform owner needs to control the product without code changes. Config-as-data with Zod validation, versioning, and rollback provides safety net.

### D7: Reuse Existing Auth System

**Decision:** Extend existing `useAuth()` + `useAdminRole()` hooks rather than replacing them.

**Rationale:** The auth system is mature, uses Supabase Auth correctly, and has biometric support. The `user_roles` table already supports role-based access. We just need to distinguish `owner_super_admin` from existing `admin` role for the `/admin` zone guard.

### D8: Keep Existing UI Component Library

**Decision:** Continue using the existing 40+ shadcn/ui components in `src/components/ui/`.

**Rationale:** They're well-implemented, accessible, and consistent. The industrial redesign changes tokens/variables, not component structure.

### D9: Consolidate Toast System

**Decision:** Standardize on Sonner for all toast notifications. Remove dual Toaster setup.

**Rationale:** Currently both `@/components/ui/toaster` (shadcn) and `@/components/ui/sonner` are mounted in App.tsx. Sonner is more capable (actions, promises, custom renders). One system reduces confusion.

### D10: Mock Data Layer for Owner Console

**Decision:** Create `src/data/mockData.ts` and `src/data/dataProvider.ts` for the config-driven features.

**Rationale:** Owner Console config data (navigation, plans, content) needs a single source of truth that can later be backed by Supabase tables. Starting with local state + localStorage is the right MVP approach.

## Proactive Enterprise Additions

### Added: Redirect Layer for Route Migration
Standard practice for URL migrations in production apps. All old routes get `<Navigate replace>` to new `/app/*` equivalents.

### Added: AdminLayout with Sidebar Navigation
Owner Console deserves its own layout with a persistent sidebar (not tabs on a single page) for better navigation at scale.

### Added: ConfigProvider with Error Recovery
Wrapping the app in a ConfigProvider that validates config on load and falls back to last-known-good if invalid. Industry standard for config-driven apps.

### Added: Online/Offline Indicator
Construction sites have unreliable connectivity. Showing connection status is essential for trust.

## Threat Model Lite

| Risk | Severity | Mitigation |
|------|----------|------------|
| XSS via config content | High | Zod validation, no dangerouslySetInnerHTML, text-only content fields |
| Config injection | Medium | Strict Zod schema, URL allowlist for logo/links |
| Auth bypass (/admin) | Critical | Separate route guard checking owner_super_admin role from user_roles table |
| Privilege escalation | High | Role check at route level AND component level. No client-side role assignment |
| Data leakage (admin data to customers) | High | Code splitting ensures admin bundle not loaded for customers. API calls use RLS |
| Config corruption | Medium | Versioned config with rollback. Last-known-good fallback. Reset to defaults option |

## Migration Strategy

### Phase 1: Foundation (This PR)
- Contract documents
- Route zone restructuring with redirects
- AdminLayout skeleton
- Industrial theme tokens (CSS variable swap)
- ConfigProvider skeleton

### Phase 2: Owner Console Pages
- Config editor, theme editor, navigation editor
- Plans editor, content editor
- Audit log + rollback

### Phase 3: Field Features
- Job detail enhancements (photo proof, voice memo, status workflow)
- Optimistic UI for status changes
- Skeleton screens for all pages

### Phase 4: Polish
- Remove old redirects
- Performance audit
- Accessibility audit
