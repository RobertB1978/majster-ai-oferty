import { useOfferSends, useUpdateOfferSend, type OfferTrackingStatus } from '@/hooks/useOfferSends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, Loader2, CheckCircle, XCircle, Clock, FileText, Eye, ThumbsUp, ThumbsDown, MoreVertical } from 'lucide-react';

interface OfferHistoryPanelProps {
  projectId: string;
}

const statusConfig = {
  pending: { label: 'Oczekuje', icon: Clock, className: 'bg-warning/10 text-warning' },
  sent: { label: 'Wysłano', icon: CheckCircle, className: 'bg-success/10 text-success' },
  failed: { label: 'Błąd', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
};

const trackingStatusConfig = {
  sent: { label: 'Wysłano', icon: Mail, className: 'bg-blue-500/10 text-blue-500' },
  opened: { label: 'Otwarto', icon: Eye, className: 'bg-purple-500/10 text-purple-500' },
  pdf_viewed: { label: 'Obejrzano PDF', icon: FileText, className: 'bg-indigo-500/10 text-indigo-500' },
  accepted: { label: 'Zaakceptowano', icon: ThumbsUp, className: 'bg-green-500/10 text-green-500' },
  rejected: { label: 'Odrzucono', icon: ThumbsDown, className: 'bg-red-500/10 text-red-500' },
};

export function OfferHistoryPanel({ projectId }: OfferHistoryPanelProps) {
  const { data: sends, isLoading } = useOfferSends(projectId);
  const updateOfferSend = useUpdateOfferSend();

  const handleStatusChange = (sendId: string, newStatus: OfferTrackingStatus) => {
    updateOfferSend.mutate({
      id: sendId,
      projectId,
      tracking_status: newStatus,
    });
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
          Historia wysyłek ofert
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sends.map((send) => {
            const status = statusConfig[send.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = status.icon;

            // Phase 6A: Use tracking_status for business status, default to 'sent' if null
            const trackingStatus = send.tracking_status || 'sent';
            const trackingConfig = trackingStatusConfig[trackingStatus as keyof typeof trackingStatusConfig];
            const TrackingIcon = trackingConfig.icon;

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

                  {/* Phase 6A: Show tracking status with dropdown to change */}
                  <Badge className={trackingConfig.className}>
                    <TrackingIcon className="mr-1 h-3 w-3" />
                    {trackingConfig.label}
                  </Badge>

                  {/* Phase 6A: Dropdown menu for status changes */}
                  {send.status === 'sent' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Zmień status"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(send.id, 'accepted')}>
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Zaakceptowano
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(send.id, 'rejected')}>
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          Odrzucono
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
