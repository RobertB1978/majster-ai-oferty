/**
 * ModeBStatusBadge — PR-04 (Mode B UI Flow)
 *
 * Badge statusu cyklu życia dokumentu Trybu B.
 * Statusy: draft | ready | sent | final | archived
 *
 * Null (Tryb A lub brak statusu) → nie renderuje nic.
 */

import { useTranslation } from 'react-i18next';
import type { DocumentInstanceStatus } from '@/types/document-mode-b';
import { cn } from '@/lib/utils';

interface ModeBStatusBadgeProps {
  status: DocumentInstanceStatus | null | undefined;
  className?: string;
}

const STATUS_CLASSES: Record<DocumentInstanceStatus, string> = {
  draft:
    'bg-muted text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border',
  ready:
    'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:text-info dark:border-info/40',
  sent:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', // purple = no DS token, needs revision
  final:
    'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:text-success dark:border-success/40',
  archived:
    'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:text-warning dark:border-warning/40',
};

export function ModeBStatusBadge({ status, className }: ModeBStatusBadgeProps) {
  const { t } = useTranslation();

  if (!status) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        STATUS_CLASSES[status],
        className,
      )}
    >
      {t(`modeB.status.${status}`)}
    </span>
  );
}
