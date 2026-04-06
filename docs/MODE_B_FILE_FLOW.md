# Tryb B — File Flow (PR-03)

## Kontekst

Majster.AI obsługuje dwa tryby generowania dokumentów:

- **Tryb A** (PR-17): szablony jako kod (`src/data/documentTemplates.ts`), PDF przez jsPDF / Edge Function.
- **Tryb B** (PR-01+): master DOCX w Storage, kopia robocza per instancja, edycja, render do DOCX.

Ten dokument opisuje **warstwę plików Trybu B** (PR-03). Nie opisuje UI ani treści dokumentów.

---

## Diagram pełnego cyklu życia

```
[Admin: upload master DOCX]
        |
        ▼
[document_master_templates]
  template_key = 'protokol_odbioru_std'
  docx_master_path = 'masters/protokol.../v1.0/protokol....docx'
  version = '1.0'
        |
        | createWorkingCopyRecord()
        ▼
[document_instances — status: draft]
  source_mode = 'mode_b'
  master_template_id = <uuid>
  file_docx = NULL           ← jeszcze nie ma pliku
  version_number = 1
        |
        | Edge Function (PR-02): kopiuje master DOCX do working/
        ▼
[Storage: bucket document-masters]
  working/{user_id}/{instance_id}/v1.docx
        |
        | saveWorkingCopy()
        ▼
[document_instances — status: draft]
  file_docx = 'working/{user_id}/{instance_id}/v1.docx'
  version_number = 1
  edited_at = '2026-04-06T...'
        |
        | (opcjonalne: kolejne edycje DOCX)
        | saveWorkingCopy() z version_number = 2, 3 ...
        ▼
[document_instances — status: draft → ready → sent → final]
```

---

## Bucket Storage: `document-masters`

**Typ:** prywatny (public = false)
**Dostęp:** wyłącznie przez signed URLs lub service_role (Edge Functions)

### Konwencja ścieżek

| Rodzaj pliku | Format ścieżki | RLS |
|---|---|---|
| **Master template** | `masters/{template_key}/v{version}/{template_key}.docx` | Tylko service_role |
| **Kopia robocza** | `working/{user_id}/{instance_id}/v{version_number}.docx` | User-scoped (właściciel) |

### Przykłady

```
masters/protokol_odbioru_std/v1.0/protokol_odbioru_std.docx
masters/umowa_zlecenie_std/v2.1/umowa_zlecenie_std.docx

working/550e8400-e29b-41d4-a716-446655440000/6ba7b810-9dad.../v1.docx
working/550e8400-e29b-41d4-a716-446655440000/6ba7b810-9dad.../v2.docx
```

### RLS Storage (storage.objects)

| Operacja | Ścieżka | Zasada |
|---|---|---|
| SELECT | `working/...` | `storage.foldername(name)[2] = auth.uid()` |
| INSERT | `working/...` | jak wyżej |
| UPDATE | `working/...` | jak wyżej |
| DELETE | `working/...` | jak wyżej |
| SELECT/INSERT/UPDATE/DELETE | `masters/...` | brak polisy — tylko service_role |

---

## Źródło prawdy dla pól DB

| Pole | Tabela | Znaczenie w Trybie B |
|---|---|---|
| `docx_master_path` | `document_master_templates` | Ścieżka nienaruszalnego master DOCX |
| `file_docx` | `document_instances` | Ścieżka aktualnej kopii roboczej DOCX |
| `pdf_path` | `document_instances` | Ścieżka finalnego PDF (gdy jest, w bucket `dossier`); reużywane z Trybu A |
| `version_number` | `document_instances` | Numer wersji roboczej (1, 2, 3 …) |
| `status` | `document_instances` | Stan cyklu życia (patrz niżej) |

**Decyzja (PR-01):** `pdf_path` (istniejące pole z PR-17) jest **reużywane** jako ścieżka do finalnego PDF dla obu trybów. Nie ma osobnego `file_pdf`. `file_docx` jest unikalne dla Trybu B.

---

## Statusy cyklu życia

| Status | Znaczenie | Kto ustawia | Pola zmieniane |
|---|---|---|---|
| `draft` | Edycja w toku | System (przy tworzeniu) / `saveWorkingCopy` | `file_docx`, `version_number`, `edited_at` |
| `ready` | Gotowy do wysłania | Użytkownik | `status` |
| `sent` | Wysłany do klienta | System / Użytkownik | `status`, `sent_at` |
| `final` | Zaakceptowany (nienaruszalny) | Użytkownik | `status` |
| `archived` | Przeniesiony do archiwum | Użytkownik | `status` |

---

## Helpery (`src/lib/modeBFileFlow.ts`)

### Path builders (czyste funkcje, bez side-effectów)

| Funkcja | Opis |
|---|---|
| `buildMasterDocxPath(templateKey, version)` | Ścieżka master DOCX w Storage |
| `buildWorkingCopyPath(userId, instanceId, versionNumber)` | Ścieżka kopii roboczej |

### Operacje DB

| Funkcja | Opis |
|---|---|
| `createWorkingCopyRecord(input)` | INSERT do `document_instances` (status: draft, file_docx: null) |
| `saveWorkingCopy(input)` | UPDATE file_docx, version_number, edited_at |
| `markAsReady(instanceId)` | UPDATE status = 'ready' |
| `markAsFinal(instanceId)` | UPDATE status = 'final' (blokuje archived) |
| `markAsSent(instanceId)` | UPDATE status = 'sent', sent_at = now() |

### Dostęp do plików

| Funkcja | Opis |
|---|---|
| `getSignedDocxAccess(path, ttl?)` | Signed URL do odczytu (TTL: 1h, z retry) |
| `getSignedDocxDownload(path, fileName)` | Signed URL z Content-Disposition: attachment |
| `deleteWorkingCopyFile(path)` | Best-effort usunięcie pliku z Storage |

---

## Hooki TanStack Query (`src/hooks/useModeBDocumentInstances.ts`)

| Hook | Typ | Opis |
|---|---|---|
| `useCreateModeBInstance()` | Mutation | Tworzy rekord draft w DB |
| `useSaveModeBWorkingCopy()` | Mutation | Aktualizuje plik DOCX po Edge Function |
| `useMarkModeBReady()` | Mutation | Status → ready |
| `useMarkModeBFinal()` | Mutation | Status → final |
| `useMarkModeBSent()` | Mutation | Status → sent + sent_at |
| `useModeBSignedDocxUrl(path)` | Query | Signed URL (cachowany 50 min) |
| `useModeBSignedDocxDownload()` | Mutation | Signed download URL (nie cachowany) |
| `useDeleteModeBWorkingCopy()` | Mutation | Usuwa DB + plik z Storage |

---

## Pełny flow: od wyboru szablonu do pobrania DOCX

```
1. Użytkownik wybiera master template z biblioteki
   → useCreateModeBInstance({ templateKey, masterTemplateId, masterTemplateVersion, ... })
   → zwraca { id: instanceId }

2. Frontend wywołuje Edge Function (PR-02) z instanceId
   → Edge Function: czyta master DOCX (service_role), podstawia dane, zapisuje pod:
     buildWorkingCopyPath(userId, instanceId, 1)

3. Edge Function zwraca { fileDocxPath: 'working/uid/inst/v1.docx' }
   → useSaveModeBWorkingCopy({ instanceId, fileDocxPath, newVersionNumber: 1 })

4. Użytkownik przegląda dokument
   → useModeBSignedDocxUrl('working/uid/inst/v1.docx')
   → signed URL ważny przez 1 godzinę

5. Użytkownik klika "Pobierz DOCX"
   → useModeBSignedDocxDownload()
   → { fileDocxPath: '...', fileName: 'Protokol_Odbioru_Projekt_XYZ.docx' }

6. Użytkownik zatwierdza i oznacza jako final
   → useMarkModeBFinal(instanceId)
```

---

## Bezpieczeństwo

- Bucket `document-masters` jest **prywatny** — brak publicznych URL
- `masters/*` dostępne wyłącznie przez `service_role` (Edge Functions) — użytkownicy nie czytają surowych wzorców
- `working/{user_id}/*` dostępne wyłącznie przez właściciela (RLS na storage.objects)
- Signed URLs są jedyną ścieżką dostępu dla frontendu (TTL 1h / 24h)
- `markAsFinal` blokuje przypadkowe usunięcie (useDeleteModeBWorkingCopy sprawdza status)
- Wszystkie operacje DB są objęte istniejącymi polisami RLS na `document_instances`

---

## Czego PR-03 NIE robi

| Co | Gdzie to będzie |
|---|---|
| Treść dokumentów (contentowe master DOCX) | PR-05a / PR-05b / PR-05c |
| Komponent UI biblioteki szablonów | PR-04 |
| Hook `useDocumentMasterTemplates` (lista szablonów) | PR-04 |
| Upload master DOCX przez admina | Panel admin (osobny scope) |
| Walidacja FK `VALIDATE CONSTRAINT` | PR-04 (po seed danych) |
| Konwersja DOCX → PDF | Nie w scope PR-01 do PR-05 (patrz ADR-0013 § 3.2) |
| UI podglądu pliku DOCX | PR-04 |

---

## Pliki zmienione / dodane w PR-03

| Plik | Typ | Opis |
|---|---|---|
| `src/types/document-mode-b.ts` | Zmiana | Dodanie pola `templateKey` do `CreateModeBInstanceInput` |
| `supabase/migrations/20260406120000_pr03_mode_b_bucket.sql` | Nowy | Bucket + RLS storage |
| `src/lib/modeBFileFlow.ts` | Nowy | Path builders + helpery DB + signed access |
| `src/hooks/useModeBDocumentInstances.ts` | Nowy | TanStack Query wrappery |
| `docs/MODE_B_FILE_FLOW.md` | Nowy | Ten dokument |

---

*Ostatnia aktualizacja: PR-03, 2026-04-06*
