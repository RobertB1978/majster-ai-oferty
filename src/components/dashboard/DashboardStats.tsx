import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Users,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** Animowany licznik (roll-up effect) */
function AnimatedCounter({ value, duration = 1.0 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    const startVal = 0;
    const endVal = value;

    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (endVal - startVal) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <>{display}</>;
}

/** Lightweight inline SVG Sparkline */
interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

function InlineSparkline({ data, color, width = 100, height = 32 }: SparklineProps) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polyline = points.join(' ');
  const lastX = parseFloat(points[points.length - 1].split(',')[0]);
  const lastY = parseFloat(points[points.length - 1].split(',')[1]);

  // Area fill path
  const firstX = parseFloat(points[0].split(',')[0]);
  const bottomY = pad + h;
  const areaPath = `M${firstX},${bottomY} ${points.map(p => `L${p}`).join(' ')} L${lastX},${bottomY} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className="overflow-visible"
      aria-hidden="true"
    >
      {/* Area fill */}
      <path d={areaPath} fill={color} opacity="0.15" />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last value dot */}
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

/** Pseudo-random but deterministic sparkline data based on seed */
function generateSparkData(seed: number, length = 7): number[] {
  const result: number[] = [];
  let v = seed > 0 ? seed : 1;
  for (let i = 0; i < length; i++) {
    const noise = ((v * 1103515245 + 12345) & 0x7fffffff) % Math.max(v, 1);
    v = noise;
    result.push(Math.max(0, Math.round(seed * (0.5 + i * 0.08) + (noise % Math.max(seed * 0.3, 1)) - seed * 0.15)));
  }
  return result;
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  color?: 'primary' | 'accent' | 'success' | 'warning';
  delay?: number;
}

// spark values are resolved HSL strings — SVG presentation attributes cannot
// use CSS custom properties, so we hard-code values that match the design tokens
// defined in src/index.css exactly:
//   primary  → --primary:  38 92% 50%
//   accent   → --accent-blue: #1E40AF ≈ hsl(224 64% 40%) — lightened for SVG visibility
//   success  → --success:  142 76% 36%
//   warning  → --warning:  33 95% 44%
const colorConfig = {
  primary: {
    bg: 'bg-primary/8',
    iconBg: 'bg-primary',
    text: 'text-primary',
    spark: 'hsl(38 92% 50%)',   // --primary exact
  },
  accent: {
    bg: 'bg-ds-accent-blue-subtle dark:bg-muted/50',
    iconBg: 'bg-ds-accent-blue',
    text: 'text-ds-accent-blue',
    spark: 'hsl(224 64% 50%)',  // --accent-blue lightened for sparkline readability
  },
  success: {
    bg: 'bg-success/8',
    iconBg: 'bg-success',
    text: 'text-success',
    spark: 'hsl(142 76% 36%)',  // --success exact
  },
  warning: {
    bg: 'bg-warning/8',
    iconBg: 'bg-warning',
    text: 'text-warning',
    spark: 'hsl(33 95% 44%)',   // --warning exact
  },
} as const;

function StatsCard({ title, value, icon, trend, color = 'primary', delay = 0 }: StatsCardProps) {
  const cfg = colorConfig[color];
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend && trend > 0
      ? 'text-success'
      : trend && trend < 0
        ? 'text-destructive'
        : 'text-muted-foreground';
  const sparkData = generateSparkData(Math.max(value, 2));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card
        className={cn(
          'overflow-hidden border-0 shadow-md transition-all duration-300 cursor-default',
          cfg.bg
        )}
      >
        <CardContent className="p-5">
          {/* Top row: text + icon */}
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                {title}
              </p>
              <p className={cn('text-3xl font-bold tabular-nums tracking-tight font-mono', cfg.text)}>
                <AnimatedCounter value={value} />
              </p>
            </div>
            <motion.div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-md',
                cfg.iconBg
              )}
              whileHover={{ rotate: 8, scale: 1.12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div className="text-white">{icon}</div>
            </motion.div>
          </div>

          {/* Sparkline */}
          <div className="-mx-1 my-2">
            <InlineSparkline data={sparkData} color={cfg.spark} height={28} />
          </div>

          {/* Trend badge */}
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 text-[11px] font-semibold', trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span>{trend > 0 ? '+' : ''}{trend}% vs. poprzedni okres</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface DashboardStatsProps {
  projectsCount: number;
  clientsCount: number;
  acceptedCount: number;
  recentCount: number;
}

export const DashboardStats = React.memo(function DashboardStats({
  projectsCount,
  clientsCount,
  acceptedCount,
  recentCount,
}: DashboardStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title={t('dashboard.allProjects')}
        value={projectsCount}
        color="primary"
        icon={<FolderOpen className="h-5 w-5" />}
        delay={0}
      />
      <StatsCard
        title={t('dashboard.clients')}
        value={clientsCount}
        color="accent"
        icon={<Users className="h-5 w-5" />}
        delay={0.06}
      />
      <StatsCard
        title={t('dashboard.accepted')}
        value={acceptedCount}
        color="success"
        icon={<CheckCircle className="h-5 w-5" />}
        delay={0.12}
      />
      <StatsCard
        title={t('dashboard.newLast7Days')}
        value={recentCount}
        color="warning"
        icon={<TrendingUp className="h-5 w-5" />}
        delay={0.18}
      />
    </div>
  );
});
