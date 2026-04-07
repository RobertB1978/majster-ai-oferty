/**
 * DocumentTemplates page — PR-17 (Mode A) + PR-04 (Mode B UI)
 *
 * Route: /app/document-templates
 *   (also accessible from /app/projects/:id for project-scoped use)
 *
 * Tryb A (domyślny): Szablony jako kod → formularz → PDF
 * Tryb B (FF_MODE_B_DOCX_ENABLED=true): Master DOCX → kopia robocza → pobieranie
 *
 * Mode switcher (tab) widoczny tylko gdy FF_MODE_B_DOCX_ENABLED=true.
 * Tryb A pozostaje nienaruszony i działa identycznie jak przed PR-04.
 *
 * Works with FF_NEW_SHELL ON/OFF.
 *
 * Query params:
 *   ?projectId=<uuid>  — pre-select project context (auto-fill + save)
 *   ?clientId=<uuid>   — pre-select client context (auto-fill)
 *   ?offerId=<uuid>    — pre-select offer context (auto-fill)
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FileText, FolderOpen, CheckCircle2, AlertCircle, FilePlus2 } from 'lucide-react';

import type { DocumentTemplate } from '@/data/documentTemplates';
import { TemplatesLibrary } from '@/components/documents/templates/TemplatesLibrary';
import { TemplateEditor } from '@/components/documents/templates/TemplateEditor';
import { ModeBTemplateSelector, ModeBDocumentCard } from '@/components/documents/mode-b';
import { useProjectsV2List, type ProjectStatus } from '@/hooks/useProjectsV2';
import { useDocumentInstances } from '@/hooks/useDocumentInstances';
import { FF_MODE_B_DOCX_ENABLED } from '@/config/featureFlags';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_I18N_KEY: Partial<Record<ProjectStatus, string>> = {
  ACTIVE: 'projects.statusActive',
  COMPLETED: 'projects.statusCompleted',
  ON_HOLD: 'projects.statusOnHold',
};

type ActiveMode = 'mode_a' | 'mode_b';

// ── DocumentTemplates ─────────────────────────────────────────────────────────

export default function DocumentTemplates() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const urlProjectId = searchParams.get('projectId') ?? null;
  const urlClientId = searchParams.get('clientId') ?? null;
  const urlOfferId = searchParams.get('offerId') ?? null;

  const [pickedProjectId, setPickedProjectId] = useState<string | null>(null);
  const projectId = urlProjectId ?? pickedProjectId;

  const { data: allProjects = [] } = useProjectsV2List('ALL');
  const projects = useMemo(
    () => allProjects.filter((p) => p.status !== 'CANCELLED'),
    [allProjects]
  );

  const pickedProject = useMemo(
    () => projects.find((p) => p.id === pickedProjectId) ?? null,
    [projects, pickedProjectId]
  );
  const clientId = urlClientId ?? pickedProject?.client_id ?? null;
  const offerId = urlOfferId ?? pickedProject?.source_offer_id ?? null;

  // Mode A state
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  // Mode B state — widoczny tylko gdy FF ON
  const [activeMode, setActiveMode] = useState<ActiveMode>('mode_a');
  // ID nowo utworzonej instancji Mode B (po wyborze szablonu)
  const [newModeBInstanceId, setNewModeBInstanceId] = useState<string | null>(null);

  // Istniejące instancje Mode B (filtrowane z document_instances)
  const { data: allInstances = [] } = useDocumentInstances(projectId ?? undefined);
  const modeBInstances = useMemo(
    () => allInstances.filter((inst) => inst.source_mode === 'mode_b'),
    [allInstances],
  );

  // ── Mode A handlers ──────────────────────────────────────────────────────────

  const handleSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
  };

  const handleSaved = (_instanceId: string) => {
    // Toast jest renderowany w TemplateEditor
  };

  // ── Mode A — Editor view ─────────────────────────────────────────────────────
  if (selectedTemplate) {
    return (
      <div className="h-full min-h-[calc(100vh-4rem)]">
        <TemplateEditor
          template={selectedTemplate}
          projectId={projectId}
          clientId={clientId}
          offerId={offerId}
          onBack={handleBack}
          onSaved={handleSaved}
        />
      </div>
    );
  }

  // ── Library + Mode switcher view ─────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold">{t('docTemplates.page.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('docTemplates.page.subtitle')}</p>
        </div>
      </div>

      {/* Mode switcher — tylko gdy FF_MODE_B_DOCX_ENABLED */}
      {FF_MODE_B_DOCX_ENABLED && (
        <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
          <button
            onClick={() => setActiveMode('mode_a')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
              activeMode === 'mode_a'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Tryb A — szybki PDF</span>
          </button>
          <button
            onClick={() => setActiveMode('mode_b')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
              activeMode === 'mode_b'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <FilePlus2 className="w-4 h-4 shrink-0" />
            <span>Tryb B — pełny dokument</span>
          </button>
        </div>
      )}

      {/* Project selector (when no projectId from URL) */}
      {!urlProjectId && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm font-medium">{t('docTemplates.page.selectProject')}</p>
          </div>

          {projects.length === 0 ? (
            <div className="flex items-center gap-2 py-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-muted-foreground">
                {t('docTemplates.page.noProjects')}
              </p>
            </div>
          ) : (
            <Select
              value={pickedProjectId ?? ''}
              onValueChange={(val) => setPickedProjectId(val || null)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t('docTemplates.page.selectProjectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      {p.title}
                      {p.status !== 'ACTIVE' && STATUS_I18N_KEY[p.status] && (
                        <span className="text-xs text-muted-foreground">
                          ({t(STATUS_I18N_KEY[p.status]!)})
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {pickedProject && (
            <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{pickedProject.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t('docTemplates.page.projectLinked')}
                </p>
              </div>
            </div>
          )}

          {!pickedProjectId && projects.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('docTemplates.page.selectProjectHint')}
            </p>
          )}
        </div>
      )}

      {/* Context info (if project-scoped via URL) */}
      {urlProjectId && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {t('docTemplates.page.projectContext')}
          </p>
        </div>
      )}

      {/* ── Mode A: biblioteka szablonów (istniejący flow, nienaruszony) ────── */}
      {(!FF_MODE_B_DOCX_ENABLED || activeMode === 'mode_a') && (
        <TemplatesLibrary onSelectTemplate={handleSelect} />
      )}

      {/* ── Mode B: wybór szablonu DOCX + lista instancji (za FF) ───────────── */}
      {FF_MODE_B_DOCX_ENABLED && activeMode === 'mode_b' && (
        <div className="space-y-6">
          {/* Informacja o trybie */}
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Tryb B — dokumenty DOCX
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              Wybierz szablon, aby utworzyć pełny dokument Word. Po wygenerowaniu
              możesz go pobrać, zatwierdzić i oznaczyć jako wysłany.
            </p>
          </div>

          {/* Wybór nowego szablonu */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Wybierz szablon</h2>
            <ModeBTemplateSelector
              projectId={projectId}
              clientId={clientId}
              offerId={offerId}
              onInstanceCreated={(id) => {
                setNewModeBInstanceId(id);
              }}
            />
          </div>

          {/* Istniejące dokumenty Mode B (w kontekście projektu lub wszystkie) */}
          {modeBInstances.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3">
                Twoje dokumenty DOCX
                {projectId && <span className="font-normal text-muted-foreground"> — tego projektu</span>}
              </h2>
              <div className="space-y-3">
                {modeBInstances.map((inst) => (
                  <ModeBDocumentCard
                    key={inst.id}
                    instance={inst}
                    templateName={inst.title ?? undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Highlight nowo utworzonej instancji — scroll hint */}
          {newModeBInstanceId && modeBInstances.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Dokument został utworzony. Odśwież stronę, aby go zobaczyć na liście.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
