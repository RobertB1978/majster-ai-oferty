import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Client } from './useClients';

export type ProjectStatus = 'Nowy' | 'Wycena w toku' | 'Oferta wysłana' | 'Zaakceptowany';

export interface Project {
  id: string;
  user_id: string;
  client_id: string;
  project_name: string;
  status: ProjectStatus;
  created_at: string;
  clients?: Client;
}

export function useProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });
}

export function useProject(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Project | null;
    },
    enabled: !!user && !!id,
  });
}

export function useAddProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (project: { project_name: string; client_id: string; status?: ProjectStatus }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({ 
          ...project, 
          user_id: user!.id,
          status: project.status || 'Nowy'
        })
        .select('*, clients(*)')
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projekt utworzony');
    },
    onError: (error) => {
      toast.error('Błąd przy tworzeniu projektu');
      console.error(error);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...project }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(project)
        .eq('id', id)
        .select('*, clients(*)')
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projekt zaktualizowany');
    },
    onError: (error) => {
      toast.error('Błąd przy aktualizacji projektu');
      console.error(error);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projekt usunięty');
    },
    onError: (error) => {
      toast.error('Błąd przy usuwaniu projektu');
      console.error(error);
    },
  });
}
