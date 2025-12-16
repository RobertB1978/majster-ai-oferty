import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Bot, PenTool, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface QuoteCreationHubProps {
  onVoiceQuoteCreated?: (result: unknown) => void;
}

type CreationMode = 'idle' | 'voice' | 'ai' | 'manual';

export function QuoteCreationHub({ onVoiceQuoteCreated }: QuoteCreationHubProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreationMode>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceClick = () => {
    setMode('voice');
    toast.info('Rozpocznij nagrywanie głosowe na stronie tworzenia oferty', {
      description: 'Za chwilę zostaniesz przekierowany...'
    });
    setTimeout(() => {
      navigate('/projects/new', { state: { mode: 'voice' } });
    }, 800);
  };

  const handleAiClick = () => {
    setMode('ai');
    toast.info('Otwieranie asystenta AI...', {
      description: 'Za chwilę zostaniesz przekierowany...'
    });
    setTimeout(() => {
      navigate('/projects/new', { state: { mode: 'ai' } });
    }, 800);
  };

  const handleManualClick = () => {
    setMode('manual');
    navigate('/projects/new', { state: { mode: 'manual' } });
  };

  const buttons = [
    {
      id: 'voice',
      icon: Mic,
      label: 'Głosowo',
      sublabel: 'Powiedz co wycenić',
      onClick: handleVoiceClick,
      gradient: 'from-rose-500 to-orange-500',
      hoverGradient: 'hover:from-rose-600 hover:to-orange-600',
      shadow: 'shadow-rose-500/30',
      ring: 'ring-rose-500/50',
      pulse: true
    },
    {
      id: 'ai',
      icon: Bot,
      label: 'Asystent AI',
      sublabel: 'Napisz lub rozmawiaj',
      onClick: handleAiClick,
      gradient: 'from-violet-500 to-purple-500',
      hoverGradient: 'hover:from-violet-600 hover:to-purple-600',
      shadow: 'shadow-violet-500/30',
      ring: 'ring-violet-500/50',
      pulse: false
    },
    {
      id: 'manual',
      icon: PenTool,
      label: 'Ręcznie',
      sublabel: 'Wypełnij formularz',
      onClick: handleManualClick,
      gradient: 'from-emerald-500 to-teal-500',
      hoverGradient: 'hover:from-emerald-600 hover:to-teal-600',
      shadow: 'shadow-emerald-500/30',
      ring: 'ring-emerald-500/50',
      pulse: false
    }
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Stwórz nową ofertę</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            onClick={btn.onClick}
            disabled={isProcessing}
            className={cn(
              "group relative flex flex-col items-center justify-center",
              "aspect-square rounded-full",
              "bg-gradient-to-br",
              btn.gradient,
              btn.hoverGradient,
              "shadow-xl",
              btn.shadow,
              "transition-all duration-300 ease-out",
              "hover:scale-110 hover:shadow-2xl",
              "active:scale-95",
              "focus:outline-none focus:ring-4",
              btn.ring,
              "disabled:opacity-50 disabled:cursor-not-allowed",
              mode === btn.id && "scale-110 ring-4"
            )}
          >
            {/* Pulse animation for voice button */}
            {btn.pulse && (
              <>
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500/50 to-orange-500/50 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-gradient-to-br from-rose-500/30 to-orange-500/30 animate-pulse" />
              </>
            )}
            
            {/* Icon */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <btn.icon className={cn(
                "h-8 w-8 sm:h-10 sm:w-10 text-white",
                "transition-transform duration-300",
                "group-hover:scale-110"
              )} />
              <span className="text-white font-semibold text-xs sm:text-sm">
                {btn.label}
              </span>
              <span className="text-white/70 text-[10px] sm:text-xs hidden sm:block">
                {btn.sublabel}
              </span>
            </div>
            
            {/* Glow effect on hover */}
            <div className={cn(
              "absolute inset-0 rounded-full opacity-0",
              "bg-white/20",
              "transition-opacity duration-300",
              "group-hover:opacity-100"
            )} />
          </button>
        ))}
      </div>
      
      <p className="text-center text-sm text-muted-foreground mt-4">
        Wybierz sposób tworzenia oferty
      </p>
    </div>
  );
}
