/**
 * DocumentTemplates page — PR-17
 *
 * Route: /app/document-templates
 *   (also accessible from /app/projects/:id for project-scoped use)
 *
 * Two-view layout:
 *   1. Library — list of all templates (search + category filter)
 *   2. Editor  — fill form + generate PDF + save to dossier
 *
 * Works with FF_NEW_SHELL ON/OFF.
 *
 * Query params:
 *   ?projectId=<uuid>  — pre-select project context (auto-fill + save)
 *   ?clientId=<uuid>   — pre-select client context (auto-fill)
 *   ?offerId=<uuid>    — pre-select offer context (auto-fill)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FileText, FolderOpen } from 'lucide-react';

import type { DocumentTemplate } from '@/data/documentTemplates';
import { TemplatesLibrary } from '@/components/documents/templates/TemplatesLibrary';
import { TemplateEditor } from '@/components/documents/templates/TemplateEditor';
import { useProjectsV2List } from '@/hooks/useProjectsV2';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── DocumentTemplates ─────────────────────────────────────────────────────────

export default function DocumentTemplates() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const urlProjectId = searchParams.get('projectId') ?? null;
  const clientId = searchParams.get('clientId') ?? null;
  const offerId = searchParams.get('offerId') ?? null;

  const [pickedProjectId, setPickedProjectId] = useState<string | null>(null);
  const projectId = urlProjectId ?? pickedProjectId;

  const { data: projects = [] } = useProjectsV2List('ACTIVE');

  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  const handleSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
  };

  const handleSaved = (_instanceId: string) => {
    // Optionally navigate to project hub / dossier
    // For now just show toast (handled in TemplateEditor)
  };

  // ── Editor view ─────────────────────────────────────────────────────────────
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
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('docTemplates.page.selectProjectHint')}
          </p>
        </div>
      )}

      {/* Context info (if project-scoped) */}
      {urlProjectId && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {t('docTemplates.page.projectContext')}
          </p>
        </div>
      )}

      {/* Library */}
      <TemplatesLibrary onSelectTemplate={handleSelect} />
    </div>
  );
}
