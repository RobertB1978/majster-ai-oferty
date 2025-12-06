import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AuditAction = 
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_change'
  | 'user.profile_update'
  | 'user.consent_update'
  | 'user.data_export'
  | 'user.data_delete_request'
  | 'client.create'
  | 'client.update'
  | 'client.delete'
  | 'project.create'
  | 'project.update'
  | 'project.delete'
  | 'quote.create'
  | 'quote.update'
  | 'quote.version_create'
  | 'pdf.generate'
  | 'pdf.download'
  | 'offer.send'
  | 'offer.approve'
  | 'offer.reject'
  | 'team.member_add'
  | 'team.member_remove'
  | 'team.role_change'
  | 'api.key_create'
  | 'api.key_revoke'
  | 'subscription.change'
  | 'settings.update'
  | 'document.upload'
  | 'document.delete';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

// Store audit logs in notifications table with special type for now
// In production, this would be a dedicated audit_logs table
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
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      metadata?: Record<string, any>;
    }) => {
      if (!user) return;

      // Log to console for debugging
      console.log('[AUDIT]', {
        action,
        entityType,
        entityId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      // Store as a notification with audit type
      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        title: `Audit: ${action}`,
        message: JSON.stringify({
          action,
          entityType,
          entityId,
          oldValues,
          newValues,
          metadata,
          userAgent: navigator.userAgent,
        }),
        type: 'info',
        is_read: true, // Don't show in notification center
      });

      if (error) {
        console.error('[AUDIT] Error logging event:', error);
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
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .like('title', 'Audit:%')
        .order('created_at', { ascending: false })
        .limit(options?.limit || 100);

      const { data, error } = await query;

      if (error) throw error;

      // Parse audit logs from notifications
      return data.map((n: any) => {
        const parsed = JSON.parse(n.message);
        return {
          id: n.id,
          user_id: n.user_id,
          action: parsed.action,
          entity_type: parsed.entityType,
          entity_id: parsed.entityId,
          old_values: parsed.oldValues,
          new_values: parsed.newValues,
          metadata: parsed.metadata,
          user_agent: parsed.userAgent,
          created_at: n.created_at,
        } as AuditLogEntry;
      }).filter((log: AuditLogEntry) => {
        if (options?.action && log.action !== options.action) return false;
        if (options?.entityType && log.entity_type !== options.entityType) return false;
        return true;
      });
    },
    enabled: !!user,
  });
}
