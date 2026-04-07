/**
 * useGenerateModeBDocx — PR-05a (Mode B Base Contracts)
 *
 * TanStack Query mutation wywołująca Edge Function generate-docx-mode-b.
 * Po sukcesie inwaliduje query document_instances i document_instance,
 * żeby UI (ModeBDocumentCard) odświeżył stan i odblokował przycisk pobierania.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateModeBDocx, type GenerateDocxInput, type GenerateDocxResult } from '@/services/modeBDocxService';

export function useGenerateModeBDocx() {
  const queryClient = useQueryClient();

  return useMutation<GenerateDocxResult, Error, GenerateDocxInput>({
    mutationFn: generateModeBDocx,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document_instances'] });
      queryClient.invalidateQueries({ queryKey: ['document_instance', variables.instanceId] });
    },
  });
}
