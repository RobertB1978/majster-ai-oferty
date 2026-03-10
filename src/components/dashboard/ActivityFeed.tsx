import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  FileText,
  UserPlus,
  Clock,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS, uk } from 'date-fns/locale';
import { useTranslation as useI18n } from 'react-i18next';

type ActivityType = 'offer_accepted' | 'offer_sent' | 'client_added' | 'quote_created' | 'revenue';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  timestamp: Date;
  amount?: number;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: LucideIcon; bg: string; iconColor: string; label: string }
> = {
  offer_accepted: {
    icon: CheckCircle2,
    bg: 'bg-success/10',
    iconColor: 'text-success',
    label: 'Oferta zaakceptowana',
  },
  offer_sent: {
    icon: FileText,
    bg: 'bg-primary/10',
    iconColor: 'text-primary',
    label: 'Oferta wysłana',
  },
  client_added: {
    icon: UserPlus,
    bg: 'bg-info/10',
    iconColor: 'text-info',
    label: 'Nowy klient',
  },
  quote_created: {
    icon: Clock,
    bg: 'bg-warning/10',
    iconColor: 'text-warning',
    label: 'Wycena w toku',
  },
  revenue: {
    icon: TrendingUp,
    bg: 'bg-success/10',
    iconColor: 'text-success',
    label: 'Przychód',
  },
};

/** Placeholder activities — in production fetch from Supabase realtime */
function useDemoActivities(): Activity[] {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'offer_accepted',
      title: 'Remont łazienki — ul. Marszałkowska',
      subtitle: 'Kowalski Jan',
      timestamp: new Date(now.getTime() - 12 * 60 * 1000),
      amount: 8500,
    },
    {
      id: '2',
      type: 'offer_sent',
      title: 'Instalacja elektryczna — biurowiec',
      subtitle: 'Firma Budex Sp. z o.o.',
      timestamp: new Date(now.getTime() - 45 * 60 * 1000),
    },
    {
      id: '3',
      type: 'client_added',
      title: 'Nowak Maria',
      subtitle: 'Remont kuchni',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: '4',
      type: 'quote_created',
      title: 'Malowanie mieszkania 60m²',
      subtitle: 'Wiśniewski Piotr',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      amount: 3200,
    },
    {
      id: '5',
      type: 'offer_accepted',
      title: 'Układanie płytek — łazienka',
      subtitle: 'Zając Tomasz',
      timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      amount: 4700,
    },
  ];
}

const dateLocaleMap: Record<string, Locale> = { pl, en: enUS, uk };

interface ActivityItemProps {
  activity: Activity;
  index: number;
}

function ActivityItem({ activity, index }: ActivityItemProps) {
  const { i18n } = useI18n();
  const locale = dateLocaleMap[i18n.language] ?? pl;
  const config = ACTIVITY_CONFIG[activity.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 group"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center pt-1">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110', config.bg)}>
          <Icon className={cn('h-4 w-4', config.iconColor)} />
        </div>
        {index < 4 && (
          <div className="mt-1 w-px flex-1 min-h-[20px] bg-border" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate leading-tight">
              {activity.title}
            </p>
            {activity.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{activity.subtitle}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            {activity.amount !== undefined && (
              <p className="text-sm font-semibold text-success">
                +{activity.amount.toLocaleString('pl-PL')} zł
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ActivityFeed() {
  const { t } = useTranslation();
  const activities = useDemoActivities();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {t('dashboard.activityFeed', 'Ostatnia aktywność')}
          </CardTitle>
          <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" title="Na żywo" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {activities.map((activity, index) => (
            <ActivityItem key={activity.id} activity={activity} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
