import { logger } from '@/lib/logger';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VoiceQuoteItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: 'Materiał' | 'Robocizna';
}

export interface VoiceQuoteResponse {
  projectName: string;
  items: VoiceQuoteItem[];
  summary: string;
}

export function useVoiceQuote() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (text: string): Promise<VoiceQuoteResponse> => {
      const { data, error } = await supabase.functions.invoke('voice-quote-processor', {
        body: { text },
      });

      if (error) {
        logger.error('Voice quote processor error:', error);
        throw new Error(error.message || t('voiceQuote.processingError'));
      }

      if (!data || !Array.isArray(data.items)) {
        throw new Error(t('voiceQuote.processingError'));
      }

      return data as VoiceQuoteResponse;
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('429') || msg.includes('limit')) {
        toast.error(t('ai.toast.rateLimitExceeded'));
      } else {
        toast.error(msg || t('voiceQuote.processingError'));
      }
    },
  });
}
