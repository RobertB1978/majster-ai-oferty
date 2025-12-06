import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { useAddProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2, 
  Mic, 
  MicOff, 
  Bot, 
  PenTool, 
  Send, 
  Sparkles,
  FileText,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type CreationMode = 'voice' | 'ai' | 'manual';

interface VoiceQuoteResult {
  projectName: string;
  clientName: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  totalEstimate: number;
}

export default function NewProject() {
  const location = useLocation();
  const initialMode = (location.state?.mode as CreationMode) || 'manual';
  
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const addProject = useAddProject();
  const navigate = useNavigate();
  
  // Form state
  const [projectName, setProjectName] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  
  // Mode state
  const [activeMode, setActiveMode] = useState<CreationMode>(initialMode);
  
  // Voice state
  const { transcript, isListening, isSupported, startListening, stopListening, resetTranscript } = useVoiceToText({
    language: 'pl-PL',
    continuous: true,
  });
  const [voiceResult, setVoiceResult] = useState<VoiceQuoteResult | null>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  // AI state
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Auto-start voice if mode is voice
  useEffect(() => {
    if (initialMode === 'voice' && isSupported && !isListening) {
      setTimeout(() => {
        startListening();
        toast.info('Nagrywanie rozpoczęte', {
          description: 'Powiedz szczegóły projektu...'
        });
      }, 500);
    }
  }, [initialMode, isSupported]);

  // Process voice input
  const handleProcessVoice = async () => {
    if (!transcript.trim()) {
      toast.error('Brak nagranego tekstu');
      return;
    }
    
    setIsProcessingVoice(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('voice-quote-processor', {
        body: { text: transcript }
      });
      
      if (error) throw error;
      
      setVoiceResult(data);
      setProjectName(data.projectName || '');
      setDescription(data.description || '');
      toast.success('Oferta przygotowana!');
    } catch (error) {
      console.error('Error processing voice:', error);
      toast.error('Błąd przetwarzania głosu');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Send AI message
  const handleSendAiMessage = async () => {
    if (!aiInput.trim()) return;
    
    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessingAi(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-agent', {
        body: { 
          message: userMessage,
          context: 'quote_creation',
          projectData: { projectName, description }
        }
      });
      
      if (error) throw error;
      
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      // Extract project data if AI suggests
      if (data.projectName) setProjectName(data.projectName);
      if (data.description) setDescription(data.description);
      
    } catch (error) {
      console.error('Error with AI:', error);
      toast.error('Błąd komunikacji z AI');
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast.error('Podaj nazwę projektu');
      return;
    }

    if (!clientId) {
      toast.error('Wybierz klienta');
      return;
    }

    const project = await addProject.mutateAsync({
      project_name: projectName,
      client_id: clientId,
      status: 'Nowy',
    });

    navigate(`/projects/${project.id}`);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Powrót do projektów
        </Button>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          <Sparkles className="h-3 w-3 mr-1" />
          Nowy projekt
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left side - Creation methods */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Sposób tworzenia
            </CardTitle>
            <CardDescription>
              Wybierz jak chcesz stworzyć projekt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as CreationMode)}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Głosowo
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  AI
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  Ręcznie
                </TabsTrigger>
              </TabsList>

              {/* Voice Tab */}
              <TabsContent value="voice" className="space-y-4">
                <div className="flex flex-col items-center py-6">
                  <button
                    onClick={handleVoiceToggle}
                    disabled={!isSupported || isProcessingVoice}
                    className={cn(
                      "relative h-24 w-24 rounded-full flex items-center justify-center",
                      "transition-all duration-300",
                      isListening
                        ? "bg-gradient-to-br from-rose-500 to-orange-500 shadow-xl shadow-rose-500/30 scale-110"
                        : "bg-gradient-to-br from-primary to-primary-glow shadow-lg hover:scale-105",
                      "disabled:opacity-50"
                    )}
                  >
                    {isListening && (
                      <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                    )}
                    {isListening ? (
                      <MicOff className="h-10 w-10 text-white relative z-10" />
                    ) : (
                      <Mic className="h-10 w-10 text-white relative z-10" />
                    )}
                  </button>
                  
                  <p className="text-sm text-muted-foreground mt-4">
                    {isListening ? 'Mówię... Kliknij aby zatrzymać' : 'Kliknij aby nagrywać'}
                  </p>
                </div>

                {transcript && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Rozpoznany tekst:
                    </div>
                    <p className="text-sm">{transcript}</p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleProcessVoice}
                        disabled={isProcessingVoice}
                        className="flex-1"
                      >
                        {isProcessingVoice ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Przetwórz
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          resetTranscript();
                          setVoiceResult(null);
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {voiceResult && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">Oferta przygotowana</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Szacowana wartość: {voiceResult.totalEstimate?.toLocaleString('pl-PL')} zł
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* AI Tab */}
              <TabsContent value="ai" className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto space-y-3">
                  {aiMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <Bot className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm">Opisz projekt, który chcesz stworzyć</p>
                      <p className="text-xs mt-1">np. "Remont łazienki 15m2, wymiana płytek..."</p>
                    </div>
                  ) : (
                    aiMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-3 rounded-lg max-w-[85%]",
                          msg.role === 'user'
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    ))
                  )}
                  {isProcessingAi && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI myśli...</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Opisz projekt lub zadaj pytanie..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendAiMessage()}
                  />
                  <Button onClick={handleSendAiMessage} disabled={isProcessingAi || !aiInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Manual Tab */}
              <TabsContent value="manual" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <PenTool className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Wypełnij formularz po prawej stronie</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right side - Project form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dane projektu
            </CardTitle>
            <CardDescription>
              Uzupełnij lub zmodyfikuj dane projektu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Nazwa projektu</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="np. Remont łazienki"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client">Klient</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={clientsLoading ? "Ładowanie..." : "Wybierz klienta"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!clientsLoading && clients.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Brak klientów.{' '}
                    <Button variant="link" className="h-auto p-0" onClick={() => navigate('/clients')}>
                      Dodaj klienta
                    </Button>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Opis projektu</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opisz zakres prac..."
                  rows={4}
                />
              </div>

              {voiceResult && voiceResult.items && voiceResult.items.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <Label>Pozycje z wyceny głosowej:</Label>
                  <div className="space-y-1 text-sm">
                    {voiceResult.items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.name} ({item.quantity} {item.unit})</span>
                        <span className="font-medium">{item.price?.toLocaleString('pl-PL')} zł</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all" 
                size="lg"
                disabled={addProject.isPending}
              >
                {addProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Utwórz projekt
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
