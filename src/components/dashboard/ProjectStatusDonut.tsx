/**
 * ProjectStatusDonut — Recharts PieChart with innerRadius (donut style)
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §4.1, §8
 *
 * Replaces the previous progress-bar based ProjectStatusBreakdown.
 * Uses CSS custom properties for automatic dark mode.
 * Rotation animation on mount per roadmap §8.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectStatusDonutProps {
  newCount: number;
  inProgressCount: number;
  sentCount: number;
  acceptedCount: number;
}

const STATUS_CONFIG = [
  {
    key: 'new',
    labelKey: 'dashboard.stats.new',
    color: 'hsl(var(--muted-foreground))',
    bg: 'bg-muted-foreground',
  },
  {
    key: 'inProgress',
    labelKey: 'dashboard.stats.inProgress',
    color: 'hsl(var(--warning))',
    bg: 'bg-warning',
  },
  {
    key: 'sent',
    labelKey: 'dashboard.stats.sent',
    color: 'hsl(var(--primary))',
    bg: 'bg-primary',
  },
  {
    key: 'accepted',
    labelKey: 'dashboard.stats.accepted',
    color: 'hsl(var(--success))',
    bg: 'bg-success',
  },
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: item } = payload[0];
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: item.color }}
        />
        <span className="text-muted-foreground">{name}:</span>
        <span className="font-mono font-semibold text-foreground">{value}</span>
      </div>
    </div>
  );
}

export function ProjectStatusDonut({
  newCount,
  inProgressCount,
  sentCount,
  acceptedCount,
}: ProjectStatusDonutProps) {
  const { t } = useTranslation();
  const [startAngle, setStartAngle] = useState(90);

  // Rotation animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setStartAngle(90 + 360);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const counts = [newCount, inProgressCount, sentCount, acceptedCount];
  const total = counts.reduce((s, v) => s + v, 0);

  const data = STATUS_CONFIG.map((cfg, i) => ({
    name: t(cfg.labelKey),
    value: counts[i],
    color: cfg.color,
    bg: cfg.bg,
  })).filter((d) => d.value > 0);

  // When no data, show placeholder
  const chartData =
    data.length > 0
      ? data
      : [{ name: 'Brak danych', value: 1, color: 'hsl(var(--muted))', bg: 'bg-muted' }];

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <PieIcon className="h-4 w-4 text-primary" />
          {t('dashboard.projectStatus', 'Status projektów')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Donut chart */}
          <div className="relative h-[160px] w-[160px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={data.length > 1 ? 3 : 0}
                  dataKey="value"
                  startAngle={startAngle}
                  endAngle={startAngle - 360}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Centre label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={total}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="font-mono text-2xl font-bold tabular-nums text-foreground"
              >
                {total}
              </motion.span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {t('dashboard.allProjects', 'projektów')}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 w-full">
            {STATUS_CONFIG.map((cfg, i) => {
              const value = counts[i];
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div key={cfg.key} className="flex items-center gap-2 text-sm">
                  <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cfg.bg}`} />
                  <span className="flex-1 text-muted-foreground">
                    {t(cfg.labelKey)}
                  </span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    {value}
                  </span>
                  <span className="w-8 text-right text-xs text-muted-foreground tabular-nums">
                    {total > 0 ? `${pct}%` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
