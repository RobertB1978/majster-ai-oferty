import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CalendarEvent {
  id: string;
  user_id: string;
  project_id: string | null;
  v2_project_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  event_type: string;
  status: string;
  recurrence_rule: string;
  recurrence_end_date: string | null;
  created_at: string;
}

export function useCalendarEvents(startDate?: string, endDate?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['calendar_events', user?.id, startDate, endDate],
    queryFn: async () => {
      // select('*') is intentional: avoids a 400 error when newer columns
      // (end_time, recurrence_rule, recurrence_end_date — migration 20260411120000)
      // haven't been applied to the production DB yet. Explicit column lists would
      // cause PostgREST to return an error for non-existent columns.
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user!.id)
        .order('event_date', { ascending: true });

      if (startDate) {
        query = query.gte('event_date', startDate);
      }
      if (endDate) {
        query = query.lte('event_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Normalize: provide safe defaults for columns that may not exist yet
      // in older DB schemas (before migration 20260411120000_calendar_end_time_recurrence)
      type RawRow = Record<string, unknown>;
      const rows = (data ?? []) as RawRow[];
      return rows.map(row => ({
        ...row,
        end_time: (row['end_time'] as string | null | undefined) ?? null,
        recurrence_rule: (row['recurrence_rule'] as string | undefined) ?? 'none',
        recurrence_end_date: (row['recurrence_end_date'] as string | null | undefined) ?? null,
        v2_project_id: (row['v2_project_id'] as string | null | undefined) ?? null,
      })) as CalendarEvent[];
    },
    enabled: !!user,
  });
}

export function useAddCalendarEvent() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ ...event, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned after insert');
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success(t('calendarEvents.toast.added'));
    },
    onError: (error) => {
      toast.error(t('calendarEvents.toast.addError'));
      logger.error(error);
    },
  });
}

export function useUpdateCalendarEvent() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...event }: Partial<CalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(event)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Event not found or access denied');
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success(t('calendarEvents.toast.updated'));
    },
    onError: (error) => {
      toast.error(t('calendarEvents.toast.updateError'));
      logger.error(error);
    },
  });
}

export function useDeleteCalendarEvent() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success(t('calendarEvents.toast.deleted'));
    },
    onError: (error) => {
      toast.error(t('calendarEvents.toast.deleteError'));
      logger.error(error);
    },
  });
}
