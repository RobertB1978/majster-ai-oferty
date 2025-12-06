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

  return (
    <div
      className="animate-fade-in opacity-0"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}
    >
      <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                {trend !== undefined && (
                  <div className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
                    <TrendIcon className="h-3 w-3" />
                    <span>{Math.abs(trend)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
              color === 'primary' && "bg-primary/10",
              color === 'accent' && "bg-accent",
              color === 'success' && "bg-success/10",
              color === 'warning' && "bg-warning/10"
            )}>
              {icon}
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title={t('dashboard.allProjects', 'Wszystkie projekty')}
        value={projectsCount}
        color="primary"
        icon={<FolderOpen className="h-6 w-6 text-primary" />}
        delay={0}
      />
      <StatsCard
        title={t('dashboard.clients', 'Klienci')}
        value={clientsCount}
        color="accent"
        icon={<Users className="h-6 w-6 text-accent-foreground" />}
        delay={0.05}
      />
      <StatsCard
        title={t('dashboard.accepted', 'Zaakceptowane')}
        value={acceptedCount}
        color="success"
        icon={<CheckCircle className="h-6 w-6 text-success" />}
        delay={0.1}
      />
      <StatsCard
        title={t('dashboard.newLast7Days', 'Nowe (7 dni)')}
        value={recentCount}
        color="warning"
        icon={<TrendingUp className="h-6 w-6 text-warning" />}
        delay={0.15}
      />
    </div>
  );
}
