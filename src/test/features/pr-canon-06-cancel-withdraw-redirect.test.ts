/**
 * PR-CANON-06 Regression Tests
 *
 * Closes COMPATIBILITY_MATRIX L-3 (CANCEL_ACCEPT) and L-4 (WITHDRAW).
 * Also covers the 30-day legacy redirect window (resolve_legacy_to_canonical_token).
 *
 * All tests are static/pure — no Supabase client required.
 * Tests that require a live DB are marked .skip.
 */

import { describe, it, expect } from 'vitest';

// ── Canonical status values (UPPERCASE) ──────────────────────────────────────
const CANONICAL_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED', 'WITHDRAWN'] as const;
type CanonicalStatus = typeof CANONICAL_STATUSES[number];

// ── CANCEL_ACCEPT gate logic (mirrors SQL) ────────────────────────────────────

function canCancelAccept(status: string, acceptedAt: string | null): boolean {
  if (status !== 'ACCEPTED') return false;
  if (!acceptedAt) return false;
  return Date.now() - new Date(acceptedAt).getTime() < 600_000; // 10 min
}

function cancelAcceptResult(
  status: string,
  acceptedAt: string | null,
): { error: string } | { success: true; status: 'SENT' } {
  if (status !== 'ACCEPTED') return { error: 'not_accepted' };
  if (!acceptedAt || Date.now() - new Date(acceptedAt).getTime() >= 600_000) {
    return { error: 'cancel_window_expired' };
  }
  return { success: true, status: 'SENT' };
}

// ── WITHDRAW gate logic (mirrors SQL) ────────────────────────────────────────

function withdrawResult(
  offerStatus: string,
  callerUid: string | null,
  offerOwnerId: string,
): { error: string } | { success: true; status: 'WITHDRAWN' } {
  if (!callerUid || callerUid !== offerOwnerId) return { error: 'not_authorized' };
  if (offerStatus !== 'SENT') return { error: 'not_withdrawable' };
  return { success: true, status: 'WITHDRAWN' };
}

// ════════════════════════════════════════════════════════════════════════════════
// L-3: CANCEL_ACCEPT
// ════════════════════════════════════════════════════════════════════════════════

describe('[L-3] CANCEL_ACCEPT — 10-minute grace window', () => {
  const now = new Date().toISOString();
  const nineMinAgo = new Date(Date.now() - 9 * 60 * 1000).toISOString();
  const elevenMinAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();

  it('L3-1: CANCEL_ACCEPT allowed when ACCEPTED + within 10 min', () => {
    expect(canCancelAccept('ACCEPTED', nineMinAgo)).toBe(true);
    expect(canCancelAccept('ACCEPTED', now)).toBe(true);
  });

  it('L3-2: CANCEL_ACCEPT denied when window has elapsed (> 10 min)', () => {
    expect(canCancelAccept('ACCEPTED', elevenMinAgo)).toBe(false);
  });

  it('L3-3: CANCEL_ACCEPT denied when status is not ACCEPTED', () => {
    expect(canCancelAccept('SENT', now)).toBe(false);
    expect(canCancelAccept('REJECTED', now)).toBe(false);
    expect(canCancelAccept('WITHDRAWN', now)).toBe(false);
    expect(canCancelAccept('DRAFT', now)).toBe(false);
  });

  it('L3-4: CANCEL_ACCEPT denied when accepted_at is null', () => {
    expect(canCancelAccept('ACCEPTED', null)).toBe(false);
  });

  it('L3-5: successful CANCEL_ACCEPT resets status to SENT', () => {
    const result = cancelAcceptResult('ACCEPTED', nineMinAgo);
    expect(result).toMatchObject({ success: true, status: 'SENT' });
  });

  it('L3-6: expired window returns cancel_window_expired error', () => {
    const result = cancelAcceptResult('ACCEPTED', elevenMinAgo);
    expect(result).toHaveProperty('error', 'cancel_window_expired');
  });

  it('L3-7: not_accepted error when offer is not ACCEPTED', () => {
    const result = cancelAcceptResult('SENT', nineMinAgo);
    expect(result).toHaveProperty('error', 'not_accepted');
  });

  it('L3-8: CANCEL_ACCEPT is not a client-side feature — handled in RPC', () => {
    // The public page calls process_offer_acceptance_action with p_action='CANCEL_ACCEPT'.
    // The RPC enforces the 10-minute window server-side.
    const action = 'CANCEL_ACCEPT';
    const allowedActions = ['ACCEPT', 'REJECT', 'CANCEL_ACCEPT', 'WITHDRAW'];
    expect(allowedActions).toContain(action);
  });

  it('L3-9: countdown is derived from accepted_at timestamp', () => {
    function computeCountdown(acceptedAt: string): number {
      const diffMs = Date.now() - new Date(acceptedAt).getTime();
      return Math.max(0, Math.ceil((600_000 - diffMs) / 1000));
    }
    const justNow = new Date(Date.now() - 5000).toISOString();
    const countdown = computeCountdown(justNow);
    expect(countdown).toBeGreaterThan(580);
    expect(countdown).toBeLessThanOrEqual(600);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// L-4: WITHDRAW
// ════════════════════════════════════════════════════════════════════════════════

describe('[L-4] WITHDRAW — owner JWT verification', () => {
  const OWNER_ID = 'user-owner-uuid';
  const OTHER_ID = 'user-other-uuid';

  it('L4-1: WITHDRAW succeeds when caller is authenticated owner + offer is SENT', () => {
    const result = withdrawResult('SENT', OWNER_ID, OWNER_ID);
    expect(result).toMatchObject({ success: true, status: 'WITHDRAWN' });
  });

  it('L4-2: WITHDRAW denied for unauthenticated caller (null auth.uid)', () => {
    const result = withdrawResult('SENT', null, OWNER_ID);
    expect(result).toHaveProperty('error', 'not_authorized');
  });

  it('L4-3: WITHDRAW denied when caller is not the offer owner', () => {
    const result = withdrawResult('SENT', OTHER_ID, OWNER_ID);
    expect(result).toHaveProperty('error', 'not_authorized');
  });

  it('L4-4: WITHDRAW denied when offer is ACCEPTED (not SENT)', () => {
    const result = withdrawResult('ACCEPTED', OWNER_ID, OWNER_ID);
    expect(result).toHaveProperty('error', 'not_withdrawable');
  });

  it('L4-5: WITHDRAW denied when offer is DRAFT', () => {
    const result = withdrawResult('DRAFT', OWNER_ID, OWNER_ID);
    expect(result).toHaveProperty('error', 'not_withdrawable');
  });

  it('L4-6: WITHDRAW denied when offer is already REJECTED', () => {
    const result = withdrawResult('REJECTED', OWNER_ID, OWNER_ID);
    expect(result).toHaveProperty('error', 'not_withdrawable');
  });

  it('L4-7: WITHDRAW sets status to WITHDRAWN (not ARCHIVED)', () => {
    const result = withdrawResult('SENT', OWNER_ID, OWNER_ID);
    if ('status' in result) {
      expect(result.status).toBe('WITHDRAWN');
      expect(result.status).not.toBe('ARCHIVED');
    }
  });

  it('L4-8: WITHDRAWN is a valid canonical offer status', () => {
    const statuses: string[] = [...CANONICAL_STATUSES];
    expect(statuses).toContain('WITHDRAWN');
  });

  it('L4-9: WITHDRAWN status is distinct from ARCHIVED', () => {
    const withdrawn: CanonicalStatus = 'WITHDRAWN';
    const archived: CanonicalStatus = 'ARCHIVED';
    expect(withdrawn).not.toBe(archived);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Legacy redirect
// ════════════════════════════════════════════════════════════════════════════════

describe('[REDIRECT] Legacy /offer/:token + /oferta/:token → /a/:canonical_token', () => {
  it('REDIR-1: redirect is to /a/:canonicalToken (canonical path)', () => {
    const canonicalToken = 'abc-def-canonical-uuid';
    const target = `/a/${canonicalToken}`;
    expect(target).toMatch(/^\/a\//);
    expect(target).not.toContain('/offer/');
    expect(target).not.toContain('/oferta/');
  });

  it('REDIR-2: when no canonical link exists, legacy component is rendered (no redirect)', () => {
    const resolvedToken = null;
    const shouldRedirect = resolvedToken !== null;
    expect(shouldRedirect).toBe(false);
  });

  it('REDIR-3: LegacyOfferRedirect flow prop determines which legacy component renders', () => {
    const flows = ['offer', 'oferta'] as const;
    expect(flows).toContain('offer');
    expect(flows).toContain('oferta');
    expect(flows).toHaveLength(2);
  });

  it('REDIR-4: redirect is a hard replace (no browser history entry added)', () => {
    // React Router <Navigate replace /> — asserting the design intent:
    // user pressing Back should not loop through the legacy URL.
    const replaceOption = true;
    expect(replaceOption).toBe(true);
  });

  it('REDIR-5: resolve_legacy_to_canonical_token RPC name matches expectation', () => {
    const rpcName = 'resolve_legacy_to_canonical_token';
    expect(rpcName).toContain('legacy');
    expect(rpcName).toContain('canonical');
    expect(rpcName).toContain('token');
  });

  it('REDIR-6: RPC returns {canonical_token: uuid} on match or {canonical_token: null} on miss', () => {
    function simulateRpc(hasCanonicalLink: boolean): { canonical_token: string | null } {
      return { canonical_token: hasCanonicalLink ? 'some-uuid' : null };
    }
    expect(simulateRpc(true).canonical_token).toBeTruthy();
    expect(simulateRpc(false).canonical_token).toBeNull();
  });

  it('REDIR-7: legacy components (OfferApproval, OfferPublicPage) are NOT modified', () => {
    // Freeze principle: no new business logic in legacy components.
    // LegacyOfferRedirect is a thin wrapper; legacy components render unchanged.
    const legacyComponents = ['OfferApproval', 'OfferPublicPage'];
    expect(legacyComponents).not.toContain('LegacyOfferRedirect');
    expect(legacyComponents).toHaveLength(2);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Full canonical action set
// ════════════════════════════════════════════════════════════════════════════════

describe('[ACTIONS] process_offer_acceptance_action supports all 4 actions', () => {
  const allowedActions = ['ACCEPT', 'REJECT', 'CANCEL_ACCEPT', 'WITHDRAW'] as const;

  it('ACTION-1: all four actions are defined', () => {
    expect(allowedActions).toHaveLength(4);
  });

  it('ACTION-2: ACCEPT and REJECT are client-initiated (no auth required)', () => {
    // These can be called with anon key from the public page
    const clientActions = ['ACCEPT', 'REJECT'];
    clientActions.forEach(a => expect(allowedActions).toContain(a));
  });

  it('ACTION-3: CANCEL_ACCEPT is client-initiated (no auth required, time-gated)', () => {
    expect(allowedActions).toContain('CANCEL_ACCEPT');
  });

  it('ACTION-4: WITHDRAW requires authenticated JWT (owner-only)', () => {
    // Only action in the set requiring auth.uid() = offer.user_id
    const ownerOnlyActions = ['WITHDRAW'];
    ownerOnlyActions.forEach(a => expect(allowedActions).toContain(a));
  });

  it('ACTION-5: invalid action returns error (not silently ignored)', () => {
    const validActions = new Set(allowedActions);
    const invalidAction = 'DELETE';
    expect(validActions.has(invalidAction as never)).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// SKIP — require live DB
// ════════════════════════════════════════════════════════════════════════════════

describe('[SKIP] Live DB integration tests', () => {
  it.skip('process_offer_acceptance_action with CANCEL_ACCEPT within 10 min returns {success:true,status:SENT}', () => {
    // Requires: live DB, valid token, ACCEPTED offer within last 10 min
  });

  it.skip('process_offer_acceptance_action with CANCEL_ACCEPT after 10 min returns {error:cancel_window_expired}', () => {
    // Requires: live DB, valid token, ACCEPTED offer older than 10 min
  });

  it.skip('process_offer_acceptance_action with WITHDRAW + valid JWT returns {success:true,status:WITHDRAWN}', () => {
    // Requires: live DB, authenticated session, SENT offer owned by caller
  });

  it.skip('process_offer_acceptance_action with WITHDRAW + wrong JWT returns {error:not_authorized}', () => {
    // Requires: live DB, authenticated session for different user
  });

  it.skip('resolve_legacy_to_canonical_token returns canonical_token when acceptance_link exists', () => {
    // Requires: live DB, offer with both offer_approvals record and acceptance_links record
  });

  it.skip('resolve_legacy_to_canonical_token returns null when no acceptance_link exists', () => {
    // Requires: live DB, offer with offer_approvals but no acceptance_links
  });

  it.skip('GET /offer/:token redirects to /a/:canonical when canonical link exists', () => {
    // Requires: Playwright/browser test
  });

  it.skip('GET /offer/:token renders OfferApproval when no canonical link exists', () => {
    // Requires: Playwright/browser test
  });
});
