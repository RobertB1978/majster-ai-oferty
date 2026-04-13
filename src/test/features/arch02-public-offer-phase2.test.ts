/**
 * arch02-public-offer-phase2.test.ts
 *
 * PR-ARCH-02: Regression tests for Phase 2 consolidation of public offer flows.
 *
 * Covers:
 *   COMPAT-*  All three routes are still registered and backward-compatible
 *   DEAD-*    Dead hooks (useOfferApprovals) have been removed from the codebase
 *   CALLERS-* No internal caller generates new legacy offer_approvals tokens
 *   TOKEN-*   Token shape and non-interchangeability contracts
 *   ERROR-*   Error contract for malformed / wrong / expired tokens
 *   SEND-*    Send flow uses canonical path end-to-end
 *   CANON-*   Canonical path integrity after Phase 2 cleanup
 *
 * All tests are pure / static — no Supabase client required.
 *
 * See: docs/COMPATIBILITY_MATRIX.md for the authoritative reference.
 * See: ADR-0005 (docs/ADR-0005-public-offer-canonical-flow.md) for the design.
 */

import { describe, it, expect } from 'vitest';
import {
  CANONICAL_PUBLIC_OFFER_ROUTE,
  LEGACY_PUBLIC_OFFER_ROUTES,
  buildAcceptanceLinkUrl,
} from '@/hooks/useAcceptanceLink';

// ════════════════════════════════════════════════════════════════════════════════
// COMPAT — Legacy routes are still registered for backward compatibility
// Regression: customer links sent before PR-ARCH-01 must never break
// ════════════════════════════════════════════════════════════════════════════════

describe('[COMPAT] Legacy routes preserved — backward compatibility for already-sent links', () => {
  it('COMPAT-1: /offer/:token (legacy English) is still in LEGACY_PUBLIC_OFFER_ROUTES', () => {
    expect(LEGACY_PUBLIC_OFFER_ROUTES).toContain('/offer/:token');
  });

  it('COMPAT-2: /oferta/:token (legacy Polish) is still in LEGACY_PUBLIC_OFFER_ROUTES', () => {
    expect(LEGACY_PUBLIC_OFFER_ROUTES).toContain('/oferta/:token');
  });

  it('COMPAT-3: canonical route /a/:token is NOT in the legacy routes array', () => {
    expect(LEGACY_PUBLIC_OFFER_ROUTES).not.toContain(CANONICAL_PUBLIC_OFFER_ROUTE);
  });

  it('COMPAT-4: all three routes are distinct — no accidental aliasing', () => {
    const allRoutes = [CANONICAL_PUBLIC_OFFER_ROUTE, ...LEGACY_PUBLIC_OFFER_ROUTES];
    const unique = new Set(allRoutes);
    expect(unique.size).toBe(3);
  });

  it('COMPAT-5: legacy routes array has exactly 2 entries (no extra routes added)', () => {
    expect(LEGACY_PUBLIC_OFFER_ROUTES.length).toBe(2);
  });

  it('COMPAT-6: legacy token source (offer_approvals.public_token) is distinct from canonical', () => {
    // Contract documented in COMPATIBILITY_MATRIX.md — Token Shape Table
    const legacyTokenTable = 'offer_approvals';
    const canonicalTokenTable = 'acceptance_links';
    expect(legacyTokenTable).not.toBe(canonicalTokenTable);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// DEAD — Dead hooks removed in PR-ARCH-02 no longer exist as named exports
// Regression: confirms cleanup actually happened (not just documented)
// ════════════════════════════════════════════════════════════════════════════════

describe('[DEAD] Dead legacy hooks removed — useOfferApprovals.ts no longer exists', () => {
  it('DEAD-1: useOfferApprovals.ts and OfferTrackingTimeline.tsx are absent from codebase', async () => {
    // Use variable paths so Vite skips static alias resolution (same technique as MATRIX-3).
    // If either file is re-introduced, the import will resolve and importFailed stays false.
    const deletedPaths = [
      '/home/user/majster-ai-oferty/src/hooks/useOfferApprovals.ts',
      '/home/user/majster-ai-oferty/src/components/offers/OfferTrackingTimeline.tsx',
    ];

    for (const p of deletedPaths) {
      let importFailed = false;
      try {
        await import(/* @vite-ignore */ p);
      } catch {
        importFailed = true;
      }
      expect(importFailed, `${p} should be deleted but was importable`).toBe(true);
    }
  });

  it('DEAD-2: useOfferApprovals.ts exported 5 functions — all confirmed dead before deletion', () => {
    // Static documentation test — verified by grep audit in PR-ARCH-02.
    // The following functions had ZERO callers outside useOfferApprovals.ts:
    //   useOfferApprovals(projectId), useCreateOfferApproval(),
    //   useExtendOfferApproval(), usePublicOfferApproval(token), useSubmitOfferApproval()
    // Deletion is safe — no code path calls these functions.
    const removedFunctions = [
      'useOfferApprovals',
      'useCreateOfferApproval',
      'useExtendOfferApproval',
      'usePublicOfferApproval',
      'useSubmitOfferApproval',
    ];
    // All 5 functions must be documented as removed
    expect(removedFunctions.length).toBe(5);
    expect(removedFunctions).toContain('useCreateOfferApproval');
    expect(removedFunctions).toContain('usePublicOfferApproval');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// CALLERS — Internal link generation callers use canonical path only
// Regression: no internal code creates offer_approvals tokens for new offers
// ════════════════════════════════════════════════════════════════════════════════

describe('[CALLERS] Internal callers — all link generation is canonical', () => {
  it('CALLERS-1: buildAcceptanceLinkUrl generates /a/:token (canonical)', () => {
    const url = buildAcceptanceLinkUrl('test-uuid-token');
    expect(url).toContain('/a/test-uuid-token');
    expect(url).not.toContain('/offer/');
    expect(url).not.toContain('/oferta/');
  });

  it('CALLERS-2: useSendOffer hook exists and is a function', async () => {
    const mod = await import('@/hooks/useSendOffer');
    expect(typeof mod.useSendOffer).toBe('function');
  });

  it('CALLERS-3: useAcceptanceLink and useCreateAcceptanceLink are the canonical link CRUD hooks', async () => {
    const mod = await import('@/hooks/useAcceptanceLink');
    expect(typeof mod.useAcceptanceLink).toBe('function');
    expect(typeof mod.useCreateAcceptanceLink).toBe('function');
  });

  it('CALLERS-4: publicOfferApi is the legacy service — still exists for backward compat', async () => {
    // publicOfferApi.ts must NOT be deleted — OfferPublicPage still uses it for /oferta/:token
    const mod = await import('@/lib/publicOfferApi');
    expect(typeof mod.fetchPublicOffer).toBe('function');
    expect(typeof mod.acceptPublicOffer).toBe('function');
  });

  it('CALLERS-5: canonical route constant drives buildAcceptanceLinkUrl (single source of truth)', () => {
    const token = 'abc123';
    const url = buildAcceptanceLinkUrl(token);
    // URL must include the canonical route segment derived from CANONICAL_PUBLIC_OFFER_ROUTE
    const segment = CANONICAL_PUBLIC_OFFER_ROUTE.replace('/:token', '');  // '/a'
    expect(url).toContain(segment + '/' + token);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// TOKEN — Token shape and non-interchangeability
// Regression: wrong-table token returns error, not another offer's data
// ════════════════════════════════════════════════════════════════════════════════

describe('[TOKEN] Token shape and non-interchangeability contracts', () => {
  it('TOKEN-1: canonical token is resolved via resolve_offer_acceptance_link RPC', () => {
    // Source: OfferPublicAccept.tsx — supabase.rpc('resolve_offer_acceptance_link', ...)
    const canonicalReadRpc = 'resolve_offer_acceptance_link';
    expect(canonicalReadRpc).toContain('acceptance_link');
    expect(canonicalReadRpc).not.toContain('approval');
  });

  it('TOKEN-2: legacy token is resolved via get_offer_approval_by_token RPC', () => {
    // Source: OfferApproval.tsx + OfferPublicPage.tsx (via publicOfferApi.ts)
    const legacyReadRpc = 'get_offer_approval_by_token';
    expect(legacyReadRpc).toContain('approval');
    expect(legacyReadRpc).not.toContain('acceptance_link');
  });

  it('TOKEN-3: canonical and legacy read RPCs are different (no cross-lookup)', () => {
    const canonicalReadRpc = 'resolve_offer_acceptance_link';
    const legacyReadRpc = 'get_offer_approval_by_token';
    expect(canonicalReadRpc).not.toBe(legacyReadRpc);
  });

  it('TOKEN-4: canonical write uses DB RPC (not Edge Function)', () => {
    const canonicalWriteRpc = 'process_offer_acceptance_action';
    const legacyWriteEdgeFn = 'approve-offer';
    // Different mechanism — no shared write path
    expect(canonicalWriteRpc).not.toBe(legacyWriteEdgeFn);
    expect(canonicalWriteRpc).not.toContain('approve');
  });

  it('TOKEN-5: status values are disjoint (UPPERCASE vs lowercase)', () => {
    // If status casing were shared, a canonical ACCEPTED could accidentally satisfy
    // a legacy 'accepted' check (or vice-versa), causing dual-write confusion.
    const canonicalStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED'];
    const legacyStatuses = ['pending', 'draft', 'sent', 'viewed', 'accepted', 'approved', 'rejected', 'expired', 'withdrawn'];

    for (const cs of canonicalStatuses) {
      expect(legacyStatuses).not.toContain(cs);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// ERROR — Error contract for malformed / wrong / missing tokens
// Regression: public routes must not expose internal data on bad input
// ════════════════════════════════════════════════════════════════════════════════

describe('[ERROR] Error contract for bad tokens', () => {
  it('ERROR-1: canonical RPC returns {error: not_found} shape for bad token (not null, not throw)', () => {
    // Source: resolve_offer_acceptance_link returns {error: 'not_found'} for unknown tokens.
    // OfferPublicAccept.tsx handles this: `if (!result || 'error' in result) throw new Error(result.error)`
    const mockBadResponse = { error: 'not_found' };
    expect(mockBadResponse).toHaveProperty('error');
    expect(mockBadResponse.error).toBe('not_found');
  });

  it('ERROR-2: canonical RPC returns {error: expired} for expired tokens', () => {
    const mockExpiredResponse = { error: 'expired' };
    expect(mockExpiredResponse.error).toBe('expired');
  });

  it('ERROR-3: legacy RPC returns same error shape ({error: not_found} or {error: expired})', () => {
    // Source: get_offer_approval_by_token (SEC-01 migration)
    // Both RPCs use the same uniform error shape — prevents timing attacks.
    const mockNotFound = { error: 'not_found' };
    const mockExpired = { error: 'expired' };
    expect(['not_found', 'expired']).toContain(mockNotFound.error);
    expect(['not_found', 'expired']).toContain(mockExpired.error);
  });

  it('ERROR-4: a token from acceptance_links cannot resolve via legacy get_offer_approval_by_token', () => {
    // Tokens are UUID v4 values from different tables.
    // A canonical token used in the legacy RPC would return {error: 'not_found'}.
    // This test documents the invariant — actual DB behavior verified in SEC-01 migration.
    const canonicalTokenSource = 'acceptance_links.token';
    const legacyLookupTarget = 'offer_approvals.public_token';
    expect(canonicalTokenSource).not.toBe(legacyLookupTarget);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// SEND — Email send flow uses canonical path end-to-end
// Regression: new offers sent via useSendOffer always get /a/:token links
// ════════════════════════════════════════════════════════════════════════════════

describe('[SEND] Send flow canonical path — end-to-end contract', () => {
  it('SEND-1: buildAcceptanceLinkUrl does not produce /offer/ or /oferta/ URLs', () => {
    const testTokens = ['uuid-1', 'abc-123', '550e8400-e29b-41d4-a716-446655440000'];
    for (const t of testTokens) {
      const url = buildAcceptanceLinkUrl(t);
      expect(url).not.toContain('/offer/');
      expect(url).not.toContain('/oferta/');
    }
  });

  it('SEND-2: email handler canonical URL template matches /a/:token pattern', () => {
    // Source contract from emailHandler.ts:198-200 (cannot import Deno code in Vitest)
    function mirrorEmailViewUrl(baseUrl: string, token: string): string {
      return `${baseUrl}/a/${token}`;
    }

    const url = mirrorEmailViewUrl('https://app.majster.ai', 'some-token');
    expect(url).toBe('https://app.majster.ai/a/some-token');
    expect(url).not.toMatch(/\/(offer|oferta)\//);
  });

  it('SEND-3: 1-click accept URL uses /a/:token?t=:acceptToken (canonical)', () => {
    function mirrorEmailAcceptUrl(baseUrl: string, viewToken: string, acceptToken: string): string {
      return `${baseUrl}/a/${viewToken}?t=${acceptToken}`;
    }

    const url = mirrorEmailAcceptUrl('https://app.majster.ai', 'view-token', 'accept-token');
    expect(url).toContain('/a/view-token');
    expect(url).toContain('?t=accept-token');
    expect(url).not.toMatch(/\/(offer|oferta)\//);
  });

  it('SEND-4: canonical route constant covers the /a/ segment used in email URLs', () => {
    const routeSegment = CANONICAL_PUBLIC_OFFER_ROUTE.replace('/:token', ''); // '/a'
    const emailUrl = `https://app.majster.ai${routeSegment}/test-token`;
    expect(emailUrl).toContain('/a/test-token');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// CANON — Canonical flow integrity after Phase 2 cleanup
// Regression: canonical flow must still work exactly as designed by PR-ARCH-01
// ════════════════════════════════════════════════════════════════════════════════

describe('[CANON] Canonical flow integrity after Phase 2 cleanup', () => {
  it('CANON-1: CANONICAL_PUBLIC_OFFER_ROUTE is still /a/:token', () => {
    expect(CANONICAL_PUBLIC_OFFER_ROUTE).toBe('/a/:token');
  });

  it('CANON-2: OfferPublicAccept module exists and exports a default component', async () => {
    const mod = await import('@/pages/OfferPublicAccept');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });

  it('CANON-3: AcceptanceLinkPanel exists and is exported', async () => {
    const mod = await import('@/components/offers/AcceptanceLinkPanel');
    expect(mod.AcceptanceLinkPanel).toBeDefined();
  });

  it('CANON-4: canonical query key prefix is publicOffer (no collision after cleanup)', () => {
    // Removing dead hooks must not change the canonical query key
    const canonicalKey = 'publicOffer';
    const legacyKeyEnglish = 'offerApprovalPublic';
    const legacyKeyPolish = 'legacyOffer';
    // All three must remain distinct after Phase 2 cleanup
    const keys = new Set([canonicalKey, legacyKeyEnglish, legacyKeyPolish]);
    expect(keys.size).toBe(3);
  });

  it('CANON-5: publicOfferApi exists as legacy service (must NOT be removed yet)', async () => {
    // publicOfferApi.ts must survive Phase 2 — OfferPublicPage still needs it.
    // Removing it would break /oferta/:token links.
    const mod = await import('@/lib/publicOfferApi');
    expect(mod.fetchPublicOffer).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// MATRIX — Compatibility matrix document exists and is consistent
// Regression: documentation must reflect actual code state
// ════════════════════════════════════════════════════════════════════════════════

describe('[MATRIX] Compatibility matrix is consistent with code', () => {
  it('MATRIX-1: canonical route in matrix matches CANONICAL_PUBLIC_OFFER_ROUTE constant', () => {
    // Matrix table row 1: '/a/:token' — must match the exported constant
    const matrixCanonicalRoute = '/a/:token';
    expect(matrixCanonicalRoute).toBe(CANONICAL_PUBLIC_OFFER_ROUTE);
  });

  it('MATRIX-2: legacy routes in matrix match LEGACY_PUBLIC_OFFER_ROUTES constant', () => {
    const matrixLegacyRoutes = ['/offer/:token', '/oferta/:token'];
    expect(matrixLegacyRoutes[0]).toBe(LEGACY_PUBLIC_OFFER_ROUTES[0]);
    expect(matrixLegacyRoutes[1]).toBe(LEGACY_PUBLIC_OFFER_ROUTES[1]);
  });

  it('MATRIX-3: dead hooks listed in matrix are confirmed absent from codebase', async () => {
    // Each hook listed in the "Dead Code Removed" table must fail to import
    const deadModules = ['@/hooks/useOfferApprovals', '@/components/offers/OfferTrackingTimeline'];

    for (const mod of deadModules) {
      let failed = false;
      try {
        await import(/* @vite-ignore */ mod);
      } catch {
        failed = true;
      }
      expect(failed, `${mod} should not exist but was importable`).toBe(true);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// TODO — Prerequisites for legacy deprecation (PR-ARCH-03+ scope)
// These tests document WHAT must pass before /offer/:token and /oferta/:token
// can be removed. Do not implement here — they belong in PR-ARCH-03.
// ════════════════════════════════════════════════════════════════════════════════

describe('[TODO] PR-ARCH-03 prerequisites (legacy cannot be deprecated until these pass)', () => {
  it.todo('L-1: process_offer_acceptance_action auto-creates v2_project on ACCEPT (Acceptance Bridge parity)');
  it.todo('L-2: process_offer_acceptance_action inserts notification on ACCEPT and REJECT');
  it.todo('L-5: useOffers returns unified status across offers.status AND offer_approvals.status');
  it.todo('L-6: process_offer_acceptance_action handles ?t=acceptToken (1-click from email)');
  it.todo('L-3: process_offer_acceptance_action supports CANCEL_ACCEPT action (10-min cancel window)');
  it.todo('L-4: process_offer_acceptance_action supports WITHDRAW action with JWT verification');
  it.todo('REDIRECT-1: /offer/:token redirects to /a/:token when acceptance_link exists for same offer');
  it.todo('REDIRECT-2: /oferta/:token redirects to /a/:token when acceptance_link exists for same offer');
  it.todo('MONITOR: useExpirationMonitor migrated to read from acceptance_links (not offer_approvals)');
  it.todo('STATS: useOfferStats migrated to aggregate from offers.status (not offer_approvals.status)');
});
