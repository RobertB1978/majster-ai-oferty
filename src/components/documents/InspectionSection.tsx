/**
 * InspectionSection — PR-18
 *
 * Accordion panel for ProjectHub — "Przeglądy" section.
 * - List inspections by status: PLANNED / OVERDUE / DONE
 * - Create new inspection: pick type + due date + notes
 * - Mark as DONE → status updates
 * - Save protocol PDF to dossier
 * - Show upcoming reminders (via RemindersPanel)
 * - Notification permission handling via NotificationPermissionPrompt
 *
 * Sources inspection types from /docs/COMPLIANCE/INSPECTIONS_PL.md (via ADR-0010)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Wrench, Plus, CheckCircle2, Clock, AlertTriangle,
  FolderOpen, Loader2, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';

import {
  useProjectInspections,
  useCreateInspection,
  useMarkInspectionDone,
  useDeleteInspection,
  useMarkInspectionPdfPath,
  calcNextDueDate,
  ALL_INSPECTION_TYPES,
  INSPECTION_TYPE_LABELS,
  type InspectionFormData,
  type InspectionType,
  type ProjectInspection,
} from '@/hooks/useInspection';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonList } from '@/components/ui/skeleton';
import { RemindersPanel } from './RemindersPanel';
import { NotificationPermissionPrompt } from '@/components/notifications/NotificationPermissionPrompt';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InspectionSectionProps {
  projectId: string;
  projectTitle: string;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProjectInspection['status'] }) {
  const { t } = useTranslation();
  const map = {
    PLANNED: {
      label: t('inspection.status.planned'),
      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      Icon: Clock,
    },
    DONE: {
      label: t('inspection.status.done'),
      cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Icon: CheckCircle2,
    },
    OVERDUE: {
      label: t('inspection.status.overdue'),
      cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      Icon: AlertTriangle,
    },
  } as const;

  const { label, cls, Icon } = map[status] ?? map.PLANNED;

  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ── Inspection form ───────────────────────────────────────────────────────────

function InspectionForm({
  projectId,
  onDone,
}: {
  projectId: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateInspection(projectId);

  const [form, setForm] = useState<InspectionFormData>({
    inspection_type: 'ANNUAL_BUILDING',
    object_address: '',
    due_date: calcNextDueDate('ANNUAL_BUILDING'),
    notes: '',
  });

  const set = <K extends keyof InspectionFormData>(key: K, value: InspectionFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleTypeChange = (type: InspectionType) => {
    set('inspection_type', type);
    set('due_date', calcNextDueDate(type));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.due_date) {
      toast.error(t('inspection.errors.dueDateRequired'));
      return;
    }
    try {
      await create.mutateAsync(form);
      toast.success(t('inspection.created'));
      onDone();
    } catch {
      toast.error(t('common.errorGeneric'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-2">
      {/* Type */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {t('inspection.fields.type')}
        </label>
        <select
          value={form.inspection_type}
          onChange={e => handleTypeChange(e.target.value as InspectionType)}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {ALL_INSPECTION_TYPES.map(type => (
            <option key={type} value={type}>
              {t(INSPECTION_TYPE_LABELS[type])}
            </option>
          ))}
        </select>
      </div>

      {/* Address */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {t('inspection.fields.address')}
        </label>
        <Input
          value={form.object_address}
          onChange={e => set('object_address', e.target.value)}
          placeholder={t('inspection.placeholders.address')}
          className="h-8 text-sm"
        />
      </div>

      {/* Due date */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {t('inspection.fields.dueDate')} <span className="text-destructive">*</span>
        </label>
        <Input
          type="date"
          value={form.due_date}
          onChange={e => set('due_date', e.target.value)}
          required
          className="h-8 text-sm"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          {t('inspection.fields.notes')}
        </label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder={t('inspection.placeholders.notes')}
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="flex-1" disabled={create.isPending}>
          {create.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          {t('inspection.saveInspection')}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          {t('inspection.cancel')}
        </Button>
      </div>
    </form>
  );
}

// ── Inspection card ───────────────────────────────────────────────────────────

function InspectionCard({
  inspection,
  projectId,
  projectTitle,
}: {
  inspection: ProjectInspection;
  projectId: string;
  projectTitle: string;
}) {
  const { t, i18n } = useTranslation();
  const markDone = useMarkInspectionDone(projectId);
  const deleteInsp = useDeleteInspection(projectId);
  const markPdf = useMarkInspectionPdfPath(projectId);
  const [busy, setBusy] = useState<'done' | 'dossier' | 'delete' | null>(null);

  const handleMarkDone = async () => {
    setBusy('done');
    try {
      await markDone.mutateAsync(inspection.id);
      toast.success(t('inspection.markedDone'));
    } catch {
      toast.error(t('common.errorGeneric'));
    } finally {
      setBusy(null);
    }
  };

  const handleSaveToDossier = async () => {
    setBusy('dossier');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a simple protocol PDF placeholder using existing approach
      const fileName = `protokol_${inspection.inspection_type}_${inspection.due_date}.pdf`;
      const path = `${user.id}/${projectId}/inspection/${fileName}`;

      // Placeholder text blob — full PDF generation via PR-17 templatePdfGenerator is out of scope
      const blobLines = [
        `${t('inspection.protocol.title')}\n\n`,
        `${t('inspection.protocol.type')}: ${t(INSPECTION_TYPE_LABELS[inspection.inspection_type])}\n`,
        `${t('inspection.protocol.dueDate')}: ${inspection.due_date}\n`,
        `${t('inspection.protocol.project')}: ${projectTitle}\n`,
        inspection.object_address ? `${t('inspection.protocol.address')}: ${inspection.object_address}\n` : '',
        `${t('inspection.protocol.status')}: ${t(`inspection.status.${inspection.status.toLowerCase()}`)}\n`,
        inspection.notes ? `${t('inspection.protocol.notes')}: ${inspection.notes}\n` : '',
        `\n${t('inspection.protocol.generated')}: Majster.AI | ${formatDate(new Date(), i18n.language)}\n`,
      ].join('');

      const blob = new Blob([blobLines], { type: 'application/pdf' });

      const { error: uploadErr } = await supabase.storage
        .from('dossier')
        .upload(path, blob, { contentType: 'application/pdf', upsert: true });

      if (uploadErr) throw uploadErr;

      const { error: dbErr } = await supabase
        .from('project_dossier_items')
        .insert({
          user_id: user.id,
          project_id: projectId,
          category: 'PROTOCOL',
          file_path: path,
          file_name: fileName,
          mime_type: 'application/pdf',
          size_bytes: blob.size,
          source: 'MANUAL',
        });

      if (dbErr) throw dbErr;

      await markPdf.mutateAsync({ inspectionId: inspection.id, pdfPath: path });
      toast.success(t('inspection.savedToDossier'));
    } catch {
      toast.error(t('common.errorGeneric'));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('inspection.deleteConfirm'))) return;
    setBusy('delete');
    try {
      await deleteInsp.mutateAsync(inspection.id);
    } catch {
      toast.error(t('common.errorGeneric'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {t(INSPECTION_TYPE_LABELS[inspection.inspection_type])}
        </span>
        <StatusBadge status={inspection.status} />
      </div>

      {/* Meta */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        <div>
          {t('inspection.fields.dueDate')}: <b className="text-foreground">
            {formatDate(inspection.due_date, i18n.language)}
          </b>
        </div>
        {inspection.object_address && (
          <div>{inspection.object_address}</div>
        )}
        {inspection.notes && (
          <div className="line-clamp-2">{inspection.notes}</div>
        )}
        {inspection.completed_at && (
          <div>
            {t('inspection.completedAt')}: {formatDate(inspection.completed_at, i18n.language)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {inspection.status !== 'DONE' && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={handleMarkDone}
            disabled={busy === 'done'}
          >
            {busy === 'done'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <CheckCircle2 className="h-3.5 w-3.5" />
            }
            {t('inspection.markDone')}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={handleSaveToDossier}
          disabled={busy === 'dossier'}
        >
          {busy === 'dossier'
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <FolderOpen className="h-3.5 w-3.5" />
          }
          {inspection.protocol_pdf_path ? t('inspection.updateProtocol') : t('inspection.saveProtocol')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs text-destructive hover:text-destructive ml-auto"
          onClick={handleDelete}
          disabled={busy === 'delete'}
        >
          {busy === 'delete'
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5" />
          }
        </Button>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function InspectionSection({ projectId, projectTitle }: InspectionSectionProps) {
  const { t } = useTranslation();
  const { data: inspections, isLoading } = useProjectInspections(projectId);
  const [adding, setAdding] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

  if (isLoading) return <SkeletonList rows={2} />;

  const planned = inspections?.filter(i => i.status === 'PLANNED') ?? [];
  const overdue = inspections?.filter(i => i.status === 'OVERDUE') ?? [];
  const done = inspections?.filter(i => i.status === 'DONE') ?? [];

  return (
    <div className="space-y-4">
      {/* Notification permission */}
      <NotificationPermissionPrompt onlyShowBlocked />

      {/* Add form or trigger */}
      {adding ? (
        <InspectionForm projectId={projectId} onDone={() => setAdding(false)} />
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="gap-2 w-full justify-start"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-4 w-4" />
          {t('inspection.addInspection')}
        </Button>
      )}

      {/* Overdue — always on top */}
      {overdue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-semibold text-destructive uppercase tracking-wide">
              {t('inspection.sections.overdue')} ({overdue.length})
            </span>
          </div>
          {overdue.map(i => (
            <InspectionCard
              key={i.id}
              inspection={i}
              projectId={projectId}
              projectTitle={projectTitle}
            />
          ))}
        </div>
      )}

      {/* Planned */}
      {planned.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('inspection.sections.planned')} ({planned.length})
            </span>
          </div>
          {planned.map(i => (
            <InspectionCard
              key={i.id}
              inspection={i}
              projectId={projectId}
              projectTitle={projectTitle}
            />
          ))}
        </div>
      )}

      {/* Done — collapsible */}
      {done.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            className="flex items-center gap-2 w-full text-left"
            onClick={() => setShowReminders(prev => !prev)}
          >
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1">
              {t('inspection.sections.done')} ({done.length})
            </span>
            {showReminders
              ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </button>
          {showReminders && done.map(i => (
            <InspectionCard
              key={i.id}
              inspection={i}
              projectId={projectId}
              projectTitle={projectTitle}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!adding && !overdue.length && !planned.length && !done.length && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Wrench className="h-9 w-9 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">{t('inspection.noInspections')}</p>
          <p className="text-xs text-muted-foreground">{t('inspection.noInspectionsDesc')}</p>
        </div>
      )}

      {/* Reminders section */}
      {inspections && inspections.length > 0 && (
        <div className="space-y-2 pt-1 border-t">
          <div className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('reminders.sectionTitle')}
            </span>
          </div>
          <RemindersPanel />
        </div>
      )}
    </div>
  );
}
