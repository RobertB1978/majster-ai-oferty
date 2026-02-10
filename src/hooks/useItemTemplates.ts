import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ItemTemplate {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  default_qty: number;
  default_price: number;
  category: 'Materiał' | 'Robocizna';
  description: string;
  created_at: string;
}

interface ItemTemplatesQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: 'all' | 'Materiał' | 'Robocizna';
}

interface ItemTemplatesQueryResult {
  data: ItemTemplate[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Query key factory for item templates
 */
export const itemTemplatesKeys = {
  all: ['itemTemplates'] as const,
  lists: () => [...itemTemplatesKeys.all, 'list'] as const,
  list: (params: ItemTemplatesQueryParams) => [...itemTemplatesKeys.lists(), params] as const,
  details: () => [...itemTemplatesKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemTemplatesKeys.details(), id] as const,
};

/**
 * Paginated item templates query with search and filters
 * Optimized: Only fetches necessary columns, supports server-side filtering
 */
export function useItemTemplatesPaginated(params: ItemTemplatesQueryParams = {}) {
  const { page = 1, pageSize = 20, search, category } = params;
  const { user } = useAuth();

  return useQuery({
    queryKey: itemTemplatesKeys.list(params),
    queryFn: async (): Promise<ItemTemplatesQueryResult> => {
      let query = supabase
        .from('item_templates')
        // Only select columns needed for list view (not SELECT *)
        .select('id, name, unit, default_qty, default_price, category, description, created_at', { count: 'exact' });

      // Server-side search filter
      if (search?.trim()) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Server-side category filter
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      // Pagination using range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('name')
        .range(from, to);

      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: (data as ItemTemplate[]) || [],
        totalCount,
        totalPages,
        currentPage: page,
      };
    },
    enabled: !!user,
  });
}

/**
 * @deprecated Use useItemTemplatesPaginated instead for better performance
 * Kept for backward compatibility with import dialogs and other components
 */
export function useItemTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['item_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_templates')
        // Optimized: removed SELECT * - only necessary columns
        .select('id, name, unit, default_qty, default_price, category, description, created_at')
        .order('name');

      if (error) throw error;
      return data as ItemTemplate[];
    },
    enabled: !!user,
  });
}

export function useCreateItemTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: Omit<ItemTemplate, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('item_templates')
        .insert({
          ...template,
          user_id: user!.id,
        })
        .select('id, name, unit, default_qty, default_price, category, created_at')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all item templates queries (both paginated and non-paginated)
      queryClient.invalidateQueries({ queryKey: itemTemplatesKeys.all });
      toast.success('Szablon utworzony');
    },
    onError: () => {
      toast.error('Błąd przy tworzeniu szablonu');
    },
  });
}

export function useUpdateItemTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ItemTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('item_templates')
        .update(updates)
        .eq('id', id)
        .select('id, name, unit, default_qty, default_price, category, created_at')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all item templates queries (both paginated and non-paginated)
      queryClient.invalidateQueries({ queryKey: itemTemplatesKeys.all });
      toast.success('Szablon zaktualizowany');
    },
    onError: () => {
      toast.error('Błąd przy aktualizacji szablonu');
    },
  });
}

export function useDeleteItemTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('item_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all item templates queries (both paginated and non-paginated)
      queryClient.invalidateQueries({ queryKey: itemTemplatesKeys.all });
      toast.success('Szablon usunięty');
    },
    onError: () => {
      toast.error('Błąd przy usuwaniu szablonu');
    },
  });
}
