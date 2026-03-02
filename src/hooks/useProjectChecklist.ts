/**
 * useProjectChecklist — PR-15
 *
 * TanStack Query hooks for project_checklists table.
 * Supports minimal MVP templates: plumbing_basic, electrical_basic, painting_basic, general_basic.
 * Items stored as JSONB: {id, label_key, is_done}[]
 * RLS enforced server-side (user_id = auth.uid()).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChecklistTemplateKey =
  | 'plumbing_basic'
  | 'electrical_basic'
  | 'painting_basic'
  | 'general_basic';

export const CHECKLIST_TEMPLATES: ChecklistTemplateKey[] = [
  'plumbing_basic',
  'electrical_basic',
  'painting_basic',
  'general_basic',
];

export interface ChecklistItem {
  id: string;
  /** i18n key — resolved in component */
  label_key: string;
  is_done: boolean;
}

export interface ProjectChecklist {
  id: string;
  user_id: string;
  project_id: string;
  template_key: ChecklistTemplateKey;
  items_json: ChecklistItem[];
  updated_at: string;
  created_at: string;
}

// ── Default items per template ────────────────────────────────────────────────

/**
 * Default checklist items per template.
 * label_key maps to i18n: checklist.templates.<template>.<key>
 */
export const TEMPLATE_DEFAULTS: Record<ChecklistTemplateKey, ChecklistItem[]> = {
  general_basic: [
    { id: 'gen_01', label_key: 'checklist.templates.general_basic.site_clean',          is_done: false },
    { id: 'gen_02', label_key: 'checklist.templates.general_basic.materials_removed',    is_done: false },
    { id: 'gen_03', label_key: 'checklist.templates.general_basic.surfaces_inspected',   is_done: false },
    { id: 'gen_04', label_key: 'checklist.templates.general_basic.client_walkthrough',   is_done: false },
    { id: 'gen_05', label_key: 'checklist.templates.general_basic.defects_noted',        is_done: false },
    { id: 'gen_06', label_key: 'checklist.templates.general_basic.photos_taken',         is_done: false },
  ],
  plumbing_basic: [
    { id: 'plm_01', label_key: 'checklist.templates.plumbing_basic.no_leaks',            is_done: false },
    { id: 'plm_02', label_key: 'checklist.templates.plumbing_basic.water_pressure',      is_done: false },
    { id: 'plm_03', label_key: 'checklist.templates.plumbing_basic.drains_flow',         is_done: false },
    { id: 'plm_04', label_key: 'checklist.templates.plumbing_basic.seals_checked',       is_done: false },
    { id: 'plm_05', label_key: 'checklist.templates.plumbing_basic.hot_cold_labels',     is_done: false },
    { id: 'plm_06', label_key: 'checklist.templates.plumbing_basic.shutoffs_accessible', is_done: false },
    { id: 'plm_07', label_key: 'checklist.templates.plumbing_basic.site_clean',          is_done: false },
  ],
  electrical_basic: [
    { id: 'elc_01', label_key: 'checklist.templates.electrical_basic.breakers_labeled',  is_done: false },
    { id: 'elc_02', label_key: 'checklist.templates.electrical_basic.outlets_tested',    is_done: false },
    { id: 'elc_03', label_key: 'checklist.templates.electrical_basic.gfci_ok',           is_done: false },
    { id: 'elc_04', label_key: 'checklist.templates.electrical_basic.lights_work',       is_done: false },
    { id: 'elc_05', label_key: 'checklist.templates.electrical_basic.no_exposed_wires',  is_done: false },
    { id: 'elc_06', label_key: 'checklist.templates.electrical_basic.panels_closed',     is_done: false },
    { id: 'elc_07', label_key: 'checklist.templates.electrical_basic.site_clean',        is_done: false },
  ],
  painting_basic: [
    { id: 'pnt_01', label_key: 'checklist.templates.painting_basic.coverage_even',       is_done: false },
    { id: 'pnt_02', label_key: 'checklist.templates.painting_basic.no_drips',            is_done: false },
    { id: 'pnt_03', label_key: 'checklist.templates.painting_basic.trim_clean',          is_done: false },
    { id: 'pnt_04', label_key: 'checklist.templates.painting_basic.color_match',         is_done: false },
    { id: 'pnt_05', label_key: 'checklist.templates.painting_basic.tape_removed',        is_done: false },
    { id: 'pnt_06', label_key: 'checklist.templates.painting_basic.furniture_restored',  is_done: false },
    { id: 'pnt_07', label_key: 'checklist.templates.painting_basic.site_clean',          is_done: false },
  ],
};

// ── Query keys ────────────────────────────────────────────────────────────────

export const checklistKeys = {
  all: ['project_checklists'] as const,
  byProject: (projectId: string) =>
    [...checklistKeys.all, 'project', projectId] as const,
};

// ── useProjectChecklist ───────────────────────────────────────────────────────

export function useProjectChecklist(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: checklistKeys.byProject(projectId ?? ''),
    queryFn: async (): Promise<ProjectChecklist | null> => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from('project_checklists')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data as ProjectChecklist | null;
    },
    enabled: !!user && !!projectId,
    staleTime: 30_000,
  });
}

// ── useUpsertProjectChecklist ─────────────────────────────────────────────────

export function useUpsertProjectChecklist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      templateKey,
      items,
    }: {
      projectId: string;
      templateKey: ChecklistTemplateKey;
      items: ChecklistItem[];
    }): Promise<ProjectChecklist> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_checklists')
        .upsert(
          {
            user_id: user.id,
            project_id: projectId,
            template_key: templateKey,
            items_json: items,
          },
          { onConflict: 'project_id,template_key' }
        )
        .select('*')
        .single();

      if (error) throw error;
      return data as ProjectChecklist;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: checklistKeys.byProject(projectId) });
    },
  });
}
