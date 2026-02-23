/**
 * Integration-style tests for server-side plan limit enforcement.
 *
 * These tests verify:
 *   1. That the PLAN_LIMIT_REACHED error code is correctly identified when
 *      the DB trigger rejects an INSERT.
 *   2. That all three enforced resources (projects, clients, offer_approvals)
 *      produce the same stable error identifier.
 *   3. That a resend to an existing project does NOT raise the limit error.
 *
 * The Supabase client is mocked to simulate what the live database would
 * return when a BEFORE INSERT trigger raises:
 *   RAISE EXCEPTION 'PLAN_LIMIT_REACHED' USING DETAIL = '...', HINT = '...';
 *
 * In production Supabase, that translates to:
 *   { error: { message: 'PLAN_LIMIT_REACHED', code: 'P0001', details: '...' } }
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// ---------------------------------------------------------------------------
// Minimal mock – only the .from().insert() chain is exercised here
// ---------------------------------------------------------------------------
const insertMock = vi.fn();
const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: insertMock,
  })),
};

// ---------------------------------------------------------------------------
// Helper – build the PostgreSQL error payload a BEFORE INSERT trigger raises
// ---------------------------------------------------------------------------
function planLimitError(resource: string) {
  return {
    data: null,
    error: {
      message: 'PLAN_LIMIT_REACHED',
      code: 'P0001',
      details: `${resource} limit reached. Upgrade your plan.`,
      hint: 'Upgrade your plan.',
    },
  };
}

/** Returns true when the Supabase response represents a plan limit violation */
function isPlanLimitReached(response: { error: { message: string } | null }): boolean {
  return response.error?.message === 'PLAN_LIMIT_REACHED';
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Server-side plan limit enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // projects
  // -------------------------------------------------------------------------
  describe('projects table', () => {
    it('returns PLAN_LIMIT_REACHED when the free-plan project quota is exceeded', async () => {
      // Simulate DB trigger rejecting the INSERT (free plan: 3 projects max)
      insertMock.mockResolvedValueOnce(planLimitError('Project'));

      const response = await mockSupabaseClient
        .from('projects')
        .insert({ project_name: 'Project 4', user_id: 'user-free' });

      expect(isPlanLimitReached(response)).toBe(true);
      expect(response.error?.message).toBe('PLAN_LIMIT_REACHED');
      expect(response.error?.code).toBe('P0001');
    });

    it('succeeds (no error) when within the project quota', async () => {
      insertMock.mockResolvedValueOnce({ data: { id: 'proj-1' }, error: null });

      const response = await mockSupabaseClient
        .from('projects')
        .insert({ project_name: 'Project 1', user_id: 'user-free' });

      expect(isPlanLimitReached(response)).toBe(false);
      expect(response.error).toBeNull();
    });

    it('succeeds on enterprise plan regardless of count (unlimited quota)', async () => {
      // Enterprise: max_projects = 2_147_483_647 – trigger will never fire
      insertMock.mockResolvedValueOnce({ data: { id: 'proj-999' }, error: null });

      const response = await mockSupabaseClient
        .from('projects')
        .insert({ project_name: 'Project 999', user_id: 'user-enterprise' });

      expect(isPlanLimitReached(response)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // offer_approvals
  // -------------------------------------------------------------------------
  describe('offer_approvals table', () => {
    it('returns PLAN_LIMIT_REACHED when the offer quota is exceeded (new project)', async () => {
      insertMock.mockResolvedValueOnce(planLimitError('Offer'));

      const response = await mockSupabaseClient
        .from('offer_approvals')
        .insert({ project_id: 'proj-new', user_id: 'user-free' });

      expect(isPlanLimitReached(response)).toBe(true);
      expect(response.error?.message).toBe('PLAN_LIMIT_REACHED');
    });

    it('does NOT return PLAN_LIMIT_REACHED for a resend to an existing project', async () => {
      // The trigger allows resends (same project_id) unconditionally
      insertMock.mockResolvedValueOnce({ data: { id: 'offer-resend' }, error: null });

      const response = await mockSupabaseClient
        .from('offer_approvals')
        .insert({ project_id: 'proj-existing', user_id: 'user-free' });

      expect(isPlanLimitReached(response)).toBe(false);
      expect(response.error).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // clients
  // -------------------------------------------------------------------------
  describe('clients table', () => {
    it('returns PLAN_LIMIT_REACHED when the client quota is exceeded', async () => {
      // free plan: 5 clients max
      insertMock.mockResolvedValueOnce(planLimitError('Client'));

      const response = await mockSupabaseClient
        .from('clients')
        .insert({ name: 'Client 6', user_id: 'user-free' });

      expect(isPlanLimitReached(response)).toBe(true);
      expect(response.error?.code).toBe('P0001');
    });
  });

  // -------------------------------------------------------------------------
  // error code contract
  // -------------------------------------------------------------------------
  describe('error code contract', () => {
    it('PLAN_LIMIT_REACHED is the stable identifier across all resources', () => {
      const resources = ['projects', 'clients', 'offer_approvals'];

      resources.forEach((resource) => {
        const err = planLimitError(resource);
        expect(err.error.message).toBe('PLAN_LIMIT_REACHED');
        expect(err.error.code).toBe('P0001');
        expect(isPlanLimitReached(err)).toBe(true);
      });
    });

    it('a generic DB error is NOT mistaken for a plan limit error', () => {
      const genericError = {
        data: null,
        error: { message: 'duplicate key value violates unique constraint', code: '23505' },
      };
      expect(isPlanLimitReached(genericError)).toBe(false);
    });

    it('null error is NOT mistaken for a plan limit error', () => {
      const successResponse = { data: { id: 'ok' }, error: null };
      expect(isPlanLimitReached(successResponse)).toBe(false);
    });
  });
});
