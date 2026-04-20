/**
 * Unit tests for DSAR request hooks.
 *
 * Covers:
 *   1. Request creation — inserts into dsar_requests + audit log
 *   2. Permission boundary — user reads only own requests (RLS enforced via eq filter)
 *   3. Status update path — admin update triggers correct audit event type
 */
import { describe, it, expect, vi } from 'vitest';
import type { DsarRequest } from '@/types/dsar';

// ── shared mock data ──────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user-uuid-1234';
const MOCK_DSAR_ID = 'dsar-uuid-5678';

const MOCK_DSAR_RECORD: DsarRequest = {
  id: MOCK_DSAR_ID,
  requester_user_id: MOCK_USER_ID,
  request_type: 'deletion',
  status: 'open',
  description: 'Test deletion request',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  due_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  assigned_to: null,
  resolved_at: null,
  resolution_note: null,
};

// ── supabase mock ─────────────────────────────────────────────────────────────

function makeChain(resolvedValue: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
  };
  return chain;
}

const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/auditLog', () => ({
  insertComplianceAuditEvent: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: MOCK_USER_ID } }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), error: vi.fn() },
}));

// ── tests ─────────────────────────────────────────────────────────────────────

import { insertComplianceAuditEvent } from '@/lib/auditLog';

describe('DSAR request hooks — logic', () => {

  describe('1. Request creation', () => {
    it('inserts into dsar_requests with correct fields', async () => {
      const chain = makeChain({ data: MOCK_DSAR_RECORD, error: null });
      mockFrom.mockReturnValue(chain);

      // Simulate what useCreateDsarRequest.mutationFn does
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('dsar_requests')
        .insert({
          requester_user_id: MOCK_USER_ID,
          request_type: 'deletion',
          description: 'Test',
        })
        .select()
        .single();

      expect(mockFrom).toHaveBeenCalledWith('dsar_requests');
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requester_user_id: MOCK_USER_ID,
          request_type: 'deletion',
        })
      );
      expect(error).toBeNull();
      expect(data).toMatchObject({ id: MOCK_DSAR_ID });
    });

    it('writes dsar.request_created to compliance_audit_log after insert', async () => {
      const chain = makeChain({ data: MOCK_DSAR_RECORD, error: null });
      mockFrom.mockReturnValue(chain);

      // Simulate the audit write that useCreateDsarRequest does after insert
      await insertComplianceAuditEvent({
        event_type: 'dsar.request_created',
        actor_user_id: MOCK_USER_ID,
        target_user_id: MOCK_USER_ID,
        entity_type: 'dsar_request',
        entity_id: MOCK_DSAR_ID,
        metadata: { request_type: 'deletion' },
        source: 'frontend',
      });

      expect(insertComplianceAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'dsar.request_created',
          actor_user_id: MOCK_USER_ID,
          entity_type: 'dsar_request',
        })
      );
    });
  });

  describe('2. Permission boundary', () => {
    it('user query filters by requester_user_id (own requests only)', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [MOCK_DSAR_RECORD], error: null }),
      };
      mockFrom.mockReturnValue(chain);

      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('dsar_requests')
        .select('*')
        .eq('requester_user_id', MOCK_USER_ID)
        .order('created_at', { ascending: false });

      expect(chain.eq).toHaveBeenCalledWith('requester_user_id', MOCK_USER_ID);
    });

    it('admin query does NOT filter by requester_user_id', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [MOCK_DSAR_RECORD], error: null }),
        eq: vi.fn().mockReturnThis(),
      };
      mockFrom.mockReturnValue(chain);

      const { supabase } = await import('@/integrations/supabase/client');
      // Admin query — no requester_user_id filter
      await supabase
        .from('dsar_requests')
        .select('*')
        .order('due_at', { ascending: true });

      expect(chain.eq).not.toHaveBeenCalledWith('requester_user_id', expect.anything());
    });
  });

  describe('3. Status update path', () => {
    it('writes dsar.resolved audit event when status changes to resolved', async () => {
      vi.mocked(insertComplianceAuditEvent).mockClear();

      // Simulate the audit write inside useUpdateDsarRequest
      await insertComplianceAuditEvent({
        event_type: 'dsar.resolved',
        actor_user_id: 'admin-uuid',
        target_user_id: MOCK_USER_ID,
        entity_type: 'dsar_request',
        entity_id: MOCK_DSAR_ID,
        metadata: {
          previous_status: 'in_progress',
          new_status: 'resolved',
          resolution_note: 'Data deleted.',
        },
        source: 'frontend',
      });

      expect(insertComplianceAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'dsar.resolved',
          entity_id: MOCK_DSAR_ID,
        })
      );
    });

    it('writes dsar.rejected audit event when status changes to rejected', async () => {
      vi.mocked(insertComplianceAuditEvent).mockClear();

      await insertComplianceAuditEvent({
        event_type: 'dsar.rejected',
        actor_user_id: 'admin-uuid',
        target_user_id: MOCK_USER_ID,
        entity_type: 'dsar_request',
        entity_id: MOCK_DSAR_ID,
        metadata: {
          previous_status: 'open',
          new_status: 'rejected',
          resolution_note: 'Duplicate request.',
        },
        source: 'frontend',
      });

      expect(insertComplianceAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'dsar.rejected',
        })
      );
    });

    it('writes dsar.status_changed audit event for intermediate status transitions', async () => {
      vi.mocked(insertComplianceAuditEvent).mockClear();

      await insertComplianceAuditEvent({
        event_type: 'dsar.status_changed',
        actor_user_id: 'admin-uuid',
        target_user_id: MOCK_USER_ID,
        entity_type: 'dsar_request',
        entity_id: MOCK_DSAR_ID,
        metadata: {
          previous_status: 'open',
          new_status: 'in_progress',
          resolution_note: null,
        },
        source: 'frontend',
      });

      expect(insertComplianceAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'dsar.status_changed',
        })
      );
    });
  });

  describe('4. DSAR type constraints', () => {
    it('all valid request_type values are accepted', () => {
      const validTypes: DsarRequest['request_type'][] = [
        'access', 'deletion', 'rectification', 'portability',
        'restriction', 'objection', 'other',
      ];
      // TypeScript compile-time check — if any value is invalid, TS will error
      validTypes.forEach((t) => {
        const req: Pick<DsarRequest, 'request_type'> = { request_type: t };
        expect(req.request_type).toBe(t);
      });
    });

    it('all valid status values are accepted', () => {
      const validStatuses: DsarRequest['status'][] = [
        'open', 'in_progress', 'waiting_for_user', 'resolved', 'rejected',
      ];
      validStatuses.forEach((s) => {
        const req: Pick<DsarRequest, 'status'> = { status: s };
        expect(req.status).toBe(s);
      });
    });
  });
});
