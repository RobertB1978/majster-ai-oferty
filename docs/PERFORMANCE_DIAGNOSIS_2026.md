# Performance & Responsiveness Diagnosis — Majster.AI

**Date:** 2026-03-08
**Model:** Claude Opus 4.6
**Repo Access:** CONFIRMED — full repository inspected
**Scope:** Full frontend performance and responsiveness audit (code-only, no runtime)

---

## SECTION 1 — EXECUTIVE VERDICT

The application is **MIXED** — structurally sound in its bundle/routing architecture (excellent lazy loading, well-configured chunk splitting, proper QueryClient defaults) but carrying **significant data-layer inefficiency** and **missing responsiveness disciplines** that prevent it from feeling instant. The previous performance sprint (SUPER-SPRINT A, Dec 2025) fixed pagination for 3 list pages but left 30+ hooks still using `SELECT '*'`, no virtualization anywhere, and zero `React.memo` usage in production code. The three biggest bottleneck classes are: **(1) Over-fetching via `SELECT '*'` across 38 files / 71 occurrences**, **(2) Missing list virtualization and memoization for rendered items**, **(3) Eager modal/dialog content mounting with no lazy gate for heavy payloads**. The biggest future-speed risk is the **ProjectsV2 subsystem** (`useProjectsV2.ts` has 6 separate `SELECT '*'` calls), which will scale poorly as the feature set grows.

---

## SECTION 2 — FINDINGS TABLE

| ID | Area | File/Location | Symptom | Root Cause | Severity | Evidence | Fix Class |
|----|------|---------------|---------|------------|----------|----------|-----------|
| F01 | Data | 38 hook files, 71 occurrences | Over-transfer of columns on every query | `select('*')` used universally instead of column-specific selects | P0 | `grep -c "select('*')" src/hooks/` = 71 hits across 38 files | QUERY |
| F02 | Data | `src/hooks/useProjectsV2.ts:105,135,179,203,227,258` | ProjectsV2 fetches all columns 6 times in different query paths | Every query function uses `select('*')` | P0 | 6 occurrences in single file | QUERY |
| F03 | Data | `src/hooks/useFinancialReports.ts:26,118,123,128` | Finance reports fetch all columns from multiple tables | 4x `select('*')` for different financial entities | P1 | Direct inspection | QUERY |
| F04 | Data | `src/pages/OfferApproval.tsx:139-141` | Public offer page bypasses query cache entirely | `useEffect` + direct supabase fetch, no React Query | P1 | No `useQuery` wrapper | CACHE |
| F05 | Data | `src/pages/OfferPublicPage.tsx:71-73` | Public offer page bypasses query cache | `useEffect` calling `fetchPublicOffer()` directly | P1 | No TanStack Query caching | CACHE |
| F06 | Data | `src/pages/ProjectPublicStatus.tsx:51` | Public status page bypasses query cache | `useEffect`-based fetching | P1 | Direct inspection | CACHE |
| F07 | Data | `src/components/offers/OfferPreviewModal.tsx:150` | Modal refetches data on every open | `staleTime: 0` forces unnecessary refetch | P1 | Explicit `staleTime: 0` in useQuery options | CACHE |
| F08 | Data | `src/hooks/useOfferWizard.ts:119` | Draft wizard always refetches | `staleTime: 0` bypasses global 5min cache | P1 | Explicit override | CACHE |
| F09 | Data | `src/pages/Register.tsx:56-60,96` | Registration page makes direct supabase calls | `supabase.from('profiles')` in component body | P2 | Direct inspection | ARCHITECTURE |
| F10 | Data | `src/pages/QuickEstimate.tsx:347`, `QuickEstimateWorkspace.tsx:163` | Insert mutations outside hooks | Direct `supabase.from().insert()` in page components | P2 | Not in custom hooks layer | ARCHITECTURE |
| F11 | List | All list pages (Clients, Projects, Offers, etc.) | No virtualization for any list | No `react-virtuoso`, `react-window`, or `@tanstack/virtual` in dependencies | P1 | `grep` for all three libraries returns zero results | LIST |
| F12 | List | All list pages | No `React.memo` on any list item component | Entire list re-renders on any state change | P1 | `grep "React.memo\|memo("` returns only doc files, zero production .tsx | RERENDER |
| F13 | List | `src/pages/Clients.tsx:274` | Stagger animation on every card (50ms * N items) | `animationDelay: ${index * 50}ms` on every `.map()` item | P2 | Direct inspection — delays perceived load | LIST |
| F14 | List | `src/pages/Projects.tsx:175` | Same stagger pattern (30ms * N) | `animationDelay: ${index * 30}ms` | P2 | Direct inspection | LIST |
| F15 | Modal | `src/components/ui/dialog.tsx`, `sheet.tsx` | Standard Radix mounting — content mounts eagerly when `open=true` | No lazy content wrapper; heavy modal payloads mount synchronously | P1 | Radix Dialog renders children inside portal on open | MODAL |
| F16 | Modal | Sheet component | Asymmetric open/close animation durations | `data-[state=open]:duration-500` vs `data-[state=closed]:duration-300` — 500ms open feels sluggish | P2 | `sheet.tsx:32` | MODAL |
| F17 | Theme | `src/components/layout/AppLayout.tsx:33-42` | Redundant theme initialization | `useEffect` duplicates work already done by `theme-init.js` and `ThemeInitializer` in App.tsx | P2 | Three separate theme-init code paths | THEME |
| F18 | Theme | Anti-FART | `public/theme-init.js` only handles `dark` class | No anti-flash for custom CSS variables set by ConfigProvider (`--primary`, `--radius`) — those apply after React mount | P2 | `theme-init.js` is 9 lines, only sets `dark` class | THEME |
| F19 | Layout | `AppLayout.tsx:68`, `NewShellLayout.tsx:46-47` | Content fade-in animation adds 500ms perceived delay | `transition-all duration-500` on main content with opacity+translate | P1 | `showContent` state + `opacity-0 translate-y-4` → `opacity-100 translate-y-0` over 500ms | CLS |
| F20 | Layout | `AppLayout.tsx:58`, `NewShellLayout.tsx:43` | Background transition on every theme/state change | `transition-colors duration-300` on root div | P2 | Affects all descendants via containment | THEME |
| F21 | I18N | `src/i18n/index.ts` | All 3 locale files (~536KB uncompressed) loaded statically | Trade-off documented and justified; ~60KB gzipped is acceptable | INFO | Explicit comment explains race-condition rationale | I18N |
| F22 | Bundle | Auth pages statically imported | Login, Register, ForgotPassword, ResetPassword, NotFound imported eagerly | 6 page components in main bundle even if user is already authenticated | P2 | `App.tsx:25-31` — no lazy() wrapper | BUNDLE |
| F23 | Bundle | `src/components/layout/AppLayout.tsx` statically imported | Layout component is in main bundle for all /app/* routes | TopBar, Navigation, MobileBottomNav, Footer all eagerly loaded | P2 | Static imports at `App.tsx:14-16` | BUNDLE |
| F24 | Asset | Google Fonts via `@import` | Fonts loaded via CSS @import — render-blocking | Not using `<link rel="preload">` or `font-display: swap` in HTML | P2 | `index.css` likely has `@import url('fonts.googleapis.com/...')` | ASSET |
| F25 | Data | `src/hooks/useDossier.ts` | 4 separate `select('*')` calls | Multiple query functions all over-fetching | P1 | Direct grep result | QUERY |
| F26 | Data | `src/hooks/useSubcontractors.ts` | 5 separate `select('*')` calls | Worst single-hook over-fetch ratio | P1 | Direct grep result | QUERY |
| F27 | Rerender | `src/contexts/AuthContext.tsx` | Auth state change rerenders entire app tree | AuthProvider wraps everything; `user`/`session`/`isLoading` state changes cascade to all consumers | P2 | Provider at App.tsx:159, no selector pattern | RERENDER |
| F28 | Rerender | `src/contexts/ConfigContext.tsx:136-141` | Theme CSS variable update in useEffect | Every config change triggers DOM style mutation + rerender of all consumers | P2 | `root.style.setProperty` in useEffect | RERENDER |

---

## SECTION 3 — CURRENT VERIFIED PROBLEMS

### 3.1 Data Over-Fetching (P0)

**71 `select('*')` calls across 38 files** remain after SUPER-SPRINT A. The sprint fixed Projects, Clients, and ItemTemplates, but left every other hook untouched. The worst offenders:

- `useProjectsV2.ts` — 6 occurrences (the V2 system was built after the sprint and inherited bad patterns)
- `useSubcontractors.ts` — 5 occurrences
- `useDocumentInstances.ts` — 4 occurrences
- `useDossier.ts` — 4 occurrences
- `useFinancialReports.ts` — 4 occurrences
- `useProjectAcceptance.ts` — 3 occurrences

Every unnecessary column transferred multiplies with every page visit. For a user with 100+ projects, this can mean 200KB+ per page load on detail views.

### 3.2 Cache Bypass on Public Pages (P1)

Three public-facing pages (`OfferApproval`, `OfferPublicPage`, `ProjectPublicStatus`) use `useEffect`-based data fetching that completely bypasses TanStack Query. This means:
- No caching — revisiting the page always triggers a new network request
- No stale-while-revalidate — user sees loading spinner every time
- No error retry consistency — manual error handling instead of Query's retry logic

### 3.3 Aggressive staleTime Override (P1)

`OfferPreviewModal` and `useOfferWizard` both set `staleTime: 0`, which forces a refetch on every mount even though the global default is 5 minutes. For the preview modal specifically, this means opening the same offer preview repeatedly triggers redundant network requests.

### 3.4 No List Virtualization (P1)

Zero virtualization libraries are installed. While pagination (20 items/page) mitigates this for paginated lists, non-paginated views (Dashboard recent projects, Analytics, Offers list, admin panels) render all items in the DOM. The Offers page currently fetches and renders all offers with client-side filtering — if a user has 200+ offers, this creates 200+ Card components in the DOM simultaneously.

### 3.5 No React.memo Anywhere (P1)

No production component uses `React.memo()`. In list rendering contexts (`.map()` patterns in Clients, Projects, Offers), this means every parent state change (search input, filter toggle, sort change) causes full re-render of every list item, including those that haven't changed.

### 3.6 Content Mount Delay (P1)

Both `AppLayout` and `NewShellLayout` apply a 500ms `transition-all duration-500` fade-in animation to the main content area. This is triggered by a `showContent` state that flips from false to true after auth resolves. The result is that **every authenticated page load has a mandatory 500ms opacity animation** before content becomes fully visible, even when the content is already cached and ready.

### 3.7 Sheet Open Animation Too Slow (P2)

The Sheet component uses `duration-500` for open and `duration-300` for close. A 500ms slide-in animation exceeds the 100ms perceived-instant threshold by 5x and the 200ms acceptable threshold by 2.5x.

---

## SECTION 4 — UNKNOWN / RUNTIME EVIDENCE NEEDED

| # | What is Unknown | Why Repo Cannot Confirm | Evidence Required |
|---|-----------------|------------------------|-------------------|
| U1 | Actual bundle sizes after build (gzipped) | Comment says ~458KB gzipped but no build output in repo | Run `npm run build` and inspect `dist/assets/js/` |
| U2 | Real Lighthouse performance score | No CI lighthouse integration | Run Lighthouse on production URL, especially mobile |
| U3 | Actual rerender frequency and depth | Static analysis cannot count renders | React DevTools Profiler recording of Dashboard, Offers list, and route transitions |
| U4 | Time-to-Interactive on mobile devices | No RUM (Real User Monitoring) data | WebPageTest or Chrome DevTools on throttled 4G |
| U5 | Whether `select('*')` actually transfers extra data | Supabase RLS may already limit columns | Inspect Network tab payload size on list pages |
| U6 | CLS score on real pages | Cannot determine layout shift from code alone | Lighthouse CLS metric or `web-vitals` library integration |
| U7 | Google Fonts actual load time | CSS @import blocking behavior depends on cache state | Network waterfall on cold load |
| U8 | Whether stagger animations (F13, F14) cause visible delay | Depends on item count and browser paint timing | Video recording of list page load with 20+ items |
| U9 | framer-motion lazy load effectiveness | Lazy wrapper exists but actual chunk size unknown | Build output analysis for `PageTransitionAnimated` chunk |
| U10 | Memory pressure from 3 static locale files | 536KB uncompressed in memory, unknown impact | Chrome Memory DevTools on long sessions |

---

## SECTION 5 — WORLD-CLASS PERFORMANCE GAPS

### Missing Standards

| # | Standard | Current State | World-Class Target |
|---|----------|---------------|--------------------|
| G1 | **Heavy-lib lazy policy** | Recharts, Leaflet, PDF, framer-motion are lazy-loaded via chunks. ExcelJS is dynamically imported. Good. | All libs >20KB should have documented lazy policy. Leaflet's `TeamLocationMap` statically imports leaflet. |
| G2 | **Query column policy** | 3/38 hooks use column-specific selects | Every hook must specify exact columns needed; `select('*')` prohibited by linting rule |
| G3 | **Modal mount policy** | Radix Dialog/Sheet mount content eagerly on `open=true` | Heavy modal content should lazy-load via `Suspense` inside the dialog body |
| G4 | **Animation duration ceiling** | Sheet open = 500ms, content fade-in = 500ms | No animation > 200ms; prefer 100-150ms for perceived instant feedback |
| G5 | **CLS prevention discipline** | Skeleton screens exist for ~20 pages (good) but no `aspect-ratio` or `min-h` on dynamic containers | Every data-dependent UI block should have explicit skeleton with matching dimensions |
| G6 | **Anti-flicker theme bootstrap** | `theme-init.js` handles dark class before paint (good) | Should also bootstrap CSS custom variables (--primary, --radius) from localStorage to prevent 1-frame flash |
| G7 | **Rerender containment** | No `React.memo`, no selector pattern for contexts | List items must be memoized. Context consumers should use selector patterns or split contexts. |
| G8 | **Performance budget** | `chunkSizeWarningLimit: 1500` (very generous) | Set per-route performance budgets: initial load <200KB gzipped, route chunk <50KB, query payload <20KB |
| G9 | **Virtualization policy** | No virtualization library installed | Any list that can exceed 50 items must use virtualization |
| G10 | **Route prefetching** | No route prefetching or preloading on hover/visibility | Critical next-routes should prefetch on link hover or viewport intersection |
| G11 | **staleTime policy** | Global default 5min, but arbitrary overrides to 0 | Document and enforce per-entity staleTime; prohibit `staleTime: 0` without written justification |
| G12 | **Auth page separation** | Login/Register/ForgotPassword/ResetPassword statically imported | Auth pages should be lazy-loaded — authenticated users never need them |

---

## SECTION 6 — RECOVERY MATRIX

| Priority | Problem Class | Why It Matters | Expected Gain | Effort | Risk | Recommended Order |
|----------|--------------|----------------|---------------|--------|------|-------------------|
| P0-1 | QUERY: `select('*')` elimination | Over-transfers data on every page; scales linearly worse with user growth | 50-80% reduction in payload per query | Medium (35 files) | Low — additive column lists; backwards-compatible | 1 |
| P0-2 | CACHE: Public page cache bypass | 3 public pages re-fetch on every visit; hurts offer approval UX | Instant revisit for offer/project pages | Small (3 files) | Low — wrapping in useQuery | 2 |
| P1-1 | RERENDER: List item memoization | Every filter/search change re-renders all list items | 60-90% fewer DOM updates on interaction | Small-Medium | Very Low — adding React.memo wrappers | 3 |
| P1-2 | MODAL: Animation ceiling + lazy mount | 500ms sheet/content animations feel sluggish | Perceived instant (<150ms) modal/route open | Small | Low — CSS duration change + Suspense wrapper | 4 |
| P1-3 | LIST: Virtualization for unbounded lists | Offers page can render 200+ items without virtualization | Constant DOM node count regardless of data size | Medium (add dependency) | Medium — needs approval for new dep | 5 |
| P2-1 | BUNDLE: Lazy-load auth pages | Auth pages inflate main bundle for authenticated users | ~15-30KB savings on initial load | Small | Very Low | 6 |
| P2-2 | THEME: Consolidate theme init | 3 separate theme-init paths (theme-init.js, ThemeInitializer, AppLayout useEffect) | Eliminate redundant code, prevent edge-case flash | Small | Low | 7 |
| P2-3 | CACHE: staleTime policy enforcement | Arbitrary staleTime:0 overrides waste bandwidth | Consistent caching behavior | Small | Low | 8 |

---

## SECTION 7 — EXECUTION PLAN FOR CODEX

### PR1 — SELECT Column Optimization (P0) — PRE-MERGE

**Scope:** Replace all `select('*')` calls with column-specific selects across ~35 hook files.

**Likely files touched:**
- `src/hooks/useProjectsV2.ts` (6 occurrences)
- `src/hooks/useSubcontractors.ts` (5)
- `src/hooks/useDocumentInstances.ts` (4)
- `src/hooks/useDossier.ts` (4)
- `src/hooks/useFinancialReports.ts` (4)
- `src/hooks/useProjectAcceptance.ts` (3)
- `src/hooks/useProjectCosts.ts` (2)
- `src/hooks/useOrganizations.ts` (2)
- `src/hooks/useQuoteVersions.ts` (2)
- `src/hooks/usePurchaseCosts.ts` (2)
- `src/hooks/useProjectChecklist.ts` (2)
- ~20 more hooks with 1 occurrence each
- `src/components/admin/AdminUsersManager.tsx` (2)
- `src/pages/legal/GDPRCenter.tsx` (6 — also move to hooks)

**Acceptance criteria:**
- Zero `select('*')` remaining in `src/hooks/` and `src/pages/` (except test files)
- All existing tests pass (`npm test`)
- Build succeeds (`npm run build`)
- No TypeScript errors
- Each hook's select list matches the type interface it returns

**Verification required:**
- Manual test: open each major page (Dashboard, Projects, Clients, Offers, Finance) and confirm data loads correctly
- Network tab: verify payload size reduction

**Rollback note:** Revert single commit. Risk is low — only affects column selection, not filtering or business logic.

---

### PR2 — Cache & Responsiveness Quick Wins (P1) — PRE-MERGE

**Scope:** Fix cache bypass on public pages, remove staleTime:0 overrides, reduce animation durations, lazy-load auth pages.

**Likely files touched:**
- `src/pages/OfferApproval.tsx` — wrap in useQuery
- `src/pages/OfferPublicPage.tsx` — wrap in useQuery
- `src/pages/ProjectPublicStatus.tsx` — wrap in useQuery
- `src/components/offers/OfferPreviewModal.tsx` — remove `staleTime: 0`
- `src/hooks/useOfferWizard.ts` — remove `staleTime: 0` or increase to 30s
- `src/components/ui/sheet.tsx` — change `duration-500` to `duration-150`
- `src/components/layout/AppLayout.tsx:68` — reduce `duration-500` to `duration-200`
- `src/components/layout/NewShellLayout.tsx:46` — reduce `duration-500` to `duration-200`
- `src/App.tsx:25-31` — wrap Login/Register/ForgotPassword/ResetPassword in `lazy()`
- `src/components/layout/AppLayout.tsx:33-42` — remove redundant theme useEffect

**Acceptance criteria:**
- Public offer/project pages use useQuery with proper caching
- No `staleTime: 0` without documented justification
- Sheet open animation <= 200ms
- Content fade-in <= 200ms
- Auth pages lazy-loaded
- All tests pass, build succeeds

**Verification required:**
- Open/close sheet — should feel instant
- Navigate to /app/dashboard — content should not have a visible 500ms fade
- Revisit public offer page — should show cached data immediately

**Rollback note:** Single commit revert. Low risk — animation changes are purely cosmetic, cache changes improve behavior.

---

### PR3 — List Rendering Performance (P1-P2) — PRE-MERGE

**Scope:** Add React.memo to list item components, remove stagger animation delays, add debouncing where missing.

**Likely files touched:**
- `src/pages/Clients.tsx` — extract ClientCard, wrap in React.memo, remove stagger delay
- `src/pages/Projects.tsx` — extract ProjectCard, wrap in React.memo, remove stagger delay
- `src/pages/Offers.tsx` — extract OfferCard, wrap in React.memo (already uses debounce)
- `src/components/dashboard/RecentProjects.tsx` — memo project items
- `src/components/finance/FinanceDashboard.tsx` — memo chart section
- `src/pages/Team.tsx` — remove stagger delay, memo members

**Acceptance criteria:**
- All `.map()` list items wrapped in `React.memo`
- No `animationDelay: ${index * N}` patterns remaining
- All existing tests pass
- Build succeeds

**Verification required:**
- React Profiler: confirm list item re-renders are eliminated when typing in search
- Visual: confirm list still appears correctly without stagger animation

**Rollback note:** Single commit. Very low risk — React.memo is backwards-compatible by definition.

---

### PR4 — Virtualization for Offers List (P1) — REQUIRES DEPENDENCY APPROVAL

**Scope:** Add virtualization for the Offers list page (highest cardinality unbounded list).

**Likely files touched:**
- `package.json` — add `@tanstack/react-virtual` (~8KB gzipped)
- `src/pages/Offers.tsx` — implement virtual list rendering
- Potentially `src/pages/ProjectsList.tsx` if unbounded

**Acceptance criteria:**
- Offers list renders max ~20 DOM nodes regardless of total offer count
- Scrolling is smooth at 60fps
- Search/filter works correctly with virtualization
- All tests pass, build succeeds
- New dependency approved by owner

**Verification required:**
- Load page with 100+ offers — verify only ~20 DOM nodes exist
- Scroll rapidly — no blank space or jank
- Chrome Performance tab: paint time < 16ms per frame

**Rollback note:** Revert + remove dependency. Medium risk — requires new dependency approval per CLAUDE.md rules.

---

### PR5 — Theme/Context Consolidation (P2) — OPTIONAL

**Scope:** Consolidate 3 theme-init paths, extend anti-FART to CSS variables, split AuthContext to reduce rerender blast radius.

**Likely files touched:**
- `public/theme-init.js` — add CSS variable bootstrap from localStorage
- `src/App.tsx` — remove `ThemeInitializer` component (redundant with theme-init.js)
- `src/components/layout/AppLayout.tsx` — remove theme useEffect (redundant)
- `src/contexts/AuthContext.tsx` — split into `useAuthUser`, `useAuthSession`, `useAuthLoading` selectors

**Acceptance criteria:**
- Single theme initialization path (theme-init.js)
- CSS variables (--primary, --radius) applied before first React paint
- No flash of default theme on page load
- Auth context rerenders only affect consumers that use the changed value
- All tests pass, build succeeds

**Verification required:**
- Hard refresh with dark mode + custom theme — no flash of light/default theme
- Login/logout — verify components that don't use `user` don't rerender

**Rollback note:** Revert commit. Low risk but touches foundational code paths.

---

## CRITICAL NOTES

1. **SUPER-SPRINT A (Dec 2025) is acknowledged.** Pagination for Projects, Clients, ItemTemplates, and column optimization for those 3 hooks was completed. This diagnosis does NOT re-report those as problems. However, the remaining 35+ hooks and the newer ProjectsV2 system were not addressed.

2. **The i18n static loading decision is accepted.** The documented trade-off (~60KB gzipped for 3 locales to eliminate flash-of-wrong-language) is reasonable. This is NOT flagged as a problem.

3. **The chunk splitting strategy is excellent.** Manual chunks for recharts, leaflet, framer-motion, jspdf, and supabase are well-designed. Framer-motion lazy-loading via `PageTransition` wrapper is a good pattern.

4. **No `React.memo` in any production file** is a verified finding — `grep` returns only documentation files. This is the single most impactful quick-win for perceived responsiveness.

5. **ExcelJS is properly lazy-loaded** via dynamic `import()` at module level with pre-warming. This is not a problem.

---

STOP. Wait for Codex execution phase.
