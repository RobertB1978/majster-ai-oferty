import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { toast } from 'sonner';

export interface OfferApproval {
  id: string;
  project_id: string;
  user_id: string;
  public_token: string;
  client_name: string | null;
  client_email: string | null;
  status: 'pending' | 'approved' | 'rejected';
  signature_data: string | null;
  client_comment: string | null;
  approved_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export function useOfferApprovals(projectId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['offer_approvals', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_approvals')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OfferApproval[];
    },
    enabled: !!user && !!projectId,
  });
}

export function useCreateOfferApproval() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, clientName, clientEmail }: { 
      projectId: string; 
      clientName: string;
      clientEmail: string;
    }) => {
      const { data, error } = await supabase
        .from('offer_approvals')
        .insert({
          project_id: projectId,
          user_id: user!.id,
          client_name: clientName,
          client_email: clientEmail,
        })
        .select()
        .single();

      if (error) throw error;
      return data as OfferApproval;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['offer_approvals', projectId] });
      toast.success('Link do akceptacji utworzony');
    },
    onError: () => {
      toast.error('Błąd podczas tworzenia linku');
    },
  });
}

export function useExtendOfferApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approvalId, projectId, daysToExtend = 30 }: { 
      approvalId: string; 
      projectId: string;
      daysToExtend?: number;
    }) => {
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + daysToExtend);

      const { data, error } = await supabase
        .from('offer_approvals')
        .update({
          expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', approvalId)
        .select()
        .single();

      if (error) throw error;
      return data as OfferApproval;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['offer_approvals', projectId] });
      toast.success('Ważność oferty przedłużona o 30 dni');
    },
    onError: () => {
      toast.error('Błąd podczas przedłużania oferty');
    },
  });
}

export function usePublicOfferApproval(token: string) {
  return useQuery({
    queryKey: ['public_offer_approval', token],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('approve-offer', {
        body: { token },
        method: 'GET'
      });

      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });
}

export function useSubmitOfferApproval() {
  return useMutation({
    mutationFn: async ({ token, action, signatureData, comment }: { 
      token: string;
      action: 'approve' | 'reject';
      signatureData?: string;
      comment?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('approve-offer', {
        body: { token, action, signatureData, comment }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { action }) => {
      toast.success(action === 'approve' ? 'Oferta zaakceptowana!' : 'Oferta odrzucona');
    },
    onError: () => {
      toast.error('Błąd podczas przetwarzania');
    },
  });
}
