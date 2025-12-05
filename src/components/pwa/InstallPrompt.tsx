import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || dismissed) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 animate-slide-in sm:left-auto sm:right-4 sm:w-80">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold">Zainstaluj Majster.AI</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Dodaj aplikację do ekranu głównego dla szybszego dostępu.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" />
            Zainstaluj
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Później
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
