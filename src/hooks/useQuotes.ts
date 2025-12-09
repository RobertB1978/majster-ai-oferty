import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface QuotePosition {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: 'Materiał' | 'Robocizna';
  notes?: string;
}

export interface Quote {
  id: string;
  project_id: string;
  user_id: string;
  positions: QuotePosition[];
  summary_materials: number;
  summary_labor: number;
  margin_percent: number;
  total: number;
  created_at: string;
}

export function useQuote(projectId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quotes', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          positions: (data.positions as unknown as QuotePosition[]) || [],
        } as Quote;
      }
      return null;
    },
    enabled: !!user && !!projectId,
  });
}

export function useSaveQuote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      positions, 
      marginPercent 
    }: { 
      projectId: string; 
      positions: QuotePosition[]; 
      marginPercent: number;
    }) => {
      const summaryMaterials = positions
        .filter(p => p.category === 'Materiał')
        .reduce((sum, p) => sum + p.qty * p.price, 0);
      const summaryLabor = positions
        .filter(p => p.category === 'Robocizna')
        .reduce((sum, p) => sum + p.qty * p.price, 0);
      const subtotal = summaryMaterials + summaryLabor;
      const total = subtotal * (1 + marginPercent / 100);

      // Check if quote exists
      const { data: existing } = await supabase
        .from('quotes')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      const positionsJson = JSON.parse(JSON.stringify(positions)) as Json;

      if (existing) {
        // Update existing quote
        const { data, error } = await supabase
          .from('quotes')
          .update({
            positions: positionsJson,
            summary_materials: summaryMaterials,
            summary_labor: summaryLabor,
            margin_percent: marginPercent,
            total,
          })
          .eq('project_id', projectId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new quote
        const { data, error } = await supabase
          .from('quotes')
          .insert({
            project_id: projectId,
            user_id: user!.id,
            positions: positionsJson,
            summary_materials: summaryMaterials,
            summary_labor: summaryLabor,
            margin_percent: marginPercent,
            total,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes', variables.projectId] });
      toast.success('Wycena zapisana');
    },
    onError: (error) => {
      toast.error('Błąd przy zapisywaniu wyceny');
      console.error(error);
    },
  });
}
