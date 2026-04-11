import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Users,
  Database,
  Activity,
  Clock,
  BarChart3,
  Timer,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminCronManager } from './AdminCronManager';
import { supabase } from '@/integrations/supabase/client';

// Plan colours for Recharts pie chart.
// Design-system mapping (src/index.css / tailwind.config.ts):
//   free       → slate-400   (--text-muted range)
//   starter    → blue-500    (--state-info adjacent)
//   business   → violet-500  (no direct DS token — intentionally distinct)
//   enterprise → #F59E0B     (--accent-amber exact match)
const PLAN_COLORS: Record<string, string> = {
  free:       '#94a3b8',   // slate-400
  starter:    '#3b82f6',   // blue-500
  business:   '#8b5cf6',   // violet-500
  enterprise: '#f59e0b',   // --accent-amber (#F59E0B)
};

function UnavailableCard({ label, reason }: { label: string; reason: string }) {
  return (
    <Card className="opacity-60">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-muted-foreground">—</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              {reason}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  // --- Real query: total users ---
  const { data: usersCount, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-stats-users'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  // --- Real query: total projects ---
  const { data: projectsCount, isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-stats-projects'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  // --- Real query: plan distribution from user_subscriptions ---
  const { data: planDistribution, isLoading: plansLoading } = useQuery({
    queryKey: ['admin-stats-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan_id')
        .eq('status', 'active');
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const key = row.plan_id ?? 'free';
        counts[key] = (counts[key] ?? 0) + 1;
      }
      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
        color: PLAN_COLORS[name] ?? '#64748b',
      }));
    },
  });

  // --- Real query: recent activity from notifications ---
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('title, message, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {t('admin.dashboard.adminPanel')}
          </h2>
          <p className="text-muted-foreground">{t('admin.dashboard.managePlatform')}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Activity className="h-3 w-3 mr-1" />
          {t('admin.dashboard.systemActive')}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* REAL: total users */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.dashboard.users')}</p>
                {usersLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{usersCount?.toLocaleString() ?? '—'}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{t('admin.dashboard.totalRegistered')}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* REAL: total projects */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.dashboard.activeProjects')}</p>
                {projectsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{projectsCount?.toLocaleString() ?? '—'}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{t('admin.dashboard.totalInDb')}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HONEST: revenue not available */}
        <UnavailableCard
          label={t('admin.dashboard.revenue')}
          reason={t('admin.dashboard.noBillingModule')}
        />

        {/* HONEST: api calls not available */}
        <UnavailableCard
          label={t('admin.dashboard.apiCalls')}
          reason={t('admin.dashboard.noApiTracking')}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('admin.dashboard.overview')}</TabsTrigger>
          <TabsTrigger value="cron" className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            CRON
          </TabsTrigger>
          <TabsTrigger value="users">{t('admin.dashboard.usersTab')}</TabsTrigger>
          <TabsTrigger value="system">{t('admin.dashboard.systemTab')}</TabsTrigger>
          <TabsTrigger value="logs">{t('admin.dashboard.logsTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* HONEST: weekly chart not available */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('admin.dashboard.userActivity')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground gap-2">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-medium">{t('admin.dashboard.noHistoricalData')}</p>
                  <p className="text-xs text-center">{t('admin.dashboard.noHistoricalDataDesc')}</p>
                </div>
              </CardContent>
            </Card>

            {/* REAL: plan distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('admin.dashboard.planDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="flex items-center justify-center h-[250px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !planDistribution || planDistribution.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground gap-2">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm">{t('admin.dashboard.noActiveSubscriptions')}</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={planDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {planDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                      {planDistribution.map((plan) => (
                        <div key={plan.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                          <span className="text-sm">{plan.name}: {plan.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* REAL: recent activity from notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('admin.dashboard.recentActivity')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !recentActivity || recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <Clock className="h-8 w-8 opacity-40" />
                  <p className="text-sm">{t('admin.dashboard.noActivity')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.message}</p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('pl-PL', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cron" className="mt-4">
          <AdminCronManager />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.dashboard.usersList')}</CardTitle>
              <CardDescription>{t('admin.dashboard.usersListDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('admin.dashboard.usersAdminRequired')}</p>
                <p className="text-sm mt-2">{t('admin.dashboard.contactSupport')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HONEST: system status unknown — no real health API */}
        <TabsContent value="system" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.dashboard.systemStatus')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {t('admin.dashboard.statusUnknownNote')}
                  </p>
                </div>
                {[
                  { name: 'API Gateway' },
                  { name: t('admin.dashboard.database') },
                  { name: t('admin.dashboard.edgeFunctions') },
                  { name: 'Storage' },
                  { name: 'AI Services' },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <span>{service.name}</span>
                    <Badge variant="outline" className="text-muted-foreground">
                      <HelpCircle className="h-3 w-3 mr-1" />
                      {t('admin.dashboard.statusUnknown')}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.dashboard.alerts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-muted-foreground">{t('admin.dashboard.alertsUnavailable')}</p>
                    <p className="text-sm text-muted-foreground">{t('admin.dashboard.alertsUnavailableDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HONEST: logs not available in frontend */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.dashboard.systemLogs')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                <AlertCircle className="h-10 w-10 opacity-40" />
                <p className="font-medium">{t('admin.dashboard.logsUnavailable')}</p>
                <p className="text-sm text-center max-w-sm">{t('admin.dashboard.logsUnavailableDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
