import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ApiKey {
  id: string;
  user_id: string;
  key_name: string;
  api_key: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export function useApiKeys() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['api_keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!user,
  });
}

export function useCreateApiKey() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ keyName, permissions }: { keyName: string; permissions: string[] }) => {
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user!.id,
          key_name: keyName,
          permissions,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ApiKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
      toast.success(t('apiKeys.toast.created'));
    },
    onError: () => {
      toast.error(t('apiKeys.toast.createError'));
    },
  });
}

export function useUpdateApiKey() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ApiKey> & { id: string }) => {
      const { data, error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
      toast.success(t('apiKeys.toast.updated'));
    },
  });
}

export function useDeleteApiKey() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
      toast.success(t('apiKeys.toast.deleted'));
    },
  });
}
