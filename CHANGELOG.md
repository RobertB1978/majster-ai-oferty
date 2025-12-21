# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]
### Added
- Stabilised Playwright configuration (deterministic preview server on `127.0.0.1:4173`, single retry, richer artifacts).
- Coverage thresholds enforced in `vitest.config.ts` (fail under 55/35/55/55).
- Bundle budgets enforced via `size-limit` with CI gate.
- CI hardening: npm audit moderate now blocking; Snyk guarded by secret presence.
- Supabase Stripe webhook now configurable via `STRIPE_PRICE_PLAN_MAP` secret (no redeploy for price changes).
- New docs: `CI_TROUBLESHOOTING.md`, `GITHUB_SETTINGS.md`, GitHub/Vercel/Supabase secrets tables refreshed.

### Changed
- Upgraded build toolchain to **Vite 7.3** with explicit Supabase alias for Rollup compatibility.
- ErrorBoundary no longer leaks messages outside development; added regression tests.

## [2025-12-17]
### Added
- Bundle size optimization (lazy loading for heavy pages/components).
- Stripe subscription integration (Edge Functions + frontend hook).
- Comprehensive documentation set (STRIPE_SETUP, BUNDLE_OPTIMIZATION, strategic roadmap).

### Security
- Sentry PII scrubbing and runtime hardening improvements.

