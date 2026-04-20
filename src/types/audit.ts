export type ComplianceEventType =
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
  | 'document.delete'
  | 'dsar.request_created'
  | 'dsar.status_changed'
  | 'dsar.resolved'
  | 'dsar.rejected';

export type ComplianceAuditSource = 'frontend' | 'edge_function' | 'migration' | 'admin';

export interface ComplianceAuditLogEntry {
  id: string;
  event_type: ComplianceEventType;
  actor_user_id: string | null;
  target_user_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  source: ComplianceAuditSource;
  created_at: string;
}

export interface ComplianceAuditLogInsert {
  event_type: ComplianceEventType;
  actor_user_id?: string | null;
  target_user_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
  source: ComplianceAuditSource;
}
