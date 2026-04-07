/**
 * DocumentTemplates page — PR-17 (Mode A)
 *
 * Route: /app/document-templates
 *   (also accessible from /app/projects/:id for project-scoped use)
 *
 * Mode A: Szablony jako kod → formularz → PDF
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
import { FileText, FolderOpen, CheckCircle2, AlertCircle } from 'lucide-react';

import type { DocumentTemplate } from '@/data/documentTemplates';
import { TemplatesLibrary } from '@/components/documents/templates/TemplatesLibrary';
import { TemplateEditor } from '@/components/documents/templates/TemplateEditor';
import { useProjectsV2List, type ProjectStatus } from '@/hooks/useProjectsV2';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_I18N_KEY: Partial<Record<ProjectStatus, string>> = {
  ACTIVE: 'projects.statusActive',
  COMPLETED: 'projects.statusCompleted',
  ON_HOLD: 'projects.statusOnHold',
};

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

  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
  };

  const handleSaved = (_instanceId: string) => {
    // Toast jest renderowany w TemplateEditor
  };

  // ── Editor view ──────────────────────────────────────────────────────────────
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

  // ── Library view ─────────────────────────────────────────────────────────────
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

      {/* Biblioteka szablonów (istniejący flow, nienaruszony) */}
      <TemplatesLibrary onSelectTemplate={handleSelect} />
    </div>
  );
}
