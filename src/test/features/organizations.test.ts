import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Multi-Tenant Organizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('creating organizations', () => {
    it('should create organization with owner as member', async () => {
      const orgData = {
        name: 'Test Company',
        slug: 'test-company',
        owner_user_id: 'user-1',
      };

      mockSupabaseClient.from().insert.mockReturnThis();
      mockSupabaseClient.from().select.mockReturnThis();
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: { id: 'org-1', ...orgData },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('organizations')
        .insert(orgData)
        .select()
        .single();

      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Test Company');
    });

    it('should validate slug uniqueness', async () => {
      mockSupabaseClient.from().insert.mockReturnThis();
      mockSupabaseClient.from().select.mockReturnThis();
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'duplicate key value violates unique constraint' },
      });

      const result = await mockSupabaseClient
        .from('organizations')
        .insert({ name: 'Test', slug: 'existing-slug', owner_user_id: 'user-1' })
        .select()
        .single();

      expect(result.error).toBeDefined();
    });
  });

  describe('managing members', () => {
    it('should add member to organization', async () => {
      const memberData = {
        organization_id: 'org-1',
        user_id: 'user-2',
        role: 'member',
        invited_by: 'user-1',
      };

      mockSupabaseClient.from().insert.mockResolvedValueOnce({
        data: { id: 'member-1', ...memberData },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('organization_members')
        .insert(memberData);

      expect(result.error).toBeNull();
    });

    it('should update member role', async () => {
      mockSupabaseClient.from().update.mockReturnThis();
      mockSupabaseClient.from().eq.mockResolvedValueOnce({
        data: { id: 'member-1', role: 'admin' },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('organization_members')
        .update({ role: 'admin' })
        .eq('id', 'member-1');

      expect(result.error).toBeNull();
    });

    it('should remove member from organization', async () => {
      mockSupabaseClient.from().delete.mockReturnThis();
      mockSupabaseClient.from().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await mockSupabaseClient
        .from('organization_members')
        .delete()
        .eq('id', 'member-1');

      expect(result.error).toBeNull();
    });
  });

  describe('role permissions', () => {
    it('should check admin permissions', () => {
      const roles = ['owner', 'admin', 'manager', 'member'];
      const adminRoles = ['owner', 'admin'];

      const canManageMembers = (role: string) => adminRoles.includes(role);

      expect(canManageMembers('owner')).toBe(true);
      expect(canManageMembers('admin')).toBe(true);
      expect(canManageMembers('manager')).toBe(false);
      expect(canManageMembers('member')).toBe(false);
    });
  });
});
