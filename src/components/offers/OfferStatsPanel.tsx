import { useOfferStats } from '@/hooks/useOfferStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ThumbsUp, TrendingUp, Loader2, AlertCircle, XCircle } from 'lucide-react';

/**
 * Phase 6A: Simple offer statistics panel
 * Shows basic stats for last 30 days
 * Phase 6C: Added follow-up statistics
 */
export function OfferStatsPanel() {
  const { data: stats, isLoading, error } = useOfferStats();

  if (error) {
    return null; // Fail silently - stats are not critical
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
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
    <div className="space-y-4">
      {/* Phase 6A: Basic statistics */}
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

      {/* Phase 6C: Follow-up statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Oferty wymagające follow-up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Total follow-up count */}
            <div className="flex items-center gap-4 rounded-lg border border-border p-4">
              <div className="rounded-full bg-orange-500/10 p-3">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Razem</p>
                <p className="text-2xl font-bold">{stats.followupCount}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.followupCount === 1
                    ? 'oferta wymaga'
                    : 'ofert wymaga'}{' '}
                  akcji
                </p>
              </div>
            </div>

            {/* Not opened */}
            <div className="flex items-center gap-4 rounded-lg border border-border p-4">
              <div className="rounded-full bg-red-500/10 p-3">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nieotwarte</p>
                <p className="text-2xl font-bold">{stats.followupNotOpened}</p>
                <p className="text-xs text-muted-foreground">
                  email nie otwarty
                </p>
              </div>
            </div>

            {/* Opened, no decision */}
            <div className="flex items-center gap-4 rounded-lg border border-border p-4">
              <div className="rounded-full bg-orange-500/10 p-3">
                <Mail className="h-5 w-5 text-orange-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Brak decyzji</p>
                <p className="text-2xl font-bold">{stats.followupOpenedNoDecision}</p>
                <p className="text-xs text-muted-foreground">
                  otwarte, bez odpowiedzi
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
