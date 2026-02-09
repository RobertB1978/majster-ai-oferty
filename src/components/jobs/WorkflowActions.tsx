import { useState } from 'react';
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

const WORKFLOW: Record<string, { next: ProjectStatus; label: string; icon: typeof Play; variant: 'default' | 'outline' | 'secondary' }[]> = {
  'Nowy': [
    { next: 'Wycena w toku', label: 'Rozpocznij', icon: Play, variant: 'default' },
  ],
  'Wycena w toku': [
    { next: 'Nowy', label: 'Wstrzymaj', icon: Pause, variant: 'outline' },
    { next: 'Oferta wysłana', label: 'Oznacz jako wysłana', icon: CheckCircle, variant: 'default' },
  ],
  'Oferta wysłana': [
    { next: 'Wycena w toku', label: 'Cofnij do wyceny', icon: Pause, variant: 'outline' },
    { next: 'Zaakceptowany', label: 'Zakończ', icon: CheckCircle, variant: 'default' },
  ],
  'Zaakceptowany': [
    { next: 'Wycena w toku', label: 'Wznów', icon: Play, variant: 'outline' },
  ],
};

export function WorkflowActions({ status, onStatusChange, isUpdating }: WorkflowActionsProps) {
  const [confirm, setConfirm] = useState<{ next: ProjectStatus; label: string } | null>(null);
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
            onClick={() => setConfirm({ next: action.next, label: action.label })}
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdź zmianę statusu</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz zmienić status z "{status}" na "{confirm?.next}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) onStatusChange(confirm.next);
                setConfirm(null);
              }}
            >
              {confirm?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
