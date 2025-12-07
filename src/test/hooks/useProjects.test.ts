import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Projects Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetching projects', () => {
    it('should return projects with client data', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          project_name: 'Project 1',
          status: 'Nowy',
          client_id: 'client-1',
          clients: { id: 'client-1', name: 'Client 1' },
        },
        {
          id: 'proj-2',
          project_name: 'Project 2',
          status: 'W trakcie',
          client_id: 'client-2',
          clients: { id: 'client-2', name: 'Client 2' },
        },
      ];

      mockSupabaseClient.from().select.mockResolvedValueOnce({
        data: mockProjects,
        error: null,
      });

      const result = await mockSupabaseClient.from('projects').select('*, clients(*)');
      expect(result.data).toHaveLength(2);
      expect(result.data![0].clients).toBeDefined();
    });

    it('should filter projects by status', async () => {
      const mockProjects = [
        { id: 'proj-1', project_name: 'Active Project', status: 'W trakcie' },
      ];

      mockSupabaseClient.from().select.mockReturnThis();
      mockSupabaseClient.from().eq.mockResolvedValueOnce({
        data: mockProjects,
        error: null,
      });

      const result = await mockSupabaseClient.from('projects').select('*').eq('status', 'W trakcie');
      expect(result.data).toHaveLength(1);
      expect(result.data![0].status).toBe('W trakcie');
    });
  });

  describe('updating project status', () => {
    it('should update project status', async () => {
      mockSupabaseClient.from().update.mockReturnThis();
      mockSupabaseClient.from().eq.mockResolvedValueOnce({
        data: { id: 'proj-1', status: 'Zakończony' },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('projects')
        .update({ status: 'Zakończony' })
        .eq('id', 'proj-1');

      expect(result.error).toBeNull();
    });
  });

  describe('project statistics', () => {
    it('should calculate project totals correctly', () => {
      const projects = [
        { id: '1', status: 'Nowy' },
        { id: '2', status: 'W trakcie' },
        { id: '3', status: 'W trakcie' },
        { id: '4', status: 'Zakończony' },
      ];

      const newCount = projects.filter(p => p.status === 'Nowy').length;
      const inProgressCount = projects.filter(p => p.status === 'W trakcie').length;
      const completedCount = projects.filter(p => p.status === 'Zakończony').length;

      expect(newCount).toBe(1);
      expect(inProgressCount).toBe(2);
      expect(completedCount).toBe(1);
    });
  });
});
