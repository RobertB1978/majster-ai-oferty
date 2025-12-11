import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
}

interface ClientsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
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
  const { page = 1, pageSize = 20, search } = params;
  const { user } = useAuth();

  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: async (): Promise<ClientsQueryResult> => {
      let query = supabase
        .from('clients')
        // Only select columns needed for list view (not SELECT *)
        .select('id, name, email, phone, created_at', { count: 'exact' });

      // Server-side search filter
      if (search?.trim()) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
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
        .select('id, name, email, phone, created_at')
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
        .select('id, name, phone, email, address, created_at')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Client | null;
    },
    enabled: !!user && !!id,
  });
}

export function useAddClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, user_id: user!.id })
        .select('id, name, email, phone, created_at')
        .single();

      if (error) throw error;
      return data as Client;
    },
    // Optimistic update for instant feedback
    onMutate: async (newClient) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: clientsKeys.all });

      // Snapshot the previous value
      const previousClients = queryClient.getQueryData(['clients', user!.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(['clients', user!.id], (old: Client[] | undefined) => {
        if (!old) return old;

        // Add optimistic client at the beginning (newest first)
        const optimisticClient: Client = {
          id: `temp-${Date.now()}`, // Temporary ID
          user_id: user!.id,
          name: newClient.name,
          phone: newClient.phone || null,
          email: newClient.email || null,
          address: newClient.address || null,
          created_at: new Date().toISOString(),
        };

        return [optimisticClient, ...old];
      });

      // Return context object with the snapshot
      return { previousClients };
    },
    onError: (err, newClient, context) => {
      // Rollback to the previous value on error
      if (context?.previousClients) {
        queryClient.setQueryData(['clients', user!.id], context.previousClients);
      }
      toast.error('Błąd przy dodawaniu klienta');
      console.error(err);
    },
    onSuccess: () => {
      toast.success('Klient dodany');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync with server
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...client }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', id)
        .select('id, name, email, phone, created_at')
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      // Invalidate all clients queries (both paginated and non-paginated)
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
      toast.success('Klient zaktualizowany');
    },
    onError: (error) => {
      toast.error('Błąd przy aktualizacji klienta');
      console.error(error);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    // Optimistic update for instant feedback
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: clientsKeys.all });

      // Snapshot the previous value
      const previousClients = queryClient.getQueryData(['clients', user!.id]);

      // Optimistically remove the client
      queryClient.setQueryData(['clients', user!.id], (old: Client[] | undefined) => {
        if (!old) return old;
        return old.filter(client => client.id !== deletedId);
      });

      // Return context with the snapshot
      return { previousClients };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(['clients', user!.id], context.previousClients);
      }
      toast.error('Błąd przy usuwaniu klienta');
      console.error(err);
    },
    onSuccess: () => {
      toast.success('Klient usunięty');
    },
    onSettled: () => {
      // Always refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}
