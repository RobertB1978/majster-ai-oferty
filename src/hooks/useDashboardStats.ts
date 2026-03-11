import { logger } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Represents a single project row as surfaced on the dashboard.
 *
 * Source of truth: v2_projects (PR-13).
 *   - `title`  — v2_projects uses this field (legacy `projects` used `project_name`)
 *   - `status` — v2 enum: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
 */
export interface DashboardProject {
  id: string;
  title: string;
  status: string;
  created_at: string;
  client_id: string | null;
  clients: {
    id: string;
    name: string;
  } | null;
}

export interface DashboardStats {
  // Project counts (from v2_projects)
  totalProjects: number;
  /** ON_HOLD projects */
  newCount: number;
  /** ACTIVE projects */
  inProgressCount: number;
  /**
   * Legacy offer-pipeline concept ('Oferta wysłana').
   * v2_projects has no equivalent state — always 0.
   * Retained in the interface so callers need no changes.
   */
  sentCount: number;
  /** COMPLETED projects */
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
 *
 * Data source: v2_projects (aligned with the Projects page — PR-13).
 * Status mapping:
 *   ACTIVE    → inProgressCount
 *   COMPLETED → acceptedCount
 *   ON_HOLD   → newCount
 *   (no v2 equivalent for legacy 'Oferta wysłana') → sentCount = 0
 *
 * RLS on v2_projects enforces user isolation — no explicit user_id filter needed.
 *
 * Cache: 5 minutes (dashboard should be relatively fresh)
 */
export function useDashboardStats() {
  const { user } = useAuth();

  // Fetch project stats (count-only queries)
  const { data: projectStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-project-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // v2_projects — RLS enforces user isolation
      const { data: projects, error } = await supabase
        .from('v2_projects')
        .select('status, created_at');

      if (error) throw error;

      const allProjects = projects || [];
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      return {
        totalProjects: allProjects.length,
        // ON_HOLD  → projects paused / awaiting action
        newCount: allProjects.filter(p => p.status === 'ON_HOLD').length,
        // ACTIVE   → projects currently in progress
        inProgressCount: allProjects.filter(p => p.status === 'ACTIVE').length,
        // v2_projects has no 'sent' state (legacy offer-pipeline concept)
        sentCount: 0,
        // COMPLETED → finished projects
        acceptedCount: allProjects.filter(p => p.status === 'COMPLETED').length,
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

      // v2_projects — RLS enforces user isolation
      const { data, error } = await supabase
        .from('v2_projects')
        .select('id, title, status, created_at, client_id, clients(id, name)')
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
  logger.warn('useLegacyDashboard is deprecated. Please use useDashboardStats instead.');
  return useDashboardStats();
}
