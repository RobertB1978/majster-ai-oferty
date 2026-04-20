import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { insertComplianceAuditEvent } from '@/lib/auditLog';
import type { ComplianceEventType, ComplianceAuditLogEntry } from '@/types/audit';

export type AuditAction = ComplianceEventType;

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useLogAuditEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata,
    }: {
      action: AuditAction;
      entityType: string;
      entityId?: string;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) return;

      logger.log('[AUDIT]', {
        action,
        entityType,
        entityId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      const { error } = await insertComplianceAuditEvent({
        event_type: action,
        actor_user_id: user.id,
        entity_type: entityType,
        entity_id: entityId ?? null,
        metadata: {
          oldValues,
          newValues,
          ...metadata,
          userAgent: navigator.userAgent,
        },
        source: 'frontend',
      });

      if (error) {
        logger.error('[AUDIT] Error logging event:', error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

export function useAuditLogs(options?: {
  action?: AuditAction;
  entityType?: string;
  limit?: number;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['audit-logs', options],
    queryFn: async () => {
      let query = supabase
        .from('compliance_audit_log')
        .select('id, actor_user_id, event_type, entity_type, entity_id, metadata, created_at')
        .eq('actor_user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(options?.limit ?? 100);

      if (options?.action) {
        query = query.eq('event_type', options.action);
      }
      if (options?.entityType) {
        query = query.eq('entity_type', options.entityType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data as ComplianceAuditLogEntry[]).map((row) => ({
        id: row.id,
        user_id: row.actor_user_id ?? '',
        action: row.event_type,
        entity_type: row.entity_type ?? '',
        entity_id: row.entity_id,
        old_values: (row.metadata as Record<string, unknown>)?.oldValues as Record<string, unknown> | null ?? null,
        new_values: (row.metadata as Record<string, unknown>)?.newValues as Record<string, unknown> | null ?? null,
        ip_address: null,
        user_agent: (row.metadata as Record<string, unknown>)?.userAgent as string | null ?? null,
        metadata: row.metadata,
        created_at: row.created_at,
      } as AuditLogEntry));
    },
    enabled: !!user,
  });
}
