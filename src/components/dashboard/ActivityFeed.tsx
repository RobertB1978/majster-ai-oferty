import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS, uk } from 'date-fns/locale';
import { ACTIVITY_CONFIG } from '@/data/activityConfig';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import type { Activity } from '@/data/demoActivities';

const dateLocaleMap: Record<string, Locale> = { pl, en: enUS, uk };

interface ActivityItemProps {
  activity: Activity;
  index: number;
}

const ActivityItem = React.memo(function ActivityItem({ activity, index }: ActivityItemProps) {
  const { i18n } = useTranslation();
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
                {`+${activity.amount.toLocaleString('pl-PL')} z\u0142`}
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
});

export const ActivityFeed = React.memo(function ActivityFeed() {
  const { t } = useTranslation();
  const { data: activities = [], isLoading } = useRecentActivity(5);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {t('dashboard.activityFeed')}
          </CardTitle>
          {activities.length > 0 && (
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t('dashboard.noActivity', 'Brak aktywności. Stwórz pierwszą ofertę!')}
          </p>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <ActivityItem key={activity.id} activity={activity} index={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
