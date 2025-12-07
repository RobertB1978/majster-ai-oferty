import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'moderator' | 'user';

export function useAdminRole() {
  const { user } = useAuth();

  const { data: roles, isLoading, refetch } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }

      return data?.map(r => r.role as AppRole) || [];
    },
    enabled: !!user,
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
