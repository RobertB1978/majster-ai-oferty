import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { normalizeQuantity, normalizePrice, normalizeString, normalizePercentage } from '@/lib/dataValidation';

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
      // Normalize all positions to ensure data integrity
      const normalizedPositions = positions.map(p => ({
        ...p,
        name: normalizeString(p.name, '', 200),
        qty: normalizeQuantity(p.qty),
        price: normalizePrice(p.price),
        unit: normalizeString(p.unit, 'szt.', 20),
        notes: p.notes ? normalizeString(p.notes, '', 500) : undefined,
      }));

      // Normalize margin percentage
      const normalizedMargin = normalizePercentage(marginPercent);

      const summaryMaterials = normalizedPositions
        .filter(p => p.category === 'Materiał')
        .reduce((sum, p) => sum + p.qty * p.price, 0);
      const summaryLabor = normalizedPositions
        .filter(p => p.category === 'Robocizna')
        .reduce((sum, p) => sum + p.qty * p.price, 0);
      const subtotal = summaryMaterials + summaryLabor;
      const total = subtotal * (1 + normalizedMargin / 100);

      const positionsJson = JSON.parse(JSON.stringify(normalizedPositions)) as Json;

      // Use UPSERT to handle both insert and update atomically
      // This prevents race conditions when multiple saves happen concurrently
      const { data, error } = await supabase
        .from('quotes')
        .upsert({
          project_id: projectId,
          user_id: user!.id,
          positions: positionsJson,
          summary_materials: summaryMaterials,
          summary_labor: summaryLabor,
          margin_percent: normalizedMargin,
          total,
        }, {
          onConflict: 'project_id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
