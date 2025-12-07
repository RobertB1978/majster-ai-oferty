import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, FolderOpen, 
  DollarSign, CheckCircle, Calendar, Loader2, BarChart3 
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { pl, enUS, uk } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['hsl(217, 91%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

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
  
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: calendarEvents = [], isLoading: calendarLoading } = useCalendarEvents();
  const { user } = useAuth();

  const { data: allQuotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['all-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = projectsLoading || clientsLoading || quotesLoading || calendarLoading;

  const stats = useMemo(() => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    
    const statusCounts = {
      'Nowy': projects.filter(p => p.status === 'Nowy').length,
      'Wycena w toku': projects.filter(p => p.status === 'Wycena w toku').length,
      'Oferta wysłana': projects.filter(p => p.status === 'Oferta wysłana').length,
      'Zaakceptowany': projects.filter(p => p.status === 'Zaakceptowany').length,
    };

    const monthlyProjects = Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(now, 5 - i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const count = projects.filter(p => {
        const createdAt = parseISO(p.created_at);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      }).length;

      return {
        month: format(monthDate, 'MMM', { locale: dateLocale }),
        projekty: count,
      };
    });

    const totalValue = allQuotes.reduce((sum, q) => sum + (q.total || 0), 0);
    const avgValue = allQuotes.length > 0 ? totalValue / allQuotes.length : 0;

    const acceptedCount = statusCounts['Zaakceptowany'];
    const conversionRate = projects.length > 0 
      ? Math.round((acceptedCount / projects.length) * 100) 
      : 0;

    const thisMonthProjects = projects.filter(p => {
      const createdAt = parseISO(p.created_at);
      return isWithinInterval(createdAt, { start: startOfMonth(now), end: endOfMonth(now) });
    }).length;

    const lastMonthProjects = projects.filter(p => {
      const createdAt = parseISO(p.created_at);
      return isWithinInterval(createdAt, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
    }).length;

    const projectsTrend = lastMonthProjects > 0 
      ? Math.round(((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100)
      : thisMonthProjects > 0 ? 100 : 0;

    const eventsByType = {
      meeting: calendarEvents.filter(e => e.event_type === 'meeting').length,
      deadline: calendarEvents.filter(e => e.event_type === 'deadline').length,
      reminder: calendarEvents.filter(e => e.event_type === 'reminder').length,
      other: calendarEvents.filter(e => e.event_type === 'other').length,
    };

    const eventsByStatus = {
      pending: calendarEvents.filter(e => e.status === 'pending').length,
      completed: calendarEvents.filter(e => e.status === 'completed').length,
    };

    const weeklyEvents = Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(addWeeks(now, -(7 - i)), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      const count = calendarEvents.filter(e => {
        const eventDate = parseISO(e.event_date);
        return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
      }).length;

      return {
        week: format(weekStart, 'd MMM', { locale: dateLocale }),
        wydarzenia: count,
      };
    });

    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const upcomingEvents = calendarEvents.filter(e => {
      const eventDate = parseISO(e.event_date);
      return isWithinInterval(eventDate, { start: thisWeekStart, end: thisWeekEnd });
    });

    return {
      statusCounts,
      monthlyProjects,
      totalValue,
      avgValue,
      conversionRate,
      projectsTrend,
      thisMonthProjects,
      eventsByType,
      eventsByStatus,
      weeklyEvents,
      upcomingEvents,
      totalEvents: calendarEvents.length,
    };
  }, [projects, allQuotes, calendarEvents, dateLocale]);

  const pieData = Object.entries(stats.statusCounts).map(([name, value]) => ({ name, value }));

  if (isLoading) {
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              {t('analytics.title')}
            </h1>
            <p className="mt-1 text-muted-foreground">{t('analytics.subtitle')}</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('analytics.allProjects')}</p>
                  <p className="text-3xl font-bold">{projects.length}</p>
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
                  <p className="text-3xl font-bold">{clients.length}</p>
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
                  <p className="text-3xl font-bold">{stats.totalValue.toLocaleString('pl-PL')} zł</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('analytics.averageValue')}: {stats.avgValue.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł
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
                {stats.statusCounts['Zaakceptowany']} / {projects.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.projectsOverTime')}</CardTitle>
              <CardDescription>{t('analytics.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyProjects}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="projekty" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.statusDistribution')}</CardTitle>
              <CardDescription>{t('analytics.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Analytics */}
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
                    <p className="text-3xl font-bold">{stats.upcomingEvents.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success" />
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

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.eventsOverTime')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.weeklyEvents}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="wydarzenia" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.3)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.eventTypes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.eventsByType).map(([name, value]) => ({ 
                          name: t(`calendar.eventTypes.${name}`), 
                          value 
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {Object.keys(stats.eventsByType).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}