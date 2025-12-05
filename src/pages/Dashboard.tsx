import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Users, FileText, Loader2, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  'Nowy': 'bg-muted text-muted-foreground',
  'Wycena w toku': 'bg-warning/10 text-warning',
  'Oferta wysłana': 'bg-primary/10 text-primary',
  'Zaakceptowany': 'bg-success/10 text-success',
};

export default function Dashboard() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const navigate = useNavigate();

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const isLoading = projectsLoading || clientsLoading;

  // Statystyki
  const stats = {
    total: projects.length,
    new: projects.filter(p => p.status === 'Nowy').length,
    inProgress: projects.filter(p => p.status === 'Wycena w toku').length,
    sent: projects.filter(p => p.status === 'Oferta wysłana').length,
    accepted: projects.filter(p => p.status === 'Zaakceptowany').length,
  };

  // Projekty z ostatniego tygodnia
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentCount = projects.filter(p => new Date(p.created_at) > oneWeekAgo).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Witaj w Majster.AI
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tu widzisz ostatnie projekty i szybkie skróty
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Wszystkich projektów</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
              <Users className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-sm text-muted-foreground">Klientów</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.accepted}</p>
              <p className="text-sm text-muted-foreground">Zaakceptowanych</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <TrendingUp className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recentCount}</p>
              <p className="text-sm text-muted-foreground">Nowych (7 dni)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status projektów
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
              <p className="text-3xl font-bold text-muted-foreground">{stats.new}</p>
              <p className="text-sm text-muted-foreground">Nowe</p>
            </div>
            <div className="rounded-lg border border-border bg-warning/5 p-4 text-center">
              <p className="text-3xl font-bold text-warning">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">W toku</p>
            </div>
            <div className="rounded-lg border border-border bg-primary/5 p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.sent}</p>
              <p className="text-sm text-muted-foreground">Wysłane</p>
            </div>
            <div className="rounded-lg border border-border bg-success/5 p-4 text-center">
              <p className="text-3xl font-bold text-success">{stats.accepted}</p>
              <p className="text-sm text-muted-foreground">Zaakceptowane</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick action */}
      <Button size="lg" onClick={() => navigate('/projects/new')} className="w-full sm:w-auto">
        <Plus className="mr-2 h-5 w-5" />
        Nowy projekt
      </Button>

      {/* Recent projects */}
      <Card>
        <CardHeader>
          <CardTitle>Ostatnie projekty</CardTitle>
          <CardDescription>Twoje najnowsze projekty</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentProjects.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Brak projektów. Utwórz pierwszy projekt!
            </p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{project.project_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.clients?.name || 'Nieznany klient'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[project.status]}>
                      {project.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      Otwórz
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
