/**
 * useModeBMasterTemplates — PR-04 (Mode B UI Flow) + PR-B4 (Publish Gate)
 *
 * TanStack Query hook pobierający publish-safe master templates z tabeli
 * document_master_templates (dodanej w PR-01).
 *
 * Użytkownicy mają wyłącznie SELECT na aktywne szablony (RLS).
 * INSERT/UPDATE/DELETE wyłącznie przez service_role (Edge Functions).
 *
 * Publish-safe rule (PR-B4) — szablon jest zwracany tylko gdy:
 *   1. is_active = true         (RLS + filtr zapytania)
 *   2. docx_master_path IS NOT NULL (filtr zapytania — brak ścieżki = brak pliku)
 *
 * Konwencja: właściciel ustawia is_active=true dopiero po przesłaniu DOCX.
 * Jeśli brak szablonów, zwraca pustą tablicę — komponent pokazuje honest fallback.
 *
 * Szczegóły: docs/MODE_B_PUBLISH_GATE.md
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
        // PR-B4 publish gate: only templates with a recorded DOCX path are surfaced.
        // Relies on the convention that is_active is set to true only after DOCX upload.
        .not('docx_master_path', 'is', null)
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
