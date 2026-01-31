import { logger } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'moderator' | 'user';

export function useAdminRole() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: roles, isLoading, refetch, isError, error } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (error) {
          // Table might not exist or RLS policy blocks access - return safe default
          logger.warn('Unable to fetch roles:', error.message);
          return [];
        }

        return data?.map(r => r.role as AppRole) || [];
      } catch (err) {
        // Network error or other issue - return safe default instead of crashing
        logger.error('Error fetching user roles:', err instanceof Error ? err.message : 'Unknown error');
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1, // Only retry once to avoid excessive queries
    refetchOnWindowFocus: false, // Prevent constant refetches
  });

  const isAdmin = roles?.includes('admin') || false;
  const isModerator = roles?.includes('moderator') || isAdmin;
  const hasAnyRole = (roles?.length || 0) > 0;

  return {
    roles: roles || [],
    isAdmin,
    isModerator,
    hasAnyRole,
    isLoading,
    isError: isError || false,
    error: error?.message || null,
    refetch,
  };
}
