import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

const statusColors: Record<string, string> = {
  'Nowy': 'bg-muted text-muted-foreground',
  'Wycena w toku': 'bg-warning/10 text-warning',
  'Oferta wysłana': 'bg-primary/10 text-primary',
  'Zaakceptowany': 'bg-success/10 text-success',
};

export default function Projects() {
  const { projects, getClientById } = useData();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Projekty</h1>
        <Button size="lg" onClick={() => navigate('/projects/new')}>
          <Plus className="mr-2 h-5 w-5" />
          Nowy projekt
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Brak projektów. Utwórz pierwszy projekt!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const client = getClientById(project.client_id);
            return (
              <Card key={project.id} className="animate-slide-in">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{project.project_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Klient: {client?.name || 'Nieznany'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[project.status]}>
                      {project.status}
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      Otwórz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
