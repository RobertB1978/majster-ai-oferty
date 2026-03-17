# Supabase Reality Check — Phase 1

## Cel

Moduł "Supabase Reality Check" weryfikuje **rzeczywisty stan produkcyjnego Supabase** po każdym deployu i porównuje go z oczekiwanym kontraktem (`scripts/verify/expected-schema.json`).

Odpowiada na pytanie: **"Czy baza danych faktycznie zawiera to, czego aplikacja potrzebuje?"**

## Pliki modułu

| Plik | Rola |
|------|------|
| `scripts/verify/expected-schema.json` | Kontrakt: lista tabel + wymaganych kolumn + czy RLS wymagany |
| `scripts/verify/supabase_reality_check.mjs` | Główny engine: introspekcja + porównanie + generowanie raportów |
| `scripts/verify/render_reality_report.mjs` | Czysta funkcja: JSON → Markdown |
| `scripts/verify/reality_check.test.mjs` | Unit testy czystej logiki (bez połączenia z Supabase) |
| `scripts/verify/reality-report.json` | Wynik ostatniego runu (generowany, nie commitowany) |
| `scripts/verify/reality-report.md` | Wynik w Markdown (generowany, nie commitowany) |

---

## Uruchomienie lokalne

### Wymagania

- Node.js 20+
- Dostęp do produkcyjnego Supabase (env vars)

### Konfiguracja env

```bash
export SUPABASE_URL="https://twoj-projekt.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."  # service_role key z Supabase Dashboard
```

**⚠️ NIGDY nie commituj wartości kluczy. Tylko nazwy zmiennych są bezpieczne w logach.**

### Uruchomienie

```bash
node scripts/verify/supabase_reality_check.mjs
```

Skrypt wygeneruje:
- `scripts/verify/reality-report.json`
- `scripts/verify/reality-report.md`

I emituje w logu: `REALITY_CHECK: PASS / PARTIAL / FAIL / UNKNOWN`

### Uruchomienie unit testów (bez połączenia z Supabase)

```bash
node --test scripts/verify/reality_check.test.mjs
```

---

## Jak czytać raport

### Plik JSON (`reality-report.json`)

```json
{
  "generatedAt": "2026-03-17T12:00:00.000Z",
  "supabaseUrl": "https://projekt.supabase.co",
  "overallStatus": "PASS",
  "exitCode": "0",
  "introspectionMethod": "postgrest-openapi-v2",
  "tables": [...],
  "unknownItems": [...],
  "ownerActions": [...]
}
```

### Pole `tables` — wyniki per tabela

Każda tabela ma:

```json
{
  "name": "offers",
  "status": "EXISTS",
  "missingColumns": [],
  "rlsStatus": "UNKNOWN",
  "severity": "P2"
}
```

---

## Statusy tabel

| Status | Znaczenie | Severity |
|--------|-----------|----------|
| `EXISTS` | Tabela istnieje, wszystkie wymagane kolumny obecne | null / P2 (jeśli RLS UNKNOWN) |
| `MISSING` | Tabela nie istnieje w schemacie | **P0** |
| `PARTIAL` | Tabela istnieje, ale brakuje wymaganych kolumn | **P0** |
| `RLS_OFF` | Tabela istnieje, kolumny OK, ale RLS jest wyłączone | **P1** |
| `UNKNOWN` | Nie udało się zweryfikować stanu | — |

---

## Statusy RLS

| Status RLS | Znaczenie |
|------------|-----------|
| `VERIFIED_ON` | RLS potwierdzone jako włączone |
| `RLS_OFF` | RLS potwierdzone jako wyłączone (P1) |
| `UNKNOWN` | Nie udało się zweryfikować (Phase 1 limitation) |
| `N/A` | RLS nie jest wymagane dla tej tabeli |

---

## Overall status — znaczenie

| Status | Znaczenie | Exit code |
|--------|-----------|-----------|
| `PASS` | Wszystkie tabele EXISTS, wszystkie kolumny OK | 0 |
| `PARTIAL` | Brak P0, ale są P1 (np. RLS_OFF) | 0 |
| `FAIL` | Wykryto P0 (brak tabeli lub brak wymaganej kolumny) | **1** |
| `UNKNOWN` | Introspekcja niedostępna lub częściowo niemożliwa | 0 |

### ⚠️ UNKNOWN ≠ PASS

Status `UNKNOWN` oznacza, że nie wszystkie wymagane weryfikacje zostały wykonane.
Nie jest to potwierdzenie poprawności — jest to **brak potwierdzenia**.

Sprawdź sekcję `unknownItems` w raporcie i wykonaj opisane owner actions.

---

## Severity model

| Severity | Trigger | Efekt na workflow |
|----------|---------|-------------------|
| **P0** | Brak tabeli (`MISSING`) lub brak wymaganej kolumny (`PARTIAL`) | ❌ Workflow FAIL |
| **P1** | RLS wyłączone (`RLS_OFF`) | ⚠️ Workflow kontynuuje (exit 0) |
| **P2** | UNKNOWN RLS lub inne nieskrytyczne | ℹ️ Notka w raporcie |

---

## Mechanizm introspekcji (Phase 1)

### Tabele i kolumny: PostgREST OpenAPI

Skrypt używa standardowego endpointu PostgREST:

```
GET ${SUPABASE_URL}/rest/v1/
Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}
```

Zwraca specyfikację OpenAPI 2.0 (Swagger) ze wszystkimi tabelami w schemacie `public` i ich kolumnami w `definitions.{tableName}.properties`.

Jest to **udokumentowane, stabilne zachowanie PostgREST** (nie hack).

### RLS: UNKNOWN w Phase 1

PostgREST + `service_role_key` nie ujawnia stanu `relrowsecurity` z `pg_catalog.pg_class`.
Weryfikacja RLS wymaga dodatkowego mechanizmu — patrz `REALITY_CHECK_RUNBOOK.md`.

---

## Jak dodać nową tabelę do weryfikacji

1. Zidentyfikuj tabelę w `supabase/migrations/` — **tylko potwierdzone tabele**.
2. Dodaj do `scripts/verify/expected-schema.json`:

```json
{
  "name": "nowa_tabela",
  "migration_source": "YYYYMMDDHHMMSS_opis.sql",
  "required_columns": ["id", "user_id", "created_at"],
  "rls_required": true,
  "notes": "Opis tabeli i jej kontekstu"
}
```

3. Uruchom lokalnie: `node scripts/verify/supabase_reality_check.mjs`
4. Upewnij się, że testy przechodzą: `node --test scripts/verify/reality_check.test.mjs`

**Nie dodawaj tabel, których nie ma w `supabase/migrations/` — zero zgadywania.**

---

## Powiązane dokumenty

- `docs/ops/REALITY_CHECK_RUNBOOK.md` — rollback, owner actions, sekrety
- `docs/DEPLOYMENT_TRUTH.md` — szerszy kontekst Deployment Truth Gate
- `.github/workflows/deployment-truth.yml` — CI konfiguracja
