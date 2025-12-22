import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

export interface DashboardProject {
  id: string;
  project_name: string;
  status: string;
  priority: string | null;
  created_at: string;
  client_id: string | null;
  clients: {
    id: string;
    name: string;
  } | null;
}

export interface DashboardStats {
  // Project counts
  totalProjects: number;
  newCount: number;
  inProgressCount: number;
  sentCount: number;
  acceptedCount: number;
  recentWeekCount: number;

  // Recent projects (top 5)
  recentProjects: DashboardProject[];

  // Client count
  totalClients: number;

  // Loading states
  isLoading: boolean;
}

/**
 * Dashboard Statistics Hook
 * Optimized: Server-side aggregations and selective queries
 * Cache: 5 minutes (dashboard should be relatively fresh)
 */
export function useDashboardStats() {
  const { user } = useAuth();

  // Fetch project stats (count-only queries)
  const { data: projectStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-project-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Fetch only status and created_at for aggregations
      const { data: projects, error } = await supabase
        .from('projects')
        .select('status, created_at')
        .eq('user_id', user.id);

      if (error) throw error;

      const allProjects = projects || [];
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      return {
        totalProjects: allProjects.length,
        newCount: allProjects.filter(p => p.status === 'Nowy').length,
        inProgressCount: allProjects.filter(p => p.status === 'Wycena w toku').length,
        sentCount: allProjects.filter(p => p.status === 'Oferta wysłana').length,
        acceptedCount: allProjects.filter(p => p.status === 'Zaakceptowany').length,
        recentWeekCount: allProjects.filter(p => new Date(p.created_at) > oneWeekAgo).length,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Fetch top 5 recent projects with client info
  const { data: recentProjects, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard-recent-projects', user?.id],
    queryFn: async (): Promise<DashboardProject[]> => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name, status, priority, created_at, client_id, clients(id, name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data as DashboardProject[]) || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Fetch client count
  const { data: clientCount, isLoading: clientsLoading } = useQuery({
    queryKey: ['dashboard-clients-count', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { count, error } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const isLoading = statsLoading || recentLoading || clientsLoading;

  return {
    totalProjects: projectStats?.totalProjects || 0,
    newCount: projectStats?.newCount || 0,
    inProgressCount: projectStats?.inProgressCount || 0,
    sentCount: projectStats?.sentCount || 0,
    acceptedCount: projectStats?.acceptedCount || 0,
    recentWeekCount: projectStats?.recentWeekCount || 0,
    recentProjects: recentProjects || [],
    totalClients: clientCount || 0,
    isLoading,
  };
}

/**
 * @deprecated Use useDashboardStats for better performance
 * This is kept for backward compatibility with components that still use the old hooks
 */
export function useLegacyDashboard() {
  // This function exists only for backward compatibility
  // Components should migrate to useDashboardStats
  console.warn('useLegacyDashboard is deprecated. Please use useDashboardStats instead.');
  return useDashboardStats();
}
