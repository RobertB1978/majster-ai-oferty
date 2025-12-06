import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AiChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function useAiChatHistory(sessionId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-chat-history', sessionId],
    queryFn: async () => {
      let query = supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as AiChatMessage[];
    },
    enabled: !!user,
  });
}

export function useAiChatSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-chat-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('session_id, created_at, content')
        .eq('user_id', user!.id)
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by session_id and get first message
      const sessions = new Map<string, { session_id: string; first_message: string; created_at: string }>();
      
      data.forEach((msg: any) => {
        if (!sessions.has(msg.session_id)) {
          sessions.set(msg.session_id, {
            session_id: msg.session_id,
            first_message: msg.content.slice(0, 100),
            created_at: msg.created_at,
          });
        }
      });

      return Array.from(sessions.values());
    },
    enabled: !!user,
  });
}

export function useSaveAiMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      role, 
      content 
    }: { 
      sessionId: string; 
      role: 'user' | 'assistant'; 
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .insert({
          user_id: user!.id,
          session_id: sessionId,
          role,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-history', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
    },
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('ai_chat_history')
        .delete()
        .eq('user_id', user!.id)
        .eq('session_id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-history'] });
      queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
    },
  });
}
