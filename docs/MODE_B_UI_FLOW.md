# MODE B — UI i Flow Użytkownika (PR-04)

## Status: WDROŻONE w PR-04

---

## Co widzi użytkownik

### Kiedy `FF_MODE_B_DOCX_ENABLED = false` (produkcja domyślna)

Nic się nie zmienia. Użytkownik widzi wyłącznie Tryb A (istniejący flow szablonów PDF).
Mode switcher jest niewidoczny. Żaden element Trybu B nie jest renderowany.

### Kiedy `FF_MODE_B_DOCX_ENABLED = true` (pilotaż / lokalne testy)

Na stronie `/app/document-templates` pojawia się **mode switcher** (zakładki):

```
┌─────────────────────────────────────────┐
│  [ Tryb A — szybki PDF ]  [ Tryb B — pełny dokument ]  │
└─────────────────────────────────────────┘
```

---

## Ścieżka użytkownika — Tryb A (niezmieniona)

```
1. /app/document-templates
2. Tab "Tryb A — szybki PDF" (domyślny)
3. Wyszukiwarka + filtry kategorii
4. Kliknięcie karty szablonu → TemplateEditor
5. Wypełnienie pól → Autofill → Generuj PDF / Zapisz do Dossier
```

Tryb A działa identycznie jak przed PR-04. Żadna linia kodu Trybu A nie została zmieniona
poza dodaniem conditional wrappera `{(!FF_MODE_B_DOCX_ENABLED || activeMode === 'mode_a') && ...}`.

---

## Ścieżka użytkownika — Tryb B

```
1. /app/document-templates
2. Tab "Tryb B — pełny dokument"
3. Sekcja "Wybierz szablon":
   - Lista master templates z tabeli document_master_templates
   - Jeśli tabela pusta (seed w PR-05): honest fallback "Szablony wkrótce"
   - Kliknięcie karty → createModeBInstance() → rekord draft w DB
4. Sekcja "Twoje dokumenty DOCX":
   - Lista istniejących instancji source_mode='mode_b'
   - Każda karta: ModeBDocumentCard z statusem i akcjami
```

---

## Komponenty PR-04

| Plik | Opis |
|------|------|
| `src/hooks/useModeBMasterTemplates.ts` | Hook TanStack Query: pobiera aktywne master templates z DB |
| `src/components/documents/mode-b/ModeBStatusBadge.tsx` | Badge statusu (draft/ready/sent/final/archived) |
| `src/components/documents/mode-b/ModeBDocumentCard.tsx` | Karta instancji DOCX z akcjami i disabled state |
| `src/components/documents/mode-b/ModeBTemplateSelector.tsx` | Wybór master template + tworzenie instancji |
| `src/components/documents/mode-b/index.ts` | Public API komponentów |
| `src/pages/DocumentTemplates.tsx` | Mode switcher + widok Trybu B (modyfikacja) |

---

## Statusy dokumentu — cykl życia

```
draft → ready → sent → final
         ↓
      (można cofnąć do draft przy ponownej edycji)
```

| Status | Badge | Co to oznacza |
|--------|-------|---------------|
| `draft` | Szkic (szary) | Dokument w edycji, plik DOCX może jeszcze nie istnieć |
| `ready` | Gotowy (niebieski) | Zatwierdzony, gotowy do wysłania do klienta |
| `sent` | Wysłany (fioletowy) | Przekazany do klienta |
| `final` | Finalny (zielony) | Zaakceptowany przez klienta, nienaruszalny |
| `archived` | Archiwum (pomarańczowy) | Przeniesiony do archiwum |

---

## Akcje i ich dostępność

| Akcja | Kiedy aktywna | Kiedy disabled |
|-------|---------------|----------------|
| Pobierz DOCX | `file_docx !== null` | `file_docx === null` (Edge Function PR-02 nie gotowa) |
| Pobierz PDF | `pdf_path !== null` | `pdf_path === null` (renderowanie PR-05) |
| Oznacz jako gotowy | `file_docx !== null AND status === 'draft'` | Brak pliku DOCX |
| Wyślij | `status === 'ready'` lub `'sent'` | Inny status |
| Oznacz jako finalny | `status === 'ready'` lub `'sent'` | Inny status |
| Usuń | `status !== 'final'` | Status `final` (ochrona) |

---

## Co JESZCZE NIE jest w PR-04

- **Generowanie DOCX** — Edge Function (`docxtemplater` + `pizzip`) → PR-02/05
- **Seed szablonów** w tabeli `document_master_templates` → PR-05a/05b/05c
- **Preview PDF** dokumentu DOCX → PR-05
- **Wysyłka e-mail** (dialog z adresem) → PR-05
- **Edytor online** DOCX → poza zakresem (pobieranie + edycja lokalna)
- **Integracja z DossierPanel** (dokumenty DOCX w zakładce projektu) → PR-05

---

## Jak włączyć Tryb B lokalnie

```javascript
// W konsoli przeglądarki:
localStorage.setItem('FF_MODE_B_DOCX_ENABLED', 'true')
// Następnie odśwież stronę (F5)
```

Lub przez zmienną środowiskową:
```env
VITE_FF_MODE_B_DOCX_ENABLED=true
```

---

## Granica zakresu PR-04

PR-04 kończy się na:
- ✅ Czytelnym rozdzieleniu ścieżek Trybu A i B w UI
- ✅ Selektorze szablonów Trybu B (z honest fallback gdy pusta DB)
- ✅ Tworzeniu instancji draft przez `useCreateModeBInstance`
- ✅ Wyświetlaniu statusów i akcji (z poprawnym disabled state)
- ✅ Ochronie przed martwymi ścieżkami (każdy disabled button ma tooltipa)
- ✅ Gating całego Trybu B za `FF_MODE_B_DOCX_ENABLED`

Następny krok: **PR-05a** — seed szablonów + Edge Function DOCX → aktywuje akcje disabled.
