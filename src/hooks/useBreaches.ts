import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { insertComplianceAuditEvent } from '@/lib/auditLog';
import {
  calcReportDeadline,
  type DataBreach,
  type DataBreachInsert,
  type DataBreachUpdate,
} from '@/types/breach';

const QUERY_KEY = 'admin-breaches';

export function useAdminBreaches() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<DataBreach[]> => {
      const { data, error } = await supabase
        .from('data_breaches')
        .select('*')
        .order('detected_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as DataBreach[];
    },
  });
}

export function useCreateBreach() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DataBreachInsert) => {
      const deadline = input.report_deadline_at ?? calcReportDeadline(input.detected_at);

      const { data, error } = await supabase
        .from('data_breaches')
        .insert({
          title: input.title,
          description: input.description,
          severity: input.severity,
          status: 'open',
          detected_at: input.detected_at,
          report_deadline_at: deadline,
          impact_summary: input.impact_summary ?? null,
          containment_actions: input.containment_actions ?? null,
          assigned_to: input.assigned_to ?? null,
          created_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await insertComplianceAuditEvent({
        event_type: 'breach.created',
        actor_user_id: user?.id ?? null,
        entity_type: 'data_breach',
        entity_id: data.id,
        metadata: { severity: input.severity, title: input.title },
        source: 'frontend',
      });

      return data as DataBreach;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateBreach() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, update }: { id: string; update: DataBreachUpdate }) => {
      const { data, error } = await supabase
        .from('data_breaches')
        .update(update)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const breach = data as DataBreach;

      if (update.status) {
        const eventType =
          update.status === 'closed' || update.status === 'false_positive'
            ? 'breach.closed'
            : 'breach.status_changed';

        await insertComplianceAuditEvent({
          event_type: eventType,
          actor_user_id: user?.id ?? null,
          entity_type: 'data_breach',
          entity_id: id,
          metadata: { new_status: update.status },
          source: 'frontend',
        });
      }

      if (update.reported_to_authority !== undefined) {
        await insertComplianceAuditEvent({
          event_type: 'breach.report_marked',
          actor_user_id: user?.id ?? null,
          entity_type: 'data_breach',
          entity_id: id,
          metadata: {
            reported_to_authority: update.reported_to_authority,
            reported_at: update.reported_at ?? null,
            authority_name: update.authority_name ?? null,
          },
          source: 'frontend',
        });
      }

      return breach;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
