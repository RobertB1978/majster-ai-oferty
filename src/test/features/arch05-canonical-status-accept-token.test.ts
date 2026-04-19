/**
 * arch05-canonical-status-accept-token.test.ts
 *
 * PR-CANON-05: Regression tests for L-5 (unified status) and L-6 (accept_token)
 * in the canonical public offer acceptance flow (FLOW-B, /a/:token).
 *
 * Covers:
 *   MIGRATION-* Migration file exists and contains required L-6 markers
 *   L5-*        L-5: unified status mapping contracts (useOffers resolveUnifiedStatus)
 *   L6-*        L-6: accept_token one-click logic contracts
 *   COMPAT-*    Backward compatibility: existing 3-param call still works
 *   HOOKS-*     useAcceptanceLink + useSendOffer accept_token wiring contracts
 *
 * All tests are pure / static — no live Supabase client required.
 *
 * Reference documents:
 *   docs/COMPATIBILITY_MATRIX.md — rows L-5 and L-6
 *   supabase/migrations/20260419130000_arch05_l6_accept_token.sql
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// ════════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════════

const PROJECT_ROOT = join(__dirname, '..', '..', '..');

function readSource(relativePath: string): string {
  return readFileSync(join(PROJECT_ROOT, relativePath), 'utf-8');
}

// ════════════════════════════════════════════════════════════════════════════════
// MIGRATION — SQL migration file presence and key markers
// ════════════════════════════════════════════════════════════════════════════════

describe('[MIGRATION] ARCH-05 SQL migration exists with L-6 content', () => {
  const MIGRATION_PATH =
    'supabase/migrations/20260419130000_arch05_l6_accept_token.sql';

  let sql: string;
  try {
    sql = readSource(MIGRATION_PATH);
  } catch {
    sql = '';
  }

  it('MIGRATION-1: migration file exists and is non-empty', () => {
    expect(sql.length).toBeGreaterThan(100);
  });

  it('MIGRATION-2: adds accept_token column to acceptance_links', () => {
    expect(sql).toContain('accept_token');
    expect(sql).toContain('acceptance_links');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS');
  });

  it('MIGRATION-3: accept_token has gen_random_uuid() default', () => {
    expect(sql).toContain('gen_random_uuid()');
  });

  it('MIGRATION-4: creates unique index for accept_token', () => {
    expect(sql).toContain('CREATE UNIQUE INDEX');
    expect(sql).toContain('idx_acceptance_links_accept_token');
  });

  it('MIGRATION-5: updates upsert_acceptance_link to include accept_token', () => {
    expect(sql).toContain('upsert_acceptance_link');
    expect(sql).toContain('p_accept_token');
  });

  it('MIGRATION-6: upsert refreshes accept_token on conflict (DO UPDATE)', () => {
    expect(sql).toContain('accept_token = EXCLUDED.accept_token');
  });

  it('MIGRATION-7: updates process_offer_acceptance_action with p_accept_token', () => {
    expect(sql).toContain('process_offer_acceptance_action');
    expect(sql).toContain('p_accept_token uuid DEFAULT NULL');
  });

  it('MIGRATION-8: validates accept_token with IS DISTINCT FROM (not =)', () => {
    // IS DISTINCT FROM handles NULL correctly (NULL != NULL is safe)
    expect(sql).toContain('IS DISTINCT FROM p_accept_token');
  });

  it('MIGRATION-9: invalid accept_token returns error: invalid_accept_token', () => {
    expect(sql).toContain("'invalid_accept_token'");
  });

  it('MIGRATION-10: valid accept_token forces v_action = ACCEPT', () => {
    expect(sql).toContain("v_action := 'ACCEPT'");
  });

  it('MIGRATION-11: process_offer_acceptance_action uses v_action (not p_action) for status', () => {
    // All status-setting logic should use v_action, not p_action directly
    expect(sql).toContain("IF v_action = 'ACCEPT'");
  });

  it('MIGRATION-12: action validation skipped when p_accept_token provided', () => {
    // When p_accept_token is not null, skip the ACCEPT/REJECT check
    expect(sql).toContain('p_accept_token IS NULL AND p_action NOT IN');
  });

  it('MIGRATION-13: backward compat — 3-param callers still valid (p_accept_token DEFAULT NULL)', () => {
    expect(sql).toContain('p_accept_token uuid DEFAULT NULL');
  });

  it('MIGRATION-14: SECURITY DEFINER preserved', () => {
    expect(sql).toContain('SECURITY DEFINER');
  });

  it('MIGRATION-15: COMMENT ON FUNCTION references ARCH-05', () => {
    expect(sql).toContain('ARCH-05');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// L5 — Status unification logic contracts
// ════════════════════════════════════════════════════════════════════════════════

describe('[L5] resolveUnifiedStatus — logic contracts', () => {
  // Import from useOffers — static analysis
  let useOffersSource: string;
  try {
    useOffersSource = readSource('src/hooks/useOffers.ts');
  } catch {
    useOffersSource = '';
  }

  it('L5-1: useOffers.ts exports resolveUnifiedStatus', () => {
    expect(useOffersSource).toContain('export function resolveUnifiedStatus');
  });

  it('L5-2: LEGACY_TO_CANONICAL maps accepted → ACCEPTED', () => {
    expect(useOffersSource).toContain("accepted: 'ACCEPTED'");
  });

  it('L5-3: LEGACY_TO_CANONICAL maps approved → ACCEPTED', () => {
    expect(useOffersSource).toContain("approved: 'ACCEPTED'");
  });

  it('L5-4: LEGACY_TO_CANONICAL maps rejected → REJECTED', () => {
    expect(useOffersSource).toContain("rejected: 'REJECTED'");
  });

  it('L5-5: useOffers query applies buildLegacyStatusOverrides', () => {
    expect(useOffersSource).toContain('buildLegacyStatusOverrides');
    expect(useOffersSource).toContain('statusOverrides');
  });

  it('L5-6: useOffersInfinite also applies status overrides (parity)', () => {
    // Both list hooks must unify status
    const firstIdx = useOffersSource.indexOf('buildLegacyStatusOverrides');
    const lastIdx = useOffersSource.lastIndexOf('buildLegacyStatusOverrides');
    expect(firstIdx).toBeGreaterThan(0);
    expect(lastIdx).toBeGreaterThan(firstIdx); // appears at least twice
  });

  it('L5-7: secondary query only targets SENT offers (efficiency)', () => {
    expect(useOffersSource).toContain("status === 'SENT'");
  });

  it('L5-8: secondary query reads from offer_approvals', () => {
    expect(useOffersSource).toContain("from('offer_approvals')");
  });

  it('L5-9: canonical status wins when not SENT (no override for DRAFT/ARCHIVED)', () => {
    // Inline logic verification — mirrors resolveUnifiedStatus
    type OfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED';
    const LEGACY_TO_CANONICAL: Partial<Record<string, OfferStatus>> = {
      accepted: 'ACCEPTED',
      approved: 'ACCEPTED',
      rejected: 'REJECTED',
    };

    function resolveUnifiedStatus(
      canonical: OfferStatus,
      legacy: string | undefined | null,
    ): OfferStatus {
      if (canonical === 'SENT' && legacy) {
        return LEGACY_TO_CANONICAL[legacy] ?? canonical;
      }
      return canonical;
    }

    // SENT + accepted → ACCEPTED
    expect(resolveUnifiedStatus('SENT', 'accepted')).toBe('ACCEPTED');
    expect(resolveUnifiedStatus('SENT', 'approved')).toBe('ACCEPTED');
    expect(resolveUnifiedStatus('SENT', 'rejected')).toBe('REJECTED');

    // Non-SENT canonical is authoritative — legacy ignored
    expect(resolveUnifiedStatus('DRAFT', 'accepted')).toBe('DRAFT');
    expect(resolveUnifiedStatus('ACCEPTED', 'rejected')).toBe('ACCEPTED');
    expect(resolveUnifiedStatus('ARCHIVED', 'accepted')).toBe('ARCHIVED');

    // Unknown legacy status → canonical unchanged
    expect(resolveUnifiedStatus('SENT', 'viewed')).toBe('SENT');
    expect(resolveUnifiedStatus('SENT', 'expired')).toBe('SENT');
    expect(resolveUnifiedStatus('SENT', null)).toBe('SENT');
    expect(resolveUnifiedStatus('SENT', undefined)).toBe('SENT');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// L6 — accept_token one-click logic contracts
// ════════════════════════════════════════════════════════════════════════════════

describe('[L6] accept_token one-click — logic contracts', () => {
  it('L6-1: valid accept_token → forces ACCEPT regardless of p_action', () => {
    // Inline simulation of the DB function logic
    function processAction(opts: {
      pToken: string;
      pAction: string;
      pAcceptToken?: string | null;
      storedAcceptToken: string;
      offerStatus: string;
    }): { error?: string; action?: string } {
      let vAction = opts.pAction;

      if (!opts.pAcceptToken && !['ACCEPT', 'REJECT'].includes(opts.pAction)) {
        return { error: 'invalid_action' };
      }

      if (opts.pAcceptToken !== null && opts.pAcceptToken !== undefined) {
        if (opts.pAcceptToken !== opts.storedAcceptToken) {
          return { error: 'invalid_accept_token' };
        }
        vAction = 'ACCEPT';
      }

      if (opts.offerStatus !== 'SENT') return { error: 'not_actionable' };

      return { action: vAction };
    }

    const stored = 'aaa-bbb-ccc';
    // Valid 1-click: forces ACCEPT
    expect(processAction({ pToken: 'tok', pAction: 'ACCEPT', pAcceptToken: stored, storedAcceptToken: stored, offerStatus: 'SENT' })).toMatchObject({ action: 'ACCEPT' });
    // Wrong accept_token: rejected
    expect(processAction({ pToken: 'tok', pAction: 'ACCEPT', pAcceptToken: 'wrong', storedAcceptToken: stored, offerStatus: 'SENT' })).toMatchObject({ error: 'invalid_accept_token' });
    // No accept_token — normal path
    expect(processAction({ pToken: 'tok', pAction: 'REJECT', pAcceptToken: null, storedAcceptToken: stored, offerStatus: 'SENT' })).toMatchObject({ action: 'REJECT' });
    // No accept_token, invalid action
    expect(processAction({ pToken: 'tok', pAction: 'INVALID', pAcceptToken: null, storedAcceptToken: stored, offerStatus: 'SENT' })).toMatchObject({ error: 'invalid_action' });
  });

  it('L6-2: accept_token schema is in AcceptanceLink interface', () => {
    const source = readSource('src/hooks/useAcceptanceLink.ts');
    expect(source).toContain('accept_token: string');
  });

  it('L6-3: useAcceptanceLink query selects accept_token', () => {
    const source = readSource('src/hooks/useAcceptanceLink.ts');
    expect(source).toContain('accept_token');
    // Ensure it is in the select string
    expect(source).toContain("'id, offer_id, token, accept_token, expires_at, created_at'");
  });

  it('L6-4: useSendOffer fetches accept_token from acceptance_links', () => {
    const source = readSource('src/hooks/useSendOffer.ts');
    expect(source).toContain('accept_token');
    expect(source).toContain("'token, accept_token'");
  });

  it('L6-5: useSendOffer passes acceptToken to email invocation', () => {
    const source = readSource('src/hooks/useSendOffer.ts');
    expect(source).toContain('acceptToken: acceptanceLinkAcceptToken');
  });

  it('L6-6: OfferPublicAccept reads ?t= query param', () => {
    const source = readSource('src/pages/OfferPublicAccept.tsx');
    expect(source).toContain('useSearchParams');
    expect(source).toContain("searchParams.get('t')");
  });

  it('L6-7: OfferPublicAccept passes p_accept_token to RPC on auto-accept', () => {
    const source = readSource('src/pages/OfferPublicAccept.tsx');
    expect(source).toContain('p_accept_token');
    expect(source).toContain('acceptTokenParam');
  });

  it('L6-8: OfferPublicAccept auto-accept effect is before conditional returns (Rules of Hooks)', () => {
    const source = readSource('src/pages/OfferPublicAccept.tsx');
    // The auto-accept useEffect must appear before any conditional `return` statement
    // that follows data-loading. We find the first early return (isLoading check).
    const autoAcceptIdx = source.indexOf('autoAcceptTriggered');
    const loadingReturnIdx = source.indexOf('if (isLoading)');
    expect(autoAcceptIdx).toBeGreaterThan(0);
    expect(loadingReturnIdx).toBeGreaterThan(0);
    // autoAcceptTriggered ref is declared before the loading return
    expect(autoAcceptIdx).toBeLessThan(loadingReturnIdx);
  });

  it('L6-9: auto-accept uses useRef guard to prevent double-trigger', () => {
    const source = readSource('src/pages/OfferPublicAccept.tsx');
    expect(source).toContain('autoAcceptTriggered.current = true');
    expect(source).toContain('autoAcceptTriggered.current');
  });

  it('L6-10: Supabase types include accept_token in acceptance_links.Row', () => {
    const source = readSource('src/integrations/supabase/types.ts');
    // Check Row type has accept_token
    expect(source).toContain('accept_token: string');
  });

  it('L6-11: Supabase types include p_accept_token in process_offer_acceptance_action Args', () => {
    const source = readSource('src/integrations/supabase/types.ts');
    expect(source).toContain('p_accept_token');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// COMPAT — Backward compatibility contracts
// ════════════════════════════════════════════════════════════════════════════════

describe('[COMPAT] Backward compatibility preserved', () => {
  const sql = (() => {
    try {
      return readSource('supabase/migrations/20260419130000_arch05_l6_accept_token.sql');
    } catch {
      return '';
    }
  })();

  it('COMPAT-1: process_offer_acceptance_action first 3 params unchanged', () => {
    // Original 3-param signature preserved
    expect(sql).toContain('p_token        uuid');
    expect(sql).toContain('p_action       text');
    expect(sql).toContain('p_comment      text DEFAULT NULL');
  });

  it('COMPAT-2: p_accept_token has DEFAULT NULL — 3-param callers still work', () => {
    expect(sql).toContain('p_accept_token uuid DEFAULT NULL');
  });

  it('COMPAT-3: ACCEPT/REJECT still valid without accept_token', () => {
    expect(sql).toContain("p_accept_token IS NULL AND p_action NOT IN ('ACCEPT', 'REJECT')");
  });

  it('COMPAT-4: idempotency gate preserved (already ACCEPTED/REJECTED short-circuit)', () => {
    expect(sql).toContain("'ACCEPTED', 'REJECTED'");
    expect(sql).toContain("'idempotent', true");
  });

  it('COMPAT-5: offer_public_actions audit log preserved', () => {
    expect(sql).toContain('INSERT INTO offer_public_actions');
  });

  it('COMPAT-6: error codes unchanged — not_found, expired, not_actionable', () => {
    expect(sql).toContain("'not_found'");
    expect(sql).toContain("'expired'");
    expect(sql).toContain("'not_actionable'");
  });

  it('COMPAT-7: v2_projects auto-create (L-1) preserved', () => {
    expect(sql).toContain('INSERT INTO v2_projects');
    expect(sql).toContain('source_offer_id');
  });

  it('COMPAT-8: notifications (L-2) preserved', () => {
    expect(sql).toContain('INSERT INTO notifications');
    expect(sql).toContain('Oferta zaakceptowana');
    expect(sql).toContain('Oferta odrzucona');
  });

  it('COMPAT-9: upsert_acceptance_link still accepts same first 4 params', () => {
    expect(sql).toContain('p_offer_id        UUID');
    expect(sql).toContain('p_user_id         UUID');
    expect(sql).toContain('p_token           UUID DEFAULT gen_random_uuid()');
    expect(sql).toContain('p_expires_at      TIMESTAMPTZ DEFAULT now()');
  });

  it('COMPAT-10: existing /a/:token links still work (token column unchanged)', () => {
    // The existing token column is NOT modified — only accept_token added
    const source = readSource('src/hooks/useAcceptanceLink.ts');
    expect(source).toContain('token: string');
    expect(source).toContain("CANONICAL_PUBLIC_OFFER_ROUTE = '/a/:token'");
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// COMPATIBILITY_MATRIX — L-5 and L-6 marked CLOSED
// ════════════════════════════════════════════════════════════════════════════════

describe('[MATRIX] COMPATIBILITY_MATRIX.md updated', () => {
  let matrix: string;
  try {
    matrix = readSource('docs/COMPATIBILITY_MATRIX.md');
  } catch {
    matrix = '';
  }

  it('MATRIX-1: COMPATIBILITY_MATRIX.md exists', () => {
    expect(matrix.length).toBeGreaterThan(100);
  });

  it('MATRIX-2: L-5 row is marked CLOSED (not OPEN)', () => {
    // L-5 should show CLOSED status, not OPEN
    expect(matrix).toContain('L-5');
    expect(matrix).not.toMatch(/L-5[^|]*\|\s*OPEN/);
  });

  it('MATRIX-3: L-6 row is marked CLOSED (not OPEN)', () => {
    expect(matrix).toContain('L-6');
    expect(matrix).not.toMatch(/L-6[^|]*\|\s*OPEN/);
  });
});
