# Moduł Gotowych Dokumentów — Workspace Premium

> Dokumentacja postępu: PR-B1 → PR-B2 → PR-B3

---

## Trasa i dostęp

| Trasa | Plik strony | Feature flag |
|-------|-------------|--------------|
| `/app/ready-documents` | `src/pages/ReadyDocuments.tsx` | `FF_READY_DOCUMENTS_ENABLED` |

Włączone wyłącznie gdy `FF_READY_DOCUMENTS_ENABLED = true` (localStorage lub
`VITE_FF_READY_DOCUMENTS_ENABLED=true`).

---

## Historia wdrożeń

### PR-B1 — Shell (szkielet strony)

- Trasa `/app/ready-documents` dodana do routera
- Szkielet strony: nagłówek, 5 kategorii (Umowy, Protokoły, Załączniki, Przeglądy, Inne)
- Pusta prawa kolumna (placeholder `WorkspaceEmpty`)
- Pozycja w sidebar (gating za `FF_READY_DOCUMENTS_ENABLED`)
- Brak prawdziwego podłączenia do bazy danych

### PR-B2 — Podłączenie infrastruktury Mode B

- Rzeczywiste podłączenie do tabeli `document_master_templates` (hook `useModeBMasterTemplates`)
- Rzeczywiste podłączenie do `document_instances` z filtrem `source_mode='mode_b'`
  (hook `useModeBInstances`)
- `ModeBTemplateSelector` — tworzenie nowej instancji draft z master template
- `ModeBDocumentCard` — wyświetlanie instancji ze stanem, metadanymi i akcjami
- Split layout desktop: left 320px + prawa kolumna workspace
- Bezpieczne stany puste: honest fallback gdy brak szablonów lub instancji

### PR-B3 — Premium workspace (wybór, mobile, info blok)

To co dodano w PR-B3 jest opisane szczegółowo poniżej.

---

## Co workspace może robić po PR-B3

### Wybór dokumentu

- Kliknięcie dokumentu z listy ustawia go jako wybrany
- Wybrany dokument jest zapisany w URL jako `?doc=<id>` — przeżywa odświeżenie strony
- Stale-selection guard: jeśli wybrany dokument zostanie usunięty, URL jest czyszczony
  automatycznie przy ponownym załadowaniu listy
- Zmiana kategorii czyści wybór jeśli wybrana instancja nie należy do nowej kategorii

### Panel workspace (prawa kolumna — desktop)

Dla wybranego dokumentu widoczne są:

1. **Nagłówek dokumentu** — tytuł / nazwa szablonu + ikona
2. **Status badge** — szkic / gotowy / wysłany / finalny / archiwum
3. **Metadane** — data utworzenia, data edycji, data wysłania, numer wersji roboczej
4. **Akcje** (dostępność zależy od stanu dokumentu):
   - Pobierz DOCX — aktywny gdy `file_docx` istnieje
   - Pobierz PDF — aktywny gdy `pdf_path` istnieje
   - Oznacz jako gotowy — aktywny gdy status `draft` i plik DOCX istnieje
   - Oznacz jako finalny — aktywny gdy status `ready` lub `sent`
   - Oznacz jako wysłany — aktywny gdy status `ready` lub `final`
   - Usuń — aktywny dla wszystkich statusów poza `final`
5. **Blok informacji o dokumencie** (`DocInfoBlock`):
   - Kategoria szablonu (CONTRACTS / PROTOCOLS / ANNEXES / COMPLIANCE / OTHER)
   - Klucz szablonu (`template_key`)
   - Wersja master template utrwalona przy tworzeniu instancji
   - Dostępność pliku DOCX — zielony "Dostępny" lub szary "Niedostępny"
   - Dostępność pliku PDF — zielony "Dostępny" lub szary "Niedostępny"

Gdy żaden dokument nie jest wybrany: wyświetlany jest placeholder z komunikatem
"Wybierz dokument" — bez fałszywego edytora ani fałszywego podglądu.

### Mobile — flow szczegółów

Na małych ekranach (poniżej breakpointu `lg` = 1024px):

- **Domyślny widok**: lista dokumentów (lewa kolumna)
- **Po wyborze dokumentu**: lista jest ukrywana, widoczna jest tylko prawa kolumna workspace
- **Przycisk "Wróć do listy"** (`ArrowLeft`) jest widoczny wyłącznie na mobile (`lg:hidden`)
- Desktop: obie kolumny zawsze widoczne równolegle — `mobileView` nie ma wpływu

Implementacja: jednostronna (conditional panel), bez osobnej trasy URL. Najmniejsze
bezpieczne wdrożenie pasujące do architektury React Router 6 + Tailwind.

---

## Co NIE jest jeszcze dostępne (czeka na późniejsze PR)

| Feature | Powód braku | Planowany PR |
|---------|-------------|-------------|
| Generowanie pliku DOCX z master template | Wymaga Edge Function z `docxtemplater` | PR-B (Edge Function DOCX) |
| Seed szablonów w `document_master_templates` | Tabela gotowa, brak danych | PR-05a/05b/05c |
| Pobieranie PDF | Wymaga renderowania LibreOffice/Word | PR-05 |
| Podgląd PDF w przeglądarce | Wymaga renderera PDF | PR-05 |
| Edytor online DOCX | Poza zakresem (edycja offline) | Nie zaplanowany |
| Drag-and-drop layout editor | Poza zakresem | Nie zaplanowany |
| Wysyłka e-mail dokumentu | Dialog + integracja Resend | PR-05 |
| Historia wersji (rozbudowana) | Dane są, brak UI ponad `version_number` | Późniejszy PR |
| Upload własnego DOCX przez właściciela | Admin flow, nie user flow | Osobny PR |

---

## Bezpieczeństwo i RLS

- Tylko instancje z `source_mode='mode_b'` są wyświetlane — filtr w `useModeBInstances`
- Tylko aktywne master templates (`is_active=true`) — filtr RLS + query w `useModeBMasterTemplates`
- Instancje archived są wykluczone z listy
- Każda akcja (Pobierz, Oznacz, Usuń) ma stan disabled gdy nie ma prawdziwego backing'u
- Brak fake danych, brak placeholderowych plików do pobrania

---

## Struktura komponentów (po PR-B3)

```
src/pages/ReadyDocuments.tsx          ← strona główna, koordynacja stanu
  ├── InstanceListItem                ← item na liście (inline sub-komponent)
  ├── WorkspaceEmpty                  ← placeholder gdy brak wyboru (inline)
  └── DocInfoBlock                    ← blok info o dokumencie (inline, PR-B3)

src/components/documents/mode-b/
  ├── ModeBDocumentCard.tsx           ← karta z akcjami (status, download, mark, delete)
  ├── ModeBTemplateSelector.tsx       ← wybór master template + tworzenie instancji
  ├── ModeBStatusBadge.tsx            ← badge statusu
  └── index.ts

src/hooks/
  ├── useModeBDocumentInstances.ts    ← CRUD hooks dla document_instances
  └── useModeBMasterTemplates.ts      ← query hook dla document_master_templates

src/lib/modeBFileFlow.ts             ← helpery storage (signed URLs, working copy)
src/types/document-mode-b.ts         ← typy TypeScript (SourceMode, Status, itp.)
```

---

## Ograniczenia PR-B3

1. **Brak wizualnego edytora** — workspace pokazuje metadane i akcje, nie ma edytora
   inline. Dokumenty DOCX są przeznaczone do pobrania i edycji lokalnie.

2. **Mobile: brak trwałości widoku po odświeżeniu** — URL `?doc=<id>` przeżywa odświeżenie,
   ale `mobileView` resetuje się do `'list'`. Użytkownik musi ponownie kliknąć dokument.
   Na desktopie nie ma tego problemu.

3. **Blok DocInfoBlock pokazuje tylko szablony załadowane przez `useModeBMasterTemplates`**
   — jeśli master template został deaktywowany po stworzeniu instancji, kategoria może
   nie być widoczna (template nie pojawi się w `allTemplates`).

4. **Akcje wymagają gotowej Edge Function DOCX** — dopóki `file_docx = null`, przyciski
   pobierania i "Oznacz jako gotowy" są disabled. Dotyczy to całego PR-B do momentu
   wdrożenia Edge Function generowania DOCX.
