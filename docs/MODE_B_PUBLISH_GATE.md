# Mode B — Publish Gate (PR-B4)

## Co to jest "publish-safe premium template"?

Szablon (`document_master_templates`) jest traktowany jako **publish-safe** — widoczny i użyteczny
w `/app/ready-documents` — gdy spełnione są **wszystkie** poniższe warunki:

| Warunek | Pole DB | Opis |
|---|---|---|
| Aktywny | `is_active = true` | Właściciel jawnie włączył szablon |
| Ścieżka DOCX | `docx_master_path IS NOT NULL AND != ''` | Ścieżka do pliku zapisana w DB |

### Co ta bramka **nie** gwarantuje

- Że plik DOCX fizycznie istnieje w Supabase Storage (brak live-check sieci).
- Konwencja operacyjna niweluje to ryzyko: właściciel ustawia `is_active=true`
  **dopiero po** przesłaniu pliku do bucketu.

---

## Kiedy dokument pojawia się w `/app/ready-documents`?

Szablon zostanie wyświetlony użytkownikom gdy:

1. Plik DOCX jest przesłany do Supabase Storage (bucket: `document-masters`)
2. Ścieżka pliku jest zapisana w `docx_master_path` rekordu
3. Rekord ma ustawione `is_active = true`

**Domyślny stan po seedzie (PR-05a):** `is_active = false` — szablony są ukryte
do momentu ręcznego aktywowania przez właściciela (patrz sekcja poniżej).

---

## Co właściciel musi zrobić aby opublikować szablon DOCX?

### Krok 1 — Przesłanie pliku DOCX

W **Supabase Dashboard → Storage → document-masters**:

```
Ścieżka docelowa:
  masters/{template_key}/v{version}/{template_key}.docx

Przykład dla umowy ryczałtowej:
  masters/contract_fixed_price_standard/v1.0/contract_fixed_price_standard.docx
```

Dostępne klucze szablonów:
- `contract_fixed_price_standard` — Umowa ryczałtowa
- `contract_cost_plus_standard` — Umowa kosztorysowa
- `contract_with_materials_standard` — Umowa z klauzulą materiałową
- `contract_with_advance_standard` — Umowa z zaliczką i etapami
- `contract_simple_order_standard` — Zlecenie / mini-umowa

### Krok 2 — Aktywowanie rekordu

W **Supabase Dashboard → SQL Editor**:

```sql
UPDATE document_master_templates
SET is_active = true, updated_at = now()
WHERE template_key = 'contract_fixed_price_standard';
```

Po wykonaniu tego SQL szablon natychmiast pojawi się w `/app/ready-documents`
(cache TanStack Query wygasa po 10 minutach lub przy odświeżeniu strony).

### Dezaktywowanie szablonu (np. przy wycofaniu pliku)

```sql
UPDATE document_master_templates
SET is_active = false, updated_at = now()
WHERE template_key = 'contract_fixed_price_standard';
```

Szablon znika z widoku użytkowników. Istniejące instancje dokumentów (kopie robocze)
pozostają nienaruszone — nadal można z nich korzystać, ale wyświetlane jest
ostrzeżenie o niedostępnym szablonie.

---

## Implementacja bramki (PR-B4)

### Warstwa DB (RLS + migracja)

- **RLS policy** (`document_master_templates`): `SELECT` tylko dla `is_active=true`.
- **Migracja `20260407120000`**: resetuje `is_active=false` dla 5 szablonów z PR-05a seed,
  ponieważ pliki DOCX nie zostały jeszcze przesłane.

### Warstwa hooka (`useModeBMasterTemplates`)

```typescript
// Dwa filtry publish-gate:
.eq('is_active', true)                    // 1. aktywny rekord
.not('docx_master_path', 'is', null)     // 2. ścieżka DOCX zarejestrowana
```

### Warstwa typów (`isPublishSafe()`)

```typescript
// src/types/document-mode-b.ts
export function isPublishSafe(template: DocumentMasterTemplate): boolean {
  return (
    template.is_active &&
    typeof template.docx_master_path === 'string' &&
    template.docx_master_path.trim().length > 0
  );
}
```

### Warstwa UI (`ReadyDocuments.tsx`)

- **Liczniki kategorii**: badges w nawigacji lewego panelu pokazują liczbę
  publish-safe szablonów. Wartość `0` oznacza brak gotowych szablonów.
- **Ostrzeżenie o niedostępnym szablonie**: gdy instancja dokumentu wskazuje
  na szablon który przestał być publish-safe (deaktywowany), workspace wyświetla
  amber banner z wyjaśnieniem. Istniejące pliki dokumentu pozostają dostępne.
- **Stan pusty selektora**: jasna informacja że szablony pojawią się po
  przesłaniu plików, bez fałszywych obietnic.

---

## Co PR-B4 nadal nie robi

| Aspekt | Status | Planowany etap |
|---|---|---|
| Live-check istnienia pliku w Storage | Nie zaimplementowane | Przyszły PR (wymagane Edge Function lub signed-URL probe) |
| Pełny edytor DOCX | Nie zaimplementowane | Przyszły etap |
| Upload DOCX przez właściciela z UI | Nie zaimplementowane | Przyszły etap |
| Generowanie DOCX z szablonu | Nie zaimplementowane | Edge Function (osobny PR) |
| Preview PDF szablonu | Nie zaimplementowane | Przyszły etap |

---

## Architektura decyzji

**Wybrany wariant bramki**: Pattern 1 — DB-only publish rule.

**Uzasadnienie:**
- Nie wymaga żadnych wywołań sieciowych do Storage w każdym renderowaniu strony
- Prosto i przewidywalnie — logika w jednym miejscu (hook + migracja)
- Ryzyko "fałszywej gotowości" jest niwelowane przez konwencję operacyjną:
  właściciel aktywuje rekord **po** uploadzie, nie przed
- Live-check Storage to funkcja przyszłego PR gdy DOCX flow będzie kompletny

**Odrzucone alternatywy:**
- Live Storage probe — zbyt kosztowne (N requestów przy każdym renderze kategorii)
- Nowa flaga `is_file_uploaded` — zbędna złożoność, dodatkowa migracja bez wartości
