import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { useAddProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewProject() {
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const addProject = useAddProject();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [clientId, setClientId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast.error('Podaj nazwę projektu');
      return;
    }

    if (!clientId) {
      toast.error('Wybierz klienta');
      return;
    }

    const project = await addProject.mutateAsync({
      project_name: projectName,
      client_id: clientId,
      status: 'Nowy',
    });

    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate('/projects')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Powrót do projektów
      </Button>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Nowy projekt</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nazwa projektu</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="np. Remont łazienki"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Klient</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={clientsLoading ? "Ładowanie..." : "Wybierz klienta"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!clientsLoading && clients.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Brak klientów.{' '}
                  <Button variant="link" className="h-auto p-0" onClick={() => navigate('/clients')}>
                    Dodaj klienta
                  </Button>
                </p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={addProject.isPending}
            >
              {addProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Utwórz projekt
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
