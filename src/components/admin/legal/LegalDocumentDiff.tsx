import type { LegalDocument } from '@/types/legal';

type DiffOp = 'equal' | 'insert' | 'delete';

interface DiffLine {
  op: DiffOp;
  text: string;
  lineA?: number;
  lineB?: number;
}

/**
 * Minimal LCS-based line diff.
 * Returns unified diff ops suitable for a split-view render.
 * No external dependencies. Exported for unit testing.
 */
export function computeLineDiff(textA: string, textB: string): DiffLine[] {
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const m = linesA.length;
  const n = linesB.length;

  // Build LCS table (length only)
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const result: DiffLine[] = [];
  let i = m;
  let j = n;
  let lineA = m;
  let lineB = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      result.push({ op: 'equal', text: linesA[i - 1], lineA: lineA--, lineB: lineB-- });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ op: 'insert', text: linesB[j - 1], lineB: lineB-- });
      j--;
    } else {
      result.push({ op: 'delete', text: linesA[i - 1], lineA: lineA-- });
      i--;
    }
  }

  return result.reverse();
}

const OP_STYLES: Record<DiffOp, string> = {
  equal:  'bg-transparent text-foreground',
  insert: 'bg-green-500/10 text-green-700 dark:text-green-400',
  delete: 'bg-red-500/10 text-red-700 dark:text-red-400 line-through',
};

const OP_GUTTER: Record<DiffOp, string> = {
  equal:  'text-muted-foreground/50',
  insert: 'text-green-600 dark:text-green-500 font-bold',
  delete: 'text-red-600 dark:text-red-500 font-bold',
};

const OP_SYMBOL: Record<DiffOp, string> = {
  equal:  ' ',
  insert: '+',
  delete: '−',
};

interface LegalDocumentDiffProps {
  published: LegalDocument | null;
  draft: LegalDocument;
}

export function LegalDocumentDiff({ published, draft }: LegalDocumentDiffProps) {
  if (!published) {
    return (
      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        Brak opublikowanej wersji dla tego slug+język. Diff nie jest dostępny — to będzie pierwsza
        publikacja dokumentu.
      </div>
    );
  }

  if (published.content === draft.content) {
    return (
      <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
        Treść szkicu jest identyczna z opublikowaną wersją. Brak różnic.
      </div>
    );
  }

  const lines = computeLineDiff(published.content, draft.content);

  const added   = lines.filter((l) => l.op === 'insert').length;
  const removed = lines.filter((l) => l.op === 'delete').length;

  return (
    <div className="flex flex-col gap-3">
      {/* summary bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Porównanie:{' '}
          <span className="font-medium text-foreground">v{published.version}</span> (opublikowany)
          {' → '}
          <span className="font-medium text-foreground">v{draft.version}</span> (szkic)
        </span>
        <span className="text-green-600 dark:text-green-400 font-medium">+{added} linii</span>
        <span className="text-red-600 dark:text-red-400 font-medium">−{removed} linii</span>
      </div>

      {/* unified diff */}
      <div className="rounded-md border overflow-auto max-h-[60vh] font-mono text-xs">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr
                key={idx}
                className={`${OP_STYLES[line.op]} border-b border-border/30 last:border-0`}
              >
                {/* gutter: line numbers */}
                <td className={`select-none px-2 py-0.5 text-right w-10 border-r border-border/30 ${OP_GUTTER[line.op]}`}>
                  {line.lineA ?? ''}
                </td>
                <td className={`select-none px-2 py-0.5 text-right w-10 border-r border-border/30 ${OP_GUTTER[line.op]}`}>
                  {line.lineB ?? ''}
                </td>
                {/* op symbol */}
                <td className={`select-none px-1.5 py-0.5 w-5 border-r border-border/30 ${OP_GUTTER[line.op]}`}>
                  {OP_SYMBOL[line.op]}
                </td>
                {/* content */}
                <td className="px-3 py-0.5 whitespace-pre-wrap break-all">
                  {line.text || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
