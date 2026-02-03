import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

/**
 * Hook to check if the current user is an admin or owner in ANY organization.
 * This is used for admin panel access control.
 *
 * Returns:
 * - isOrgAdmin: true if user has 'admin' or 'owner' role in at least one organization
 * - organizations: list of organizations where user is admin/owner
 * - isLoading: loading state
 */
export function useOrganizationAdmin() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-org-admin-status', user?.id],
    queryFn: async () => {
      if (!user) return { isAdmin: false, organizations: [] };

      // Fetch organizations where user is admin or owner
      const { data: memberships, error } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organizations:organization_id (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin']);

      if (error) {
        logger.error('Error fetching org admin status:', error);
        return { isAdmin: false, organizations: [] };
      }

      const adminOrgs = memberships
        ?.filter(m => m.organizations)
        .map(m => ({
          id: m.organization_id,
          role: m.role,
          // @ts-expect-error - organizations is a joined object
          name: m.organizations.name,
          // @ts-expect-error - organizations is a joined object
          slug: m.organizations.slug,
        })) || [];

      return {
        isAdmin: adminOrgs.length > 0,
        organizations: adminOrgs,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    isOrgAdmin: data?.isAdmin || false,
    organizations: data?.organizations || [],
    isLoading,
  };
}

/**
 * Hook to check if the current user is an admin or owner in a SPECIFIC organization.
 *
 * @param organizationId - The organization ID to check
 * @returns isOrgAdmin, role, isLoading
 */
export function useOrganizationAdminForOrg(organizationId: string | null | undefined) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-org-admin-status', user?.id, organizationId],
    queryFn: async () => {
      if (!user || !organizationId) {
        return { isAdmin: false, role: null };
      }

      const { data: membership, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        // User is not a member of this org
        if (error.code === 'PGRST116') {
          return { isAdmin: false, role: null };
        }
        logger.error('Error fetching org membership:', error);
        return { isAdmin: false, role: null };
      }

      return {
        isAdmin: membership.role === 'owner' || membership.role === 'admin',
        role: membership.role as 'owner' | 'admin' | 'manager' | 'member',
      };
    },
    enabled: !!user && !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    isOrgAdmin: data?.isAdmin || false,
    role: data?.role || null,
    isLoading,
  };
}
