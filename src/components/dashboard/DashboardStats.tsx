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
      bg: 'bg-primary/10',
      icon: 'bg-primary',
      text: 'text-primary'
    },
    accent: {
      bg: 'bg-accent/10',
      icon: 'bg-accent',
      text: 'text-accent-foreground'
    },
    success: {
      bg: 'bg-success/10',
      icon: 'bg-success',
      text: 'text-success'
    },
    warning: {
      bg: 'bg-warning/10',
      icon: 'bg-warning',
      text: 'text-warning'
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
