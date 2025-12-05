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

export function useItemTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['item_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_templates')
        .select('*')
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
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item_templates'] });
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
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item_templates'] });
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
      queryClient.invalidateQueries({ queryKey: ['item_templates'] });
      toast.success('Szablon usunięty');
    },
    onError: () => {
      toast.error('Błąd przy usuwaniu szablonu');
    },
  });
}
