import { logger } from '@/lib/logger';
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseVoiceToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseVoiceToTextReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupport: 'full' | 'partial' | 'none';
}

export function useVoiceToText(options: UseVoiceToTextOptions = {}): UseVoiceToTextReturn {
  const { 
    language = 'pl-PL', 
    continuous = false, 
    interimResults = true,
    onResult,
    onError 
  } = options;

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [browserSupport, setBrowserSupport] = useState<'full' | 'partial' | 'none'>('none');
  
  const recognitionRef = useRef<unknown>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = (window as unknown).SpeechRecognition || (window as unknown).webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    setIsSupported(supported);

    // Determine browser support level
    if (!supported) {
      setBrowserSupport('none');
    } else {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('chrome') || userAgent.includes('edg') || userAgent.includes('opr')) {
        setBrowserSupport('full');
      } else if (userAgent.includes('safari') || userAgent.includes('firefox')) {
        setBrowserSupport('partial');
      } else {
        setBrowserSupport('partial');
      }
    }

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
      };

      recognition.onresult = (event: unknown) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => (prev + ' ' + finalTranscript).trim());
          onResult?.(finalTranscript, true);
        }
        
        setInterimTranscript(currentInterim);
        if (currentInterim) {
          onResult?.(currentInterim, false);
        }
      };

      recognition.onerror = (event: unknown) => {
        logger.error('Speech recognition error:', event.error);
        setIsListening(false);
        isListeningRef.current = false;

        let errorMessage = 'Błąd rozpoznawania mowy';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Brak dostępu do mikrofonu. Włącz mikrofon w ustawieniach przeglądarki.';
            break;
          case 'no-speech':
            errorMessage = 'Nie wykryto mowy. Spróbuj ponownie.';
            break;
          case 'network':
            errorMessage = 'Błąd sieci. Sprawdź połączenie internetowe.';
            break;
          case 'audio-capture':
            errorMessage = 'Nie można uzyskać dostępu do mikrofonu.';
            break;
          case 'aborted':
            // User aborted, no error toast
            return;
        }
        
        toast.error(errorMessage);
        onError?.(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        
        // Auto-restart for Safari/Firefox if continuous mode is enabled
        if (continuous && isListeningRef.current) {
          try {
            setTimeout(() => {
              if (isListeningRef.current) {
                recognition.start();
              }
            }, 100);
          } catch (_e) {
            // Ignore restart errors
          }
        }
        isListeningRef.current = false;
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_e) {
          // Ignore abort errors
        }
      }
    };
  }, [language, continuous, interimResults, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      const errorMsg = 'Rozpoznawanie mowy nie jest obsługiwane. Użyj Chrome, Edge lub Safari.';
      toast.error(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setTranscript('');
    setInterimTranscript('');
    setIsListening(true);
    isListeningRef.current = true;

    try {
      recognitionRef.current.start();
      
      if (browserSupport === 'partial') {
        toast.info('Nagrywanie (tryb ograniczony)', {
          description: 'Dla najlepszej jakości użyj Chrome lub Edge.',
        });
      }
    } catch (error) {
      logger.error('Error starting speech recognition:', error);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [browserSupport, onError]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {
        // Ignore stop errors
      }
      setIsListening(false);
      setInterimTranscript('');
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    browserSupport,
  };
}
