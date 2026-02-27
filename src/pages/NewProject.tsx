import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type CreationMode = 'voice' | 'ai' | 'manual';

interface VoiceQuoteResult {
  projectName: string;
  clientName: string;
  description: string;
  items: Array<{
    name: string;
    qty: number;
    unit: string;
    price: number;
  }>;
  summary: string;
}

export default function NewProject() {
  const { t } = useTranslation();
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
  
  // Voice state - using Web Speech API
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceResult, setVoiceResult] = useState<VoiceQuoteResult | null>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [recognition, setRecognition] = useState<unknown>(null);
  
  // AI state
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as unknown).SpeechRecognition || (window as unknown).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'pl-PL';
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      
      recognitionInstance.onresult = (event: unknown) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            const _interimTranscript = result[0].transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
        }
      };
      
      recognitionInstance.onerror = (event: unknown) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error(t('errors.microphoneAccessDenied'));
        }
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: initialize speech recognition once
  }, []);

  const handleVoiceToggle = () => {
    if (!recognition) {
      toast.error(t('errors.speechRecognitionNotSupported'));
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognition.start();
        setIsListening(true);
        toast.info(t('messages.recordingStarted'));
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error(t('newProject.microphoneStartFailed'));
      }
    }
  };

  // Process voice input with AI
  const handleProcessVoice = async () => {
    if (!transcript.trim()) {
      toast.error(t('newProject.noTranscript'));
      return;
    }
    
    setIsProcessingVoice(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('voice-quote-processor', {
        body: { text: transcript }
      });
      
      if (error) {
        console.error('Voice processing error:', error);
        throw error;
      }
      
      if (data) {
        setVoiceResult(data);
        setProjectName(data.projectName || '');
        setDescription(data.summary || '');
        toast.success(t('newProject.quotePreparedSuccess'));
      }
    } catch (error) {
      console.error('Error processing voice:', error);
      toast.error(t('errors.processingFailed'));
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
          history: aiMessages.slice(-6)
        }
      });
      
      if (error) {
        console.error('AI error:', error);
        throw error;
      }
      
      const aiReply = data?.response || data?.reply || t('newProject.defaultAiError');
      setAiMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);

    } catch (error) {
      console.error('Error with AI:', error);
      toast.error(t('newProject.aiError'));
      setAiMessages(prev => [...prev, { role: 'assistant', content: t('newProject.connectionError') }]);
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast.error(t('validation.projectNameRequired'));
      return;
    }

    if (!clientId) {
      toast.error(t('validation.clientRequired'));
      return;
    }

    const project = await addProject.mutateAsync({
      project_name: projectName,
      client_id: clientId,
      status: t('newProject.statusNew'),
    });

    navigate(`/app/jobs/${project.id}`);
  };

  const isVoiceSupported = !!(window as unknown).SpeechRecognition || !!(window as unknown).webkitSpeechRecognition;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/app/jobs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('newProject.backToProjects')}
        </Button>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          <Sparkles className="h-3 w-3 mr-1" />
          {t('newProject.title')}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left side - Creation methods */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('newProject.creationMethod')}
            </CardTitle>
            <CardDescription>
              {t('newProject.creationMethodDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as CreationMode)}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="voice" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  {t('newProject.voiceMode')}
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  {t('newProject.aiMode')}
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  {t('newProject.manualMode')}
                </TabsTrigger>
              </TabsList>

              {/* Voice Tab */}
              <TabsContent value="voice" className="space-y-4">
                {!isVoiceSupported ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t('newProject.voiceNotSupported')}</p>
                    <p className="text-sm mt-2">{t('newProject.useChromeOrEdge')}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center py-6">
                      <button
                        onClick={handleVoiceToggle}
                        disabled={isProcessingVoice}
                        className={cn(
                          "relative h-24 w-24 rounded-full flex items-center justify-center",
                          "transition-all duration-300",
                          isListening
                            ? "bg-destructive shadow-md scale-110"
                            : "bg-primary shadow-sm hover:scale-105",
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
                        {isListening ? t('newProject.recording') : t('newProject.clickToRecord')}
                      </p>
                    </div>

                    {transcript && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          {t('newProject.recognizedText')}
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
                            {t('newProject.processWithAI')}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setTranscript('');
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
                          <span className="font-medium">{t('newProject.quotePrepared')}</span>
                        </div>
                        {voiceResult.items && voiceResult.items.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {voiceResult.items.length} {t('newProject.quoteItemsSummary')}{voiceResult.items.reduce((acc, item) => acc + (item.qty * item.price), 0).toLocaleString('pl-PL')} zł
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* AI Tab */}
              <TabsContent value="ai" className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4 min-h-[250px] max-h-[350px] overflow-y-auto space-y-3">
                  {aiMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <Bot className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-sm text-center">{t('newProject.describeProject')}</p>
                      <p className="text-xs mt-2 text-center max-w-xs">
                        {t('newProject.describeProjectExample')}
                      </p>
                    </div>
                  ) : (
                    aiMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-3 rounded-lg max-w-[90%]",
                          msg.role === 'user'
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted mr-auto"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))
                  )}
                  {isProcessingAi && (
                    <div className="flex items-center gap-2 text-muted-foreground p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{t('newProject.aiResponding')}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder={t('newProject.aiPlaceholder')}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendAiMessage()}
                    disabled={isProcessingAi}
                  />
                  <Button
                    onClick={handleSendAiMessage}
                    disabled={isProcessingAi || !aiInput.trim()}
                    className="bg-primary"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Manual Tab */}
              <TabsContent value="manual" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <PenTool className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('newProject.fillForm')}</p>
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
              {t('newProject.projectData')}
            </CardTitle>
            <CardDescription>
              {t('newProject.projectDataDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">{t('newProject.projectNameLabel')}</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t('newProject.projectNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">{t('newProject.clientLabel')}</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={clientsLoading ? t('common.loading') : t('validation.clientRequired')} />
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
                    {t('dashboard.noClients')}{' '}
                    <Button variant="link" className="h-auto p-0" onClick={() => navigate('/app/customers')}>
                      {t('newProject.addClient')}
                    </Button>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('newProject.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('newProject.descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              {voiceResult && voiceResult.items && voiceResult.items.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <Label>{t('newProject.voiceQuoteItems')}</Label>
                  <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                    {voiceResult.items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.name} ({item.qty} {item.unit})</span>
                        <span className="font-medium">{(item.qty * item.price).toLocaleString('pl-PL')} zł</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 transition-colors"
                size="lg"
                disabled={addProject.isPending}
              >
                {addProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('newProject.createProject')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}