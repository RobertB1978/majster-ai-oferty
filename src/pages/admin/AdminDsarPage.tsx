import { useState } from 'react';
import { useAdminDsarRequests, useUpdateDsarRequest } from '@/hooks/useDsarRequests';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Clock, InboxIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { DsarRequest, DsarStatus } from '@/types/dsar';

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<DsarStatus, string> = {
  open: 'Otwarte',
  in_progress: 'W trakcie',
  waiting_for_user: 'Oczekuje na użytkownika',
  resolved: 'Rozwiązane',
  rejected: 'Odrzucone',
};

const STATUS_VARIANT: Record<DsarStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  in_progress: 'secondary',
  waiting_for_user: 'outline',
  resolved: 'secondary',
  rejected: 'destructive',
};

const TYPE_LABELS: Record<DsarRequest['request_type'], string> = {
  access: 'Dostęp do danych',
  deletion: 'Usunięcie danych',
  rectification: 'Sprostowanie danych',
  portability: 'Przeniesienie danych',
  restriction: 'Ograniczenie przetwarzania',
  objection: 'Sprzeciw',
  other: 'Inne',
};

const EDITABLE_STATUSES: DsarStatus[] = [
  'open',
  'in_progress',
  'waiting_for_user',
  'resolved',
  'rejected',
];

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function SlaIndicator({ dueAt, status }: { dueAt: string; status: DsarStatus }) {
  if (status === 'resolved' || status === 'rejected') return null;
  const days = daysUntil(dueAt);
  const overdue = days < 0;
  const urgent = days >= 0 && days <= 5;
  return (
    <span
      className={`flex items-center gap-1 text-xs ${
        overdue ? 'text-destructive font-medium' : urgent ? 'text-warning' : 'text-muted-foreground'
      }`}
    >
      {overdue && <AlertTriangle className="h-3 w-3" />}
      {!overdue && <Clock className="h-3 w-3" />}
      {overdue
        ? `Przekroczony o ${Math.abs(days)} dni`
        : days === 0
        ? 'Termin dzisiaj!'
        : `${days} dni do terminu`}
    </span>
  );
}

// ── update dialog ─────────────────────────────────────────────────────────────

interface UpdateDialogProps {
  request: DsarRequest;
  onClose: () => void;
}

function UpdateDialog({ request, onClose }: UpdateDialogProps) {
  const updateDsar = useUpdateDsarRequest();
  const [newStatus, setNewStatus] = useState<DsarStatus>(request.status);
  const [note, setNote] = useState(request.resolution_note ?? '');

  const handleSave = async () => {
    try {
      await updateDsar.mutateAsync({
        id: request.id,
        update: {
          status: newStatus,
          resolution_note: note.trim() || null,
          resolved_at:
            newStatus === 'resolved' || newStatus === 'rejected'
              ? new Date().toISOString()
              : null,
        },
        previousStatus: request.status,
      });
      toast.success('Wniosek zaktualizowany');
      onClose();
    } catch {
      toast.error('Nie udało się zaktualizować wniosku');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Zarządzaj wnioskiem RODO</DialogTitle>
          <DialogDescription>
            {TYPE_LABELS[request.request_type]} · złożony{' '}
            {new Date(request.created_at).toLocaleDateString('pl-PL')}
          </DialogDescription>
        </DialogHeader>

        {request.description && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">Opis wniosku:</p>
            <p className="text-muted-foreground">{request.description}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as DsarStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITABLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Notatka dla użytkownika{' '}
              {(newStatus === 'resolved' || newStatus === 'rejected') && (
                <span className="text-muted-foreground">(zalecana)</span>
              )}
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opisz podjęte działania lub powód odrzucenia…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateDsar.isPending}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={updateDsar.isPending}>
            {updateDsar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AdminDsarPage() {
  const [statusFilter, setStatusFilter] = useState<DsarStatus | 'all'>('all');
  const { data: requests, isLoading, error } = useAdminDsarRequests(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const [selected, setSelected] = useState<DsarRequest | null>(null);

  const openCount = requests?.filter((r) => r.status === 'open').length ?? 0;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <InboxIcon className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Wnioski RODO (DSAR)</h1>
          <p className="text-sm text-muted-foreground">
            Zarządzaj wnioskami o prawa do danych. SLA: 30 dni od złożenia.
          </p>
        </div>
        {openCount > 0 && (
          <Badge variant="default" className="ml-auto">
            {openCount} otwartych
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-medium shrink-0">Filtruj status:</label>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DsarStatus | 'all')}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            {EDITABLE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lista wniosków</CardTitle>
          <CardDescription>
            Posortowane wg terminu realizacji (najwcześniejszy na górze).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ładowanie wniosków…
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive py-6">
              <AlertTriangle className="h-4 w-4" />
              Nie udało się załadować wniosków. Sprawdź uprawnienia.
            </div>
          )}

          {!isLoading && !error && (!requests || requests.length === 0) && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Brak wniosków spełniających kryteria.
            </p>
          )}

          {!isLoading && !error && requests && requests.length > 0 && (
            <div className="space-y-2">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg border p-3 text-sm hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{TYPE_LABELS[req.request_type]}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ID: {req.requester_user_id.slice(0, 8)}… · złożono{' '}
                      {new Date(req.created_at).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <SlaIndicator dueAt={req.due_at} status={req.status} />
                    <Badge variant={STATUS_VARIANT[req.status]}>
                      {STATUS_LABELS[req.status]}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(req)}
                    >
                      Zarządzaj
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <UpdateDialog
          request={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
