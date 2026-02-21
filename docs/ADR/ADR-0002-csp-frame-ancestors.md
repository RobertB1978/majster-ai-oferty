# ADR-0002: CSP frame-ancestors Policy for Offer Routes

**Status:** PENDING DECISION
**Date:** 2026-02-08
**Decision makers:** Product Owner

---

## Context

The application has a public offer approval route (`/offer/:token`) that allows clients to view and approve offers without authentication.

In `vercel.json`, there are two header blocks:

1. **Global** (`/(.*)`): Sets `X-Frame-Options: DENY` and CSP with `frame-ancestors 'none'`
2. **Offer-specific** (`/offer/(.*)`): Sets `X-Frame-Options: SAMEORIGIN` (more permissive)

### The Inconsistency

The offer route intends to allow same-origin iframe embedding (via `X-Frame-Options: SAMEORIGIN`), but the global CSP directive `frame-ancestors 'none'` takes precedence over `X-Frame-Options` in all modern browsers. This means offers **cannot** be embedded in iframes regardless of the `X-Frame-Options` setting.

Vercel applies headers from all matching routes additively. Since `/(.*) ` matches everything including `/offer/(.*)`, the global CSP `frame-ancestors 'none'` always applies to offer pages.

### Current Behavior

- All pages, including offers, are blocked from iframe embedding
- The `X-Frame-Options: SAMEORIGIN` on offer routes has no effect

## Options

### Option A: Keep Current (Maximum Security)

- **No code change**
- All pages blocked from iframe embedding
- Offers can only be viewed by direct navigation (clicking the link)
- **Pros:** Maximum security, simplest
- **Cons:** Cannot embed offer previews in any iframe

### Option B: Allow Same-Origin Embedding for Offers

- Remove `frame-ancestors 'none'` from global CSP
- Add separate CSP to offer route with `frame-ancestors 'self'`
- Non-offer pages still protected by `X-Frame-Options: DENY`
- **Pros:** Offers can be previewed in same-origin iframes
- **Cons:** Non-offer pages lose CSP-level frame protection (still have X-Frame-Options)

### Option C: Allow Specific Domain Embedding for Offers

- Same as Option B, but CSP uses `frame-ancestors 'self' https://majster-ai-oferty.vercel.app (TEMP)`
- **Pros:** Most flexible for future use cases
- **Cons:** Same tradeoff as B, more configuration

## Recommendation

**Option A (Keep Current)** unless there is a concrete business need for iframe embedding.

The offer approval flow works by direct link navigation — users receive an email with a link, click it, and see the offer page. Iframe embedding is not required for this flow.

If iframe embedding becomes needed (e.g., preview panel in the main app), Option B can be implemented with a small change to `vercel.json`.

## Decision

**AWAITING OWNER INPUT.** No code change until decision is made.

## Consequences

If Option A: No action needed. Document as intentional.
If Option B or C: Update `vercel.json` CSP headers (small PR, ~5 lines changed).
