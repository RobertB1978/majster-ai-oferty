import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface VoiceQuoteItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: 'Materiał' | 'Robocizna';
}

export interface VoiceQuoteResult {
  projectName: string;
  items: VoiceQuoteItem[];
  summary: string;
}

export function useVoiceQuoteProcessor() {
  const { t } = useTranslation();
  const [lastResult, setLastResult] = useState<VoiceQuoteResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (transcript: string): Promise<VoiceQuoteResult> => {
      const { data, error } = await supabase.functions.invoke('voice-quote-processor', {
        body: { text: transcript },
      });

      if (error) throw error;

      return data as VoiceQuoteResult;
    },
    onSuccess: (result) => {
      setLastResult(result);
      toast.success(
        t('voiceQuote.processed', { count: result.items.length }),
        { description: result.summary || undefined }
      );
    },
    onError: (err: Error) => {
      const message = err.message ?? '';
      if (message.includes('rate') || message.includes('limit')) {
        toast.error(t('voiceQuote.rateLimitError'));
      } else {
        toast.error(t('voiceQuote.processingError'));
      }
    },
  });

  return {
    processTranscript: mutation.mutate,
    isProcessing: mutation.isPending,
    lastResult,
    clearResult: () => setLastResult(null),
  };
}
