import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, FileText, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const statuses = ['Nowy', 'Wycena w toku', 'Oferta wysłana', 'Zaakceptowany'] as const;

const statusColors: Record<string, string> = {
  'Nowy': 'bg-muted text-muted-foreground',
  'Wycena w toku': 'bg-warning/10 text-warning',
  'Oferta wysłana': 'bg-primary/10 text-primary',
  'Zaakceptowany': 'bg-success/10 text-success',
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { getProjectById, updateProject, getQuoteByProjectId } = useData();
  const navigate = useNavigate();

  const project = getProjectById(id!);
  const quote = getQuoteByProjectId(id!);

  if (!project) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Powrót do projektów
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Projekt nie został znaleziony.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusChange = (status: string) => {
    updateProject(project.id, { status: status as typeof statuses[number] });
    toast.success('Status zaktualizowany');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/projects')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót do projektów
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {project.project_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <Link to="/clients" className="hover:text-primary hover:underline">
                {project.client?.name || 'Nieznany klient'}
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(project.created_at).toLocaleDateString('pl-PL')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={project.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => navigate(`/projects/${id}/quote`)}>
          <Calculator className="mr-2 h-5 w-5" />
          Edytuj wycenę
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate(`/projects/${id}/pdf`)}>
          <FileText className="mr-2 h-5 w-5" />
          Generuj ofertę PDF
        </Button>
      </div>

      {/* Quote summary */}
      {quote && (
        <Card>
          <CardHeader>
            <CardTitle>Podsumowanie wyceny</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Materiały:</span>
                <span className="font-medium">{quote.summary_materials.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Robocizna:</span>
                <span className="font-medium">{quote.summary_labor.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marża ({quote.margin_percent}%):</span>
                <span className="font-medium">
                  {((quote.summary_materials + quote.summary_labor) * quote.margin_percent / 100).toFixed(2)} zł
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Kwota całkowita:</span>
                  <span className="text-primary">{quote.total.toFixed(2)} zł</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!quote && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Brak wyceny. Kliknij "Edytuj wycenę" aby dodać pozycje kosztorysu.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
