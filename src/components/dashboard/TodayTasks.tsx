import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodayTask {
  id: string;
  type: 'pending_offer' | 'expiring_offer' | 'inactive_project';
  label: string;
  href: string;
}

function useTodayTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['today-tasks', user?.id],
    queryFn: async (): Promise<TodayTask[]> => {
      if (!user) return [];
      const tasks: TodayTask[] = [];
      const now = new Date();

      // Offers pending > 3 days with no response
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: pendingOffers } = await supabase
        .from('offers')
        .select('id, title, sent_at, client_id')
        .eq('status', 'SENT')
        .lte('sent_at', threeDaysAgo.toISOString())
        .order('sent_at', { ascending: true })
        .limit(5);

      if (pendingOffers) {
        for (const offer of pendingOffers) {
          const daysSent = Math.floor((now.getTime() - new Date(offer.sent_at!).getTime()) / (1000 * 60 * 60 * 24));
          tasks.push({
            id: `offer-pending-${offer.id}`,
            type: 'pending_offer',
            label: `${offer.title || 'Oferta'} — brak odpowiedzi ${daysSent} dni`,
            href: `/app/offers/${offer.id}`,
          });
        }
      }

      // Offers expiring in 3 days (via offer_approvals)
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const { data: expiringApprovals } = await supabase
        .from('offer_approvals')
        .select('id, project_id, expires_at')
        .eq('status', 'pending')
        .lte('expires_at', threeDaysFromNow.toISOString())
        .gte('expires_at', now.toISOString())
        .limit(3);

      if (expiringApprovals) {
        for (const approval of expiringApprovals) {
          const daysLeft = Math.ceil((new Date(approval.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          tasks.push({
            id: `expiring-${approval.id}`,
            type: 'expiring_offer',
            label: `Oferta wygasa za ${daysLeft} dni`,
            href: `/app/projects/${approval.project_id}`,
          });
        }
      }

      // Active projects with no updates for 7+ days
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: staleProjects } = await supabase
        .from('v2_projects')
        .select('id, title, updated_at')
        .eq('status', 'ACTIVE')
        .lte('updated_at', sevenDaysAgo.toISOString())
        .order('updated_at', { ascending: true })
        .limit(3);

      if (staleProjects) {
        for (const project of staleProjects) {
          const daysSince = Math.floor((now.getTime() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24));
          tasks.push({
            id: `project-inactive-${project.id}`,
            type: 'inactive_project',
            label: `${project.title} — brak aktywności ${daysSince} dni`,
            href: `/app/projects/${project.id}`,
          });
        }
      }

      return tasks;
    },
    enabled: !!user,
    staleTime: 5 * 60_000, // 5 min
  });
}

function useTypeLabels() {
  const { t } = useTranslation();
  return {
    pending_offer: t('dashboard.todayTaskType.pendingOffer'),
    expiring_offer: t('dashboard.todayTaskType.expiringOffer'),
    inactive_project: t('dashboard.todayTaskType.inactiveProject'),
  } satisfies Record<TodayTask['type'], string>;
}

const TYPE_VARIANTS: Record<TodayTask['type'], string> = {
  pending_offer: 'bg-ds-accent-blue-subtle text-ds-accent-blue dark:bg-muted dark:text-ds-accent-blue',
  expiring_offer: 'bg-ds-accent-amber-subtle text-ds-accent-amber dark:bg-warning/15 dark:text-warning',
  inactive_project: 'bg-muted text-muted-foreground',
};

export const TodayTasks = React.memo(function TodayTasks() {
  const { t } = useTranslation();
  const typeLabels = useTypeLabels();
  const { data: tasks = [], isLoading } = useTodayTasks();

  if (isLoading || tasks.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-amber-400 dark:border-l-amber-500 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-amber-500" />
            {t('dashboard.todayTasks')}
          </CardTitle>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs font-semibold tabular-nums font-mono',
              'bg-ds-accent-amber-subtle text-ds-accent-amber dark:bg-warning/15 dark:text-warning'
            )}
          >
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 py-1.5 rounded-md px-1 hover:bg-muted/40 transition-colors duration-100"
            >
              <Badge variant="secondary" className={cn('shrink-0', TYPE_VARIANTS[task.type])}>
                {typeLabels[task.type]}
              </Badge>
              <span className="text-sm text-foreground flex-1 min-w-0 truncate">
                {task.label}
              </span>
              <Button size="sm" variant="ghost" className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 text-muted-foreground hover:text-foreground" asChild>
                <Link to={task.href}>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
