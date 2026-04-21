export type RetentionStatus = 'active' | 'inactive' | 'manual' | 'planned';

export type RetentionDeletionStrategy =
  | 'hard_delete'
  | 'soft_delete'
  | 'archive'
  | 'manual_review'
  | 'unknown';

export interface RetentionRule {
  id: string;
  data_domain: string;
  rule_name: string;
  applies_to: string;
  retention_period_days: number | null;
  deletion_strategy: RetentionDeletionStrategy;
  legal_basis_note: string | null;
  status: RetentionStatus;
  last_run_at: string | null;
  last_run_status: string | null;
  created_at: string;
  updated_at: string;
}
