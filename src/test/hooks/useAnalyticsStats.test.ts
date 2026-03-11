/**
 * Tests for useAnalyticsStats — data-source consistency after v2_projects migration.
 *
 * Covers:
 *  1. Status mapping: v2 statuses (ACTIVE/COMPLETED/ON_HOLD/CANCELLED) → statusCounts
 *  2. totalProjects: counts all rows including CANCELLED
 *  3. conversionRate: COMPLETED / non-cancelled projects
 *  4. Monthly project distribution (last 6 months window)
 *  5. projectsTrend: % change vs previous month
 */

import { describe, it, expect } from 'vitest';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { pl } from 'date-fns/locale';

// ── Helper: reproduces the aggregation logic from useAnalyticsStats queryFn ──

interface V2ProjectRow {
  status: string;
  created_at: string;
}

function aggregateV2ProjectStats(projects: V2ProjectRow[], referenceNow: Date) {
  const lastMonth = subMonths(referenceNow, 1);

  const statusCounts = {
    ACTIVE:    projects.filter(p => p.status === 'ACTIVE').length,
    COMPLETED: projects.filter(p => p.status === 'COMPLETED').length,
    ON_HOLD:   projects.filter(p => p.status === 'ON_HOLD').length,
    CANCELLED: projects.filter(p => p.status === 'CANCELLED').length,
  };

  const monthlyProjects = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(referenceNow, 5 - i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const count = projects.filter(p => {
      const createdAt = new Date(p.created_at);
      return createdAt >= monthStart && createdAt <= monthEnd;
    }).length;
    return { month: format(monthDate, 'MMM', { locale: pl }), projekty: count };
  });

  const thisMonthStart = startOfMonth(referenceNow);
  const thisMonthEnd = endOfMonth(referenceNow);
  const lastMonthStart = startOfMonth(lastMonth);
  const lastMonthEnd = endOfMonth(lastMonth);

  const thisMonthProjects = projects.filter(p => {
    const d = new Date(p.created_at);
    return d >= thisMonthStart && d <= thisMonthEnd;
  }).length;

  const lastMonthProjects = projects.filter(p => {
    const d = new Date(p.created_at);
    return d >= lastMonthStart && d <= lastMonthEnd;
  }).length;

  const projectsTrend = lastMonthProjects > 0
    ? Math.round(((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100)
    : thisMonthProjects > 0 ? 100 : 0;

  const activeProjects = projects.filter(p => p.status !== 'CANCELLED').length;
  const conversionRate = activeProjects > 0
    ? Math.round((statusCounts.COMPLETED / activeProjects) * 100)
    : 0;

  return { statusCounts, totalProjects: projects.length, monthlyProjects, thisMonthProjects, projectsTrend, conversionRate };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAnalyticsStats — v2_projects aggregation', () => {
  const NOW = new Date('2026-03-11T12:00:00Z');

  describe('statusCounts', () => {
    it('maps ACTIVE projects correctly', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: '2026-03-01T00:00:00Z' },
        { status: 'ACTIVE', created_at: '2026-03-02T00:00:00Z' },
        { status: 'COMPLETED', created_at: '2026-02-01T00:00:00Z' },
      ];
      const { statusCounts } = aggregateV2ProjectStats(projects, NOW);
      expect(statusCounts.ACTIVE).toBe(2);
      expect(statusCounts.COMPLETED).toBe(1);
      expect(statusCounts.ON_HOLD).toBe(0);
      expect(statusCounts.CANCELLED).toBe(0);
    });

    it('maps all four v2 statuses independently', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE',    created_at: '2026-03-01T00:00:00Z' },
        { status: 'COMPLETED', created_at: '2026-02-01T00:00:00Z' },
        { status: 'ON_HOLD',   created_at: '2026-01-15T00:00:00Z' },
        { status: 'CANCELLED', created_at: '2025-12-01T00:00:00Z' },
      ];
      const { statusCounts } = aggregateV2ProjectStats(projects, NOW);
      expect(statusCounts.ACTIVE).toBe(1);
      expect(statusCounts.COMPLETED).toBe(1);
      expect(statusCounts.ON_HOLD).toBe(1);
      expect(statusCounts.CANCELLED).toBe(1);
    });

    it('does NOT contain legacy Polish status keys', () => {
      const { statusCounts } = aggregateV2ProjectStats([], NOW);
      const keys = Object.keys(statusCounts);
      expect(keys).not.toContain('Nowy');
      expect(keys).not.toContain('Wycena w toku');
      expect(keys).not.toContain('Oferta wysłana');
      expect(keys).not.toContain('Zaakceptowany');
    });
  });

  describe('totalProjects', () => {
    it('counts all projects including CANCELLED', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE',    created_at: '2026-03-01T00:00:00Z' },
        { status: 'COMPLETED', created_at: '2026-02-01T00:00:00Z' },
        { status: 'CANCELLED', created_at: '2025-12-01T00:00:00Z' },
      ];
      const { totalProjects } = aggregateV2ProjectStats(projects, NOW);
      expect(totalProjects).toBe(3);
    });

    it('returns 0 for empty list', () => {
      const { totalProjects, statusCounts } = aggregateV2ProjectStats([], NOW);
      expect(totalProjects).toBe(0);
      expect(statusCounts.ACTIVE).toBe(0);
      expect(statusCounts.COMPLETED).toBe(0);
    });
  });

  describe('conversionRate', () => {
    it('calculates COMPLETED / non-cancelled projects', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE',    created_at: '2026-03-01T00:00:00Z' },
        { status: 'ACTIVE',    created_at: '2026-03-02T00:00:00Z' },
        { status: 'ACTIVE',    created_at: '2026-03-03T00:00:00Z' },
        { status: 'COMPLETED', created_at: '2026-02-01T00:00:00Z' },
        { status: 'COMPLETED', created_at: '2026-01-01T00:00:00Z' },
        { status: 'CANCELLED', created_at: '2025-12-01T00:00:00Z' }, // excluded from denominator
      ];
      // 2 COMPLETED / 5 non-cancelled = 40%
      const { conversionRate } = aggregateV2ProjectStats(projects, NOW);
      expect(conversionRate).toBe(40);
    });

    it('returns 0 when there are no non-cancelled projects', () => {
      const projects: V2ProjectRow[] = [
        { status: 'CANCELLED', created_at: '2025-12-01T00:00:00Z' },
      ];
      const { conversionRate } = aggregateV2ProjectStats(projects, NOW);
      expect(conversionRate).toBe(0);
    });

    it('returns 100% when all non-cancelled projects are COMPLETED', () => {
      const projects: V2ProjectRow[] = [
        { status: 'COMPLETED', created_at: '2026-01-01T00:00:00Z' },
        { status: 'COMPLETED', created_at: '2026-02-01T00:00:00Z' },
      ];
      const { conversionRate } = aggregateV2ProjectStats(projects, NOW);
      expect(conversionRate).toBe(100);
    });
  });

  describe('projectsTrend', () => {
    it('calculates positive trend when this month > last month', () => {
      // NOW = 2026-03-11 → this month = March 2026, last month = February 2026
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: '2026-03-01T00:00:00Z' }, // March
        { status: 'ACTIVE', created_at: '2026-03-05T00:00:00Z' }, // March
        { status: 'ACTIVE', created_at: '2026-02-10T00:00:00Z' }, // February
      ];
      // 2 this month, 1 last month → +100%
      const { projectsTrend } = aggregateV2ProjectStats(projects, NOW);
      expect(projectsTrend).toBe(100);
    });

    it('calculates negative trend when this month < last month', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: '2026-03-01T00:00:00Z' }, // March: 1
        { status: 'ACTIVE', created_at: '2026-02-10T00:00:00Z' }, // February: 2
        { status: 'ACTIVE', created_at: '2026-02-20T00:00:00Z' },
      ];
      // 1 this month, 2 last month → -50%
      const { projectsTrend } = aggregateV2ProjectStats(projects, NOW);
      expect(projectsTrend).toBe(-50);
    });

    it('returns 100 when no projects last month but some this month', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: '2026-03-05T00:00:00Z' },
      ];
      const { projectsTrend } = aggregateV2ProjectStats(projects, NOW);
      expect(projectsTrend).toBe(100);
    });

    it('returns 0 when no projects in either month', () => {
      const { projectsTrend } = aggregateV2ProjectStats([], NOW);
      expect(projectsTrend).toBe(0);
    });
  });

  describe('monthlyProjects', () => {
    it('returns exactly 6 months of data', () => {
      const { monthlyProjects } = aggregateV2ProjectStats([], NOW);
      expect(monthlyProjects).toHaveLength(6);
    });

    it('counts projects correctly per month', () => {
      const projects: V2ProjectRow[] = [
        { status: 'ACTIVE', created_at: '2026-03-05T00:00:00Z' }, // current month
        { status: 'ACTIVE', created_at: '2026-03-10T00:00:00Z' }, // current month
        { status: 'COMPLETED', created_at: '2026-02-15T00:00:00Z' }, // previous month
      ];
      const { monthlyProjects } = aggregateV2ProjectStats(projects, NOW);
      const march = monthlyProjects[monthlyProjects.length - 1]; // most recent
      const feb = monthlyProjects[monthlyProjects.length - 2];
      expect(march.projekty).toBe(2);
      expect(feb.projekty).toBe(1);
    });
  });
});
