/**
 * NewProjectV2 — PR-13 fix + Sprint C project templates + Sprint D activation
 *
 * Formularz tworzenia nowego projektu V2 bezpośrednio w kontekście zakładki Projekty.
 * Zostaje w ścieżce /app/projects/* więc zakładka Projekty pozostaje aktywna.
 *
 * Sprint C: Opcjonalny wybór szablonu startowego, który wstępnie wypełnia tytuł
 * i pokazuje sugerowane etapy projektu.
 * Sprint D2: Etapy szablonu są teraz zapisywane do stages_json projektu,
 * dzięki czemu są widoczne i edytowalne w ProjectHub po utworzeniu projektu.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FolderKanban, Loader2, Info, Layers, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

import { useCreateProjectV2 } from '@/hooks/useProjectsV2';
import { useClients } from '@/hooks/useClients';
import { projectTemplates } from '@/data/projectTemplates';
import type { ProjectTemplate } from '@/data/projectTemplates';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function NewProjectV2() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createProject = useCreateProjectV2();
  const { data: clients = [], isLoading: clientsLoading } = useClients();

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSelectTemplate = (tpl: ProjectTemplate) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.titleSuggestion);
    setShowTemplates(false);
  };

  const handleClearTemplate = () => {
    setSelectedTemplate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error(t('validation.projectNameRequired'));
      return;
    }
    try {
      // Sprint D2: convert template phases to ProjectStage records so they
      // are immediately visible and editable in ProjectHub after creation.
      const starterStages = selectedTemplate
        ? selectedTemplate.phases.map((phase, idx) => ({
            name: phase.name,
            due_date: null,
            is_done: false,
            sort_order: idx,
          }))
        : undefined;

      const project = await createProject.mutateAsync({
        title: trimmed,
        client_id: clientId && clientId !== 'none' ? clientId : null,
        stages_json: starterStages,
      });
      toast.success(t('projectsV2.createSuccess'));
      navigate(`/app/projects/${project.id}`);
    } catch {
      toast.error(t('projectsV2.createError'));
    }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/app/projects">{t('nav.projects')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('projectsV2.newProject')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Nagłówek */}
      <div className="flex items-center gap-2 mb-6">
        <FolderKanban className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">{t('projectsV2.newProject')}</h1>
      </div>

      {/* Kontekst: ścieżka alternatywna */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-4 py-3 mb-5 flex gap-2.5 items-start text-sm text-amber-800 dark:text-amber-300">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>{t('projectsV2.manualCreationHint')}</p>
      </div>

      {/* ── Sekcja szablonów startowych ───────────────────────────────── */}
      <div className="mb-5">
        {/* Przycisk rozwijający */}
        {!selectedTemplate && (
          <button
            type="button"
            onClick={() => setShowTemplates((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all text-sm group"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">
                {t('projectTemplates.chooseSuggestion')}
              </span>
            </div>
            {showTemplates ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-primary" />
            )}
          </button>
        )}

        {/* Wybrany szablon — podsumowanie */}
        {selectedTemplate && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-medium text-primary">
                  {t('projectTemplates.templateSelected')}: {selectedTemplate.titleSuggestion}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearTemplate}
                className="text-xs text-muted-foreground hover:text-foreground underline shrink-0"
              >
                {t('common.cancel')}
              </button>
            </div>
            {/* Fazy szablonu */}
            <div className="pl-6 space-y-1">
              {selectedTemplate.phases.map((phase, idx) => (
                <p key={idx} className="text-xs text-muted-foreground">
                  {idx + 1}. {phase.name}
                </p>
              ))}
            </div>
            <p className="pl-6 text-xs text-muted-foreground italic">
              {t('projectTemplates.phasesHint')}
            </p>
          </div>
        )}

        {/* Lista szablonów */}
        {showTemplates && !selectedTemplate && (
          <div className="mt-2 space-y-2">
            {projectTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className="w-full text-left rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 p-3 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{tpl.titleSuggestion}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tpl.bestFor}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-primary">{tpl.phases.length} {t('projectTemplates.phasesCount')}</span>
                      <span className="text-xs text-muted-foreground">· {tpl.estimatedDuration}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Formularz ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="projectTitle">{t('newProject.projectNameLabel')}</Label>
          <Input
            id="projectTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('newProject.projectNamePlaceholder')}
            autoFocus={!showTemplates}
            required
            className={cn(selectedTemplate && 'border-primary/40')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">
            {t('newProject.clientLabel')}{' '}
            <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
          </Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger id="client">
              <SelectValue
                placeholder={
                  clientsLoading
                    ? t('common.loading')
                    : t('projectsV2.selectClientPlaceholder')
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('common.none')}</SelectItem>
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
