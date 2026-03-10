/**
 * NewProjectV2 — PR-13 fix
 *
 * Formularz tworzenia nowego projektu V2 bezpośrednio w kontekście zakładki Projekty.
 * Zostaje w ścieżce /app/projects/* więc zakładka Projekty pozostaje aktywna.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FolderKanban, Loader2 } from 'lucide-react';

import { useCreateProjectV2 } from '@/hooks/useProjectsV2';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function NewProjectV2() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createProject = useCreateProjectV2();
  const { data: clients = [], isLoading: clientsLoading } = useClients();

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error(t('validation.projectNameRequired'));
      return;
    }
    try {
      const project = await createProject.mutateAsync({
        title: trimmed,
        client_id: clientId || null,
      });
      toast.success(t('projectsV2.createSuccess'));
      navigate(`/app/projects/${project.id}`);
    } catch {
      toast.error(t('projectsV2.createError'));
    }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Nagłówek */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/projects')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">{t('projectsV2.newProject')}</h1>
        </div>
      </div>

      {/* Formularz */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="projectTitle">{t('newProject.projectNameLabel')}</Label>
          <Input
            id="projectTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('newProject.projectNamePlaceholder')}
            autoFocus
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">
            {t('newProject.clientLabel')}{' '}
            <span className="text-muted-foreground text-xs">({t('common.optional', 'opcjonalnie')})</span>
          </Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger id="client">
              <SelectValue
                placeholder={
                  clientsLoading
                    ? t('common.loading')
                    : t('projectsV2.selectClientPlaceholder', 'Wybierz klienta (opcjonalnie)')
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('common.none', 'Brak')}</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={createProject.isPending || !title.trim()}
        >
          {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {createProject.isPending ? t('projectsV2.creating') : t('newProject.createProject')}
        </Button>
      </form>
    </div>
  );
}
