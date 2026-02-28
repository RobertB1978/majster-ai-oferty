import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pl, enUS, uk } from 'date-fns/locale';
import { CheckCircle, Eye, Send, XCircle, Ban, Clock, FileText } from 'lucide-react';
import type { OfferApproval } from '@/hooks/useOfferApprovals';

const DATE_LOCALES: Record<string, Locale> = { pl, en: enUS, uk };

interface OfferTrackingTimelineProps {
  approval: OfferApproval;
}

export function OfferTrackingTimeline({ approval }: OfferTrackingTimelineProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALES[i18n.language] ?? enUS;

  const events = [];

  events.push({
    key: 'created',
    label: t('offers.tracking.created'),
    timestamp: approval.created_at,
    icon: FileText,
    colorClass: 'text-muted-foreground',
  });

  if (approval.viewed_at) {
    events.push({
      key: 'viewed',
      label: t('offers.tracking.clientOpened'),
      timestamp: approval.viewed_at,
      icon: Eye,
      colorClass: 'text-blue-500',
    });
  } else if (['sent', 'viewed', 'accepted', 'approved', 'rejected'].includes(approval.status)) {
    events.push({
      key: 'sent',
      label: t('offers.tracking.sentToClient'),
      timestamp: approval.created_at,
      icon: Send,
      colorClass: 'text-muted-foreground',
    });
  }

  const acceptedAt = approval.accepted_at ?? approval.approved_at;
  if (acceptedAt && ['accepted', 'approved'].includes(approval.status)) {
    events.push({
      key: 'accepted',
      label: approval.accepted_via === 'email_1click'
        ? t('offers.tracking.acceptedEmail')
        : t('offers.tracking.accepted'),
      timestamp: acceptedAt,
      icon: CheckCircle,
      colorClass: 'text-green-500',
    });
  }

  if (approval.status === 'rejected') {
    const rejectedAt = approval.approved_at ?? approval.created_at;
    events.push({
      key: 'rejected',
      label: t('offers.tracking.rejected'),
      timestamp: rejectedAt,
      icon: XCircle,
      colorClass: 'text-destructive',
    });
  }

  if (approval.withdrawn_at) {
    events.push({
      key: 'withdrawn',
      label: t('offers.tracking.withdrawn'),
      timestamp: approval.withdrawn_at,
      icon: Ban,
      colorClass: 'text-muted-foreground',
    });
  }

  if (approval.status === 'expired') {
    const expiredAt = approval.valid_until ?? approval.expires_at ?? approval.created_at;
    events.push({
      key: 'expired',
      label: t('offers.tracking.expired'),
      timestamp: expiredAt,
      icon: Clock,
      colorClass: 'text-amber-500',
    });
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (sorted.length <= 1) return null;

  return (
    <div className="pt-3 border-t border-border/50">
      <p className="text-xs font-medium text-muted-foreground mb-2">{t('offers.tracking.activity')}</p>
      <ol className="space-y-2">
        {sorted.map((event, idx) => {
          const Icon = event.icon;
          const isLast = idx === sorted.length - 1;
          return (
            <li key={event.key} className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${event.colorClass}`} />
                {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-0.5 min-h-[8px]" />}
              </div>
              <div className="pb-1">
                <p className="text-xs font-medium leading-tight">{event.label}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.timestamp), 'dd MMM yyyy, HH:mm', { locale: dateLocale })}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
