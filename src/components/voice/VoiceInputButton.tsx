import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { cn } from '@/lib/utils';

/** Map i18n language to BCP-47 speech recognition locale.
 *  NOTE: en-US is intentional — Web Speech API has better recognition models for US English. */
function getSpeechLocale(lang: string): string {
  const map: Record<string, string> = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA' };
  return map[lang.split('-')[0]] ?? 'pl-PL';
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, className, disabled }: VoiceInputButtonProps) {
  const { t, i18n } = useTranslation();
  const { transcript, isListening, isSupported, startListening, stopListening, resetTranscript } = useVoiceToText({
    language: getSpeechLocale(i18n.language),
    continuous: false,
    interimResults: true,
  });

  useEffect(() => {
    if (transcript && !isListening) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, onTranscript, resetTranscript]);

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Button
      type="button"
      variant={isListening ? 'destructive' : 'outline'}
      size="icon"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'transition-all duration-200',
        isListening && 'animate-pulse',
        className
      )}
      aria-label={isListening ? t('common.stopRecording') : t('common.startVoiceRecording')}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
