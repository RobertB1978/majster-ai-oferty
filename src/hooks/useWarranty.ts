/**
 * useWarranty — PR-18
 *
 * CRUD for project_warranties_with_end view + warranty end-date helper.
 * One warranty per project (UNIQUE constraint in DB).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectWarranty {
  id: string;
  user_id: string;
  project_id: string;
  client_email: string | null;
  client_name: string | null;
  contact_phone: string | null;
  warranty_months: number;
  start_date: string;    // ISO date
  end_date: string;      // ISO date (computed by view)
  scope_of_work: string | null;
  exclusions: string | null;
  pdf_storage_path: string | null;
  reminder_30_sent_at: string | null;
  reminder_7_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarrantyFormData {
  client_email: string;
  client_name: string;
  contact_phone: string;
  warranty_months: number;
  start_date: string;
  scope_of_work: string;
  exclusions: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function calcEndDate(startDate: string, months: number): Date {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function daysUntilExpiry(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useWarranty(projectId: string | undefined) {
  return useQuery<ProjectWarranty | null>({
    queryKey: ['warranty', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_warranties_with_end')
        .select('id, user_id, project_id, client_email, client_name, contact_phone, warranty_months, start_date, end_date, scope_of_work, exclusions, pdf_storage_path, reminder_30_sent_at, reminder_7_sent_at, created_at, updated_at')
        .eq('project_id', projectId!)
        .maybeSingle();

      if (error) {
        logger.error('useWarranty fetch error', error);
        throw error;
      }
      return (data as ProjectWarranty | null);
    },
  });
}

export function useUpsertWarranty(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (form: WarrantyFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // upsert on project_id (unique constraint)
      const { data, error } = await supabase
        .from('project_warranties')
        .upsert(
          {
            user_id: user.id,
            project_id: projectId,
            client_email: form.client_email || null,
            client_name: form.client_name || null,
            contact_phone: form.contact_phone || null,
            warranty_months: form.warranty_months,
            start_date: form.start_date,
            scope_of_work: form.scope_of_work || null,
            exclusions: form.exclusions || null,
          },
          { onConflict: 'project_id' }
        )
        .select()
        .single();

      if (error) {
        logger.error('useUpsertWarranty error', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['warranty', projectId] });
    },
  });
}

export function useDeleteWarranty(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (warrantyId: string) => {
      const { error } = await supabase
        .from('project_warranties')
        .delete()
        .eq('id', warrantyId);

      if (error) {
        logger.error('useDeleteWarranty error', error);
        throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['warranty', projectId] });
    },
  });
}

export function useMarkWarrantyPdfPath(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ warrantyId, pdfPath }: { warrantyId: string; pdfPath: string }) => {
      const { error } = await supabase
        .from('project_warranties')
        .update({ pdf_storage_path: pdfPath })
        .eq('id', warrantyId);

      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['warranty', projectId] });
    },
  });
}
