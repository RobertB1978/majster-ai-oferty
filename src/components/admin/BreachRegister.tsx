import { useState } from 'react';
import { useAdminBreaches, useCreateBreach, useUpdateBreach } from '@/hooks/useBreaches';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Clock, ShieldAlert, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  deadlineHoursRemaining,
  calcReportDeadline,
  type DataBreach,
  type BreachSeverity,
  type BreachStatus,
} from '@/types/breach';

// ── label maps ────────────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<BreachSeverity, string> = {
  low: 'Niskie',
  medium: 'Średnie',
  high: 'Wysokie',
  critical: 'Krytyczne',
};

const SEVERITY_VARIANT: Record<BreachSeverity, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'secondary',
  medium: 'outline',
  high: 'default',
  critical: 'destructive',
};

const STATUS_LABELS: Record<BreachStatus, string> = {
  open: 'Otwarte',
  assessment: 'Ocena',
  contained: 'Opanowane',
  reported: 'Zgłoszone',
  closed: 'Zamknięte',
  false_positive: 'Fałszywy alarm',
};

const STATUS_VARIANT: Record<BreachStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'destructive',
  assessment: 'outline',
  contained: 'secondary',
  reported: 'default',
  closed: 'secondary',
  false_positive: 'secondary',
};

const EDITABLE_STATUSES: BreachStatus[] = [
  'open',
  'assessment',
  'contained',
  'reported',
  'closed',
  'false_positive',
];

// ── deadline indicator ────────────────────────────────────────────────────────

function DeadlineIndicator({ breach }: { breach: DataBreach }) {
  if (breach.status === 'closed' || breach.status === 'false_positive') return null;
  if (breach.reported_to_authority) {
    return <span className="text-xs text-muted-foreground">Zgłoszono do organu</span>;
  }

  const hours = deadlineHoursRemaining(breach.report_deadline_at);
  const overdue = hours < 0;
  const urgent = !overdue && hours <= 12;

  const label = overdue
    ? `Termin przekroczony o ${Math.round(Math.abs(hours))} h`
    : `${Math.round(hours)} h do terminu`;

  return (
    <span
      className={`flex items-center gap-1 text-xs ${
        overdue
          ? 'text-destructive font-semibold'
          : urgent
          ? 'text-orange-500 font-medium'
          : 'text-muted-foreground'
      }`}
    >
      {overdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}

// ── create dialog ─────────────────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean;
  onClose: () => void;
}

function CreateBreachDialog({ open, onClose }: CreateDialogProps) {
  const createBreach = useCreateBreach();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<BreachSeverity>('medium');
  const [detectedAt, setDetectedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [impactSummary, setImpactSummary] = useState('');

  function handleClose() {
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setDetectedAt(new Date().toISOString().slice(0, 16));
    setImpactSummary('');
    onClose();
  }

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      toast.error('Wypełnij tytuł i opis incydentu.');
      return;
    }
    try {
      const detectedIso = new Date(detectedAt).toISOString();
      await createBreach.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        severity,
        detected_at: detectedIso,
        impact_summary: impactSummary.trim() || null,
      });
      toast.success('Incydent został zarejestrowany.');
      handleClose();
    } catch {
      toast.error('Błąd podczas rejestrowania incydentu.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nowy incydent naruszenia danych</DialogTitle>
          <DialogDescription>
            Uzupełnij fakty znane na tym etapie. Deadline 72h zostanie ustawiony automatycznie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="breach-title">Tytuł *</Label>
            <Input
              id="breach-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Krótki opis zdarzenia"
            />
          </div>

          <div>
            <Label htmlFor="breach-desc">Opis incydentu *</Label>
            <Textarea
              id="breach-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Co się stało? Jakie dane mogły zostać naruszone?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="breach-severity">Poziom zagrożenia</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as BreachSeverity)}>
                <SelectTrigger id="breach-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEVERITY_LABELS) as BreachSeverity[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEVERITY_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="breach-detected">Wykryto</Label>
              <Input
                id="breach-detected"
                type="datetime-local"
                value={detectedAt}
                onChange={(e) => setDetectedAt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="breach-impact">Wstępna ocena wpływu (opcjonalnie)</Label>
            <Textarea
              id="breach-impact"
              value={impactSummary}
              onChange={(e) => setImpactSummary(e.target.value)}
              placeholder="Jakie kategorie danych, ilu użytkowników?"
              rows={2}
            />
          </div>

          {detectedAt && (
            <p className="text-xs text-muted-foreground">
              Termin 72h: {new Date(calcReportDeadline(new Date(detectedAt).toISOString())).toLocaleString('pl-PL')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={createBreach.isPending}>
            {createBreach.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zarejestruj incydent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── detail/edit dialog ────────────────────────────────────────────────────────

interface DetailDialogProps {
  breach: DataBreach | null;
  onClose: () => void;
}

function BreachDetailDialog({ breach, onClose }: DetailDialogProps) {
  const updateBreach = useUpdateBreach();
  const [status, setStatus] = useState<BreachStatus>(breach?.status ?? 'open');
  const [reportedToAuthority, setReportedToAuthority] = useState<boolean>(
    breach?.reported_to_authority ?? false,
  );
  const [authorityName, setAuthorityName] = useState(breach?.authority_name ?? '');
  const [containment, setContainment] = useState(breach?.containment_actions ?? '');

  if (!breach) return null;

  async function handleSave() {
    if (!breach) return;
    try {
      await updateBreach.mutateAsync({
        id: breach.id,
        update: {
          status,
          reported_to_authority: reportedToAuthority || null,
          reported_at: reportedToAuthority ? new Date().toISOString() : null,
          authority_name: authorityName.trim() || null,
          containment_actions: containment.trim() || null,
        },
      });
      toast.success('Incydent zaktualizowany.');
      onClose();
    } catch {
      toast.error('Błąd podczas aktualizacji.');
    }
  }

  return (
    <Dialog open={!!breach} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{breach.title}</DialogTitle>
          <DialogDescription>
            Wykryto: {new Date(breach.detected_at).toLocaleString('pl-PL')} ·{' '}
            <DeadlineIndicator breach={breach} />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">{breach.description}</p>

          {breach.impact_summary && (
            <div>
              <span className="font-medium">Ocena wpływu: </span>
              {breach.impact_summary}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="detail-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BreachStatus)}>
                <SelectTrigger id="detail-status">
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

            <div className="flex flex-col gap-1">
              <Label>Zgłoszono do UODO?</Label>
              <Select
                value={reportedToAuthority ? 'yes' : 'no'}
                onValueChange={(v) => setReportedToAuthority(v === 'yes')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Nie / w ocenie</SelectItem>
                  <SelectItem value="yes">Tak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {reportedToAuthority && (
            <div>
              <Label htmlFor="detail-authority">Nazwa organu</Label>
              <Input
                id="detail-authority"
                value={authorityName}
                onChange={(e) => setAuthorityName(e.target.value)}
                placeholder="np. UODO"
              />
            </div>
          )}

          <div>
            <Label htmlFor="detail-containment">Działania naprawcze / ograniczające</Label>
            <Textarea
              id="detail-containment"
              value={containment}
              onChange={(e) => setContainment(e.target.value)}
              placeholder="Opis podjętych kroków"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Zamknij
          </Button>
          <Button onClick={handleSave} disabled={updateBreach.isPending}>
            {updateBreach.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── main list ─────────────────────────────────────────────────────────────────

export default function BreachRegister() {
  const { data: breaches, isLoading, isError } = useAdminBreaches();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<DataBreach | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Rejestr naruszeń danych (RODO art. 33/34)</h2>
          <p className="text-sm text-muted-foreground">
            Tylko administratorzy widzą te dane. Nie stanowi to porady prawnej.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nowy incydent
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <Card className="border-destructive">
          <CardContent className="py-6 text-center text-destructive">
            Błąd podczas ładowania rejestru naruszeń.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (!breaches || breaches.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <ShieldAlert className="h-8 w-8 opacity-40" />
            <p>Brak zarejestrowanych naruszeń.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && breaches && breaches.length > 0 && (
        <div className="space-y-2">
          {breaches.map((breach) => (
            <Card
              key={breach.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelected(breach)}
            >
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium">{breach.title}</CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={SEVERITY_VARIANT[breach.severity]}>
                      {SEVERITY_LABELS[breach.severity]}
                    </Badge>
                    <Badge variant={STATUS_VARIANT[breach.status]}>
                      {STATUS_LABELS[breach.status]}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Wykryto: {new Date(breach.detected_at).toLocaleString('pl-PL')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <DeadlineIndicator breach={breach} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateBreachDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <BreachDetailDialog breach={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
