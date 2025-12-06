import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarConnection {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
}

export function CalendarSync() {
  const { t } = useTranslation();
  const [connections, setConnections] = useState<CalendarConnection[]>([
    { id: 'google', name: 'Google Calendar', icon: '📅', connected: false },
    { id: 'outlook', name: 'Microsoft Outlook', icon: '📧', connected: false },
    { id: 'apple', name: 'Apple Calendar', icon: '🍎', connected: false },
  ]);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: 15,
    syncDeadlines: true,
    syncMeetings: true,
    syncReminders: false,
  });

  const handleConnect = (id: string) => {
    // In production, this would redirect to OAuth flow
    toast.info(`Integracja z ${id} wymaga konfiguracji OAuth. Wkrótce dostępne!`);
  };

  const handleDisconnect = (id: string) => {
    setConnections(prev =>
      prev.map(conn =>
        conn.id === id ? { ...conn, connected: false, lastSync: undefined } : conn
      )
    );
    toast.success('Rozłączono kalendarz');
  };

  const handleSync = () => {
    toast.info('Synchronizacja wymaga połączenia z kalendarzem');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Synchronizacja kalendarzy
              </CardTitle>
              <CardDescription>
                Połącz zewnętrzne kalendarze, aby synchronizować wydarzenia
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleSync}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchronizuj
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {connections.map(conn => (
            <div
              key={conn.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{conn.icon}</span>
                <div>
                  <p className="font-medium">{conn.name}</p>
                  {conn.connected && conn.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Ostatnia sync: {conn.lastSync}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {conn.connected ? (
                  <>
                    <Badge variant="outline" className="text-success border-success">
                      <Check className="h-3 w-3 mr-1" />
                      Połączono
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(conn.id)}
                    >
                      Rozłącz
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => handleConnect(conn.id)}>
                    Połącz
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ustawienia synchronizacji</CardTitle>
          <CardDescription>
            Skonfiguruj jak mają być synchronizowane wydarzenia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatyczna synchronizacja</Label>
              <p className="text-sm text-muted-foreground">
                Automatycznie synchronizuj co {syncSettings.syncInterval} minut
              </p>
            </div>
            <Switch
              checked={syncSettings.autoSync}
              onCheckedChange={(checked) =>
                setSyncSettings(prev => ({ ...prev, autoSync: checked }))
              }
            />
          </div>

          <div className="space-y-4">
            <Label>Typy wydarzeń do synchronizacji</Label>
            
            <div className="flex items-center justify-between">
              <Label className="font-normal">Terminy (deadlines)</Label>
              <Switch
                checked={syncSettings.syncDeadlines}
                onCheckedChange={(checked) =>
                  setSyncSettings(prev => ({ ...prev, syncDeadlines: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="font-normal">Spotkania</Label>
              <Switch
                checked={syncSettings.syncMeetings}
                onCheckedChange={(checked) =>
                  setSyncSettings(prev => ({ ...prev, syncMeetings: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="font-normal">Przypomnienia</Label>
              <Switch
                checked={syncSettings.syncReminders}
                onCheckedChange={(checked) =>
                  setSyncSettings(prev => ({ ...prev, syncReminders: checked }))
                }
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Aby włączyć synchronizację, najpierw połącz co najmniej jeden kalendarz zewnętrzny.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
