import { Card, CardContent } from '@/components/ui/card';
import { 
  FolderOpen, 
  Users, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  delay?: number;
}

function StatsCard({ title, value, icon, trend, delay = 0 }: StatsCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? 'text-success' : trend && trend < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold">{value}</p>
                {trend !== undefined && (
                  <div className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
                    <TrendIcon className="h-3 w-3" />
                    <span>{Math.abs(trend)}%</span>
                  </div>
                )}
              </div>
            </div>
            {icon}
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
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Wszystkie projekty"
        value={projectsCount}
        icon={
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
        }
        delay={0}
      />
      <StatsCard
        title="Klienci"
        value={clientsCount}
        icon={
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
            <Users className="h-6 w-6 text-accent-foreground" />
          </div>
        }
        delay={0.05}
      />
      <StatsCard
        title="Zaakceptowane"
        value={acceptedCount}
        icon={
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
        }
        delay={0.1}
      />
      <StatsCard
        title="Nowe (7 dni)"
        value={recentCount}
        icon={
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
            <TrendingUp className="h-6 w-6 text-warning" />
          </div>
        }
        delay={0.15}
      />
    </div>
  );
}
