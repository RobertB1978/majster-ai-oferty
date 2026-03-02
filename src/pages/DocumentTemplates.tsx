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
import { FileText } from 'lucide-react';

import type { DocumentTemplate } from '@/data/documentTemplates';
import { TemplatesLibrary } from '@/components/documents/templates/TemplatesLibrary';
import { TemplateEditor } from '@/components/documents/templates/TemplateEditor';

// ── DocumentTemplates ─────────────────────────────────────────────────────────

export default function DocumentTemplates() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const projectId = searchParams.get('projectId') ?? null;
  const clientId = searchParams.get('clientId') ?? null;
  const offerId = searchParams.get('offerId') ?? null;

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

      {/* Context info (if project-scoped) */}
      {projectId && (
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
