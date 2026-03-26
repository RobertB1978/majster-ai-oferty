/**
 * Utility for parsing bulk text input into LineItem-compatible rows.
 * Supports pipe (|), tab (\t), and comma (,) delimiters.
 * Auto-detects delimiter and optionally skips header rows.
 *
 * Supported input formats:
 *   "Name | qty | unit | unitPrice"  per line  (pipe-separated)
 *   "Name\tqty\tunit\tunitPrice"     per line  (tab-separated, Excel copy-paste)
 *   "Name,qty,unit,unitPrice"        per line  (CSV, with optional header row)
 *
 * Column counts handled:
 *   4 cols: name | qty | unit | price
 *   3 cols: name | qty | price         (unit defaults to 'szt')
 *   2 cols: name | price               (qty defaults to 1, unit to 'szt')
 */

import { parseDecimal } from './numberParsing';

export interface ParsedRow {
  id: string;
  name: string;
  qtyRaw: string;
  unit: string;
  priceRaw: string;
  qty: number | null;
  price: number | null;
  nameError: boolean;
  qtyError: boolean;
  priceError: boolean;
}

export interface BulkLineItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
}

/** Detect the most likely column delimiter from up to 5 sample lines. */
export function detectDelimiter(text: string): '|' | '\t' | ',' {
  const lines = text.split('\n').filter((l) => l.trim()).slice(0, 5);
  if (!lines.length) return ',';

  let pipes = 0;
  let tabs = 0;
  let commas = 0;

  for (const line of lines) {
    pipes += (line.match(/\|/g) ?? []).length;
    tabs += (line.match(/\t/g) ?? []).length;
    commas += (line.match(/,/g) ?? []).length;
  }

  // Tab wins when present (Excel copy-paste is the most common source)
  if (tabs > 0 && tabs >= pipes && tabs >= commas) return '\t';
  if (pipes > 0 && pipes >= commas) return '|';
  return ',';
}

/** Returns true when a row looks like a header (non-numeric qty AND price columns). */
function isHeaderRow(parts: string[]): boolean {
  if (parts.length < 2) return false;
  // For 4-col: qty=parts[1], price=parts[3]; for 3-col: qty=parts[1], price=parts[2]
  const qtyPart = parts[1]?.trim() ?? '';
  const pricePart = (parts.length >= 4 ? parts[3] : parts[2])?.trim() ?? '';
  return parseDecimal(qtyPart) === null && parseDecimal(pricePart) === null;
}

/** Parse raw text into editable preview rows. */
export function parseBulkText(text: string): ParsedRow[] {
  const delimiter = detectDelimiter(text);
  const lines = text.split('\n').filter((l) => l.trim());

  if (!lines.length) return [];

  // Skip header row if detected
  const firstParts = lines[0].split(delimiter).map((p) => p.trim());
  const startIdx = isHeaderRow(firstParts) ? 1 : 0;

  return lines.slice(startIdx).map((line) => {
    const parts = line.split(delimiter).map((p) => p.trim());
    const colCount = parts.length;

    let name = '';
    let qtyRaw = '';
    let unit = 'szt';
    let priceRaw = '';

    if (colCount >= 4) {
      // name | qty | unit | price
      name = parts[0] ?? '';
      qtyRaw = parts[1] ?? '';
      unit = parts[2] || 'szt';
      priceRaw = parts[3] ?? '';
    } else if (colCount === 3) {
      // name | qty | price  (unit omitted → default 'szt')
      name = parts[0] ?? '';
      qtyRaw = parts[1] ?? '';
      priceRaw = parts[2] ?? '';
    } else if (colCount === 2) {
      // name | price  (qty omitted → default 1)
      name = parts[0] ?? '';
      qtyRaw = '1';
      priceRaw = parts[1] ?? '';
    } else {
      // name only — price missing → will trigger error
      name = parts[0] ?? '';
      qtyRaw = '1';
    }

    const qty = parseDecimal(qtyRaw);
    const price = parseDecimal(priceRaw);

    return {
      id: crypto.randomUUID(),
      name,
      qtyRaw: qtyRaw || '1',
      unit,
      priceRaw,
      qty,
      price,
      nameError: !name.trim(),
      qtyError: qtyRaw.trim() !== '' && qty === null,
      priceError: !priceRaw.trim() || price === null,
    };
  });
}

/** Convert parsed rows to line items, silently skipping rows that still have errors. */
export function parsedRowsToLineItems(rows: ParsedRow[]): BulkLineItem[] {
  return rows
    .filter((r) => !r.nameError && !r.qtyError && !r.priceError)
    .map((r) => ({
      id: crypto.randomUUID(),
      name: r.name,
      qty: r.qty ?? 1,
      unit: r.unit || 'szt',
      price: r.price ?? 0,
    }));
}
