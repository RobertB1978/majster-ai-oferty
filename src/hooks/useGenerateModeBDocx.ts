/**
 * useGenerateModeBDocx — PR-02 (Mode B DOCX Pilot)
 *
 * Mutation hook do generowania kopii roboczej DOCX przez Edge Function
 * generate-mode-b-docx.
 *
 * Po sukcesie:
 *   - signed_url otwierany jako pobranie (download)
 *   - cache document_instances i document_instance invalidowany
 *
 * Użycie:
 *   const { mutate, isPending, error } = useGenerateModeBDocx();
 *   mutate({ instanceId: '...' });
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Typy ──────────────────────────────────────────────────────────────────────

export interface GenerateModeBDocxInput {
  instanceId: string;
}

export interface GenerateModeBDocxResult {
  signed_url: string | null;
  file_path: string;
  expires_in: number;
}

// ── Helper: pobierz URL jako download ─────────────────────────────────────────

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Wywołuje Edge Function generate-mode-b-docx i automatycznie pobiera plik DOCX.
 */
export function useGenerateModeBDocx() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: GenerateModeBDocxInput,
    ): Promise<GenerateModeBDocxResult> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Brak aktywnej sesji');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const functionUrl = `${supabaseUrl}/functions/v1/generate-mode-b-docx`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({ instance_id: input.instanceId }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const code = errBody?.error?.code ?? 'DOCX_GENERATION_FAILED';
        throw new Error(code);
      }

      return response.json() as Promise<GenerateModeBDocxResult>;
    },

    onSuccess: (result, variables) => {
      // Odśwież dane instancji (file_docx, status, version_number)
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
      queryClient.invalidateQueries({
        queryKey: ['document_instance', variables.instanceId],
      });

      // Automatycznie pobierz DOCX jeśli signed_url dostępny
      if (result.signed_url) {
        const filename = `protokol-odbioru-${variables.instanceId.slice(0, 8)}.docx`;
        triggerDownload(result.signed_url, filename);
      }
    },
  });
}
