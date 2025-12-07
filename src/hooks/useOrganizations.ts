import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_user_id: string;
  settings: Record<string, unknown>;
  plan_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string;
}

export function useOrganizations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Organization[];
    },
    enabled: !!user,
  });
}

export function useOrganizationMembers(organizationId: string | null) {
  return useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as OrganizationMember[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Add owner as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
          accepted_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organizacja została utworzona');
    },
    onError: (error) => {
      console.error('Create organization error:', error);
      toast.error('Błąd podczas tworzenia organizacji');
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      organizationId: string; 
      userId: string; 
      role: 'admin' | 'manager' | 'member' 
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: data.organizationId,
          user_id: data.userId,
          role: data.role,
          invited_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', variables.organizationId] });
      toast.success('Zaproszenie zostało wysłane');
    },
    onError: (error) => {
      console.error('Invite member error:', error);
      toast.error('Błąd podczas zapraszania członka');
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { memberId: string; organizationId: string }) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', data.memberId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', variables.organizationId] });
      toast.success('Członek został usunięty');
    },
    onError: (error) => {
      console.error('Remove member error:', error);
      toast.error('Błąd podczas usuwania członka');
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      memberId: string; 
      organizationId: string; 
      role: 'admin' | 'manager' | 'member' 
    }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: data.role })
        .eq('id', data.memberId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', variables.organizationId] });
      toast.success('Rola została zaktualizowana');
    },
    onError: (error) => {
      console.error('Update role error:', error);
      toast.error('Błąd podczas aktualizacji roli');
    },
  });
}
