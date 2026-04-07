/**
 * ModeBStatusBadge — PR-04 (Mode B UI Flow)
 *
 * Badge statusu cyklu życia dokumentu Trybu B.
 * Statusy: draft | ready | sent | final | archived
 *
 * Null (Tryb A lub brak statusu) → nie renderuje nic.
 */

import type { DocumentInstanceStatus } from '@/types/document-mode-b';
import { cn } from '@/lib/utils';

interface ModeBStatusBadgeProps {
  status: DocumentInstanceStatus | null | undefined;
  className?: string;
}

const STATUS_CONFIG: Record<
  DocumentInstanceStatus,
  { label: string; classes: string }
> = {
  draft: {
    label: 'Szkic',
    classes:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
  ready: {
    label: 'Gotowy',
    classes:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  },
  sent: {
    label: 'Wysłany',
    classes:
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  },
  final: {
    label: 'Finalny',
    classes:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  archived: {
    label: 'Archiwum',
    classes:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
};

export function ModeBStatusBadge({ status, className }: ModeBStatusBadgeProps) {
  if (!status) return null;

  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
