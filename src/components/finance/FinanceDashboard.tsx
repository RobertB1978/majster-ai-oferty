import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, DollarSign, Receipt, 
  BarChart3, Sparkles, AlertTriangle, Lightbulb,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useFinancialSummary, useAIFinancialAnalysis } from '@/hooks/useFinancialReports';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function FinanceDashboard() {
  const { data: summary, isLoading } = useFinancialSummary();
  const aiAnalysis = useAIFinancialAnalysis();
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleRunAnalysis = async () => {
    const result = await aiAnalysis.mutateAsync();
    setAnalysisResult(result);
  };

  if (isLoading || !summary) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  const marginTrend = summary.monthly.length >= 2 
    ? summary.monthly[summary.monthly.length - 1].margin - summary.monthly[summary.monthly.length - 2].margin
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Przychody</p>
                <p className="text-2xl font-bold">{summary.totalRevenue.toLocaleString()} zł</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Koszty</p>
                <p className="text-2xl font-bold">{summary.totalCosts.toLocaleString()} zł</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marża brutto</p>
                <p className="text-2xl font-bold">{summary.grossMargin.toLocaleString()} zł</p>
                <div className="flex items-center gap-1 mt-1">
                  {marginTrend >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${marginTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(marginTrend).toLocaleString()} zł
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                {marginTrend >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-blue-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marża %</p>
                <p className="text-2xl font-bold">{summary.marginPercent.toFixed(1)}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Przychody vs Koszty</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={summary.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} zł`} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary)/0.3)" 
                  name="Przychody"
                />
                <Area 
                  type="monotone" 
                  dataKey="costs" 
                  stackId="2"
                  stroke="hsl(var(--destructive))" 
                  fill="hsl(var(--destructive)/0.3)" 
                  name="Koszty"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marża miesięczna</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} zł`} />
                <Bar 
                  dataKey="margin" 
                  fill="hsl(var(--primary))" 
                  name="Marża"
                  radius={[4, 4, 0, 0]}
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
                {analysisResult.pricingRecommendations?.map((rec: any, i: number) => (
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
