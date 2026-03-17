/**
 * supabase_reality_check.mjs
 * Supabase Reality Check — Phase 1
 *
 * Weryfikuje rzeczywisty stan produkcyjnego Supabase po deployu:
 * - tabele (EXISTS / MISSING)
 * - kolumny (wszystkie wymagane kolumny są w tabeli)
 * - RLS (UNKNOWN w Phase 1 — patrz sekcja UNKNOWN niżej)
 *
 * Mechanizm introspekcji:
 *   Tabele + kolumny: PostgREST OpenAPI spec (GET /rest/v1/) — dokumentowane zachowanie PostgREST.
 *   RLS: UNKNOWN — PostgREST + service_role nie ujawnia stanu relrowsecurity.
 *        Pełna weryfikacja RLS wymaga SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF
 *        (patrz docs/ops/REALITY_CHECK_RUNBOOK.md → Owner Actions).
 *
 * Wymagane env:
 *   SUPABASE_URL            — URL projektu Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (NIGDY nie logowany)
 *
 * Generuje:
 *   scripts/verify/reality-report.json
 *   scripts/verify/reality-report.md
 *
 * Exit code:
 *   0 — PASS, UNKNOWN, PARTIAL
 *   1 — FAIL (P0: brak tabeli lub brak wymaganej kolumny)
 *
 * Node 20 ESM, bez ts-node, bez nowych zależności.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { renderReport } from './render_reality_report.mjs';

// ── Paths ───────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPECTED_SCHEMA_PATH = join(__dirname, 'expected-schema.json');
const REPORT_JSON_PATH = join(__dirname, 'reality-report.json');
const REPORT_MD_PATH = join(__dirname, 'reality-report.md');

// ── Pure logic (exported for unit tests) ────────────────────────────────────

/**
 * Porównuje faktyczny stan tabeli z oczekiwanym kontraktem.
 *
 * @param {string[]|null} actualColumns - Kolumny z PostgREST OpenAPI, lub null gdy tabela nie istnieje
 * @param {object} expectedTable        - Kontrakt z expected-schema.json
 * @param {boolean|null} rlsEnabled     - true/false gdy znany, null gdy UNKNOWN
 * @returns {{ name: string, status: string, missingColumns: string[], rlsStatus: string, severity: string|null }}
 */
export function compareTable(actualColumns, expectedTable, rlsEnabled = null) {
  const name = expectedTable.name;

  if (actualColumns === null) {
    return {
      name,
      status: 'MISSING',
      missingColumns: expectedTable.required_columns,
      rlsStatus: 'UNKNOWN',
      severity: 'P0',
    };
  }

  const missingColumns = expectedTable.required_columns.filter(
    (col) => !actualColumns.includes(col),
  );

  const structureStatus = missingColumns.length > 0 ? 'PARTIAL' : 'EXISTS';

  let rlsStatus;
  if (!expectedTable.rls_required) {
    rlsStatus = 'N/A';
  } else if (rlsEnabled === null) {
    rlsStatus = 'UNKNOWN';
  } else if (rlsEnabled === false) {
    rlsStatus = 'RLS_OFF';
  } else {
    rlsStatus = 'VERIFIED_ON';
  }

  let severity = null;
  if (structureStatus === 'MISSING' || structureStatus === 'PARTIAL') {
    severity = 'P0';
  } else if (rlsStatus === 'RLS_OFF') {
    severity = 'P1';
  } else if (rlsStatus === 'UNKNOWN' && expectedTable.rls_required) {
    severity = 'P2';
  }

  return {
    name,
    status: structureStatus,
    missingColumns,
    rlsStatus,
    severity,
  };
}

/**
 * Wyznacza status całościowy na podstawie wyników per tabela.
 *
 * @param {object[]} tableResults - Wyniki z compareTable()
 * @param {boolean} introspectionFailed - true gdy nie udało się połączyć z PostgREST
 * @returns {'PASS'|'PARTIAL'|'FAIL'|'UNKNOWN'}
 */
export function deriveOverallStatus(tableResults, introspectionFailed = false) {
  if (introspectionFailed) return 'UNKNOWN';

  const hasP0 = tableResults.some((r) => r.severity === 'P0');
  if (hasP0) return 'FAIL';

  const hasP1 = tableResults.some((r) => r.severity === 'P1');
  if (hasP1) return 'PARTIAL';

  return 'PASS';
}

/**
 * Wyznacza exit code.
 * 1 tylko dla FAIL (P0). Pozostałe statusy → 0.
 *
 * @param {'PASS'|'PARTIAL'|'FAIL'|'UNKNOWN'} overallStatus
 * @returns {0|1}
 */
export function deriveExitCode(overallStatus) {
  return overallStatus === 'FAIL' ? 1 : 0;
}

// ── PostgREST OpenAPI introspection ─────────────────────────────────────────

/**
 * Pobiera schemat tabel i kolumn z PostgREST OpenAPI spec.
 * Endpoint: GET ${supabaseUrl}/rest/v1/
 *
 * Mechanizm: Standardowy endpoint PostgREST (dokumentacja: https://postgrest.org).
 * Zwraca Swagger 2.0 spec z definitions zawierającymi nazwy tabel i ich kolumny.
 *
 * Ograniczenie: nie zawiera informacji o stanie RLS.
 * RLS wymaga bezpośredniego dostępu do pg_catalog lub Management API.
 *
 * @param {string} supabaseUrl
 * @param {string} serviceRoleKey — używany wyłącznie w nagłówku HTTP, nigdy logowany
 * @returns {{ success: boolean, tables?: Record<string, string[]>, error?: string }}
 */
async function fetchTablesFromOpenAPI(supabaseUrl, serviceRoleKey) {
  let response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/json',
      },
    });
  } catch (err) {
    return {
      success: false,
      error: `Network error reaching ${supabaseUrl}/rest/v1/ — ${err.message}`,
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error: `PostgREST OpenAPI returned HTTP ${response.status} for ${supabaseUrl}/rest/v1/`,
    };
  }

  let spec;
  try {
    spec = await response.json();
  } catch (err) {
    return {
      success: false,
      error: `Could not parse PostgREST OpenAPI response as JSON — ${err.message}`,
    };
  }

  // PostgREST Swagger 2.0: table schemas in spec.definitions
  const definitions = spec.definitions ?? {};
  const tables = {};
  for (const [tableName, tableDef] of Object.entries(definitions)) {
    const properties = tableDef.properties ?? {};
    tables[tableName] = Object.keys(properties);
  }

  return { success: true, tables };
}

// ── ENV validation ───────────────────────────────────────────────────────────

/**
 * Czysta funkcja: zwraca listę NAZW brakujących zmiennych środowiskowych.
 * Nigdy nie zwraca wartości sekretów — tylko nazwy.
 * Eksportowana dla testów jednostkowych.
 *
 * @param {Record<string, string|undefined>} env  - obiekt środowiska (np. process.env)
 * @param {string[]} required                     - lista wymaganych nazw
 * @returns {string[]} nazwy brakujących zmiennych
 */
export function checkMissingEnvVars(env, required) {
  return required.filter((name) => !env[name]);
}

function validateRequiredEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = checkMissingEnvVars(process.env, required);

  if (missing.length > 0) {
    // Logujemy tylko NAZWY brakujących zmiennych, nigdy wartości
    console.error('');
    console.error('❌ REALITY CHECK — brakujące wymagane zmienne środowiskowe:');
    for (const name of missing) {
      console.error(`   - ${name}`);
    }
    console.error('');
    console.error(
      'Dodaj te zmienne do GitHub Secrets i przekaż do step w deployment-truth.yml.',
    );
    console.error(
      'Patrz: docs/ops/REALITY_CHECK_RUNBOOK.md → "GitHub Secrets"',
    );
    console.error('');
    process.exit(1);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Supabase Reality Check — Phase 1');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // 1. Validate required env (exits with code 1 if missing, logs only names)
  validateRequiredEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  // Klucz używamy tylko do wywołań HTTP — nigdy go nie logujemy
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log('');

  // 2. Load expected schema contract
  let expectedSchema;
  try {
    expectedSchema = JSON.parse(readFileSync(EXPECTED_SCHEMA_PATH, 'utf8'));
  } catch (err) {
    console.error(`❌ Could not read expected-schema.json: ${err.message}`);
    process.exit(1);
  }

  const expectedTables = expectedSchema.tables ?? [];
  console.log(
    `📋 Kontrakt: ${expectedTables.length} tabel do weryfikacji: ${expectedTables.map((t) => t.name).join(', ')}`,
  );
  console.log('');

  // 3. Fetch actual schema from PostgREST OpenAPI
  console.log('🔍 Pobieranie schematu z PostgREST OpenAPI (/rest/v1/)...');
  const schemaResult = await fetchTablesFromOpenAPI(supabaseUrl, serviceRoleKey);

  let introspectionFailed = false;
  let actualTables = {};

  if (!schemaResult.success) {
    console.error(`⚠️  Introspekcja niedostępna: ${schemaResult.error}`);
    console.error(
      '   Wszystkie tabele zostaną oznaczone jako UNKNOWN (exit code 0).',
    );
    introspectionFailed = true;
  } else {
    actualTables = schemaResult.tables;
    console.log(
      `✅ PostgREST OpenAPI zwrócił ${Object.keys(actualTables).length} definicji tabel.`,
    );
  }
  console.log('');

  // 4. RLS: UNKNOWN w Phase 1 (PostgREST + service_role nie ujawnia relrowsecurity)
  // ──────────────────────────────────────────────────────────────────────────────
  // Pełna weryfikacja RLS wymaga jednego z:
  //   a) SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF → Supabase Management API
  //   b) DATABASE_URL → bezpośrednie połączenie z pg_catalog.pg_class
  // Żadna z tych metod nie jest dostępna wyłącznie przez SUPABASE_URL + service_role.
  // Phase 1 oznacza RLS jako UNKNOWN z owner action.
  // Patrz: docs/ops/REALITY_CHECK_RUNBOOK.md → "Owner Actions dla RLS"
  const rlsEnabled = null; // null = UNKNOWN

  // 5. Compare actual vs expected
  const tableResults = [];

  if (introspectionFailed) {
    for (const expectedTable of expectedTables) {
      tableResults.push({
        name: expectedTable.name,
        status: 'UNKNOWN',
        missingColumns: [],
        rlsStatus: 'UNKNOWN',
        severity: null,
      });
    }
  } else {
    for (const expectedTable of expectedTables) {
      const actualColumns = actualTables[expectedTable.name] ?? null;
      const result = compareTable(actualColumns, expectedTable, rlsEnabled);
      tableResults.push(result);
    }
  }

  // 6. Print per-table results
  console.log('📊 Wyniki per tabela:');
  console.log('');
  for (const r of tableResults) {
    const severityLabel = r.severity ? ` [${r.severity}]` : '';
    const missing =
      r.missingColumns.length > 0
        ? ` — brakuje kolumn: ${r.missingColumns.join(', ')}`
        : '';
    const rlsNote = ` | RLS: ${r.rlsStatus}`;
    console.log(
      `  ${r.status.padEnd(8)} ${r.name}${severityLabel}${missing}${rlsNote}`,
    );
  }
  console.log('');

  // 7. Derive overall status
  const overallStatus = deriveOverallStatus(tableResults, introspectionFailed);
  const exitCode = deriveExitCode(overallStatus);

  // 8. Build report object
  const unknownItems = [];
  unknownItems.push({
    area: 'RLS (Row Level Security) — wszystkie tabele',
    reason:
      'PostgREST + service_role_key nie ujawnia stanu relrowsecurity z pg_catalog.pg_class. ' +
      'Jest to ograniczenie architektury Phase 1, nie błąd konfiguracji.',
    ownerAction:
      'Dodaj SUPABASE_ACCESS_TOKEN i SUPABASE_PROJECT_REF do GitHub Secrets. ' +
      'Patrz: docs/ops/REALITY_CHECK_RUNBOOK.md → "Owner Actions dla RLS".',
  });

  const ownerActions = [
    'Dodaj `SUPABASE_SERVICE_ROLE_KEY` do GitHub Secrets (jeśli brak).',
    'Dla pełnej weryfikacji RLS: dodaj `SUPABASE_ACCESS_TOKEN` i `SUPABASE_PROJECT_REF` do GitHub Secrets.',
    'Szczegóły: docs/ops/REALITY_CHECK_RUNBOOK.md',
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    supabaseUrl,
    overallStatus,
    exitCode: String(exitCode),
    introspectionMethod: introspectionFailed
      ? 'FAILED'
      : 'postgrest-openapi-v2',
    rlsVerificationMethod: 'UNKNOWN — Phase 1 limitation (see unknownItems)',
    tables: tableResults,
    unknownItems,
    ownerActions,
  };

  // 9. Write reports
  try {
    writeFileSync(REPORT_JSON_PATH, JSON.stringify(report, null, 2), 'utf8');
    console.log(`📄 Raport JSON: ${REPORT_JSON_PATH}`);
  } catch (err) {
    console.error(`❌ Nie udało się zapisać reality-report.json: ${err.message}`);
    process.exit(1);
  }

  try {
    const markdown = renderReport(report);
    writeFileSync(REPORT_MD_PATH, markdown, 'utf8');
    console.log(`📄 Raport Markdown: ${REPORT_MD_PATH}`);
  } catch (err) {
    console.error(`❌ Nie udało się zapisać reality-report.md: ${err.message}`);
    process.exit(1);
  }

  console.log('');

  // 10. CI marker — single line, easily grep-able
  console.log(`REALITY_CHECK: ${overallStatus}`);
  console.log('');

  if (overallStatus === 'UNKNOWN') {
    console.log(
      '⚠️  Status UNKNOWN ≠ PASS. Pełna weryfikacja nie była możliwa.',
    );
    console.log(
      '   Sprawdź sekcję unknownItems w raporcie i wykonaj owner actions.',
    );
    console.log('');
  }

  if (exitCode === 1) {
    console.error(
      '❌ FAIL (P0) — wykryto krytyczne braki w schemacie bazy danych.',
    );
    console.error(
      '   Workflow powinien się zatrzymać. Sprawdź reality-report.json.',
    );
  } else {
    console.log('✅ Weryfikacja struktury schematu zakończona.');
  }

  console.log('');
  process.exit(exitCode);
}

// ── Entry point guard ────────────────────────────────────────────────────────
// Uruchamiamy main() tylko gdy plik jest bezpośrednio wywołany (nie importowany).
// W Node.js ESM: porównujemy import.meta.url z process.argv[1].
import { pathToFileURL } from 'node:url';

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
  main().catch((err) => {
    console.error('');
    console.error('❌ Nieoczekiwany błąd w supabase_reality_check.mjs:');
    console.error(`   ${err.message}`);
    console.error('');
    // Nie drukujemy stack trace w produkcji — może zawierać dane wrażliwe
    process.exit(1);
  });
}
