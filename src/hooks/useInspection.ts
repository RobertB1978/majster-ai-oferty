/**
 * useInspection — PR-18
 *
 * CRUD for project_inspections + project_inspections_with_status view.
 * Also handles auto-upsert of project_reminders (T-30, T-7 days before due_date).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type InspectionType =
  | 'ANNUAL_BUILDING'
  | 'FIVE_YEAR_BUILDING'
  | 'FIVE_YEAR_ELECTRICAL'
  | 'ANNUAL_GAS_CHIMNEY'
  | 'LARGE_AREA_SEMIANNUAL'
  | 'OTHER';

export type InspectionStatus = 'PLANNED' | 'DONE' | 'OVERDUE';

export interface ProjectInspection {
  id: string;
  user_id: string;
  project_id: string | null;
  inspection_type: InspectionType;
  object_address: string | null;
  due_date: string;                   // ISO date
  completed_at: string | null;        // ISO timestamptz
  status: InspectionStatus;           // from view (computed)
  protocol_pdf_path: string | null;
  reminder_30_sent_at: string | null;
  reminder_7_sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionFormData {
  inspection_type: InspectionType;
  object_address: string;
  due_date: string;
  notes: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const INSPECTION_TYPE_LABELS: Record<InspectionType, string> = {
  ANNUAL_BUILDING: 'inspection.types.annualBuilding',
  FIVE_YEAR_BUILDING: 'inspection.types.fiveYearBuilding',
  FIVE_YEAR_ELECTRICAL: 'inspection.types.fiveYearElectrical',
  ANNUAL_GAS_CHIMNEY: 'inspection.types.annualGasChimney',
  LARGE_AREA_SEMIANNUAL: 'inspection.types.largeAreaSemiannual',
  OTHER: 'inspection.types.other',
};

export const ALL_INSPECTION_TYPES: InspectionType[] = [
  'ANNUAL_BUILDING',
  'FIVE_YEAR_BUILDING',
  'FIVE_YEAR_ELECTRICAL',
  'ANNUAL_GAS_CHIMNEY',
  'LARGE_AREA_SEMIANNUAL',
  'OTHER',
];

/** Compute next due date based on inspection type (from today). */
export function calcNextDueDate(type: InspectionType): string {
  const d = new Date();
  switch (type) {
    case 'ANNUAL_BUILDING':
    case 'ANNUAL_GAS_CHIMNEY':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'FIVE_YEAR_BUILDING':
    case 'FIVE_YEAR_ELECTRICAL':
      d.setFullYear(d.getFullYear() + 5);
      break;
    case 'LARGE_AREA_SEMIANNUAL':
      d.setMonth(d.getMonth() + 6);
      break;
    default:
      d.setFullYear(d.getFullYear() + 1);
  }
  return d.toISOString().slice(0, 10);
}

/** Create reminder upsert payloads for T-30 and T-7 before due_date. */
function buildReminderPayloads(
  userId: string,
  inspectionId: string,
  dueDateStr: string,
  labelT30: string,
  labelT7: string,
) {
  const due = new Date(dueDateStr);

  const t30 = new Date(due);
  t30.setDate(t30.getDate() - 30);
  t30.setHours(9, 0, 0, 0);

  const t7 = new Date(due);
  t7.setDate(t7.getDate() - 7);
  t7.setHours(9, 0, 0, 0);

  return [
    {
      user_id: userId,
      entity_type: 'INSPECTION' as const,
      entity_id: inspectionId,
      remind_at: t30.toISOString(),
      channel: 'IN_APP' as const,
      status: 'PENDING' as const,
      label: labelT30,
    },
    {
      user_id: userId,
      entity_type: 'INSPECTION' as const,
      entity_id: inspectionId,
      remind_at: t7.toISOString(),
      channel: 'IN_APP' as const,
      status: 'PENDING' as const,
      label: labelT7,
    },
  ];
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Fetch all inspections for a project (or all user inspections if projectId omitted). */
export function useProjectInspections(projectId?: string) {
  return useQuery<ProjectInspection[]>({
    queryKey: ['inspections', projectId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('project_inspections_with_status')
        .select('id, user_id, project_id, inspection_type, object_address, due_date, completed_at, status, protocol_pdf_path, reminder_30_sent_at, reminder_7_sent_at, notes, created_at, updated_at')
        .order('due_date', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) {
        logger.error('useProjectInspections fetch error', error);
        throw error;
      }
      return (data ?? []) as ProjectInspection[];
    },
  });
}

/** Create a new inspection and auto-create T-30, T-7 reminders. */
export function useCreateInspection(projectId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (form: InspectionFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert inspection
      const { data, error } = await supabase
        .from('project_inspections')
        .insert({
          user_id: user.id,
          project_id: projectId ?? null,
          inspection_type: form.inspection_type,
          object_address: form.object_address || null,
          due_date: form.due_date,
          notes: form.notes || null,
          status: 'PLANNED',
        })
        .select()
        .single();

      if (error) {
        logger.error('useCreateInspection error', error);
        throw error;
      }

      // Auto-create reminders (T-30, T-7) — ignore errors so save always succeeds
      try {
        // Labels stored in DB as keys — translated on display in RemindersPanel
        const labelT30 = `inspection.reminder.t30:${form.due_date}`;
        const labelT7 = `inspection.reminder.t7:${form.due_date}`;
        const reminders = buildReminderPayloads(user.id, data.id, form.due_date, labelT30, labelT7);

        const { error: reminderErr } = await supabase
          .from('project_reminders')
          .upsert(reminders, { onConflict: 'entity_id,remind_at', ignoreDuplicates: true });

        if (reminderErr) {
          logger.error('useCreateInspection reminders error', reminderErr);
        }
      } catch (e) {
        logger.error('useCreateInspection reminders unexpected', e);
      }

      return data as ProjectInspection;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['inspections'] });
      void qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

/** Update an existing inspection. */
export function useUpdateInspection(projectId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      form,
    }: {
      id: string;
      form: Partial<InspectionFormData>;
    }) => {
      const { error } = await supabase
        .from('project_inspections')
        .update({
          ...(form.inspection_type && { inspection_type: form.inspection_type }),
          ...(form.object_address !== undefined && { object_address: form.object_address || null }),
          ...(form.due_date && { due_date: form.due_date }),
          ...(form.notes !== undefined && { notes: form.notes || null }),
        })
        .eq('id', id);

      if (error) {
        logger.error('useUpdateInspection error', error);
        throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['inspections', projectId ?? 'all'] });
    },
  });
}

/** Mark inspection as DONE. */
export function useMarkInspectionDone(projectId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (inspectionId: string) => {
      const { error } = await supabase
        .from('project_inspections')
        .update({
          completed_at: new Date().toISOString(),
          status: 'DONE',
        })
        .eq('id', inspectionId);

      if (error) {
        logger.error('useMarkInspectionDone error', error);
        throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['inspections', projectId ?? 'all'] });
      void qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

/** Delete an inspection (+ reminders cascade via FK — set up in table). */
export function useDeleteInspection(projectId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (inspectionId: string) => {
      // Delete related reminders first (no FK cascade in reminders table)
      await supabase
        .from('project_reminders')
        .delete()
        .eq('entity_type', 'INSPECTION')
        .eq('entity_id', inspectionId);

      const { error } = await supabase
        .from('project_inspections')
        .delete()
        .eq('id', inspectionId);

      if (error) {
        logger.error('useDeleteInspection error', error);
        throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['inspections', projectId ?? 'all'] });
      void qc.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

/** Mark inspection protocol PDF path. */
export function useMarkInspectionPdfPath(projectId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inspectionId,
      pdfPath,
    }: {
      inspectionId: string;
      pdfPath: string;
    }) => {
      const { error } = await supabase
        .from('project_inspections')
        .update({ protocol_pdf_path: pdfPath })
        .eq('id', inspectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['inspections', projectId ?? 'all'] });
    },
  });
}
