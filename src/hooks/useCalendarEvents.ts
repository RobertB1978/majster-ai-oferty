import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { toast } from 'sonner';

export interface CalendarEvent {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string;
  event_date: string;
  event_time: string | null;
  event_type: string;
  status: string;
  created_at: string;
}

export function useCalendarEvents(startDate?: string, endDate?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['calendar_events', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (startDate) {
        query = query.gte('event_date', startDate);
      }
      if (endDate) {
        query = query.lte('event_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });
}

export function useAddCalendarEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ ...event, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success('Wydarzenie dodane');
    },
    onError: (error) => {
      toast.error('Błąd przy dodawaniu wydarzenia');
      console.error(error);
    },
  });
}

export function useUpdateCalendarEvent() {
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
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success('Wydarzenie zaktualizowane');
    },
    onError: (error) => {
      toast.error('Błąd przy aktualizacji wydarzenia');
      console.error(error);
    },
  });
}

export function useDeleteCalendarEvent() {
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
      toast.success('Wydarzenie usunięte');
    },
    onError: (error) => {
      toast.error('Błąd przy usuwaniu wydarzenia');
      console.error(error);
    },
  });
}
