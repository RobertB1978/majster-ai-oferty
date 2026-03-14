export type ViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface EventFormData {
  title: string;
  description: string;
  event_type: string;
  event_time: string;
  end_time: string;
  project_id: string;
}

export const initialEventData: EventFormData = {
  title: '',
  description: '',
  event_type: 'deadline',
  event_time: '',
  end_time: '',
  project_id: '',
};

export const eventTypeColors: Record<string, { bg: string; dot: string; border: string }> = {
  deadline:   { bg: 'bg-red-500/10',    dot: 'bg-red-500',    border: 'border-red-500/30' },
  meeting:    { bg: 'bg-blue-500/10',   dot: 'bg-blue-500',   border: 'border-blue-500/30' },
  reminder:   { bg: 'bg-amber-500/10',  dot: 'bg-amber-500',  border: 'border-amber-500/30' },
  follow_up:  { bg: 'bg-violet-500/10', dot: 'bg-violet-500', border: 'border-violet-500/30' },
  other:      { bg: 'bg-gray-500/10',   dot: 'bg-gray-500',   border: 'border-gray-500/30' },
};

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
