import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2, Save } from 'lucide-react';
import { calcTotals } from '@/lib/estimateCalc';
import type { LineItem } from './WorkspaceLineItems';

function fmt(n: number): string {
  return n.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface StickyTotalsCardProps {
  items: LineItem[];
  vatEnabled: boolean;
  onSave: () => void;
  saving: boolean;
  /** compact=true renders a slim horizontal bar for mobile bottom strip */
  compact?: boolean;
}

export function StickyTotalsCard({
  items,
  vatEnabled,
  onSave,
  saving,
  compact = false,
}: StickyTotalsCardProps) {
  const { t } = useTranslation();
  const { netTotal, vatAmount, grossTotal } = calcTotals(items, vatEnabled);
  const hasItems = items.some((i) => i.name.trim() && i.qty > 0);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 flex gap-3 text-sm flex-wrap">
          <span className="text-muted-foreground">
            {t('common.net', 'Net:')}:{' '}
            <span className="font-medium text-foreground">{fmt(netTotal)} zł</span>
          </span>
          {vatEnabled && (
            <span className="text-muted-foreground">
              {t('common.gross', 'Gross:')}:{' '}
              <span className="font-bold text-primary">{fmt(grossTotal)} zł</span>
            </span>
          )}
        </div>
        <Button
          onClick={onSave}
          disabled={saving || !hasItems}
          size="sm"
          className="shrink-0"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-2 hidden xs:inline">{t('quickEstimate.save', 'Save as project')}</span>
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn('sticky top-4')}>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t('common.net', 'Net')}</span>
            <span>{fmt(netTotal)} zł</span>
          </div>
          {vatEnabled && (
            <div className="flex justify-between text-muted-foreground">
              <span>VAT 23%</span>
              <span>{fmt(vatAmount)} zł</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>{vatEnabled ? t('common.gross', 'Gross') : t('quickEstimate.total', 'TOTAL')}</span>
            <span className="text-primary">{fmt(grossTotal)} zł</span>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={onSave}
          disabled={saving || !hasItems}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('szybkaWycena.saveAsProject')}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {vatEnabled ? t('szybkaWycena.vatIncluded') : t('szybkaWycena.noVat')}
          {' · '}{t('szybkaWycena.clientRequiredNote')}
        </p>
      </CardContent>
    </Card>
  );
}
