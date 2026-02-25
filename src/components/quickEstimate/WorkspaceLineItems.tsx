import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FileSpreadsheet, List, Plus, Trash2 } from 'lucide-react';
import { isValidDecimal, parseDecimal } from '@/lib/numberParsing';
import { BulkAddModal } from './BulkAddModal';

export interface LineItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
}

export function newLineItem(): LineItem {
  return { id: crypto.randomUUID(), name: '', qty: 1, unit: 'szt', price: 0 };
}

interface WorkspaceLineItemsProps {
  items: LineItem[];
  setItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  vatEnabled: boolean;
  onToggleVat: () => void;
}

export function WorkspaceLineItems({
  items,
  setItems,
  vatEnabled,
  onToggleVat,
}: WorkspaceLineItemsProps) {
  const [bulkOpen, setBulkOpen] = useState(false);

  const [rawInputs, setRawInputs] = useState<
    Record<string, { qty: string; price: string }>
  >(() => {
    const init: Record<string, { qty: string; price: string }> = {};
    items.forEach((item) => {
      init[item.id] = { qty: String(item.qty), price: String(item.price) };
    });
    return init;
  });

  // Sync rawInputs when items change externally (e.g. template selection)
  useEffect(() => {
    setRawInputs((prev) => {
      const next = { ...prev };
      const ids = new Set(items.map((i) => i.id));
      items.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = { qty: String(item.qty), price: String(item.price) };
        }
      });
      Object.keys(next).forEach((id) => {
        if (!ids.has(id)) delete next[id];
      });
      return next;
    });
  }, [items]);

  const update = (id: string, field: keyof LineItem, value: string | number) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );

  const updateNum = (id: string, field: 'qty' | 'price', raw: string) => {
    setRawInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: raw },
    }));
    const parsed = parseDecimal(raw);
    if (parsed !== null) update(id, field, parsed);
  };

  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const addItem = () => {
    const item = newLineItem();
    setItems((prev) => [...prev, item]);
    setRawInputs((prev) => ({ ...prev, [item.id]: { qty: '1', price: '0' } }));
  };

  const handleBulkAdd = (newItems: LineItem[]) => {
    setItems((prev) => {
      // Replace the only blank item if present, otherwise append
      const isOnlyBlank =
        prev.length === 1 && !prev[0].name.trim() && prev[0].price === 0;
      return isOnlyBlank ? newItems : [...prev, ...newItems];
    });
    setRawInputs((prev) => {
      const next = { ...prev };
      for (const item of newItems) {
        next[item.id] = { qty: String(item.qty), price: String(item.price) };
      }
      return next;
    });
  };

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
            Pozycje wyceny
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setBulkOpen(true)}
              className="h-7 text-xs gap-1.5"
              data-testid="open-bulk-add"
            >
              <List className="h-3 w-3" />
              Dodaj wiele
            </Button>
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
        {/* Column headers — visible on sm+ */}
        <div className="hidden sm:grid grid-cols-[1fr_72px_72px_96px_36px] gap-2 px-1 mb-2 text-xs font-medium text-muted-foreground">
          <span>Pozycja</span>
          <span>Ilość</span>
          <span>Jedn.</span>
          <span className="text-right">Cena netto</span>
          <span />
        </div>

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Brak pozycji. Dodaj pierwszą pozycję.
          </p>
        )}

        <div className="space-y-2">
          {items.map((item) => {
            const qtyStr = rawInputs[item.id]?.qty ?? String(item.qty);
            const priceStr = rawInputs[item.id]?.price ?? String(item.price);
            const qtyInvalid = qtyStr !== '' && !isValidDecimal(qtyStr);
            const priceInvalid = priceStr !== '' && !isValidDecimal(priceStr);

            return (
              <div
                key={item.id}
                className="grid sm:grid-cols-[1fr_72px_72px_96px_36px] grid-cols-[1fr_36px] gap-2 items-center"
              >
                {/* Name — spans full width on mobile */}
                <Input
                  placeholder="np. Kafelkowanie ściany"
                  value={item.name}
                  onChange={(e) => update(item.id, 'name', e.target.value)}
                  className="h-9 text-sm col-span-1 sm:col-span-1"
                />

                {/* Delete button — mobile only (visible alongside name) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive sm:hidden"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Qty, Unit, Price — appear below on mobile, inline on sm+ */}
                <div className="sm:contents grid grid-cols-3 col-span-2 gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={qtyStr}
                    onChange={(e) => updateNum(item.id, 'qty', e.target.value)}
                    className={`h-9 text-sm text-right ${
                      qtyInvalid ? 'border-destructive' : ''
                    }`}
                    aria-invalid={qtyInvalid}
                    title={qtyInvalid ? 'Nieprawidłowa ilość' : undefined}
                  />
                  <Input
                    placeholder="szt"
                    value={item.unit}
                    onChange={(e) => update(item.id, 'unit', e.target.value)}
                    className="h-9 text-sm"
                  />
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={priceStr}
                      onChange={(e) => updateNum(item.id, 'price', e.target.value)}
                      className={`h-9 text-sm text-right pr-6 ${
                        priceInvalid ? 'border-destructive' : ''
                      }`}
                      aria-invalid={priceInvalid}
                      title={priceInvalid ? 'Nieprawidłowa cena' : undefined}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      zł
                    </span>
                  </div>
                </div>

                {/* Delete button — desktop only */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hidden sm:flex"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          className="w-full mt-3"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj pozycję
        </Button>
      </CardContent>
    </Card>
    </>
  );
}
