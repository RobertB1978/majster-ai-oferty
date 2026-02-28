import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  variant?: 'default' | 'minimal' | 'fullscreen';
}

export function LoadingScreen({ message, variant = 'default' }: LoadingScreenProps) {
  const { t } = useTranslation();
  const displayMessage = message ?? t('common.loading');
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-8 w-8 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">{displayMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-500",
      variant === 'fullscreen' ? 'fixed inset-0 z-50' : 'min-h-[60vh]'
    )}>
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Animated Logo/Loader */}
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary shadow-sm animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-xl border-2 border-white/30 animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          {/* Orbiting dots */}
          <div className="absolute -inset-4 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-primary" />
          </div>
          <div className="absolute -inset-4 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
        </div>
        
        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-lg font-semibold text-foreground">{displayMessage}</span>
            <span className="flex gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Majster.AI</p>
        </div>
        
        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full animate-pulse"
            style={{
              animation: 'loading-progress 1.5s ease-in-out infinite'
            }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes loading-progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-10 w-10 rounded-full bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
            <div className="h-6 w-16 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
