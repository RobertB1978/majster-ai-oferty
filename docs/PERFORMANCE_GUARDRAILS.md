# PERFORMANCE GUARDRAILS — Majster.AI

**Status:** ACTIVE — PR4 governance document
**Created:** 2026-03-09
**Sprint context:** Protects gains from Performance Sprint PR1–PR3
**Owner:** Required reading for any PR touching src/pages/, src/hooks/, src/components/, vite.config.ts

---

## TL;DR (for every PR author)

Before opening a performance-sensitive PR, answer these five questions:

1. Did I add a heavy static import to the startup path? → STOP, lazy-load it.
2. Did I write `select('*')` in a new hook or query? → STOP, list only needed columns.
3. Did I set `staleTime: 0` on a query without a documented reason? → STOP, justify it.
4. Did I add an animation longer than 200 ms? → STOP, reduce duration.
5. Did I run `npm run check:perf` and review its output? → If not, do it.

---

## 1. Startup Path Discipline

### What is the startup path?

The startup path is everything the browser must parse and execute before the
app becomes interactive. In this repo it is:

```
src/main.tsx
  └── src/App.tsx
        └── src/components/layout/AppLayout.tsx
              └── src/components/layout/PageTransition.tsx (lazy wrapper)
```

### Rules

| Rule | Enforcement |
|---|---|
| No new static imports of heavy libraries in `App.tsx`, `AppLayout.tsx`, or `main.tsx` | Manual — `npm run check:perf` will warn |
| Heavy libs must be in named lazy chunks (see §2) | Manual |
| Adding any import to the startup path requires documenting the reason in the PR description | Process |

### Known heavy libraries (must stay lazy)

| Library | Chunk | Load trigger |
|---|---|---|
| `framer-motion` | `framer-motion-vendor` | After first render (PageTransitionAnimated) |
| `jspdf` + `jspdf-autotable` | `pdf-vendor` | On-demand (PDF button click) |
| `leaflet` | `leaflet-vendor` | On-demand (Team/Map page) |
| `recharts` | `charts-vendor` | Lazy-loaded (Analytics page) |
| `exceljs` | `exceljs.min` | On-demand (CSV/Excel export) |
| `html2canvas` | separate chunk | On-demand (PDF screenshot) |

### Baseline (post-PR1–PR3, measured 2026-03-09)

Measured after Performance Sprint PR1 (lazy loading) + PR2 (query optimization) + PR3 (CLS fix):

| Chunk | Raw | Gzip |
|---|---|---|
| `index.js` (main bundle) | 750.70 kB | 231.12 kB |
| `exceljs.min.js` | 937.03 kB | 270.79 kB (lazy) |
| `charts-vendor.js` | 420.59 kB | 113.50 kB (lazy) |
| `pdf-vendor.js` | 418.19 kB | 136.42 kB (lazy) |
| `framer-motion-vendor.js` | 114.32 kB | 37.80 kB (lazy) |

Sprint baseline (before PR1): `index.js` was **816.89 kB raw / 248.89 kB gzip**

**Anti-regression targets:**

- Main bundle gzip: **≤ 245 kB** (current: 231.12 kB — 15 kB headroom)
- A PR that increases main bundle gzip by **more than +10 kB** requires documented justification and `npm run build:analyze` output in the PR description.

---

## 2. Heavy Library Policy

### Adding a new library

Before adding any npm dependency that produces a chunk > 100 kB uncompressed:

1. Check if a lighter alternative exists.
2. Check if it can be lazy-loaded (dynamic import / React.lazy).
3. Add it to a named manual chunk in `vite.config.ts`.
4. Document it in this file under §1 "Known heavy libraries".

### Banned dependencies (per docs/BUNDLE_POLICY.md)

| Banned | Use instead |
|---|---|
| `moment` | `date-fns` |
| `lodash` (CJS) | `lodash-es` or native ES6 |
| `axios` | native `fetch` |

### Watch list (heavy but approved)

Monitor these if adding new features that use them:

- `@supabase/supabase-js` — required, currently ~178 kB raw
- `recharts` — required for charts, ~421 kB raw (lazy-loaded)
- `html2canvas` — required for PDF, ~201 kB raw (lazy-loaded)

---

## 3. Lazy Loading Policy

### Routes

All routes in `App.tsx` must use `React.lazy()` + `<Suspense>`.
A direct import of a page component in the route list is a regression.

### Heavy feature components

Any component that imports a library from §1 must itself be lazy-loaded at its
mount point. Pattern:

```typescript
// CORRECT: lazy entry point isolates heavy lib
const PdfExportButton = React.lazy(() => import('./PdfExportButton'));

// WRONG: static import pulls heavy lib into startup bundle
import PdfExportButton from './PdfExportButton';
```

### NotificationCenter

`NotificationCenter` is deferred (not in initial render). Do not move it to
eager import without documenting the reason.

---

## 4. Query Column Policy

### Rule: `select('*')` is forbidden in new code

New hooks and queries MUST list specific columns. Using `select('*')` wastes
bandwidth and transfer quota (Supabase free tier: 500 MB/month).

```typescript
// FORBIDDEN in new code:
supabase.from('projects').select('*')

// REQUIRED in new code (list only what is rendered):
supabase.from('projects').select('id, project_name, status, created_at, clients(id, name)')
```

### Pre-existing footprint (grandfathered before PR4)

The codebase has approximately 43 pre-existing `select('*')` occurrences in
hooks and pages at the time of PR4. These are **grandfathered** — they existed
before the column-selection discipline was introduced in Performance Sprint PR2.

When `npm run check:perf` reports findings, check:
1. Is this occurrence in the list below? → Grandfathered, no action needed.
2. Was it added by your PR? → Replace with explicit columns.

**Key grandfathered hooks** (representative, not exhaustive):

| File | Notes |
|---|---|
| `src/hooks/useProjects.ts` | `useProjects()` deprecated — kept for Dashboard/Analytics |
| `src/hooks/useClients.ts` | `useClients()` deprecated — kept for Dashboard |
| `src/hooks/useItemTemplates.ts` | import dialog — small dataset, infrequent |
| `src/hooks/useQuotes.ts` | detail fetch — all columns may be needed |
| `src/hooks/useProfile.ts` | profile load — all user fields may be needed |
| `src/hooks/useSubscription.ts` | subscription record — small table |
| `src/pages/legal/GDPRCenter.tsx` | GDPR export — intentionally fetches all data |

**Future improvement (not in PR4):** Replace remaining high-traffic
`select('*')` uses in hooks like `useCalendarEvents`, `useWorkTasks`,
`useNotifications` with explicit column lists when those hooks are next modified.

### How to add a justified exception

If `select('*')` is genuinely needed:
1. Add a comment in code: `// PERF-EXCEPTION: reason here`
2. Add an entry to the table above in this file
3. Include the justification in the PR description

### Verification

Run `npm run check:perf` before submitting a PR. It will list all `select('*')`
occurrences in `src/hooks/` and `src/pages/` for review.

---

## 5. staleTime / Cache Policy

### Defaults (App.tsx QueryClient)

```typescript
defaultOptions: {
  queries: {
    staleTime: 1000 * 60 * 5,   // 5 minutes — do NOT lower globally
    gcTime: 1000 * 60 * 30,     // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  },
},
```

These defaults are correct. **Do not lower `staleTime` globally.**

### Per-query overrides — rules

| Scenario | Allowed staleTime | Notes |
|---|---|---|
| Public pages (no auth) | ≥ 5 min | OfferApproval, OfferPublicPage, ProjectPublicStatus |
| Analytics/stats | 15 min | Heavy aggregation — cache aggressively |
| Dashboard stats | 5 min | Default is correct |
| List data (projects, clients) | 5 min (default) | Pagination already limits transfer |
| Modal/sheet queries | > 0 | See §6 |

### `staleTime: 0` is forbidden without documented reason

Setting `staleTime: 0` forces a network request every time the component
mounts. This is almost never correct for authenticated app data.

Known accepted exceptions (grandfathered at time of PR4):

| File | Reason |
|---|---|
| `src/test/utils.tsx` | Test utility QueryClient — tests require stale data to always refetch |
| `src/pages/OfferPublicAccept.tsx` | Public acceptance page — intentional refetch to ensure token freshness |

---

## 6. Modal Mount / Modal Fetch Policy

### Rules

1. Modals must NOT prefetch data before they are opened.
2. Data fetching inside a modal must be triggered by the open event, not on
   parent mount.
3. If a modal query must override the default staleTime, the reason must be
   documented in code and in this file.

### Pattern to follow

```typescript
// CORRECT: fetch only when modal is open
function OfferPreviewModal({ projectId, open }: Props) {
  const { data } = useQuery({
    queryKey: ['offer-preview', projectId],
    queryFn: () => fetchOfferPreview(projectId),
    enabled: open,           // ← only fetches when modal is open
    staleTime: 1000 * 60 * 5, // ← use default, not 0
  });
}

// WRONG: staleTime: 0 causes refetch on every open
const { data } = useQuery({
  queryKey: ['offer-preview', projectId],
  staleTime: 0,             // ← forced refetch = bad
  enabled: open,
});
```

---

## 7. Animation Ceiling

All animations in the app must respect these ceilings:

| Element | Max duration | Current status |
|---|---|---|
| Sheet / drawer open | 200 ms | ✅ Fixed in PR3 |
| Sheet / drawer close | 150 ms | ✅ Fixed in PR3 |
| Content fade-in | 200 ms | ✅ Fixed in PR3 |
| Page transition | 200 ms | ✅ Enforced in PageTransition |
| Toast appear | 150 ms | ✅ Sonner default |

### Rules

- No new animation duration > 200 ms without approval.
- All animated components must check `prefers-reduced-motion` via Tailwind
  `motion-safe:` / `motion-reduce:` or `useReducedMotion()` from framer-motion.
- Do not add infinite-loop animations outside of explicit loading states.

---

## 8. Lazy Tabs / Heavy Section Policy

### Rules

- Any tab panel that contains charts (Recharts) must render its chart lazily —
  either via `React.lazy` or by mounting only when the tab is active.
- Analytics page is already lazy-loaded as a route. Maintain this.
- Do not add Recharts imports to pages that do not already use them.
- Heavy table components (> 100 rows) require pagination (already implemented
  for Projects, Clients, ItemTemplates).

### Pagination policy (established in Performance Sprint A)

| Page | Page size | Method |
|---|---|---|
| Projects | 20 items | Server-side pagination |
| Clients | 20 items | Server-side pagination |
| ItemTemplates | 20 items | Server-side pagination |

Adding a new list page with > 20 items without pagination requires explicit
approval and a performance note in the PR.

---

## 9. Repeat-Visit Cache Policy

### Public pages (unauthenticated)

Pages accessible without login (offer approval, public project status) must:
- Use `staleTime` ≥ 5 min (no stale-bypassing on each visit).
- Use `sessionStorage` or `queryClient` cache for approval tokens (not
  re-fetching on each render).

Status: ✅ Fixed in PR3 (offer-approval token cached in sessionStorage).

### Authenticated pages

Repeat navigation to the same route should serve cached data (no spinner on
back-navigation). The 5-min default staleTime achieves this. Do not override
it downward for list pages.

---

## 10. Smoke-Test Requirement for Critical Business Flows

Before merging any PR that touches these flows, a manual smoke test is **required**:

| Flow | Key actions to verify |
|---|---|
| Create offer | New project → create quote → save quote |
| Send offer | Open project → Send Offer → fill email → send |
| Approve offer | Open public approval link → click Approve |
| Generate PDF | Open project → PDF preview → download |
| Create client | New client form → save → appear in client list |
| Auth (login) | Login page → credentials → reach dashboard |

Document the smoke test result in the PR description under the "Dowody / weryfikacja" section.

---

## 11. Preview / Vercel Verification Requirement

For any PR that is **performance-sensitive**, the following evidence is
required before merge:

### What counts as performance-sensitive

- Changes to `vite.config.ts` (chunks, build settings)
- New heavy library added
- New static import in startup path files
- Changes to React Query global config
- Changes to animation duration or CSS transitions
- Changes to route-level lazy loading

### Required evidence

1. **Build output** — paste chunk sizes from `npm run build`
2. **Bundle delta** — before vs after for main bundle (gzip)
3. **Vercel preview** — deploy PR to Vercel preview, link in PR description
4. **Smoke test** — confirm critical flows work on the preview URL

---

## 12. Anti-Regression Automation Summary

### Automated (CI — required to pass before merge)

| Check | Command | CI Job |
|---|---|---|
| Lint | `npm run lint` | `Lint & Type Check` |
| TypeScript | `npm run type-check` | `Lint & Type Check` |
| Unit tests | `npm test` | `Run Tests` |
| Production build | `npm run build` | `Build Application` |
| Bundle analysis | `npm run build:analyze` | `Bundle Analysis` (advisory) |

### Advisory (manual — run before opening PR)

| Check | Command | What it catches |
|---|---|---|
| Perf regression scan | `npm run check:perf` | `select('*')` regressions, heavy startup imports |

### Process-only (cannot be automated safely)

| Rule | Enforcement method |
|---|---|
| Smoke test critical flows | PR checklist (§10) |
| Vercel preview evidence | PR checklist (§11) |
| Animation ceiling | Code review |
| staleTime: 0 ban | Code review + `check:perf` warning |
| New heavy lib approval | Code review |

---

## 13. Deferred Automations (too brittle now)

These were considered for PR4 but deferred because they would create
unacceptable false-positive rates or require significant maintenance:

| Automation | Why deferred | What is needed to enable it |
|---|---|---|
| Hard CI gate on `select('*')` | ~3 legitimate existing uses; grep-based check can't distinguish list vs detail contexts | Codemod to annotate exceptions, then check unannotated occurrences |
| Automated startup-path import check | Import graph changes with refactors; AST-based check needed | Build a Vite plugin or use dependency-cruiser with custom rules |
| Bundle size diff bot | Needs a committed baseline JSON and GitHub Actions permissions to comment on PR | Create baseline JSON artifact, add bot workflow |
| Lighthouse score gate | Requires headless Chrome in CI, network conditions vary | Add `npx lighthouse-ci` with LHCI server or static budget |

---

## Revision Policy

This document must be updated when:
- A new heavy library is added → update §1 and §2
- A new `select('*')` exception is approved → update §4
- A new `staleTime: 0` exception is approved → update §5
- Animation ceiling changes → update §7
- A new critical business flow is identified → update §10
- A deferred automation is implemented → move from §13 to §12

**Last updated:** 2026-03-09 (PR4 — initial version)
