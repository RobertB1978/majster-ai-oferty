import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useAnalyticsStats } from '@/hooks/useAnalyticsStats';
import { STATUS_CONFIG } from '@/data/statusConfig';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp, TrendingDown, Users, FolderOpen,
  DollarSign, CheckCircle, Calendar, Loader2, BarChart3
} from 'lucide-react';
import { pl, enUS, uk } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';

const AnalyticsCharts = lazy(() => import('@/components/analytics/AnalyticsCharts'));

const getDateLocale = (lang: string) => {
  switch (lang) {
    case 'uk': return uk;
    case 'en': return enUS;
    default: return pl;
  }
};

export default function Analytics() {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateLocale(i18n.language);

  const { data: stats, isLoading } = useAnalyticsStats(dateLocale);

  // Build pie chart data from v2 statusCounts — use display labels from STATUS_CONFIG
  const pieData = stats
    ? Object.entries(stats.statusCounts)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
          name: STATUS_CONFIG[key]?.label ?? key,
          value,
        }))
    : [];

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('analytics.title')} | Majster.AI</title>
        <meta name="description" content={t('analytics.subtitle')} />
      </Helmet>

      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              {t('analytics.title')}
            </h1>
            <p className="mt-1 text-muted-foreground">{t('analytics.subtitle')}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('analytics.allProjects')}</p>
                  <p className="text-3xl font-bold">{stats.totalProjects}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {stats.projectsTrend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={stats.projectsTrend >= 0 ? 'text-success' : 'text-destructive'}>
                  {stats.projectsTrend >= 0 ? '+' : ''}{stats.projectsTrend}%
                </span>
                <span className="text-muted-foreground">{t('analytics.vsLastMonth')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('clients.title')}</p>
                  <p className="text-3xl font-bold">{stats.totalClients}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('analytics.totalValue')}</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.totalValue, i18n.language)}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('analytics.averageValue')}: {formatCurrency(stats.avgValue, i18n.language)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('analytics.conversionRate')}</p>
                  <p className="text-3xl font-bold">{stats.conversionRate}%</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-warning" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {stats.statusCounts.COMPLETED} / {stats.totalProjects}
              </p>
            </CardContent>
          </Card>
        </div>

        <Suspense fallback={<div className="h-[300px] rounded-lg border border-border/50 animate-pulse" />}>
          <AnalyticsCharts stats={stats} pieData={pieData} t={t} />
        </Suspense>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">{t('analytics.calendarAnalytics')}</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analytics.allEvents')}</p>
                    <p className="text-3xl font-bold">{stats.totalEvents}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analytics.thisWeek')}</p>
                    <p className="text-3xl font-bold">{stats.upcomingEventsCount}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analytics.meetings')}</p>
                    <p className="text-3xl font-bold">{stats.eventsByType.meeting}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                    <Users className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('analytics.completed')}</p>
                    <p className="text-3xl font-bold">{stats.eventsByStatus.completed}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
