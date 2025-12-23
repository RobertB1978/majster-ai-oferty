import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  Play, 
  Pause, 
  RefreshCw, 
  Mail, 
  Calendar, 
  Database,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  scheduleText: string;
  icon: React.ReactNode;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  functionName: string;
  requiresSecret?: string;
}

export function AdminCronManager() {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [jobResults, setJobResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const cronJobs: CronJob[] = [
    {
      id: 'expiring-offers',
      name: 'Przypomnienia o wygasających ofertach',
      description: 'Wysyła email do klientów z ofertami wygasającymi za 3 dni',
      schedule: '0 9 * * *',
      scheduleText: 'Codziennie o 9:00',
      icon: <Mail className="h-5 w-5" />,
      enabled: true,
      functionName: 'send-expiring-offer-reminders',
      requiresSecret: 'RESEND_API_KEY',
    },
    {
      id: 'subscription-check',
      name: 'Kontrola subskrypcji',
      description: 'Sprawdza wygasające subskrypcje i wysyła powiadomienia',
      schedule: '0 8 * * *',
      scheduleText: 'Codziennie o 8:00',
      icon: <Calendar className="h-5 w-5" />,
      enabled: true,
      functionName: 'check-subscriptions',
    },
    {
      id: 'database-cleanup',
      name: 'Czyszczenie bazy danych',
      description: 'Usuwa wygasłe tokeny i stare logi (30+ dni)',
      schedule: '0 3 * * 0',
      scheduleText: 'Co niedzielę o 3:00',
      icon: <Database className="h-5 w-5" />,
      enabled: false,
      functionName: 'database-cleanup',
    },
  ];

  const handleRunNow = async (job: CronJob) => {
    setIsRunning(job.id);
    setJobResults(prev => ({ ...prev, [job.id]: { success: false, message: '' } }));

    try {
      const { data, error } = await supabase.functions.invoke(job.functionName, {
        body: { manual: true },
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; message?: string; sent?: number; skipped?: boolean };
      
      if (result.skipped) {
        setJobResults(prev => ({
          ...prev,
          [job.id]: {
            success: false,
            message: `Wymagany klucz: ${job.requiresSecret}`,
          },
        }));
        toast.warning(`Zadanie pominięte - brak klucza ${job.requiresSecret}`);
      } else if (result.success) {
        setJobResults(prev => ({
          ...prev,
          [job.id]: {
            success: true,
            message: result.message || `Wysłano ${result.sent || 0} wiadomości`,
          },
        }));
        toast.success(result.message || 'Zadanie wykonane pomyślnie');
      } else {
        throw new Error(result.message || 'Nieznany błąd');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      setJobResults(prev => ({
        ...prev,
        [job.id]: {
          success: false,
          message: errorMessage,
        },
      }));
      toast.error(`Błąd: ${errorMessage}`);
    } finally {
      setIsRunning(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Zadania CRON
        </CardTitle>
        <CardDescription>
          Automatyczne zadania uruchamiane według harmonogramu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Konfiguracja CRON</AlertTitle>
          <AlertDescription>
            Aby włączyć automatyczne zadania CRON, skonfiguruj je w ustawieniach bazy danych używając <code className="bg-muted px-1 rounded">pg_cron</code> i <code className="bg-muted px-1 rounded">pg_net</code>.
            Możesz też uruchomić zadania ręcznie poniżej.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {cronJobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {job.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{job.name}</h4>
                    {job.requiresSecret && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              Wymaga klucza
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Wymaga: {job.requiresSecret}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{job.scheduleText}</span>
                    <code className="bg-muted px-1 rounded">{job.schedule}</code>
                  </div>
                  {jobResults[job.id] && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${jobResults[job.id].success ? 'text-success' : 'text-destructive'}`}>
                      {jobResults[job.id].success ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      <span>{jobResults[job.id].message}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`cron-${job.id}`}
                    checked={job.enabled}
                    disabled
                  />
                  <Label htmlFor={`cron-${job.id}`} className="text-xs text-muted-foreground">
                    {job.enabled ? 'Aktywne' : 'Wyłączone'}
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunNow(job)}
                  disabled={isRunning === job.id}
                >
                  {isRunning === job.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Uruchamianie...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Uruchom teraz
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Instrukcja konfiguracji CRON</h4>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>1. Włącz rozszerzenia <code className="bg-muted px-1 rounded">pg_cron</code> i <code className="bg-muted px-1 rounded">pg_net</code> w bazie danych</p>
            <p>2. Dodaj zadanie SQL:</p>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`SELECT cron.schedule(
  'send-expiring-offer-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/send-expiring-offer-reminders',
    headers := '{"Authorization": "Bearer <ANON_KEY>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);`}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
