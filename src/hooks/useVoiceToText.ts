import { logger } from '@/lib/logger';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// Web Speech API type declarations
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

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
  const { t } = useTranslation();
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
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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

      recognition.onresult = (event: SpeechRecognitionEvent) => {
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

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        logger.error('Speech recognition error:', event.error);
        setIsListening(false);
        isListeningRef.current = false;

        let errorMessage = t('voice.toast.recognitionError');
        switch (event.error) {
          case 'not-allowed':
            errorMessage = t('voice.toast.microphoneAccessDenied');
            break;
          case 'no-speech':
            errorMessage = t('voice.toast.noSpeechDetected');
            break;
          case 'network':
            errorMessage = t('voice.toast.networkError');
            break;
          case 'audio-capture':
            errorMessage = t('voice.toast.audioCaptureError');
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
  }, [language, continuous, interimResults, onResult, onError, t]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      const errorMsg = t('voice.toast.notSupported');
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
        toast.info(t('voice.toast.limitedMode'), {
          description: t('voice.toast.limitedModeDescription'),
        });
      }
    } catch (error) {
      logger.error('Error starting speech recognition:', error);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [browserSupport, onError, t]);

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
