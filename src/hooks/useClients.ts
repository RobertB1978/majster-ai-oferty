import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Client {
  id: string;
  user_id: string;
  type: 'person' | 'company';
  name: string;
  company_name: string | null;
  nip: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
        .select('id, type, name, company_name, nip, email, phone, created_at, updated_at', { count: 'exact' });

      // Server-side search filter
      if (search?.trim()) {
        query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,nip.ilike.%${search}%`);
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
        .select('id, type, name, company_name, nip, email, phone, created_at, updated_at')
        .order('updated_at', { ascending: false });

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
        // Detail view: fetch all columns
        .select('id, type, name, company_name, nip, phone, email, address, notes, created_at, updated_at')
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
    mutationFn: async (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, user_id: user!.id })
        .select('id, type, name, company_name, nip, email, phone, created_at, updated_at')
        .single();

      if (error) throw error;
      return data as Client;
    },
    onMutate: async () => {
      // Cancel outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: clientsKeys.all });
    },
    onError: (err) => {
      toast.error('Błąd przy dodawaniu klienta');
      logger.error(err);
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
        .select('id, type, name, company_name, nip, email, phone, created_at, updated_at')
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
      logger.error(error);
    },
  });
}

export function useDeleteClient() {
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
      toast.error('Błąd przy usuwaniu klienta');
      logger.error(err);
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
