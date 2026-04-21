# Admin Legal CMS — PR-L4

## Co istniało przed tym PR

Dokumenty prawne (polityka prywatności, regulamin, cookies, DPA, RODO) były przechowywane
jako statyczne treści w plikach i18n JSON (`public/locales/pl/*.json`).
Każda zmiana treści wymagała:
1. ręcznej edycji pliku JSON,
2. code review,
3. deployu aplikacji.

Tabela `legal_documents` z pełnymi treściami istniała od PR-L1 (migracja `20260420170000`),
ale nie było żadnego interfejsu do jej zarządzania — admini nie mogli edytować dokumentów
bez wchodzenia do SQL.

## Źródło prawdy po PR-L4

**Tabela PostgreSQL `legal_documents`** jest teraz edytowalnym źródłem prawdy dla adminów.

Struktura tabeli (bez zmian — additive only):
```
id          uuid PRIMARY KEY
slug        text  (privacy | terms | cookies | dpa | rodo)
language    text  (np. 'pl')
version     text  (np. '1.1')
title       text
content     text
status      text  (draft | published | archived)
published_at timestamptz
effective_at timestamptz
created_at  timestamptz
updated_at  timestamptz
```

Ograniczenia bazy (istniejące, niezmienione):
- `UNIQUE (slug, language) WHERE status = 'published'` — jeden opublikowany per slug+język
- Trigger `guard_legal_document_immutability` — blokuje zmianę `content` i `version` dla
  dokumentów o statusie `published`

## Jak działa Draft/Publish

### Tworzenie szkicu
Admin może:
1. Kliknąć "Nowy szkic" na liście — tworzy pusty draft dla wybranego slug+język
2. Kliknąć "Nowy szkic" na opublikowanym dokumencie — wywołuje RPC
   `create_legal_draft_from_published(slug, language)`, które kopiuje treść z opublikowanego
   i auto-bumps wersję (np. 1.0 → 1.1)

### Edycja szkicu
- Formularz z polami: tytuł, wersja, język, data wejścia w życie, treść
- Treść to czysty tekst / markdown (textarea, nie WYSIWYG)
- Przycisk "Zapisz szkic" — `UPDATE legal_documents WHERE id=? AND status='draft'`
- Trigger bazy blokuje edycję opublikowanych — UI pokazuje komunikat i wyłącza formularz

### Publikacja
1. Admin klika "Opublikuj" (dostępne tylko gdy szkic jest zapisany — `isDirty === false`)
2. Pojawia się dialog potwierdzenia z informacją o archiwizacji aktualnej wersji
3. Po potwierdzeniu wywoływane jest RPC `publish_legal_document(draft_id)`:
   - W jednej transakcji: archiwizuje aktualnie opublikowany dok (jeśli istnieje)
   - Ustawia `status='published'`, `published_at=now()` na szkicu
4. Sukces → panel zamyka edytor, lista odświeża się

### Archiwizacja
Dokumenty są archiwizowane automatycznie przy każdej publikacji nowej wersji.
Archiwa widoczne są w liście (tylko do odczytu) — nie można ich edytować ani reaktywować
przez ten panel.

## Jak działa Preview

Zakładka "Podgląd" w edytorze wyświetla bieżący stan pola `content` z formularza (nie
zapisaną wersję z DB) jako czysty tekst w znaczniku `<pre>`. Pozwala to zobaczyć layout
treści przed zapisem.

Preview odzwierciedla zmiany na żywo — edycja w textarea natychmiast aktualizuje podgląd.

## Jak działa Diff

Zakładka "Diff" porównuje:
- **lewa kolumna** (stara): opublikowana wersja dokumentu dla tego samego slug+język
- **prawa kolumna** (nowa): bieżący stan formularza (draft)

Algorytm: LCS (Longest Common Subsequence) line-by-line, zaimplementowany lokalnie
bez zewnętrznych zależności (`src/components/admin/legal/LegalDocumentDiff.tsx`).

Legenda:
- linia bez tła — bez zmian
- linia zielona `+` — dodana w drafcie
- linia czerwona `−` — usunięta z opublikowanego

Diff nie jest dostępny jeśli nie istnieje opublikowana wersja (pierwsza publikacja).

## Bezpieczeństwo

- Trasa `/admin/legal/documents` jest wewnątrz `<AdminLayout>` chronionego przez `AdminGuard`
- Dodatkowy check `useAdminRole()` wewnątrz strony — podwójna ochrona
- RLS na tabeli `legal_documents`:
  - Publiczne SELECT: tylko `status = 'published'` (bez zmian)
  - Admin SELECT/INSERT/UPDATE: tylko użytkownicy z `user_roles.role = 'admin'`
- RPC `publish_legal_document` i `create_legal_draft_from_published` mają wewnętrzne
  sprawdzenie `is_admin()` — SECURITY DEFINER z SECURITY guard

## Co jest celowo poza zakresem

- WYSIWYG editor (ckeditor, prosemirror, etc.) — textarea wystarczy, nie dodaje zależności
- Approval workflow — publikacja jest bezpośrednia przez admina
- Wielojęzyczne wersje inne niż PL — tabela obsługuje, UI nie filtruje, ale można tworzyć
  ręcznie przez INSERT
- Powiadomienia do użytkowników po publikacji — poza scope'em compliance CMS
- Zmiany w stronach legal (PrivacyPolicy.tsx etc.) — nadal konsumują i18n JSON,
  konwersja na DB-backed jest osobnym zadaniem (> 30 LOC + decyzja architektoniczna)
- Zarządzanie archiwami (reaktywacja, usuwanie) — dane nienaruszone w DB

## Rollback

Jeśli PR-L4 powoduje problemy, rollback wymaga:
1. Cofnięcia migracji `20260421120000_pr_legal_l4_cms_admin.sql`:
   ```sql
   DROP POLICY IF EXISTS "legal_documents_admin_select" ON public.legal_documents;
   DROP POLICY IF EXISTS "legal_documents_admin_insert" ON public.legal_documents;
   DROP POLICY IF EXISTS "legal_documents_admin_update" ON public.legal_documents;
   DROP FUNCTION IF EXISTS public.publish_legal_document(uuid);
   DROP FUNCTION IF EXISTS public.create_legal_draft_from_published(text, text);
   DROP FUNCTION IF EXISTS public.is_admin();
   ```
2. Usunięcia trasy `/admin/legal/documents` z `App.tsx`
3. Usunięcia plików:
   - `src/hooks/useLegalCms.ts`
   - `src/components/admin/legal/`
   - `src/pages/admin/AdminLegalDocumentsPage.tsx`

Tabela `legal_documents` i jej dane pozostają nienaruszone — rollback nie usuwa danych.

## Pliki zmienione / dodane w tym PR

### Nowe
- `supabase/migrations/20260421120000_pr_legal_l4_cms_admin.sql`
- `src/hooks/useLegalCms.ts`
- `src/components/admin/legal/LegalDocumentList.tsx`
- `src/components/admin/legal/LegalDocumentEditor.tsx`
- `src/components/admin/legal/LegalDocumentDiff.tsx`
- `src/pages/admin/AdminLegalDocumentsPage.tsx`
- `docs/legal/ADMIN_LEGAL_CMS.md` (ten plik)

### Zmienione
- `src/App.tsx` — dodano lazy import + trasa `/admin/legal/documents`
- `src/types/legal.ts` — dodano `LegalDraftInput`, `LegalDocumentGroup`

### Niezmienione (celowo)
- Strony `src/pages/legal/` (PrivacyPolicy, TermsOfService, etc.)
- Pliki i18n JSON
- Istniejące migracje
- Tabela `legal_documents` schema
