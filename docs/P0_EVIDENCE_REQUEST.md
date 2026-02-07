# P0 Evidence Request — Screenshot Collection Guide for Owner

**Cel:** zebrać brakujące dowody (screenshoty + linki) do zamknięcia P0 „Deployment Truth".
**Kto wykonuje:** Product Owner (Robert) — jedyna osoba z dostępem do paneli Vercel i Supabase.
**Szacowany czas:** 10–15 minut.
**Zasada:** Bez twardych dowodów = FAIL. Nie zgadujemy, nie zakładamy.

> **WAŻNE:** Wklejamy tylko metadane i screeny. Bez sekretów, bez pełnych tokenów, bez haseł.

---

## Jak dostarczyć dowody

1. Zrób screenshoty (Print Screen / Cmd+Shift+4 na Mac / narzędzie wycinania na Windows).
2. Wklej screeny do pliku `docs/P0_EVIDENCE_PACK.md` (lub dodaj jako obrazki w komentarzu GitHub Issue/PR).
3. Przy każdym dowodzie napisz: data, środowisko (Production/Preview), PASS lub FAIL.
4. Jeśli coś nie istnieje lub jest inaczej niż oczekiwano — napisz co widzisz. To też jest ważna informacja.

---

## CZĘŚĆ A: Vercel (5 screenshotów)

### A1. Git Integration (repo + branch)

**Gdzie:** Vercel → twój projekt → Settings → Git
**Co zrobić:** Zrób screenshot pokazujący:
- Nazwę podpiętego repozytorium (np. `RobertB1978/majster-ai-oferty`)
- Production Branch (powinno być `main`)

**Oczekiwany wynik:** Widoczne repo i branch `main`.

```
A1: ☐ Zrobione / ☐ Nie mogę znaleźć / ☐ Wygląda inaczej niż oczekiwano
Data: ____________  Środowisko: Production
Notatki: ____________________________________________
```

---

### A2. Ostatni deploy produkcyjny

**Gdzie:** Vercel → twój projekt → Deployments
**Co zrobić:** Zrób screenshot pokazujący:
- Najnowszy deployment ze statusem **"Ready"** (zielona ikonka)
- Datę i godzinę tego deploymentu
- Oznaczenie "Production" przy tym deploymencie

**Oczekiwany wynik:** Widać co najmniej jeden deployment z zielonym statusem "Ready" oznaczony jako "Production".

```
A2: ☐ Zrobione / ☐ Nie mogę znaleźć / ☐ Wygląda inaczej niż oczekiwano
Data: ____________  Środowisko: Production
Notatki: ____________________________________________
```

---

### A3. Commit SHA deploymentu

**Gdzie:** Vercel → Deployments → kliknij na ostatni produkcyjny deploy → Deployment Details
**Co zrobić:** Zrób screenshot lub skopiuj tekst pokazujący:
- Numer commitu (SHA) użytego do tego deploymentu (np. `143ba55`)
- Powinien zgadzać się z commitem widocznym na GitHub

**Oczekiwany wynik:** Widoczny commit SHA, który można sprawdzić na GitHub.

```
A3: ☐ Zrobione / ☐ Nie mogę znaleźć / ☐ Wygląda inaczej niż oczekiwano
Commit SHA: ____________
Notatki: ____________________________________________
```

---

### A4. Zmienne środowiskowe (Environment Variables)

**Gdzie:** Vercel → twój projekt → Settings → Environment Variables
**Co zrobić:** Zrób screenshot pokazujący:
- **Nazwy** zmiennych (NIE wartości! Wartości powinny być ukryte/zamaskowane)
- Zakresy (Production, Preview, Development)
- Szukamy przede wszystkim: `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`

**UWAGA:** NIE pokazuj wartości zmiennych — to sekrety! Pokazuj tylko nazwy i zakresy.

**Oczekiwany wynik:** Co najmniej `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` widoczne z zakresem "Production".

```
A4: ☐ Zrobione / ☐ Nie mogę znaleźć / ☐ Wygląda inaczej niż oczekiwano
Data: ____________  Środowisko: Production
Widoczne zmienne (same nazwy):
  ☐ VITE_SUPABASE_URL
  ☐ VITE_SUPABASE_ANON_KEY
  ☐ inne (wymień): ________________________________
Notatki: ____________________________________________
```

---

### A5. Produkcyjny URL (test ręczny)

**Gdzie:** Otwórz produkcyjny URL aplikacji w przeglądarce
**Co zrobić:**
1. Wklej URL produkcyjny: `https://____________.vercel.app` (lub domena custom)
2. Sprawdź, czy strona się otwiera (nie biały ekran, nie błąd 404/500)
3. Zrób screenshot strony głównej / strony logowania

**Oczekiwany wynik:** Aplikacja się otwiera, widać stronę logowania lub landing page.

```
A5: ☐ Zrobione / ☐ Strona się nie otwiera / ☐ Biały ekran / ☐ Błąd
URL: ____________________________________________
Data: ____________
Notatki: ____________________________________________
```

---

## CZĘŚĆ B: Supabase (6 screenshotów)

### B1. Project ID

**Gdzie:** Supabase Dashboard → twój projekt → Project Settings → General
**Co zrobić:** Zrób screenshot pokazujący:
- Project ID (Reference ID)
- Nazwę projektu

```
B1: ☐ Zrobione / ☐ Nie mogę znaleźć / ☐ Wygląda inaczej niż oczekiwano
Project ID: ____________
Notatki: ____________________________________________
```

---

### B2. Lista migracji

**Gdzie:** Supabase Dashboard → Database → Migrations
**Co zrobić:** Zrób screenshot pokazujący:
- Pełną listę migracji (może wymagać przewinięcia)
- Policz ile migracji widzisz

**Oczekiwany wynik:** W repo jest 22 plików migracji. Na dashboardzie powinno być tyle samo (lub więcej, jeśli były ręczne zmiany).

```
B2: ☐ Zrobione / ☐ Nie mogę znaleźć / ☐ Wygląda inaczej niż oczekiwano
Liczba migracji na dashboardzie: ____
Liczba migracji w repo: 22
Zgodność: ☐ TAK / ☐ NIE / ☐ NIE WIEM
Notatki: ____________________________________________
```

---

### B3. Tabele w bazie danych

**Gdzie:** Supabase Dashboard → Table Editor (menu boczne)
**Co zrobić:** Zrób screenshot listy tabel widocznych w menu bocznym. Szukamy kluczowych tabel:
- `profiles`, `clients`, `projects`, `quotes`, `offers`

```
B3: ☐ Zrobione / ☐ Nie mogę znaleźć / ☐ Wygląda inaczej niż oczekiwano
Widoczne tabele kluczowe:
  ☐ profiles
  ☐ clients
  ☐ projects
  ☐ quotes
  ☐ offers
Notatki: ____________________________________________
```

---

### B4. Edge Functions (lista wdrożonych funkcji)

**Gdzie:** Supabase Dashboard → Edge Functions
**Co zrobić:** Zrób screenshot listy funkcji. Powinno być 16 funkcji (plus `_shared`).

**Oczekiwany wynik:** Funkcje mają status "Active" lub "Deployed".

```
B4: ☐ Zrobione / ☐ Nie mogę znaleźć / ☐ Wygląda inaczej niż oczekiwano
Liczba funkcji na dashboardzie: ____
Liczba funkcji w repo: 16
Zgodność: ☐ TAK / ☐ NIE / ☐ NIE WIEM
Notatki: ____________________________________________
```

---

### B5. Auth — konfiguracja URL

**Gdzie:** Supabase Dashboard → Authentication → URL Configuration
**Co zrobić:** Zrób screenshot pokazujący:
- **Site URL** — powinien wskazywać na produkcyjny URL z Vercel (ten sam co A5)
- **Redirect URLs** — lista dozwolonych adresów przekierowań

```
B5: ☐ Zrobione / ☐ Nie mogę znaleźć / ☐ Wygląda inaczej niż oczekiwano
Site URL: ____________________________________________
Redirect URLs (lista): ________________________________
Zgodność z URL Vercel: ☐ TAK / ☐ NIE / ☐ NIE WIEM
Notatki: ____________________________________________
```

---

### B6. Test działania funkcji (1 wywołanie)

**Gdzie:** Supabase Dashboard → Edge Functions → wybierz `healthcheck` (lub inną) → Logs
**Co zrobić:**
1. Wywołaj funkcję (kliknij "Invoke" w panelu lub otwórz URL funkcji w przeglądarce)
2. Zrób screenshot logu z wynikiem (status code + timestamp)

**Oczekiwany wynik:** Status 200 i timestamp.

**Alternatywa:** Jeśli `healthcheck` nie jest wdrożony, wybierz dowolną inną funkcję i pokaż log.

```
B6: ☐ Zrobione / ☐ Nie mogę znaleźć / ☐ Funkcja nie odpowiada
Funkcja: ____________
Status code: ____
Timestamp: ____________
Notatki: ____________________________________________
```

---

## Podsumowanie — co dostarczyć (minimum 11 pozycji)

| # | Element | Źródło | Zrobione? |
|---|---------|--------|-----------|
| A1 | Git integration (repo + branch) | Vercel | ☐ |
| A2 | Ostatni deploy produkcyjny (Ready + data) | Vercel | ☐ |
| A3 | Commit SHA deploymentu | Vercel | ☐ |
| A4 | Nazwy zmiennych środowiskowych + zakresy | Vercel | ☐ |
| A5 | Produkcyjny URL + screenshot strony | Przeglądarka | ☐ |
| B1 | Project ID | Supabase | ☐ |
| B2 | Lista migracji (ilość + screenshot) | Supabase | ☐ |
| B3 | Lista tabel kluczowych | Supabase | ☐ |
| B4 | Lista Edge Functions (ilość + status) | Supabase | ☐ |
| B5 | Auth URL Configuration | Supabase | ☐ |
| B6 | Test 1 funkcji (status 200 + timestamp) | Supabase | ☐ |

---

## Co dalej po zebraniu dowodów

1. Wklej screeny i notatki do `docs/P0_EVIDENCE_PACK.md`.
2. Poinformuj Claude / Tech Lead, że dowody są gotowe.
3. Każdy element zostanie oceniony jako PASS lub FAIL w `docs/PROD_VERIFICATION.md`.
4. Jeśli wszystkie 11 elementów = PASS → PR#01 zamknięty, projekt przechodzi do fazy Beta.
5. Jeśli cokolwiek = FAIL → dokładny plan naprawczy zostanie przygotowany.

---

## Masz problem?

- **Nie widzisz danej opcji w panelu:** Napisz co widzisz — może interfejs się zmienił. To też jest ważna informacja.
- **Nie masz dostępu:** Napisz kto ma dostęp — musimy ustalić kto może dostarczyć dowody.
- **Coś wygląda inaczej:** Zrób screenshot tego, co widzisz, i opisz różnicę. Nie zgadujemy.
