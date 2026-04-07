/**
 * useModeBMasterTemplates — PR-04 (Mode B UI Flow)
 *
 * TanStack Query hook pobierający aktywne master templates z tabeli
 * document_master_templates (dodanej w PR-01).
 *
 * Użytkownicy mają wyłącznie SELECT na aktywne szablony (RLS).
 * INSERT/UPDATE/DELETE wyłącznie przez service_role (Edge Functions).
 *
 * Zwraca:
 *   - listę aktywnych DocumentMasterTemplate
 *   - loading/error stany
 *
 * Jeśli tabela jest pusta (seed dopiero w PR-05), zwraca pustą tablicę —
 * komponent wyświetla honest fallback bez breaking change.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { DocumentMasterTemplate, MasterTemplateCategory } from '@/types/document-mode-b';

export function useModeBMasterTemplates(category?: MasterTemplateCategory) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mode_b_master_templates', category],
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 minut — szablony zmieniają się rzadko
    queryFn: async (): Promise<DocumentMasterTemplate[]> => {
      let q = supabase
        .from('document_master_templates')
        .select('id, template_key, name, category, quality_tier, docx_master_path, preview_pdf_path, version, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (category) {
        q = q.eq('category', category);
      }

      const { data, error } = await q;
      if (error) throw new Error(`Błąd pobierania szablonów: ${error.message}`);
      return (data ?? []) as DocumentMasterTemplate[];
    },
  });
}
