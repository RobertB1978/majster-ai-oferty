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
      name: t('admin.cron.expiringOffers.name'),
      description: t('admin.cron.expiringOffers.description'),
      schedule: '0 9 * * *',
      scheduleText: t('admin.cron.expiringOffers.scheduleText'),
      icon: <Mail className="h-5 w-5" />,
      enabled: true,
      functionName: 'send-expiring-offer-reminders',
      requiresSecret: 'RESEND_API_KEY',
    },
    {
      id: 'subscription-check',
      name: t('admin.cron.subscriptionCheck.name'),
      description: t('admin.cron.subscriptionCheck.description'),
      schedule: '0 8 * * *',
      scheduleText: t('admin.cron.subscriptionCheck.scheduleText'),
      icon: <Calendar className="h-5 w-5" />,
      enabled: true,
      functionName: 'check-subscriptions',
    },
    {
      id: 'database-cleanup',
      name: t('admin.cron.databaseCleanup.name'),
      description: t('admin.cron.databaseCleanup.description'),
      schedule: '0 3 * * 0',
      scheduleText: t('admin.cron.databaseCleanup.scheduleText'),
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
            message: t('admin.cron.requiredKey', { key: job.requiresSecret }),
          },
        }));
        toast.warning(t('admin.toast.cronSkipped', { key: job.requiresSecret }));
      } else if (result.success) {
        setJobResults(prev => ({
          ...prev,
          [job.id]: {
            success: true,
            message: result.message || t('admin.cron.sentMessages', { count: result.sent || 0 }),
          },
        }));
        toast.success(result.message || t('admin.toast.cronSuccess'));
      } else {
        throw new Error(result.message || t('common.unknownError'));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError');
      setJobResults(prev => ({
        ...prev,
        [job.id]: {
          success: false,
          message: errorMessage,
        },
      }));
      toast.error(t('admin.toast.cronError', { message: errorMessage }));
    } finally {
      setIsRunning(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('admin.cron.title')}
        </CardTitle>
        <CardDescription>
          {t('admin.cron.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t('admin.cron.configTitle')}</AlertTitle>
          <AlertDescription>
            {t('admin.cron.configDescription')}
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
                              {t('admin.cron.requiresKey')}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('admin.cron.requires', { key: job.requiresSecret })}</p>
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
                    {job.enabled ? t('admin.cron.active') : t('admin.cron.disabled')}
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
                      {t('admin.cron.running')}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      {t('admin.cron.runNow')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">{t('admin.cron.setupGuide')}</h4>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>1. {t('admin.cron.setupStep1')}</p>
            <p>2. {t('admin.cron.setupStep2')}</p>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`SELECT cron.schedule(
  'send-expiring-offer-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xwxvqhhnozfrjcjmcltv.supabase.co/functions/v1/send-expiring-offer-reminders',
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
