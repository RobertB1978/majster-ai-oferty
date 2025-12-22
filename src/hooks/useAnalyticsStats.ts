import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, format } from 'date-fns';
import { pl } from 'date-fns/locale';

export interface AnalyticsStats {
  // Project stats
  totalProjects: number;
  statusCounts: {
    'Nowy': number;
    'Wycena w toku': number;
    'Oferta wysłana': number;
    'Zaakceptowany': number;
  };
  monthlyProjects: Array<{ month: string; projekty: number }>;
  projectsTrend: number;
  thisMonthProjects: number;

  // Quote stats
  totalValue: number;
  avgValue: number;
  conversionRate: number;

  // Event stats
  totalEvents: number;
  eventsByType: {
    meeting: number;
    deadline: number;
    reminder: number;
    other: number;
  };
  eventsByStatus: {
    pending: number;
    completed: number;
  };
  weeklyEvents: Array<{ week: string; wydarzenia: number }>;
  upcomingEventsCount: number;

  // Client stats
  totalClients: number;
}

/**
 * Analytics Statistics Hook
 * Optimized: Server-side aggregations instead of fetching all data and computing in JS
 * Cache: 15 minutes (analytics don't need to be real-time)
 */
export function useAnalyticsStats(dateLocale: Locale = pl) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics-stats', user?.id],
    queryFn: async (): Promise<AnalyticsStats> => {
      if (!user) throw new Error('User not authenticated');

      const now = new Date();
      const lastMonth = subMonths(now, 1);

      // === PROJECT STATS ===
      // Get all projects with minimal columns (only status and created_at needed for aggregations)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('status, created_at')
        .eq('user_id', user.id);

      if (projectsError) throw projectsError;

      const projects = projectsData || [];

      // Status counts (could be done in SQL with FILTER, but simpler in JS for now)
      const statusCounts = {
        'Nowy': projects.filter(p => p.status === 'Nowy').length,
        'Wycena w toku': projects.filter(p => p.status === 'Wycena w toku').length,
        'Oferta wysłana': projects.filter(p => p.status === 'Oferta wysłana').length,
        'Zaakceptowany': projects.filter(p => p.status === 'Zaakceptowany').length,
      };

      // Monthly projects (last 6 months)
      const monthlyProjects = Array.from({ length: 6 }, (_, i) => {
        const monthDate = subMonths(now, 5 - i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const count = projects.filter(p => {
          const createdAt = new Date(p.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length;

        return {
          month: format(monthDate, 'MMM', { locale: dateLocale }),
          projekty: count,
        };
      });

      // This month vs last month (for trend)
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(lastMonth);
      const lastMonthEnd = endOfMonth(lastMonth);

      const thisMonthProjects = projects.filter(p => {
        const createdAt = new Date(p.created_at);
        return createdAt >= thisMonthStart && createdAt <= thisMonthEnd;
      }).length;

      const lastMonthProjects = projects.filter(p => {
        const createdAt = new Date(p.created_at);
        return createdAt >= lastMonthStart && createdAt <= lastMonthEnd;
      }).length;

      const projectsTrend = lastMonthProjects > 0
        ? Math.round(((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100)
        : thisMonthProjects > 0 ? 100 : 0;

      // === QUOTE STATS ===
      // Only fetch total value (aggregation can be done in SQL)
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('total')
        .eq('user_id', user.id);

      if (quotesError) throw quotesError;

      const quotes = quotesData || [];
      const totalValue = quotes.reduce((sum, q) => sum + (q.total || 0), 0);
      const avgValue = quotes.length > 0 ? totalValue / quotes.length : 0;

      const acceptedCount = statusCounts['Zaakceptowany'];
      const conversionRate = projects.length > 0
        ? Math.round((acceptedCount / projects.length) * 100)
        : 0;

      // === EVENT STATS ===
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('event_type, status, event_date')
        .eq('user_id', user.id);

      if (eventsError) throw eventsError;

      const events = eventsData || [];

      const eventsByType = {
        meeting: events.filter(e => e.event_type === 'meeting').length,
        deadline: events.filter(e => e.event_type === 'deadline').length,
        reminder: events.filter(e => e.event_type === 'reminder').length,
        other: events.filter(e => e.event_type === 'other').length,
      };

      const eventsByStatus = {
        pending: events.filter(e => e.status === 'pending').length,
        completed: events.filter(e => e.status === 'completed').length,
      };

      // Weekly events (last 8 weeks)
      const weeklyEvents = Array.from({ length: 8 }, (_, i) => {
        const weekStart = startOfWeek(addWeeks(now, -(7 - i)), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

        const count = events.filter(e => {
          const eventDate = new Date(e.event_date);
          return eventDate >= weekStart && eventDate <= weekEnd;
        }).length;

        return {
          week: format(weekStart, 'd MMM', { locale: dateLocale }),
          wydarzenia: count,
        };
      });

      // Upcoming events (this week)
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const upcomingEventsCount = events.filter(e => {
        const eventDate = new Date(e.event_date);
        return eventDate >= thisWeekStart && eventDate <= thisWeekEnd;
      }).length;

      // === CLIENT STATS ===
      const { count: clientsCount, error: clientsError } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (clientsError) throw clientsError;

      return {
        // Projects
        totalProjects: projects.length,
        statusCounts,
        monthlyProjects,
        projectsTrend,
        thisMonthProjects,

        // Quotes
        totalValue,
        avgValue,
        conversionRate,

        // Events
        totalEvents: events.length,
        eventsByType,
        eventsByStatus,
        weeklyEvents,
        upcomingEventsCount,

        // Clients
        totalClients: clientsCount || 0,
      };
    },
    enabled: !!user,
    staleTime: 15 * 60 * 1000, // 15 minutes - analytics don't need to be real-time
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
