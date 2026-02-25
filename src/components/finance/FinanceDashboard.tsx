import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  BarChart3, Sparkles, AlertTriangle, Lightbulb,
  ArrowUpRight, ArrowDownRight, PiggyBank
} from 'lucide-react';
import { useFinancialSummary, useAIFinancialAnalysis } from '@/hooks/useFinancialReports';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { LoadingCard } from '@/components/ui/loading-screen';

interface PricingRecommendation {
  category: string;
  currentAvgPrice: number;
  recommendedPrice: number;
  reason: string;
}

interface AIAnalysisResult {
  summary?: string;
  actionableInsights?: string[];
  pricingRecommendations?: PricingRecommendation[];
  riskFactors?: string[];
}

export function FinanceDashboard() {
  const { data: summary, isLoading } = useFinancialSummary();
  const aiAnalysis = useAIFinancialAnalysis();
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const navigate = useNavigate();

  const handleRunAnalysis = async () => {
    const result = await aiAnalysis.mutateAsync();
    setAnalysisResult(result);
  };

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[350px] bg-card border border-border/50 rounded-xl animate-pulse" />
          <div className="h-[350px] bg-card border border-border/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!summary.monthly.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Brak danych finansowych"
        description="Stwórz projekty i wyceny, aby śledzić swoje przychody, koszty i marżę w czasie."
        action={{
          label: "Utwórz pierwszy projekt",
          onClick: () => navigate('/app/jobs/new'),
        }}
        className="min-h-[400px]"
      />
    );
  }

  const marginTrend = summary.monthly.length >= 2
    ? summary.monthly[summary.monthly.length - 1].margin - summary.monthly[summary.monthly.length - 2].margin
    : 0;

  const kpiCards = [
    {
      label: 'Przychody',
      value: summary.totalRevenue,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-500/10 to-green-500/5',
      iconBg: 'bg-success',
    },
    {
      label: 'Koszty',
      value: summary.totalCosts,
      icon: Receipt,
      gradient: 'from-rose-500 to-red-600',
      bgGradient: 'from-rose-500/10 to-red-500/5',
      iconBg: 'bg-destructive',
    },
    {
      label: 'Marża brutto',
      value: summary.grossMargin,
      icon: marginTrend >= 0 ? TrendingUp : TrendingDown,
      gradient: 'from-primary to-primary',
      bgGradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-info',
      trend: marginTrend,
    },
    {
      label: 'Marża %',
      value: summary.marginPercent,
      isPercent: true,
      icon: PiggyBank,
      gradient: 'from-primary to-primary',
      bgGradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-primary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <Card 
            key={card.label}
            className={`relative overflow-hidden border-0 bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:shadow-xl`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Decorative element removed */}
            <CardContent className="p-5 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {card.isPercent 
                      ? `${card.value.toFixed(1)}%`
                      : `${card.value.toLocaleString()} zł`
                    }
                  </p>
                  {card.trend !== undefined && (
                    <div className="flex items-center gap-1 mt-1">
                      {card.trend >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-rose-500" />
                      )}
                      <span className={`text-sm font-medium ${card.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {Math.abs(card.trend).toLocaleString()} zł
                      </span>
                    </div>
                  )}
                </div>
                <div className={`h-12 w-12 rounded-xl ${card.iconBg} flex items-center justify-center shadow-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Przychody vs Koszty
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={summary.monthly}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--border))"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  stroke="hsl(var(--border))"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString()} zł`]}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                  name="Przychody"
                />
                <Area
                  type="monotone"
                  dataKey="costs"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  fill="url(#colorCosts)"
                  name="Koszty"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Marża miesięczna
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={summary.monthly}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--border))"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  stroke="hsl(var(--border))"
                  fontSize={12}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString()} zł`]}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
                  }}
                />
                <Bar
                  dataKey="margin"
                  fill="url(#barGradient)"
                  name="Marża"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Analiza AI
            </span>
            <Button onClick={handleRunAnalysis} disabled={aiAnalysis.isPending}>
              {aiAnalysis.isPending ? 'Analizuję...' : 'Uruchom analizę'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisResult ? (
            <Tabs defaultValue="insights">
              <TabsList>
                <TabsTrigger value="insights">Wnioski</TabsTrigger>
                <TabsTrigger value="pricing">Ceny</TabsTrigger>
                <TabsTrigger value="risks">Ryzyka</TabsTrigger>
              </TabsList>
              
              <TabsContent value="insights" className="space-y-4 mt-4">
                {analysisResult.keyInsights?.map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <p>{insight}</p>
                  </div>
                ))}
                
                {analysisResult.actionItems?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Działania do podjęcia:</h4>
                    <ul className="space-y-2">
                      {analysisResult.actionItems.map((action: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{i + 1}</Badge>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-4 mt-4">
                {analysisResult.pricingRecommendations?.map((rec: PricingRecommendation, i: number) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{rec.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground line-through">
                          {rec.currentAvgPrice} zł
                        </span>
                        <span className="text-green-600 font-medium">
                          → {rec.recommendedPrice} zł
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="risks" className="space-y-4 mt-4">
                {analysisResult.riskFactors?.map((risk: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <p>{risk}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Kliknij "Uruchom analizę" aby AI przeanalizowało Twoje finanse</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
