import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, Bot, PenTool, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
// import { supabase } from '@/integrations/supabase/client';

interface QuoteCreationHubProps {
  _onVoiceQuoteCreated?: (result: unknown) => void;
}

type CreationMode = 'idle' | 'voice' | 'ai' | 'manual';

export function QuoteCreationHub({ _onVoiceQuoteCreated }: QuoteCreationHubProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreationMode>('idle');
  const [_isRecording, _setIsRecording] = useState(false);
  const [isProcessing, _setIsProcessing] = useState(false);

  const handleVoiceClick = () => {
    setMode('voice');
    toast.info(t('dashboard.quoteCreation.voiceStarting'), {
      description: t('dashboard.quoteCreation.voiceRedirect')
    });
    setTimeout(() => {
      navigate('/projects/new', { state: { mode: 'voice' } });
    }, 800);
  };

  const handleAiClick = () => {
    setMode('ai');
    toast.info(t('dashboard.quoteCreation.aiOpening'), {
      description: t('dashboard.quoteCreation.voiceRedirect')
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
      label: t('dashboard.quoteCreation.voiceTitle'),
      sublabel: t('dashboard.quoteCreation.voiceDesc'),
      onClick: handleVoiceClick,
      gradient: 'from-destructive to-destructive',
      hoverGradient: 'hover:from-destructive/90 hover:to-destructive/90',
      shadow: 'shadow-destructive/20',
      ring: 'ring-destructive/50',
      pulse: true
    },
    {
      id: 'ai',
      icon: Bot,
      label: t('dashboard.quoteCreation.aiTitle'),
      sublabel: t('dashboard.quoteCreation.aiDesc'),
      onClick: handleAiClick,
      gradient: 'from-primary to-primary',
      hoverGradient: 'hover:from-primary/90 hover:to-primary/90',
      shadow: 'shadow-primary/20',
      ring: 'ring-primary/50',
      pulse: false
    },
    {
      id: 'manual',
      icon: PenTool,
      label: t('dashboard.quoteCreation.manualTitle'),
      sublabel: t('dashboard.quoteCreation.manualDesc'),
      onClick: handleManualClick,
      gradient: 'from-success to-success',
      hoverGradient: 'hover:from-success/90 hover:to-success/90',
      shadow: 'shadow-success/20',
      ring: 'ring-success/50',
      pulse: false
    }
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('dashboard.quoteCreation.title')}</h3>
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
                <span className="absolute inset-0 rounded-full bg-destructive/50 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-destructive/30 animate-pulse" />
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

            {/* Hover overlay */}
            <div className={cn(
              "absolute inset-0 rounded-full opacity-0",
              "bg-white/10",
              "transition-opacity duration-200",
              "group-hover:opacity-100"
            )} />
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        {t('dashboard.quoteCreation.chooseMethod')}
      </p>
    </div>
  );
}
