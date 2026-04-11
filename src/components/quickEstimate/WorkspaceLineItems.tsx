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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Eye,
  EyeOff,
  FileSpreadsheet,
  List,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidDecimal, parseDecimal } from '@/lib/numberParsing';
import { itemLineTotal } from '@/lib/estimateCalc';
import { BulkAddModal } from './BulkAddModal';
import { SaveToPriceBookButton } from '@/components/offers/SaveToPriceBookButton';
import { useItemNameSuggestions } from '@/hooks/useItemNameSuggestions';
import type { ItemSuggestion } from '@/hooks/useItemNameSuggestions';

const PAGE_SIZE = 50;

// ⚠️ REFACTOR PLAN (Audyt V3, W-5):
// Ten plik ma >1100 linii. Kandydaci do wydzielenia w osobnych PR:
//   1. ItemRow → ./ItemRow.tsx (~380 linii)
//   2. PriceBookPanel → ./PriceBookPanel.tsx (~75 linii)
//   3. NameFieldWithAutocomplete → ./NameFieldWithAutocomplete.tsx (~100 linii)
//   4. DesktopColHeaders → ./DesktopColHeaders.tsx (~50 linii)
//   5. Typy (LineItem, ColsVisible, etc.) → ./types.ts
// Nie ruszać w jednym PR — każde wydzielenie to osobny PR ≤200 LOC.

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

// 'service' uses the DS --category-protocol token (see src/index.css).
const TYPE_COLORS: Record<ItemType, string> = {
  labor: 'bg-info/10 text-info dark:bg-info/20',
  material: 'bg-success/10 text-success dark:bg-success/20',
  service: 'bg-category-protocol text-category-protocol dark:bg-category-protocol-strong',
  travel: 'bg-warning/10 text-warning dark:bg-warning/20',
  lump_sum: 'bg-muted text-muted-foreground',
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
  return n.toLocaleString(undefined, {
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
  const [pbOpen, setPbOpen] = useState(false);
  const [pbSearch, setPbSearch] = useState('');

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

  const fillFromSuggestion = (id: string, s: ItemSuggestion) => {
    const itemType: ItemType =
      s.source === 'price_book' && s.category === 'Materiał' ? 'material' : 'labor';
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, name: s.name, unit: s.unit, price: s.price, itemType } : i,
      ),
    );
    setRawInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], price: String(s.price) },
    }));
  };

  const addFromSuggestion = (s: ItemSuggestion) => {
    const itemType: ItemType =
      s.source === 'price_book' && s.category === 'Materiał' ? 'material' : 'labor';
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      name: s.name,
      qty: 1,
      unit: s.unit,
      priceMode: 'single',
      price: s.price,
      laborCost: 0,
      materialCost: 0,
      marginPct: 0,
      showMargin: true,
      itemType,
    };
    const isOnlyBlank = items.length === 1 && !items[0].name.trim() && items[0].price === 0;
    setItems((prev) => isOnlyBlank ? [newItem] : [...prev, newItem]);
    setRawInputs((prev) => ({ ...prev, [newItem.id]: initRaw(newItem) }));
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
              {/* Price book search toggle */}
              <Button
                variant={pbOpen ? 'default' : 'outline'}
                size="sm"
                type="button"
                onClick={() => { setPbOpen((v) => !v); if (!pbOpen) setPbSearch(''); }}
                className="h-7 text-xs gap-1.5"
                data-testid="toggle-price-book"
              >
                <BookOpen className="h-3 w-3" />
                {t('priceBook.fromPriceBook')}
              </Button>

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
                    aria-label={t('szybkaWycena.columnsToggleAriaLabel')}
                  >
                    <Columns2 className="h-3 w-3" />
                    {t('szybkaWycena.columns')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">{t('szybkaWycena.visibleColumns')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={cols.type}
                    onCheckedChange={() => toggleCol('type')}
                  >
                    {t('szybkaWycena.colType')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={cols.split}
                    onCheckedChange={() => toggleCol('split')}
                  >
                    {t('szybkaWycena.colSplit')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={cols.margin}
                    onCheckedChange={() => toggleCol('margin')}
                  >
                    {t('szybkaWycena.colMargin')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={cols.rowTotal}
                    onCheckedChange={() => toggleCol('rowTotal')}
                  >
                    {t('szybkaWycena.colRowTotal')}
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
          {/* ── Price book search panel ─── */}
          {pbOpen && (
            <PriceBookPanel
              search={pbSearch}
              onSearchChange={setPbSearch}
              onSelect={addFromSuggestion}
            />
          )}

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
                  onFillFromSuggestion={(s) => fillFromSuggestion(item.id, s)}
                  showSaveBtn
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
                {t('szybkaWycena.paginationRange', { start: pageStart, end: pageEnd, total: items.length })}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setCurrentPage(page - 1)}
                  className="h-7 px-2 text-xs"
                  aria-label={t('common.previousPage')}
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
                  aria-label={t('common.nextPage')}
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

/* ── PriceBookPanel ──────────────────────────────────────────────── */

interface PriceBookPanelProps {
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (s: ItemSuggestion) => void;
}

function PriceBookPanel({ search, onSearchChange, onSelect }: PriceBookPanelProps) {
  const { t } = useTranslation();
  const { suggestions, priceBookSuggestions, historicalSuggestions, isLoading } =
    useItemNameSuggestions(search);

  const hasSuggestions = suggestions.length > 0;
  const showEmpty = search.trim().length >= 2 && !isLoading && !hasSuggestions;
  const showHint = search.trim().length < 2;

  return (
    <div
      className="mb-3 rounded-lg border border-border bg-muted/30 p-2.5 space-y-2"
      data-testid="price-book-panel"
    >
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-7 h-8 text-sm"
          placeholder={t('priceBook.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
          data-testid="price-book-search"
        />
      </div>

      {showHint && (
        <p className="text-xs text-muted-foreground px-1">
          {t('priceBook.searchPlaceholder')}
        </p>
      )}

      {showEmpty && (
        <p className="text-xs text-muted-foreground text-center py-2">
          {t('priceBook.noResults')}
        </p>
      )}

      {hasSuggestions && (
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {/* Price book section */}
          {priceBookSuggestions.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1 pt-1">
                {t('priceBook.sourcePriceBook')}
              </p>
              {priceBookSuggestions.map((s) => (
                <SuggestionRow key={s.id} suggestion={s} onSelect={onSelect} />
              ))}
            </>
          )}

          {/* Historical section */}
          {historicalSuggestions.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1 pt-1.5">
                {t('priceBook.recentlyUsed')}
              </p>
              {historicalSuggestions.map((s) => (
                <SuggestionRow key={s.id} suggestion={s} onSelect={onSelect} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface SuggestionRowProps {
  suggestion: ItemSuggestion;
  onSelect: (s: ItemSuggestion) => void;
}

function SuggestionRow({ suggestion, onSelect }: SuggestionRowProps) {
  const { t } = useTranslation();
  const sourceLabel =
    suggestion.source === 'price_book'
      ? t('priceBook.sourcePriceBook')
      : t('priceBook.sourceRecentlyUsed', {
          price: suggestion.price.toFixed(0),
          unit: suggestion.unit,
        });

  return (
    <button
      type="button"
      onClick={() => onSelect(suggestion)}
      className="w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors group"
      data-testid="suggestion-row"
    >
      <Plus className="h-3.5 w-3.5 shrink-0 text-primary opacity-60 group-hover:opacity-100" />
      <span className="flex-1 truncate">{suggestion.name}</span>
      <span className="text-xs text-muted-foreground shrink-0">
        {suggestion.price.toFixed(0)} zł / {suggestion.unit}
      </span>
      <span
        className={cn(
          'text-[10px] rounded-full px-1.5 py-0.5 shrink-0',
          suggestion.source === 'price_book'
            ? 'bg-primary/10 text-primary'
            : 'bg-warning/10 text-warning dark:bg-warning/20',
        )}
        data-testid={`suggestion-source-${suggestion.source}`}
      >
        {sourceLabel}
      </span>
    </button>
  );
}

/* ── NameFieldWithAutocomplete ───────────────────────────────────── */

interface NameFieldProps {
  value: string;
  placeholder: string;
  containerClassName?: string;
  onChange: (v: string) => void;
  onSelect?: (s: ItemSuggestion) => void;
}

function NameFieldWithAutocomplete({
  value,
  placeholder,
  containerClassName,
  onChange,
  onSelect,
}: NameFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { priceBookSuggestions, historicalSuggestions, isLoading } =
    useItemNameSuggestions(value);

  const hasSuggestions = priceBookSuggestions.length > 0 || historicalSuggestions.length > 0;
  const showDropdown = open && value.trim().length >= 2 && (isLoading || hasSuggestions);

  return (
    <div className={cn('relative', containerClassName)}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-9 text-sm w-full"
        data-testid="name-field"
      />
      {showDropdown && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-0.5 rounded-md border border-border bg-background shadow-lg max-h-48 overflow-y-auto"
          data-testid="name-suggestions-dropdown"
        >
          {isLoading && (
            <p className="text-xs text-muted-foreground px-2 py-1.5">…</p>
          )}
          {priceBookSuggestions.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2 pt-1.5 pb-0.5">
                {t('priceBook.sourcePriceBook')}
              </p>
              {priceBookSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect?.(s);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                  data-testid="name-suggestion-row"
                >
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {s.price.toFixed(0)} zł / {s.unit}
                  </span>
                  <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-primary/10 text-primary shrink-0">
                    {t('priceBook.sourcePriceBook')}
                  </span>
                </button>
              ))}
            </>
          )}
          {historicalSuggestions.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-2 pt-1.5 pb-0.5">
                {t('priceBook.recentlyUsed')}
              </p>
              {historicalSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect?.(s);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                  data-testid="name-suggestion-row"
                >
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {s.price.toFixed(0)} zł / {s.unit}
                  </span>
                  <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-warning/10 text-warning dark:bg-warning/20 shrink-0">
                    {t('priceBook.sourceRecentlyUsed', { price: s.price.toFixed(0), unit: s.unit })}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── DesktopColHeaders ───────────────────────────────────────────── */

function DesktopColHeaders({ cols }: { cols: ColsVisible }) {
  const { t } = useTranslation();
  return (
    <div className="hidden sm:flex items-center gap-2 px-1 mb-2 text-xs font-medium text-muted-foreground">
      {cols.type && <div className="w-24 shrink-0">{t('szybkaWycena.colTypeHeader')}</div>}
      <div className="flex-1 min-w-0">{t('szybkaWycena.colItemHeader')}</div>
      <div className="w-16 shrink-0 text-right">{t('quickEstimate.qty')}</div>
      <div className="w-16 shrink-0">{t('quickEstimate.unit')}</div>
      {cols.split ? (
        <>
          <div className="w-24 shrink-0 text-right">{t('szybkaWycena.colLabour')}</div>
          <div className="w-24 shrink-0 text-right">{t('szybkaWycena.colMaterials')}</div>
        </>
      ) : (
        <div className="w-24 shrink-0 text-right">{t('szybkaWycena.colNetPrice')}</div>
      )}
      {cols.margin && (
        <>
          <div className="w-20 shrink-0 text-right">{t('szybkaWycena.colMarginHeader')}</div>
          <div className="w-7 shrink-0" />
        </>
      )}
      {cols.rowTotal && <div className="w-24 shrink-0 text-right">{t('szybkaWycena.colTotal')}</div>}
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
  onFillFromSuggestion?: (s: ItemSuggestion) => void;
  showSaveBtn?: boolean;
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
  onFillFromSuggestion,
  showSaveBtn = false,
}: ItemRowProps) {
  const { t } = useTranslation();

  const TYPE_LABELS: Record<string, string> = {
    labor: t('quickEstimate.types.labor'),
    material: t('quickEstimate.types.material'),
    service: t('quickEstimate.types.service'),
    travel: t('quickEstimate.types.travel'),
    lump_sum: t('quickEstimate.types.fixed'),
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
            title={t('szybkaWycena.typeBadgeTitle', { type: TYPE_LABELS[item.itemType] })}
          >
            {TYPE_LABELS[item.itemType]}
          </button>
        )}

        {/* Name */}
        <NameFieldWithAutocomplete
          value={item.name}
          placeholder={t('szybkaWycena.itemPlaceholder')}
          containerClassName="flex-1 min-w-0"
          onChange={(v) => onUpdate('name', v)}
          onSelect={onFillFromSuggestion}
        />

        {/* Qty */}
        <Input
          type="text"
          inputMode="decimal"
          value={raw.qty}
          onChange={(e) => onUpdateNum('qty', e.target.value)}
          className={cn('w-16 shrink-0 h-9 text-sm text-right', qtyInvalid && 'border-destructive')}
          aria-invalid={qtyInvalid}
          title={qtyInvalid ? t('szybkaWycena.invalidQty') : undefined}
        />

        {/* Unit */}
        <Input
          placeholder={t('szybkaWycena.unitPlaceholder')}
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
                title={laborInvalid ? t('szybkaWycena.invalidAmount') : t('szybkaWycena.labourPerUnit')}
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
                title={materialInvalid ? t('szybkaWycena.invalidAmount') : t('szybkaWycena.materialsPerUnit')}
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
              title={priceInvalid ? t('szybkaWycena.invalidPrice') : undefined}
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
                  marginHidden && 'text-warning',
                )}
                aria-invalid={marginInvalid}
                title={
                  marginHidden
                    ? t('szybkaWycena.marginHiddenTitle')
                    : t('szybkaWycena.marginVisibleTitle')
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
                  : 'text-warning hover:text-warning/80',
              )}
              onClick={() => onUpdate('showMargin', !item.showMargin)}
              title={
                item.showMargin
                  ? t('szybkaWycena.marginVisibleClickTitle')
                  : t('szybkaWycena.marginHiddenClickTitle')
              }
              aria-label={item.showMargin ? t('szybkaWycena.hideMarginAriaLabel') : t('szybkaWycena.showMarginAriaLabel')}
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

        {/* Save to price book (desktop) */}
        {showSaveBtn && (
          <SaveToPriceBookButton
            name={item.name}
            unit={item.unit}
            price={item.price}
            category={item.itemType === 'material' ? 'Materiał' : 'Robocizna'}
          />
        )}

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={t('szybkaWycena.removeItemAriaLabel')}
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
          <NameFieldWithAutocomplete
            value={item.name}
            placeholder={t('szybkaWycena.itemPlaceholder')}
            containerClassName="flex-1"
            onChange={(v) => onUpdate('name', v)}
            onSelect={onFillFromSuggestion}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={t('szybkaWycena.removeItemAriaLabel')}
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
            placeholder={t('quickEstimate.qty')}
          />
          <Input
            placeholder={t('quickEstimate.unit')}
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
                  placeholder={t('szybkaWycena.labourAbbr')}
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
                  placeholder={t('szybkaWycena.materialAbbr')}
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
                placeholder={t('quickEstimate.price')}
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
                      marginHidden && 'text-warning',
                    )}
                    placeholder={t('szybkaWycena.colMargin')}
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
                      : 'text-warning',
                  )}
                  onClick={() => onUpdate('showMargin', !item.showMargin)}
                  aria-label={item.showMargin ? t('szybkaWycena.hideMarginAriaLabel') : t('szybkaWycena.showMarginAriaLabel')}
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

        {/* Save to price book (mobile) */}
        {showSaveBtn && item.name.trim() && (
          <div className="flex justify-end">
            <SaveToPriceBookButton
              name={item.name}
              unit={item.unit}
              price={item.price}
              category={item.itemType === 'material' ? 'Materiał' : 'Robocizna'}
            />
          </div>
        )}
      </div>
    </>
  );
}
