import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeartPulse, Wifi, WifiOff, HardDrive, Clock } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export default function AdminDiagnosticsPage() {
  const online = useOnlineStatus();
  const { config, versions } = useConfig();
  const storageUsed = JSON.stringify(config).length;

  return (
    <>
      <Helmet>
        <title>Diagnostyka | Owner Console | Majster.AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <HeartPulse className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Diagnostyka systemu</h1>
            <p className="text-sm text-muted-foreground">Status, metryki, konfiguracja</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Połączenie</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              {online ? (
                <><Wifi className="h-5 w-5 text-green-600" /><span className="font-medium">Online</span></>
              ) : (
                <><WifiOff className="h-5 w-5 text-destructive" /><span className="font-medium">Offline</span></>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Wersja konfiguracji</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-lg">{config.version}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Historia wersji</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{versions.length} wersji</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rozmiar konfiguracji</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{(storageUsed / 1024).toFixed(1)} KB</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Elementy nawigacji</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{config.navigation.mainItems.length}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Plany taryfowe</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{config.plans.tiers.length}</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
