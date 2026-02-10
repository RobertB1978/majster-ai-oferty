import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Play, Pause, CheckCircle } from 'lucide-react';
import type { ProjectStatus } from '@/hooks/useProjects';

interface WorkflowActionsProps {
  status: ProjectStatus;
  onStatusChange: (newStatus: ProjectStatus) => void;
  isUpdating?: boolean;
}

type WorkflowEntry = { next: ProjectStatus; labelKey: string; icon: typeof Play; variant: 'default' | 'outline' | 'secondary' };

const WORKFLOW: Record<string, WorkflowEntry[]> = {
  'Nowy': [
    { next: 'Wycena w toku', labelKey: 'workflow.start', icon: Play, variant: 'default' },
  ],
  'Wycena w toku': [
    { next: 'Nowy', labelKey: 'workflow.pause', icon: Pause, variant: 'outline' },
    { next: 'Oferta wysłana', labelKey: 'workflow.markSent', icon: CheckCircle, variant: 'default' },
  ],
  'Oferta wysłana': [
    { next: 'Wycena w toku', labelKey: 'workflow.backToQuoting', icon: Pause, variant: 'outline' },
    { next: 'Zaakceptowany', labelKey: 'workflow.finish', icon: CheckCircle, variant: 'default' },
  ],
  'Zaakceptowany': [
    { next: 'Wycena w toku', labelKey: 'workflow.resume', icon: Play, variant: 'outline' },
  ],
};

export function WorkflowActions({ status, onStatusChange, isUpdating }: WorkflowActionsProps) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState<{ next: ProjectStatus; labelKey: string } | null>(null);
  const actions = WORKFLOW[status] ?? [];

  if (actions.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {actions.map((action) => (
          <Button
            key={action.next}
            variant={action.variant}
            size="sm"
            className="min-h-[44px]"
            disabled={isUpdating}
            onClick={() => setConfirm({ next: action.next, labelKey: action.labelKey })}
          >
            <action.icon className="mr-2 h-4 w-4" />
            {t(action.labelKey)}
          </Button>
        ))}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workflow.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('workflow.confirmDescription', { from: status, to: confirm?.next })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) onStatusChange(confirm.next);
                setConfirm(null);
              }}
            >
              {confirm ? t(confirm.labelKey) : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
