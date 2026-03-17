/**
 * reality_check.test.mjs
 * Unit tests for pure logic functions in supabase_reality_check.mjs.
 *
 * Uruchomienie: node --test scripts/verify/reality_check.test.mjs
 *
 * Wymagania Node 20 native test runner.
 * Testy NIE wymagają połączenia z Supabase ani dostępności env vars.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  compareTable,
  deriveOverallStatus,
  deriveExitCode,
  checkMissingEnvVars,
} from './supabase_reality_check.mjs';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const expectedOffers = {
  name: 'offers',
  required_columns: ['id', 'user_id', 'status', 'total_net', 'created_at'],
  rls_required: true,
};

const expectedPlanLimits = {
  name: 'plan_limits',
  required_columns: ['plan_id', 'max_projects', 'max_clients', 'max_offers'],
  rls_required: true,
};

const expectedClients = {
  name: 'clients',
  required_columns: ['id', 'user_id', 'name', 'created_at'],
  rls_required: true,
};

// ── compareTable tests ────────────────────────────────────────────────────────

describe('compareTable', () => {
  it('tabela istnieje w schema i expected → EXISTS', () => {
    const actualColumns = ['id', 'user_id', 'status', 'total_net', 'created_at', 'updated_at'];
    const result = compareTable(actualColumns, expectedOffers, null);

    assert.equal(result.name, 'offers');
    assert.equal(result.status, 'EXISTS');
    assert.deepEqual(result.missingColumns, []);
    // rls_required=true + rlsEnabled=null → rlsStatus='UNKNOWN' → severity='P2'
    assert.equal(result.rlsStatus, 'UNKNOWN');
    assert.equal(result.severity, 'P2');
  });

  it('tabela jest w expected, ale brak jej w schema → MISSING', () => {
    const result = compareTable(null, expectedOffers, null);

    assert.equal(result.name, 'offers');
    assert.equal(result.status, 'MISSING');
    assert.deepEqual(result.missingColumns, expectedOffers.required_columns);
    assert.equal(result.severity, 'P0');
  });

  it('tabela istnieje, ale brakuje wymaganej kolumny → PARTIAL + P0', () => {
    // Brak kolumny 'total_net'
    const actualColumns = ['id', 'user_id', 'status', 'created_at'];
    const result = compareTable(actualColumns, expectedOffers, null);

    assert.equal(result.status, 'PARTIAL');
    assert.deepEqual(result.missingColumns, ['total_net']);
    assert.equal(result.severity, 'P0');
  });

  it('tabela istnieje, brakuje wielu kolumn → PARTIAL + P0 ze wszystkimi brakującymi', () => {
    const actualColumns = ['id'];
    const result = compareTable(actualColumns, expectedOffers, null);

    assert.equal(result.status, 'PARTIAL');
    assert.equal(result.missingColumns.length, 4);
    assert.ok(result.missingColumns.includes('user_id'));
    assert.ok(result.missingColumns.includes('status'));
    assert.ok(result.missingColumns.includes('total_net'));
    assert.ok(result.missingColumns.includes('created_at'));
    assert.equal(result.severity, 'P0');
  });

  it('RLS wymagane, ale wyłączone → RLS_OFF + P1', () => {
    const actualColumns = ['id', 'user_id', 'status', 'total_net', 'created_at'];
    // rlsEnabled = false (symulacja RLS wyłączonego)
    const result = compareTable(actualColumns, expectedOffers, false);

    assert.equal(result.status, 'EXISTS');
    assert.equal(result.rlsStatus, 'RLS_OFF');
    assert.equal(result.severity, 'P1');
  });

  it('RLS wymagane i włączone → VERIFIED_ON, brak severity', () => {
    const actualColumns = ['id', 'user_id', 'status', 'total_net', 'created_at'];
    const result = compareTable(actualColumns, expectedOffers, true);

    assert.equal(result.status, 'EXISTS');
    assert.equal(result.rlsStatus, 'VERIFIED_ON');
    assert.equal(result.severity, null);
  });

  it('RLS wymagane, rlsEnabled=null → UNKNOWN + P2', () => {
    const actualColumns = ['id', 'user_id', 'status', 'total_net', 'created_at'];
    const result = compareTable(actualColumns, expectedOffers, null);

    assert.equal(result.rlsStatus, 'UNKNOWN');
    assert.equal(result.severity, 'P2');
  });

  it('rls_required=false, tabela EXISTS → rlsStatus N/A, severity null', () => {
    const expectedNoRls = { ...expectedOffers, rls_required: false };
    const actualColumns = ['id', 'user_id', 'status', 'total_net', 'created_at'];
    const result = compareTable(actualColumns, expectedNoRls, null);

    assert.equal(result.status, 'EXISTS');
    assert.equal(result.rlsStatus, 'N/A');
    assert.equal(result.severity, null);
  });

  it('kolumny z dodatkowym polem nie generują błędu — weryfikujemy tylko required', () => {
    // Baza może mieć więcej kolumn niż w kontrakcie — to jest OK
    const actualColumns = [
      'id', 'user_id', 'status', 'total_net', 'created_at',
      'extra_column_1', 'extra_column_2',
    ];
    const result = compareTable(actualColumns, expectedOffers, null);

    assert.equal(result.status, 'EXISTS');
    assert.deepEqual(result.missingColumns, []);
  });

  it('pusta lista kolumn → wszystkie required columns brakują → PARTIAL + P0', () => {
    const result = compareTable([], expectedPlanLimits, null);

    assert.equal(result.status, 'PARTIAL');
    assert.equal(result.missingColumns.length, 4);
    assert.equal(result.severity, 'P0');
  });
});

// ── deriveOverallStatus tests ─────────────────────────────────────────────────

describe('deriveOverallStatus', () => {
  it('wszystkie tabele EXISTS → overall PASS', () => {
    const results = [
      { name: 'offers', status: 'EXISTS', missingColumns: [], rlsStatus: 'UNKNOWN', severity: 'P2' },
      { name: 'clients', status: 'EXISTS', missingColumns: [], rlsStatus: 'UNKNOWN', severity: 'P2' },
      { name: 'v2_projects', status: 'EXISTS', missingColumns: [], rlsStatus: 'UNKNOWN', severity: 'P2' },
    ];
    const status = deriveOverallStatus(results, false);
    assert.equal(status, 'PASS');
  });

  it('jedna tabela MISSING (P0) → overall FAIL', () => {
    const results = [
      { name: 'offers', status: 'EXISTS', missingColumns: [], rlsStatus: 'VERIFIED_ON', severity: null },
      { name: 'clients', status: 'MISSING', missingColumns: ['id', 'user_id'], rlsStatus: 'UNKNOWN', severity: 'P0' },
    ];
    const status = deriveOverallStatus(results, false);
    assert.equal(status, 'FAIL');
  });

  it('jedna tabela PARTIAL (P0) → overall FAIL', () => {
    const results = [
      { name: 'offers', status: 'EXISTS', missingColumns: [], rlsStatus: 'VERIFIED_ON', severity: null },
      { name: 'clients', status: 'PARTIAL', missingColumns: ['name'], rlsStatus: 'UNKNOWN', severity: 'P0' },
    ];
    const status = deriveOverallStatus(results, false);
    assert.equal(status, 'FAIL');
  });

  it('tabela z RLS_OFF (P1) → overall PARTIAL', () => {
    const results = [
      { name: 'offers', status: 'EXISTS', missingColumns: [], rlsStatus: 'RLS_OFF', severity: 'P1' },
      { name: 'clients', status: 'EXISTS', missingColumns: [], rlsStatus: 'VERIFIED_ON', severity: null },
    ];
    const status = deriveOverallStatus(results, false);
    assert.equal(status, 'PARTIAL');
  });

  it('introspekcja niedostępna → UNKNOWN', () => {
    const status = deriveOverallStatus([], true);
    assert.equal(status, 'UNKNOWN');
  });

  it('introspectionFailed=true ignoruje wyniki tabel → UNKNOWN', () => {
    const results = [
      { name: 'offers', status: 'MISSING', missingColumns: [], rlsStatus: 'UNKNOWN', severity: 'P0' },
    ];
    const status = deriveOverallStatus(results, true);
    assert.equal(status, 'UNKNOWN');
  });

  it('P0 ma wyższy priorytet niż P1 → FAIL', () => {
    const results = [
      { name: 'offers', status: 'MISSING', missingColumns: ['id'], rlsStatus: 'UNKNOWN', severity: 'P0' },
      { name: 'clients', status: 'EXISTS', missingColumns: [], rlsStatus: 'RLS_OFF', severity: 'P1' },
    ];
    const status = deriveOverallStatus(results, false);
    assert.equal(status, 'FAIL');
  });

  it('pusta lista tabel → PASS (nic nie sprawdzamy → brak błędów)', () => {
    const status = deriveOverallStatus([], false);
    assert.equal(status, 'PASS');
  });
});

// ── deriveExitCode tests ──────────────────────────────────────────────────────

describe('deriveExitCode', () => {
  it('PASS → exit code 0', () => {
    assert.equal(deriveExitCode('PASS'), 0);
  });

  it('UNKNOWN → exit code 0', () => {
    assert.equal(deriveExitCode('UNKNOWN'), 0);
  });

  it('PARTIAL → exit code 0', () => {
    assert.equal(deriveExitCode('PARTIAL'), 0);
  });

  it('FAIL → exit code 1 (P0)', () => {
    assert.equal(deriveExitCode('FAIL'), 1);
  });
});

// ── Integration-style: all EXISTS → PASS, exit 0 ─────────────────────────────

describe('scenario: wszystkie tabele EXISTS', () => {
  it('overall PASS + exit code 0', () => {
    const allExistsResults = [
      expectedOffers,
      expectedPlanLimits,
      expectedClients,
    ].map((expected) => {
      const columns = [...expected.required_columns, 'extra_col'];
      return compareTable(columns, expected, null);
    });

    const overall = deriveOverallStatus(allExistsResults, false);
    const code = deriveExitCode(overall);

    assert.equal(overall, 'PASS');
    assert.equal(code, 0);
  });
});

// ── Integration-style: jedna tabela MISSING → FAIL, exit 1 ───────────────────

describe('scenario: jedna tabela MISSING (P0)', () => {
  it('overall FAIL + exit code 1', () => {
    const results = [
      compareTable(['id', 'user_id', 'status', 'total_net', 'created_at'], expectedOffers, null),
      compareTable(null, expectedClients, null), // MISSING
    ];

    const overall = deriveOverallStatus(results, false);
    const code = deriveExitCode(overall);

    assert.equal(overall, 'FAIL');
    assert.equal(code, 1);
  });
});

// ── Integration-style: introspekcja niedostępna → UNKNOWN, exit 0 ─────────────

describe('scenario: introspekcja niedostępna', () => {
  it('UNKNOWN + exit code 0 + brak wyjątku', () => {
    let caught = null;
    let overall;
    let code;

    try {
      overall = deriveOverallStatus([], true);
      code = deriveExitCode(overall);
    } catch (err) {
      caught = err;
    }

    assert.equal(caught, null, 'Nie powinno rzucać wyjątku');
    assert.equal(overall, 'UNKNOWN');
    assert.equal(code, 0);
  });
});

// ── scenario: brak env → czytelny błąd, exit code 1, brak wycieku sekretów ──
// Testuje czystą funkcję checkMissingEnvVars (nie wywołuje process.exit).
// Weryfikuje: zwraca nazwy brakujących zmiennych, nigdy wartości sekretów.

describe('scenario: brak env', () => {
  const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

  it('oba brakują → zwraca obie nazwy', () => {
    const missing = checkMissingEnvVars({}, REQUIRED);
    assert.deepEqual(missing, ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  });

  it('tylko SUPABASE_URL brakuje → zwraca jedną nazwę', () => {
    const missing = checkMissingEnvVars(
      { SUPABASE_SERVICE_ROLE_KEY: 'secret-value' },
      REQUIRED,
    );
    assert.deepEqual(missing, ['SUPABASE_URL']);
  });

  it('tylko SUPABASE_SERVICE_ROLE_KEY brakuje → zwraca jedną nazwę', () => {
    const missing = checkMissingEnvVars(
      { SUPABASE_URL: 'https://proj.supabase.co' },
      REQUIRED,
    );
    assert.deepEqual(missing, ['SUPABASE_SERVICE_ROLE_KEY']);
  });

  it('wszystkie dostępne → zwraca pustą listę (brak błędu)', () => {
    const missing = checkMissingEnvVars(
      { SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'secret-value' },
      REQUIRED,
    );
    assert.deepEqual(missing, []);
  });

  it('wynik zawiera tylko NAZWY zmiennych, nigdy wartości sekretów', () => {
    const secretValue = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.super-secret';
    const missing = checkMissingEnvVars(
      { SUPABASE_URL: 'https://proj.supabase.co' },
      REQUIRED,
    );
    // Wynik to lista nazw — żadna wartość klucza nie może się w niej znaleźć
    for (const item of missing) {
      assert.ok(
        !item.includes(secretValue),
        `Wyciek wartości sekretu w wynikach: "${item}"`,
      );
      // Nazwa zmiennej musi być jednym ze znanych wymaganych kluczy
      assert.ok(
        REQUIRED.includes(item),
        `Nieoczekiwany element w liście brakujących: "${item}"`,
      );
    }
  });

  it('brak missing → exit code byłby 0 (brak błędu)', () => {
    const missing = checkMissingEnvVars(
      { SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'key' },
      REQUIRED,
    );
    // Gdy missing jest puste — warunek "missing.length > 0" jest false → process.exit(1) nie zostanie wywołany
    assert.equal(missing.length > 0, false);
  });

  it('brak env → exit code byłby 1 (missing.length > 0)', () => {
    const missing = checkMissingEnvVars({}, REQUIRED);
    // Gdy missing nie jest puste — process.exit(1) zostanie wywołany
    assert.equal(missing.length > 0, true);
  });
});
