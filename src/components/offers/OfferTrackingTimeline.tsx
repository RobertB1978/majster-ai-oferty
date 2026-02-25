import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CheckCircle, Eye, Send, XCircle, Ban, Clock, FileText } from 'lucide-react';
import type { OfferApproval } from '@/hooks/useOfferApprovals';

interface TimelineEvent {
  key: string;
  label: string;
  timestamp: string;
  icon: React.ElementType;
  colorClass: string;
}

interface OfferTrackingTimelineProps {
  approval: OfferApproval;
}

function buildEvents(approval: OfferApproval): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    key: 'created',
    label: 'Oferta utworzona',
    timestamp: approval.created_at,
    icon: FileText,
    colorClass: 'text-muted-foreground',
  });

  if (approval.viewed_at) {
    events.push({
      key: 'viewed',
      label: 'Klient otworzył ofertę',
      timestamp: approval.viewed_at,
      icon: Eye,
      colorClass: 'text-blue-500',
    });
  } else if (['sent', 'viewed', 'accepted', 'approved', 'rejected'].includes(approval.status)) {
    events.push({
      key: 'sent',
      label: 'Oferta wysłana do klienta',
      timestamp: approval.created_at,
      icon: Send,
      colorClass: 'text-muted-foreground',
    });
  }

  const acceptedAt = approval.accepted_at ?? approval.approved_at;
  if (acceptedAt && ['accepted', 'approved'].includes(approval.status)) {
    events.push({
      key: 'accepted',
      label: approval.accepted_via === 'email_1click' ? 'Zaakceptowana (e-mail)' : 'Zaakceptowana',
      timestamp: acceptedAt,
      icon: CheckCircle,
      colorClass: 'text-green-500',
    });
  }

  if (approval.status === 'rejected') {
    const rejectedAt = approval.approved_at ?? approval.created_at;
    events.push({
      key: 'rejected',
      label: 'Odrzucona przez klienta',
      timestamp: rejectedAt,
      icon: XCircle,
      colorClass: 'text-destructive',
    });
  }

  if (approval.withdrawn_at) {
    events.push({
      key: 'withdrawn',
      label: 'Oferta wycofana',
      timestamp: approval.withdrawn_at,
      icon: Ban,
      colorClass: 'text-muted-foreground',
    });
  }

  if (approval.status === 'expired') {
    const expiredAt = approval.valid_until ?? approval.expires_at ?? approval.created_at;
    events.push({
      key: 'expired',
      label: 'Oferta wygasła',
      timestamp: expiredAt,
      icon: Clock,
      colorClass: 'text-amber-500',
    });
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function OfferTrackingTimeline({ approval }: OfferTrackingTimelineProps) {
  const events = buildEvents(approval);

  if (events.length <= 1) return null;

  return (
    <div className="pt-3 border-t border-border/50">
      <p className="text-xs font-medium text-muted-foreground mb-2">Aktywność</p>
      <ol className="space-y-2">
        {events.map((event, idx) => {
          const Icon = event.icon;
          const isLast = idx === events.length - 1;
          return (
            <li key={event.key} className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${event.colorClass}`} />
                {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-0.5 min-h-[8px]" />}
              </div>
              <div className="pb-1">
                <p className="text-xs font-medium leading-tight">{event.label}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.timestamp), 'dd MMM yyyy, HH:mm', { locale: pl })}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
