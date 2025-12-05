import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { Plus, Loader2, FolderKanban } from 'lucide-react';

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
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Projekty</h1>
        <Button size="lg" onClick={() => navigate('/projects/new')}>
          <Plus className="mr-2 h-5 w-5" />
          Nowy projekt
        </Button>
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
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Brak projektów. Utwórz pierwszy projekt!</p>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nie znaleziono projektów pasujących do kryteriów.</p>
            <div className="mt-2 flex justify-center gap-2">
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery('')}>
                  Wyczyść wyszukiwanie
                </Button>
              )}
              {statusFilter !== 'all' && (
                <Button variant="link" onClick={() => setStatusFilter('all')}>
                  Pokaż wszystkie statusy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="animate-slide-in">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{project.project_name}</p>
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
