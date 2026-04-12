import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  BarChart3, Sparkles, AlertTriangle, Lightbulb,
  ArrowUpRight, ArrowDownRight, PiggyBank, Lock, Zap,
  Calendar, X, FileText, FileSpreadsheet
} from 'lucide-react';
import { useFinancialSummary, useAIFinancialAnalysis } from '@/hooks/useFinancialReports';
import { usePlanGate } from '@/hooks/usePlanGate';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { LoadingCard } from '@/components/ui/loading-screen';
import { exportFinanceToExcel, exportFinanceToPdf } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { formatNumberCompact } from '@/lib/formatters';

interface PricingRecommendation {
  category: string;
  currentAvgPrice: number;
  recommendedPrice: number;
  reason: string;
}

// Kształt odpowiedzi z edge function finance-ai-analysis (supabase/functions/finance-ai-analysis/index.ts)
interface AIAnalysisResult {
  keyInsights?: string[];
  actionItems?: string[];
  pricingRecommendations?: PricingRecommendation[];
  riskFactors?: string[];
}

export function FinanceDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canUseFeature } = usePlanGate();
  const canUseAiAnalysis = canUseFeature('ai');

  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const dateRange = useMemo(
    () => (dateFrom || dateTo ? { from: dateFrom || undefined, to: dateTo || undefined } : undefined),
    [dateFrom, dateTo],
  );

  const { data: summary, isLoading } = useFinancialSummary(dateRange);
  const aiAnalysis = useAIFinancialAnalysis();

  const handleRunAnalysis = async () => {
    const result = await aiAnalysis.mutateAsync();
    setAnalysisResult(result);
  };

  const handleExportExcel = async () => {
    if (!summary) return;
    setIsExporting(true);
    try {
      await exportFinanceToExcel({
        totalRevenue: summary.totalRevenue,
        totalCosts: summary.totalCosts,
        grossMargin: summary.grossMargin,
        marginPercent: summary.marginPercent,
        projectCount: summary.projectCount,
        monthly: summary.monthly,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      toast.success(t('finance.exportSuccess'));
    } catch {
      toast.error(t('finance.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!summary) return;
    setIsExporting(true);
    try {
      await exportFinanceToPdf({
        totalRevenue: summary.totalRevenue,
        totalCosts: summary.totalCosts,
        grossMargin: summary.grossMargin,
        marginPercent: summary.marginPercent,
        projectCount: summary.projectCount,
        monthly: summary.monthly,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      toast.success(t('finance.exportSuccess'));
    } catch {
      toast.error(t('finance.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  const hasData = !!summary?.monthly.length;

  const filterToolbar = (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border/50 rounded-xl shadow-sm">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground shrink-0">{t('finance.dateFrom')}:</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 w-36"
          max={dateTo || undefined}
        />
        <span className="text-sm text-muted-foreground shrink-0">{t('finance.dateTo')}:</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 w-36"
          min={dateFrom || undefined}
        />
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="h-8 gap-1 px-2"
          >
            <X className="h-3 w-3" />
            {t('finance.clearFilter')}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={isExporting || !hasData}
          className="h-8 gap-1.5"
        >
          <FileText className="h-4 w-4" />
          {t('finance.exportPdf')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={isExporting || !hasData}
          className="h-8 gap-1.5"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {t('finance.exportExcel')}
        </Button>
      </div>
    </div>
  );

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        {filterToolbar}
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
      <div className="space-y-6">
        {filterToolbar}
        <EmptyState
          icon={TrendingUp}
          title={t('finance.noData')}
          description={t('finance.noDataDesc')}
          action={{
            label: t('finance.createFirstProject'),
            onClick: () => navigate('/app/projects/new'),
          }}
          className="min-h-[400px]"
        />
      </div>
    );
  }

  const marginTrend = summary.monthly.length >= 2
    ? summary.monthly[summary.monthly.length - 1].margin - summary.monthly[summary.monthly.length - 2].margin
    : 0;

  const kpiCards = [
    {
      label: t('finance.revenue'),
      value: summary.totalRevenue,
      icon: DollarSign,
      gradient: 'from-success to-success',
      bgGradient: 'from-success/10 to-success/5',
      iconBg: 'bg-success',
    },
    {
      label: t('finance.costs'),
      value: summary.totalCosts,
      icon: Receipt,
      gradient: 'from-destructive to-destructive',
      bgGradient: 'from-destructive/10 to-destructive/5',
      iconBg: 'bg-destructive',
    },
    {
      label: t('finance.grossMargin'),
      value: summary.grossMargin,
      icon: marginTrend >= 0 ? TrendingUp : TrendingDown,
      gradient: 'from-primary to-primary',
      bgGradient: 'from-primary/10 to-primary/5',
      iconBg: 'bg-info',
      trend: marginTrend,
    },
    {
      label: t('finance.marginPercent'),
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
      {/* Date filter + Export toolbar */}
      {filterToolbar}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <Card
            key={card.label}
            className={`relative overflow-hidden border border-border/40 bg-gradient-to-br ${card.bgGradient} transition-all duration-200 card-interactive`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-5 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
                    {card.isPercent
                      ? `${card.value.toFixed(1)}%`
                      : `${formatNumberCompact(card.value)} zł`
                    }
                  </p>
                  {card.trend !== undefined && (
                    <div className="flex items-center gap-1 mt-1">
                      {card.trend >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-rose-500" />
                      )}
                      <span className={`text-sm font-medium tabular-nums ${card.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatNumberCompact(Math.abs(card.trend))} zł
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
              {t('finance.revenueVsCosts')}
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
                  formatter={(value: number) => [`${formatNumberCompact(value)} zł`]}
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
                  name={t('finance.revenue')}
                />
                <Area
                  type="monotone"
                  dataKey="costs"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  fill="url(#colorCosts)"
                  name={t('finance.costs')}
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
              {t('finance.monthlyMargin')}
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
                  formatter={(value: number) => [`${formatNumberCompact(value)} zł`]}
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
                  name={t('finance.margin')}
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
              {t('finance.aiAnalysis')}
            </span>
            {canUseAiAnalysis ? (
              <Button onClick={handleRunAnalysis} disabled={aiAnalysis.isPending}>
                {aiAnalysis.isPending ? t('finance.analyzing') : t('finance.runAnalysis')}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate('/app/plan')} className="gap-2">
                <Lock className="h-4 w-4" />
                <span>Business</span>
                <Zap className="h-3 w-3 text-primary" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisResult ? (
            <Tabs defaultValue="insights">
              <TabsList>
                <TabsTrigger value="insights">{t('finance.insights')}</TabsTrigger>
                <TabsTrigger value="pricing">{t('finance.pricingTab')}</TabsTrigger>
                <TabsTrigger value="risks">{t('finance.risks')}</TabsTrigger>
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
                    <h4 className="font-medium mb-2">{t('finance.actionItems')}</h4>
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
                        <span className="text-success font-medium">
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
              <p>{t('finance.runAnalysisHint')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
