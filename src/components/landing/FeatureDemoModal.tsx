import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  Calculator,
  FileText,
  Users,
  FolderKanban,
  Clock,
  TrendingUp,
  Bot,
  BarChart3,
  Smartphone,
  Camera,
  CreditCard,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* ─────────────────────────────────── types ─────────────────────────────── */

export interface DemoFeature {
  key: string;
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
}

interface FeatureDemoModalProps {
  feature: DemoFeature | null;
  onClose: () => void;
}

/* ─────────────────────────── per-feature sample UIs ────────────────────── */

function QuotesSample() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
      <div className="font-semibold text-muted-foreground text-xs uppercase tracking-wide mb-3">
        Podgląd wyceny — Remont łazienki
      </div>
      {[
        { name: 'Kafelkowanie ściany 25m²', qty: '25 m²', unit: '65 zł', total: '1 625 zł' },
        { name: 'Montaż kabiny prysznicowej', qty: '1 szt', unit: '320 zł', total: '320 zł' },
        { name: 'Instalacja elektryczna', qty: '8 h', unit: '90 zł', total: '720 zł' },
        { name: 'Materiały (szpachla, klej)', qty: '—', unit: '—', total: '480 zł' },
      ].map((r) => (
        <div key={r.name} className="flex justify-between gap-2 border-b border-border pb-1">
          <span className="flex-1 text-foreground">{r.name}</span>
          <span className="text-muted-foreground w-14 text-right">{r.qty}</span>
          <span className="text-muted-foreground w-16 text-right">{r.unit}</span>
          <span className="font-medium w-20 text-right">{r.total}</span>
        </div>
      ))}
      <div className="flex justify-between font-bold text-base pt-1">
        <span>RAZEM</span>
        <span className="text-primary">3 145 zł</span>
      </div>
    </div>
  );
}

function PdfSample() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
      <div className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
        Wygenerowany PDF — Oferta #2024/031
      </div>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold text-base">Firma Remontowa Kowalski</div>
          <div className="text-muted-foreground text-xs">NIP: 123-456-78-90 · Warszawa</div>
        </div>
        <Badge variant="outline" className="text-green-700 border-green-400">PDF gotowy</Badge>
      </div>
      <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
        <div className="flex justify-between"><span>Klient:</span><span className="font-medium">Jan Nowak</span></div>
        <div className="flex justify-between"><span>Termin:</span><span>15.03.2025</span></div>
        <div className="flex justify-between"><span>Ważność:</span><span>30 dni</span></div>
        <div className="flex justify-between font-bold mt-2"><span>Suma:</span><span className="text-primary">3 145 zł</span></div>
      </div>
    </div>
  );
}

function ClientsSample() {
  const clients = [
    { name: 'Jan Nowak', tag: 'VIP', project: 'Remont łazienki', value: '3 145 zł' },
    { name: 'Anna Wiśniewska', tag: 'Aktywny', project: 'Malowanie klatki', value: '1 200 zł' },
    { name: 'Firma ABC sp. z o.o.', tag: 'Nowy', project: 'Biuro — elektryka', value: '8 600 zł' },
  ];
  return (
    <div className="rounded-xl border bg-card divide-y divide-border text-sm overflow-hidden">
      {clients.map((c) => (
        <div key={c.name} className="flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
            {c.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{c.name}</div>
            <div className="text-xs text-muted-foreground truncate">{c.project}</div>
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">{c.tag}</Badge>
          <span className="shrink-0 font-semibold text-xs text-primary">{c.value}</span>
        </div>
      ))}
    </div>
  );
}

function ProjectsSample() {
  const projects = [
    { name: 'Remont łazienki — Nowak', status: 'W toku', pct: 65, color: 'bg-blue-500' },
    { name: 'Malowanie klatki', status: 'Zakończony', pct: 100, color: 'bg-green-500' },
    { name: 'Biuro ABC — elektryka', status: 'Planowany', pct: 20, color: 'bg-amber-500' },
  ];
  return (
    <div className="rounded-xl border bg-card divide-y divide-border text-sm overflow-hidden">
      {projects.map((p) => (
        <div key={p.name} className="p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{p.name}</span>
            <Badge variant="outline" className="text-xs">{p.status}</Badge>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
          </div>
          <div className="text-xs text-muted-foreground text-right">{p.pct}% ukończono</div>
        </div>
      ))}
    </div>
  );
}

function CalendarSample() {
  const events = [
    { time: 'Pon 09:00', title: 'Remont łazienki — Nowak', color: 'border-l-blue-500' },
    { time: 'Pon 14:00', title: 'Wycena — biuro ABC', color: 'border-l-amber-500' },
    { time: 'Wt 08:00', title: 'Dostawa materiałów', color: 'border-l-green-500' },
    { time: 'Śr 10:30', title: 'Odbiór prac — Nowak', color: 'border-l-primary' },
  ];
  return (
    <div className="rounded-xl border bg-card divide-y divide-border text-sm overflow-hidden">
      {events.map((e) => (
        <div key={e.title} className={`flex gap-3 p-3 border-l-4 ${e.color}`}>
          <span className="w-20 shrink-0 text-xs text-muted-foreground pt-0.5">{e.time}</span>
          <span className="font-medium">{e.title}</span>
        </div>
      ))}
    </div>
  );
}

function FinanceSample() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Przychody', value: '18 400 zł', color: 'text-green-600' },
          { label: 'Koszty', value: '7 200 zł', color: 'text-red-500' },
          { label: 'Zysk', value: '11 200 zł', color: 'text-primary' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/50 p-2">
            <div className={`font-bold text-base ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground text-center">Luty 2025 · 6 faktur wystawionych</div>
    </div>
  );
}

function AiSample() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
        <div className="text-xs font-medium text-primary mb-1">AI Asystent pisze wycenę:</div>
        <p className="text-sm text-foreground leading-relaxed">
          "Remont łazienki 8m² — płytki ścienne 25m², montaż kabiny, instalacja elektryczna. Szacowany czas: 5 dni roboczych. Koszt: <span className="font-bold text-primary">3 145 zł</span>."
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 text-xs">Popraw</Button>
        <Button size="sm" className="flex-1 text-xs">Zatwierdź wycenę</Button>
      </div>
    </div>
  );
}

function AnalyticsSample() {
  const months = ['Lis', 'Gru', 'Sty', 'Lut'];
  const values = [8200, 12400, 10800, 18400];
  const max = Math.max(...values);
  return (
    <div className="rounded-xl border bg-card p-4 text-sm">
      <div className="text-xs text-muted-foreground mb-3 font-medium">Przychody — ostatnie 4 miesiące</div>
      <div className="flex items-end gap-3 h-20">
        {months.map((m, i) => (
          <div key={m} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-primary/80 transition-all"
              style={{ height: `${(values[i] / max) * 100}%` }}
            />
            <span className="text-xs text-muted-foreground">{m}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs">
        <span className="text-muted-foreground">Wzrost MoM:</span>
        <span className="font-bold text-green-600">+70%</span>
      </div>
    </div>
  );
}

function MobileSample() {
  return (
    <div className="flex justify-center">
      <div className="w-40 rounded-3xl border-4 border-foreground/20 bg-card shadow-xl overflow-hidden">
        <div className="bg-primary/10 p-3 space-y-2 text-xs">
          <div className="font-bold text-sm text-center">Majster.AI</div>
          <div className="rounded bg-primary/10 border border-primary/20 p-2">
            <div className="font-medium">Remont łazienki</div>
            <div className="text-muted-foreground">3 145 zł · W toku</div>
          </div>
          <div className="rounded bg-muted p-2">
            <div className="font-medium">Malowanie klatki</div>
            <div className="text-muted-foreground">1 200 zł · Zakończony</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotosSample() {
  const photos = [
    { label: 'Przed', bg: 'bg-amber-100 dark:bg-amber-900/40' },
    { label: 'AI wykryło: pęknięcia (3)', bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { label: 'Po', bg: 'bg-green-100 dark:bg-green-900/40' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      {photos.map((p) => (
        <div key={p.label} className={`${p.bg} rounded-lg h-20 flex items-end p-1.5`}>
          <span className="text-foreground font-medium">{p.label}</span>
        </div>
      ))}
    </div>
  );
}

function BillingSample() {
  return (
    <div className="rounded-xl border bg-card divide-y divide-border text-sm overflow-hidden">
      {[
        { name: 'Majster.AI Pro', amount: '49 zł/mies.', status: 'Aktywny', color: 'text-green-600' },
        { name: 'Faktura FV/2025/002', amount: '49 zł', status: 'Opłacona', color: 'text-muted-foreground' },
        { name: 'Faktura FV/2025/001', amount: '49 zł', status: 'Opłacona', color: 'text-muted-foreground' },
      ].map((b) => (
        <div key={b.name} className="flex justify-between items-center p-3">
          <div>
            <div className="font-medium">{b.name}</div>
            <div className={`text-xs ${b.color}`}>{b.status}</div>
          </div>
          <span className="font-semibold">{b.amount}</span>
        </div>
      ))}
    </div>
  );
}

function SecuritySample() {
  const checks = [
    { label: 'Szyfrowanie SSL/TLS', ok: true },
    { label: 'Zgodność z RODO', ok: true },
    { label: 'Izolacja danych (RLS)', ok: true },
    { label: 'Kopie zapasowe co 6h', ok: true },
    { label: 'Uwierzytelnianie 2FA', ok: true },
  ];
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <span>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── sample map ────────────────────────────────── */

const SAMPLE_MAP: Record<string, React.ReactNode> = {
  quotes: <QuotesSample />,
  pdf: <PdfSample />,
  clients: <ClientsSample />,
  projects: <ProjectsSample />,
  calendar: <CalendarSample />,
  finance: <FinanceSample />,
  ai: <AiSample />,
  analytics: <AnalyticsSample />,
  mobile: <MobileSample />,
  photos: <PhotosSample />,
  billing: <BillingSample />,
  security: <SecuritySample />,
};

const ICON_MAP: Record<string, LucideIcon> = {
  quotes: Calculator,
  pdf: FileText,
  clients: Users,
  projects: FolderKanban,
  calendar: Clock,
  finance: TrendingUp,
  ai: Bot,
  analytics: BarChart3,
  mobile: Smartphone,
  photos: Camera,
  billing: CreditCard,
  security: Shield,
};

/* ─────────────────────────── modal component ────────────────────────────── */

export function FeatureDemoModal({ feature, onClose }: FeatureDemoModalProps) {
  const { t } = useTranslation();

  const Icon = feature ? (ICON_MAP[feature.key] ?? feature.icon) : null;
  const sampleUI = feature ? SAMPLE_MAP[feature.key] ?? null : null;

  return (
    <Dialog open={feature !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            {Icon && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <DialogTitle className="text-lg leading-tight">{feature?.title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t('landing.features.demoTitle')} — {t('landing.features.demoDesc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Realistic sample UI for this feature */}
          {sampleUI && <div>{sampleUI}</div>}

          {/* Feature description + benefits */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feature?.description}
          </p>
          <ul className="space-y-1.5">
            {feature?.benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-col gap-2 pt-1">
            <Button size="sm" asChild className="w-full">
              <Link to="/register">
                {t('landing.features.registerFree')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="sm" variant="ghost" asChild className="w-full">
              <Link to="/login">{t('landing.features.loginForAccess')}</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
