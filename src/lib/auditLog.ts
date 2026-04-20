import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { ComplianceAuditLogInsert } from '@/types/audit';

/**
 * Inserts a single compliance audit event into the append-only
 * compliance_audit_log table. Never throws — errors are logged
 * and returned so callers can decide whether to surface them.
 */
export async function insertComplianceAuditEvent(
  entry: ComplianceAuditLogInsert
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('compliance_audit_log').insert({
    event_type: entry.event_type,
    actor_user_id: entry.actor_user_id ?? null,
    target_user_id: entry.target_user_id ?? null,
    entity_type: entry.entity_type ?? null,
    entity_id: entry.entity_id ?? null,
    metadata: entry.metadata ?? {},
    source: entry.source,
  });

  if (error) {
    logger.error('[COMPLIANCE_AUDIT] Insert failed:', error);
    return { error: new Error(error.message) };
  }

  return { error: null };
}
