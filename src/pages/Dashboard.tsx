import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Users, FileText } from 'lucide-react';

const statusColors: Record<string, string> = {
  'Nowy': 'bg-muted text-muted-foreground',
  'Wycena w toku': 'bg-warning/10 text-warning',
  'Oferta wysłana': 'bg-primary/10 text-primary',
  'Zaakceptowany': 'bg-success/10 text-success',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { projects, clients, getClientById } = useData();
  const navigate = useNavigate();

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-sm text-muted-foreground">Projektów</p>
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
              <FileText className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {projects.filter(p => p.status === 'Zaakceptowany').length}
              </p>
              <p className="text-sm text-muted-foreground">Zaakceptowanych</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
          {recentProjects.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Brak projektów. Utwórz pierwszy projekt!
            </p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => {
                const client = getClientById(project.client_id);
                return (
                  <div
                    key={project.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{project.project_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client?.name || 'Nieznany klient'}
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
