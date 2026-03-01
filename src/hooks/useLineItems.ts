import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import i18n from '@/i18n';

export type LineItemType = 'labor' | 'material' | 'service' | 'travel' | 'lump_sum';

export interface LineItem {
  id: string;
  user_id: string;
  category: string | null;
  name: string;
  description: string | null;
  unit: string;
  unit_price_net: number;
  vat_rate: number | null;
  item_type: LineItemType;
  favorite: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface LineItemsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  item_type?: 'all' | LineItemType;
}

interface LineItemsQueryResult {
  data: LineItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const lineItemsKeys = {
  all: ['line_items'] as const,
  lists: () => [...lineItemsKeys.all, 'list'] as const,
  list: (params: LineItemsQueryParams) => [...lineItemsKeys.lists(), params] as const,
  detail: (id: string) => [...lineItemsKeys.all, 'detail', id] as const,
};

/**
 * Paginated line items query with server-side search and filtering
 */
export function useLineItemsPaginated(params: LineItemsQueryParams = {}) {
  const { page = 1, pageSize = 20, search, item_type } = params;
  const { user } = useAuth();

  return useQuery({
    queryKey: lineItemsKeys.list(params),
    queryFn: async (): Promise<LineItemsQueryResult> => {
      let query = supabase
        .from('line_items')
        .select('id, category, name, description, unit, unit_price_net, vat_rate, item_type, favorite, created_at, updated_at', { count: 'exact' });

      if (search?.trim()) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
      }

      if (item_type && item_type !== 'all') {
        query = query.eq('item_type', item_type);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('favorite', { ascending: false })
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: (data as LineItem[]) || [],
        totalCount,
        totalPages,
        currentPage: page,
      };
    },
    enabled: !!user,
  });
}

export function useCreateLineItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: Omit<LineItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_used_at'>) => {
      const { data, error } = await supabase
        .from('line_items')
        .insert({ ...item, user_id: user!.id })
        .select('id, category, name, description, unit, unit_price_net, vat_rate, item_type, favorite, created_at, updated_at')
        .single();

      if (error) throw error;
      return data as LineItem;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: lineItemsKeys.all });
    },
    onError: (err) => {
      toast.error(i18n.t('priceLibrary.errorCreate'));
      logger.error(err);
    },
    onSuccess: () => {
      toast.success(i18n.t('priceLibrary.successCreate'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: lineItemsKeys.all });
    },
  });
}

export function useUpdateLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...item }: Partial<LineItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('line_items')
        .update(item)
        .eq('id', id)
        .select('id, category, name, description, unit, unit_price_net, vat_rate, item_type, favorite, created_at, updated_at')
        .single();

      if (error) throw error;
      return data as LineItem;
    },
    onError: (err) => {
      toast.error(i18n.t('priceLibrary.errorUpdate'));
      logger.error(err);
    },
    onSuccess: () => {
      toast.success(i18n.t('priceLibrary.successUpdate'));
      queryClient.invalidateQueries({ queryKey: lineItemsKeys.all });
    },
  });
}

export function useDeleteLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('line_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: lineItemsKeys.all });
    },
    onError: (err) => {
      toast.error(i18n.t('priceLibrary.errorDelete'));
      logger.error(err);
    },
    onSuccess: () => {
      toast.success(i18n.t('priceLibrary.successDelete'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: lineItemsKeys.all });
    },
  });
}

export function useToggleLineItemFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      const { error } = await supabase
        .from('line_items')
        .update({ favorite })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lineItemsKeys.all });
    },
    onError: (err) => {
      logger.error(err);
    },
  });
}
