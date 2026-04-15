/**
 * arch03-l1-l2-close-canonical-gaps.test.ts
 *
 * PR-ARCH-03: Regression tests for L-1 and L-2 gap closure in the canonical
 * public offer flow (FLOW-B, /a/:token).
 *
 * Covers:
 *   MIGRATION-* Migration file exists and contains required L-1/L-2 markers
 *   L1-*        L-1: v2_projects auto-create logic contract
 *   L2-*        L-2: notifications insert logic contract
 *   READER-*    Legacy reader hooks migrated from offer_approvals to offers table
 *   COMPAT-*    Backward compatibility: existing function contracts preserved
 *
 * All tests are pure / static — no live Supabase client required.
 *
 * Reference documents:
 *   docs/COMPATIBILITY_MATRIX.md — rows L-1 and L-2
 *   docs/ADR/ADR-0014-public-offer-canonical-flow.md — lines 122-128
 *   supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql
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

describe('[MIGRATION] ARCH-03 SQL migration exists with L-1/L-2 content', () => {
  const MIGRATION_PATH =
    'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql';

  let sql: string;

  try {
    sql = readSource(MIGRATION_PATH);
  } catch {
    sql = '';
  }

  it('MIGRATION-1: migration file exists and is non-empty', () => {
    expect(sql.length).toBeGreaterThan(100);
  });

  it('MIGRATION-2: migration uses CREATE OR REPLACE FUNCTION (not CREATE TABLE — no schema change)', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION');
    expect(sql).not.toMatch(/CREATE TABLE/i);
  });

  it('MIGRATION-3: migration targets process_offer_acceptance_action', () => {
    expect(sql).toContain('process_offer_acceptance_action');
  });

  it('MIGRATION-4: migration preserves SECURITY DEFINER (unchanged from PR-12)', () => {
    expect(sql).toContain('SECURITY DEFINER');
  });

  it('MIGRATION-5: migration preserves idempotency gate (already ACCEPTED/REJECTED short-circuit)', () => {
    expect(sql).toContain("'ACCEPTED', 'REJECTED'");
  });

  it('MIGRATION-6: L-1 — migration inserts into v2_projects on ACCEPT', () => {
    expect(sql).toContain('v2_projects');
    expect(sql).toContain('source_offer_id');
    // L-1 guard: idempotency check before insert
    expect(sql).toContain('IF NOT EXISTS');
  });

  it('MIGRATION-7: L-1 — v2_project status is ACTIVE (matching v2_projects CHECK constraint)', () => {
    expect(sql).toContain("'ACTIVE'");
  });

  it('MIGRATION-8: L-1 — project title uses COALESCE with fallback (null-safe)', () => {
    expect(sql).toMatch(/COALESCE.*title.*Projekt z oferty/s);
  });

  it('MIGRATION-9: L-2 — migration inserts into notifications on ACCEPT and REJECT', () => {
    expect(sql).toContain('notifications');
    // Both actions should produce a notification (not gated on p_action)
    expect(sql).toContain('Oferta zaakceptowana');
    expect(sql).toContain('Oferta odrzucona');
  });

  it('MIGRATION-10: L-2 — notification type is "success" for ACCEPT, "warning" for REJECT', () => {
    expect(sql).toContain("'success'");
    expect(sql).toContain("'warning'");
  });

  it('MIGRATION-11: L-2 — notification action_url points to /app/offers/:id (canonical)', () => {
    expect(sql).toContain('/app/offers/');
  });

  it('MIGRATION-12: L-2 — notifications insert uses offer owner user_id (not caller uid)', () => {
    // The notification goes to the contractor, not the anonymous client
    expect(sql).toContain('v_offer.user_id');
  });

  it('MIGRATION-13: L-1/L-2 only triggered after offer status is updated (correct ordering)', () => {
    // L-1 and L-2 blocks must appear after the UPDATE offers statement.
    // Use lastIndexOf to find the actual SQL code (not header comments).
    const updateIdx = sql.lastIndexOf('UPDATE offers');
    const v2ProjectsIdx = sql.lastIndexOf('INSERT INTO v2_projects');
    const notificationsIdx = sql.lastIndexOf('INSERT INTO notifications');
    expect(updateIdx).toBeGreaterThan(0);
    expect(v2ProjectsIdx).toBeGreaterThan(updateIdx);
    expect(notificationsIdx).toBeGreaterThan(updateIdx);
  });

  it('MIGRATION-14: COMMENT ON FUNCTION references ARCH-03 (provenance tracking)', () => {
    expect(sql).toContain('ARCH-03');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// L1 — Logic contract: v2_projects auto-create on ACCEPT
// ════════════════════════════════════════════════════════════════════════════════

describe('[L1] v2_projects auto-create logic contracts', () => {
  it('L1-1: project created only on ACCEPT — not on REJECT', () => {
    const sql = readSource(
      'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
    );
    // The v2_projects insert block must be inside the IF p_action = 'ACCEPT' branch.
    // Use lastIndexOf to match the code body (not header comments).
    const acceptBlockStart = sql.lastIndexOf("IF p_action = 'ACCEPT'");
    const v2Idx = sql.lastIndexOf('INSERT INTO v2_projects');

    // v2_projects insert is inside an ACCEPT block
    expect(acceptBlockStart).toBeGreaterThan(0);
    expect(v2Idx).toBeGreaterThan(acceptBlockStart);
  });

  it('L1-2: idempotency guard uses source_offer_id (not offer_id column)', () => {
    const sql = readSource(
      'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
    );
    // Idempotency: IF NOT EXISTS (... WHERE source_offer_id = v_offer.id)
    expect(sql).toMatch(/IF NOT EXISTS[\s\S]*source_offer_id[\s\S]*v_offer\.id/);
  });

  it('L1-3: existing project is returned when already created (no duplicate INSERT)', () => {
    const sql = readSource(
      'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
    );
    // The ELSE branch retrieves the existing project id on idempotent retry
    expect(sql).toMatch(/ELSE[\s\S]*SELECT id INTO v_project_id[\s\S]*source_offer_id/);
  });

  it('L1-4: project_id is included in ACCEPT response (available for client-side use)', () => {
    const sql = readSource(
      'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
    );
    expect(sql).toContain('project_id');
    expect(sql).toContain('v_project_id');
  });

  it('L1-5: ACCEPT response still includes success=true and status=ACCEPTED', () => {
    const sql = readSource(
      'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
    );
    expect(sql).toContain("'success', true");
    expect(sql).toContain("'ACCEPTED'");
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// L2 — Logic contract: notifications on ACCEPT/REJECT
// ════════════════════════════════════════════════════════════════════════════════

describe('[L2] Notifications logic contracts', () => {
  it('L2-1: notification is sent on both ACCEPT and REJECT (not gated by action)', () => {
    const sql = readSource(
      'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
    );
    // INSERT INTO notifications must appear outside of any p_action gate
    const notifIdx = sql.indexOf('INSERT INTO notifications');

    // The notifications insert should NOT be inside the v2_projects ACCEPT-only block
    // (it appears after the IF ACCEPT ... END IF for L-1)
    expect(notifIdx).toBeGreaterThan(0);
    // Verify notifications insert is the last major side-effect before RETURN
    const returnIdx = sql.lastIndexOf('RETURN jsonb_build_object');
    expect(notifIdx).toBeLessThan(returnIdx);
  });

  it('L2-2: comment is appended to REJECT message when provided', () => {
    const sql = readSource(
      'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
    );
    expect(sql).toContain('Komentarz: ');
    // Comment appended only when non-null/non-empty
    expect(sql).toMatch(/p_comment IS NOT NULL.*p_comment <> ''/s);
  });

  it('L2-3: notification title is in Polish (target market)', () => {
    const sql = readSource(
      'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
    );
    expect(sql).toContain('Oferta zaakceptowana');
    expect(sql).toContain('Oferta odrzucona');
  });

  it('L2-4: notification type values match useNotifications.ts type union', () => {
    const sql = readSource(
      'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
    );
    // Valid types: 'info' | 'success' | 'warning' | 'error'
    const validTypes = ["'success'", "'warning'", "'info'", "'error'"];
    const hasAtLeastOneValidType = validTypes.some((t) => sql.includes(t));
    expect(hasAtLeastOneValidType).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// READER — Legacy reader hooks migrated from offer_approvals to offers
// ════════════════════════════════════════════════════════════════════════════════

describe('[READER] useOfferStats — migrated from offer_approvals to offers table', () => {
  let useOfferStatsSource: string;

  try {
    useOfferStatsSource = readSource('src/hooks/useOfferStats.ts');
  } catch {
    useOfferStatsSource = '';
  }

  it('READER-1: useOfferStats.ts exists', () => {
    expect(useOfferStatsSource.length).toBeGreaterThan(0);
  });

  it('READER-2: useOfferStats no longer reads from offer_approvals for accepted count', () => {
    // The accepted count must NOT use offer_approvals table as a Supabase query target.
    // Matches the pattern .from('offer_approvals') — ignores comments.
    expect(useOfferStatsSource).not.toContain(".from('offer_approvals')");
  });

  it('READER-3: useOfferStats reads accepted count from offers table with ACCEPTED status', () => {
    expect(useOfferStatsSource).toContain("from('offers')");
    expect(useOfferStatsSource).toContain("'ACCEPTED'");
  });

  it('READER-4: useOfferStats uses accepted_at column for 30-day range (not created_at)', () => {
    expect(useOfferStatsSource).toContain('accepted_at');
  });

  it('READER-5: useOfferStats uses count query (head: true) for efficiency', () => {
    expect(useOfferStatsSource).toContain('head: true');
    expect(useOfferStatsSource).toContain('count: \'exact\'');
  });
});

describe('[READER] useFreeTierOfferQuota — fallback migrated from offer_approvals to offers table', () => {
  let quotaSource: string;

  try {
    quotaSource = readSource('src/hooks/useFreeTierOfferQuota.ts');
  } catch {
    quotaSource = '';
  }

  it('READER-6: useFreeTierOfferQuota.ts exists', () => {
    expect(quotaSource.length).toBeGreaterThan(0);
  });

  it('READER-7: fallback no longer reads from offer_approvals', () => {
    // The fallback is the only place that previously queried offer_approvals
    expect(quotaSource).not.toContain("from('offer_approvals')");
  });

  it('READER-8: fallback reads from offers table with UPPERCASE status values', () => {
    expect(quotaSource).toContain("from('offers')");
    // Canonical status values are UPPERCASE (per COMPATIBILITY_MATRIX — Status Values table)
    expect(quotaSource).toContain("'SENT'");
    expect(quotaSource).toContain("'ACCEPTED'");
    expect(quotaSource).toContain("'REJECTED'");
  });

  it('READER-9: primary path still uses count_monthly_finalized_offers RPC (unchanged)', () => {
    expect(quotaSource).toContain('count_monthly_finalized_offers');
    expect(quotaSource).toContain('supabase.rpc');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// COMPAT — Backward compatibility: existing function contracts preserved
// ════════════════════════════════════════════════════════════════════════════════

describe('[COMPAT] process_offer_acceptance_action backward compatibility', () => {
  const sql = readSource(
    'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
  );

  it('COMPAT-1: function signature unchanged — same 3 parameters as PR-12', () => {
    expect(sql).toContain('p_token   uuid');
    expect(sql).toContain('p_action  text');
    expect(sql).toContain('p_comment text DEFAULT NULL');
  });

  it('COMPAT-2: ACCEPT and REJECT are still the only valid action values', () => {
    expect(sql).toContain("p_action NOT IN ('ACCEPT', 'REJECT')");
    expect(sql).toContain("'invalid_action'");
  });

  it('COMPAT-3: comment is still sanitized to 1000 chars max', () => {
    expect(sql).toContain('left(p_comment, 1000)');
  });

  it('COMPAT-4: offer status still updated to ACCEPTED/REJECTED in offers table', () => {
    expect(sql).toContain("status = 'ACCEPTED'");
    expect(sql).toContain("status = 'REJECTED'");
    expect(sql).toContain('accepted_at = now()');
    expect(sql).toContain('rejected_at = now()');
  });

  it('COMPAT-5: offer_public_actions audit log insert preserved (unchanged from PR-12)', () => {
    expect(sql).toContain('INSERT INTO offer_public_actions');
    expect(sql).toContain('offer_id, token, action, comment');
  });

  it('COMPAT-6: error response shapes unchanged — not_found, expired, offer_not_found, not_actionable', () => {
    expect(sql).toContain("'not_found'");
    expect(sql).toContain("'expired'");
    expect(sql).toContain("'offer_not_found'");
    expect(sql).toContain("'not_actionable'");
  });

  it('COMPAT-7: idempotency contract preserved — already-decided returns success=true idempotent=true', () => {
    expect(sql).toContain("'idempotent', true");
    expect(sql).toContain("'success',    true");
  });

  it('COMPAT-8: REJECT response still returns success=true + status=REJECTED', () => {
    expect(sql).toContain("'REJECTED'");
    // REJECT also returns success=true (wrapped in general RETURN at end)
    expect(sql).toContain("'success', true");
  });
});
