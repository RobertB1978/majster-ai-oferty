# PERFORMANCE GUARDRAILS

> **PR4 — Governance document. Created: 2026-03-09. Do not delete or weaken.**
>
> This document defines performance rules for Majster.AI, based on gains from the
> PR1–PR3 performance sprint. Its purpose is to prevent silent regressions.

---

## Background — What PR1–PR3 Fixed

| PR | Change | What it prevents |
|----|--------|-----------------|
| PR1 | Lazy-load Recharts/AnalyticsCharts; defer NotificationCenter; remove AnimatePresence `mode="wait"` | Heavy chart code on startup; serialized route transitions |
| PR2 | Replace `select('*')` with explicit columns in 14 read queries across 6 hooks | Over-fetching DB data; unnecessary payload to client |
| PR3 | Replace `transition-all duration-200 + translate-y-4` with `transition-opacity duration-150` in AppLayout; cache offer-approval tokens via `useQuery` | CLS on every page load; redundant token fetch on every modal open |

These gains can silently regress if the rules below are not followed.

---

## Rules

### RULE 1 — Startup Path Discipline

**The startup path is:** `src/main.tsx` → `src/App.tsx` → auth-gated shell.

**Banned from startup path:**
- `recharts` (420 kB gzip 114 kB)
- `jspdf` / `pdf-vendor` (418 kB gzip 136 kB)
- `html2canvas` (201 kB gzip 47 kB)
- `exceljs` (937 kB gzip 271 kB)
- Any library > 50 kB gzip that is not required for every user on every page.

**Required pattern:** Use `React.lazy()` + `Suspense` for any such dependency.

**Check:** `scripts/check-perf-guardrails.sh` (advisory) — reports if any banned library
appears as a top-level eager import in `App.tsx` or `main.tsx`.

**Baseline:** After PR1, `recharts` is removed from the Analytics page's eager imports
and lives only inside `AnalyticsCharts.tsx` (lazy boundary).

---

### RULE 2 — Heavy Library Policy

| Library | Allowed location | Banned location |
|---------|-----------------|-----------------|
| `recharts` | Lazy-loaded component inside chart boundary | `App.tsx`, startup path, eager page imports |
| `jspdf` | Lazy-loaded PDF generator | `App.tsx`, startup path |
| `html2canvas` | Lazy-loaded PDF generator | `App.tsx`, startup path |
| `exceljs` | Lazy-loaded export utility | `App.tsx`, startup path |
| `leaflet` | Already isolated in vendor chunk | Must not bleed into main chunk |

Adding any library > 100 kB (raw) requires:
1. Documented justification in the PR description.
2. Evidence that it does not increase the `index-*.js` main chunk gzip size.
3. Approval from project owner.

---

### RULE 3 — Lazy Loading Policy

**Scope:** All application pages that are behind authentication.

**Required:** Every authenticated page route must be a `React.lazy()` import.

**Exception:** Auth pages (`Login`, `Register`) stay eager — they are the first thing
users see and must not add a lazy-load waterfall to the authentication flow.

**Evidence of compliance:** `src/App.tsx` — all routes inside `<AuthRoute>` must use
`const Page = lazy(() => import("./pages/Page"))`.

**Lazy tabs / heavy sections:** Any tab panel or section that renders a heavy component
(charts, PDF preview, map) must also be lazy-loaded or conditionally rendered only
when the tab is active. Do not mount heavy components in hidden tabs.

---

### RULE 4 — Query Column Policy (no `select('*')` in read hooks)

**Rule:** Read queries (list, single-item fetch, token fetch) must enumerate
explicit column names.

**Allowed exceptions:**
- Mutation queries (`.insert()`, `.update()`, `.upsert()`) may use `select('*')` to
  return the full updated row; these are one-shot and not repeated on every render.
- Tests / Supabase admin utilities.

**Violation pattern:**
```typescript
// ❌ BANNED in read hooks
.from('projects').select('*')

// ✅ REQUIRED
.from('projects').select('id, project_name, status, created_at, client_id, clients(id, name)')
```

**Check:** `scripts/check-perf-guardrails.sh` reports all `select('*')` occurrences
in `src/hooks/` and `src/pages/` as advisory warnings. Mutations are excluded by
human review of the warning output.

**Baseline:** After PR2, all 14 read queries across `useProjectsV2`, `useFinancialReports`,
`useSubcontractors`, `useDossier`, `useDocumentInstances`, `useProjectAcceptance` use
explicit column lists.

---

### RULE 5 — `staleTime` / Cache Policy

**Default global config** (in `src/App.tsx`):
- `staleTime: 5 minutes` — do not override globally.
- `gcTime: 30 minutes` — matches default.
- `refetchOnWindowFocus: false` — preserves intended behavior.

**Per-query overrides:**
- `staleTime: 0` disables cache completely. **Use only when fresh data is critical
  on every mount** (e.g., payment status, real-time token validation).
  Any use of `staleTime: 0` must be documented with a comment in the code.
- `staleTime` values between 1 min and 60 min are acceptable with justification.

**Modal fetch policy:**
- Data fetched when a modal opens must use `useQuery` with `enabled: isOpen`.
- Do not use `useEffect` + direct Supabase call that fires on every modal open.
- This pattern caches the result so repeat opens within the stale window
  are instant (see PR3: SendOfferModal token caching as reference).

**Repeat-visit cache policy:**
- Pages visited repeatedly during a session (Dashboard, Projects, Clients)
  must rely on the global `staleTime: 5 min` to avoid redundant fetches.
- Do not add `staleTime: 0` to these pages.

---

### RULE 6 — Animation Ceiling

**Limits:**
- Sheet/drawer open transitions: ≤ 200ms
- Content fades / page transitions: ≤ 200ms (prefer ≤ 150ms)
- Do not use `AnimatePresence mode="wait"` on route-level transitions
  (serializes navigation — all page transitions are blocked until exit animation completes).

**Banned patterns:**
```css
/* ❌ Causes layout shift on every page load */
transition-all duration-200 translate-y-4

/* ✅ Opacity only — no layout shift */
transition-opacity duration-150
```

**Reference:** PR3 removed the translate-y layout shift from AppLayout, cutting
perceived show-content delay from 200ms to 150ms.

---

### RULE 7 — Smoke Test Requirement for Critical Business Flows

Before merging any PR that touches the following flows, a manual smoke test
is required and must be documented in the PR description:

| Flow | Minimum smoke test |
|------|--------------------|
| Offer creation and PDF generation | Create offer → generate PDF → download |
| Offer email sending | Send offer → verify email received |
| Client / project creation | Create → verify appears in list |
| Auth (login / register) | Log in → verify redirect → log out |
| Payment / subscription | Verify plan is displayed correctly |

The PR description must include a "Smoke Test Results" section with:
- Which flows were tested
- Pass/fail result
- Test environment (local dev / Vercel preview)

---

### RULE 8 — Vercel Preview Verification for Risky PRs

Any PR that changes the following must be verified on a Vercel preview deployment
before merge (local build is insufficient):

- `src/App.tsx` (routing, QueryClient config, startup path)
- `src/components/layout/AppLayout.tsx` (layout shift risk)
- `src/pages/Analytics.tsx` + `src/components/analytics/` (chart lazy boundary)
- Any hook that fetches data on every page load (auth hooks, context providers)
- Any animation / transition change

**Required evidence in PR description:**
```
Vercel preview URL: https://majster-ai-<branch>.vercel.app
Tested flows: [list]
CLS observed: [yes/no — if yes, explain]
```

---

## Anti-Regression Checks — Current State

| Guardrail | Type | What it protects | Automatic or process |
|-----------|------|-----------------|---------------------|
| Build passes | Automatic (CI) | No broken TypeScript / Vite compilation | Automatic — blocks merge |
| Tests pass | Automatic (CI) | No regression in unit/integration tests | Automatic — blocks merge |
| Type-check passes | Automatic (CI) | No type errors | Automatic — blocks merge |
| Lint passes | Automatic (CI) | No ESLint violations | Automatic — blocks merge |
| Heavy library in startup path | Automatic (advisory) | `recharts`, `jspdf`, `html2canvas`, `exceljs` not in `App.tsx` | Advisory — `scripts/check-perf-guardrails.sh` |
| `select('*')` in read hooks | Automatic (advisory) | Over-fetching prevention | Advisory — `scripts/check-perf-guardrails.sh` |
| `staleTime: 0` usage | Automatic (advisory) | Cache bypass prevention | Advisory — `scripts/check-perf-guardrails.sh` |
| Bundle size report | Automatic (CI artifact) | Visibility into chunk sizes on every PR to main | Automatic — report only, no threshold gate |
| Startup path rule | Process | No eager heavy imports added silently | Code review + PR checklist |
| Animation ceiling | Process | No layout shifts, no `mode="wait"` | Code review + PR checklist |
| Modal fetch pattern | Process | No `useEffect` + direct Supabase fetch on every modal open | Code review + PR checklist |
| Smoke test | Process | Critical flows not broken | PR description required |
| Vercel preview for risky PRs | Process | Real runtime behavior verified | PR description required |

---

## Performance Baseline (Reference)

Source of truth: `docs/PERFORMANCE_BASELINE.md` and `docs/PERFORMANCE_BASELINE_2026-03-09.md`.

Top JS chunks after sprint (post-PR1 build, approximate):
1. `exceljs.min-*.js` — 937 kB (gzip 271 kB) — lazy-loaded, not on startup
2. `index-*.js` (main chunk) — ~782 kB (gzip 240 kB) — must not grow significantly
3. `charts-vendor-*.js` — 421 kB (gzip 114 kB) — lazy-loaded via AnalyticsCharts
4. `pdf-vendor-*.js` — 418 kB (gzip 136 kB) — lazy-loaded

**Regression signal:** If `index-*.js` gzip size grows by > 20 kB compared to baseline,
investigate before merge. Use `npm run build:analyze` to inspect composition.

---

## Process Requirements for Future PRs

### Before writing code

1. Identify if the change touches the startup path, a modal fetch, or a list query.
2. If yes, apply the relevant rule from this document.
3. Document the decision in the PR description.

### PR description must include (for performance-sensitive changes)

```markdown
## Performance impact
- [ ] Does this change affect the startup path? (App.tsx, main.tsx, AppLayout)
- [ ] Does this change add a new library > 100 kB?
- [ ] Does this change modify query column selection (adds/removes select columns)?
- [ ] Does this change affect animations or transitions?
- [ ] Does this change affect cache config (staleTime, gcTime)?

If any box is checked: explain the change and its performance rationale.
```

### Before merge (performance-sensitive PRs)

1. Run `npm run check:perf-guardrails` — review advisory output.
2. Run `npm run build` — check that chunk sizes have not grown unexpectedly.
3. If the PR touches `App.tsx`, `AppLayout.tsx`, or route structure — verify on Vercel preview.

---

## What Is NOT Automated (and why)

| What | Why not automated | What would be needed to automate |
|------|------------------|----------------------------------|
| Strict `select('*')` blocking in CI | Too many false positives from mutation calls; blocks legitimate code | A Babel/TS AST parser that distinguishes read vs mutation call sites |
| Bundle size threshold gate in CI | Gzip size varies by build environment; needs stable measurement setup | A dedicated bundle-size-check action with persisted baseline JSON |
| Animation duration check | Not statically analyzable from CSS class names alone | Playwright test measuring layout shift (CLS) on Vercel preview |
| Real LCP / INP / CLS | Requires live user traffic or Lighthouse CI on Vercel preview | Lighthouse CI action configured with Vercel preview URL |
| `staleTime: 0` blocking in CI | Sometimes intentional (e.g., payment status); hard to distinguish intent | Convention: all intentional `staleTime: 0` are annotated with a comment; CI checks for unannotated ones |

---

## Rollback Reference

If a performance regression is merged and causes visible slowdown:

1. **Identify the commit:** `git log --oneline` + compare with this document's baseline.
2. **Revert the commit:** `git revert <sha>` (prefer revert over reset to preserve history).
3. **Verify:** Run `npm run build` and compare chunk sizes with baseline.
4. **Document:** Add a note to `docs/PERFORMANCE_BASELINE.md` with the revert SHA.

---

*This document is owned by the project. Update it when new performance rules are established
or when the baseline changes after a significant optimization sprint.*
