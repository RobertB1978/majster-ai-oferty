import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Loader2, 
  Check, 
  Edit3,
  Volume2,
  RefreshCw,
  ArrowRight,
  Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuoteItem {
  name: string;
  qty: number;
  unit: string;
  price: number;
  category: 'Materiał' | 'Robocizna';
}

interface VoiceQuoteResult {
  projectName: string;
  items: QuoteItem[];
  summary: string;
}

interface VoiceQuoteCreatorProps {
  onQuoteCreated?: (result: VoiceQuoteResult) => void;
}

export function VoiceQuoteCreator({ onQuoteCreated }: VoiceQuoteCreatorProps) {
  const [mode, setMode] = useState<'idle' | 'listening' | 'processing' | 'editing' | 'done'>('idle');
  const [voiceText, setVoiceText] = useState('');
  const [result, setResult] = useState<VoiceQuoteResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { transcript, isListening, isSupported, startListening, stopListening, resetTranscript } = useVoiceToText({
    language: 'pl-PL',
    continuous: true,
  });

  useEffect(() => {
    if (transcript) {
      setVoiceText(prev => prev + ' ' + transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (!isListening && mode === 'listening') {
      if (voiceText.trim().length > 10) {
        processVoiceInput();
      } else {
        setMode('idle');
      }
    }
  }, [isListening]);

  const handleStartListening = () => {
    setVoiceText('');
    resetTranscript();
    setResult(null);
    setMode('listening');
    startListening();
  };

  const handleStopListening = () => {
    stopListening();
  };

  const processVoiceInput = async () => {
    if (!voiceText.trim()) {
      setMode('idle');
      return;
    }

    setMode('processing');

    try {
      const { data, error } = await supabase.functions.invoke('voice-quote-processor', {
        body: { text: voiceText.trim() }
      });

      if (error) throw error;

      setResult(data);
      setMode('editing');
    } catch (error: any) {
      console.error('Voice processing error:', error);
      toast.error('Błąd przetwarzania. Spróbuj ponownie.');
      setMode('idle');
    }
  };

  const handleEditSubmit = () => {
    if (result) {
      setMode('done');
      onQuoteCreated?.(result);
      toast.success('Wycena utworzona pomyślnie!');
    }
  };

  const handleReset = () => {
    setVoiceText('');
    setResult(null);
    setMode('idle');
    resetTranscript();
  };

  const handleVoiceCorrection = () => {
    setVoiceText('');
    resetTranscript();
    setMode('listening');
    startListening();
  };

  if (!isSupported) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20">
        <CardContent className="py-8 text-center">
          <Volume2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Twoja przeglądarka nie wspiera rozpoznawania mowy.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-500',
      mode === 'listening' && 'border-primary shadow-glow',
      mode === 'processing' && 'border-primary/50',
      mode === 'done' && 'border-green-500/50'
    )}>
      {/* Animated background */}
      {mode === 'listening' && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
              mode === 'idle' && 'bg-muted',
              mode === 'listening' && 'bg-primary animate-pulse',
              mode === 'processing' && 'bg-primary/70',
              mode === 'editing' && 'bg-yellow-500',
              mode === 'done' && 'bg-green-500'
            )}>
              {mode === 'listening' && <Mic className="h-5 w-5 text-white" />}
              {mode === 'processing' && <Loader2 className="h-5 w-5 text-white animate-spin" />}
              {mode === 'editing' && <Edit3 className="h-5 w-5 text-white" />}
              {mode === 'done' && <Check className="h-5 w-5 text-white" />}
              {mode === 'idle' && <Wand2 className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-base">Wycena głosowa</CardTitle>
              <p className="text-xs text-muted-foreground">
                {mode === 'idle' && 'Powiedz co chcesz wycenić'}
                {mode === 'listening' && 'Słucham...'}
                {mode === 'processing' && 'Analizuję...'}
                {mode === 'editing' && 'Sprawdź i zatwierdź'}
                {mode === 'done' && 'Gotowe!'}
              </p>
            </div>
          </div>
          <Badge variant={mode === 'listening' ? 'default' : 'secondary'}>
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Idle state */}
        {mode === 'idle' && (
          <div className="text-center py-6">
            <Button
              size="lg"
              onClick={handleStartListening}
              className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary-glow hover:shadow-glow transition-all duration-300 hover:scale-110"
            >
              <Mic className="h-8 w-8" />
            </Button>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs mx-auto">
              Naciśnij i powiedz np. "Remont łazienki 10 metrów kwadratowych, płytki, wanna, umywalka"
            </p>
          </div>
        )}

        {/* Listening state */}
        {mode === 'listening' && (
          <div className="text-center py-6 space-y-4">
            <div className="relative inline-flex">
              <Button
                size="lg"
                onClick={handleStopListening}
                variant="destructive"
                className="h-20 w-20 rounded-full animate-pulse"
              >
                <MicOff className="h-8 w-8" />
              </Button>
              {/* Sound waves animation */}
              <span className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-25" />
              <span className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-25 animation-delay-200" style={{ animationDelay: '0.2s' }} />
            </div>
            
            {voiceText && (
              <div className="bg-muted/50 rounded-lg p-4 mt-4 text-left animate-fade-in">
                <p className="text-sm font-medium text-muted-foreground mb-1">Rozpoznany tekst:</p>
                <p className="text-foreground">{voiceText}</p>
              </div>
            )}
          </div>
        )}

        {/* Processing state */}
        {mode === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Analizuję Twoją wycenę...</p>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="inline-block animate-pulse">Identyfikuję materiały</span>
              <span className="mx-2">•</span>
              <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>Obliczam ceny</span>
              <span className="mx-2">•</span>
              <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>Tworzę ofertę</span>
            </div>
          </div>
        )}

        {/* Editing state */}
        {mode === 'editing' && result && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Projekt:</p>
              <p className="text-lg font-semibold">{result.projectName}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pozycje wyceny:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {result.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/20 rounded-lg p-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.qty} {item.unit} × {item.price} zł
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.category === 'Materiał' ? 'secondary' : 'outline'}>
                        {item.category}
                      </Badge>
                      <p className="text-sm font-semibold mt-1">{(item.qty * item.price).toFixed(2)} zł</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isEditing && (
              <Textarea
                value={result.summary}
                onChange={(e) => setResult({ ...result, summary: e.target.value })}
                placeholder="Dodatkowe uwagi..."
                className="min-h-[80px]"
              />
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleVoiceCorrection}
                className="flex-1"
              >
                <Mic className="h-4 w-4 mr-2" />
                Popraw głosowo
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edytuj
              </Button>
              <Button
                onClick={handleEditSubmit}
                className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
              >
                <Check className="h-4 w-4 mr-2" />
                Zatwierdź
              </Button>
            </div>
          </div>
        )}

        {/* Done state */}
        {mode === 'done' && (
          <div className="text-center py-6 animate-fade-in">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <p className="font-medium text-green-600">Wycena została utworzona!</p>
            <Button
              variant="outline"
              onClick={handleReset}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Stwórz kolejną
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
