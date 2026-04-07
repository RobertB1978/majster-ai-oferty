/**
 * ReadyDocuments page — PR-B2 (wire Mode B infrastructure)
 *
 * Route: /app/ready-documents
 *
 * Premium workspace for ready-made DOCX documents.
 * PR-B1: shell — category nav, layout structure.
 * PR-B2: real Mode B wiring — templates, instances, cards, split layout.
 *
 * Desktop: split layout — left panel (320px) + right workspace
 * Mobile: full-width stacked layout
 *
 * Safety rules enforced here:
 *   - only source_mode='mode_b' instances shown
 *   - only is_active=true master templates (enforced in useModeBMasterTemplates via RLS + query)
 *   - archived instances excluded from the list
 *   - no fake actions, no dead buttons — ModeBDocumentCard handles this internally
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCheck,
  FileText,
  ClipboardList,
  FileStack,
  ShieldCheck,
  MoreHorizontal,
  FileX,
  PanelRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeBTemplateSelector } from '@/components/documents/mode-b/ModeBTemplateSelector';
import { ModeBDocumentCard } from '@/components/documents/mode-b/ModeBDocumentCard';
import { ModeBStatusBadge } from '@/components/documents/mode-b/ModeBStatusBadge';
import { useModeBInstances } from '@/hooks/useModeBDocumentInstances';
import { useModeBMasterTemplates } from '@/hooks/useModeBMasterTemplates';
import type { MasterTemplateCategory } from '@/types/document-mode-b';
import type { DocumentInstance } from '@/hooks/useDocumentInstances';

// ── Category definitions ──────────────────────────────────────────────────────

interface CategoryMeta {
  id: MasterTemplateCategory;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'CONTRACTS',  labelKey: 'readyDocs.categories.contracts',  icon: FileText },
  { id: 'PROTOCOLS',  labelKey: 'readyDocs.categories.protocols',  icon: ClipboardList },
  { id: 'ANNEXES',    labelKey: 'readyDocs.categories.annexes',    icon: FileStack },
  { id: 'COMPLIANCE', labelKey: 'readyDocs.categories.compliance', icon: ShieldCheck },
  { id: 'OTHER',      labelKey: 'readyDocs.categories.other',      icon: MoreHorizontal },
];

// ── InstanceListItem ──────────────────────────────────────────────────────────

interface InstanceListItemProps {
  instance: DocumentInstance;
  templateName: string | undefined;
  isSelected: boolean;
  onClick: () => void;
}

function InstanceListItem({ instance, templateName, isSelected, onClick }: InstanceListItemProps) {
  const label = instance.title ?? templateName ?? instance.template_key;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-md px-3 py-2.5 transition-all duration-150 group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1',
        'min-h-[44px]',
        isSelected
          ? 'bg-primary/10 border border-primary/30'
          : 'hover:bg-muted border border-transparent',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn(
          'text-sm font-medium truncate',
          isSelected ? 'text-primary' : 'text-foreground',
        )}>
          {label}
        </p>
        <ModeBStatusBadge status={instance.status} />
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {new Date(instance.created_at).toLocaleDateString('pl-PL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
      </p>
    </button>
  );
}

// ── WorkspaceEmpty ────────────────────────────────────────────────────────────

function WorkspaceEmpty({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] px-6 py-16 text-center">
      <div className="p-4 rounded-2xl bg-muted/50 mb-5">
        <PanelRight className="w-9 h-9 text-muted-foreground/40" />
      </div>
      <h2 className="text-base font-semibold text-foreground mb-2">
        {t('readyDocs.workspace.empty.title')}
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('readyDocs.workspace.empty.description')}
      </p>
    </div>
  );
}

// ── ReadyDocuments ────────────────────────────────────────────────────────────

export default function ReadyDocuments() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<MasterTemplateCategory>('CONTRACTS');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  // All mode_b instances for the current user (source_mode='mode_b' filter is in hook)
  const { data: allInstances = [], isLoading: instancesLoading } = useModeBInstances();

  // Master templates for the active category (is_active=true filter is in hook + RLS)
  const { data: categoryTemplates = [] } = useModeBMasterTemplates(activeCategory);

  // Build a lookup map: master_template_id → template name
  // Fetched without category filter to cover all instances regardless of current tab
  const { data: allTemplates = [] } = useModeBMasterTemplates();
  const templateNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const tmpl of allTemplates) {
      map.set(tmpl.id, tmpl.name);
    }
    return map;
  }, [allTemplates]);

  // IDs of templates in the active category
  const categoryTemplateIds = useMemo(
    () => new Set(categoryTemplates.map((t) => t.id)),
    [categoryTemplates],
  );

  // Filter instances: only those belonging to this category, exclude archived
  const categoryInstances = useMemo(
    () =>
      allInstances.filter(
        (inst) =>
          inst.master_template_id !== null &&
          categoryTemplateIds.has(inst.master_template_id) &&
          inst.status !== 'archived',
      ),
    [allInstances, categoryTemplateIds],
  );

  // The selected instance (full object for ModeBDocumentCard)
  const selectedInstance = useMemo(
    () => allInstances.find((i) => i.id === selectedInstanceId) ?? null,
    [allInstances, selectedInstanceId],
  );

  // When a new instance is created, auto-select it
  function handleInstanceCreated(instanceId: string) {
    setSelectedInstanceId(instanceId);
  }

  // When category changes, clear selection if the selected instance is not in new category
  function handleCategoryChange(cat: MasterTemplateCategory) {
    setActiveCategory(cat);
    if (selectedInstance?.master_template_id && !categoryTemplateIds.has(selectedInstance.master_template_id)) {
      // Will be re-evaluated after categoryTemplateIds updates, but safe to clear now
      setSelectedInstanceId(null);
    }
  }

  return (
    <div className="h-full min-h-[calc(100vh-4rem)]">
      {/* ── Desktop: split layout ─────────────────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:h-full">

        {/* ── Left panel — category nav + template selector + instances ── */}
        <div className="flex flex-col border-r border-border bg-muted/20 lg:h-full lg:overflow-y-auto">

          {/* Page header */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-border shrink-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">{t('readyDocs.page.title')}</h1>
              <p className="text-xs text-muted-foreground truncate">{t('readyDocs.page.subtitle')}</p>
            </div>
          </div>

          {/* Category tabs */}
          <nav className="px-3 py-3 space-y-0.5 shrink-0" aria-label={t('readyDocs.page.title')}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 min-h-[44px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="truncate">{t(cat.labelKey)}</span>
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t border-border mx-3" />

          {/* Template selector — create new document */}
          <div className="px-4 py-4 border-b border-border shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t('readyDocs.newDocument.title')}
            </p>
            <ModeBTemplateSelector
              category={activeCategory}
              onInstanceCreated={handleInstanceCreated}
            />
          </div>

          {/* Instances list — existing documents in this category */}
          <div className="flex-1 px-4 py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t('readyDocs.instances.title')}
            </p>

            {instancesLoading ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                {t('readyDocs.instances.loading')}
              </div>
            ) : categoryInstances.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <FileX className="w-7 h-7 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {t('readyDocs.instances.empty.description')}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {categoryInstances.map((inst) => (
                  <InstanceListItem
                    key={inst.id}
                    instance={inst}
                    templateName={
                      inst.master_template_id
                        ? templateNameMap.get(inst.master_template_id)
                        : undefined
                    }
                    isSelected={selectedInstanceId === inst.id}
                    onClick={() => setSelectedInstanceId(inst.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel — selected document workspace ──────────────────── */}
        <div className="lg:h-full lg:overflow-y-auto">
          {selectedInstance ? (
            <div className="p-6 max-w-2xl">
              <ModeBDocumentCard
                instance={selectedInstance}
                templateName={
                  selectedInstance.master_template_id
                    ? templateNameMap.get(selectedInstance.master_template_id)
                    : undefined
                }
              />
            </div>
          ) : (
            <WorkspaceEmpty t={t} />
          )}
        </div>

      </div>
    </div>
  );
}
