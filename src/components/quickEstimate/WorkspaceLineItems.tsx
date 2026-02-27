import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  Eye,
  EyeOff,
  FileSpreadsheet,
  List,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidDecimal, parseDecimal } from '@/lib/numberParsing';
import { itemLineTotal } from '@/lib/estimateCalc';
import { BulkAddModal } from './BulkAddModal';

const PAGE_SIZE = 50;

/* ── Types ─────────────────────────────────────────────────────── */

export type ItemType = 'labor' | 'material' | 'service' | 'travel' | 'lump_sum';

export interface LineItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  /** 'single' = one combined price; 'split' = separate labor + material */
  priceMode: 'single' | 'split';
  /** Net unit price — used when priceMode === 'single' */
  price: number;
  /** Labor cost per unit — used when priceMode === 'split' */
  laborCost: number;
  /** Material cost per unit — used when priceMode === 'split' */
  materialCost: number;
  /** Margin percentage 0–100. Always applied to totals. */
  marginPct: number;
  /**
   * When true, margin is visible to client.
   * When false, margin is HIDDEN from client view but STILL applied to totals.
   */
  showMargin: boolean;
  /** Optional categorization of the item */
  itemType: ItemType;
}

export function newLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    qty: 1,
    unit: 'szt',
    priceMode: 'single',
    price: 0,
    laborCost: 0,
    materialCost: 0,
    marginPct: 0,
    showMargin: true,
    itemType: 'service',
  };
}

/* ── Column visibility ──────────────────────────────────────────── */

interface ColsVisible {
  type: boolean;
  split: boolean;
  margin: boolean;
  rowTotal: boolean;
}

const DEFAULT_COLS: ColsVisible = {
  type: false,
  split: false,
  margin: false,
  rowTotal: false,
};

/* ── Item type display ──────────────────────────────────────────── */

const TYPE_COLORS: Record<ItemType, string> = {
  labor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  material: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  service: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  travel: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  lump_sum: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const TYPE_ORDER: ItemType[] = ['labor', 'material', 'service', 'travel', 'lump_sum'];

// TYPE_LABELS is built inside components that call useTranslation()

/* ── Raw input state ────────────────────────────────────────────── */

interface ItemRaw {
  qty: string;
  price: string;
  laborCost: string;
  materialCost: string;
  marginPct: string;
}

function initRaw(item: LineItem): ItemRaw {
  return {
    qty: String(item.qty),
    price: String(item.price),
    laborCost: String(item.laborCost),
    materialCost: String(item.materialCost),
    marginPct: String(item.marginPct),
  };
}

/* ── Number formatter ────────────────────────────────────────────── */

function fmt(n: number): string {
  return n.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ── Component props ─────────────────────────────────────────────── */

interface WorkspaceLineItemsProps {
  items: LineItem[];
  setItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  vatEnabled: boolean;
  onToggleVat: () => void;
}

/* ── Component ────────────────────────────────────────────────────── */

export function WorkspaceLineItems({
  items,
  setItems,
  vatEnabled,
  onToggleVat,
}: WorkspaceLineItemsProps) {
  const { t } = useTranslation();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [cols, setCols] = useState<ColsVisible>(DEFAULT_COLS);

  const [rawInputs, setRawInputs] = useState<Record<string, ItemRaw>>(() => {
    const init: Record<string, ItemRaw> = {};
    items.forEach((item) => {
      init[item.id] = initRaw(item);
    });
    return init;
  });

  // Sync rawInputs when items change externally (template/pack selection)
  useEffect(() => {
    setRawInputs((prev) => {
      const next = { ...prev };
      const ids = new Set(items.map((i) => i.id));
      items.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = initRaw(item);
        }
      });
      Object.keys(next).forEach((id) => {
        if (!ids.has(id)) delete next[id];
      });
      return next;
    });
  }, [items]);

  /* ── Update helpers ──────────────────────────────────────────── */

  function update<K extends keyof LineItem>(id: string, field: K, value: LineItem[K]) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function updateNum(
    id: string,
    field: 'qty' | 'price' | 'laborCost' | 'materialCost' | 'marginPct',
    raw: string,
  ) {
    setRawInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: raw },
    }));
    const parsed = parseDecimal(raw);
    if (parsed !== null) update(id, field, parsed);
  }

  function cycleType(id: string, current: ItemType) {
    const idx = TYPE_ORDER.indexOf(current);
    const next = TYPE_ORDER[(idx + 1) % TYPE_ORDER.length];
    update(id, 'itemType', next);
  }

  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const addItem = () => {
    const item = newLineItem();
    setItems((prev) => [...prev, item]);
    setRawInputs((prev) => ({ ...prev, [item.id]: initRaw(item) }));
    setCurrentPage(Math.floor(items.length / PAGE_SIZE));
  };

  const handleBulkAdd = (newItems: LineItem[]) => {
    const isOnlyBlank =
      items.length === 1 && !items[0].name.trim() && items[0].price === 0;
    setItems((prev) => (isOnlyBlank ? newItems : [...prev, ...newItems]));
    setRawInputs((prev) => {
      const next = { ...prev };
      for (const item of newItems) {
        next[item.id] = initRaw(item);
      }
      return next;
    });
    setCurrentPage(isOnlyBlank ? 0 : Math.floor(items.length / PAGE_SIZE));
  };

  /* ── Pagination ──────────────────────────────────────────────── */

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages - 1);
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageStart = page * PAGE_SIZE + 1;
  const pageEnd = Math.min((page + 1) * PAGE_SIZE, items.length);

  /* ── Column toggle helpers ───────────────────────────────────── */

  const toggleCol = (key: keyof ColsVisible) =>
    setCols((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <>
      <BulkAddModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onAdd={handleBulkAdd}
      />

      <Card>
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              {t('szybkaWycena.lineItems')}
            </CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Bulk add */}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setBulkOpen(true)}
                className="h-7 text-xs gap-1.5"
                data-testid="open-bulk-add"
              >
                <List className="h-3 w-3" />
                {t('szybkaWycena.bulkAdd')}
              </Button>

              {/* Column toggles */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    aria-label={t('szybkaWycena.columnsToggleAriaLabel', 'Toggle column visibility')}
                  >
                    <Columns2 className="h-3 w-3" />
                    {t('szybkaWycena.columns', 'Columns')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">{t('szybkaWycena.visibleColumns', 'Visible columns')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={cols.type}
                    onCheckedChange={() => toggleCol('type')}
                  >
                    {t('szybkaWycena.colType', 'Item type')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={cols.split}
                    onCheckedChange={() => toggleCol('split')}
                  >
                    {t('szybkaWycena.colSplit', 'L+M (labour / materials)')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={cols.margin}
                    onCheckedChange={() => toggleCol('margin')}
                  >
                    {t('szybkaWycena.colMargin', 'Margin %')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={cols.rowTotal}
                    onCheckedChange={() => toggleCol('rowTotal')}
                  >
                    {t('szybkaWycena.colRowTotal', 'Row total')}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* VAT toggle */}
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="ws-vat-toggle"
                  className="text-xs text-muted-foreground cursor-pointer select-none"
                >
                  VAT 23%
                </Label>
                <Switch
                  id="ws-vat-toggle"
                  checked={vatEnabled}
                  onCheckedChange={onToggleVat}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {/* ── Desktop column headers ─── */}
          <DesktopColHeaders cols={cols} />

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('quickEstimate.empty')}
            </p>
          )}

          <div className="space-y-2">
            {pageItems.map((item) => {
              const raw = rawInputs[item.id] ?? initRaw(item);
              const lineTotal = itemLineTotal(item);

              return (
                <ItemRow
                  key={item.id}
                  item={item}
                  raw={raw}
                  cols={cols}
                  lineTotal={lineTotal}
                  onUpdate={(field, value) => update(item.id, field, value)}
                  onUpdateNum={(field, raw) => updateNum(item.id, field, raw)}
                  onCycleType={() => cycleType(item.id, item.itemType)}
                  onRemove={() => remove(item.id)}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between mt-3 pt-3 border-t text-sm"
              data-testid="pagination-controls"
            >
              <span className="text-muted-foreground text-xs">
                {t('szybkaWycena.paginationRange', 'Items {{start}}–{{end}} of {{total}}', { start: pageStart, end: pageEnd, total: items.length })}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setCurrentPage(page - 1)}
                  className="h-7 px-2 text-xs"
                  aria-label={t('common.previousPage', 'Previous page')}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground px-2" aria-live="polite">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setCurrentPage(page + 1)}
                  className="h-7 px-2 text-xs"
                  aria-label={t('common.nextPage', 'Next page')}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            className="w-full mt-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('szybkaWycena.addItem')}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

/* ── DesktopColHeaders ───────────────────────────────────────────── */

function DesktopColHeaders({ cols }: { cols: ColsVisible }) {
  const { t } = useTranslation();
  return (
    <div className="hidden sm:flex items-center gap-2 px-1 mb-2 text-xs font-medium text-muted-foreground">
      {cols.type && <div className="w-24 shrink-0">{t('szybkaWycena.colTypeHeader', 'Type')}</div>}
      <div className="flex-1 min-w-0">{t('szybkaWycena.colItemHeader', 'Item')}</div>
      <div className="w-16 shrink-0 text-right">{t('quickEstimate.qty', 'Qty')}</div>
      <div className="w-16 shrink-0">{t('quickEstimate.unit', 'Unit')}</div>
      {cols.split ? (
        <>
          <div className="w-24 shrink-0 text-right">{t('szybkaWycena.colLabour', 'Labour')}</div>
          <div className="w-24 shrink-0 text-right">{t('szybkaWycena.colMaterials', 'Materials')}</div>
        </>
      ) : (
        <div className="w-24 shrink-0 text-right">{t('szybkaWycena.colNetPrice', 'Net price')}</div>
      )}
      {cols.margin && (
        <>
          <div className="w-20 shrink-0 text-right">{t('szybkaWycena.colMarginHeader', 'Margin %')}</div>
          <div className="w-7 shrink-0" />
        </>
      )}
      {cols.rowTotal && <div className="w-24 shrink-0 text-right">{t('szybkaWycena.colTotal', 'Total')}</div>}
      <div className="w-9 shrink-0" />
    </div>
  );
}

/* ── ItemRow ─────────────────────────────────────────────────────── */

interface ItemRowProps {
  item: LineItem;
  raw: ItemRaw;
  cols: ColsVisible;
  lineTotal: number;
  onUpdate: <K extends keyof LineItem>(field: K, value: LineItem[K]) => void;
  onUpdateNum: (
    field: 'qty' | 'price' | 'laborCost' | 'materialCost' | 'marginPct',
    raw: string,
  ) => void;
  onCycleType: () => void;
  onRemove: () => void;
}

function ItemRow({
  item,
  raw,
  cols,
  lineTotal,
  onUpdate,
  onUpdateNum,
  onCycleType,
  onRemove,
}: ItemRowProps) {
  const { t } = useTranslation();

  const TYPE_LABELS: Record<string, string> = {
    labor: t('quickEstimate.types.labor', 'Labour'),
    material: t('quickEstimate.types.material', 'Material'),
    service: t('quickEstimate.types.service', 'Service'),
    travel: t('quickEstimate.types.travel', 'Travel'),
    lump_sum: t('quickEstimate.types.fixed', 'Fixed'),
  };

  const qtyInvalid = raw.qty !== '' && !isValidDecimal(raw.qty);
  const priceInvalid = raw.price !== '' && !isValidDecimal(raw.price);
  const laborInvalid = raw.laborCost !== '' && !isValidDecimal(raw.laborCost);
  const materialInvalid = raw.materialCost !== '' && !isValidDecimal(raw.materialCost);
  const marginInvalid = raw.marginPct !== '' && !isValidDecimal(raw.marginPct);

  const marginHidden = item.marginPct > 0 && !item.showMargin;

  return (
    <>
      {/* ── Desktop row ─────────────────────────────────────── */}
      <div className="hidden sm:flex items-center gap-2">
        {/* Type badge — clickable to cycle */}
        {cols.type && (
          <button
            type="button"
            onClick={onCycleType}
            className={cn(
              'w-24 shrink-0 rounded px-1.5 py-1 text-xs font-medium text-left truncate',
              TYPE_COLORS[item.itemType],
            )}
            title={t('szybkaWycena.typeBadgeTitle', 'Type: {{type}} (click to change)', { type: TYPE_LABELS[item.itemType] })}
          >
            {TYPE_LABELS[item.itemType]}
          </button>
        )}

        {/* Name */}
        <Input
          placeholder={t('szybkaWycena.itemPlaceholder', 'e.g. Tiling wall')}
          value={item.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          className="flex-1 min-w-0 h-9 text-sm"
        />

        {/* Qty */}
        <Input
          type="text"
          inputMode="decimal"
          value={raw.qty}
          onChange={(e) => onUpdateNum('qty', e.target.value)}
          className={cn('w-16 shrink-0 h-9 text-sm text-right', qtyInvalid && 'border-destructive')}
          aria-invalid={qtyInvalid}
          title={qtyInvalid ? t('szybkaWycena.invalidQty', 'Invalid quantity') : undefined}
        />

        {/* Unit */}
        <Input
          placeholder="szt"
          value={item.unit}
          onChange={(e) => onUpdate('unit', e.target.value)}
          className="w-16 shrink-0 h-9 text-sm"
        />

        {/* Price columns (split or single) */}
        {cols.split ? (
          <>
            {/* Labor cost */}
            <div className="relative w-24 shrink-0">
              <Input
                type="text"
                inputMode="decimal"
                value={raw.laborCost}
                onChange={(e) => onUpdateNum('laborCost', e.target.value)}
                className={cn(
                  'h-9 text-sm text-right pr-6',
                  laborInvalid && 'border-destructive',
                )}
                aria-invalid={laborInvalid}
                title={laborInvalid ? t('szybkaWycena.invalidAmount', 'Invalid amount') : t('szybkaWycena.labourPerUnit', 'Labour / unit')}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                zł
              </span>
            </div>
            {/* Material cost */}
            <div className="relative w-24 shrink-0">
              <Input
                type="text"
                inputMode="decimal"
                value={raw.materialCost}
                onChange={(e) => onUpdateNum('materialCost', e.target.value)}
                className={cn(
                  'h-9 text-sm text-right pr-6',
                  materialInvalid && 'border-destructive',
                )}
                aria-invalid={materialInvalid}
                title={materialInvalid ? t('szybkaWycena.invalidAmount', 'Invalid amount') : t('szybkaWycena.materialsPerUnit', 'Materials / unit')}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                zł
              </span>
            </div>
          </>
        ) : (
          /* Single price */
          <div className="relative w-24 shrink-0">
            <Input
              type="text"
              inputMode="decimal"
              value={raw.price}
              onChange={(e) => onUpdateNum('price', e.target.value)}
              className={cn(
                'h-9 text-sm text-right pr-6',
                priceInvalid && 'border-destructive',
              )}
              aria-invalid={priceInvalid}
              title={priceInvalid ? t('szybkaWycena.invalidPrice', 'Invalid price') : undefined}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              zł
            </span>
          </div>
        )}

        {/* Margin % + eye toggle */}
        {cols.margin && (
          <>
            <div className="relative w-20 shrink-0">
              <Input
                type="text"
                inputMode="decimal"
                value={raw.marginPct}
                onChange={(e) => onUpdateNum('marginPct', e.target.value)}
                className={cn(
                  'h-9 text-sm text-right pr-6',
                  marginInvalid && 'border-destructive',
                  marginHidden && 'text-amber-600 dark:text-amber-400',
                )}
                aria-invalid={marginInvalid}
                title={
                  marginHidden
                    ? t('szybkaWycena.marginHiddenTitle', 'Margin hidden from client (included in price)')
                    : t('szybkaWycena.marginVisibleTitle', 'Margin % (visible to client)')
                }
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                %
              </span>
            </div>
            {/* Eye icon — toggles showMargin */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'w-7 h-7 shrink-0',
                item.showMargin
                  ? 'text-muted-foreground hover:text-foreground'
                  : 'text-amber-600 hover:text-amber-700 dark:text-amber-400',
              )}
              onClick={() => onUpdate('showMargin', !item.showMargin)}
              title={
                item.showMargin
                  ? t('szybkaWycena.marginVisibleClickTitle', 'Margin visible to client — click to hide')
                  : t('szybkaWycena.marginHiddenClickTitle', 'Margin hidden from client (included in price) — click to show')
              }
              aria-label={item.showMargin ? t('szybkaWycena.hideMarginAriaLabel', 'Hide margin from client') : t('szybkaWycena.showMarginAriaLabel', 'Show margin to client')}
            >
              {item.showMargin ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </Button>
          </>
        )}

        {/* Row total */}
        {cols.rowTotal && (
          <div className="w-24 shrink-0 text-right text-sm font-medium">
            {fmt(lineTotal)} zł
          </div>
        )}

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={t('szybkaWycena.removeItemAriaLabel', 'Remove item')}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Mobile row ──────────────────────────────────────────── */}
      <div className="sm:hidden space-y-1.5">
        {/* Row 1: Type (optional) + Name + Delete */}
        <div className="flex items-center gap-2">
          {cols.type && (
            <button
              type="button"
              onClick={onCycleType}
              className={cn(
                'shrink-0 rounded px-1.5 py-1 text-xs font-medium',
                TYPE_COLORS[item.itemType],
              )}
            >
              {TYPE_LABELS[item.itemType].slice(0, 3)}
            </button>
          )}
          <Input
            placeholder={t('szybkaWycena.itemPlaceholder', 'e.g. Tiling wall')}
            value={item.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            className="flex-1 h-9 text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={t('szybkaWycena.removeItemAriaLabel', 'Remove item')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Row 2: Qty + Unit + Price(s) */}
        <div className="grid grid-cols-4 gap-1.5">
          <Input
            type="text"
            inputMode="decimal"
            value={raw.qty}
            onChange={(e) => onUpdateNum('qty', e.target.value)}
            className={cn('h-8 text-sm text-right', qtyInvalid && 'border-destructive')}
            aria-invalid={qtyInvalid}
            placeholder={t('quickEstimate.qty', 'Qty')}
          />
          <Input
            placeholder={t('quickEstimate.unit', 'Unit')}
            value={item.unit}
            onChange={(e) => onUpdate('unit', e.target.value)}
            className="h-8 text-sm"
          />
          {cols.split ? (
            <>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={raw.laborCost}
                  onChange={(e) => onUpdateNum('laborCost', e.target.value)}
                  className={cn('h-8 text-sm text-right pr-5', laborInvalid && 'border-destructive')}
                  placeholder={t('szybkaWycena.labourAbbr', 'Lab.')}
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  zł
                </span>
              </div>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={raw.materialCost}
                  onChange={(e) => onUpdateNum('materialCost', e.target.value)}
                  className={cn('h-8 text-sm text-right pr-5', materialInvalid && 'border-destructive')}
                  placeholder={t('szybkaWycena.materialAbbr', 'Mat.')}
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  zł
                </span>
              </div>
            </>
          ) : (
            <div className="relative col-span-2">
              <Input
                type="text"
                inputMode="decimal"
                value={raw.price}
                onChange={(e) => onUpdateNum('price', e.target.value)}
                className={cn('h-8 text-sm text-right pr-6', priceInvalid && 'border-destructive')}
                placeholder={t('quickEstimate.price', 'Price')}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                zł
              </span>
            </div>
          )}
        </div>

        {/* Row 3: Margin (optional) + Row total (optional) */}
        {(cols.margin || cols.rowTotal) && (
          <div className="flex items-center gap-2">
            {cols.margin && (
              <div className="flex items-center gap-1">
                <div className="relative w-20">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={raw.marginPct}
                    onChange={(e) => onUpdateNum('marginPct', e.target.value)}
                    className={cn(
                      'h-8 text-sm text-right pr-5',
                      marginInvalid && 'border-destructive',
                      marginHidden && 'text-amber-600 dark:text-amber-400',
                    )}
                    placeholder={t('szybkaWycena.colMargin', 'Margin %')}
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'w-7 h-7',
                    item.showMargin
                      ? 'text-muted-foreground'
                      : 'text-amber-600 dark:text-amber-400',
                  )}
                  onClick={() => onUpdate('showMargin', !item.showMargin)}
                  aria-label={item.showMargin ? t('szybkaWycena.hideMarginAriaLabel', 'Hide margin from client') : t('szybkaWycena.showMarginAriaLabel', 'Show margin to client')}
                >
                  {item.showMargin ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
            {cols.rowTotal && (
              <div className="ml-auto text-sm font-medium text-right">
                {fmt(lineTotal)} zł
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
