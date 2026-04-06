# Tryb B — Fundament (PR-01)

## Kontekst

Majster.AI obsługuje dwa tryby generowania dokumentów:

- **Tryb A** (istniejący, PR-17): szablony jako kod (`src/data/documentTemplates.ts`),
  wypełnienie przez formularz, generowanie PDF przez jsPDF lub Edge Function.
  Instancje w tabeli `document_instances` z `source_mode = 'mode_a'`.

- **Tryb B** (nowy, PR-01+): master DOCX przechowywany przez admina w storage,
  kopia robocza tworzona per instancja, edycja przez użytkownika, renderowanie
  do finalnego PDF przez LibreOffice / Word. Instancje z `source_mode = 'mode_b'`.

PR-01 dostarcza **wyłącznie fundament danych i typy**. Pilot DOCX end-to-end
zaczyna się w **PR-02**.

---

## Model dokumentu w Trybie B

```
[document_master_templates]        ← nienaruszalny wzorzec (admin)
        │
        │ master_template_id FK
        ▼
[document_instances]               ← instancja per użytkownik/projekt
  source_mode = 'mode_b'
  file_docx   = ścieżka kopii roboczej DOCX
  pdf_path    = ścieżka finalnego PDF (po renderowaniu)
  status      = draft → ready → sent → final
```

### Etapy cyklu życia

| Status    | Znaczenie                                      | Pola zmieniane         |
|-----------|------------------------------------------------|------------------------|
| `draft`   | Użytkownik edytuje kopię roboczą DOCX          | `file_docx`, `edited_at` |
| `ready`   | Zatwierdzony i gotowy do wysłania              | `status`               |
| `sent`    | Wysłany do klienta (e-mail lub link)           | `sent_at`, `status`    |
| `final`   | Zaakceptowany przez klienta (nienaruszalny)    | `status`               |
| `archived`| Przeniesiony do archiwum (soft delete)         | `status`               |

---

## Nowe tabele (PR-01)

### `document_master_templates`

Rejestr master templates zarządzanych przez admina.

| Kolumna              | Typ                  | Znaczenie                                      |
|----------------------|----------------------|------------------------------------------------|
| `id`                 | uuid PK              | Identyfikator                                  |
| `template_key`       | text UNIQUE          | Stabilny klucz kodu (np. `contract_fixed_price_standard`) |
| `name`               | text                 | Czytelna nazwa (np. `Umowa o dzieło — standard`) |
| `category`           | text                 | Kategoria: CONTRACTS / PROTOCOLS / ANNEXES / COMPLIANCE / OTHER |
| `quality_tier`       | enum                 | Poziom: `short_form` / `standard` / `premium` |
| `docx_master_path`   | text NULL            | Ścieżka DOCX w bucket `document-masters` (NULL do PR-02) |
| `preview_pdf_path`   | text NULL            | Podgląd PDF w bibliotece (NULL do PR-02)       |
| `version`            | text                 | Wersja semantyczna, np. `1.0`                  |
| `is_active`          | boolean              | Soft delete / aktywacja                        |
| `created_at`         | timestamptz          | Czas utworzenia                                |
| `updated_at`         | timestamptz          | Czas ostatniej zmiany                          |

**RLS:** zalogowani użytkownicy mogą tylko czytać (`SELECT`) aktywne rekordy.
Zarządzanie wyłącznie przez `service_role` w Edge Functions (PR-02+).

### Enum `quality_tier`

Zdefiniowany jako typ Postgres (`CREATE TYPE public.quality_tier AS ENUM`):

- `short_form` — uproszczony wariant, mniej klauzul
- `standard` — pełna treść, typowy dla MŚP budowlanych
- `premium` — rozbudowany, rekomendowany dla kontraktów >50 000 PLN

---

## Rozszerzenie `document_instances` (PR-01)

Pola dodane addytywnie (wszystkie nullable dla backward-compat z Trybem A):

| Kolumna                   | Typ             | Default    | Znaczenie                              |
|---------------------------|-----------------|------------|----------------------------------------|
| `source_mode`             | text NOT NULL   | `mode_a`   | Tryb: `mode_a` lub `mode_b`            |
| `status`                  | text NULL       | NULL       | Status cyklu życia (Tryb B)            |
| `master_template_id`      | uuid NULL       | NULL       | FK → `document_master_templates`       |
| `master_template_version` | text NULL       | NULL       | Snapshot wersji master template        |
| `file_docx`               | text NULL       | NULL       | Ścieżka kopii roboczej DOCX            |
| `version_number`          | integer NOT NULL| 1          | Numer wersji roboczej                  |
| `edited_at`               | timestamptz NULL| NULL       | Czas ostatniej edycji DOCX             |
| `sent_at`                 | timestamptz NULL| NULL       | Czas wysłania do klienta               |

**Decyzja:** `pdf_path` (istniejące, PR-17) jest **reużywane** jako ścieżka
do finalnego PDF dla obu trybów. Nie tworzono duplikatu `file_pdf`.
`file_docx` jest unikalne dla Trybu B — ścieżka do edytowalnej kopii DOCX.

---

## Nowe typy TypeScript (PR-01)

Plik: `src/types/document-mode-b.ts`

| Typ / interfejs                 | Przeznaczenie                                     |
|---------------------------------|---------------------------------------------------|
| `SourceMode`                    | `'mode_a' \| 'mode_b'`                            |
| `QualityTier`                   | `'short_form' \| 'standard' \| 'premium'`         |
| `DocumentInstanceStatus`        | Status cyklu życia w Trybie B                     |
| `MasterTemplateCategory`        | Kategorie master templates                        |
| `DocumentMasterTemplate`        | Rekord z tabeli `document_master_templates`       |
| `DocumentInstanceModeBFields`   | Nowe pola na `DocumentInstance`                   |
| `CreateModeBInstanceInput`      | Dane do tworzenia instancji Trybu B (PR-02+)      |
| `UpdateModeBStatusInput`        | Dane do aktualizacji statusu Trybu B (PR-02+)     |
| `isModeBInstance()`             | Type guard: sprawdza `source_mode === 'mode_b'`   |
| `isValidQualityTier()`          | Walidacja runtime wartości quality_tier           |

---

## Feature flag

Plik: `src/config/featureFlags.ts`

```ts
export const FF_MODE_B_DOCX_ENABLED: boolean
```

- **Domyślnie `false` w PR-01** — pilot DOCX nie istnieje.
- Włączanie lokalnie: `localStorage.setItem('FF_MODE_B_DOCX_ENABLED', 'true')`
- Włączanie w CI/staging: `VITE_FF_MODE_B_DOCX_ENABLED=true` (build-time)
- Tabele DB istnieją niezależnie od flagi — flaga kontroluje tylko widoczność UI.

---

## Granica zakresu PR-01

### Wchodzi w scope PR-01

- [x] Tabela `document_master_templates` + RLS + indeksy
- [x] Enum `quality_tier` w Postgres
- [x] Rozszerzenie `document_instances` o pola Trybu B
- [x] Typy TS: `document-mode-b.ts`
- [x] Interfejs `DocumentInstance` rozszerzony o `DocumentInstanceModeBFields`
- [x] Feature flag `FF_MODE_B_DOCX_ENABLED`
- [x] Dokumentacja (ten plik)

### NIE wchodzi w scope PR-01

- [ ] Pilot end-to-end DOCX (Edge Function, LibreOffice, Word) → **PR-02**
- [ ] Seed danych do `document_master_templates` → **PR-02**
- [ ] Komponent UI biblioteki master templates → **PR-02**
- [ ] Walidacja FK `master_template_id` (`VALIDATE CONSTRAINT`) → **PR-02** (po seed)
- [ ] Hook `useDocumentMasterTemplates` → **PR-02**
- [ ] Bucket `document-masters` w Supabase Storage → **PR-02**

---

## Co dalej — PR-02

PR-02 jest pierwszym etapem z realnym pilotem DOCX:

1. Seed danych do `document_master_templates` (co najmniej 1 aktywny szablon)
2. Bucket `document-masters` (private) w Supabase Storage
3. Edge Function: kopiowanie master DOCX → kopia robocza per instancja
4. Edge Function lub job: renderowanie DOCX → PDF (LibreOffice headless lub Word)
5. Hook `useDocumentMasterTemplates` — lista aktywnych szablonów
6. Minimal UI: wybór szablonu z biblioteki, podgląd preview PDF
7. `VALIDATE CONSTRAINT doc_instances_master_template_id_fkey`

---

## Bezpieczeństwo

Wszystkie zmiany PR-01 są addytywne i nie osłabiają RLS:

- `document_master_templates`: RLS włączone, użytkownicy tylko `SELECT` aktywnych.
- `document_instances`: istniejące polisy RLS (`doc_instances_*_own`) obejmują nowe kolumny automatycznie przez `user_id = auth.uid()`.
- Brak otwartych ścieżek publicznych.
- Brak zmian w istniejących polisach.

---

*Ostatnia aktualizacja: PR-01, 2026-04-06*
