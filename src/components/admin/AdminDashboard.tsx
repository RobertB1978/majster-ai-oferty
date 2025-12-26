import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Users,
  Database,
  Activity,
  TrendingUp,
  Server,
  Clock,
  DollarSign,
  BarChart3,
  Timer
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AdminCronManager } from './AdminCronManager';

interface AdminStats {
  totalUsers: number;
  activeProjects: number;
  totalRevenue: number;
  apiCalls: number;
}

// Mock data for admin dashboard
const mockStats: AdminStats = {
  totalUsers: 156,
  activeProjects: 432,
  totalRevenue: 125430,
  apiCalls: 15678,
};

const mockUsageData = [
  { date: 'Pon', users: 45, projects: 12 },
  { date: 'Wt', users: 52, projects: 18 },
  { date: 'Śr', users: 48, projects: 15 },
  { date: 'Cz', users: 61, projects: 22 },
  { date: 'Pt', users: 55, projects: 20 },
  { date: 'Sb', users: 32, projects: 8 },
  { date: 'Nd', users: 28, projects: 5 },
];

const mockPlanDistribution = [
  { name: 'Free', value: 85, color: '#94a3b8' },
  { name: 'Starter', value: 42, color: '#3b82f6' },
  { name: 'Business', value: 22, color: '#8b5cf6' },
  { name: 'Enterprise', value: 7, color: '#f59e0b' },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Panel Administratora
          </h2>
          <p className="text-muted-foreground">Zarządzaj platformą Majster.AI</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Activity className="h-3 w-3 mr-1" />
          System aktywny
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Użytkownicy</p>
                <p className="text-2xl font-bold">{mockStats.totalUsers}</p>
                <p className="text-xs text-green-500">+12 w tym tygodniu</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktywne projekty</p>
                <p className="text-2xl font-bold">{mockStats.activeProjects}</p>
                <p className="text-xs text-green-500">+45 w tym miesiącu</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Przychody (MRR)</p>
                <p className="text-2xl font-bold">{mockStats.totalRevenue.toLocaleString()} zł</p>
                <p className="text-xs text-green-500">+8% vs poprzedni miesiąc</p>
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
                <p className="text-sm text-muted-foreground">Wywołania API</p>
                <p className="text-2xl font-bold">{mockStats.apiCalls.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Dziś</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Server className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Przegląd</TabsTrigger>
          <TabsTrigger value="cron" className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            CRON
          </TabsTrigger>
          <TabsTrigger value="users">Użytkownicy</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="logs">Logi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Aktywność użytkowników
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={mockUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary)/0.3)" 
                      name="Użytkownicy"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="projects" 
                      stroke="hsl(var(--chart-2))" 
                      fill="hsl(var(--chart-2)/0.3)" 
                      name="Projekty"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Rozkład planów
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={mockPlanDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockPlanDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {mockPlanDistribution.map((plan) => (
                    <div key={plan.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                      <span className="text-sm">{plan.name}: {plan.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ostatnia aktywność
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Nowy użytkownik', user: 'jan.kowalski@example.com', time: '2 min temu' },
                  { action: 'Nowy projekt', user: 'anna.nowak@example.com', time: '15 min temu' },
                  { action: 'Upgrade do Business', user: 'firma.xyz@example.com', time: '1 godz. temu' },
                  { action: 'Wywołanie API', user: 'api-key-xxx', time: '2 godz. temu' },
                  { action: 'Oferta zaakceptowana', user: 'klient@example.com', time: '3 godz. temu' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground">{item.user}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cron" className="mt-4">
          <AdminCronManager />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista użytkowników</CardTitle>
              <CardDescription>Zarządzaj użytkownikami platformy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Funkcja zarządzania użytkownikami wymaga uprawnień administratora</p>
                <p className="text-sm mt-2">Skontaktuj się z działem wsparcia</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stan systemu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'API Gateway', status: 'operational' },
                  { name: 'Baza danych', status: 'operational' },
                  { name: 'Funkcje Edge', status: 'operational' },
                  { name: 'Storage', status: 'operational' },
                  { name: 'AI Services', status: 'operational' },
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <span>{service.name}</span>
                    <Badge variant={service.status === 'operational' ? 'default' : 'destructive'}>
                      {service.status === 'operational' ? 'Działa' : 'Problem'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alerty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">System sprawny</p>
                    <p className="text-sm text-green-600">Brak aktywnych alertów</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Logi systemowe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                {[
                  { time: '12:45:23', level: 'INFO', message: 'User login successful: jan@example.com' },
                  { time: '12:44:18', level: 'INFO', message: 'Project created: Remont łazienki' },
                  { time: '12:43:55', level: 'INFO', message: 'Quote saved: 15,450 PLN' },
                  { time: '12:42:30', level: 'WARN', message: 'Rate limit approaching for API key xxx' },
                  { time: '12:41:12', level: 'INFO', message: 'Email sent: offer notification' },
                  { time: '12:40:45', level: 'INFO', message: 'AI analysis completed for photo' },
                  { time: '12:39:22', level: 'INFO', message: 'OCR invoice processed' },
                  { time: '12:38:10', level: 'INFO', message: 'Offer approved by client' },
                ].map((log, i) => (
                  <div key={i} className="py-1 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">[{log.time}]</span>
                    <span className={`ml-2 ${log.level === 'WARN' ? 'text-yellow-500' : log.level === 'ERROR' ? 'text-red-500' : 'text-green-500'}`}>
                      [{log.level}]
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
