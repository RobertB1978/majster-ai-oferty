import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { toast } from 'sonner';
import { validateFile, FILE_VALIDATION_CONFIGS } from '@/lib/fileValidation';

export interface PurchaseCostItem {
  name: string;
  quantity: number;
  unit: string;
  netPrice: number;
  vatRate: number;
  grossPrice: number;
}

export interface PurchaseCost {
  id: string;
  project_id: string;
  user_id: string;
  supplier_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  items: PurchaseCostItem[];
  net_amount: number;
  vat_amount: number;
  gross_amount: number;
  document_url: string | null;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export function usePurchaseCosts(projectId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['purchase_costs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_costs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        items: (d.items || []) as unknown as PurchaseCostItem[]
      })) as PurchaseCost[];
    },
    enabled: !!user && !!projectId,
  });
}

export function useAllPurchaseCosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['purchase_costs', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_costs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        items: (d.items || []) as unknown as PurchaseCostItem[]
      })) as PurchaseCost[];
    },
    enabled: !!user,
  });
}

export function useUploadInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, file }: { projectId: string; file: File }) => {
      // Validate file
      const validation = validateFile(file, FILE_VALIDATION_CONFIGS.invoice);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${projectId}/invoices/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from('purchase_costs')
        .insert({
          project_id: projectId,
          user_id: user!.id,
          document_url: publicUrl,
          ocr_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_costs', projectId] });
      toast.success('Faktura przesłana');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Błąd podczas przesyłania faktury';
      toast.error(message);
    },
  });
}

export function useProcessInvoiceOCR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ costId, projectId, documentUrl }: { 
      costId: string; 
      projectId: string;
      documentUrl: string;
    }) => {
      await supabase
        .from('purchase_costs')
        .update({ ocr_status: 'processing' })
        .eq('id', costId);

      const { data, error } = await supabase.functions.invoke('ocr-invoice', {
        body: { documentUrl }
      });

      if (error) throw error;

      const result = data.result;
      await supabase
        .from('purchase_costs')
        .update({ 
          ocr_status: 'completed',
          supplier_name: result.supplierName,
          invoice_number: result.invoiceNumber,
          invoice_date: result.invoiceDate,
          items: result.items,
          net_amount: result.netAmount,
          vat_amount: result.vatAmount,
          gross_amount: result.grossAmount,
        })
        .eq('id', costId);

      return { costId, projectId, result };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_costs', result.projectId] });
      toast.success('OCR zakończony');
    },
    onError: async (_, { costId }) => {
      await supabase
        .from('purchase_costs')
        .update({ ocr_status: 'failed' })
        .eq('id', costId);
      toast.error('Błąd OCR');
    },
  });
}

export function useDeletePurchaseCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ costId, projectId }: { costId: string; projectId: string }) => {
      const { error } = await supabase
        .from('purchase_costs')
        .delete()
        .eq('id', costId);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_costs', result.projectId] });
      toast.success('Koszt usunięty');
    },
  });
}
