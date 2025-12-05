import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineFallback() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="mx-4 max-w-md text-center">
        <WifiOff className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold">Jesteś offline</h2>
        <p className="text-muted-foreground">
          Część funkcji Majster.AI jest niedostępna bez połączenia z internetem.
          Sprawdź połączenie i spróbuj ponownie.
        </p>
      </div>
    </div>
  );
}
