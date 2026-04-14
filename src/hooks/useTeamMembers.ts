import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TEAM_MEMBERS_TABLE } from '@/lib/storage';

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
      const { data, error } = await supabase
        .from(TEAM_MEMBERS_TABLE)
        .select('id, user_id, owner_user_id, name, phone, email, role, is_active, created_at')
        .eq('owner_user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!user,
  });
}

export function useAddTeamMember() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (member: Omit<TeamMember, 'id' | 'user_id' | 'owner_user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from(TEAM_MEMBERS_TABLE)
        .insert({
          ...member,
          user_id: user!.id,
          owner_user_id: user!.id,
        })
        .select('id, user_id, owner_user_id, name, phone, email, role, is_active, created_at')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
      toast.success(t('team.toast.added'), { id: 'team-member-added' });
    },
    onError: () => {
      toast.error(t('team.toast.addError'), { id: 'team-member-add-error' });
    },
  });
}

export function useUpdateTeamMember() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from(TEAM_MEMBERS_TABLE)
        .update(updates)
        .eq('id', id)
        .select('id, user_id, owner_user_id, name, phone, email, role, is_active, created_at')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
      toast.success(t('team.toast.updated'), { id: 'team-member-updated' });
    },
    onError: () => {
      toast.error(t('team.toast.updateError'), { id: 'team-member-update-error' });
    },
  });
}

export function useDeleteTeamMember() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TEAM_MEMBERS_TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] });
      toast.success(t('team.toast.deleted'), { id: 'team-member-deleted' });
    },
    onError: () => {
      toast.error(t('team.toast.deleteError'), { id: 'team-member-delete-error' });
    },
  });
}

export function useTeamLocations(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team_locations', projectId],
    queryFn: async () => {
      let query = supabase
        .from('team_locations')
        .select('id, team_member_id, project_id, user_id, latitude, longitude, status, recorded_at, team_members(name)')
        .eq('user_id', user!.id)
        .order('recorded_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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
        .select('id, team_member_id, project_id, user_id, latitude, longitude, status, recorded_at')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_locations'] });
    },
  });
}
