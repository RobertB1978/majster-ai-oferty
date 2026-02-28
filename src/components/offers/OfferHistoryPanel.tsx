import { useTranslation } from 'react-i18next';
import { useOfferSends } from '@/hooks/useOfferSends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface OfferHistoryPanelProps {
  projectId: string;
}

export function OfferHistoryPanel({ projectId }: OfferHistoryPanelProps) {
  const { t } = useTranslation();
  const { data: sends, isLoading } = useOfferSends(projectId);

  const statusConfig = {
    pending: { label: t('common.status'), icon: Clock, className: 'bg-warning/10 text-warning' },
    sent: { label: t('offers.history.sent'), icon: CheckCircle, className: 'bg-success/10 text-success' },
    failed: { label: t('offers.history.failed'), icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!sends || sends.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          {t('offers.history.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sends.map((send) => {
            const status = statusConfig[send.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div
                key={send.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{send.client_email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(send.sent_at).toLocaleString()}
                  </p>
                  {send.subject && (
                    <p className="text-xs text-muted-foreground">
                      {send.subject}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={status.className}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>
                {send.error_message && (
                  <p className="w-full text-xs text-destructive">{send.error_message}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
