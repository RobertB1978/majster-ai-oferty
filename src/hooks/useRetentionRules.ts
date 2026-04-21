import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { RetentionRule } from '@/types/retention';

const QUERY_KEY = 'retention-rules';

export function useRetentionRules() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<RetentionRule[]> => {
      const { data, error } = await supabase
        .from('retention_rules')
        .select('*')
        .order('data_domain', { ascending: true })
        .order('rule_name', { ascending: true });

      if (error) {
        logger.error('[RetentionRules] Failed to fetch:', error);
        throw error;
      }

      return (data ?? []) as RetentionRule[];
    },
  });
}
