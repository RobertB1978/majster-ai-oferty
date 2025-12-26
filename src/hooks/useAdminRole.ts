import { logger } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'moderator' | 'user';

export function useAdminRole() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: roles, isLoading, refetch } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching roles:', error);
        return [];
      }

      return data?.map(r => r.role as AppRole) || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
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
    refetch,
  };
}
