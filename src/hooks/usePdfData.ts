import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PdfData {
  id: string;
  project_id: string;
  user_id: string;
  version: 'standard' | 'premium';
  title: string;
  offer_text: string;
  terms: string;
  deadline_text: string;
  /** VAT rate percentage (0, 5, 8, 23). null = VAT-exempt seller. */
  vat_rate: number | null;
  created_at: string;
}

export function usePdfData(projectId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pdf_data', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_data')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data as PdfData | null;
    },
    enabled: !!user && !!projectId,
  });
}

export function useSavePdfData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      ...pdfData
    }: {
      projectId: string;
      version: 'standard' | 'premium';
      title: string;
      offer_text: string;
      terms: string;
      deadline_text: string;
      vat_rate: number | null;
    }) => {
      // Check if pdf_data exists
      const { data: existing } = await supabase
        .from('pdf_data')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('pdf_data')
          .update(pdfData)
          .eq('project_id', projectId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('pdf_data')
          .insert({
            project_id: projectId,
            user_id: user!.id,
            ...pdfData,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pdf_data', variables.projectId] });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Nieznany błąd';
      toast.error(`Błąd przy zapisywaniu danych PDF: ${message}`);
      logger.error(error);
    },
  });
}
