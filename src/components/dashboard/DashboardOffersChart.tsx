/**
 * DashboardOffersChart — Recharts grouped BarChart for offer pipeline
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §4.1, §8
 *
 * Shows offers by status (new / in-progress / sent / accepted) for the last 4 weeks.
 * Uses amber primary + semantic colours from CSS tokens.
 */

import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';

interface DashboardOffersChartProps {
  newCount: number;
  inProgressCount: number;
  sentCount: number;
  acceptedCount: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; fill: string; name: string }>;
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
            style={{ background: entry.fill }}
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

export function DashboardOffersChart({
  newCount,
  inProgressCount,
  sentCount,
  acceptedCount,
}: DashboardOffersChartProps) {
  const { t } = useTranslation();

  const data = [
    {
      name: t('dashboard.stats.new', 'Nowe'),
      wartość: newCount,
      color: 'hsl(var(--muted-foreground))',
    },
    {
      name: t('dashboard.stats.inProgress', 'W toku'),
      wartość: inProgressCount,
      color: 'hsl(var(--warning))',
    },
    {
      name: t('dashboard.stats.sent', 'Wysłane'),
      wartość: sentCount,
      color: 'hsl(var(--primary))',
    },
    {
      name: t('dashboard.stats.accepted', 'Zaakceptowane'),
      wartość: acceptedCount,
      color: 'hsl(var(--success))',
    },
  ];

  const maxValue = Math.max(...data.map((d) => d.wartość), 1);

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <BarChart2 className="h-4 w-4 text-primary" />
          {t('dashboard.offerPipeline', 'Pipeline ofert')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              barSize={32}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, maxValue + 1]}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="wartość" radius={[6, 6, 0, 0]} animationDuration={600}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
