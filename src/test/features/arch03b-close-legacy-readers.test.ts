/**
 * arch03b-close-legacy-readers.test.ts
 *
 * PR-ARCH-03b: Regression tests for the migration of two remaining legacy readers
 * (useExpirationMonitor, TodayTasks) from offer_approvals to acceptance_links.
 *
 * Covers:
 *   MONITOR-*   useExpirationMonitor migration contracts
 *   TASKS-*     TodayTasks migration contracts
 *   COMPAT-*    Backward compatibility: unchanged areas are not touched
 *
 * All tests are pure / static — no live Supabase client required.
 *
 * Reference documents:
 *   docs/COMPATIBILITY_MATRIX.md — "ARCH-03 Deferred Work (ARCH-03b)" section
 *   docs/ADR/ADR-0014-public-offer-canonical-flow.md
 *   supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql — L-2 notification
 *     uses '/app/offers/' (line 165), confirming canonical URL for offer-related navigation
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
// MONITOR — useExpirationMonitor migration contracts
// ════════════════════════════════════════════════════════════════════════════════

describe('[MONITOR] useExpirationMonitor — migrated from offer_approvals to acceptance_links', () => {
  let src: string;

  try {
    src = readSource('src/hooks/useExpirationMonitor.ts');
  } catch {
    src = '';
  }

  it('MONITOR-1: useExpirationMonitor.ts exists', () => {
    expect(src.length).toBeGreaterThan(0);
  });

  it('MONITOR-2: no longer reads from offer_approvals for expiring offers', () => {
    // Must NOT have .from('offer_approvals') for the expiring offers query
    // (subscription monitoring uses user_subscriptions, not offer_approvals)
    expect(src).not.toContain(".from('offer_approvals')");
  });

  it('MONITOR-3: reads from acceptance_links (canonical table)', () => {
    expect(src).toContain(".from('acceptance_links')");
  });

  it('MONITOR-4: selects offer_id instead of project_id (canonical FK)', () => {
    expect(src).toContain('offer_id');
    expect(src).not.toContain('project_id');
  });

  it('MONITOR-5: action_url points to /app/offers/ (not /app/projects/)', () => {
    expect(src).toContain('/app/offers/');
    expect(src).not.toContain('/app/projects/');
  });

  it('MONITOR-6: filters SENT offers to exclude already-accepted/rejected links', () => {
    // acceptance_links persist after ACCEPT/REJECT — must filter by offers.status
    expect(src).toContain("'SENT'");
  });

  it('MONITOR-7: joins to offers to retrieve offer title for notification context', () => {
    expect(src).toContain('offers(title, status)');
  });

  it('MONITOR-8: subscription monitoring still uses /app/billing (unchanged)', () => {
    expect(src).toContain('/app/billing');
  });

  it('MONITOR-9: ARCH-03b migration comment present in source', () => {
    expect(src).toContain('ARCH-03b');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// TASKS — TodayTasks migration contracts
// ════════════════════════════════════════════════════════════════════════════════

describe('[TASKS] TodayTasks — expiring_offer type migrated to acceptance_links', () => {
  let src: string;

  try {
    src = readSource('src/components/dashboard/TodayTasks.tsx');
  } catch {
    src = '';
  }

  it('TASKS-1: TodayTasks.tsx exists', () => {
    expect(src.length).toBeGreaterThan(0);
  });

  it('TASKS-2: expiring_offer no longer reads from offer_approvals', () => {
    expect(src).not.toContain(".from('offer_approvals')");
  });

  it('TASKS-3: expiring_offer reads from acceptance_links (canonical)', () => {
    expect(src).toContain(".from('acceptance_links')");
  });

  it('TASKS-4: expiring_offer href uses /app/offers/ (not old /app/projects/ approval path)', () => {
    // expiring_offer type now uses /app/offers/:offer_id (canonical)
    expect(src).toContain('/app/offers/${link.offer_id}');
    // The old expiring_offer path via approval.project_id must be gone
    expect(src).not.toContain('/app/projects/${approval.project_id}');
    // Note: inactive_project type still correctly links to /app/projects/:id
  });

  it('TASKS-5: expiring_offer filters SENT offers (canonical status check)', () => {
    expect(src).toContain("'SENT'");
  });

  it('TASKS-6: pending_offer query still reads from offers table (unchanged)', () => {
    // The pending_offer type (offers sent >3 days ago) was already canonical — must not be touched
    expect(src).toContain(".from('offers')");
    expect(src).toContain("'SENT'");
  });

  it('TASKS-7: expiring_offer links to offer_id (not project_id)', () => {
    expect(src).toContain('link.offer_id');
    expect(src).not.toContain('approval.project_id');
  });

  it('TASKS-8: ARCH-03b comment present in expiring_offer section', () => {
    expect(src).toContain('ARCH-03b');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// COMPAT — Backward compatibility: unchanged areas
// ════════════════════════════════════════════════════════════════════════════════

describe('[COMPAT] Unchanged areas not affected by ARCH-03b', () => {
  it('COMPAT-1: useExpirationMonitor still monitors subscription expiration via user_subscriptions', () => {
    const src = readSource('src/hooks/useExpirationMonitor.ts');
    expect(src).toContain(".from('user_subscriptions')");
    expect(src).toContain('current_period_end');
  });

  it('COMPAT-2: TodayTasks inactive_project query still uses v2_projects table (unchanged)', () => {
    const src = readSource('src/components/dashboard/TodayTasks.tsx');
    expect(src).toContain(".from('v2_projects')");
    expect(src).toContain("'ACTIVE'");
  });

  it('COMPAT-3: TodayTasks.tsx still renders a card with three task types', () => {
    const src = readSource('src/components/dashboard/TodayTasks.tsx');
    expect(src).toContain('pending_offer');
    expect(src).toContain('expiring_offer');
    expect(src).toContain('inactive_project');
  });

  it('COMPAT-4: ARCH-03 migration SQL confirms /app/offers/ as canonical URL for notifications', () => {
    const sql = readSource(
      'supabase/migrations/20260415120000_arch03_l1_l2_close_canonical_gaps.sql'
    );
    // L-2 notification action_url = '/app/offers/' || v_offer.id — this is the source of truth
    expect(sql).toContain('/app/offers/');
  });

  it('COMPAT-5: App.tsx route offers/:id exists (target route must be registered)', () => {
    const src = readSource('src/App.tsx');
    expect(src).toContain('offers/:id');
  });

  it('COMPAT-6: useExpirationMonitor still exported (public API unchanged)', () => {
    const src = readSource('src/hooks/useExpirationMonitor.ts');
    expect(src).toContain('export function useExpirationMonitor');
  });

  it('COMPAT-7: TodayTasks still exported as named export (public API unchanged)', () => {
    const src = readSource('src/components/dashboard/TodayTasks.tsx');
    expect(src).toContain('export const TodayTasks');
  });
});
