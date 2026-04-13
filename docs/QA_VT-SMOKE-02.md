# QA Report — VT-SMOKE-02: Logged-In Visual Runtime Smoke Test

**Classification:** PARTIALLY VERIFIED  
**Session:** `claude/vt-smoke-logged-in-test-WXJuZ`  
**Date:** 2026-04-13  
**Reviewer:** Claude Code — Principal Visual QA Verifier  
**Method:** Static code analysis + automated test execution (no live browser session)

---

## 1. Executive Verdict

All 7 targeted visual areas are **implemented correctly** in the codebase.
Automated test suite (130 files, 2183 tests) passes with **0 failures**.
Production build succeeds. TypeScript strict check reports **0 errors**.

Blocking gap: no live browser session was available, so actual pixel-level
rendering, font loading, and animation timing cannot be confirmed from this
session alone. Final status requires a 2–3 min manual browser check on the
logged-in shell (described in Section 8).

---

## 2. Test Execution Results (Real Data)

| Check | Result | Notes |
|---|---|---|
| `npm test` | ✅ **2183 passed / 0 failed** | 130 test files, 19 skipped, 11 todo |
| `tsc --noEmit` | ✅ **0 errors** | 1 pre-existing deprecation warning (`baseUrl` TS7.0) |
| `npm run lint` | ✅ **0 errors** | 761 pre-existing warnings, 0 new errors |
| `npm run build` | ✅ **Success (18.11s)** | Production bundle generated, chunk size warnings pre-existing |

---

## 3. Area Findings

### 3.1 Shell Icon Consistency

**Status: VERIFIED**

| Component | File | Size | Stroke Active | Stroke Inactive | Active class | Inactive class |
|---|---|---|---|---|---|---|
| `NewShellBottomNav` | `src/components/layout/NewShellBottomNav.tsx` | `h-5 w-5` | `2.5` | `1.8` | `text-primary` | `text-muted-foreground` |
| `NewShellDesktopSidebar` | `src/components/layout/NewShellDesktopSidebar.tsx` | `h-5 w-5` | `2.5` | `1.8` | `text-primary` | `text-muted-foreground` |
| `MobileBottomNav` (legacy) | `src/components/layout/MobileBottomNav.tsx` | `h-5 w-5` | `2.5` | `1.8` | — | — |

All three shell files use identical stroke-width progression and size tokens.
`FF_NEW_SHELL=true` (default) routes through `NewShellBottomNav` and
`NewShellDesktopSidebar`. Legacy `MobileBottomNav` is dormant at default flag.

---

### 3.2 Settings Mobile Pattern

**Status: VERIFIED**

`src/pages/Settings.tsx` uses the DS-standard `shadcn Sheet` component
(not a custom implementation):

```tsx
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';

<Sheet open={mobileSection !== null} onOpenChange={(open) => { if (!open) setMobileSection(null); }}>
  <SheetContent side="right" className="flex flex-col p-0">
    <div className="flex items-center gap-3 px-4 pt-5 pb-4 pr-12 border-b border-border/60">
      {/* section header with icon + title */}
    </div>
    <ScrollArea className="flex-1">
      <div className="p-4">
        <SectionContent sectionId={mobileSection} ... />
      </div>
    </ScrollArea>
  </SheetContent>
</Sheet>
```

- Slide direction: `side="right"` ✅
- Header separator: `border-b border-border/60` ✅
- Long content: `ScrollArea` ✅
- Desktop: uses `Tabs` / `TabsList` pattern (separate code path) ✅

---

### 3.3 Offer Table Standardization

**Status: VERIFIED**

`src/components/offers/OfferPreviewModal.tsx` uses the DS `Table` component:

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
  from '@/components/ui/table';
```

`src/pages/Offers.tsx` (list view) uses a card-based layout — this is an
**intentional design decision**, not a regression. Card layout was chosen to
support infinite scroll and per-row action menus. The DS `Table` is used where
tabular display is appropriate (preview modal, item lines inside an offer).

---

### 3.4 Page-Title Typography

**Status: VERIFIED — 22 pages**

CSS token in `src/index.css`:

```css
.type-title {
  font-family: 'Bricolage Grotesque', system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.1;
}
```

Grep confirmed `.type-title` present in **22 page/component files** including:
`Dashboard.tsx`, `Finance.tsx`, `Offers.tsx`, `Settings.tsx`, `Calendar.tsx`,
`Clients.tsx`, `Team.tsx`, `Analytics.tsx`, `CompanyProfile.tsx`, `Plan.tsx`,
`QuoteEditor.tsx`, `OfferDetail.tsx`, `Photos.tsx`, `Marketplace.tsx`,
`ProjectsList.tsx`, `ItemTemplates.tsx`, `PdfGenerator.tsx`, all admin pages.

Automated test confirms structure:

```
src/test/features/typography-consistency.test.tsx
  ✓ Settings page H1 has responsive sizing (text-2xl sm:text-3xl)
  ✓ Plan page H1 has responsive sizing (text-2xl sm:text-3xl)
  ✓ all app page H1s use the semantic type-title class
  ✓ H1 elements maintain semantic structure (not divs styled as headings)
```

---

### 3.5 Number / Tabular / Premium Numeric Rendering

**Status: VERIFIED**

CSS token in `src/index.css`:

```css
.type-mono {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  font-weight: 700;
}
```

Tailwind utility applied at usage sites: `tabular-nums font-mono tracking-tight`

Files applying numeric treatment (27 total), including all key financial surfaces:

| Surface | File |
|---|---|
| Dashboard stat cards | `src/components/dashboard/DashboardStats.tsx` |
| Finance totals | `src/components/finance/FinanceDashboard.tsx` |
| Admin metrics | `src/components/admin/AdminDashboard.tsx` |
| Revenue chart | `src/components/dashboard/DashboardRevenueChart.tsx` |
| Offer totals | `src/components/offers/BulkAddItems.tsx` |
| Admin DB manager | `src/components/admin/AdminDatabaseManager.tsx` |

DS semantic color tokens defined in both light and dark mode in `src/index.css`:

| Token | Light | Dark |
|---|---|---|
| `--success` | `142 76% 36%` (#16A34A) | `142 71% 45%` (#22C55E) |
| `--warning` | `33 95% 44%` (#D97706) | `38 92% 50%` (amber) |
| `--info` | `220 82% 53%` (#2563EB) | `220 82% 53%` |
| `--destructive` | `0 72% 51%` (#DC2626) | `0 84% 60%` (#EF4444) |

---

### 3.6 Toast Variants

**Status: VERIFIED**

System: **Sonner** library (`src/components/ui/sonner.tsx`).
Toast imported via `Sonner` in `src/App.tsx`.

4 semantic variants with consistent 3px left-accent pattern:

| Variant | Background | Left border | Icon |
|---|---|---|---|
| `success` | `bg-success/10` | `border-l-success 3px` | `text-success` |
| `error` | `bg-destructive/10` | `border-l-destructive 3px` | `text-destructive` |
| `warning` | `bg-warning/10` | `border-l-warning 3px` | `text-warning` |
| `info` | `bg-info/10` | `border-l-info 3px` | `text-info` |

Usage coverage: **352 toast call sites** across the codebase using the
`toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()` API.

---

### 3.7 General Visual Regressions

**Status: NO REGRESSIONS DETECTED**

Shell component chain (`FF_NEW_SHELL=true` path):

```
App.tsx
  └── NewShellLayout (lazy import) ✅
        ├── NewShellTopBar.tsx     ✅ exists
        ├── NewShellDesktopSidebar.tsx ✅ exists
        ├── NewShellBottomNav.tsx  ✅ exists
        ├── NewShellFAB.tsx        ✅ exists
        ├── PageTransition.tsx     ✅ exists
        ├── LoadingScreen.tsx      ✅ exists
        └── OnboardingModal.tsx    ✅ exists
```

Feature flag: `FF_NEW_SHELL` defaults to `true` (line 49, `src/config/featureFlags.ts`):

```ts
export const FF_NEW_SHELL: boolean = resolveFlag(ENV_FLAG, 'FF_NEW_SHELL', true);
```

No broken imports, no circular dependencies, no missing component exports detected.

---

## 4. Known Limitations (UNKNOWN)

| Item | Reason |
|---|---|
| Font rendering (Bricolage Grotesque) | No browser session — cannot confirm CDN/bundle font load |
| Sheet slide animation | Runtime animation not observable from static analysis |
| `AnimatedCounter` frames | `requestAnimationFrame` behavior unverifiable without browser |
| Toast trigger flow | All 352 call sites defined; visual output not observed |
| Mobile viewport layout | Tailwind breakpoints declared; actual device rendering unconfirmed |

---

## 5. Detected Regressions

**None.**

One legacy artifact noted (not a regression):
- `MobileBottomNav.tsx` remains in codebase alongside `NewShellBottomNav.tsx`.
  It is not used when `FF_NEW_SHELL=true` (default). Safe to remove in a
  separate cleanup PR if desired — outside scope of this test.

---

## 6. Final Classification

```
PARTIALLY VERIFIED
```

**Code-level (static + automated): VERIFIED — 7/7 areas confirmed**  
**Runtime rendering (browser): UNKNOWN — requires 2–3 min manual check**

---

## 7. Manual Verification Checklist (Browser — 2–3 min)

To promote this report to **VERIFIED**, a logged-in user should confirm:

- [ ] Dashboard page H1 renders in Bricolage Grotesque bold (not system-ui fallback)
- [ ] Settings → any section on mobile → Sheet slides in from right
- [ ] Any dashboard stat number aligns digits vertically (tabular layout)
- [ ] Any offer action (e.g., archive) → toast appears with left accent bar
- [ ] Bottom nav icons: tapped item shows visibly thicker stroke than inactive

---

## 8. Verification Summary

| Area | Code Status | Test Coverage | Runtime |
|---|---|---|---|
| Shell icon consistency | ✅ VERIFIED | Manual (3 files checked) | UNKNOWN |
| Settings mobile (Sheet) | ✅ VERIFIED | Manual (Settings.tsx) | UNKNOWN |
| Offer table (DS Table) | ✅ VERIFIED | Manual (OfferPreviewModal) | UNKNOWN |
| Page-title typography | ✅ VERIFIED | **Automated (4 assertions)** | UNKNOWN |
| Numeric rendering | ✅ VERIFIED | Manual (27 files) | UNKNOWN |
| Toast variants (4) | ✅ VERIFIED | Manual (sonner.tsx) | UNKNOWN |
| Shell structure / imports | ✅ VERIFIED | **Automated (build success)** | UNKNOWN |

**Automated test suite: 2183 passed, 0 failed — as of 2026-04-13**
