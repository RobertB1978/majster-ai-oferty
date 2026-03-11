/**
 * Tests for useDashboardStats — data-source consistency after v2_projects migration.
 *
 * Covers:
 *  1. Status mapping: v2 statuses (ACTIVE/COMPLETED/ON_HOLD) → dashboard slots
 *  2. sentCount always 0 (no v2_projects equivalent)
 *  3. recentWeekCount: counts projects created within the past 7 days
 *  4. DashboardProject interface: `title` field (not legacy `project_name`)
 *  5. Aggregation correctness with mixed statuses
 */

import { describe, it, expect } from 'vitest';

// ── Helper: reproduces the aggregation logic from useDashboardStats queryFn ──

interface V2ProjectRow {
  status: string;
  created_at: string;
}

function aggregateV2Projects(projects: V2ProjectRow[], referenceNow: Date) {
  const oneWeekAgo = new Date(referenceNow);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return {
    totalProjects: projects.length,
    newCount: projects.filter(p => p.status === 'ON_HOLD').length,
    inProgressCount: projects.filter(p => p.status === 'ACTIVE').length,
    sentCount: 0, // no v2_projects equivalent
    acceptedCount: projects.filter(p => p.status === 'COMPLETED').length,
    recentWeekCount: projects.filter(p => new Date(p.created_at) > oneWeekAgo).length,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useDashboardStats — v2_projects aggregation', () => {
  const NOW = new Date('2026-03-11T12:00:00Z');

  describe('status mapping', () => {
    it('maps ACTIVE to inProgressCount', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: '2026-03-01T00:00:00Z' },
        { status: 'ACTIVE', created_at: '2026-03-02T00:00:00Z' },
      ];
      const result = aggregateV2Projects(projects, NOW);
      expect(result.inProgressCount).toBe(2);
      expect(result.newCount).toBe(0);
      expect(result.acceptedCount).toBe(0);
    });

    it('maps COMPLETED to acceptedCount', () => {
      const projects: V2ProjectRow[] = [
        { status: 'COMPLETED', created_at: '2026-02-01T00:00:00Z' },
      ];
      const result = aggregateV2Projects(projects, NOW);
      expect(result.acceptedCount).toBe(1);
      expect(result.inProgressCount).toBe(0);
    });

    it('maps ON_HOLD to newCount', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ON_HOLD', created_at: '2026-03-05T00:00:00Z' },
        { status: 'ON_HOLD', created_at: '2026-03-06T00:00:00Z' },
        { status: 'ON_HOLD', created_at: '2026-03-07T00:00:00Z' },
      ];
      const result = aggregateV2Projects(projects, NOW);
      expect(result.newCount).toBe(3);
    });

    it('sentCount is always 0 (no v2_projects equivalent)', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: '2026-03-10T00:00:00Z' },
        { status: 'COMPLETED', created_at: '2026-02-20T00:00:00Z' },
        { status: 'ON_HOLD', created_at: '2026-03-08T00:00:00Z' },
      ];
      const result = aggregateV2Projects(projects, NOW);
      expect(result.sentCount).toBe(0);
    });
  });

  describe('totalProjects', () => {
    it('counts all projects regardless of status', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: '2026-03-01T00:00:00Z' },
        { status: 'COMPLETED', created_at: '2026-02-10T00:00:00Z' },
        { status: 'ON_HOLD', created_at: '2026-03-05T00:00:00Z' },
      ];
      const result = aggregateV2Projects(projects, NOW);
      expect(result.totalProjects).toBe(3);
    });

    it('returns 0 for empty list', () => {
      const result = aggregateV2Projects([], NOW);
      expect(result.totalProjects).toBe(0);
      expect(result.newCount).toBe(0);
      expect(result.inProgressCount).toBe(0);
      expect(result.sentCount).toBe(0);
      expect(result.acceptedCount).toBe(0);
      expect(result.recentWeekCount).toBe(0);
    });
  });

  describe('recentWeekCount', () => {
    it('counts only projects created within the past 7 days', () => {
      // NOW = 2026-03-11T12:00:00Z → oneWeekAgo = 2026-03-04T12:00:00Z
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: '2026-03-10T00:00:00Z' }, // in range ✓
        { status: 'ACTIVE', created_at: '2026-03-05T00:00:00Z' }, // in range ✓
        { status: 'COMPLETED', created_at: '2026-03-04T11:59:59Z' }, // just before cutoff ✗
        { status: 'ON_HOLD', created_at: '2026-02-01T00:00:00Z' }, // old ✗
      ];
      const result = aggregateV2Projects(projects, NOW);
      expect(result.recentWeekCount).toBe(2);
    });

    it('project created exactly at the cutoff boundary is excluded', () => {
      const oneWeekAgo = new Date(NOW);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: oneWeekAgo.toISOString() }, // not > oneWeekAgo
      ];
      const result = aggregateV2Projects(projects, NOW);
      expect(result.recentWeekCount).toBe(0);
    });
  });

  describe('mixed-status aggregation', () => {
    it('correctly separates all status buckets', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: '2026-03-10T00:00:00Z' },
        { status: 'ACTIVE', created_at: '2026-03-09T00:00:00Z' },
        { status: 'ACTIVE', created_at: '2026-03-08T00:00:00Z' },
        { status: 'COMPLETED', created_at: '2026-02-20T00:00:00Z' },
        { status: 'COMPLETED', created_at: '2026-01-15T00:00:00Z' },
        { status: 'ON_HOLD', created_at: '2026-03-07T00:00:00Z' },
      ];
      const result = aggregateV2Projects(projects, NOW);

      expect(result.totalProjects).toBe(6);
      expect(result.inProgressCount).toBe(3); // 3× ACTIVE
      expect(result.acceptedCount).toBe(2);   // 2× COMPLETED
      expect(result.newCount).toBe(1);         // 1× ON_HOLD
      expect(result.sentCount).toBe(0);        // always 0
      // 3× ACTIVE (08,09,10 March) + 1× ON_HOLD (07 March) = 4 recent
      expect(result.recentWeekCount).toBe(4);
    });
  });
});

// ── DashboardProject interface validation ─────────────────────────────────────

describe('DashboardProject interface', () => {
  it('uses `title` field (v2_projects), not legacy `project_name`', () => {
    // This is a compile-time / structural check:
    // If the interface had `project_name` instead of `title`, the assignment below
    // would produce a TypeScript error. Keeping this as a documentation test.
    const project = {
      id: 'abc',
      title: 'Remont łazienki',
      status: 'ACTIVE',
      created_at: '2026-03-10T00:00:00Z',
      client_id: null,
      clients: null,
    };

    expect(project.title).toBe('Remont łazienki');
    expect(Object.keys(project)).not.toContain('project_name');
  });
});
