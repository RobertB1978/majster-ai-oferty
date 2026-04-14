/**
 * ReadyDocuments page — PR-B3 + PR-B4 (publish gate)
 *
 * Route: /app/ready-documents
 *
 * PR-B1: shell — category nav, layout structure.
 * PR-B2: real Mode B wiring — templates, instances, cards, split layout.
 * PR-B3: workspace panel — URL-stable selected-document state, mobile detail flow,
 *        document info/summary block, honest disabled states, stale-selection guard.
 * PR-B4: publish gate — category counts from publish-safe templates only,
 *        template-unavailable warning when instance's template is deactivated.
 * PR-B5: owner content pipeline — OwnerDiagnosticPanel (behind FF_OWNER_DIAGNOSTIC),
 *        shows inventory vs publish-safe state so owner knows what to upload/activate.
 *
 * Desktop: split layout — left panel (320px) + right workspace
 * Mobile: single-panel pattern — list view OR detail view (back button to return to list)
 *
 * Selected document: persisted in URL search param ?doc=<id> for refresh stability.
 * Stale-selection guard: if selected instance disappears (deleted), selection is cleared.
 *
 * Safety rules enforced here (PR-B4):
 *   - only source_mode='mode_b' instances shown
 *   - only publish-safe templates (is_active=true + docx_master_path IS NOT NULL)
 *     enforced in useModeBMasterTemplates (hook-level gate + RLS)
 *   - category counts reflect only publish-safe templates
 *   - archived instances excluded from the list
 *   - workspace warns when selected instance's template is no longer publish-safe
 *   - no fake actions, no dead buttons — ModeBDocumentCard handles this internally
 *   - no fake editor/preview — DocInfoBlock shows honest file-availability state
 *
 * Owner diagnostic (PR-B5, FF_OWNER_DIAGNOSTIC=true only):
 *   - OwnerDiagnosticPanel rendered at bottom of left panel
 *   - Compares premiumTemplateInventory vs allTemplates (publish-safe)
 *   - Shows pending templates with expected storage paths
 *   - NEVER visible to regular users (flag defaults to false)
 */

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  FileCheck,
  FileText,
  ClipboardList,
  FileStack,
  ShieldCheck,
  MoreHorizontal,
  FileX,
  PanelRight,
  ArrowLeft,
  FolderOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  ChevronDown,
  ChevronUp,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModeBTemplateSelector } from '@/components/documents/mode-b/ModeBTemplateSelector';
import { ModeBDocumentCard } from '@/components/documents/mode-b/ModeBDocumentCard';
import { ModeBStatusBadge } from '@/components/documents/mode-b/ModeBStatusBadge';
import { useModeBInstances } from '@/hooks/useModeBDocumentInstances';
import { useModeBMasterTemplates } from '@/hooks/useModeBMasterTemplates';
import { FF_OWNER_DIAGNOSTIC, FF_MODE_B_DOCX_ENABLED } from '@/config/featureFlags';
import {
  PREMIUM_TEMPLATE_INVENTORY,
  getPendingInventoryEntries,
} from '@/data/premiumTemplateInventory';
import type { MasterTemplateCategory, DocumentMasterTemplate } from '@/types/document-mode-b';
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

const CATEGORY_LABEL_KEY: Record<MasterTemplateCategory, string> = {
  CONTRACTS:  'readyDocs.categories.contracts',
  PROTOCOLS:  'readyDocs.categories.protocols',
  ANNEXES:    'readyDocs.categories.annexes',
  COMPLIANCE: 'readyDocs.categories.compliance',
  OTHER:      'readyDocs.categories.other',
};

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
        'w-full text-left rounded-md px-3 py-2.5 transition-all duration-150',
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

// ── DocInfoBlock ──────────────────────────────────────────────────────────────
// Document info/summary block — shows template metadata and honest file availability.
// No fake preview, no fake editing UI.

interface DocInfoBlockProps {
  instance: DocumentInstance;
  template: DocumentMasterTemplate | undefined;
  t: (key: string) => string;
}

function DocInfoBlock({ instance, template, t }: DocInfoBlockProps) {
  const hasDocx = !!instance.file_docx;
  const hasPdf = !!instance.pdf_path;

  return (
    <div className="border rounded-lg p-4 bg-muted/20 space-y-3 mt-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {t('readyDocs.docInfo.title')}
      </h3>

      <dl className="space-y-2">
        {/* Category */}
        {template && (
          <div className="flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <dt className="text-xs text-muted-foreground w-32 shrink-0">
              {t('readyDocs.docInfo.category')}
            </dt>
            <dd className="text-xs font-medium truncate">
              {t(CATEGORY_LABEL_KEY[template.category])}
            </dd>
          </div>
        )}

        {/* Template key */}
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <dt className="text-xs text-muted-foreground w-32 shrink-0">
            {t('readyDocs.docInfo.templateKey')}
          </dt>
          <dd className="text-xs font-mono text-muted-foreground truncate">
            {instance.template_key}
          </dd>
        </div>

        {/* Template version locked at creation */}
        {instance.master_template_version && (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <dt className="text-xs text-muted-foreground w-32 shrink-0">
              {t('readyDocs.docInfo.templateVersion')}
            </dt>
            <dd className="text-xs text-muted-foreground">
              v{instance.master_template_version}
            </dd>
          </div>
        )}

        {/* DOCX file — honest availability */}
        <div className="flex items-center gap-2">
          <CheckCircle2
            className={cn(
              'w-3.5 h-3.5 shrink-0',
              hasDocx ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground/40',
            )}
          />
          <dt className="text-xs text-muted-foreground w-32 shrink-0">
            {t('readyDocs.docInfo.docxFile')}
          </dt>
          <dd className={cn(
            'text-xs font-medium',
            hasDocx ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground',
          )}>
            {hasDocx ? t('readyDocs.docInfo.available') : t('readyDocs.docInfo.notAvailable')}
          </dd>
        </div>

        {/* PDF file — honest availability */}
        <div className="flex items-center gap-2">
          <CheckCircle2
            className={cn(
              'w-3.5 h-3.5 shrink-0',
              hasPdf ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground/40',
            )}
          />
          <dt className="text-xs text-muted-foreground w-32 shrink-0">
            {t('readyDocs.docInfo.pdfFile')}
          </dt>
          <dd className={cn(
            'text-xs font-medium',
            hasPdf ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground',
          )}>
            {hasPdf ? t('readyDocs.docInfo.available') : t('readyDocs.docInfo.notAvailable')}
          </dd>
        </div>
      </dl>
    </div>
  );
}

// ── OwnerDiagnosticPanel ──────────────────────────────────────────────────────
// Visible only when FF_OWNER_DIAGNOSTIC=true. Never rendered for regular users.
// Shows inventory vs publish-safe state: which templates still need upload / activation.

interface OwnerDiagnosticPanelProps {
  publishSafeTemplateKeys: Set<string>;
  isLoading: boolean;
}

function OwnerDiagnosticPanel({ publishSafeTemplateKeys, isLoading }: OwnerDiagnosticPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const pendingEntries = useMemo(
    () => getPendingInventoryEntries(publishSafeTemplateKeys),
    [publishSafeTemplateKeys],
  );

  const totalInventory = PREMIUM_TEMPLATE_INVENTORY.length;
  const publishSafeCount = publishSafeTemplateKeys.size;
  const pendingCount = pendingEntries.length;

  return (
    <div className="border-t border-amber-200 dark:border-amber-800 mx-3 mt-2 pt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-1 py-1.5 rounded text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-600"
      >
        <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex-1">
          Diagnostyka właściciela
        </span>
        <span className="text-xs font-mono text-amber-700 dark:text-amber-400 shrink-0">
          {isLoading ? '…' : `${publishSafeCount}/${totalInventory}`}
        </span>
        {expanded
          ? <ChevronUp className="w-3 h-3 text-amber-500 shrink-0" />
          : <ChevronDown className="w-3 h-3 text-amber-500 shrink-0" />
        }
      </button>

      {expanded && (
        <div className="mt-2 mb-1 space-y-2 px-1">
          {/* Summary line */}
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {isLoading
              ? 'Ładowanie stanu szablonów…'
              : pendingCount === 0
                ? `Wszystkie ${totalInventory} szablony są publish-safe. ✓`
                : `${pendingCount} z ${totalInventory} szablonów czeka na upload/aktywację:`
            }
          </p>

          {/* Pending templates list */}
          {!isLoading && pendingEntries.map((entry) => (
            <div
              key={entry.templateKey}
              className="rounded border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10 p-2 space-y-1"
            >
              <div className="flex items-start gap-1.5">
                <Upload className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200 leading-tight">
                  {entry.name}
                </p>
              </div>
              <p className="text-xs font-mono text-amber-700 dark:text-amber-400 break-all leading-tight pl-4">
                {entry.expectedStoragePath}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-500 pl-4 leading-tight">
                {entry.contentNote}
              </p>
            </div>
          ))}

          {/* Help link */}
          <p className="text-xs text-amber-700 dark:text-amber-500 pt-1 leading-relaxed">
            Instrukcja: <span className="font-mono">docs/PREMIUM_DOCX_ONBOARDING.md</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── ReadyDocuments ────────────────────────────────────────────────────────────

export default function ReadyDocuments() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<MasterTemplateCategory>('CONTRACTS');

  /**
   * Mobile view mode: on small screens (below lg) we show either the list panel OR the
   * detail/workspace panel — never both stacked. Desktop always shows both side by side.
   *
   * Choosing a document on mobile switches to 'detail'. The back button returns to 'list'.
   */
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Selected instance ID — persisted in URL ?doc=<id> for refresh stability.
  const selectedInstanceId = searchParams.get('doc') ?? null;

  // All mode_b instances for the current user (source_mode='mode_b' filter is in hook)
  const { data: allInstances = [], isLoading: instancesLoading } = useModeBInstances();

  // Master templates for the active category (publish-safe: is_active=true + docx_master_path NOT NULL)
  const { data: categoryTemplates = [] } = useModeBMasterTemplates(activeCategory);

  // All publish-safe templates (no category filter) — for name lookup, DocInfoBlock and category counts.
  const { data: allTemplates = [], isLoading: allTemplatesLoading } = useModeBMasterTemplates();

  const templateNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const tmpl of allTemplates) map.set(tmpl.id, tmpl.name);
    return map;
  }, [allTemplates]);

  const templateById = useMemo(() => {
    const map = new Map<string, DocumentMasterTemplate>();
    for (const tmpl of allTemplates) map.set(tmpl.id, tmpl);
    return map;
  }, [allTemplates]);

  // PR-B4: counts of publish-safe templates per category — drives the count badges in nav.
  // Only counts templates returned by the hook (is_active=true + docx_master_path NOT NULL).
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<MasterTemplateCategory, number>> = {};
    for (const tmpl of allTemplates) {
      counts[tmpl.category] = (counts[tmpl.category] ?? 0) + 1;
    }
    return counts;
  }, [allTemplates]);

  // PR-B5: stable Set of publish-safe template_keys — passed to OwnerDiagnosticPanel.
  // Memoized so OwnerDiagnosticPanel's internal useMemo gets a stable reference.
  const publishSafeTemplateKeys = useMemo(
    () => new Set(allTemplates.map((tmpl) => tmpl.template_key)),
    [allTemplates],
  );

  // IDs of templates in the active category
  const categoryTemplateIds = useMemo(
    () => new Set(categoryTemplates.map((tmpl) => tmpl.id)),
    [categoryTemplates],
  );

  // Instances for the active category, excluding archived
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

  // Selected instance object
  const selectedInstance = useMemo(
    () => allInstances.find((i) => i.id === selectedInstanceId) ?? null,
    [allInstances, selectedInstanceId],
  );

  // Master template for the selected instance (needed by DocInfoBlock)
  const selectedTemplate = useMemo(
    () =>
      selectedInstance?.master_template_id
        ? templateById.get(selectedInstance.master_template_id)
        : undefined,
    [selectedInstance, templateById],
  );

  // Stale-selection guard: if the selected instance no longer exists (was deleted),
  // clear the URL param and return mobile to list view.
  useEffect(() => {
    if (selectedInstanceId && allInstances.length > 0 && !selectedInstance) {
      setSearchParams((prev) => { prev.delete('doc'); return prev; }, { replace: true });
      setMobileView('list');
    }
  }, [selectedInstanceId, allInstances, selectedInstance, setSearchParams]);

  function handleSelectInstance(id: string) {
    setSearchParams((prev) => { prev.set('doc', id); return prev; }, { replace: true });
    setMobileView('detail');
  }

  function clearSelection() {
    setSearchParams((prev) => { prev.delete('doc'); return prev; }, { replace: true });
    setMobileView('list');
  }

  function handleBackToList() {
    setMobileView('list');
  }

  function handleInstanceCreated(instanceId: string) {
    handleSelectInstance(instanceId);
  }

  function handleCategoryChange(cat: MasterTemplateCategory) {
    setActiveCategory(cat);
    // Clear selection when the currently selected instance is not in the new category
    if (
      selectedInstance?.master_template_id &&
      !categoryTemplateIds.has(selectedInstance.master_template_id)
    ) {
      clearSelection();
    }
  }

  // ── FF_MODE_B_DOCX_ENABLED gate (PR-DOCS-01) ─────────────────────────────────
  // All hooks above run unconditionally (Rules of Hooks).
  // When the flag is false, render a dormant placeholder — Mode B is not yet live.
  // Enabling Mode B: set VITE_FF_MODE_B_DOCX_ENABLED=true (build-time)
  //   or: localStorage.setItem('FF_MODE_B_DOCX_ENABLED', 'true') + refresh
  if (!FF_MODE_B_DOCX_ENABLED) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">
        <div className="p-4 rounded-2xl bg-muted/50 mb-5">
          <FileCheck className="w-9 h-9 text-muted-foreground/40" />
        </div>
        <h2 className="text-base font-semibold text-foreground mb-2">
          {t('readyDocs.emptyState.title')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {t('readyDocs.emptyState.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[calc(100vh-4rem)]">
      {/* ── Desktop: split layout / Mobile: single-panel ─────────────────── */}
      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:h-full">

        {/* ── Left panel — category nav + template selector + instance list ── */}
        {/*
          Desktop: always visible (lg:flex).
          Mobile: visible only when mobileView === 'list' — hidden when detail is shown.
        */}
        <div className={cn(
          'flex-col border-r border-border bg-muted/20 lg:h-full lg:overflow-y-auto',
          mobileView === 'list' ? 'flex' : 'hidden lg:flex',
        )}>

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

          {/* Category tabs — count badges reflect only publish-safe templates (PR-B4) */}
          <nav className="px-3 py-3 space-y-0.5 shrink-0" aria-label={t('readyDocs.page.title')}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
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
                  <span className="truncate flex-1 text-left">{t(cat.labelKey)}</span>
                  {/* Count badge — shown only when loading is done, 0 means no publish-safe templates */}
                  {!allTemplatesLoading && (
                    <span className={cn(
                      'text-xs font-mono rounded px-1.5 py-0.5 min-w-[1.5rem] text-center shrink-0',
                      count > 0
                        ? (isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')
                        : 'bg-muted/50 text-muted-foreground/50',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t border-border mx-3" />

          {/* Template selector — create a new document from a master template */}
          <div className="px-4 py-4 border-b border-border shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t('readyDocs.newDocument.title')}
            </p>
            <ModeBTemplateSelector
              category={activeCategory}
              onInstanceCreated={handleInstanceCreated}
            />
          </div>

          {/* Instance list — existing documents in the active category */}
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
                    onClick={() => handleSelectInstance(inst.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Owner diagnostic panel — FF_OWNER_DIAGNOSTIC=true only, never for regular users */}
          {FF_OWNER_DIAGNOSTIC && (
            <div className="px-0 pb-4 shrink-0">
              <OwnerDiagnosticPanel
                publishSafeTemplateKeys={publishSafeTemplateKeys}
                isLoading={allTemplatesLoading}
              />
            </div>
          )}
        </div>

        {/* ── Right panel — workspace ────────────────────────────────────── */}
        {/*
          Desktop: always visible (lg:block).
          Mobile: visible only when mobileView === 'detail'.
        */}
        <div className={cn(
          'lg:h-full lg:overflow-y-auto',
          mobileView === 'detail' ? 'block' : 'hidden lg:block',
        )}>
          {selectedInstance ? (
            <div className="p-4 lg:p-6 max-w-2xl">

              {/* Mobile: back button — only rendered on small screens (lg:hidden) */}
              <div className="lg:hidden mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="gap-1.5 -ml-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('readyDocs.workspace.backToList')}
                </Button>
              </div>

              {/* PR-B4: template-unavailable warning — shown when the master template
                  behind this instance is no longer publish-safe (deactivated or path removed).
                  Card remains accessible for status/download actions on existing files. */}
              {selectedInstance.master_template_id && !selectedTemplate && !allTemplatesLoading && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-3 py-2.5 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    {t('readyDocs.workspace.templateUnavailableDesc')}
                  </p>
                </div>
              )}

              {/* Document card — actions + status (ModeBDocumentCard owns all action logic) */}
              <ModeBDocumentCard
                instance={selectedInstance}
                templateName={
                  selectedInstance.master_template_id
                    ? templateNameMap.get(selectedInstance.master_template_id)
                    : undefined
                }
              />

              {/* Document info/summary block — template metadata + honest file availability */}
              <DocInfoBlock
                instance={selectedInstance}
                template={selectedTemplate}
                t={t}
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
