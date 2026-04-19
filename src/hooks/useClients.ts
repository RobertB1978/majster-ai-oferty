import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  nip: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  created_at: string;
}

interface ClientsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'name_asc' | 'name_desc';
}

interface ClientsQueryResult {
  data: Client[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Query key factory for clients
 */
export const clientsKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsKeys.all, 'list'] as const,
  list: (params: ClientsQueryParams) => [...clientsKeys.lists(), params] as const,
  details: () => [...clientsKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientsKeys.details(), id] as const,
};

/**
 * Paginated clients query with search
 * Optimized: Only fetches necessary columns, supports server-side filtering
 */
export function useClientsPaginated(params: ClientsQueryParams = {}) {
  const { page = 1, pageSize = 20, search, sortBy = 'newest' } = params;
  const { user } = useAuth();

  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: async (): Promise<ClientsQueryResult> => {
      let query = supabase
        .from('clients')
        // Include address so list cards can display it (bug fix: was missing)
        .select('id, name, nip, email, phone, address, created_at', { count: 'exact' });

      // Server-side search filter (sanitize to prevent PostgREST filter injection)
      if (search?.trim()) {
        const s = search.replace(/[%_.,()]/g, '');
        if (s) {
          query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
        }
      }

      // Pagination using range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const sortField = (sortBy === 'name_asc' || sortBy === 'name_desc') ? 'name' : 'created_at';
      const ascending = sortBy === 'name_asc' || sortBy === 'oldest';

      const { data, error, count } = await query
        .order(sortField, { ascending })
        .range(from, to);

      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: (data as Client[]) || [],
        totalCount,
        totalPages,
        currentPage: page,
      };
    },
    enabled: !!user,
  });
}

/**
 * @deprecated Use useClientsPaginated instead for better performance
 * Kept for backward compatibility with Dashboard and other components
 */
export function useClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        // Optimized: removed SELECT * - only necessary columns
        .select('id, name, nip, email, phone, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });
}

export function useClient(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: clientsKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        // Detail view: fetch all columns including address
        .select('id, name, nip, phone, email, address, created_at')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Client | null;
    },
    enabled: !!user && !!id,
  });
}

export function useAddClient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, user_id: user!.id })
        .select('id, name, nip, email, phone, created_at')
        .single();

      if (error) throw error;
      return data as Client;
    },
    onMutate: async () => {
      // Cancel outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: clientsKeys.all });
    },
    onError: (err) => {
      toast.error(t('clients.toast.addError'));
      logger.error(err);
    },
    onSuccess: () => {
      toast.success(t('clients.toast.added'));
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync with server
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}

export function useUpdateClient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...client }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', id)
        .select('id, name, nip, email, phone, created_at')
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      // Invalidate all clients queries (both paginated and non-paginated)
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
      toast.success(t('clients.toast.updated'));
    },
    onError: (error) => {
      toast.error(t('clients.toast.updateError'));
      logger.error(error);
    },
  });
}

export function useDeleteClient() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async () => {
      // Cancel outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: clientsKeys.all });
    },
    onError: (err) => {
      toast.error(t('clients.toast.deleteError'));
      logger.error(err);
    },
    onSuccess: () => {
      toast.success(t('clients.toast.deleted'));
    },
    onSettled: () => {
      // Always refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}
