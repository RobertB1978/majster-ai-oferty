import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { 
  FolderOpen, 
  Users, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  color?: 'primary' | 'accent' | 'success' | 'warning';
  delay?: number;
}

function StatsCard({ title, value, icon, trend, color = 'primary', delay = 0 }: StatsCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? 'text-success' : trend && trend < 0 ? 'text-destructive' : 'text-muted-foreground';

  const colorClasses = {
    primary: {
      bg: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
      icon: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      text: 'text-blue-600 dark:text-blue-400'
    },
    accent: {
      bg: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10',
      icon: 'bg-gradient-to-br from-violet-500 to-purple-500',
      text: 'text-violet-600 dark:text-violet-400'
    },
    success: {
      bg: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
      icon: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      text: 'text-emerald-600 dark:text-emerald-400'
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10',
      icon: 'bg-gradient-to-br from-amber-500 to-orange-500',
      text: 'text-amber-600 dark:text-amber-400'
    }
  };

  return (
    <div
      className="animate-fade-in opacity-0"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}
    >
      <Card className={cn(
        "overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group border-0 shadow-lg",
        colorClasses[color].bg
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className={cn("text-3xl font-bold tracking-tight", colorClasses[color].text)}>{value}</p>
                {trend !== undefined && (
                  <div className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
                    <TrendIcon className="h-3 w-3" />
                    <span>{Math.abs(trend)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg",
              colorClasses[color].icon
            )}>
              <div className="text-white">
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DashboardStatsProps {
  projectsCount: number;
  clientsCount: number;
  acceptedCount: number;
  recentCount: number;
}

export function DashboardStats({ 
  projectsCount, 
  clientsCount, 
  acceptedCount, 
  recentCount 
}: DashboardStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title={t('dashboard.allProjects', 'Wszystkie projekty')}
        value={projectsCount}
        color="primary"
        icon={<FolderOpen className="h-6 w-6" />}
        delay={0}
      />
      <StatsCard
        title={t('dashboard.clients', 'Klienci')}
        value={clientsCount}
        color="accent"
        icon={<Users className="h-6 w-6" />}
        delay={0.05}
      />
      <StatsCard
        title={t('dashboard.accepted', 'Zaakceptowane')}
        value={acceptedCount}
        color="success"
        icon={<CheckCircle className="h-6 w-6" />}
        delay={0.1}
      />
      <StatsCard
        title={t('dashboard.newLast7Days', 'Nowe (7 dni)')}
        value={recentCount}
        color="warning"
        icon={<TrendingUp className="h-6 w-6" />}
        delay={0.15}
      />
    </div>
  );
}
