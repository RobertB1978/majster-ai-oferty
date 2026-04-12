/**
 * BurnBarSection — PR-14
 *
 * Budget vs Costs "Burn Bar" section for ProjectHub.
 * Shows: budget, spent, remaining, spent %.
 * Budget defaults to offer net total (budget_source='OFFER_NET'); editable manually.
 * User can add costs in ≤ 3 taps via AddCostSheet.
 *
 * Used inside the ProjectHub accordion (section id='costs').
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Pencil, Check, X, Trash2, Loader2, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  useProjectCosts,
  useDeleteProjectCost,
  useUpdateProjectBudget,
  sumCosts,
  type ProjectCost,
  type CostType,
} from '@/hooks/useProjectCosts';
import type { ProjectV2 } from '@/hooks/useProjectsV2';
import { AddCostSheet } from '@/components/costs/AddCostSheet';
import { formatCurrency as fmtCurrency, formatDate as fmtDate } from '@/lib/formatters';

function calcPercent(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(Math.round((spent / budget) * 100), 100);
}

const COST_TYPE_BADGE: Record<CostType, string> = {
  MATERIAL: 'bg-ds-accent-blue-subtle text-ds-accent-blue dark:text-ds-accent-blue-light',
  LABOR:    'bg-primary/10 text-primary dark:bg-primary/20',
  TRAVEL:   'bg-warning/10 text-warning dark:bg-warning/20',
  OTHER:    'bg-muted text-muted-foreground',
};

// ── BudgetEditor ──────────────────────────────────────────────────────────────

interface BudgetEditorProps {
  projectId: string;
  currentBudget: number | null;
  budgetSource: ProjectV2['budget_source'];
}

function BudgetEditor({ projectId, currentBudget, budgetSource }: BudgetEditorProps) {
  const { t, i18n } = useTranslation();
  const updateBudget = useUpdateProjectBudget();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentBudget != null ? String(currentBudget) : '');

  const handleSave = async () => {
    const raw = value.replace(',', '.');
    const num = Number(raw);
    if (isNaN(num) || num < 0) {
      toast.error(t('burnBar.amountInvalid'));
      return;
    }
    try {
      await updateBudget.mutateAsync({ projectId, budgetNet: num });
      toast.success(t('burnBar.budgetSaved'));
      setEditing(false);
    } catch {
      toast.error(t('burnBar.saveError'));
    }
  };

  const handleCancel = () => {
    setValue(currentBudget != null ? String(currentBudget) : '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[160px]">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="text"
            inputMode="decimal"
            className="h-8 text-sm pr-12"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            PLN
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-success hover:text-success/80"
          onClick={handleSave}
          disabled={updateBudget.isPending}
          aria-label={t('burnBar.saveBudget')}
        >
          {updateBudget.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleCancel}
          aria-label={t('burnBar.cancelEdit')}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-sm font-medium">
        {currentBudget != null ? fmtCurrency(currentBudget, i18n.language) : t('burnBar.noBudget')}
      </span>
      {budgetSource === 'OFFER_NET' && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {t('burnBar.fromOffer')}
        </Badge>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={() => {
          setValue(currentBudget != null ? String(currentBudget) : '');
          setEditing(true);
        }}
        aria-label={t('burnBar.editBudget')}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ── CostRow ───────────────────────────────────────────────────────────────────

interface CostRowProps {
  cost: ProjectCost;
  projectId: string;
}

function CostRow({ cost, projectId }: CostRowProps) {
  const { t, i18n } = useTranslation();
  const deleteCost = useDeleteProjectCost(projectId);

  const handleDelete = async () => {
    try {
      await deleteCost.mutateAsync(cost.id);
      toast.success(t('burnBar.costDeleted'));
    } catch {
      toast.error(t('burnBar.deleteError'));
    }
  };

  const COST_TYPE_KEYS: Record<CostType, string> = {
    MATERIAL: 'burnBar.typeMaterial',
    LABOR:    'burnBar.typeLabor',
    TRAVEL:   'burnBar.typeTravel',
    OTHER:    'burnBar.typeOther',
  };

  return (
    <li className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <Badge
        className={cn(
          'text-[10px] px-1.5 py-0 shrink-0 font-medium',
          COST_TYPE_BADGE[cost.cost_type as CostType]
        )}
      >
        {t(COST_TYPE_KEYS[cost.cost_type as CostType])}
      </Badge>
      <div className="flex-1 min-w-0">
        {cost.note && (
          <p className="truncate text-xs text-foreground">{cost.note}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {fmtDate(cost.incurred_at, i18n.language)}
        </p>
      </div>
      <span className="font-semibold shrink-0 text-sm">{fmtCurrency(cost.amount_net, i18n.language)}</span>
      <button
        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
        onClick={handleDelete}
        disabled={deleteCost.isPending}
        aria-label={t('burnBar.deleteCost')}
      >
        {deleteCost.isPending
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Trash2 className="h-3.5 w-3.5" />
        }
      </button>
    </li>
  );
}

// ── BurnBarSection ────────────────────────────────────────────────────────────

interface BurnBarSectionProps {
  project: ProjectV2;
}

export function BurnBarSection({ project }: BurnBarSectionProps) {
  const { t, i18n } = useTranslation();
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const { data: costs = [], isLoading } = useProjectCosts(project.id);

  const spent = sumCosts(costs);
  const budget = project.budget_net ?? 0;
  const remaining = budget - spent;
  const pct = budget > 0 ? calcPercent(spent, budget) : 0;

  const barColor =
    pct >= 100
      ? 'bg-destructive'
      : pct >= 80
      ? 'bg-warning'
      : 'bg-primary';

  if (isLoading) {
    return <SkeletonList rows={3} />;
  }

  return (
    <div className="space-y-4">
      {/* Budget row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground font-medium">{t('burnBar.budget')}</span>
        <BudgetEditor
          projectId={project.id}
          currentBudget={project.budget_net}
          budgetSource={project.budget_source}
        />
      </div>

      {/* Burn bar (only shown if budget is set) */}
      {project.budget_net != null && project.budget_net > 0 ? (
        <div className="space-y-2">
          {/* Bar */}
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', barColor)}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('burnBar.spentPercent', { pct })}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/40 px-2 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('burnBar.spent')}</p>
              <p className="text-sm font-bold mt-0.5 truncate">{fmtCurrency(spent, i18n.language)}</p>
            </div>
            <div className="rounded-md bg-muted/40 px-2 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('burnBar.spentPct')}</p>
              <p className={cn('text-sm font-bold mt-0.5', pct >= 100 ? 'text-destructive' : pct >= 80 ? 'text-warning' : '')}>
                {pct}%
              </p>
            </div>
            <div className="rounded-md bg-muted/40 px-2 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('burnBar.remaining')}</p>
              <p className={cn('text-sm font-bold mt-0.5 truncate', remaining < 0 ? 'text-destructive' : '')}>
                {fmtCurrency(remaining, i18n.language)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* No budget set yet */
        <p className="text-xs text-muted-foreground">{t('burnBar.setBudgetHint')}</p>
      )}

      {/* Costs list */}
      {costs.length > 0 ? (
        <ul className="space-y-1.5">
          {costs.map((cost) => (
            <CostRow key={cost.id} cost={cost} projectId={project.id} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Receipt}
          title={t('burnBar.emptyTitle')}
          description={t('burnBar.emptyDesc')}
          ctaLabel={t('burnBar.addFirstCost')}
          onCta={() => setAddSheetOpen(true)}
        />
      )}

      {/* Add cost button (shown always when there are costs) */}
      {costs.length > 0 && (
        <Button
          variant="outline"
          className="w-full h-11 gap-2 text-sm font-medium"
          onClick={() => setAddSheetOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {t('burnBar.addCost')}
        </Button>
      )}

      {/* Add Cost Sheet */}
      <AddCostSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        projectId={project.id}
      />
    </div>
  );
}
