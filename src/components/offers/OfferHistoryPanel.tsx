import { useOfferSends } from '@/hooks/useOfferSends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

interface OfferHistoryPanelProps {
  projectId: string;
}

const statusConfig = {
  pending: { label: 'Oczekuje', icon: Clock, className: 'bg-warning/10 text-warning' },
  sent: { label: 'Wysłano', icon: CheckCircle, className: 'bg-success/10 text-success' },
  failed: { label: 'Błąd', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
};

export function OfferHistoryPanel({ projectId }: OfferHistoryPanelProps) {
  const { data: sends, isLoading } = useOfferSends(projectId);

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
          Historia wysyłek ofert
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
                    {new Date(send.sent_at).toLocaleString('pl-PL')}
                  </p>
                  {send.subject && (
                    <p className="text-xs text-muted-foreground">
                      Temat: {send.subject}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Phase 5C: PDF link if available */}
                  {send.pdf_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(send.pdf_url!, '_blank', 'noopener,noreferrer')}
                      title="Otwórz PDF oferty"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      PDF
                    </Button>
                  )}
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
