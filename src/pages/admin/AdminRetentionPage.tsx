import { useRetentionRules } from '@/hooks/useRetentionRules';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Clock, Loader2, ShieldAlert } from 'lucide-react';
import type { RetentionDeletionStrategy, RetentionRule, RetentionStatus } from '@/types/retention';

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<RetentionStatus, string> = {
  active: 'Aktywna',
  inactive: 'Nieaktywna',
  manual: 'Ręczna',
  planned: 'Planowana',
};

const STATUS_VARIANT: Record<RetentionStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  manual: 'outline',
  planned: 'secondary',
};

const STRATEGY_LABEL: Record<RetentionDeletionStrategy, string> = {
  hard_delete: 'Twarde usunięcie',
  soft_delete: 'Miękkie usunięcie',
  archive: 'Archiwizacja',
  manual_review: 'Ręczna weryfikacja',
  unknown: 'Nieznana',
};

const STRATEGY_VARIANT: Record<RetentionDeletionStrategy, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  hard_delete: 'destructive',
  soft_delete: 'secondary',
  archive: 'secondary',
  manual_review: 'outline',
  unknown: 'outline',
};

const DOMAIN_LABEL: Record<string, string> = {
  system: 'System',
  offers: 'Oferty',
  ai: 'AI',
  compliance: 'Compliance',
  legal: 'Prawne',
  users: 'Użytkownicy',
  clients: 'Klienci',
};

function formatLastRun(rule: RetentionRule) {
  if (!rule.last_run_at) {
    return <span className="text-muted-foreground text-xs">Nigdy nie uruchomiono</span>;
  }
  const date = new Date(rule.last_run_at).toLocaleString('pl-PL');
  const status = rule.last_run_status;
  if (status === 'success') {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        {date} — sukces
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <AlertTriangle className="h-3 w-3" />
        {date} — błąd
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      {date} — {status ?? 'nieznany status'}
    </span>
  );
}

function RetentionRuleRow({ rule }: { rule: RetentionRule }) {
  const domainLabel = DOMAIN_LABEL[rule.data_domain] ?? rule.data_domain;
  const period =
    rule.retention_period_days != null
      ? `${rule.retention_period_days} dni`
      : <span className="italic text-muted-foreground">UNKNOWN</span>;

  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{rule.rule_name}</span>
        <Badge variant={STATUS_VARIANT[rule.status]} className="text-xs">
          {STATUS_LABEL[rule.status]}
        </Badge>
        <Badge variant={STRATEGY_VARIANT[rule.deletion_strategy]} className="text-xs">
          {STRATEGY_LABEL[rule.deletion_strategy]}
        </Badge>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {domainLabel}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-muted-foreground">
        <span>
          Zakres: <code className="bg-muted px-1 rounded text-xs">{rule.applies_to}</code>
        </span>
        <span>Okres retencji: {period}</span>
      </div>
      <div className="mt-1">{formatLastRun(rule)}</div>
      {rule.legal_basis_note && (
        <p className="mt-1 text-xs text-muted-foreground border-t pt-1">{rule.legal_basis_note}</p>
      )}
    </div>
  );
}

function groupByDomain(rules: RetentionRule[]): Map<string, RetentionRule[]> {
  const map = new Map<string, RetentionRule[]>();
  for (const rule of rules) {
    const key = rule.data_domain;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(rule);
  }
  return map;
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function AdminRetentionPage() {
  const { data: rules, isLoading, error } = useRetentionRules();

  const grouped = rules ? groupByDomain(rules) : null;
  const unknownCount = rules?.filter((r) => r.retention_period_days == null).length ?? 0;
  const activeCount = rules?.filter((r) => r.status === 'active').length ?? 0;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Polityka retencji danych</h1>
          <p className="text-sm text-muted-foreground">
            Przegląd reguł retencji. Reguły oznaczone UNKNOWN wymagają decyzji prawnej.
          </p>
        </div>
      </div>

      {/* Summary badges */}
      {rules && (
        <div className="flex flex-wrap gap-3 mb-6">
          <Badge variant="default">{activeCount} aktywnych reguł</Badge>
          {unknownCount > 0 && (
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {unknownCount} z nieznanym okresem (UNKNOWN)
            </Badge>
          )}
          <Badge variant="secondary">{rules.length} reguł łącznie</Badge>
        </div>
      )}

      {/* States */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ładowanie reguł retencji…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive py-8">
          <AlertTriangle className="h-4 w-4" />
          Nie udało się załadować reguł. Sprawdź uprawnienia administratora.
        </div>
      )}

      {!isLoading && !error && (!rules || rules.length === 0) && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Brak zdefiniowanych reguł retencji.
        </p>
      )}

      {/* Rules grouped by domain */}
      {grouped && grouped.size > 0 && (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([domain, domainRules]) => (
            <Card key={domain}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {DOMAIN_LABEL[domain] ?? domain}
                </CardTitle>
                <CardDescription>
                  {domainRules.length} {domainRules.length === 1 ? 'reguła' : 'reguły'} w tej domenie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {domainRules.map((rule) => (
                    <RetentionRuleRow key={rule.id} rule={rule} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* UNKNOWN warning */}
      {unknownCount > 0 && !isLoading && !error && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-300">
                {unknownCount} reguł wymaga decyzji prawnej
              </p>
              <p className="text-amber-700 dark:text-amber-400 mt-1">
                Reguły oznaczone jako UNKNOWN nie mają zdefiniowanego okresu retencji.
                Wymaga to oceny przez Administratora Danych / radcę prawnego.
                Szczegóły: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">docs/legal/RETENTION_RULES_FOUNDATION.md</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
