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
  list: (status?: ProjectStatus | 'ALL', search?: string) =>
    [...projectsV2Keys.all, 'list', status, search] as const,
  detail: (id: string) => [...projectsV2Keys.all, 'detail', id] as const,
  token: (projectId: string) => [...projectsV2Keys.all, 'token', projectId] as const,
};

// ── List ──────────────────────────────────────────────────────────────────────

export function useProjectsV2List(status: ProjectStatus | 'ALL' = 'ALL', search = '') {
  const { user } = useAuth();

  return useQuery({
    queryKey: projectsV2Keys.list(status, search),
    queryFn: async (): Promise<ProjectV2[]> => {
      let query = supabase
        .from('v2_projects')
        .select('id, user_id, client_id, source_offer_id, title, status, start_date, end_date, progress_percent, stages_json, total_from_offer, budget_net, budget_source, budget_updated_at, created_at, updated_at')
        .order('created_at', { ascending: false });

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
        .single();
      if (error) throw error;
      return data as ProjectV2;
    },
    enabled: !!user && !!id,
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
          stages_json: [],
          budget_net: budgetNet,
          budget_source: budgetSource,
          budget_updated_at: budgetNet != null ? new Date().toISOString() : null,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as ProjectV2;
    },
    onSuccess: () => {
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
        .select('*')
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
        .select('*')
        .single();

      if (error) throw error;
      return data as ProjectPublicToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsV2Keys.token(projectId) });
    },
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
