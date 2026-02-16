import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, Bot, PenTool, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
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
      navigate('/app/jobs/new', { state: { mode: 'voice' } });
    }, 800);
  };

  const handleAiClick = () => {
    setMode('ai');
    toast.info(t('dashboard.quoteCreation.aiOpening'), {
      description: t('dashboard.quoteCreation.voiceRedirect')
    });
    setTimeout(() => {
      navigate('/app/jobs/new', { state: { mode: 'ai' } });
    }, 800);
  };

  const handleManualClick = () => {
    setMode('manual');
    navigate('/app/jobs/new', { state: { mode: 'manual' } });
  };

  const buttons = [
    {
      id: 'voice' as const,
      icon: Mic,
      label: t('dashboard.quoteCreation.voiceTitle'),
      sublabel: t('dashboard.quoteCreation.voiceDesc'),
      onClick: handleVoiceClick
    },
    {
      id: 'ai' as const,
      icon: Bot,
      label: t('dashboard.quoteCreation.aiTitle'),
      sublabel: t('dashboard.quoteCreation.aiDesc'),
      onClick: handleAiClick
    },
    {
      id: 'manual' as const,
      icon: PenTool,
      label: t('dashboard.quoteCreation.manualTitle'),
      sublabel: t('dashboard.quoteCreation.manualDesc'),
      onClick: handleManualClick
    }
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">{t('dashboard.quoteCreation.title')}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {buttons.map((btn) => {
          const isActive = mode === btn.id;
          const colorClasses = {
            voice: {
              icon: 'text-destructive',
              iconBg: 'bg-destructive/10',
              border: 'border-destructive/20',
              hoverBorder: 'hover:border-destructive/50',
              activeBorder: 'border-destructive',
              text: 'text-destructive'
            },
            ai: {
              icon: 'text-primary',
              iconBg: 'bg-primary/10',
              border: 'border-primary/20',
              hoverBorder: 'hover:border-primary/50',
              activeBorder: 'border-primary',
              text: 'text-primary'
            },
            manual: {
              icon: 'text-success',
              iconBg: 'bg-success/10',
              border: 'border-success/20',
              hoverBorder: 'hover:border-success/50',
              activeBorder: 'border-success',
              text: 'text-success'
            }
          }[btn.id];

          return (
            <Card
              key={btn.id}
              onClick={btn.onClick}
              className={cn(
                "relative cursor-pointer transition-all duration-200",
                "border-2",
                isActive ? colorClasses.activeBorder : colorClasses.border,
                !isActive && colorClasses.hoverBorder,
                "hover:shadow-md",
                isProcessing && "opacity-50 cursor-not-allowed",
                "group"
              )}
            >
              <CardContent className="p-6">
                {/* Icon */}
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl mb-4",
                  colorClasses.iconBg,
                  "transition-transform duration-200",
                  "group-hover:scale-105"
                )}>
                  <btn.icon className={cn("h-6 w-6", colorClasses.icon)} />
                </div>

                {/* Title */}
                <h4 className={cn(
                  "font-semibold text-base mb-2",
                  isActive ? colorClasses.text : "text-foreground"
                )}>
                  {btn.label}
                </h4>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">
                  {btn.sublabel}
                </p>

                {/* Arrow indicator */}
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  colorClasses.text,
                  "transition-transform duration-200",
                  "group-hover:translate-x-1"
                )}>
                  <span>Start</span>
                  <ArrowRight className="h-3 w-3" />
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      btn.id === 'voice' ? 'bg-destructive' :
                      btn.id === 'ai' ? 'bg-primary' : 'bg-success',
                      "animate-pulse"
                    )} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {t('dashboard.quoteCreation.chooseMethod')}
      </p>
    </div>
  );
}
