import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseVoiceToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseVoiceToTextReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceToText(options: UseVoiceToTextOptions = {}): UseVoiceToTextReturn {
  const { language = 'pl-PL', continuous = false, interimResults = true } = options;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(prev => {
          if (finalTranscript) {
            return prev + finalTranscript;
          }
          return prev + interimTranscript;
        });
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        switch (event.error) {
          case 'not-allowed':
            toast.error('Brak dostępu do mikrofonu. Włącz mikrofon w ustawieniach przeglądarki.');
            break;
          case 'no-speech':
            toast.info('Nie wykryto mowy. Spróbuj ponownie.');
            break;
          case 'network':
            toast.error('Błąd sieci. Sprawdź połączenie internetowe.');
            break;
          default:
            toast.error('Błąd rozpoznawania mowy');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, continuous, interimResults]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error('Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce');
      return;
    }

    setTranscript('');
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
