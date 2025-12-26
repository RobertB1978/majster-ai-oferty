import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OfferSend {
  id: string;
  project_id: string;
  user_id: string;
  client_email: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string;
}

export function useOfferSends(_projectId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['offer_sends', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_sends')
        .select('*')
        .eq('project_id', projectId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data as OfferSend[];
    },
    enabled: !!user && !!projectId,
  });
}

export function useCreateOfferSend() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (send: Omit<OfferSend, 'id' | 'user_id' | 'sent_at' | 'error_message'>) => {
      const { data, error } = await supabase
        .from('offer_sends')
        .insert({
          ...send,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offer_sends', variables.project_id] });
    },
    onError: () => {
      toast.error('Błąd przy zapisywaniu wysyłki');
    },
  });
}

export function useUpdateOfferSend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<OfferSend> & { id: string; projectId: string }) => {
      const { data, error } = await supabase
        .from('offer_sends')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offer_sends', variables.projectId] });
    },
  });
}
