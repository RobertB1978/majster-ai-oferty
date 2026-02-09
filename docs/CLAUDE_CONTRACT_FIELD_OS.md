# CLAUDE CONTRACT: Field OS Refactor

## How to Use

This document is the **durable contract** for the Field OS refactor of Majster.AI.
If context is lost or truncated, re-open this file and rebuild the plan strictly from it.

**Recovery Rule:**
1. Re-open this file
2. Rebuild plan strictly from this contract
3. Continue work without deviating unless a new ADR note is written

---

## LANGUAGE POLICY
- UI strings: Polish only (professional, concise, construction-industry tone)
- Code comments: English, short and technical
- Outputs: English (except UI copy examples in Polish)

## NORTH STAR
Deliver a professional, glove-friendly "Digital Power Tool" experience that feels instant, reliable, and safe.
Industrial trust cues: high-contrast, explicit actions, clear system status, no "mystery UI".

## MISSION (NON-NEGOTIABLE)

### A) Strict Routing Zones
- `"/"` -> Public Marketing (no auth)
- `"/app/*"` -> Customer App (auth required)
- `"/admin/*"` -> Owner Console (owner-only)

### B) Industrial "Digital Power Tool" Visual Identity
- White content surfaces, slate-900 chrome/menus
- Primary accent: Safety Amber `#F59E0B`
- High contrast, large touch targets >= 48px
- Hard borders, minimal shadows
- NO glow, blur, gradients

### C) NO FEATURE REGRESSIONS
- Do NOT delete existing features/tools
- If unfinished: keep route + page shell "Wkrotce"

## CRITICAL CLARIFICATION (ROLES)
- `/admin` = Owner Console (SaaS operator/creator) with platform-wide controls
- Customer "admin of their company" is inside `/app` and is constrained by plan + permissions

## TECH STACK
- React + React Router (existing)
- Tailwind CSS (keep; remove glow/blur patterns)
- Icons: lucide-react ONLY
- Config validation: Zod
- State: minimal (Context/Reducer)
- SECURITY: never use dangerouslySetInnerHTML
- FEEDBACK: No window.alert(). Centralized Toast system (Sonner, already in repo)

## PERFORMANCE & UX STANDARDS

### Code Splitting
- React.lazy() + Suspense for `/admin` zone (and heavy pages)
- Regular customers must NOT download Owner Console bundles
- Skeleton fallback for Suspense (not spinner)

### Centralized Toasts
- Already have Sonner in repo - consolidate to single system
- All success/error/info feedback through this provider

### Scroll Restoration
- Navigating list -> detail -> back must restore scroll position

## RESILIENCE & SPEED
- GlobalErrorBoundary (already exists at App level)
- ConfigProvider: "System Unavailable" + "Reset Config" on failure
- "Last-known-good config" fallback on invalid config load
- SKELETON SCREENS for primary content loading
- OPTIMISTIC UI for status changes
- EMPTY/ERROR STATES for every page

## SECURITY & GOVERNANCE
- Zod validation (strict) for config/content
- URL allowlist for external links/logo
- Sanitize text inputs (no HTML)
- No dangerouslySetInnerHTML
- Auth guards for /app and /admin separately
- Threat Model Lite in ADR

## IA & ROUTING (REQUIRED MINIMUM ROUTES)

### Marketing (no auth)
- `/` -> Landing page
- `/login`
- `/register`

### Customer App (auth required)
- `/app/dashboard` -> Pulpit
- `/app/jobs` -> Zlecenia (mapped from /projects)
- `/app/jobs/:id` -> Job Detail
- `/app/jobs/:id/quote` -> Quote Editor
- `/app/jobs/:id/pdf` -> PDF Generator
- `/app/quick-est` -> Szybka Wycena
- `/app/calendar` -> Kalendarz
- `/app/clients` -> Klienci
- `/app/finance` -> Koszty/Faktury
- `/app/settings` -> Ustawienia
- `/app/plan` -> Moj plan (mapped from /billing)
- `/app/team` -> Zespol
- `/app/marketplace` -> Marketplace
- `/app/analytics` -> Analityka
- `/app/templates` -> Szablony
- `/app/profile` -> Profil firmy

### Owner Console (owner-only)
- `/admin/dashboard` -> Platform overview
- `/admin/app-config` -> Global configuration editor
- `/admin/theme` -> Theme tokens editor
- `/admin/plans` -> Plans & entitlements editor
- `/admin/content` -> Tutorial/onboarding + landing content editor
- `/admin/navigation` -> Reorder sidebar + show/hide modules
- `/admin/audit` -> Audit log + config versions + rollback
- `/admin/diagnostics` -> Health placeholders

## AUTHORIZATION
- Roles: customer_user, customer_company_admin (inside /app only), owner_super_admin (inside /admin only)
- Route guards: /app requires authenticated customer_user, /admin requires owner_super_admin
- Reuse existing useAdminRole() and useAuth() hooks

## OWNER CONSOLE - CONFIG-DRIVEN, SAFE, AUDITABLE

### Config as Data
- `appConfig.version` (semver)
- Zod schema with strict types + defaults
- Store: currentConfig, lastKnownGoodConfig, versions history (max 10)
- Operations: validate, previewDiff, apply, rollback, resetToDefaults
- On load: validate currentConfig; if invalid => restore lastKnownGood + toast

### Theme Tokens (Safe)
- tokens only: colors, typography scale, density, radius, borders, logoUrl placeholder
- map tokens to runtime CSS variables (ThemeProvider)
- NO arbitrary CSS/HTML textarea

### Navigation & Module Flags
- define nav groups + items + ordering
- show/hide modules, ComingSoon toggle
- per-plan gating and limits display

### Plans & Entitlements
- define tiers (Free/Pro/Business/Enterprise) - already exist in usePlanGate
- /app/plan shows what user bought, limits, and upgrade UX

### Content Management
- tutorial content for /app
- marketing landing content controls

### Audit Log + Rollback
- record: timestamp, actor, summary, keys changed
- rollback in 1 click
- show "Last applied" indicator

## UI SYSTEM (ENTERPRISE CONSISTENCY)
- Use existing `src/components/ui/` primitives (40+ already exist)
- Accessibility: aria-label for icon-only buttons, focus states, keyboard nav
- Icon discipline: lucide-react only (already enforced)

## DATA ARCHITECTURE
- Create `src/data/mockData.ts` single source of truth
- Create `src/data/dataProvider.ts` functions: listJobs, getJobById, etc.
- Views must never hardcode domain data

## TAILWIND + TOKENS
- Extend theme for industrial tokens
- safety-amber (#F59E0B) token
- Remove glow/blur/gradient utilities
- Hard borders over shadows

## RESPONSIVE
- Desktop (>=1024px): sidebar + top header
- Mobile (<1024px): bottom nav + top header
- NO horizontal scrolling on body

## FIELD FEATURES (/app/jobs/:id)
1. Photo Proof (UI only): drag & drop + upload button + local preview grid
2. Voice Memo UI (placeholder): mic button next to notes input
3. Status workflow: Rozpocznij / Wstrzymaj / Zakoncz with confirmation modal

## DO-NOT-BREAK LIST
- PDF generation/export (PdfGenerator.tsx + offerPdfGenerator.ts)
- Offer email sending (SendOfferModal + send-offer-email Edge Function)
- Public offer approval (OfferApproval.tsx + approve-offer Edge Function)
- Quote editing (QuoteEditor.tsx + useSaveQuote)
- Client management (Clients.tsx + useClients)
- Project management (Projects.tsx + useProjects)
- Company profile (CompanyProfile.tsx + useProfile)
- Item templates (ItemTemplates.tsx + useItemTemplates)
- Calendar (Calendar.tsx + useCalendarEvents)
- Team management (Team.tsx + useTeamMembers)
- Finance (Finance.tsx + useFinancialReports)
- Analytics (Analytics.tsx + useAnalyticsStats)
- Billing/Subscription (Billing.tsx + useSubscription + usePlanGate)
- AI Chat (AiChatAgent.tsx)
- Authentication flow (Login/Register/ForgotPassword/ResetPassword)
- i18n translations (pl/en/uk)
- PWA features (InstallPrompt, OfflineFallback)
- Cookie consent
- Biometric auth
- Voice input
- Photo estimation
- Onboarding flow
