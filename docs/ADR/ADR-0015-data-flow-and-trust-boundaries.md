# ADR-0015 — Data Flow and Trust Boundaries for Majster.AI

**ADR numbering note:** ADR-0014 is already taken by
`ADR-0014-public-offer-canonical-flow.md`. ADR-0011 is intentionally not present in
the repo history. The next free number at the time of writing is **0015**.

## Status

**Accepted** (2026-04-21). PR-L9.
Companion doc: `docs/legal/DATA_FLOW_MAP.md`.

## Context

After PR-L1 (legal versioning), PR-L2 (terms-acceptance binding), PR-L3 (DSAR inbox),
PR-L3b (deployment-truth hardening), PR-L5 (subprocessors registry + DPA dynamic
section), and PR-L8 (hard compliance audit log) the platform has structural plumbing
for compliance evidence but **no single source of truth** that explains _where data
lives, who touches it, and across which trust boundary_.

Later PRs depend on such a map:

- **PR-L10** (records of processing, RoPA) needs a canonical controller/processor
  matrix per data category.
- **PR-L6** (retention) needs a canonical category list and storage-layer mapping.
- **PR-L7** (breach register) needs canonical trust boundaries to scope incident
  surfaces.
- **PR-L4** (admin legal CMS) needs a canonical definition of admin vs authenticated
  vs public zones, and which of them is allowed to mutate which data.

Without this ADR, each of those PRs would either re-derive the map (duplicated work,
inconsistent wording) or invent classifications (and the "do not guess" rule of this
codebase — `CLAUDE.md` Global Rule #4 — forbids that).

Two additional constraints shape this decision:

1. The repo must remain the **source of truth**. `docs/DEPLOYMENT_TRUTH.md:6-12`
   already enshrines "repo-side evidence only, no dashboard guessing".
2. `docs/legal/SUBPROCESSORS_REGISTRY_AND_DPA.md` already defines `public.subprocessors`
   (migration `20260420200000_pr_l5_subprocessors_registry.sql`) as the **database**
   source of truth for subprocessors. The data-flow map must **consume** that table,
   not re-invent it.

## Decision

We accept the following architectural positions and codify them in
`docs/legal/DATA_FLOW_MAP.md`:

### D1. Trust-zone taxonomy is fixed to four zones

We recognise exactly four trust zones on the product side:

- **Zone 1 — Public (anonymous).** Marketing, legal, pricing, and token-gated
  public offer / project / dossier pages. Evidence: `src/App.tsx:232-298`.
- **Zone 2 — Authenticated customer app.** Everything under `/app/*`, gated by
  `ProtectedRoute`. Evidence: `src/App.tsx:305-376`, `src/components/auth/ProtectedRoute.tsx`.
- **Zone 3 — Admin.** Everything under `/admin/*`, gated by `user_roles.role='admin'`
  enforced both at layout and RLS level. Evidence: `src/App.tsx:379-394`,
  `docs/ADR/ADR-0012-admin-rbac-route-split.md`, migration
  `20260416120000_fix_user_roles_schema_rls.sql`.
- **Zone 4 — Server-side authority (Edge Functions + service_role).** The only zone
  that may bypass RLS. Enforced by secret-confinement: `SUPABASE_SERVICE_ROLE_KEY`
  exists solely in Edge Function environment variables — it never reaches the browser.
  Evidence: every `supabase/functions/**/index.ts` uses `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`.

Any future privacy/security work must map its concerns to one of these four zones.
Adding a new zone requires a new ADR.

### D2. `public.subprocessors` is the canonical list of processors

The data-flow map does not enumerate processors in Markdown. It references the
`public.subprocessors` table. Adding, removing, or re-classifying a subprocessor
means updating that table (future admin-CRUD) — not editing the Markdown.

Rationale: prevents drift between DPA, DATA_FLOW_MAP, and any future RoPA.

### D3. Controller vs processor split per data category is classified in §3 of DATA_FLOW_MAP

- **Majster.AI is controller** for: contractor account identity, contractor company
  profile, compliance evidence (legal_acceptances, compliance_audit_log, dsar_requests,
  user_consents), billing relationship data, and telemetry.
- **Majster.AI is processor on behalf of the contractor** for: client (end-customer)
  data, project / offer / quote content, uploaded photos and documents, and AI prompt
  content that includes such data.
- Where a classification cannot be proven from repo alone (e.g., who is controller of
  an offer-acceptance signature at the moment of legal dispute) the map marks the row
  **UNKNOWN** and defers to later operational resolution.

This split is the canonical input for PR-L10 (RoPA).

### D4. Public data exposure happens exclusively through opaque tokens + SECURITY DEFINER RPCs

For anonymous access to otherwise private data (offers, projects, dossiers), the
decision is: **never RLS-relax on anon to full rows**. Instead, use a SECURITY DEFINER
RPC that accepts an opaque token and returns only the projection needed by the public
page. Evidence of the pattern:

- `supabase/migrations/20260419130000_arch05_l6_accept_token.sql` (canonical
  acceptance token flow)
- `supabase/migrations/20260413120000_sec01_harden_offer_approvals_anon_access.sql`
  (legacy flow hardening)
- `supabase/migrations/20260302000000_pr16_dossier.sql` +
  `20260403120000_dossier_public_download_policy.sql` (dossier flow)
- `supabase/migrations/20260314130000_offer_photos_public_access.sql` (public
  offer-photo RPC granted to `anon`)

New public-facing data surfaces must follow the same pattern.

### D5. All third-party outbound traffic originates from Edge Functions (except browser-script subprocessors after explicit consent)

Server-to-third-party calls (Resend, Stripe server-side, OpenAI/Anthropic/Gemini)
happen in Edge Functions with API keys stored in function secrets. Evidence:
`supabase/functions/_shared/ai-provider.ts:68-82`,
`supabase/functions/stripe-webhook/index.ts:72-75`,
`supabase/functions/send-offer-email/index.ts`.

Browser-originating third-party traffic is limited to:

- **Stripe** (checkout redirect / `@stripe/stripe-js`) — business necessity.
- **Plausible** — loaded **only after analytics consent** by
  `src/components/legal/CookieConsent.tsx:22-31` (`initPlausible()`).
- **Sentry** — frontend DSN is present in `src/lib/sentry.ts`.

Any new browser-side third-party must either (a) obey the cookie-consent gate, or
(b) be added behind the same gate pattern. No direct `<script src>` of unvetted
third-party providers in `index.html`.

### D6. Compliance evidence lives in three append-minded tables

- `public.legal_acceptances` (PR-L1): versioned consent.
- `public.compliance_audit_log` (PR-L8): append-only (no UPDATE/DELETE policy).
- `public.dsar_requests` (PR-L3): workflow table; transitions produce audit events.

These are the **only** tables the data-flow map treats as "indefinite retention by
design". Everything else has retention **UNKNOWN** — owed to PR-L6.

### D7. Unknowns are enumerated, not papered over

The map contains an explicit "Known Gaps / UNKNOWNs" section (§8). Each gap is
assigned to a later PR or an operational action. Future PRs that claim to resolve a
gap MUST update the map and remove the UNKNOWN line. Re-introducing an UNKNOWN after
it has been resolved requires an ADR.

## Consequences

### Positive

- PR-L10 (RoPA) can cite §3 + §4 of the map directly; no re-derivation.
- PR-L6 (retention) has one list of categories to attach retention values to — §4.
- PR-L7 (breach register) has one list of trust boundaries (§6) to monitor for
  incident entry points.
- PR-L4 (admin legal CMS) has a canonical four-zone definition to gate mutations by.
- New privacy-impacting PRs can be reviewed against the map; anything not fitting
  must either amend the map or justify deviation.
- Reduces drift between DPA text, subprocessors registry, and internal docs by
  making `public.subprocessors` the single source of truth.

### Negative / limits

- Runtime-only uncertainty remains. Retention on AI-provider side, Stripe-side,
  Plausible-side, and Sentry-side is **not** governed by repo code — it depends on
  account configuration. The map flags this but cannot fix it.
- Vercel's classification (Art. 28 RODO processor?) remains `status='planned'` — an
  operational decision the repo cannot make. See `docs/DEPLOYMENT_TRUTH.md:76`.
- The "offer-acceptance signature" row in §3 is explicitly UNKNOWN regarding
  controllership at moment of legal dispute. Operational/legal input required.
- `ip_hash` in `legal_acceptances` remains null by design (browser cannot see real
  IP) — documented in `docs/legal/TERMS_ACCEPTANCE_BINDING.md:95-100`. Backfilling
  from server-side is a separate (possibly optional) future PR.
- Some classifications ("controller of end-client data" vs "processor") are
  best-effort from repo evidence and DPA wording. If a deployed DPA changes, this
  map must be re-checked.

## Rejected alternatives

1. **"One flat privacy statement as the source of truth."** Rejected — the existing
   DPA dynamic-section flow (PR-L5) already splits subprocessors into a DB table.
   Folding everything back into prose would reintroduce the drift PR-L5 eliminated.
2. **"Infer data flows from legal copy (i18n JSON) and nothing else."** Rejected —
   legal copy describes the user-facing agreement, not the runtime wiring. We want
   the map to cite `supabase/functions/*` and migration files so it can be audited
   against the code, not against marketing language.
3. **"Skip trust-boundary modeling; build PR-L6/L7/L10 each from scratch."** Rejected
   — that guarantees three slightly different categorisations of the same data,
   which is an audit liability.
4. **"Consolidate ADR and DATA_FLOW_MAP into one document."** Rejected — the ADR is
   short-lived and records the decision; the map is living reference material that
   later PRs will edit as gaps close. Different audiences, different cadence.
5. **"Merge data-flow map into `docs/DATABASE_STRUCTURE.md`."** Rejected — database
   structure and data flows are adjacent but not identical. A table diagram tells us
   which columns exist; a data-flow map tells us which actor crossed which boundary
   to write them. Keeping them separate mirrors the existing
   `docs/DEPLOYMENT_TRUTH.md` ↔ code separation.

## Agent vs Owner actions

- **Agent (this PR):** creates `docs/legal/DATA_FLOW_MAP.md` and this ADR. No runtime,
  no migrations, no UI, no policy text changes.
- **Owner (later):** operational decisions for G4 (Anthropic DPA URL), G5 (Vercel
  processor classification), G6 (AI-provider retention settings), G9 (Plausible domain
  confirmation), and approval/assignment of PR-L4/L6/L7/L10 owners.
