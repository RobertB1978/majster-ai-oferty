import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { insertComplianceAuditEvent } from '@/lib/auditLog';
import { logger } from '@/lib/logger';
import type { DsarRequest, DsarRequestType, DsarStatus, DsarRequestUpdate } from '@/types/dsar';

const QUERY_KEY = 'dsar-requests';

// ── User: create own DSAR request ────────────────────────────────────────────

export function useCreateDsarRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestType,
      description,
    }: {
      requestType: DsarRequestType;
      description?: string;
    }): Promise<DsarRequest> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('dsar_requests')
        .insert({
          requester_user_id: user.id,
          request_type: requestType,
          description: description ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      await insertComplianceAuditEvent({
        event_type: 'dsar.request_created',
        actor_user_id: user.id,
        target_user_id: user.id,
        entity_type: 'dsar_request',
        entity_id: data.id,
        metadata: { request_type: requestType },
        source: 'frontend',
      });

      return data as DsarRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error) => {
      logger.error('[DSAR] Create request failed:', error);
    },
  });
}

// ── User: read own requests ───────────────────────────────────────────────────

export function useUserDsarRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEY, 'own', user?.id],
    queryFn: async (): Promise<DsarRequest[]> => {
      const { data, error } = await supabase
        .from('dsar_requests')
        .select('*')
        .eq('requester_user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as DsarRequest[];
    },
    enabled: !!user,
  });
}

// ── Admin: read all requests ──────────────────────────────────────────────────

export function useAdminDsarRequests(statusFilter?: DsarStatus) {
  return useQuery({
    queryKey: [QUERY_KEY, 'admin', statusFilter],
    queryFn: async (): Promise<DsarRequest[]> => {
      let query = supabase
        .from('dsar_requests')
        .select('*')
        .order('due_at', { ascending: true });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DsarRequest[];
    },
  });
}

// ── Admin: update request status ──────────────────────────────────────────────

export function useUpdateDsarRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      update,
      previousStatus,
    }: {
      id: string;
      update: DsarRequestUpdate;
      previousStatus: DsarStatus;
    }): Promise<DsarRequest> => {
      if (!user) throw new Error('Not authenticated');

      const payload: DsarRequestUpdate & { resolved_at?: string | null } = { ...update };

      if (update.status === 'resolved' || update.status === 'rejected') {
        payload.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('dsar_requests')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const newStatus = update.status ?? previousStatus;

      const eventType =
        newStatus === 'resolved'
          ? 'dsar.resolved'
          : newStatus === 'rejected'
          ? 'dsar.rejected'
          : 'dsar.status_changed';

      await insertComplianceAuditEvent({
        event_type: eventType,
        actor_user_id: user.id,
        target_user_id: (data as DsarRequest).requester_user_id,
        entity_type: 'dsar_request',
        entity_id: id,
        metadata: {
          previous_status: previousStatus,
          new_status: newStatus,
          resolution_note: update.resolution_note ?? null,
        },
        source: 'frontend',
      });

      return data as DsarRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error) => {
      logger.error('[DSAR] Update request failed:', error);
    },
  });
}
