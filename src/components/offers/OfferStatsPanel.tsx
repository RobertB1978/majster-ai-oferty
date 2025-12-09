import { useOfferStats } from '@/hooks/useOfferStats';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, ThumbsUp, TrendingUp, Loader2 } from 'lucide-react';

/**
 * Phase 6A: Simple offer statistics panel
 * Shows basic stats for last 30 days
 */
export function OfferStatsPanel() {
  const { data: stats, isLoading, error } = useOfferStats();

  if (error) {
    return null; // Fail silently - stats are not critical
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Wysłane oferty',
      value: stats.sentCount,
      icon: Mail,
      description: 'Ostatnie 30 dni',
      className: 'text-blue-500',
      bgClassName: 'bg-blue-500/10',
    },
    {
      title: 'Zaakceptowane oferty',
      value: stats.acceptedCount,
      icon: ThumbsUp,
      description: 'Ostatnie 30 dni',
      className: 'text-green-500',
      bgClassName: 'bg-green-500/10',
    },
    {
      title: 'Konwersja',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      description: 'Zaakceptowane / Wysłane',
      className: 'text-purple-500',
      bgClassName: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${stat.bgClassName}`}>
                  <Icon className={`h-5 w-5 ${stat.className}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
