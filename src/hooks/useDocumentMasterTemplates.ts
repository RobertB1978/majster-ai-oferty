/**
 * useDocumentMasterTemplates — PR-02 (Mode B DOCX Pilot)
 *
 * TanStack Query hooks dla tabeli document_master_templates.
 * RLS enforced server-side: zalogowani widzą tylko is_active = true.
 *
 * Używane w (przyszłym) UI biblioteki szablonów Trybu B.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentMasterTemplate, MasterTemplateCategory, QualityTier } from '@/types/document-mode-b';

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseDocumentMasterTemplatesOpts {
  category?: MasterTemplateCategory;
  qualityTier?: QualityTier;
}

/**
 * Zwraca listę aktywnych master templates (is_active = true).
 * Opcjonalnie filtruje po category i/lub quality_tier.
 */
export function useDocumentMasterTemplates(
  opts: UseDocumentMasterTemplatesOpts = {},
) {
  return useQuery({
    queryKey: ['document_master_templates', opts.category, opts.qualityTier],
    staleTime: 1000 * 60 * 10, // 10 min — master templates zmieniają się rzadko
    queryFn: async (): Promise<DocumentMasterTemplate[]> => {
      let q = supabase
        .from('document_master_templates')
        .select(
          'id, template_key, name, category, quality_tier, docx_master_path, preview_pdf_path, version, is_active, created_at, updated_at',
        )
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (opts.category) {
        q = q.eq('category', opts.category);
      }
      if (opts.qualityTier) {
        q = q.eq('quality_tier', opts.qualityTier);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DocumentMasterTemplate[];
    },
  });
}

/**
 * Zwraca pojedynczy master template po template_key.
 */
export function useDocumentMasterTemplate(templateKey: string | undefined) {
  return useQuery({
    queryKey: ['document_master_template', templateKey],
    enabled: !!templateKey,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<DocumentMasterTemplate | null> => {
      const { data, error } = await supabase
        .from('document_master_templates')
        .select(
          'id, template_key, name, category, quality_tier, docx_master_path, preview_pdf_path, version, is_active, created_at, updated_at',
        )
        .eq('template_key', templateKey!)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as DocumentMasterTemplate | null;
    },
  });
}
