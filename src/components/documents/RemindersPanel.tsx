/**
 * RemindersPanel — PR-18
 *
 * In-app reminders list for warranties and inspections.
 * Shows PENDING reminders from project_reminders table.
 * Works regardless of notification permission state.
 */

import { useTranslation } from 'react-i18next';
import { Bell, Check, Shield, Wrench, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useReminders,
  useDismissReminder,
  type ProjectReminder,
} from '@/hooks/useReminders';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve stored label (may be an i18n key pattern like "warranty.reminder.t30:2026-12-01")
 * to a human-readable translated string.
 */
function resolveReminderLabel(
  label: string | null,
  isWarranty: boolean,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (!label) {
    return isWarranty ? t('reminders.warrantyReminder') : t('reminders.inspectionReminder');
  }
  // Parse stored key patterns: "warranty.reminder.t30:2026-12-01"
  if (label.startsWith('warranty.reminder.t30:')) {
    const date = label.split(':')[1];
    return t('reminders.warrantyExpiresIn30', { date: new Date(date).toLocaleDateString('pl-PL') });
  }
  if (label.startsWith('warranty.reminder.t7:')) {
    const date = label.split(':')[1];
    return t('reminders.warrantyExpiresIn7', { date: new Date(date).toLocaleDateString('pl-PL') });
  }
  if (label.startsWith('inspection.reminder.t30:')) {
    const date = label.split(':')[1];
    return t('reminders.inspectionDueIn30', { date: new Date(date).toLocaleDateString('pl-PL') });
  }
  if (label.startsWith('inspection.reminder.t7:')) {
    const date = label.split(':')[1];
    return t('reminders.inspectionDueIn7', { date: new Date(date).toLocaleDateString('pl-PL') });
  }
  // Fallback: return raw label
  return label;
}

function isOverdue(remindAt: string): boolean {
  return new Date(remindAt) < new Date();
}

function formatRemindAt(remindAt: string): string {
  return new Date(remindAt).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ── Reminder item ─────────────────────────────────────────────────────────────

function ReminderItem({ reminder }: { reminder: ProjectReminder }) {
  const { t } = useTranslation();
  const dismiss = useDismissReminder();

  const overdue = isOverdue(reminder.remind_at);
  const isWarranty = reminder.entity_type === 'WARRANTY';

  const handleDismiss = async () => {
    try {
      await dismiss.mutateAsync(reminder.id);
    } catch {
      toast.error(t('common.errorGeneric'));
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-colors',
        overdue
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          overdue ? 'bg-destructive/15' : 'bg-amber-100 dark:bg-amber-900/30',
        )}
      >
        {isWarranty
          ? <Shield className={cn('h-3.5 w-3.5', overdue ? 'text-destructive' : 'text-amber-600 dark:text-amber-400')} />
          : <Wrench className={cn('h-3.5 w-3.5', overdue ? 'text-destructive' : 'text-amber-600 dark:text-amber-400')} />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={cn(
          'text-sm font-medium leading-snug',
          overdue ? 'text-destructive' : 'text-amber-800 dark:text-amber-200',
        )}>
          {resolveReminderLabel(reminder.label, isWarranty, t)}
        </p>
        <p className="text-xs text-muted-foreground">
          {overdue ? t('reminders.overdue') : t('reminders.due')}: {formatRemindAt(reminder.remind_at)}
        </p>
      </div>

      {/* Dismiss */}
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
        disabled={dismiss.isPending}
        title={t('reminders.dismiss')}
      >
        {dismiss.isPending
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Check className="h-3.5 w-3.5" />
        }
      </Button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function RemindersPanel() {
  const { t } = useTranslation();
  const { data: reminders, isLoading } = useReminders();

  if (isLoading) return <SkeletonList rows={2} />;

  if (!reminders || reminders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-5 text-center">
        <Bell className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{t('reminders.noReminders')}</p>
        <p className="text-xs text-muted-foreground">{t('reminders.noRemindersDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reminders.map(r => (
        <ReminderItem key={r.id} reminder={r} />
      ))}
    </div>
  );
}
