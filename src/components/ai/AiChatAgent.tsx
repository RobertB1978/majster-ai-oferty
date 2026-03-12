import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  FileText,
  Calculator,
  HelpCircle,
  History,
  Trash2,
  Plus,
  Lock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAiChatHistory, useAiChatSessions, useSaveAiMessage, useDeleteChatSession } from '@/hooks/useAiChatHistory';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanGate } from '@/hooks/usePlanGate';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}


/** Map i18n language to BCP-47 speech recognition locale */
function getSpeechLocale(lang: string): string {
  const map: Record<string, string> = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA' };
  return map[lang.split('-')[0]] ?? 'pl-PL';
}

export function AiChatAgent() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canUseFeature } = usePlanGate();

  const quickActions = [
    { icon: FileText, label: t('ai.quickActions.prepareOffer'), prompt: t('ai.quickActions.prepareOfferPrompt') },
    { icon: Calculator, label: t('ai.quickActions.calculateCosts'), prompt: t('ai.quickActions.calculateCostsPrompt') },
    { icon: HelpCircle, label: t('ai.quickActions.pricingAdvice'), prompt: t('ai.quickActions.pricingAdvicePrompt') },
  ];
  const canUseAi = canUseFeature('ai');
  const [isDismissedForever, setIsDismissedForever] = useState(() => {
    return localStorage.getItem('hideChatWidget') === '1';
  });
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('ai.greeting'),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Defer queries until chat is opened to avoid unnecessary network requests on every route
  const { data: chatHistory } = useAiChatHistory(isOpen ? sessionId : undefined);
  const { data: sessions } = useAiChatSessions(isOpen);
  const saveMessage = useSaveAiMessage();
  const deleteChatSession = useDeleteChatSession();

  const { transcript, isListening, isSupported, startListening, stopListening, resetTranscript } = useVoiceToText({
    language: getSpeechLocale(i18n.language),
  });

  // Load chat history when session changes
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      const loadedMessages: Message[] = chatHistory.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(loadedMessages);
    }
  }, [chatHistory]);

  useEffect(() => {
    if (transcript && !isListening) {
      setInput(prev => prev + ' ' + transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message to history
    if (user) {
      saveMessage.mutate({ sessionId, role: 'user', content: content.trim() });
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-agent', {
        body: { 
          message: content.trim(),
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      // Edge function returned an error body (e.g. AI not configured)
      if (data?.error === 'AI_NOT_CONFIGURED') {
        throw new Error('AI_NOT_CONFIGURED');
      }

      const assistantContent = data?.response || t('ai.errorResponseFallback');
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message to history
      if (user) {
        saveMessage.mutate({ sessionId, role: 'assistant', content: assistantContent });
      }
    } catch (error: unknown) {
      console.error('AI Chat error:', error);

      const isNotConfigured =
        error instanceof Error && error.message === 'AI_NOT_CONFIGURED';

      if (isNotConfigured) {
        toast.error(t('ai.errorNotConfiguredToast'));
      } else {
        toast.error(t('ai.errorConnectionToast'));
      }

      const errorContent = isNotConfigured
        ? t('ai.errorNotConfiguredContent')
        : t('ai.errorGeneralContent');

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startNewSession = () => {
    setSessionId(crypto.randomUUID());
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: t('ai.greetingShort'),
        timestamp: new Date(),
      },
    ]);
    setShowHistory(false);
  };

  const loadSession = (id: string) => {
    setSessionId(id);
    setShowHistory(false);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteChatSession.mutateAsync(id);
    if (id === sessionId) {
      startNewSession();
    }
  };

  const handleDismissForever = () => {
    localStorage.setItem('hideChatWidget', '1');
    setIsDismissedForever(true);
    setIsOpen(false);
  };

  if (isDismissedForever) return null;

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed above-mobile-nav right-6 h-14 w-14 rounded-full shadow-xl lg:bottom-6',
          'bg-primary hover:bg-primary/90',
          'transition-all duration-200 hover:bg-primary/90',
          isOpen && 'hidden'
        )}
        style={{ zIndex: 'var(--z-overlay)' }}
        size="icon"
        aria-label={t('ai.title')}
        data-testid="chat-overlay"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </span>
        </span>
      </Button>

      {/* Chat panel */}
      {isOpen && !canUseAi && (
        <Card
          className={cn(
            'fixed above-mobile-nav right-6 w-[340px] max-w-[calc(100vw-48px)] shadow-2xl lg:bottom-6',
            'animate-scale-in origin-bottom-right',
            'border-primary/20'
          )}
          style={{ zIndex: 'var(--z-overlay)' }}
        >
          <CardHeader className="pb-3 bg-primary/10 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{t('ai.title')}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t('ai.subtitle')}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label={t('common.close')}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{t('ai.planLockTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('ai.planLockDesc')}
              </p>
            </div>
            <Button
              onClick={() => { setIsOpen(false); navigate('/app/plan'); }}
              className="gap-2 w-full"
            >
              <Zap className="h-4 w-4" />
              {t('ai.planLockUpgrade')}
            </Button>
          </CardContent>
        </Card>
      )}

      {isOpen && canUseAi && (
        <Card
          className={cn(
            'fixed above-mobile-nav right-6 w-[400px] max-w-[calc(100vw-48px)] shadow-2xl lg:bottom-6',
            'animate-scale-in origin-bottom-right',
            'border-primary/20'
          )}
          style={{ zIndex: 'var(--z-overlay)' }}
        >
          <CardHeader className="pb-3 bg-primary/10 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{t('ai.title')}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t('ai.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(!showHistory)}
                  aria-label={showHistory ? t('ai.history') : t('ai.chatHistory')}
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={startNewSession}
                  aria-label={t('ai.newConversation')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label={t('ai.closeAssistant')}>
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismissForever}
                  aria-label={t('common.dontShowAgain')}
                  title={t('common.dontShowAgain')}
                >
                  <X className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* History Panel */}
            {showHistory && (
              <div className="border-b p-3 max-h-48 overflow-auto bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">{t('ai.history')}</p>
                {sessions && sessions.length > 0 ? (
                  <div className="space-y-1">
                    {sessions.slice(0, 10).map((session) => (
                      <div
                        key={session.session_id}
                        onClick={() => loadSession(session.session_id)}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm',
                          'hover:bg-muted transition-colors',
                          session.session_id === sessionId && 'bg-primary/10'
                        )}
                      >
                        <span className="truncate flex-1">{session.first_message || t('ai.newConversation')}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          aria-label={t('common.delete')}
                          onClick={(e) => handleDeleteSession(session.session_id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">{t('ai.noHistory')}</p>
                )}
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 p-3 border-b overflow-x-auto custom-scrollbar">
              {quickActions.map((action, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="shrink-0 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => sendMessage(action.prompt)}
                >
                  <action.icon className="h-3 w-3 mr-1" />
                  {action.label}
                </Badge>
              ))}
            </div>

            {/* Messages */}
            <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3 animate-fade-in',
                      message.role === 'user' && 'flex-row-reverse'
                    )}
                  >
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      message.role === 'assistant'
                        ? 'bg-primary'
                        : 'bg-muted'
                    )}>
                      {message.role === 'assistant' ? (
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className={cn(
                      'rounded-2xl px-4 py-2.5 max-w-[80%]',
                      message.role === 'assistant' 
                        ? 'bg-muted text-foreground' 
                        : 'bg-primary text-primary-foreground'
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="rounded-2xl px-4 py-2.5 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t bg-muted/30">
              <div className="flex gap-2">
                {isSupported && (
                  <Button
                    type="button"
                    variant={isListening ? 'destructive' : 'outline'}
                    size="icon"
                    onClick={handleVoiceToggle}
                    className={cn(isListening && 'animate-pulse')}
                    aria-label={isListening ? t('common.stopRecording') : t('ai.voiceInput')}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? t('ai.listening') : t('ai.placeholder')}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="bg-primary hover:bg-primary/90"
                  aria-label={t('common.send')}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
