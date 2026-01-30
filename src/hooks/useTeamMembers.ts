import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamMember {
  id: string;
  user_id: string;
  owner_user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface TeamLocation {
  id: string;
  team_member_id: string;
  project_id: string | null;
  user_id: string;
  latitude: number;
  longitude: number;
  status: 'idle' | 'traveling' | 'working' | 'break';
  recorded_at: string;
}

export function useTeamMembers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team_members'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('owner_user_id', user!.id)
          .order('created_at', { ascending: false });

        if (error) {
          // Table might not exist or RLS blocks access - return empty array
          console.warn('Could not fetch team members:', error.message);
          return [] as TeamMember[];
        }
        return data as TeamMember[];
      } catch (err) {
        // Network error or other issue - return empty array instead of crashing
        console.error('Error fetching team members:', err);
        return [] as TeamMember[];
      }
    },
    enabled: !!user,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (member: Omit<TeamMember, 'id' | 'user_id' | 'owner_user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          ...member,
          user_id: user!.id,
          owner_user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
      toast.success('Pracownik dodany');
    },
    onError: () => {
      toast.error('Błąd podczas dodawania pracownika');
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
      toast.success('Pracownik zaktualizowany');
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
      toast.success('Pracownik usunięty');
    },
  });
}

export function useTeamLocations(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team_locations', projectId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('team_locations')
          .select('*, team_members(*)')
          .eq('user_id', user!.id)
          .order('recorded_at', { ascending: false });

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query.limit(100);
        if (error) {
          // Table might not exist or RLS blocks access - return empty array
          console.warn('Could not fetch team locations:', error.message);
          return [];
        }
        return data;
      } catch (err) {
        // Network error or other issue - return empty array instead of crashing
        console.error('Error fetching team locations:', err);
        return [];
      }
    },
    enabled: !!user,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useRecordLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ teamMemberId, projectId, latitude, longitude, status }: {
      teamMemberId: string;
      projectId?: string;
      latitude: number;
      longitude: number;
      status: TeamLocation['status'];
    }) => {
      const { data, error } = await supabase
        .from('team_locations')
        .insert({
          team_member_id: teamMemberId,
          project_id: projectId,
          user_id: user!.id,
          latitude,
          longitude,
          status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_locations'] });
    },
  });
}
