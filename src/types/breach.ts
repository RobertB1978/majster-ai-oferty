export type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';

export type BreachStatus =
  | 'open'
  | 'assessment'
  | 'contained'
  | 'reported'
  | 'closed'
  | 'false_positive';

export interface DataBreach {
  id: string;
  title: string;
  description: string;
  severity: BreachSeverity;
  status: BreachStatus;
  detected_at: string;
  report_deadline_at: string;
  reported_to_authority: boolean | null;
  reported_at: string | null;
  authority_name: string | null;
  impact_summary: string | null;
  containment_actions: string | null;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataBreachInsert {
  title: string;
  description: string;
  severity: BreachSeverity;
  detected_at: string;
  /** Defaults to detected_at + 72h if not provided */
  report_deadline_at?: string;
  impact_summary?: string | null;
  containment_actions?: string | null;
  assigned_to?: string | null;
}

export interface DataBreachUpdate {
  title?: string;
  description?: string;
  severity?: BreachSeverity;
  status?: BreachStatus;
  detected_at?: string;
  report_deadline_at?: string;
  reported_to_authority?: boolean | null;
  reported_at?: string | null;
  authority_name?: string | null;
  impact_summary?: string | null;
  containment_actions?: string | null;
  assigned_to?: string | null;
}

/** Returns report_deadline_at as detected_at + 72 hours (ISO string) */
export function calcReportDeadline(detectedAt: string): string {
  return new Date(new Date(detectedAt).getTime() + 72 * 60 * 60 * 1000).toISOString();
}

/** Returns remaining hours until deadline (negative = overdue) */
export function deadlineHoursRemaining(deadlineAt: string): number {
  return (new Date(deadlineAt).getTime() - Date.now()) / (60 * 60 * 1000);
}
