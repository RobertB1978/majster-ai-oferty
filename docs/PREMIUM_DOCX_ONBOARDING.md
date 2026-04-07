# Jak wgrać gotowy dokument DOCX do systemu Majster.AI

## Instrukcja dla właściciela — onboarding premium dokumentów

Ten przewodnik wyjaśnia **dokładnie** co zrobić, żeby nowa umowa lub dokument pojawił się
dla użytkowników w zakładce „Gotowe dokumenty" (`/app/ready-documents`).

Nie trzeba być programistą. Wystarczy dostęp do **Supabase Dashboard**.

---

## Jak działa system (krótko)

Każdy dostępny dokument w systemie składa się z trzech elementów:

| Element | Co to jest | Gdzie jest |
|---|---|---|
| **Plik DOCX** | Rzeczywista treść umowy/dokumentu | Supabase Storage (bucket `document-masters`) |
| **Rekord w bazie danych** | Metadane: nazwa, kategoria, ścieżka pliku | Tabela `document_master_templates` |
| **Flaga aktywności** | `is_active = true` — "pokaż użytkownikom" | Pole w rekordzie DB |

Dokument pojawia się użytkownikom **tylko gdy wszystkie trzy są gotowe**.

---

## Aktualny stan inventory (5 umów budowlanych)

Poniższe szablony są zarejestrowane w systemie (rekordy w DB istnieją, `is_active = false`).
Czekają na upload pliku DOCX i aktywację:

| Nazwa | template_key | Oczekiwana ścieżka w Storage |
|---|---|---|
| Umowa o roboty budowlane — ryczałt | `contract_fixed_price_standard` | `masters/contract_fixed_price_standard/v1.0/contract_fixed_price_standard.docx` |
| Umowa kosztorysowa (koszt + marża) | `contract_cost_plus_standard` | `masters/contract_cost_plus_standard/v1.0/contract_cost_plus_standard.docx` |
| Umowa z klauzulą materiałową | `contract_with_materials_standard` | `masters/contract_with_materials_standard/v1.0/contract_with_materials_standard.docx` |
| Umowa z zaliczką i etapami | `contract_with_advance_standard` | `masters/contract_with_advance_standard/v1.0/contract_with_advance_standard.docx` |
| Zlecenie / mini-umowa | `contract_simple_order_standard` | `masters/contract_simple_order_standard/v1.0/contract_simple_order_standard.docx` |

---

## Krok po kroku — jak opublikować jeden dokument

### Krok 1 — Przygotuj plik DOCX

Utwórz plik DOCX z treścią umowy poza aplikacją (np. w Microsoft Word, LibreOffice).
Plik musi być **kompletny i gotowy do użycia** — właśnie ten plik trafią do użytkowników.

**Zasada: nie wgrywaj szkiców ani niekompletnych dokumentów.**

Nazwij plik zgodnie z konwencją: `{template_key}.docx`

Przykład:
```
contract_fixed_price_standard.docx
```

### Krok 2 — Wgraj plik DOCX do Supabase Storage

1. Otwórz **Supabase Dashboard** → zakładka **Storage**
2. Wybierz bucket: `document-masters`
3. Przejdź do ścieżki (utwórz foldery jeśli nie istnieją):
   ```
   masters/contract_fixed_price_standard/v1.0/
   ```
4. Wgraj plik i nazwij go dokładnie:
   ```
   contract_fixed_price_standard.docx
   ```

Pełna ścieżka po uploadzie powinna wyglądać tak:
```
masters/contract_fixed_price_standard/v1.0/contract_fixed_price_standard.docx
```

> **Ważne:** Nazwa folderu i pliku muszą być dokładnie takie jak w tabeli powyżej.
> Literówka w ścieżce = dokument nie pojawi się w aplikacji.

### Krok 3 — Aktywuj szablon w bazie danych

1. Otwórz **Supabase Dashboard** → zakładka **SQL Editor**
2. Wklej i uruchom:

```sql
UPDATE document_master_templates
SET is_active = true, updated_at = now()
WHERE template_key = 'contract_fixed_price_standard';
```

Podmień `'contract_fixed_price_standard'` na właściwy klucz szablonu.

### Krok 4 — Weryfikacja

1. Otwórz aplikację i przejdź do `/app/ready-documents`
2. Odśwież stronę (cache wygasa po 10 minutach lub po odświeżeniu)
3. Dokument powinien pojawić się w kategorii **Umowy** z licznikiem `1`
4. Kliknij „Utwórz dokument" — powinna pojawić się karta szablonu

**Jeśli dokument nie pojawia się po odświeżeniu:**
- Sprawdź czy ścieżka pliku w Storage jest dokładnie taka jak w tabeli
- Sprawdź w SQL Editor czy `is_active = true`:
  ```sql
  SELECT template_key, is_active, docx_master_path
  FROM document_master_templates
  WHERE template_key = 'contract_fixed_price_standard';
  ```

---

## Jak dezaktywować dokument (np. przy wycofaniu)

```sql
UPDATE document_master_templates
SET is_active = false, updated_at = now()
WHERE template_key = 'contract_fixed_price_standard';
```

Dokument znika z widoku użytkowników natychmiast po wygaśnięciu cache (maks. 10 min).
Istniejące kopie robocze dokumentów u użytkowników NIE są usuwane — nadal można
z nich korzystać, ale pojawi się ostrzeżenie o niedostępnym szablonie.

---

## Jak dodać zupełnie nowy szablon (przyszłość)

Gdy będziesz chciał dodać nową kategorię dokumentów (np. protokoły odbioru), potrzebne są:

1. **Aktualizacja repo** (zgłoś deweloperowi):
   - Dodanie wpisu do `src/data/premiumTemplateInventory.ts`
   - Nowa migracja SQL z `INSERT` do `document_master_templates` (z `is_active = false`)

2. **Upload DOCX** (robisz samodzielnie, tak jak opisano wyżej)

3. **Aktywacja** (SQL jak wyżej)

---

## Konwencja nazewnicza ścieżek plików

Format zawsze jest taki sam:
```
masters/{template_key}/v{version}/{template_key}.docx
```

Gdzie:
- `{template_key}` — unikalny identyfikator szablonu (np. `contract_fixed_price_standard`)
- `{version}` — numer wersji z bazy danych (np. `1.0`)

Przykład:
```
masters/contract_fixed_price_standard/v1.0/contract_fixed_price_standard.docx
```

---

## Czego NIE robić

| Nie rób tego | Dlaczego |
|---|---|
| Nie ustawiaj `is_active = true` przed uploadem pliku | Dokument byłby "aktywny" ale bez treści — martwy przycisk dla użytkownika |
| Nie wgrywaj niekompletnych/roboczych wersji DOCX | Użytkownicy dostają to co wgrasz — dokument trafia do produkcji |
| Nie zmieniaj ścieżki pliku po aktywacji | System przechowuje ścieżkę w rekordach użytkowników — zmiana ją zerwie |
| Nie usuwaj pliku z Storage bez dezaktywacji | Użytkownicy z istniejącymi kopiami stracą dostęp do pliku |
| Nie zmieniaj `template_key` w DB | Klucz jest powiązany z kopiami roboczymi u użytkowników — zmiana je zerwie |

---

## Panel diagnostyczny (dla właściciela/dewelopera)

W aplikacji dostępny jest panel diagnostyczny który pokazuje:
- Stan inventory vs. publish-safe templates
- Które szablony czekają na upload i aktywację
- Oczekiwane ścieżki Storage

Jak włączyć:
```
W przeglądarce, w konsoli deweloperskiej (F12):
localStorage.setItem('FF_OWNER_DIAGNOSTIC', 'true')
// Odśwież stronę i przejdź do /app/ready-documents
// Na dole lewego panelu pojawi się sekcja "Diagnostyka właściciela"
```

Jak wyłączyć:
```
localStorage.removeItem('FF_OWNER_DIAGNOSTIC')
// lub
localStorage.setItem('FF_OWNER_DIAGNOSTIC', 'false')
```

> **Ważne:** Panel diagnostyczny jest tylko do odczytu i nie zmienia żadnych danych.
> Nie jest widoczny dla zwykłych użytkowników aplikacji.

---

## Gdzie szukać pomocy

| Problem | Gdzie sprawdzić |
|---|---|
| Plik nie pojawia się w Storage | Supabase Dashboard → Storage → document-masters |
| Rekord w DB — sprawdzenie | Supabase Dashboard → SQL Editor → `SELECT * FROM document_master_templates` |
| Ścieżka pliku w rekordzie | Pole `docx_master_path` w tabeli `document_master_templates` |
| Aktualny stan inventory | `src/data/premiumTemplateInventory.ts` w repozytorium |
| Opis bramki publish-safe | `docs/MODE_B_PUBLISH_GATE.md` |
| Konwencja ścieżek plików | `src/lib/modeBFileFlow.ts` — funkcja `buildMasterDocxPath()` |
