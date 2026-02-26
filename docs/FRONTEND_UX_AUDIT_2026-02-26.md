# MAJSTER.AI — Frontend & UX Audit Report

**Date:** 2026-02-26
**Auditor:** Claude Opus 4.6 (Static, Read-Only)
**Commit SHA:** `3b65f2d35ae0a678cd0ebb2511a59dcd3d416149`
**Branch:** `claude/saas-frontend-ux-audit-TzdsY`
**Mode:** Enterprise-Grade, Evidence-First, Frontend-Focused

---

## Executive Summary (What Matters for Builders)

Majster.AI is a **MVP+ stage** construction SaaS with solid core functionality but several UX friction points that would hurt adoption by field contractors. The app successfully delivers a login-to-PDF-to-send flow with 3 quote creation methods (manual, AI, voice). However, the experience needs polish for a builder who is standing on a job site, phone in one hand:

**What works well:**
- Trade-aware onboarding (choose your trade, get pre-loaded starter pack) is a genuine differentiator
- 3 quote creation methods (voice/AI/manual) from Dashboard hub
- PDF generation with 3 templates + dual-token client approval portal
- i18n key parity: 1,560 keys across PL/EN/UK
- 688/688 unit tests passing, 0 ESLint errors, TypeScript strict mode clean
- Mobile bottom nav with safe-area support

**What needs fixing:**
- Registration requires mandatory phone number (increases drop-off per market benchmark)
- Pricing page `/plany` is 100% hardcoded Polish (not using i18n)
- ~35+ hardcoded Polish strings in critical flows (offers, team, voice errors)
- exceljs.min.js = 937KB raw / 271KB gzip — loaded even when user never exports
- No breadcrumbs despite component existing (navigation confusion risk)
- Dual quick-estimate paths (`/app/quick-est` legacy + `/app/szybka-wycena` modern) create confusion
- Stripe not connected (all `stripePriceId: null`) — no self-service payment

**Overall Frontend UX Score: 68/100** (Conditional — strong bones, needs field-hardening)

---

## Phase 0 — Setup Snapshot

| Field | Value |
|-------|-------|
| Commit SHA | `3b65f2d35ae0a678cd0ebb2511a59dcd3d416149` |
| Branch | `claude/saas-frontend-ux-audit-TzdsY` |
| Package Manager | npm 10.9.2 |
| Node Requirement | >= 20 |
| Build Tool | Vite 5.4 |
| Framework | React 18.3 + TypeScript 5.8 |
| Build Status | **PASS** — builds in 39.62s, 0 errors |
| Lint Status | **PASS** — 0 errors, 19 warnings (all `react-refresh/only-export-components`) |
| TypeScript | **PASS** — `tsc --noEmit` clean |
| Tests | **PASS** — 688 passed, 5 skipped, 0 failures (40.74s) |
| Required ENV | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend only) |

---

## Desktop Audit

### 1. IA Map (Information Architecture)

**Zone 1: Public Routes (No Auth)**

| Route | Component | Primary CTA |
|-------|-----------|-------------|
| `/` | Landing | "Rozpocznij za darmo" → `/register` |
| `/login` | Login | Email + Password login |
| `/register` | Register | Email + Phone + Password signup |
| `/plany` | Plany | 4-tier pricing grid → `/register` |
| `/plany/:slug` | PlanyDetail | Plan details + register CTA |
| `/oferta/:token` | OfferPublicPage | Client portal (view/accept offer) |
| `/legal/*` | Legal pages | Privacy, Terms, Cookies, DPA, GDPR |

**Zone 2: Authenticated App (`/app/*`)**

| Route | Component | Primary CTA |
|-------|-----------|-------------|
| `/app/dashboard` | Dashboard | "Nowy projekt" + QuoteCreationHub (3 methods) |
| `/app/jobs` | Projects | List all projects, filter by status |
| `/app/jobs/new` | NewProject | Create project (voice/AI/manual modes) |
| `/app/jobs/:id` | ProjectDetail | 8-tab project workspace |
| `/app/jobs/:id/quote` | QuoteEditor | Line items editor + AI suggestions |
| `/app/jobs/:id/pdf` | PdfGenerator | PDF config + generate |
| `/app/quick-est` | QuickEstimate | Legacy 3-tab quick estimate |
| `/app/szybka-wycena` | QuickEstimateWorkspace | Modern 2-column workspace |
| `/app/customers` | Clients | Client list + add/edit |
| `/app/calendar` | Calendar | Event scheduling |
| `/app/finance` | Finance | Financial dashboard |
| `/app/templates` | ItemTemplates | Quote item templates |
| `/app/plan` | Plan | Current subscription |
| `/app/profile` | CompanyProfile | Company settings |
| `/app/settings` | Settings | App configuration |

**Zone 3: Admin (`/admin/*`)** — 12 admin pages, gated by `AdminGuard`

**Desktop Navigation (horizontal top bar):**
Dashboard → Jobs → Clients → Calendar → Finance → Templates → Plan → Profile → Settings

**Evidence:** `src/components/layout/Navigation.tsx:39-50` — uses i18n keys via `NAV_LABEL_KEYS`

### 2. Readability & Consistency (Desktop)

#### 2.1 Naming Consistency

| Concept | Route Term | Nav Label (PL) | Page Title | Status |
|---------|-----------|----------------|------------|--------|
| Projects | `/app/jobs` | "Projekty" | "Projekty" | OK — route/label mismatch is internal |
| Clients | `/app/customers` | "Klienci" | "Klienci" | OK |
| Quote vs Offer | N/A | "Wycena" (internal) / "Oferta" (sent) | Mixed | **WARN** — distinction unclear to builders |
| Quick Estimate | `/app/quick-est` + `/app/szybka-wycena` | Not in nav | N/A | **FAIL** — 2 parallel paths, neither in main nav |

**Evidence:** Two quick-estimate routes exist — `src/pages/QuickEstimate.tsx` (legacy, 3-tab) and `src/pages/QuickEstimateWorkspace.tsx` (modern, 2-column). The modern one is reached through trade onboarding but has no persistent nav entry.

#### 2.2 Empty/Error/Loading States

| Page | Empty State | Error State | Loading State | Verdict |
|------|------------|-------------|---------------|---------|
| Dashboard | EmptyDashboard ✓ | ErrorBoundary ✓ | DashboardSkeleton ✓ | **PASS** |
| Projects | Custom card ✓ | Toast only | ProjectsListSkeleton ✓ | **PARTIAL** |
| Clients | Custom card ✓ | Toast only | ClientsGridSkeleton ✓ | **PARTIAL** |
| Finance | EmptyState component ✓ | Toast only | Custom skeleton ✓ | **PASS** |
| Templates | Custom text ✓ | Toast only | Loader2 spinner | **PARTIAL** |
| Calendar | **MISSING** | **MISSING** | Basic loading | **FAIL** |
| QuoteEditor | N/A | Toast only | Loader2 | **PARTIAL** |

**Evidence:**
- `src/components/ui/empty-state.tsx` exists but only `FinanceDashboard.tsx:58-70` uses it properly
- Calendar (`src/pages/Calendar.tsx`) has no empty state for users with 0 events
- `src/components/ui/skeleton-screens.tsx` provides Dashboard/Projects/Clients skeletons

#### 2.3 Builder Readability

**Confusion Point 1: "What do I do next?"**
- Dashboard presents 3 quote creation methods (Voice/AI/Manual) + "Nowy projekt" button + Quick Actions
- A new builder sees 4+ entry points with no clear priority
- **Fix:** Reduce to ONE primary CTA with secondary expandable options

**Confusion Point 2: "Wycena vs Oferta"**
- Internal: quote is "wycena"; when sent it becomes "oferta"
- Builder sees "Wycena w toku" status, then "Oferta wysłana" — terminology shifts mid-flow
- **Fix:** Use consistent "Oferta" throughout, or explain transition in UI

**Confusion Point 3: "Where is Quick Estimate?"**
- Modern workspace `/app/szybka-wycena` not in navigation
- Only reachable via trade onboarding → "Super prosty" mode, or direct URL
- Legacy `/app/quick-est` also not in nav
- **Fix:** Add "Szybka wycena" to nav or merge into "Nowy projekt" flow

**Confusion Point 4: Breadcrumbs missing**
- Breadcrumb component exists (`src/components/ui/breadcrumb.tsx`) but is NOT used anywhere
- Deep pages like `ProjectDetail → QuoteEditor → PdfGenerator` have only a back button
- **Evidence:** `grep -r "Breadcrumb" src/ --include="*.tsx"` returns only the component definition

### 3. Speed & Performance (Desktop)

**Build Output Analysis:**

| Chunk | Raw Size | Gzip | Load Timing | Issue |
|-------|---------|------|-------------|-------|
| `index.js` (main) | 533 KB | 163 KB | First load | Heavy main bundle |
| `exceljs.min.js` | 937 KB | 271 KB | On-demand | **P1** — Largest single chunk |
| `pdf-vendor.js` | 417 KB | 136 KB | On-demand | Expected for PDF feature |
| `charts-vendor.js` | 421 KB | 114 KB | On-demand | Recharts |
| `html2canvas.esm.js` | 201 KB | 47 KB | On-demand | PDF screenshot support |
| `react-vendor.js` | 165 KB | 54 KB | First load | Expected |
| `supabase-vendor.js` | 178 KB | 46 KB | First load | Expected |
| `framer-motion-vendor.js` | 114 KB | 38 KB | Lazy | Already lazy-loaded ✓ |
| `ProjectDetail.js` | 80 KB | 21 KB | Route-level | Largest page chunk |
| `Landing.js` | 57 KB | 14 KB | Public route | Acceptable |

**Total JS:** ~3.5 MB raw / ~1.1 MB gzip (across all lazy chunks)
**Critical path (first load):** index.js + react-vendor + supabase-vendor = ~876 KB raw / ~263 KB gzip

**Key Performance Issues:**
1. **exceljs (937KB raw)** — loaded as a separate chunk but not tree-shaken. Only used for Excel export feature. Should be dynamically imported at click-time, not bundled.
2. **html2canvas (201KB)** — used for PDF preview screenshots. Should be lazy-loaded within PdfGenerator only.
3. **Main bundle (533KB)** — contains i18n translations (3 × 1,560 keys), all route definitions, auth context. Consider splitting i18n per locale.

**Evidence:** `vite.config.ts:54-69` — manual chunks configured; `dist/assets/js/` build output analyzed

---

## Mobile Audit

### 1. IA Map (Mobile)

**Navigation structure:**
- **Top bar:** Logo + Notifications + Theme toggle + Language switch + Logout
- **Hamburger menu:** 2-column grid of nav items (visible < 640px)
- **Bottom tab bar:** 5 items — Dashboard | Jobs | Clients | Calendar | Finance (visible < 1024px)

**Missing from mobile bottom nav:**
- Templates (requires hamburger menu)
- Quick Estimate (not in any nav)
- Profile / Settings (requires hamburger menu)

**Evidence:** `src/components/layout/MobileBottomNav.tsx:6-12` — only 5 items hardcoded

### 2. Field-Readiness Checks

#### 2.1 Touch Targets

| Element | Size | Min Required | Status |
|---------|------|-------------|--------|
| Bottom nav items | 56px min-width, 64px height | 48px | **PASS** |
| Primary buttons (lg) | 48px height | 48px | **PASS** |
| Default buttons | 40px height | 44px (WCAG) | **WARN** — close to minimum |
| Icon buttons | 40px × 40px | 44px | **WARN** |
| Input fields | 40px height | 44px | **WARN** |
| Landing CTA buttons | min-h-[48px] | 48px | **PASS** |

**Evidence:** `src/components/ui/button.tsx` — size variants: default=h-10, lg=h-12, icon=h-10

#### 2.2 Overlay Occlusion

| Overlay | Position | Blocks CTA? | Status |
|---------|----------|-------------|--------|
| Cookie Consent | Bottom (mobile), z-[100] | **YES** — full-screen backdrop dims everything | **WARN** |
| PWA Install | bottom-[88px], avoids nav | No | **PASS** |
| AI Chat Agent | Lazy-loaded, positioned in corner | Depends on sizing | **UNKNOWN** |
| Trade Onboarding Modal | Full-screen modal | Intentional for first login | **PASS** |
| Offline Fallback | Full-screen, z-[100] | Intentional | **PASS** |

**Evidence:** `src/components/legal/CookieConsent.tsx:88-90` — uses `fixed inset-0 z-[100]` with backdrop blur

#### 2.3 Safe Area Support

- Bottom nav uses `safe-area-bottom` class ✓
- Main content area uses `pb-20 lg:pb-6` to account for bottom nav ✓
- Z-index hierarchy is well-organized: 9999 > 100 > 50 > 40 > 20 > 10 ✓

**Evidence:** `src/components/layout/MobileBottomNav.tsx:20` — `safe-area-bottom` class

#### 2.4 Mobile Form Ergonomics

- Inputs use `text-base` on mobile (prevents iOS zoom) ✓
- `inputMode="decimal"` used on 16 numeric inputs ✓
- Number parsing supports comma/dot (Polish locale) ✓

**Evidence:** `src/components/ui/input.tsx` — `text-base md:text-sm` pattern

#### 2.5 Keyboard Interaction

- Forms use `onSubmit` properly ✓
- `type="tel"` for phone fields ✓
- `autoComplete` attributes present on auth forms ✓

### 3. Mobile Friction List

| # | Friction Point | Severity | Evidence |
|---|---------------|----------|----------|
| M1 | Cookie consent covers entire screen on mobile | Medium | `CookieConsent.tsx:88` — `fixed inset-0` |
| M2 | QuickEstimate workspace not reachable from bottom nav | High | Not in `BOTTOM_NAV_ITEMS` array |
| M3 | Hamburger menu is only way to reach Templates, Profile, Settings | Medium | `Navigation.tsx:90` — `sm:hidden` hamburger |
| M4 | ProjectDetail has 8 tabs that scroll horizontally — easy to miss later tabs | Medium | `ProjectDetail.tsx` — Tab 5-8 not visible without scroll |
| M5 | Registration form has 4 fields + CAPTCHA on one screen — long scroll | Medium | `Register.tsx` — email + phone + password + confirm + CAPTCHA |
| M6 | Dashboard "QuoteCreationHub" cards are small on mobile — hard to distinguish | Low | Cards stack vertically but use small icons |
| M7 | Bottom nav text is 10px — very small for outdoor/sunlight use | Low | `MobileBottomNav.tsx:37` — `text-[10px]` |

### 4. Speed & Performance (Mobile)

**Mobile-specific concerns:**

| Issue | Impact | Evidence |
|-------|--------|----------|
| Main bundle 263KB gzip on 3G (~3-5s) | High first-load latency | Build output analysis |
| No service worker pre-caching of app shell | First load requires full download | `sw.js` caches routes but not JS chunks |
| framer-motion (38KB gzip) lazy-loaded | Good — not blocking | `vite.config.ts:67` |
| i18n loads all 3 locales upfront | Wastes ~2× bandwidth for non-PL users | `src/i18n/index.ts` — static imports |

**PWA Support:**
- Manifest: `standalone` display, portrait-primary ✓
- Service worker: Cache-first for static, network-first for navigation ✓
- Offline fallback: Full-screen overlay with retry ✓
- Install prompt: Positioned to avoid bottom nav ✓

---

## Customer Expectations Fit (Market Alignment)

| Expectation | Status | Evidence | Notes |
|-------------|--------|----------|-------|
| **Minimal signup (email + password)** | **FAIL** | `Register.tsx:36` — requires phone + CAPTCHA always | Phone is mandatory; increases friction per benchmark |
| **Public pricing, clear (Free vs Premium)** | **PARTIAL** | `src/pages/Plany.tsx` — 4 plans visible publicly | BUT: page is 100% hardcoded Polish (not i18n), and `stripePriceId: null` everywhere |
| **Mobile "field-ready"** | **PARTIAL** | Bottom nav ✓, safe-area ✓, but friction points M1-M7 | Quick Estimate not in mobile nav; cookie consent blocks |
| **No overlays blocking CTA** | **WARN** | Cookie consent is full-screen overlay | Mobile users must dismiss before any interaction |
| **Bulk add/import (CSV/paste)** | **PASS** | `BulkAddModal` exists with paste support | `WorkspaceLineItems.tsx` — bulk add modal with 200-item pagination |
| **Offer statuses (accept/reject)** | **PASS** | `/oferta/:token` public portal with dual-token approval | `OfferPublicPage` + `offer_approvals` table |
| **Clear export/share (PDF/link/email)** | **PASS** | SendOfferModal with email + copy link + download PDF | Fallback delivery when email unavailable |
| **Full i18n without gaps** | **PARTIAL** | 1,560 keys × 3 languages (PL/EN/UK) parity | BUT: ~35+ hardcoded Polish strings in critical flows |
| **Core flow not paywalled** | **PASS** | Free plan allows 3 projects, 5 clients, PDF generation | Premium accelerates, doesn't block |
| **Step-by-step guidance** | **PASS** | Trade onboarding → Company setup → 5-step wizard | 3 sequential onboarding flows |

**Score: 6/10 expectations met, 3 partial, 1 fail**

---

## Differentiation Analysis

### Current Differentiators (Evidence-Based)

| Differentiator | Strength | Evidence |
|----------------|----------|----------|
| **Trade-aware onboarding** | Strong | `TradeOnboardingModal.tsx` — 10 trade categories, pre-loads starter pack |
| **3 quote methods (Voice/AI/Manual)** | Medium | `QuoteCreationHub.tsx` — 3 cards on Dashboard |
| **Polish construction locale** | Medium | PLN currency, Polish units, construction-specific templates |
| **Dual-token client approval** | Medium | `SendOfferModal.tsx` — public_token + accept_token |
| **3 PDF templates** | Low | Classic/Modern/Minimal in `PdfPreviewPanel.tsx` |

**Assessment: Trade-aware onboarding is the STRONGEST differentiator.** However, it's hidden behind the first-login modal and not prominently marketed. The 3 quote methods (voice/AI/manual) are good but not unique in the market. No competitor analysis data is available in-repo to verify uniqueness.

### Direction A: "Fastest Quote in Poland" (Extreme Simplicity + Wizard)

**Changes:**
- **UI:** Merge all quote creation into ONE guided 3-step wizard: (1) Pick trade/template → (2) Add items (manual/voice/AI) → (3) Preview & Send
- **Copy:** "Pierwsza wycena w 90 sekund" (First quote in 90 seconds) — timed UX target
- **Flow:** Remove dual quick-estimate paths; single `/app/nowa-wycena` route with smart defaults
- **Verification KPI:** Time-to-first-PDF < 3 minutes for new users (measure via product analytics)

**What changes in UI:**
- Dashboard reduces to single "Stwórz wycenę" CTA
- Wizard with progress bar replaces current 3-card hub
- Auto-save at each step

### Direction B: "Field-Pro Mode" (Mobile-First, Frictionless)

**Changes:**
- **UI:** Bottom nav adds "+" floating action button for quick estimate
- **Copy:** "Twój asystent na budowie" (Your assistant on the job site)
- **Flow:** One-handed quick estimate: large buttons, voice-first, swipe-to-add items
- **Verification KPI:** Mobile session completion rate > 70%; 95th percentile load < 4s on 3G

**What changes in UI:**
- Floating "+" button on bottom nav
- Dedicated mobile-optimized estimate view (no horizontal tabs)
- Larger touch targets (48px minimum everywhere)
- Offline-tolerant form submission (queue and sync)

### Direction C: "Trust & Premium Offer" (PDF Quality + Accept/Reject + Transparency)

**Changes:**
- **UI:** Premium PDF templates with company branding, e-signature, and professional layout
- **Copy:** "Oferty, które budują zaufanie" (Offers that build trust)
- **Flow:** Client portal enhanced with real-time status tracking, payment terms, and professional presentation
- **Verification KPI:** Offer acceptance rate > 40%; client "opened" tracking > 80%

**What changes in UI:**
- 5+ PDF template styles (industry-specific)
- Client portal redesign with progress indicator
- Status timeline on ProjectDetail becomes primary view
- Accept/reject with optional client comment

### Visual Differentiation (Incremental, Not Redesign)

**Proposed minimal visual signature:**
1. **Typography:** Use system font stack with clear hierarchy — H1: 2xl/3xl bold, H2: xl semibold, Body: base/sm
2. **Spacing:** Consistent 4px grid (already Tailwind-based); enforce 16px container padding on mobile
3. **Unique element:** "Ultra-clean estimate table" — the line items table should be the most polished visual in the entire app. Clean borders, clear number alignment, prominent totals row with colored accent
4. **"Next step" rail:** Persistent sidebar/footer showing "You are here → Next: Generate PDF → Send to client" — reduces confusion

---

## Findings Table

| # | Finding | Severity | Impact | Effort | Category |
|---|---------|----------|--------|--------|----------|
| F1 | Registration requires mandatory phone | P1 | High drop-off | Small (1 day) | UX/Auth |
| F2 | Pricing page 100% hardcoded Polish | P1 | Non-PL users can't read pricing | Small (1 day) | i18n |
| F3 | ~35+ hardcoded Polish strings in critical flows | P2 | EN/UK users see broken experience | Medium (3 days) | i18n |
| F4 | exceljs (937KB) not lazy-loaded at click-time | P2 | Unnecessary bandwidth on mobile | Small (1 day) | Perf |
| F5 | Dual quick-estimate paths, neither in nav | P2 | User confusion, dead-end navigation | Medium (2 days) | IA/Nav |
| F6 | No breadcrumbs despite component existing | P2 | Deep pages lack navigation context | Small (1 day) | IA/Nav |
| F7 | Calendar has no empty state | P3 | New users see blank calendar | Tiny (0.5 day) | UX |
| F8 | Cookie consent blocks entire mobile screen | P3 | First interaction delayed | Small (1 day) | Mobile/UX |
| F9 | Bottom nav text is 10px | P3 | Hard to read outdoors | Tiny (0.5 day) | Mobile |
| F10 | Default buttons 40px (below WCAG 44px) | P3 | Touch target slightly small | Small (1 day) | Mobile/A11y |
| F11 | Empty states use inconsistent components | P3 | Visual inconsistency | Medium (2 days) | UX |
| F12 | Delete buttons use non-standard styling | P3 | Inconsistent action signals | Small (1 day) | UX |
| F13 | Stripe not connected (all stripePriceId: null) | P1 | No self-service payment | Large (depends on Stripe setup) | Billing |
| F14 | List pages use 3 different patterns (card/grid/table) | P3 | Cognitive overhead | Medium (3 days) | UX |
| F15 | i18n loads all 3 locales upfront | P3 | Wastes bandwidth | Medium (2 days) | Perf |

---

## Fix Pack Delta Plan

### Quick Wins (1-2 days each)

#### QW1: Make phone optional in registration
- **WHY:** Market benchmark: mandatory phone increases drop-off. Email + password should be sufficient for signup.
- **WHAT:** Change phone from required to optional in `Register.tsx`. Remove the `if (digitsOnly.length < 9)` validation gate. Keep phone field visible but mark "(opcjonalnie)".
- **FILES:** `src/pages/Register.tsx` (lines 36, 46-66)
- **TEST PLAN:** `npm test` — verify existing auth tests pass; manual: register without phone succeeds
- **ROLLBACK:** Revert single file change
- **SUCCESS:** User can register with only email + password

#### QW2: Localize pricing page
- **WHY:** Non-Polish users see hardcoded Polish on public pricing page — blocks international adoption.
- **WHAT:** Replace hardcoded strings in `Plany.tsx` with `t()` calls using existing `billing.plans.*` i18n keys from `plans.ts`.
- **FILES:** `src/pages/Plany.tsx` (lines 19, 35-39, 46-51, 67, 77, 97, 102, 106, 117)
- **TEST PLAN:** `npm test`; manual: switch language to EN/UK on `/plany` — all text should translate
- **ROLLBACK:** Revert single file change
- **SUCCESS:** Pricing page renders correctly in all 3 languages

#### QW3: Add breadcrumbs to deep pages
- **WHY:** Users get lost in deep pages (ProjectDetail → QuoteEditor → PdfGenerator) with only a back button.
- **WHAT:** Add `<Breadcrumb>` component to ProjectDetail, QuoteEditor, PdfGenerator pages using existing `src/components/ui/breadcrumb.tsx`.
- **FILES:** `src/pages/ProjectDetail.tsx`, `src/pages/QuoteEditor.tsx`, `src/pages/PdfGenerator.tsx`
- **TEST PLAN:** `npm test`; manual: navigate to `/app/jobs/:id/pdf` — breadcrumb shows Dashboard > Projects > Project Name > PDF
- **ROLLBACK:** Revert 3 files
- **SUCCESS:** All deep pages show breadcrumb trail

#### QW4: Add calendar empty state
- **WHY:** New users see a blank calendar with no guidance.
- **WHAT:** Add `<EmptyState>` component (from `src/components/ui/empty-state.tsx`) when user has 0 events.
- **FILES:** `src/pages/Calendar.tsx`
- **TEST PLAN:** `npm test`; manual: new user visits calendar — sees friendly empty state with CTA
- **ROLLBACK:** Revert single file
- **SUCCESS:** Empty calendar shows guidance message

#### QW5: Increase bottom nav text to 11-12px
- **WHY:** 10px text is very difficult to read on a phone outdoors (sunlight, gloves).
- **WHAT:** Change `text-[10px]` to `text-[11px]` in MobileBottomNav, and ensure icon size remains proportional.
- **FILES:** `src/components/layout/MobileBottomNav.tsx` (line 37)
- **TEST PLAN:** `npm test`; manual: check bottom nav readability on mobile viewport
- **ROLLBACK:** Revert single line
- **SUCCESS:** Bottom nav text is more readable without layout breakage

### Medium Items (3-7 days each)

#### M1: Consolidate quick-estimate paths
- **WHY:** Two parallel paths (`/app/quick-est` and `/app/szybka-wycena`) confuse users and split maintenance effort.
- **WHAT:** Redirect `/app/quick-est` to `/app/szybka-wycena`. Add "Szybka wycena" to main navigation. Remove legacy QuickEstimate component over time.
- **FILES:** `src/App.tsx` (route config), `src/components/layout/Navigation.tsx`, `src/pages/QuickEstimate.tsx` (add redirect)
- **TEST PLAN:** `npm test`; manual: `/app/quick-est` redirects properly; "Szybka wycena" appears in nav
- **ROLLBACK:** Revert route change + nav config
- **SUCCESS:** Single quick-estimate entry point visible in navigation

#### M2: Extract hardcoded Polish strings to i18n
- **WHY:** EN/UK users see Polish error messages, status labels, and UI text in critical flows.
- **WHAT:** Replace ~35 hardcoded strings across OfferApprovalPanel, NewProject, TeamMembersPanel, PdfPreviewPanel, SendOfferModal with `t()` calls and add keys to all 3 locale files.
- **FILES:** `src/components/offers/OfferApprovalPanel.tsx`, `src/pages/NewProject.tsx`, `src/components/team/TeamMembersPanel.tsx`, `src/components/offers/PdfPreviewPanel.tsx`, `src/components/offers/SendOfferModal.tsx`, `src/i18n/locales/pl.json`, `src/i18n/locales/en.json`, `src/i18n/locales/uk.json`
- **TEST PLAN:** `npm test`; run `bash scripts/check-i18n-hardcodes.sh` — count should decrease significantly
- **ROLLBACK:** Revert changed files
- **SUCCESS:** 0 hardcoded Polish strings in listed components; all 3 locales have matching keys

#### M3: Lazy-load exceljs at click-time
- **WHY:** exceljs (937KB raw / 271KB gzip) is the single largest chunk. Most users never use Excel export.
- **WHAT:** Convert exceljs import to dynamic `import()` inside the export handler function. Remove from Vite manualChunks if present.
- **FILES:** Files that import exceljs (likely `src/lib/exportUtils.ts` or similar), `vite.config.ts`
- **TEST PLAN:** `npm run build` — verify exceljs chunk is lazy; manual: click Excel export — verify it works; bundle size of initial load decreases
- **ROLLBACK:** Revert import change
- **SUCCESS:** exceljs not in initial bundle; loads only on export click

#### M4: Cookie consent mobile optimization
- **WHY:** Full-screen dimming overlay blocks ALL mobile interaction until dismissed.
- **WHAT:** Change mobile cookie consent from full-screen overlay to bottom bar (non-blocking). Keep accept/reject buttons visible without blocking content.
- **FILES:** `src/components/legal/CookieConsent.tsx`
- **TEST PLAN:** `npm test`; manual: mobile viewport — cookie consent shows as bottom bar, content still scrollable behind it
- **ROLLBACK:** Revert single file
- **SUCCESS:** Cookie consent doesn't block mobile interaction

#### M5: Standardize empty states across list pages
- **WHY:** Projects, Clients, Templates use different custom implementations instead of the shared EmptyState component, creating visual inconsistency.
- **WHAT:** Replace custom empty state implementations with `<EmptyState>` from `src/components/ui/empty-state.tsx` across Projects, Clients, and Templates pages.
- **FILES:** `src/pages/Projects.tsx`, `src/pages/Clients.tsx`, `src/pages/ItemTemplates.tsx`
- **TEST PLAN:** `npm test`; manual: verify each page shows consistent empty state when data is empty
- **ROLLBACK:** Revert 3 files
- **SUCCESS:** All list pages use shared EmptyState component with consistent styling

### Strategic Items (Multi-week)

#### S1: Design system consolidation
- **WHY:** List pages use 3 different patterns (single-column cards, multi-column grid, table). Buttons have inconsistent sizing. This creates cognitive overhead and maintenance burden.
- **WHAT:** Define a shared `<DataList>` component with card/grid/table variants. Standardize button sizes to 44px minimum for WCAG compliance. Document the component library.
- **FILES:** New component + updates to Projects, Clients, Templates, Finance pages
- **TEST PLAN:** Component tests for `<DataList>`; visual regression check across all list pages
- **ROLLBACK:** Revert new component and page updates
- **SUCCESS:** All list pages share consistent layout patterns; all buttons meet 44px minimum

#### S2: Pricing & billing flow (Stripe connection)
- **WHY:** All `stripePriceId: null` — no self-service payment. Users cannot upgrade without manual intervention. This is the #1 SaaS blocker.
- **WHAT:** Connect Stripe, set `stripePriceId` values in `plans.ts`, implement checkout flow via `create-checkout-session` Edge Function (already scaffolded).
- **FILES:** `src/config/plans.ts`, Stripe dashboard configuration, `supabase/functions/create-checkout-session/`
- **TEST PLAN:** Test checkout flow end-to-end with Stripe test mode; verify webhook delivery
- **ROLLBACK:** Set `stripePriceId` back to `null`
- **SUCCESS:** User can upgrade from Free to Pro via self-service Stripe checkout

#### S3: Differentiation implementation (choose one direction)
- **WHY:** Without a clear differentiator, Majster.AI is "another construction management tool." Implementing one direction (A/B/C from Differentiation section) creates market positioning.
- **WHAT:** Based on owner decision:
  - Direction A: Merge quote flows into single guided wizard with 90-second target
  - Direction B: Implement mobile FAB + one-handed estimate flow
  - Direction C: Premium PDF templates + enhanced client portal
- **FILES:** Depends on chosen direction — affects 5-15 files
- **TEST PLAN:** Direction-specific UX testing with 3-5 real contractors
- **ROLLBACK:** Feature flag to disable new flow and revert to current
- **SUCCESS:** Direction-specific KPI shows measurable improvement

---

## Evidence Log

### Commands Executed

| # | Command | Result | Timestamp |
|---|---------|--------|-----------|
| E1 | `git log --oneline -5` | Latest commit `3b65f2d` | 2026-02-26 |
| E2 | `npm run build` | **PASS** — 39.62s, 135 JS chunks | 2026-02-26 |
| E3 | `npm run lint` | **PASS** — 0 errors, 19 warnings | 2026-02-26 |
| E4 | `npm test` | **PASS** — 688 passed, 5 skipped | 2026-02-26 |
| E5 | `tsc --noEmit` | **PASS** — 0 errors | 2026-02-26 |
| E6 | `ls -lhS dist/assets/js/*.js \| head -20` | exceljs=937KB, index=533KB | 2026-02-26 |

### File Evidence Index

| E-ID | File:Lines | Finding |
|------|-----------|---------|
| FE-001 | `src/pages/Register.tsx:36` | Phone required: `!email \|\| !phone \|\| !password` |
| FE-002 | `src/pages/Plany.tsx:35-39,46-51` | Hardcoded Polish: "Zaloguj się", "Cennik i plany" |
| FE-003 | `src/components/offers/OfferApprovalPanel.tsx:126-128` | Hardcoded: `'Zaakceptowana'`, `'Odrzucona'`, `'Oczekuje'` |
| FE-004 | `src/pages/NewProject.tsx:103-216` | 10+ hardcoded Polish toast messages in voice/AI mode |
| FE-005 | `src/components/team/TeamMembersPanel.tsx:79-156` | 8+ hardcoded strings: labels, roles, empty state |
| FE-006 | `src/components/layout/MobileBottomNav.tsx:37` | `text-[10px]` — very small for outdoor use |
| FE-007 | `src/components/legal/CookieConsent.tsx:88` | `fixed inset-0 z-[100]` — full-screen mobile blocking |
| FE-008 | `src/components/ui/breadcrumb.tsx` | Component exists but 0 usage across pages |
| FE-009 | `src/pages/Calendar.tsx` | No empty state for 0 events |
| FE-010 | `vite.config.ts:54-69` | Manual chunks configured, exceljs not isolated |
| FE-011 | `src/config/plans.ts:74,112,152,192` | All `stripePriceId: null` |
| FE-012 | `src/i18n/locales/pl.json` vs `en.json` vs `uk.json` | 1,560 keys each — structural parity ✓ |
| FE-013 | `src/components/layout/Navigation.tsx:39-50` | Nav uses i18n keys properly |
| FE-014 | `src/components/ui/skeleton-screens.tsx` | Dashboard/Projects/Clients skeletons exist |
| FE-015 | `src/components/ui/empty-state.tsx` | Shared component exists but used only by Finance |

### UNKNOWN Items (Missing Data)

| # | Item | Blocker | Minimal Step to Obtain |
|---|------|---------|----------------------|
| U1 | Runtime Lighthouse scores | No browser/Lighthouse available in sandbox | Run `npx lighthouse https://majster-ai-oferty.vercel.app --output json` on production |
| U2 | Actual mobile viewport testing | No device/emulator in sandbox | Use Chrome DevTools responsive mode on deployed site |
| U3 | AI Chat Agent mobile positioning | Cannot verify without runtime | Check z-index and position on live mobile viewport |
| U4 | Competitor feature comparison | No competitor data in repo | Gather from market research (Kosztorysant, Oferto.pl, etc.) |
| U5 | Real user session analytics | No analytics tool connected | Set up PostHog/Mixpanel for funnel analysis |
| U6 | Actual 3G load time measurements | No network throttling in sandbox | Use Chrome DevTools Network panel with 3G preset |

---

## Rollback Guidance

All proposed changes follow **atomic PR** pattern — each fix is a single PR touching minimal files.

**General rollback strategy:**
1. Each PR modifies 1-3 files maximum
2. Every change has a `git revert` path
3. No database migrations involved (frontend-only audit)
4. No dependency additions required for Quick Wins
5. Feature flags recommended for Strategic items (S1-S3)

**Emergency rollback for any PR:**
```bash
git revert <commit-sha> --no-edit
git push origin <branch>
# Vercel auto-deploys reverted code
```

**Pre-flight checklist before any change:**
1. `npm run lint` — 0 errors
2. `npm test` — all passing
3. `npm run build` — succeeds
4. Manual smoke test of affected flow

---

## Summary Scorecard

| Domain | Desktop | Mobile | Evidence |
|--------|---------|--------|----------|
| **IA / Navigation** | 7/10 | 6/10 | Dual quick-estimate paths, no breadcrumbs |
| **Consistency** | 6/10 | 6/10 | 3 list patterns, inconsistent empty states |
| **Builder Readability** | 7/10 | 6/10 | Good labels but too many entry points |
| **Speed / Performance** | 7/10 | 5/10 | exceljs bloat, main bundle heavy for 3G |
| **i18n Completeness** | 7/10 | 7/10 | Key parity ✓ but 35+ hardcoded strings |
| **Onboarding** | 8/10 | 7/10 | Trade-aware onboarding is strong |
| **Market Expectations** | 6/10 | 5/10 | Phone required, Stripe not connected |
| **Differentiation** | 6/10 | 5/10 | Trade onboarding good, but not marketed |
| **Overall** | **68/100** | **59/100** | Conditional — strong bones, needs hardening |

**Model used:** Claude Opus 4.6 for all audit decisions, UX judgements, risk/compliance, prioritization, and differentiation strategy. Build/lint/test commands executed directly.
