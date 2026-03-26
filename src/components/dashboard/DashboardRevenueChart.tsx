/**
 * DashboardRevenueChart — Recharts AreaChart
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §4.1, §8
 *
 * Shows offer pipeline activity over the last 7 days.
 * Uses amber gradient for primary line + blue for accepted line.
 * Data is derived from real project/offer counts per day.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DayData {
  day: string;
  nowe: number;
  zakonczone: number;
}

function useLast7DaysProjectActivity(): { data: DayData[]; isLoading: boolean } {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-revenue-chart', user?.id],
    queryFn: async (): Promise<DayData[]> => {
      if (!user?.id) return [];

      // Build 7-day range
      const days: DayData[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
          day: d.toLocaleDateString('pl-PL', { weekday: 'short' }),
          nowe: 0,
          zakonczone: 0,
        });
      }

      const from = new Date();
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);

      const { data: projects } = await supabase
        .from('v2_projects')
        .select('created_at, status')
        .eq('owner_user_id', user.id)
        .gte('created_at', from.toISOString());

      if (projects) {
        projects.forEach((p) => {
          const createdDate = new Date(p.created_at);
          const dayIndex =
            6 -
            Math.floor(
              (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
            );
          if (dayIndex >= 0 && dayIndex < 7) {
            days[dayIndex].nowe += 1;
            if (p.status === 'COMPLETED') {
              days[dayIndex].zakonczone += 1;
            }
          }
        });
      }

      return days;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });

  return { data: data ?? [], isLoading };
}

// Custom Tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-semibold text-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardRevenueChart() {
  const { t } = useTranslation();
  const { data, isLoading } = useLast7DaysProjectActivity();

  // Fallback demo data when no real data yet
  const chartData = useMemo<DayData[]>(() => {
    if (data.length > 0) return data;
    // Show zeros shaped to look like an onboarding chart
    const labels = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
    return labels.map((day) => ({ day, nowe: 0, zakonczone: 0 }));
  }, [data]);

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t('dashboard.activityLast7Days', 'Aktywność — ostatnie 7 dni')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <div className="h-[180px] animate-pulse rounded-lg bg-muted/40" />
        ) : (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorNowe" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="colorZakonczone"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--success))"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--success))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="nowe"
                  name={t('dashboard.newProjects', 'Nowe projekty')}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorNowe)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
                <Area
                  type="monotone"
                  dataKey="zakonczone"
                  name={t('dashboard.completedProjects', 'Zakończone')}
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fill="url(#colorZakonczone)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--success))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* Legend */}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-full bg-primary" />
            {t('dashboard.newProjects', 'Nowe projekty')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-full bg-success" />
            {t('dashboard.completedProjects', 'Zakończone')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
