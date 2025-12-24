import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { toast } from 'sonner';

export interface WorkTask {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  assigned_team_member_id: string | null;
  task_type: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  color: string;
  created_at: string;
}

export function useWorkTasks(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['work_tasks', projectId],
    queryFn: async () => {
      let query = supabase
        .from('work_tasks')
        .select('*, team_members(*)')
        .eq('user_id', user!.id)
        .order('start_date', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAddWorkTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (task: Omit<WorkTask, 'id' | 'user_id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('work_tasks')
        .insert({
          ...task,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_tasks'] });
      toast.success('Zadanie dodane');
    },
    onError: () => {
      toast.error('Błąd podczas dodawania zadania');
    },
  });
}

export function useUpdateWorkTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('work_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_tasks'] });
      toast.success('Zadanie zaktualizowane');
    },
  });
}

export function useDeleteWorkTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('work_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_tasks'] });
      toast.success('Zadanie usunięte');
    },
  });
}

export function useTeamCapacity(startDate: string, endDate: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team_capacity', startDate, endDate],
    queryFn: async () => {
      const { data: tasks, error } = await supabase
        .from('work_tasks')
        .select('*, team_members(*)')
        .eq('user_id', user!.id)
        .gte('start_date', startDate)
        .lte('end_date', endDate);

      if (error) throw error;

      const { data: members } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_user_id', user!.id)
        .eq('is_active', true);

      // Calculate capacity per member
      const capacity = (members || []).map(member => {
        const memberTasks = (tasks || []).filter(t => t.assigned_team_member_id === member.id);
        const totalHours = memberTasks.reduce((sum, task) => {
          const start = new Date(task.start_date);
          const end = new Date(task.end_date);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);

        return {
          member,
          tasks: memberTasks,
          totalHours,
          utilizationPercent: Math.min((totalHours / 160) * 100, 100) // Assuming 160h/month
        };
      });

      return capacity;
    },
    enabled: !!user && !!startDate && !!endDate,
  });
}
