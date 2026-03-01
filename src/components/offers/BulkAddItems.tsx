/**
 * BulkAddItems — PR-12
 *
 * Dialog that allows the user to quickly add multiple offer_items via:
 *  1. Paste mode: text area, one item per line "name; qty; unit; unit_price"
 *  2. CSV upload: same column format
 *
 * Shows a preview table with per-row validation before saving.
 * On confirm, calls onAdd(items) — parent inserts into wizard state.
 *
 * All strings i18n (bulkAdd.*).
 * Works with FF_NEW_SHELL ON/OFF.
 */

import { useState, useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { WizardItem, ItemType } from '@/hooks/useOfferWizard';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedRow {
  name: string;
  qty: number;
  unit: string;
  unit_price_net: number;
  error: string | null;
}

interface Props {
  onAdd: (items: WizardItem[]) => void;
}

// ── Parser ────────────────────────────────────────────────────────────────────

function parseLine(raw: string, t: (key: string) => string): ParsedRow {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { name: '', qty: 0, unit: '', unit_price_net: 0, error: t('bulkAdd.errorEmpty') };
  }

  // Support both semicolons and commas as delimiters
  const sep = trimmed.includes(';') ? ';' : ',';
  const parts = trimmed.split(sep).map((p) => p.trim());

  const name = parts[0] ?? '';
  if (!name) {
    return { name: '', qty: 0, unit: '', unit_price_net: 0, error: t('bulkAdd.errorNoName') };
  }

  const qty = parseFloat(parts[1] ?? '1');
  if (isNaN(qty) || qty <= 0) {
    return { name, qty: 0, unit: '', unit_price_net: 0, error: t('bulkAdd.errorInvalidQty') };
  }

  const unit = parts[2] ?? 'szt';
  const priceRaw = (parts[3] ?? '0').replace(',', '.');
  const unit_price_net = parseFloat(priceRaw);
  if (isNaN(unit_price_net) || unit_price_net < 0) {
    return { name, qty, unit, unit_price_net: 0, error: t('bulkAdd.errorInvalidPrice') };
  }

  return { name, qty, unit, unit_price_net, error: null };
}

function parseText(text: string, t: (key: string) => string): ParsedRow[] {
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => parseLine(l, t));
}

function parsedToWizardItem(row: ParsedRow): WizardItem {
  return {
    localId: crypto.randomUUID(),
    dbId: null,
    name: row.name,
    unit: row.unit,
    qty: row.qty,
    unit_price_net: row.unit_price_net,
    vat_rate: null,
    item_type: 'labor' as ItemType,
  };
}

// ── Preview Table ─────────────────────────────────────────────────────────────

function PreviewTable({ rows }: { rows: ParsedRow[] }) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border px-2 py-1.5 text-left">{t('bulkAdd.previewName')}</th>
            <th className="border border-border px-2 py-1.5 text-right w-14">{t('bulkAdd.previewQty')}</th>
            <th className="border border-border px-2 py-1.5 text-center w-14">{t('bulkAdd.previewUnit')}</th>
            <th className="border border-border px-2 py-1.5 text-right w-20">{t('bulkAdd.previewPrice')}</th>
            <th className="border border-border px-2 py-1.5 text-center w-16">{t('bulkAdd.previewStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={row.error ? 'bg-red-50 dark:bg-red-900/10' : ''}>
              <td className="border border-border px-2 py-1.5">{row.name || '—'}</td>
              <td className="border border-border px-2 py-1.5 text-right">{row.error ? '—' : row.qty}</td>
              <td className="border border-border px-2 py-1.5 text-center">{row.error ? '—' : row.unit}</td>
              <td className="border border-border px-2 py-1.5 text-right">
                {row.error ? '—' : row.unit_price_net}
              </td>
              <td className="border border-border px-2 py-1.5 text-center">
                {row.error ? (
                  <span className="flex items-center justify-center gap-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {row.error}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('bulkAdd.statusOk')}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BulkAddItems({ onAdd }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'paste' | 'csv'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => !r.error);

  const handleParse = () => {
    const parsed = parseText(pasteText, t);
    setRows(parsed);
    setParsed(true);
  };

  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseText(text, t);
      setRows(parsed);
      setParsed(true);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleAdd = () => {
    if (validRows.length === 0) return;
    const items = validRows.map(parsedToWizardItem);
    onAdd(items);
    setOpen(false);
    setPasteText('');
    setRows([]);
    setParsed(false);
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setPasteText('');
      setRows([]);
      setParsed(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <List className="h-4 w-4" />
        {t('bulkAdd.triggerBtn')}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('bulkAdd.dialogTitle')}</DialogTitle>
            <DialogDescription>{t('bulkAdd.dialogDesc')}</DialogDescription>
          </DialogHeader>

          {/* Mode tabs */}
          <div className="flex gap-1 rounded-md border border-border p-1 bg-muted/40">
            <button
              type="button"
              onClick={() => { setMode('paste'); setRows([]); setParsed(false); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                mode === 'paste'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
              {t('bulkAdd.pasteTab')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('csv'); setRows([]); setParsed(false); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                mode === 'csv'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Upload className="h-4 w-4" />
              {t('bulkAdd.csvTab')}
            </button>
          </div>

          {/* Input area */}
          {mode === 'paste' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('bulkAdd.pasteLabel')}</label>
              <Textarea
                value={pasteText}
                onChange={(e) => { setPasteText(e.target.value); setParsed(false); }}
                placeholder={t('bulkAdd.pastePlaceholder')}
                rows={6}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleParse}
                disabled={!pasteText.trim()}
              >
                {t('bulkAdd.parseBtn')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('bulkAdd.csvLabel')}</label>
              <p className="text-xs text-muted-foreground">{t('bulkAdd.csvHint')}</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleCsvUpload}
                className="block text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded file:border file:text-sm file:font-medium cursor-pointer"
              />
            </div>
          )}

          {/* Preview */}
          {parsed && rows.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {t('bulkAdd.previewTitle', { count: rows.length })}
              </p>
              <PreviewTable rows={rows} />
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t('bulkAdd.cancelBtn')}
            </Button>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!parsed || validRows.length === 0}
            >
              {t('bulkAdd.addBtn', { count: validRows.length })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
