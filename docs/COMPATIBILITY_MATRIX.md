# Compatibility Matrix — Public Offer Flows

**Status:** ACTIVE  
**Created:** 2026-04-13  
**PR:** PR-ARCH-02 (`claude/pr-arch-02-public-offer-phase2-0Kgl9`)  
**Baseline:** ADR-0005 (PR-ARCH-01)

---

## Summary

Majster.AI has **three public offer routes** that were consolidated across two phases.
This document is the authoritative reference for what each route does, what token it uses,
and when it will be deprecated.

Backward compatibility for already-sent customer links is **unconditionally guaranteed** until
the deprecation conditions listed below are met.

---

## Route Compatibility Table

| Route | Component | Token source | Token table | Read backend | Write backend | Status | Deprecated when |
|-------|-----------|-------------|-------------|--------------|---------------|--------|-----------------|
| `/a/:token` | `OfferPublicAccept` | `acceptance_links.token` | `acceptance_links` | `resolve_offer_acceptance_link` RPC | `process_offer_acceptance_action` RPC | **CANONICAL** — all new offers | — |
| `/offer/:token` | `OfferApproval` | `offer_approvals.public_token` | `offer_approvals` | `get_offer_approval_by_token` RPC | `approve-offer` Edge Function | **LEGACY COMPAT** — existing links only | After L-1/L-2 gaps filled + 30-day redirect window |
| `/oferta/:token` | `OfferPublicPage` | `offer_approvals.public_token` | `offer_approvals` | `get_offer_approval_by_token` RPC | `approve-offer` Edge Function | **LEGACY COMPAT** — existing links only | After L-1/L-2 gaps filled + 30-day redirect window |

---

## Token Shape Table

| Token type | Table | Column | Format | TTL | Uniqueness | Who creates it |
|------------|-------|--------|--------|-----|-----------|----------------|
| Canonical token | `acceptance_links` | `token` | UUID v4 | 30 days (`expires_at`) | `UNIQUE (offer_id)` | `upsert_acceptance_link` RPC (called by `useSendOffer`) |
| Legacy token | `offer_approvals` | `public_token` | UUID v4 | 30 days (`expires_at`) | `UNIQUE (public_token)` | Legacy flow only — no new records created since PR-ARCH-01 |

**Key invariant:** Tokens are not interchangeable. A canonical token passed to
`get_offer_approval_by_token` returns `{error: 'not_found'}` and vice versa.

---

## Internal Link Generation — Canonical Callers Only

All code paths that **generate** public offer links now use the canonical flow.
No internal caller creates new `offer_approvals` records.

| Caller | Location | Output | Status |
|--------|----------|--------|--------|
| `useSendOffer` | `src/hooks/useSendOffer.ts` | Creates `acceptance_links` record; passes `acceptance_links.token` to `send-offer-email` | **CANONICAL** |
| `useAcceptanceLink` | `src/hooks/useAcceptanceLink.ts` | CRUD for `acceptance_links` | **CANONICAL** |
| `useCreateAcceptanceLink` | `src/hooks/useAcceptanceLink.ts` | Inserts `acceptance_links` record | **CANONICAL** |
| `buildAcceptanceLinkUrl` | `src/hooks/useAcceptanceLink.ts` | Builds `/a/:token` URL | **CANONICAL** |
| `AcceptanceLinkPanel` | `src/components/offers/AcceptanceLinkPanel.tsx` | Displays/copies canonical link | **CANONICAL** |
| `emailHandler.ts` | `supabase/functions/send-offer-email/emailHandler.ts` | Generates `${frontendUrl}/a/${publicToken}` in email HTML | **CANONICAL** |

---

## Dead Code Removed in PR-ARCH-02

The following hooks existed in `src/hooks/useOfferApprovals.ts` and were confirmed to have
**zero callers** in the application. They were removed in PR-ARCH-02:

| Symbol | Type | Reason removed |
|--------|------|----------------|
| `useOfferApprovals(projectId)` | React query hook | No component called it; replaced by canonical `useAcceptanceLink` |
| `useCreateOfferApproval()` | React mutation | No component called it; new link creation uses `useCreateAcceptanceLink` |
| `useExtendOfferApproval()` | React mutation | No component called it; superseded by canonical token refresh |
| `usePublicOfferApproval(token)` | React query hook | No component called it; public read uses `resolve_offer_acceptance_link` RPC |
| `useSubmitOfferApproval()` | React mutation | No component called it; public write uses `process_offer_acceptance_action` RPC |

Also removed:

| Symbol | File | Reason removed |
|--------|------|----------------|
| `OfferTrackingTimeline` | `src/components/offers/OfferTrackingTimeline.tsx` | Zero import callers; tracking UI is now covered by `offer_public_actions` audit log in canonical flow |

**Compatibility guarantee:** Removing these hooks does NOT affect customer-facing links.
All three routes (`/offer/:token`, `/oferta/:token`, `/a/:token`) continue to work exactly as before.

---

## Legacy Code Retained (still active)

The following legacy code is intentionally retained for backward compatibility:

| Symbol | File | Why retained |
|--------|------|-------------|
| `OfferApproval` page | `src/pages/OfferApproval.tsx` | Serves existing `/offer/:token` links |
| `OfferPublicPage` page | `src/pages/OfferPublicPage.tsx` | Serves existing `/oferta/:token` links |
| `publicOfferApi.ts` service | `src/lib/publicOfferApi.ts` | Used by `OfferPublicPage` for read/write operations |
| `approve-offer` Edge Function | `supabase/functions/approve-offer/` | Used by both legacy pages for write operations |
| `/offer/:token` route | `src/App.tsx` | Backward compat for all links sent before PR-ARCH-01 |
| `/oferta/:token` route | `src/App.tsx` | Backward compat for all links sent before PR-ARCH-01 |

---

## Legacy Reads Pending Future Migration

These callers **read** from `offer_approvals` for internal monitoring/stats purposes.
They do **not** generate new public offer links. They are not blocking current phase,
but should be migrated to the canonical `offers` / `acceptance_links` tables in a future sprint.

| Caller | Location | What it reads | Priority |
|--------|----------|---------------|---------|
| `useExpirationMonitor` | `src/hooks/useExpirationMonitor.ts` | `offer_approvals` — expiring pending offers for in-app notifications | P2 |
| `TodayTasks` | `src/components/dashboard/TodayTasks.tsx` | `offer_approvals` — offers expiring in 3 days for dashboard widget | P2 |
| `useOfferStats` | `src/hooks/useOfferStats.ts` | `offer_approvals` — accepted offer count for stats widget | P2 |
| `useFreeTierOfferQuota` | `src/hooks/useFreeTierOfferQuota.ts` | `offer_approvals` — fallback count when `count_monthly_finalized_offers` RPC fails | P3 |

---

## Status Values

Both flows use different status value conventions:

| Flow | Table | Column | Status values | Case |
|------|-------|--------|---------------|------|
| Canonical | `offers` | `status` | `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `ARCHIVED` | UPPERCASE |
| Legacy | `offer_approvals` | `status` | `pending`, `draft`, `sent`, `viewed`, `accepted`, `approved`, `rejected`, `expired`, `withdrawn` | lowercase |

---

## Query Cache Keys (TanStack Query)

All three public offer page components use distinct query key prefixes to prevent cache collisions:

| Component | Query key prefix | Route |
|-----------|-----------------|-------|
| `OfferPublicAccept` | `['publicOffer', token]` | `/a/:token` |
| `OfferApproval` | `['offerApprovalPublic', token]` | `/offer/:token` |
| `OfferPublicPage` | `['legacyOffer', token]` | `/oferta/:token` |

---

## Prerequisites Before Legacy Routes Can Be Deprecated

The following feature gaps in the canonical flow must be closed before `/offer/:token`
and `/oferta/:token` can be safely deprecated:

| ID | Gap | Priority | PR responsible |
|----|-----|---------|----------------|
| L-1 | `process_offer_acceptance_action` must auto-create `v2_projects` on ACCEPT | P0 | PR-ARCH-03 |
| L-2 | `process_offer_acceptance_action` must insert to `notifications` on ACCEPT/REJECT | P0 | PR-ARCH-03 |
| L-5 | `useOffers` hook must return unified status from both `offers.status` and `offer_approvals.status` | P1 | PR-ARCH-03 |
| L-6 | `process_offer_acceptance_action` must handle `accept_token` (1-click from email) | P1 | PR-ARCH-03 |
| L-3 | `process_offer_acceptance_action` must support `CANCEL_ACCEPT` action (10-min window) | P2 | PR-ARCH-04 |
| L-4 | `process_offer_acceptance_action` must support `WITHDRAW` action with JWT verification | P2 | PR-ARCH-04 |

After L-1 and L-2 are done:
- Add redirect: `/offer/:token` → lookup `acceptance_link` for same offer → redirect to `/a/:acceptance_link_token`
- Add redirect: `/oferta/:token` → same lookup logic
- Wait 30 days
- Remove legacy routes and components

---

## Rollback

```bash
git revert <pr-arch-02-commit-sha>
```

Rollback effects:
- `src/hooks/useOfferApprovals.ts` restored (5 dead functions + OfferApproval interface)
- `src/components/offers/OfferTrackingTimeline.tsx` restored (unused component)
- `docs/COMPATIBILITY_MATRIX.md` removed
- `src/test/features/arch02-public-offer-phase2.test.ts` removed
- Zero effect on customer-facing links (all 3 routes continue to work)

---

*Generated: 2026-04-13 | PR-ARCH-02 | Branch: `claude/pr-arch-02-public-offer-phase2-0Kgl9`*
