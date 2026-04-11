/**
 * ModeBDocumentCard — PR-04 (Mode B UI Flow)
 *
 * Karta instancji dokumentu Trybu B.
 * Wyświetla status, metadane i akcje dostępne dla danego stanu dokumentu.
 *
 * ZASADA: żaden przycisk nie jest aktywny bez gotowego flow end-to-end.
 *
 * Disabled state — kiedy i dlaczego:
 *   - "Pobierz DOCX"     → disabled gdy file_docx === null (Edge Function PR-02 nie gotowa)
 *   - "Pobierz PDF"      → disabled gdy pdf_path === null (renderowanie PR-05)
 *   - "Wyślij"           → disabled gdy status !== 'ready' i status !== 'final'
 *   - "Oznacz jako gotowy" → disabled gdy file_docx === null
 *   - "Oznacz jako final"  → disabled gdy status !== 'ready' i status !== 'sent'
 *   - "Usuń"             → disabled gdy status === 'final'
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Send, CheckCircle2, Lock, Trash2, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ModeBStatusBadge } from './ModeBStatusBadge';
import {
  useModeBSignedDocxDownload,
  useMarkModeBReady,
  useMarkModeBFinal,
  useMarkModeBSent,
  useDeleteModeBWorkingCopy,
} from '@/hooks/useModeBDocumentInstances';
import type { DocumentInstance } from '@/hooks/useDocumentInstances';
import { cn } from '@/lib/utils';

interface ModeBDocumentCardProps {
  instance: DocumentInstance;
  templateName?: string;
}

const LOCALE_MAP: Record<string, string> = {
  pl: 'pl-PL',
  en: 'en-GB',
  uk: 'uk-UA',
};

function formatDate(iso: string | null | undefined, language: string): string {
  if (!iso) return '—';
  const locale = LOCALE_MAP[language.split('-')[0]] ?? 'pl-PL';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ModeBDocumentCard({ instance, templateName }: ModeBDocumentCardProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const downloadDocx = useModeBSignedDocxDownload();
  const markReady = useMarkModeBReady();
  const markFinal = useMarkModeBFinal();
  const markSent = useMarkModeBSent();
  const deleteInstance = useDeleteModeBWorkingCopy();

  const isFinal = instance.status === 'final';
  const isArchived = instance.status === 'archived';
  const hasDocx = !!instance.file_docx;
  const hasPdf = !!instance.pdf_path;
  const canSend = instance.status === 'ready' || instance.status === 'final';
  const canMarkReady = hasDocx && instance.status === 'draft';
  const canMarkFinal = instance.status === 'ready' || instance.status === 'sent';

  const docxFileName = `${templateName ?? instance.template_key}_v${instance.version_number}.docx`;

  async function handleDownloadDocx() {
    if (!instance.file_docx) return;
    try {
      const url = await downloadDocx.mutateAsync({
        fileDocxPath: instance.file_docx,
        fileName: docxFileName,
      });
      window.open(url, '_blank');
    } catch {
      toast({ variant: 'destructive', title: t('modeB.card.toasts.downloadError') });
    }
  }

  async function handleMarkReady() {
    try {
      await markReady.mutateAsync(instance.id);
      toast({ title: t('modeB.card.toasts.markedReady') });
    } catch {
      toast({ variant: 'destructive', title: t('modeB.card.toasts.statusError') });
    }
  }

  async function handleMarkFinal() {
    try {
      await markFinal.mutateAsync(instance.id);
      toast({ title: t('modeB.card.toasts.markedFinal') });
    } catch {
      toast({ variant: 'destructive', title: t('modeB.card.toasts.markFinalError') });
    }
  }

  async function handleMarkSent() {
    try {
      await markSent.mutateAsync(instance.id);
      toast({ title: t('modeB.card.toasts.markedSent') });
    } catch {
      toast({ variant: 'destructive', title: t('modeB.card.toasts.markSentError') });
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    try {
      await deleteInstance.mutateAsync({
        instanceId: instance.id,
        fileDocxPath: instance.file_docx,
        status: instance.status,
      });
      toast({ title: t('modeB.card.toasts.deleted') });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('modeB.card.toasts.deleteError');
      toast({ variant: 'destructive', title: msg });
    } finally {
      setDeleteConfirm(false);
    }
  }

  return (
    <div className={cn(
      'border rounded-lg p-4 space-y-3 bg-card',
      isFinal && 'border-success/40 dark:border-success/50',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium truncate">
            {instance.title ?? templateName ?? instance.template_key}
          </p>
        </div>
        <ModeBStatusBadge status={instance.status} />
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {t('modeB.card.createdAt', { date: formatDate(instance.created_at, i18n.language) })}
        </span>
        {instance.edited_at && (
          <span>{t('modeB.card.editedAt', { date: formatDate(instance.edited_at, i18n.language) })}</span>
        )}
        {instance.sent_at && (
          <span>{t('modeB.card.sentAt', { date: formatDate(instance.sent_at, i18n.language) })}</span>
        )}
        <span>{t('modeB.card.version', { version: instance.version_number })}</span>
      </div>

      {/* No DOCX yet — informacja gdy Edge Function nie gotowa */}
      {!hasDocx && !isArchived && (
        <p className="text-xs text-warning dark:text-warning bg-warning/5 dark:bg-warning/10 rounded px-2 py-1.5">
          {t('modeB.card.docxPendingWarning')}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {/* Pobierz DOCX */}
        <Button
          size="sm"
          variant="outline"
          disabled={!hasDocx || downloadDocx.isPending}
          onClick={handleDownloadDocx}
          title={!hasDocx ? t('modeB.card.tooltips.docxUnavailable') : t('modeB.card.tooltips.downloadDocx')}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          {t('modeB.card.actions.downloadDocx')}
        </Button>

        {/* Pobierz PDF — disabled do PR-05 (renderowanie PDF) */}
        <Button
          size="sm"
          variant="outline"
          disabled={!hasPdf}
          title={!hasPdf ? t('modeB.card.tooltips.pdfUnavailable') : t('modeB.card.tooltips.downloadPdf')}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          {t('modeB.card.actions.downloadPdf')}
        </Button>

        {/* Oznacz jako gotowy */}
        {instance.status === 'draft' && (
          <Button
            size="sm"
            variant="outline"
            disabled={!canMarkReady || markReady.isPending}
            onClick={handleMarkReady}
            title={!canMarkReady ? t('modeB.card.tooltips.needsDocx') : t('modeB.card.tooltips.markReady')}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            {t('modeB.card.actions.markReady')}
          </Button>
        )}

        {/* Wyślij */}
        {(instance.status === 'ready' || instance.status === 'sent') && (
          <Button
            size="sm"
            variant="outline"
            disabled={!canSend || markSent.isPending}
            onClick={handleMarkSent}
            title={!canSend ? t('modeB.card.tooltips.mustBeReady') : t('modeB.card.tooltips.markSent')}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {instance.status === 'sent' ? t('modeB.card.actions.resend') : t('modeB.card.actions.send')}
          </Button>
        )}

        {/* Oznacz jako final */}
        {canMarkFinal && (
          <Button
            size="sm"
            variant="outline"
            disabled={markFinal.isPending}
            onClick={handleMarkFinal}
            title={t('modeB.card.tooltips.markFinal')}
          >
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            {t('modeB.card.actions.markFinal')}
          </Button>
        )}

        {/* Usuń — blokowane dla final */}
        {!isFinal && !isArchived && (
          <Button
            size="sm"
            variant={deleteConfirm ? 'destructive' : 'ghost'}
            disabled={deleteInstance.isPending}
            onClick={handleDelete}
            onBlur={() => setDeleteConfirm(false)}
            title={isFinal ? t('modeB.card.tooltips.cannotDeleteFinal') : t('modeB.card.tooltips.deleteDraft')}
            className="ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {deleteConfirm ? t('modeB.card.actions.deleteConfirm') : t('modeB.card.actions.delete')}
          </Button>
        )}
      </div>
    </div>
  );
}
