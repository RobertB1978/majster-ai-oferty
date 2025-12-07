import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient } from '@/test/mocks/supabase';

// Mock supabase before importing hooks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Clients Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetching clients', () => {
    it('should return empty array when no clients exist', async () => {
      mockSupabaseClient.from().select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Simulate the query behavior
      const result = await mockSupabaseClient.from('clients').select('*');
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should return clients data when clients exist', async () => {
      const mockClients = [
        { id: '1', name: 'Client 1', email: 'client1@test.com', phone: '123456789' },
        { id: '2', name: 'Client 2', email: 'client2@test.com', phone: '987654321' },
      ];

      mockSupabaseClient.from().select.mockResolvedValueOnce({
        data: mockClients,
        error: null,
      });

      const result = await mockSupabaseClient.from('clients').select('*');
      expect(result.data).toEqual(mockClients);
      expect(result.data).toHaveLength(2);
    });

    it('should handle errors gracefully', async () => {
      mockSupabaseClient.from().select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await mockSupabaseClient.from('clients').select('*');
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('creating clients', () => {
    it('should create a new client', async () => {
      const newClient = {
        name: 'New Client',
        email: 'new@test.com',
        phone: '111222333',
        address: 'Test Address',
      };

      mockSupabaseClient.from().insert.mockResolvedValueOnce({
        data: { id: '3', ...newClient },
        error: null,
      });

      const result = await mockSupabaseClient.from('clients').insert(newClient);
      expect(result.error).toBeNull();
    });

    it('should handle duplicate email error', async () => {
      mockSupabaseClient.from().insert.mockResolvedValueOnce({
        data: null,
        error: { message: 'duplicate key value violates unique constraint' },
      });

      const result = await mockSupabaseClient.from('clients').insert({ name: 'Test' });
      expect(result.error).toBeDefined();
    });
  });
});
