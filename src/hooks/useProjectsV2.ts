/**
 * useProjectsV2 — PR-13
 *
 * TanStack Query hooks for the v2_projects table.
 * RLS enforced server-side (user_id = auth.uid()).
 *
 * Exports:
 *  - useProjectsV2List    — list with status filter + search
 *  - useProjectV2         — single project by id
 *  - useCreateProjectV2   — create project (optionally from offer)
 *  - useUpdateProjectV2   — update title/status/progress/stages/dates
 *  - useProjectPublicToken — fetch/create QR token for a project
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

export interface ProjectStage {
  name: string;
  due_date: string | null;
  is_done: boolean;
  sort_order: number;
}

export interface ProjectV2 {
  id: string;
  user_id: string;
  client_id: string | null;
  source_offer_id: string | null;
  title: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  progress_percent: number;
  stages_json: ProjectStage[];
  total_from_offer: number | null;
  // PR-14: Burn Bar budget fields
  budget_net: number | null;
  budget_source: 'OFFER_NET' | 'MANUAL' | null;
  budget_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectPublicToken {
  id: string;
  user_id: string;
  project_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface CreateProjectInput {
  title: string;
  client_id?: string | null;
  source_offer_id?: string | null;
  total_from_offer?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  // PR-14: optional budget override (default: total_from_offer)
  budget_net?: number | null;
  budget_source?: 'OFFER_NET' | 'MANUAL' | null;
  // Sprint D2: optional starter stages from project template
  stages_json?: ProjectStage[];
}

export interface UpdateProjectInput {
  id: string;
  title?: string;
  status?: ProjectStatus;
  progress_percent?: number;
  stages_json?: ProjectStage[];
  start_date?: string | null;
  end_date?: string | null;
  // PR-14: budget fields
  budget_net?: number | null;
  budget_source?: 'OFFER_NET' | 'MANUAL' | null;
  budget_updated_at?: string | null;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const projectsV2Keys = {
  all: ['v2_projects'] as const,
  list: (status?: ProjectStatus | 'ALL', search?: string, page?: number, pageSize?: number) =>
    [...projectsV2Keys.all, 'list', status, search, page, pageSize] as const,
  detail: (id: string) => [...projectsV2Keys.all, 'detail', id] as const,
  token: (projectId: string) => [...projectsV2Keys.all, 'token', projectId] as const,
  bySourceOffer: (offerId: string) => [...projectsV2Keys.all, 'bySourceOffer', offerId] as const,
  bySourceOfferBatch: (sortedIds: string[]) =>
    [...projectsV2Keys.all, 'bySourceOfferBatch', sortedIds] as const,
};

// ── List ──────────────────────────────────────────────────────────────────────

export function useProjectsV2List(status: ProjectStatus | 'ALL' = 'ALL', search = '', page = 0, pageSize = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: projectsV2Keys.list(status, search, page, pageSize),
    queryFn: async (): Promise<ProjectV2[]> => {
      let query = supabase
        .from('v2_projects')
        .select('id, user_id, client_id, source_offer_id, title, status, start_date, end_date, progress_percent, stages_json, total_from_offer, budget_net, budget_source, budget_updated_at, created_at, updated_at')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (status !== 'ALL') {
        query = query.eq('status', status);
      }
      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as ProjectV2[]) ?? [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

// ── Single ────────────────────────────────────────────────────────────────────

export function useProjectV2(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: projectsV2Keys.detail(id ?? ''),
    queryFn: async (): Promise<ProjectV2 | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('v2_projects')
        .select('id, user_id, client_id, source_offer_id, title, status, start_date, end_date, progress_percent, stages_json, total_from_offer, budget_net, budget_source, budget_updated_at, created_at, updated_at')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as ProjectV2 | null;
    },
    enabled: !!user && !!id,
    staleTime: 30_000,
  });
}

// ── Find existing project by source offer (duplicate prevention) ─────────────

const PROJECT_SELECT = 'id, user_id, client_id, source_offer_id, title, status, start_date, end_date, progress_percent, stages_json, total_from_offer, budget_net, budget_source, budget_updated_at, created_at, updated_at' as const;

/**
 * Check if a non-cancelled project already exists for the given offer.
 * Returns the existing project or null.
 * Used to prevent duplicate project creation from the same accepted offer.
 */
export async function findProjectBySourceOffer(sourceOfferId: string): Promise<ProjectV2 | null> {
  const { data, error } = await supabase
    .from('v2_projects')
    .select(PROJECT_SELECT)
    .eq('source_offer_id', sourceOfferId)
    .neq('status', 'CANCELLED')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ProjectV2 | null;
}

// ── React Query hook: find existing project by source offer ───────────────────

/**
 * Eagerly fetches an existing non-cancelled project for the given offer.
 * Used in AcceptanceLinkPanel to show "Open project" vs "Create project"
 * without requiring a click to discover the existing project.
 */
export function useProjectBySourceOffer(sourceOfferId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: projectsV2Keys.bySourceOffer(sourceOfferId ?? ''),
    queryFn: async (): Promise<ProjectV2 | null> => {
      if (!sourceOfferId) return null;
      return findProjectBySourceOffer(sourceOfferId);
    },
    enabled: !!user && !!sourceOfferId,
    staleTime: 30_000,
  });
}

// ── Batch: find projects for multiple source offers in one query ──────────────

/** Minimal project shape returned by the batch lookup for each accepted offer row. */
export interface OfferProjectLookup {
  id: string;
  status: ProjectStatus;
}

/**
 * Batch-fetches existing non-cancelled projects for a set of accepted offer IDs.
 * Issues a single .in() query instead of one query per row, eliminating the
 * N+1 lookup that occurs when rendering a list of accepted offers.
 *
 * Returns a Map<offerId, OfferProjectLookup> for O(1) lookups inside OfferRow.
 * Includes project status so rows can render the project-status badge without
 * an extra per-row query.
 * Invalidated automatically when useCreateProjectV2 / useDeleteProjectV2
 * succeed (both invalidate projectsV2Keys.all which is a prefix of this key).
 */
export function useProjectsBySourceOffers(offerIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: projectsV2Keys.bySourceOfferBatch([...offerIds].sort()),
    queryFn: async (): Promise<Map<string, OfferProjectLookup>> => {
      if (offerIds.length === 0) return new Map();
      const { data, error } = await supabase
        .from('v2_projects')
        .select('id, source_offer_id, status')
        .in('source_offer_id', offerIds)
        .neq('status', 'CANCELLED');
      if (error) throw error;
      return new Map(
        (data ?? [])
          .filter(
            (p): p is { id: string; source_offer_id: string; status: ProjectStatus } =>
              p.source_offer_id !== null,
          )
          .map((p) => [p.source_offer_id, { id: p.id, status: p.status }]),
      );
    },
    enabled: !!user && offerIds.length > 0,
    staleTime: 30_000,
  });
}

// ── Create ────────────────────────────────────────────────────────────────────

export function useCreateProjectV2() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput): Promise<ProjectV2> => {
      if (!user) throw new Error('Not authenticated');

      // PR-14: budget defaults from offer net total
      const budgetNet = input.budget_net ?? input.total_from_offer ?? null;
      const budgetSource = budgetNet != null
        ? (input.budget_source ?? (input.total_from_offer != null ? 'OFFER_NET' : 'MANUAL'))
        : null;

      const { data, error } = await supabase
        .from('v2_projects')
        .insert({
          user_id: user.id,
          title: input.title,
          client_id: input.client_id ?? null,
          source_offer_id: input.source_offer_id ?? null,
          total_from_offer: input.total_from_offer ?? null,
          start_date: input.start_date ?? null,
          end_date: input.end_date ?? null,
          status: 'ACTIVE',
          progress_percent: 0,
          stages_json: input.stages_json ?? [],
          budget_net: budgetNet,
          budget_source: budgetSource,
          budget_updated_at: budgetNet != null ? new Date().toISOString() : null,
        })
        .select('id, user_id, client_id, source_offer_id, title, status, start_date, end_date, progress_percent, stages_json, total_from_offer, budget_net, budget_source, budget_updated_at, created_at, updated_at')
        .single();

      if (error) {
        // Race condition guard: DB unique constraint violation (PostgreSQL 23505).
        // Occurs when two concurrent requests both pass the app-level
        // findProjectBySourceOffer() check and both attempt INSERT.
        // The partial unique index uq_v2_projects_active_source_offer rejects
        // the second INSERT — we recover by returning the already-created project.
        if (error.code === '23505' && input.source_offer_id) {
          const existing = await findProjectBySourceOffer(input.source_offer_id);
          if (existing) return existing;
        }
        throw error;
      }
      return data as ProjectV2;
    },
    onSuccess: (data) => {
      // Eagerly populate the bySourceOffer cache so that OfferRow immediately
      // shows "Open project" when navigating back to the offers list after
      // project creation — prevents a stale-null flash of "Create project".
      if (data.source_offer_id) {
        queryClient.setQueryData(
          projectsV2Keys.bySourceOffer(data.source_offer_id),
          data,
        );
      }
      queryClient.invalidateQueries({ queryKey: projectsV2Keys.all });
    },
  });
}

// ── Update ────────────────────────────────────────────────────────────────────

export function useUpdateProjectV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProjectInput): Promise<ProjectV2> => {
      const { id, ...fields } = input;
      const { data, error } = await supabase
        .from('v2_projects')
        .update(fields)
        .eq('id', id)
        .select('id, user_id, client_id, source_offer_id, title, status, start_date, end_date, progress_percent, stages_json, total_from_offer, budget_net, budget_source, budget_updated_at, created_at, updated_at')
        .single();

      if (error) throw error;
      return data as ProjectV2;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectsV2Keys.all });
      queryClient.invalidateQueries({ queryKey: projectsV2Keys.detail(data.id) });
    },
  });
}

// ── Delete (soft-delete via CANCELLED status) ────────────────────────────────

export function useDeleteProjectV2() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('v2_projects')
        .update({ status: 'CANCELLED' as ProjectStatus })
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsV2Keys.all });
    },
  });
}

// ── Public token ──────────────────────────────────────────────────────────────

export function useProjectPublicToken(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: projectsV2Keys.token(projectId ?? ''),
    queryFn: async (): Promise<ProjectPublicToken | null> => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('project_public_status_tokens')
        .select('id, user_id, project_id, token, expires_at, created_at')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data as ProjectPublicToken | null;
    },
    enabled: !!user && !!projectId,
    staleTime: 60_000,
  });
}

export function useCreateProjectPublicToken(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ProjectPublicToken> => {
      if (!user) throw new Error('Not authenticated');

      // Upsert: delete old token if exists, then create new
      await supabase
        .from('project_public_status_tokens')
        .delete()
        .eq('project_id', projectId);

      const { data, error } = await supabase
        .from('project_public_status_tokens')
        .insert({
          user_id: user.id,
          project_id: projectId,
        })
        .select('id, user_id, project_id, token, expires_at, created_at')
        .single();

      if (error) throw error;
      return data as ProjectPublicToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsV2Keys.token(projectId) });
    },
  });
}

// ── Project source-offer IDs (for offers-list filter) ────────────────────────

/**
 * Returns the set of offer IDs that already have at least one non-cancelled project.
 * Used by the offers list to power the "with project / without project" filter
 * without issuing a per-row query.
 *
 * @param enabled — set false when the filter is not active to avoid unnecessary fetches.
 */
export function useProjectSourceOfferIds(enabled: boolean) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...projectsV2Keys.all, 'sourceOfferIds'] as const,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('v2_projects')
        .select('source_offer_id')
        .neq('status', 'CANCELLED')
        .not('source_offer_id', 'is', null);
      if (error) throw error;
      return new Set((data ?? []).map((p) => p.source_offer_id as string));
    },
    enabled: !!user && enabled,
    staleTime: 30_000,
  });
}

/** Build the public QR status URL from a token */
export function buildProjectStatusUrl(token: string): string {
  return `${window.location.origin}/p/${token}`;
}

/** Days until token expires (negative if expired) */
export function daysUntilTokenExpiry(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
