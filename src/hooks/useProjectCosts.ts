/**
 * useProjectCosts — PR-14
 *
 * TanStack Query hooks for the project_costs table.
 * RLS enforced server-side (user_id = auth.uid()).
 *
 * Exports:
 *  - useProjectCosts      — list costs for a project
 *  - useAddProjectCost    — add a single cost entry
 *  - useDeleteProjectCost — delete a cost entry
 *  - useUpdateProjectBudget — update budget_net + budget_source on v2_projects
 *  - sumCosts             — pure helper: sum amount_net
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { projectsV2Keys } from '@/hooks/useProjectsV2';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CostType = 'MATERIAL' | 'LABOR' | 'TRAVEL' | 'OTHER';

export interface ProjectCost {
  id: string;
  user_id: string;
  project_id: string;
  cost_type: CostType;
  amount_net: number;
  note: string | null;
  incurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface AddCostInput {
  project_id: string;
  cost_type: CostType;
  amount_net: number;
  note?: string | null;
  incurred_at?: string | null;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const projectCostsKeys = {
  all: ['project_costs'] as const,
  list: (projectId: string) => [...projectCostsKeys.all, 'list', projectId] as const,
};

// ── Pure helper ───────────────────────────────────────────────────────────────

export function sumCosts(costs: ProjectCost[]): number {
  return costs.reduce((acc, c) => acc + Number(c.amount_net), 0);
}

// ── List ──────────────────────────────────────────────────────────────────────

export function useProjectCosts(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: projectCostsKeys.list(projectId ?? ''),
    queryFn: async (): Promise<ProjectCost[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_costs')
        .select('id, user_id, project_id, cost_type, amount_net, note, incurred_at, created_at, updated_at')
        .eq('project_id', projectId)
        .order('incurred_at', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as ProjectCost[]) ?? [];
    },
    enabled: !!user && !!projectId,
    staleTime: 15_000,
  });
}

// ── Add ───────────────────────────────────────────────────────────────────────

export function useAddProjectCost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddCostInput): Promise<ProjectCost> => {
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('project_costs')
        .insert({
          user_id: user.id,
          project_id: input.project_id,
          cost_type: input.cost_type,
          amount_net: input.amount_net,
          note: input.note ?? null,
          incurred_at: input.incurred_at ?? today,
        })
        .select('id, user_id, project_id, cost_type, amount_net, note, incurred_at, created_at, updated_at')
        .single();

      if (error) throw error;
      return data as ProjectCost;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectCostsKeys.list(data.project_id) });
    },
  });
}

// ── Delete ────────────────────────────────────────────────────────────────────

export function useDeleteProjectCost(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (costId: string): Promise<void> => {
      const { error } = await supabase
        .from('project_costs')
        .delete()
        .eq('id', costId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectCostsKeys.list(projectId) });
    },
  });
}

// ── Update budget ─────────────────────────────────────────────────────────────

export interface UpdateBudgetInput {
  projectId: string;
  budgetNet: number | null;
}

export function useUpdateProjectBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, budgetNet }: UpdateBudgetInput): Promise<void> => {
      const { error } = await supabase
        .from('v2_projects')
        .update({
          budget_net: budgetNet,
          budget_source: 'MANUAL',
          budget_updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectsV2Keys.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: projectsV2Keys.all });
    },
  });
}
