import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useQuote } from '@/hooks/useQuotes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, FolderOpen, FileText, 
  DollarSign, CheckCircle, Clock, Loader2 
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['hsl(217, 91%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

export default function Analytics() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { user } = useAuth();

  // Fetch all quotes for analytics
  const { data: allQuotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['all-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = projectsLoading || clientsLoading || quotesLoading;

  // Statistics calculations
  const stats = useMemo(() => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    
    // Projects by status
    const statusCounts = {
      'Nowy': projects.filter(p => p.status === 'Nowy').length,
      'Wycena w toku': projects.filter(p => p.status === 'Wycena w toku').length,
      'Oferta wysłana': projects.filter(p => p.status === 'Oferta wysłana').length,
      'Zaakceptowany': projects.filter(p => p.status === 'Zaakceptowany').length,
    };

    // Projects created per month (last 6 months)
    const monthlyProjects = Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(now, 5 - i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const count = projects.filter(p => {
        const createdAt = parseISO(p.created_at);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      }).length;

      return {
        month: format(monthDate, 'MMM', { locale: pl }),
        projekty: count,
      };
    });

    // Total quotes value
    const totalValue = allQuotes.reduce((sum, q) => sum + (q.total || 0), 0);
    const avgValue = allQuotes.length > 0 ? totalValue / allQuotes.length : 0;

    // Conversion rate (accepted / total)
    const acceptedCount = statusCounts['Zaakceptowany'];
    const conversionRate = projects.length > 0 
      ? Math.round((acceptedCount / projects.length) * 100) 
      : 0;

    // This month vs last month
    const thisMonthProjects = projects.filter(p => {
      const createdAt = parseISO(p.created_at);
      return isWithinInterval(createdAt, { start: startOfMonth(now), end: endOfMonth(now) });
    }).length;

    const lastMonthProjects = projects.filter(p => {
      const createdAt = parseISO(p.created_at);
      return isWithinInterval(createdAt, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
    }).length;

    const projectsTrend = lastMonthProjects > 0 
      ? Math.round(((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100)
      : thisMonthProjects > 0 ? 100 : 0;

    return {
      statusCounts,
      monthlyProjects,
      totalValue,
      avgValue,
      conversionRate,
      projectsTrend,
      thisMonthProjects,
    };
  }, [projects, allQuotes]);

  const pieData = Object.entries(stats.statusCounts).map(([name, value]) => ({ name, value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Analityka</h1>
        <p className="mt-1 text-muted-foreground">Szczegółowe statystyki Twojej działalności</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wszystkie projekty</p>
                <p className="text-3xl font-bold">{projects.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              {stats.projectsTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={stats.projectsTrend >= 0 ? 'text-success' : 'text-destructive'}>
                {stats.projectsTrend >= 0 ? '+' : ''}{stats.projectsTrend}%
              </span>
              <span className="text-muted-foreground">vs poprzedni miesiąc</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Klienci</p>
                <p className="text-3xl font-bold">{clients.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wartość wycen</p>
                <p className="text-3xl font-bold">{stats.totalValue.toLocaleString('pl-PL')} zł</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Średnia: {stats.avgValue.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Konwersja</p>
                <p className="text-3xl font-bold">{stats.conversionRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {stats.statusCounts['Zaakceptowany']} z {projects.length} projektów
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Projects Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Projekty w czasie</CardTitle>
            <CardDescription>Liczba projektów utworzonych w ostatnich 6 miesiącach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyProjects}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="projekty" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status projektów</CardTitle>
            <CardDescription>Rozkład projektów według statusu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Ostatnia aktywność</CardTitle>
          <CardDescription>Najnowsze projekty w tym miesiącu</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.thisMonthProjects === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Brak projektów w tym miesiącu
            </p>
          ) : (
            <div className="space-y-3">
              {projects
                .filter(p => {
                  const createdAt = parseISO(p.created_at);
                  return isWithinInterval(createdAt, { 
                    start: startOfMonth(new Date()), 
                    end: endOfMonth(new Date()) 
                  });
                })
                .slice(0, 5)
                .map(project => (
                  <div 
                    key={project.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{project.project_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.clients?.name} • {format(parseISO(project.created_at), 'd MMM', { locale: pl })}
                      </p>
                    </div>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
