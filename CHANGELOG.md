# Changelog

All notable changes to Majster.AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-alpha] - 2026-02-08

### Summary

First versioned release. Establishes engineering-complete MVP with all core features implemented, all quality gates passing, and comprehensive governance documentation.

### Added

- **Authentication & Authorization** — Supabase Auth with RLS, role-based access
- **Client Management** — CRUD for clients with organization isolation
- **Project Management** — Full project lifecycle tracking with timeline
- **Quote Editor** — AI-assisted quote creation and editing
- **Offer Generation** — PDF offer generation with email delivery
- **Offer Approval** — Public approval flow via `/offer/:token`
- **Company Profile** — Business profile and portfolio management
- **Calendar & Scheduling** — Event management and scheduling
- **Dashboard** — Analytics and overview dashboard with charts
- **Finance & Billing** — Financial tracking and invoice management
- **Marketplace** — Client-contractor connection platform
- **Team Management** — Multi-user organization support
- **Admin Panel** — System administration and audit logs
- **Settings** — User preferences, notifications, security settings
- **Internationalization** — Full Polish/English support (i18next)
- **PDF Generation** — Client-side PDF creation (jsPDF)
- **Photo Analysis** — AI-powered photo analysis (Edge Function)
- **Voice Input** — Voice-to-quote processing (Edge Function)
- **OCR** — Invoice OCR processing (Edge Function)
- **AI Chat Agent** — AI assistant for business queries (Edge Function)
- **Expiring Offer Reminders** — Scheduled email notifications (Edge Function)
- **Progressive Web App** — PWA support with Capacitor for mobile
- **Security Headers** — CSP, HSTS, X-Frame-Options via Vercel
- **Error Monitoring** — Sentry integration
- **CI/CD** — GitHub Actions for lint, test, build, type-check
- **16 Edge Functions** — All configured in `supabase/config.toml`
- **22 Database Migrations** — Full schema with RLS policies
- **281 Tests** — Unit and integration tests (Vitest)
- **Enterprise Documentation** — ADRs, roadmap, PR playbook, governance guides

### Quality Gates

| Gate | Result |
|------|--------|
| `npm run type-check` | PASS (0 errors) |
| `npm run lint` | PASS (0 errors, 17 cosmetic warnings) |
| `npm test` | PASS (281/281 tests) |
| `npm run build` | PASS |

### Known Issues

- CSP `frame-ancestors 'none'` may conflict with offer embedding use case (see ADR-0002)
- 17 `react-refresh/only-export-components` lint warnings (cosmetic, from shadcn/ui patterns)
- Supabase ESM build warnings (benign, upstream issue)

### Pending (Owner Action Required)

- Production deployment verification (11 Vercel/Supabase evidence items)
- GitHub branch protection enforcement
- CSP frame-ancestors business decision for offer embedding
