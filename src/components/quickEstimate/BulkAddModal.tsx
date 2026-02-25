import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Upload } from 'lucide-react';
import { parseBulkText, parsedRowsToLineItems } from '@/lib/bulkItemsParsing';
import { parseDecimal } from '@/lib/numberParsing';
import type { ParsedRow } from '@/lib/bulkItemsParsing';
import type { LineItem } from './WorkspaceLineItems';

interface BulkAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (items: LineItem[]) => void;
}

/** Polish pluralisation helper for "pozycja" */
function countLabel(n: number): string {
  if (n === 1) return '1 pozycję';
  if (n >= 2 && n <= 4) return `${n} pozycje`;
  return `${n} pozycji`;
}

export function BulkAddModal({ open, onClose, onAdd }: BulkAddModalProps) {
  const [rawText, setRawText] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Text / file input ──────────────────────────────────────── */

  const handleTextChange = useCallback((text: string) => {
    setRawText(text);
    setRows(text.trim() ? parseBulkText(text) : []);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = (evt.target?.result as string) ?? '';
      handleTextChange(content);
    };
    reader.readAsText(file, 'utf-8');
    // Reset so the same file can be re-uploaded
    e.target.value = '';
  };

  /* ── Inline row editing ─────────────────────────────────────── */

  const updateRow = (
    id: string,
    field: 'name' | 'qtyRaw' | 'unit' | 'priceRaw',
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated: ParsedRow = { ...row, [field]: value };
        if (field === 'name') {
          updated.nameError = !value.trim();
        }
        if (field === 'qtyRaw') {
          const parsed = parseDecimal(value);
          updated.qty = parsed;
          updated.qtyError = value.trim() !== '' && parsed === null;
        }
        if (field === 'priceRaw') {
          const parsed = parseDecimal(value);
          updated.price = parsed;
          updated.priceError = !value.trim() || parsed === null;
        }
        return updated;
      })
    );
  };

  /* ── Confirm / close ────────────────────────────────────────── */

  const reset = () => {
    setRawText('');
    setRows([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    const items = parsedRowsToLineItems(rows);
    if (!items.length) return;
    onAdd(items as LineItem[]);
    reset();
    onClose();
  };

  /* ── Derived counts ─────────────────────────────────────────── */

  const validCount = rows.filter(
    (r) => !r.nameError && !r.qtyError && !r.priceError
  ).length;
  const errorCount = rows.length - validCount;

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>Dodaj wiele pozycji</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4">
          {/* ── Paste / file input ──────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Wklej pozycje</Label>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs gap-1.5"
              >
                <Upload className="h-3 w-3" />
                Wczytaj CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
                aria-label="Wczytaj plik CSV"
              />
            </div>

            <Textarea
              placeholder={
                'Wklej pozycje, np.:\nKafelkowanie ściany | 10 | m² | 150\nMontaż kabiny | 1 | szt | 800\n\nObsługiwane separatory: | (pipe)  tabulator  przecinek\nDozwolony nagłówek: Nazwa | Ilość | Jedn. | Cena'
              }
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="font-mono text-sm min-h-[128px] resize-y"
              data-testid="bulk-paste-textarea"
            />

            <p className="text-xs text-muted-foreground">
              Format: <span className="font-mono">Nazwa | ilość | jednostka | cena</span>
              &nbsp;— lub wczytaj plik CSV
            </p>
          </div>

          {/* ── Preview table ────────────────────────────────── */}
          {rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <Label className="text-sm font-medium">
                  Podgląd ({rows.length} {rows.length === 1 ? 'wiersz' : 'wierszy'})
                </Label>
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {errorCount}{' '}
                    {errorCount === 1 ? 'wiersz z błędem' : 'wiersze z błędami'} — zostaną pominięte
                  </span>
                )}
              </div>

              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[1fr_72px_68px_92px] gap-1.5 px-1 text-xs font-medium text-muted-foreground">
                <span>Nazwa</span>
                <span>Ilość</span>
                <span>Jedn.</span>
                <span className="text-right">Cena netto</span>
              </div>

              {/* Rows */}
              <div
                className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1"
                data-testid="bulk-preview-rows"
              >
                {rows.map((row) => {
                  const hasError = row.nameError || row.qtyError || row.priceError;
                  return (
                    <div
                      key={row.id}
                      className={`grid sm:grid-cols-[1fr_72px_68px_92px] grid-cols-[1fr_68px] gap-1.5 items-center p-1.5 rounded-md ${
                        hasError
                          ? 'bg-destructive/5 ring-1 ring-destructive/20'
                          : 'bg-muted/40'
                      }`}
                      data-testid="bulk-preview-row"
                    >
                      {/* Name */}
                      <Input
                        value={row.name}
                        onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                        className={`h-8 text-sm ${row.nameError ? 'border-destructive' : ''}`}
                        placeholder="Nazwa pozycji"
                        aria-label="Nazwa pozycji"
                        aria-invalid={row.nameError}
                      />

                      {/* Qty */}
                      <Input
                        value={row.qtyRaw}
                        onChange={(e) => updateRow(row.id, 'qtyRaw', e.target.value)}
                        className={`h-8 text-sm text-right ${row.qtyError ? 'border-destructive' : ''}`}
                        inputMode="decimal"
                        aria-label="Ilość"
                        aria-invalid={row.qtyError}
                      />

                      {/* Unit + Price — appear below name on mobile */}
                      <div className="sm:contents grid grid-cols-2 col-span-2 gap-1.5">
                        <Input
                          value={row.unit}
                          onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                          className="h-8 text-sm"
                          placeholder="szt"
                          aria-label="Jednostka"
                        />

                        <div className="relative">
                          <Input
                            value={row.priceRaw}
                            onChange={(e) =>
                              updateRow(row.id, 'priceRaw', e.target.value)
                            }
                            className={`h-8 text-sm text-right pr-6 ${
                              row.priceError ? 'border-destructive' : ''
                            }`}
                            inputMode="decimal"
                            aria-label="Cena netto"
                            aria-invalid={row.priceError}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            zł
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t gap-2">
          <Button variant="outline" onClick={handleClose}>
            Anuluj
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={validCount === 0}
            data-testid="bulk-confirm-btn"
          >
            Dodaj {validCount > 0 ? countLabel(validCount) : 'pozycje'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
