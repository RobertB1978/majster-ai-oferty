import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Client } from './useClients';

export type ProjectStatus = 'Nowy' | 'Wycena w toku' | 'Oferta wysłana' | 'Zaakceptowany';
export type ProjectPriority = 'low' | 'normal' | 'high';

export interface Project {
  id: string;
  user_id: string;
  client_id: string;
  project_name: string;
  status: ProjectStatus;
  priority?: ProjectPriority | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  clients?: Pick<Client, 'id' | 'name'>; // Only needed fields for list view
}

interface ProjectsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProjectStatus | 'all';
}

interface ProjectsQueryResult {
  data: Project[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Query key factory for projects
 */
export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: (params: ProjectsQueryParams) => [...projectsKeys.lists(), params] as const,
  details: () => [...projectsKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectsKeys.details(), id] as const,
};

/**
 * Paginated projects query with search and filters
 * Optimized: Only fetches necessary columns, supports server-side filtering
 */
export function useProjectsPaginated(params: ProjectsQueryParams = {}) {
  const { page = 1, pageSize = 20, search, status } = params;
  const { user } = useAuth();

  return useQuery({
    queryKey: projectsKeys.list(params),
    queryFn: async (): Promise<ProjectsQueryResult> => {
      let query = supabase
        .from('projects')
        // Only select columns needed for list view (not SELECT *)
        .select(
          'id, project_name, status, priority, created_at, client_id, clients(id, name)',
          { count: 'exact' }
        );

      // Server-side search filter
      if (search?.trim()) {
        query = query.or(`project_name.ilike.%${search}%,clients.name.ilike.%${search}%`);
      }

      // Server-side status filter
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Pagination using range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: (data as Project[]) || [],
        totalCount,
        totalPages,
        currentPage: page,
      };
    },
    enabled: !!user,
  });
}

/**
 * @deprecated Use useProjectsPaginated instead for better performance
 * Kept for backward compatibility with Dashboard and other components
 */
export function useProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        // Optimized: removed SELECT * - only necessary columns
        .select('id, project_name, status, priority, created_at, client_id, clients(id, name)')
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
    queryKey: projectsKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        // Detail view: fetch more columns than list view, but still selective
        .select('id, user_id, client_id, project_name, status, priority, start_date, end_date, created_at, clients(id, name, email, phone)')
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
        .select('id, project_name, status, priority, created_at, client_id, clients(id, name)')
        .single();

      if (error) throw error;
      return data as Project;
    },
    // Optimistic update for instant feedback
    onMutate: async (newProject) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectsKeys.all });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projects', user!.id]);

      // Get client name for optimistic update (if available in cache)
      const clientData = queryClient.getQueryData(['clients', user!.id]) as unknown[] | undefined;
      const client = clientData?.find(c => c.id === newProject.client_id);

      // Optimistically add new project
      queryClient.setQueryData(['projects', user!.id], (old: Project[] | undefined) => {
        if (!old) return old;

        const optimisticProject: Project = {
          id: `temp-${Date.now()}`,
          user_id: user!.id,
          client_id: newProject.client_id,
          project_name: newProject.project_name,
          status: newProject.status || 'Nowy',
          priority: null,
          created_at: new Date().toISOString(),
          clients: client ? { id: client.id, name: client.name } : undefined,
        };

        return [optimisticProject, ...old];
      });

      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', user!.id], context.previousProjects);
      }
      toast.error('Błąd przy tworzeniu projektu');
      console.error(err);
    },
    onSuccess: () => {
      toast.success('Projekt utworzony');
    },
    onSettled: () => {
      // Always refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
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
        .select('id, project_name, status, priority, created_at, client_id, clients(id, name)')
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      // Invalidate all projects queries (both paginated and non-paginated)
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    // Optimistic update for instant feedback
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectsKeys.all });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(['projects', user!.id]);

      // Optimistically remove the project
      queryClient.setQueryData(['projects', user!.id], (old: Project[] | undefined) => {
        if (!old) return old;
        return old.filter(project => project.id !== deletedId);
      });

      return { previousProjects };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', user!.id], context.previousProjects);
      }
      toast.error('Błąd przy usuwaniu projektu');
      console.error(err);
    },
    onSuccess: () => {
      toast.success('Projekt usunięty');
    },
    onSettled: () => {
      // Always refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
    },
  });
}
