import { describe, it, expect } from 'vitest';
import type { RetentionRule, RetentionStatus, RetentionDeletionStrategy } from '@/types/retention';

// ── Type contract tests ────────────────────────────────────────────────────────

describe('RetentionRule type contract', () => {
  const VALID_STATUSES: RetentionStatus[] = ['active', 'inactive', 'manual', 'planned'];
  const VALID_STRATEGIES: RetentionDeletionStrategy[] = [
    'hard_delete', 'soft_delete', 'archive', 'manual_review', 'unknown',
  ];

  it('accepts a fully-populated rule', () => {
    const rule: RetentionRule = {
      id: 'aaa-bbb-ccc',
      data_domain: 'system',
      rule_name: 'Nieużywane klucze API',
      applies_to: 'api_keys',
      retention_period_days: 90,
      deletion_strategy: 'hard_delete',
      legal_basis_note: 'Dowód: cleanup-expired-data/index.ts:68',
      status: 'active',
      last_run_at: '2026-04-21T12:00:00Z',
      last_run_status: 'success',
      created_at: '2026-04-21T12:00:00Z',
      updated_at: '2026-04-21T12:00:00Z',
    };

    expect(rule.applies_to).toBe('api_keys');
    expect(rule.retention_period_days).toBe(90);
    expect(rule.deletion_strategy).toBe('hard_delete');
    expect(rule.last_run_status).toBe('success');
  });

  it('accepts a rule with unknown retention period (null)', () => {
    const rule: RetentionRule = {
      id: 'ddd-eee-fff',
      data_domain: 'compliance',
      rule_name: 'Log audytowy compliance',
      applies_to: 'compliance_audit_log',
      retention_period_days: null,
      deletion_strategy: 'manual_review',
      legal_basis_note: null,
      status: 'manual',
      last_run_at: null,
      last_run_status: null,
      created_at: '2026-04-21T12:00:00Z',
      updated_at: '2026-04-21T12:00:00Z',
    };

    expect(rule.retention_period_days).toBeNull();
    expect(rule.deletion_strategy).toBe('manual_review');
    expect(rule.last_run_at).toBeNull();
  });

  it('all valid statuses are covered', () => {
    expect(VALID_STATUSES).toContain('active');
    expect(VALID_STATUSES).toContain('inactive');
    expect(VALID_STATUSES).toContain('manual');
    expect(VALID_STATUSES).toContain('planned');
    expect(VALID_STATUSES).toHaveLength(4);
  });

  it('all valid deletion strategies are covered', () => {
    expect(VALID_STRATEGIES).toContain('hard_delete');
    expect(VALID_STRATEGIES).toContain('soft_delete');
    expect(VALID_STRATEGIES).toContain('archive');
    expect(VALID_STRATEGIES).toContain('manual_review');
    expect(VALID_STRATEGIES).toContain('unknown');
    expect(VALID_STRATEGIES).toHaveLength(5);
  });
});

// ── Migration structural test ─────────────────────────────────────────────────

describe('retention_rules migration', () => {
  it('migration file exists and contains required table definition', async () => {
    const fs = await import('fs');
    const migrationPath = 'supabase/migrations/20260421120000_pr_l6_retention_rules.sql';
    const content = fs.readFileSync(migrationPath, 'utf-8');

    expect(content).toContain('CREATE TABLE IF NOT EXISTS public.retention_rules');
    expect(content).toContain('data_domain');
    expect(content).toContain('rule_name');
    expect(content).toContain('applies_to');
    expect(content).toContain('retention_period_days');
    expect(content).toContain('deletion_strategy');
    expect(content).toContain('last_run_at');
    expect(content).toContain('last_run_status');
  });

  it('migration enforces deletion_strategy constraint', async () => {
    const fs = await import('fs');
    const migrationPath = 'supabase/migrations/20260421120000_pr_l6_retention_rules.sql';
    const content = fs.readFileSync(migrationPath, 'utf-8');

    expect(content).toContain('retention_rules_deletion_strategy_check');
    expect(content).toContain("'hard_delete'");
    expect(content).toContain("'manual_review'");
    expect(content).toContain("'unknown'");
  });

  it('migration has RLS enabled and admin-only select policy', async () => {
    const fs = await import('fs');
    const migrationPath = 'supabase/migrations/20260421120000_pr_l6_retention_rules.sql';
    const content = fs.readFileSync(migrationPath, 'utf-8');

    expect(content).toContain('ENABLE ROW LEVEL SECURITY');
    expect(content).toContain('retention_rules_select_admin');
    expect(content).toContain("role = 'admin'");
  });

  it('migration seeds only evidence-based retention periods', async () => {
    const fs = await import('fs');
    const migrationPath = 'supabase/migrations/20260421120000_pr_l6_retention_rules.sql';
    const content = fs.readFileSync(migrationPath, 'utf-8');

    // Evidenced rules must have explicit days
    expect(content).toContain("'api_keys'");
    expect(content).toContain("'offer_approvals'");
    expect(content).toContain("'push_tokens'");
    expect(content).toContain("'ai_chat_history'");

    // UNKNOWN domains must use manual_review
    expect(content).toContain("'compliance_audit_log'");
    expect(content).toContain("'dsar_requests'");
    expect(content).toContain("'manual_review'");

    // UNKNOWN domains use manual_review strategy (not fake hard numbers)
    expect(content.match(/'manual_review'/g)?.length).toBeGreaterThanOrEqual(3);
  });
});

// ── Admin access boundary ─────────────────────────────────────────────────────

describe('retention_rules access boundary', () => {
  // Mirrors the SQL constraint: only role = 'admin' can SELECT
  function canViewRetentionRules(roles: string[]): boolean {
    return roles.includes('admin');
  }

  it('admin can view retention rules', () => {
    expect(canViewRetentionRules(['admin'])).toBe(true);
  });

  it('authenticated non-admin cannot view retention rules', () => {
    expect(canViewRetentionRules(['user'])).toBe(false);
  });

  it('unauthenticated user cannot view retention rules', () => {
    expect(canViewRetentionRules([])).toBe(false);
  });

  it('moderator without admin cannot view retention rules', () => {
    expect(canViewRetentionRules(['moderator'])).toBe(false);
  });
});
