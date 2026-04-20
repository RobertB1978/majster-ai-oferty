export type DsarRequestType =
  | 'access'
  | 'deletion'
  | 'rectification'
  | 'portability'
  | 'restriction'
  | 'objection'
  | 'other';

export type DsarStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_for_user'
  | 'resolved'
  | 'rejected';

export interface DsarRequest {
  id: string;
  requester_user_id: string;
  request_type: DsarRequestType;
  status: DsarStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
  due_at: string;
  assigned_to: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
}

export interface DsarRequestInsert {
  requester_user_id: string;
  request_type: DsarRequestType;
  description?: string | null;
}

export interface DsarRequestUpdate {
  status?: DsarStatus;
  assigned_to?: string | null;
  resolved_at?: string | null;
  resolution_note?: string | null;
}
