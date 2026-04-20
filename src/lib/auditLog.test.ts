import { describe, it, expect, vi, beforeEach } from 'vitest';
import { insertComplianceAuditEvent } from './auditLog';

const mockInsert = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ insert: mockInsert })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('insertComplianceAuditEvent', () => {
  beforeEach(() => {
    mockInsert.mockReset();
  });

  it('inserts a valid event and returns no error', async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    const result = await insertComplianceAuditEvent({
      event_type: 'user.login',
      actor_user_id: 'user-uuid-123',
      source: 'frontend',
    });

    expect(result.error).toBeNull();
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'user.login',
        actor_user_id: 'user-uuid-123',
        source: 'frontend',
        metadata: {},
      })
    );
  });

  it('defaults optional fields to null / empty object', async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    await insertComplianceAuditEvent({
      event_type: 'offer.send',
      source: 'frontend',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_user_id: null,
        target_user_id: null,
        entity_type: null,
        entity_id: null,
        metadata: {},
      })
    );
  });

  it('returns an Error when the database insert fails', async () => {
    mockInsert.mockResolvedValueOnce({
      error: { message: 'permission denied' },
    });

    const result = await insertComplianceAuditEvent({
      event_type: 'user.data_delete_request',
      actor_user_id: 'user-uuid-456',
      source: 'frontend',
    });

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('permission denied');
  });

  it('does not throw when the database insert fails (immutability guard: caller controls failure)', async () => {
    mockInsert.mockResolvedValueOnce({
      error: { message: 'unexpected db error' },
    });

    await expect(
      insertComplianceAuditEvent({
        event_type: 'user.consent_update',
        actor_user_id: 'user-uuid-789',
        source: 'frontend',
      })
    ).resolves.not.toThrow();
  });

  it('forwards metadata payload correctly', async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    const meta = { ip: '127.0.0.1', reason: 'test' };
    await insertComplianceAuditEvent({
      event_type: 'settings.update',
      actor_user_id: 'user-abc',
      entity_type: 'organization',
      entity_id: 'org-001',
      metadata: meta,
      source: 'frontend',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_type: 'organization',
        entity_id: 'org-001',
        metadata: meta,
      })
    );
  });
});
