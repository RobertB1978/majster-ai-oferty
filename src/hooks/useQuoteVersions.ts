import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { toast } from 'sonner';
import { QuotePosition } from './useQuotes';
import { Json } from '@/integrations/supabase/types';

export interface QuoteSnapshot {
  positions: QuotePosition[];
  summary_materials: number;
  summary_labor: number;
  margin_percent: number;
  total: number;
}

export interface QuoteVersion {
  id: string;
  project_id: string;
  user_id: string;
  version_name: string;
  quote_snapshot: QuoteSnapshot;
  is_active: boolean;
  created_at: string;
}

export function useQuoteVersions(projectId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quote_versions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(v => ({
        ...v,
        quote_snapshot: v.quote_snapshot as unknown as QuoteSnapshot,
      })) as QuoteVersion[];
    },
    enabled: !!user && !!projectId,
  });
}

export function useActiveQuoteVersion(projectId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quote_versions', projectId, 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        quote_snapshot: data.quote_snapshot as unknown as QuoteSnapshot,
      } as QuoteVersion;
    },
    enabled: !!user && !!projectId,
  });
}

export function useCreateQuoteVersion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      versionName, 
      snapshot,
      setActive = false 
    }: { 
      projectId: string; 
      versionName: string; 
      snapshot: QuoteSnapshot;
      setActive?: boolean;
    }) => {
      // If setting as active, first deactivate all other versions
      if (setActive) {
        await supabase
          .from('quote_versions')
          .update({ is_active: false })
          .eq('project_id', projectId);
      }

      const { data, error } = await supabase
        .from('quote_versions')
        .insert({
          project_id: projectId,
          user_id: user!.id,
          version_name: versionName,
          quote_snapshot: snapshot as unknown as Json,
          is_active: setActive,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote_versions', variables.projectId] });
      toast.success('Wersja wyceny zapisana');
    },
    onError: () => {
      toast.error('Błąd przy zapisywaniu wersji');
    },
  });
}

export function useSetActiveVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, versionId }: { projectId: string; versionId: string }) => {
      // Deactivate all versions
      await supabase
        .from('quote_versions')
        .update({ is_active: false })
        .eq('project_id', projectId);

      // Activate selected version
      const { error } = await supabase
        .from('quote_versions')
        .update({ is_active: true })
        .eq('id', versionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote_versions', variables.projectId] });
      toast.success('Wersja ustawiona jako aktywna');
    },
    onError: () => {
      toast.error('Błąd przy zmianie aktywnej wersji');
    },
  });
}

export function useDeleteQuoteVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, versionId }: { projectId: string; versionId: string }) => {
      const { error } = await supabase
        .from('quote_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote_versions', variables.projectId] });
      toast.success('Wersja usunięta');
    },
    onError: () => {
      toast.error('Błąd przy usuwaniu wersji');
    },
  });
}
