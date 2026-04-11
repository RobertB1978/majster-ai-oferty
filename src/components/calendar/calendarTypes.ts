export type ViewMode = 'month' | 'week' | 'day' | 'agenda';

export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface EventFormData {
  title: string;
  description: string;
  event_type: string;
  event_time: string;
  end_time: string;
  project_id: string;
  status: string;
  recurrence_rule: RecurrenceRule;
  recurrence_end_date: string;
}

export const initialEventData: EventFormData = {
  title: '',
  description: '',
  event_type: 'deadline',
  event_time: '',
  end_time: '',
  project_id: '',
  status: 'pending',
  recurrence_rule: 'none',
  recurrence_end_date: '',
};

export const eventTypeColors: Record<string, { bg: string; dot: string; border: string }> = {
  deadline:   { bg: 'bg-destructive/10', dot: 'bg-destructive', border: 'border-destructive/30' },
  meeting:    { bg: 'bg-info/10',        dot: 'bg-info',        border: 'border-info/30' },
  reminder:   { bg: 'bg-warning/10',    dot: 'bg-warning',     border: 'border-warning/30' },
  follow_up:  { bg: 'bg-violet-500/10', dot: 'bg-violet-500',  border: 'border-violet-500/30' }, // intentional categorical color (no violet DS token)
  other:      { bg: 'bg-muted',         dot: 'bg-muted-foreground', border: 'border-border' },
};

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
