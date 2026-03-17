/**
 * render_reality_report.mjs
 * Pure function: renders a reality-report JSON object into a Markdown string.
 * No I/O, no env access, no side effects — safe to import in tests.
 *
 * @param {object} report - The structured report object produced by supabase_reality_check.mjs
 * @returns {string} Markdown report
 */

const STATUS_EMOJI = {
  EXISTS: '✅',
  MISSING: '❌',
  PARTIAL: '⚠️',
  RLS_OFF: '🔓',
  UNKNOWN: '❓',
  PASS: '✅',
  FAIL: '❌',
  VERIFIED_ON: '✅',
};

const SEVERITY_LABEL = {
  P0: '**P0 — CRITICAL**',
  P1: '**P1 — SECURITY**',
  P2: 'P2 — INFO',
  null: '—',
};

/**
 * @param {object} report
 * @param {string} report.generatedAt        - ISO timestamp
 * @param {string} report.supabaseUrl        - Supabase project URL (without key)
 * @param {string} report.overallStatus      - PASS | PARTIAL | FAIL | UNKNOWN
 * @param {string} report.exitCode           - "0" | "1"
 * @param {object[]} report.tables           - Per-table results
 * @param {object[]} report.unknownItems     - Items that could not be verified
 * @param {string[]} report.ownerActions     - Actions required from the owner
 * @returns {string}
 */
export function renderReport(report) {
  const lines = [];

  lines.push('# Supabase Reality Check Report');
  lines.push('');
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push(`**Supabase URL:** \`${report.supabaseUrl}\``);
  lines.push('');

  // ── Overall status banner ──────────────────────────────────────────────────
  const overallEmoji = STATUS_EMOJI[report.overallStatus] ?? '❓';
  lines.push(`## Overall Status: ${overallEmoji} ${report.overallStatus}`);
  lines.push('');

  if (report.overallStatus === 'UNKNOWN') {
    lines.push(
      '> ⚠️ **UWAGA:** Status `UNKNOWN` nie jest równoważny `PASS`. ' +
        'Nie wszystkie wymagane weryfikacje zostały zakończone pomyślnie. ' +
        'Patrz sekcja "Nierozwiązane UNKNOWN".',
    );
    lines.push('');
  }

  lines.push(`**Exit code:** \`${report.exitCode}\``);
  lines.push('');

  // ── Table results ─────────────────────────────────────────────────────────
  lines.push('## Wyniki per tabela');
  lines.push('');
  lines.push('| Tabela | Status | Severity | Brakujące kolumny | RLS |');
  lines.push('|--------|--------|----------|-------------------|-----|');

  for (const t of report.tables ?? []) {
    const emoji = STATUS_EMOJI[t.status] ?? '❓';
    const severity = SEVERITY_LABEL[t.severity] ?? '—';
    const missing = t.missingColumns?.length
      ? t.missingColumns.map((c) => `\`${c}\``).join(', ')
      : '—';
    const rlsEmoji = STATUS_EMOJI[t.rlsStatus] ?? '❓';
    const rlsLabel = `${rlsEmoji} ${t.rlsStatus}`;
    lines.push(
      `| \`${t.name}\` | ${emoji} ${t.status} | ${severity} | ${missing} | ${rlsLabel} |`,
    );
  }
  lines.push('');

  // ── Status legend ─────────────────────────────────────────────────────────
  lines.push('## Legenda statusów');
  lines.push('');
  lines.push('| Status | Znaczenie |');
  lines.push('|--------|-----------|');
  lines.push('| ✅ EXISTS | Tabela i wszystkie wymagane kolumny istnieją |');
  lines.push('| ❌ MISSING | Tabela nie istnieje w schemacie bazy |');
  lines.push(
    '| ⚠️ PARTIAL | Tabela istnieje, ale brakuje wymaganych kolumn |',
  );
  lines.push('| 🔓 RLS_OFF | Tabela istnieje, ale RLS jest wyłączone |');
  lines.push(
    '| ❓ UNKNOWN | Nie udało się potwierdzić — patrz sekcja Owner Actions |',
  );
  lines.push('');

  lines.push('## Severity model');
  lines.push('');
  lines.push(
    '- **P0 — CRITICAL**: Brak tabeli lub brak wymaganej kolumny. Aplikacja może nie działać. Workflow failuje.',
  );
  lines.push(
    '- **P1 — SECURITY**: RLS wyłączone na tabeli gdzie jest wymagane. Ryzyko bezpieczeństwa.',
  );
  lines.push('- **P2 — INFO**: Inne rozjazdy, metadata, pola niekrytyczne.');
  lines.push('');

  // ── UNKNOWN items ─────────────────────────────────────────────────────────
  if (report.unknownItems?.length) {
    lines.push('## ❓ Nierozwiązane UNKNOWN');
    lines.push('');
    lines.push(
      '> Poniższe elementy **nie mogły być zweryfikowane** w tej sesji. ' +
        'Status `UNKNOWN` ≠ `PASS`.',
    );
    lines.push('');

    for (const item of report.unknownItems) {
      lines.push(`### ${item.area}`);
      lines.push('');
      lines.push(`**Powód:** ${item.reason}`);
      lines.push('');
      if (item.ownerAction) {
        lines.push(`**Owner action wymagana:** ${item.ownerAction}`);
        lines.push('');
      }
    }
  }

  // ── Owner actions ─────────────────────────────────────────────────────────
  if (report.ownerActions?.length) {
    lines.push('## 🔧 Owner Actions');
    lines.push('');
    lines.push(
      'Poniższe działania właściciela projektu są wymagane dla pełnej weryfikacji:',
    );
    lines.push('');
    for (const action of report.ownerActions) {
      lines.push(`- ${action}`);
    }
    lines.push('');
  }

  // ── CI marker hint ────────────────────────────────────────────────────────
  lines.push('---');
  lines.push('');
  lines.push(
    `*REALITY_CHECK: ${report.overallStatus} — wygenerowano automatycznie przez scripts/verify/supabase_reality_check.mjs*`,
  );
  lines.push('');

  return lines.join('\n');
}
