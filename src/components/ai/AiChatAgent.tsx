import { useState, useRef, useEffect } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickActions = [
  { icon: FileText, label: 'Przygotuj ofertę', prompt: 'Przygotuj ofertę na remont łazienki 10m2' },
  { icon: Calculator, label: 'Oblicz koszty', prompt: 'Oblicz koszty materiałów na malowanie pokoju 20m2' },
  { icon: HelpCircle, label: 'Porady cenowe', prompt: 'Jakie są aktualne ceny usług hydraulicznych?' },
];

export function AiChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Cześć! Jestem Twoim asystentem Majster.AI. Mogę pomóc Ci:\n\n• Przygotować oferty i wyceny\n• Obliczyć koszty materiałów\n• Odpowiedzieć na pytania o ceny usług\n• Doradzić w kwestiach branżowych\n\nJak mogę Ci dzisiaj pomóc?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { transcript, isListening, isSupported, startListening, stopListening, resetTranscript } = useVoiceToText({
    language: 'pl-PL',
  });

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

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-agent', {
        body: { 
          message: content.trim(),
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.response || 'Przepraszam, nie udało się przetworzyć odpowiedzi.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI Chat error:', error);
      toast.error('Błąd połączenia z AI');
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę.',
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

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl',
          'bg-gradient-to-br from-primary to-primary-glow hover:shadow-glow',
          'transition-all duration-300 hover:scale-110',
          isOpen && 'hidden'
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-glow opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary-glow items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </span>
        </span>
      </Button>

      {/* Chat panel */}
      {isOpen && (
        <Card className={cn(
          'fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] shadow-2xl',
          'animate-scale-in origin-bottom-right',
          'border-primary/20'
        )}>
          <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Asystent AI</CardTitle>
                  <p className="text-xs text-muted-foreground">Majster.AI</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
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
                        ? 'bg-gradient-to-br from-primary to-primary-glow' 
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow">
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
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? 'Słucham...' : 'Napisz wiadomość...'}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-br from-primary to-primary-glow hover:opacity-90"
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
