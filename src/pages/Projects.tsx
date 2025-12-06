import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { Plus, Loader2, FolderKanban, Download } from 'lucide-react';
import { exportProjectsToCSV } from '@/lib/exportUtils';

const statusColors: Record<string, string> = {
  'Nowy': 'bg-muted text-muted-foreground',
  'Wycena w toku': 'bg-warning/10 text-warning',
  'Oferta wysłana': 'bg-primary/10 text-primary',
  'Zaakceptowany': 'bg-success/10 text-success',
};

const statusOptions = [
  { value: 'all', label: 'Wszystkie statusy' },
  { value: 'Nowy', label: 'Nowy' },
  { value: 'Wycena w toku', label: 'Wycena w toku' },
  { value: 'Oferta wysłana', label: 'Oferta wysłana' },
  { value: 'Zaakceptowany', label: 'Zaakceptowany' },
];

export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter projects
  const filteredProjects = useMemo(() => {
    let result = projects;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(project => 
        project.project_name.toLowerCase().includes(query) ||
        project.clients?.name?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(project => project.status === statusFilter);
    }

    return result;
  }, [projects, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-md">
              <FolderKanban className="h-5 w-5 text-primary-foreground" />
            </div>
            Projekty
          </h1>
          <p className="text-muted-foreground mt-1">Zarządzaj projektami i wycenami</p>
        </div>
        <div className="flex gap-2">
          {projects.length > 0 && (
            <Button variant="outline" onClick={() => exportProjectsToCSV(projects)} className="hover:bg-primary/5">
              <Download className="mr-2 h-4 w-4" />
              Eksportuj
            </Button>
          )}
          <Button size="lg" onClick={() => navigate('/projects/new')} className="shadow-lg bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300">
            <Plus className="mr-2 h-5 w-5" />
            Nowy projekt
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      {projects.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="Szukaj projektu lub klienta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtruj po statusie" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Ładowanie projektów...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FolderKanban className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Brak projektów</h3>
            <p className="text-muted-foreground mb-4">Utwórz pierwszy projekt, aby rozpocząć</p>
            <Button onClick={() => navigate('/projects/new')} className="bg-gradient-to-r from-primary to-primary-glow">
              <Plus className="mr-2 h-4 w-4" />
              Nowy projekt
            </Button>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-2">Nie znaleziono projektów pasujących do kryteriów.</p>
            <div className="mt-2 flex justify-center gap-2">
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  Wyczyść wyszukiwanie
                </Button>
              )}
              {statusFilter !== 'all' && (
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>
                  Pokaż wszystkie
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project, index) => (
            <Card key={project.id} className="group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300" style={{ animationDelay: `${index * 30}ms` }}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 flex-1">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.project_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Klient: {project.clients?.name || 'Nieznany'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[project.status] || statusColors['Nowy']}>
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
          ))}
        </div>
      )}

      {/* Results count */}
      {(searchQuery || statusFilter !== 'all') && filteredProjects.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Znaleziono: {filteredProjects.length} z {projects.length} projektów
        </p>
      )}
    </div>
  );
}
