import { logger } from '@/lib/logger';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuotePosition {
  name: string;
  category: string;
}

interface AiSuggestion {
  name: string;
  category: 'Materiał' | 'Robocizna';
  price: number;
  unit: string;
  reasoning?: string;
}

// interface SuggestionsResponse {
//   suggestions: AiSuggestion[];
// }

export function useAiSuggestions() {
  return useMutation({
    mutationFn: async ({ 
      projectName, 
      existingPositions 
    }: { 
      projectName: string; 
      existingPositions: QuotePosition[];
    }): Promise<AiSuggestion[]> => {
      const { data, error } = await supabase.functions.invoke('ai-quote-suggestions', {
        body: { projectName, existingPositions }
      });

      if (error) {
        logger.error('AI suggestions error:', error);
        throw new Error(error.message || 'Błąd podczas generowania sugestii');
      }

      return data?.suggestions || [];
    },
    onError: (error: unknown) => {
      if (error.message?.includes('429') || error.message?.includes('limit')) {
        toast.error('Przekroczono limit zapytań AI. Spróbuj później.');
      } else if (error.message?.includes('402')) {
        toast.error('Brak kredytów AI. Doładuj konto.');
      } else {
        toast.error('Błąd AI: ' + (error.message || 'Nieznany błąd'));
      }
    },
  });
}
