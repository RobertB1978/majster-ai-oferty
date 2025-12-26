import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, className, disabled }: VoiceInputButtonProps) {
  const { transcript, isListening, isSupported, startListening, stopListening, resetTranscript } = useVoiceToText({
    language: 'pl-PL',
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
      aria-label={isListening ? 'Zatrzymaj nagrywanie' : 'Rozpocznij nagrywanie głosowe'}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
