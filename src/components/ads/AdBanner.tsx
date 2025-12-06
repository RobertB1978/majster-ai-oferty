import { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  variant?: 'horizontal' | 'vertical' | 'inline';
  className?: string;
  onClose?: () => void;
  showClose?: boolean;
}

const mockAds = [
  {
    id: 1,
    title: 'Narzędzia budowlane',
    description: 'Sprawdź najnowsze promocje w sklepie budowlanym!',
    cta: 'Zobacz ofertę',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 2,
    title: 'Ubezpieczenia dla firm',
    description: 'Polisa OC dla rzemieślników już od 50 zł/mies.',
    cta: 'Porównaj oferty',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 3,
    title: 'Leasing maszyn',
    description: 'Nowy sprzęt bez wkładu własnego. Decyzja w 24h!',
    cta: 'Zapytaj o ofertę',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 4,
    title: 'Szkolenia BHP',
    description: 'Certyfikowane szkolenia online dla Twojego zespołu.',
    cta: 'Zapisz się',
    color: 'from-purple-500 to-pink-500',
  },
];

export function AdBanner({ variant = 'horizontal', className, onClose, showClose = true }: AdBannerProps) {
  const [currentAd, setCurrentAd] = useState(mockAds[0]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Rotate ads every 30 seconds
    const interval = setInterval(() => {
      setCurrentAd(mockAds[Math.floor(Math.random() * mockAds.length)]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (variant === 'vertical') {
    return (
      <div className={cn(
        'relative rounded-lg overflow-hidden border bg-gradient-to-b p-4 space-y-3',
        currentAd.color,
        className
      )}>
        {showClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 text-white/70 hover:text-white hover:bg-white/20"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <div className="text-xs text-white/60 uppercase tracking-wider">Reklama</div>
        <h3 className="font-bold text-white text-lg">{currentAd.title}</h3>
        <p className="text-sm text-white/90">{currentAd.description}</p>
        <Button size="sm" variant="secondary" className="w-full mt-2">
          {currentAd.cta}
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn(
        'relative rounded-lg overflow-hidden border bg-gradient-to-r p-3 flex items-center gap-4',
        currentAd.color,
        className
      )}>
        <div className="text-xs text-white/60 uppercase tracking-wider">Reklama</div>
        <div className="flex-1">
          <span className="font-semibold text-white">{currentAd.title}</span>
          <span className="text-white/90 mx-2">–</span>
          <span className="text-sm text-white/90">{currentAd.description}</span>
        </div>
        <Button size="sm" variant="secondary">
          {currentAd.cta}
        </Button>
        {showClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/20"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Default horizontal
  return (
    <div className={cn(
      'relative rounded-lg overflow-hidden border bg-gradient-to-r p-4 flex items-center justify-between gap-4',
      currentAd.color,
      className
    )}>
      {showClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 text-white/70 hover:text-white hover:bg-white/20"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <div className="flex items-center gap-4">
        <div className="text-xs text-white/60 uppercase tracking-wider">Reklama</div>
        <div>
          <h3 className="font-bold text-white">{currentAd.title}</h3>
          <p className="text-sm text-white/90">{currentAd.description}</p>
        </div>
      </div>
      <Button size="sm" variant="secondary" className="shrink-0">
        {currentAd.cta}
        <ExternalLink className="h-3 w-3 ml-1" />
      </Button>
    </div>
  );
}
