/**
 * prefetch-routes — Dense Office Mode pre-fetch map (roadmap §12)
 *
 * Provides route → prefetch function mapping for 200ms hover pre-fetch.
 * Fires Supabase queries BEFORE navigation so the target page renders
 * from cache rather than loading from network.
 *
 * Only called in Dense Mode (desktop, §12: "pre-fetch przy hover, tylko Dense Mode").
 * RLS enforced server-side — userId is implicit in the Supabase JWT.
 */

import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { offersKeys } from '@/hooks/useOffers';
import { clientsKeys } from '@/hooks/useClients';
import { projectsV2Keys } from '@/hooks/useProjectsV2';

// Pre-fetch 20 most-recent offers (default sort = last_activity_at DESC)
async function prefetchOffers(queryClient: QueryClient): Promise<void> {
  const params = {};
  await queryClient.prefetchQuery({
    queryKey: offersKeys.list(params),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('id, user_id, client_id, status, title, total_net, total_gross, currency, sent_at, accepted_at, rejected_at, last_activity_at, created_at, updated_at, source_template_id')
        .order('last_activity_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

// Pre-fetch first page of clients (20 items)
async function prefetchClients(queryClient: QueryClient): Promise<void> {
  const params = { page: 1, pageSize: 20 };
  await queryClient.prefetchQuery({
    queryKey: clientsKeys.list(params),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, nip, email, phone, created_at', { count: 'exact' })
        .order('name', { ascending: true })
        .range(0, 19);
      if (error) throw error;
      return { data: data ?? [], totalCount: data?.length ?? 0, totalPages: 1, currentPage: 1 };
    },
    staleTime: 30_000,
  });
}

// Pre-fetch active projects (50 items, default page 0)
async function prefetchProjects(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: projectsV2Keys.list('ALL', '', 0, 50),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v2_projects')
        .select('id, user_id, client_id, source_offer_id, title, status, start_date, end_date, progress_percent, stages_json, created_at, updated_at')
        .order('created_at', { ascending: false })
        .range(0, 49);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

// Route → prefetch function map
const ROUTE_PREFETCH: Record<string, (qc: QueryClient) => Promise<void>> = {
  '/app/offers':    prefetchOffers,
  '/app/customers': prefetchClients,
  '/app/projects':  prefetchProjects,
};

/**
 * Trigger pre-fetch for a route if a prefetch function is registered.
 * Silently no-ops for routes without a registered prefetch.
 */
export function prefetchRouteData(queryClient: QueryClient, path: string): void {
  const fn = ROUTE_PREFETCH[path];
  if (fn) void fn(queryClient);
}
