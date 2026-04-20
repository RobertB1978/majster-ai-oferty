import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Subprocessor } from '@/types/subprocessors';

const SUBPROCESSORS_COLUMNS = 'id, slug, name, category, purpose, data_categories, location, transfer_basis, dpa_url, privacy_url, display_order' as const;

export function usePublicSubprocessors() {
  return useQuery<Subprocessor[]>({
    queryKey: ['public-subprocessors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subprocessors')
        .select(SUBPROCESSORS_COLUMNS)
        .eq('status', 'active')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Subprocessor[];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
