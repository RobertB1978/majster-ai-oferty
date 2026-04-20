# Legal Versioning Foundation — PR-L1 + PR-L1b

**Data wdrożenia:** 2026-04-20
**Branch:** `claude/legal-versioning-foundation-M1Rey`
**Status:** WDROŻONE (po pre-merge review + fix PR-L1b)

### Pre-merge review — wykryte problemy i fix

**Problem wykryty w code review (2026-04-20):**
Migracja PR-L1 (20260420160000) wstawiła seed z `content = 'i18n:legal.privacy.*'` —
wskaźnik na plik JSON, nie snapshot tekstu. Zmiana `pl.json` zmieniałaby efektywną
treść opublikowanej wersji 1.0 bez bumpu wersji i bez audit trail.
Dodatkowo: klucz `legal.rodo.*` nie istnieje w `pl.json` (poprawny: `legal.gdpr.*`).

**Fix (migracja PR-L1b: 20260420170000):**
1. `UPDATE` 5 wierszy — zastąpiono wskaźniki prawdziwym tekstem z `pl.json`
   (frozen snapshot: privacy 1566 znaków, terms 2156, dpa 1773, cookies 990, rodo 256)
2. Trigger `trg_legal_documents_immutability` — blokuje `UPDATE content` i `UPDATE version`
   na wierszach ze `status = 'published'`

**Znane luki odroczone do PR-L2:**
- EN/UK wersje nie mają seedów (tylko PL v1.0); strony wyświetlają EN/UK treść z i18n
- Frontend nadal czyta treść z i18n JSON, nie z DB (PR-L2: hook `useLegalDocument`)
- `LEGAL_VERSIONS` TS map nie jest połączona z DB (PR-L2: zamiana na live fetch)

---

## Fix Pack Δ

### Objaw
Strony prawne (Privacy Policy, Terms of Service, Cookies Policy, DPA) wyświetlały datę
ostatniej aktualizacji jako `new Date().toLocaleDateString()` — co oznaczało, że data
zmieniała się **przy każdym renderze strony**. Dokument mający datę "dzisiaj" przez całą
wieczność nie ma żadnej wartości dowodowej dla UODO/DPA.

**Pliki dotknięte problemem:**
- `src/pages/legal/PrivacyPolicy.tsx:11`
- `src/pages/legal/TermsOfService.tsx:11`
- `src/pages/legal/CookiesPolicy.tsx:12`
- `src/pages/legal/DPA.tsx:11`

### Dowód
```
grep "new Date()" src/pages/legal/*.tsx
# → 4 pliki, linia 11-12, identyczny wzorzec: new Date().toLocaleDateString(...)
```

### Hipoteza
Brak tabeli `legal_documents` jako źródła prawdy — komponenty generowały datę dynamicznie
zamiast odczytywać ją z metadanych opublikowanego dokumentu. To narusza RODO art. 7(1)
(administrator nie może wykazać kiedy dokument był faktycznie zaktualizowany).

### Minimalny fix

#### 1. Baza danych — nowe tabele

Migracja: `supabase/migrations/20260420160000_pr_legal_l1_versioning_foundation.sql`

**Tabela `legal_documents`** — źródło prawdy dla wersji i metadanych dokumentów:

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | `uuid PK` | Identyfikator |
| `slug` | `text NOT NULL` | Identyfikator dokumentu (privacy, terms, cookies, dpa, rodo) |
| `language` | `text NOT NULL` | Kod języka (pl, en, uk) |
| `version` | `text NOT NULL` | Wersja (np. "1.0", "1.1") |
| `title` | `text NOT NULL` | Tytuł w danym języku |
| `content` | `text NOT NULL` | Treść (lub referencja "i18n:..." w fazie przejściowej) |
| `status` | `text NOT NULL` | draft / published / archived |
| `published_at` | `timestamptz NULL` | Data publikacji |
| `effective_at` | `timestamptz NULL` | Data wejścia w życie |
| `created_at` | `timestamptz` | Auto now() |
| `updated_at` | `timestamptz` | Auto now() via trigger |

**Tabela `legal_acceptances`** — audit trail akceptacji przez użytkowników:

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | `uuid PK` | Identyfikator |
| `user_id` | `uuid NOT NULL` | FK → auth.users |
| `legal_document_id` | `uuid NOT NULL` | FK → legal_documents(id) |
| `accepted_at` | `timestamptz` | Auto now() |
| `acceptance_source` | `text NOT NULL` | Kontekst akceptacji (signup, settings, ...) |
| `ip_hash` | `text NULL` | Hash IP (nie raw IP — prywatność) |
| `user_agent` | `text NULL` | User agent |
| `created_at` | `timestamptz` | Auto now() |

**Constraints i indeksy:**
- `UNIQUE INDEX (slug, language) WHERE status = 'published'` — tylko jedna opublikowana wersja na slug+język
- `INDEX (slug, language, status)` — szybkie wyszukiwanie na ścieżce frontend
- `INDEX (user_id, legal_document_id)` — szybkie sprawdzenie "czy user zaakceptował?"
- `INDEX (user_id)` — DSAR export (all user acceptances)
- `FK legal_acceptances.legal_document_id → legal_documents.id ON DELETE RESTRICT`

**RLS:**
- `legal_documents`: SELECT dla `status = 'published'` (publiczne dokumenty)
- `legal_acceptances INSERT`: tylko `authenticated`, `user_id = auth.uid()`
- `legal_acceptances SELECT`: tylko `authenticated`, `user_id = auth.uid()`
- Modyfikacje: wyłącznie przez service role (migracje / przyszły CMS)

#### 2. Seed / bootstrap

Wstawiono 5 wierszy PL, wersja `1.0`, `effective_at = 2026-04-20`:

| slug | language | version | status |
|------|----------|---------|--------|
| privacy | pl | 1.0 | published |
| terms | pl | 1.0 | published |
| cookies | pl | 1.0 | published |
| dpa | pl | 1.0 | published |
| rodo | pl | 1.0 | published |

Kolumna `content` zawiera referencję `i18n:legal.<slug>.*` — jawnie oznacza,
że treść jest w warstwie i18n aplikacji (nie w DB). PR-L2 zmigruje pełny tekst do DB.

#### 3. Warstwa aplikacji — eliminacja fake dat

**Nowy plik:** `src/lib/legalVersions.ts`

Zawiera statyczną mapę `LEGAL_VERSIONS` z hardkodowanymi datami i wersjami.
Eksportuje:
- `getLegalEffectiveDate(slug, locale)` → sformatowana data w lokalu użytkownika
- `getLegalVersion(slug)` → string wersji

**Zmodyfikowane pliki** (zamiana `new Date()` → `getLegalEffectiveDate()`):
- `src/pages/legal/PrivacyPolicy.tsx` (linia 11)
- `src/pages/legal/TermsOfService.tsx` (linia 11)
- `src/pages/legal/CookiesPolicy.tsx` (linia 12)
- `src/pages/legal/DPA.tsx` (linia 11)

Teraz data na stronie jest **stała i audytowalna**, nie zmienia się przy każdym renderze.

**Nowy plik typów:** `src/types/legal.ts`

Eksportuje: `LegalDocument`, `LegalAcceptance`, `LegalDocumentMeta`, `LegalDocumentStatus`,
`LegalDocumentSlug`.

#### 4. Testy

Plik: `src/lib/legalVersions.test.ts`

Pokrycie:
- Wszystkie slugi mają zdefiniowane wpisy w `LEGAL_VERSIONS`
- `effectiveAt` ma format ISO (YYYY-MM-DD)
- Data jest statyczna (nie generowana dynamicznie przy każdym wywołaniu)
- `getLegalEffectiveDate` zwraca ciąg znaków dla pl/en/uk
- `getLegalVersion` zwraca niepusty string dla każdego slug

---

## Źródło prawdy — co się zmieniło

| Przed PR-L1 | Po PR-L1 |
|-------------|----------|
| Brak tabeli `legal_documents` | Tabela `legal_documents` jako źródło prawdy |
| Data = `new Date()` (zmienia się codziennie) | Data = statyczna `effectiveAt` z `LEGAL_VERSIONS` |
| Brak audit trail akceptacji | Tabela `legal_acceptances` gotowa |
| Brak typów TS dla dokumentów prawnych | `src/types/legal.ts` |

---

## Co PR-L2 zbuduje na tej podstawie

1. **Migracja treści do DB** — pełny tekst dokumentów PL/EN/UK w kolumnie `content`
2. **Hook `useLegalDocument(slug, language)`** — fetch z `legal_documents` + fallback statyczny
3. **Powiązanie rejestracji z akceptacją** — zapis do `legal_acceptances` przy signup
4. **Admin CMS** — edycja dokumentów w panelu admina (draft → publish flow)
5. **DSAR export** — `legal_acceptances` w JSON eksporcie użytkownika (GDPRCenter)

---

## Rollback

```sql
-- Cofnięcie migracji (WYŁĄCZNIE w środowisku lokalnym / staging):
DROP TABLE IF EXISTS public.legal_acceptances;
DROP TABLE IF EXISTS public.legal_documents;
DROP FUNCTION IF EXISTS public.set_legal_documents_updated_at();
```

W produkcji: przywrócić poprzednie wiersze w plikach legal (zastąpić `getLegalEffectiveDate`
powrotem `new Date().toLocaleDateString(...)`) i usunąć import. Tabele można zostawić — są addytywne.

**Pliki do przywrócenia przez `git revert`:**
- `src/pages/legal/PrivacyPolicy.tsx`
- `src/pages/legal/TermsOfService.tsx`
- `src/pages/legal/CookiesPolicy.tsx`
- `src/pages/legal/DPA.tsx`
- `src/lib/legalVersions.ts` (usuń)
- `src/lib/legalVersions.test.ts` (usuń)
- `src/types/legal.ts` (usuń)

---

## Evidence Log

```
Symptom:     Strony prawne pokazują "Ostatnia aktualizacja: [data dzisiejsza]" — zmienia
             się przy każdym renderze, fałszuje historię dokumentu.

Dowód:       src/pages/legal/PrivacyPolicy.tsx:11 — new Date().toLocaleDateString(...)
             src/pages/legal/TermsOfService.tsx:11 — identyczny wzorzec
             src/pages/legal/CookiesPolicy.tsx:12 — identyczny wzorzec
             src/pages/legal/DPA.tsx:11 — identyczny wzorzec
             Brak tabeli legal_documents w supabase/migrations/ (grep: 0 trafień).

Zmiana:      Migracja 20260420160000_pr_legal_l1_versioning_foundation.sql:
               - tabela legal_documents (14 kolumn, RLS, partial unique index, trigger)
               - tabela legal_acceptances (10 kolumn, FK, RLS, 3 indeksy)
               - 5 seed wierszy PL v1.0
             src/lib/legalVersions.ts — LEGAL_VERSIONS map + getLegalEffectiveDate()
             src/types/legal.ts — typy TS
             4 x src/pages/legal/*.tsx — zamiana new Date() → getLegalEffectiveDate()

Weryfikacja: patrz sekcja "Wyniki weryfikacji" w raporcie końcowym PR-L1.

Rollback:    git revert <commit-sha> dla plików TS; SQL patrz powyżej.
```
