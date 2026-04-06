# ADR-0013: Dynamiczny DOCX — Tryb B dokumentów bazowych

**Data:** 2026-04-06
**Status:** Accepted
**Decydenci:** RobertB1978 (Product Owner), Claude Sonnet 4.6 (Tech Lead)
**Powiązane PR-y:** PR-00 (ten ADR), PR-01 (infrastruktura feature flag), PR-02 (pilot techniczny), PR-03+ (produkcja)

---

## 1. Kontekst

W systemie Majster.AI istnieje Tryb A generowania dokumentów (PDF, flow ofertowy). Tryb A działa stabilnie i nie jest przedmiotem tej decyzji. Właściciel produktu zdecydował o wprowadzeniu Trybu B obsługującego pełne dokumenty bazowe (umowy, protokoły, kosztorysy) w formacie DOCX z dynamicznym podstawianiem danych z platformy.

Wymaganie dynamicznego DOCX zostało odblokowane decyzją właściciela produktu 2026-04-06. Nie jest to późniejszy etap — jest to wymaganie bieżące.

Niniejszy ADR zamyka wszystkie krytyczne decyzje wykonawcze dla Trybu B, tak aby kolejne PR-y nie zgadywały architektury.

---

## 2. Problem do rozwiązania

### Pytania wymagające zamknięcia przed PR-01:

| Nr | Pytanie | Status po ADR-0013 |
|----|---------|-------------------|
| P1 | Czy DOCX jest wymagany, czy opcjonalny? | **Wymagany.** Nie negocjujemy. |
| P2 | Czy Tryb A jest ruszany? | **Nie.** Tryb A pozostaje nienaruszony. |
| P3 | Który silnik DOCX templatingu? | `docxtemplater` + `pizzip` — patrz Plan A. |
| P4 | Gdzie wykonywany jest generator? | Po stronie serwera (Supabase Edge Function). |
| P5 | Co jeśli Deno/Edge nie daje rady? | Plan B — Node-based serverless runtime. |
| P6 | Jak zamknąć decyzję GO/NO-GO? | Po pilocie PR-02 — jawna decyzja. |
| P7 | Który dokument pilotowy? | „Protokół odbioru końcowego" — bez zamiany. |

---

## 3. Decyzja główna

### 3.1 Tryb B działa obok Trybu A

Tryb B jest osobnym, niezależnym flow generowania dokumentów. Tryb A pozostaje nienaruszony. Oba tryby koegzystują w produkcie pod oddzielnymi ścieżkami kodu i osobnymi entry pointami UI.

Tryb B od momentu wdrożenia do czasu zakończenia pilota i stabilizacji działa **wyłącznie pod feature flagą** (`mode_b_docx_enabled`). Flaga ta jest wyłączona domyślnie na produkcji.

### 3.2 Format wyjściowy Trybu B

Tryb B generuje pliki `.docx` (Office Open XML). Nie generuje PDF jako podstawowego wyjścia. Konwersja DOCX → PDF może być rozważona w późniejszych PR-ach jako opcja dodatkowa — nie jest częścią scope'u PR-01 do PR-05.

### 3.3 Disclaimer obowiązkowy dla wszystkich dokumentów Trybu B

Każdy dokument generowany przez Tryb B musi zawierać w stopce lub nagłówku czytelny zapis:

> „Wzór do dostosowania i weryfikacji prawnej przed użyciem."

Disclaimer ten jest obowiązkowy i nie może być wyłączony przez użytkownika. Jest częścią każdego master DOCX template'u.

---

## 4. Plan A

### 4.1 Silnik DOCX templatingu

**Wybrany silnik: `docxtemplater` (v3.x) + `pizzip` (v3.x)**

**Uzasadnienie wyboru:**

| Kryterium | Ocena |
|-----------|-------|
| Logika templatingu (placeholdery, pętle, warunki) | Tak — wbudowane `{tag}`, `{#sekcja}..{/sekcja}` |
| Obsługa tabel i sekcji warunkowych | Tak — natywna |
| Obsługa polskich znaków (UTF-8) | Tak — DOCX jest XML+ZIP, encoding UTF-8 natywnie |
| Brak zależności od Node-only API (`fs`, `path`, `child_process`) | Tak — `docxtemplater` i `pizzip` są bibliotekami pure-JS/browser-compatible |
| Praca na binarnym buforze (Uint8Array / ArrayBuffer) | Tak — `pizzip` akceptuje `ArrayBuffer` i zwraca `Uint8Array` |
| Licencja | MIT (docxtemplater core) |
| Popularność / aktywne utrzymanie | Tak (>3M pobrań/tydzień npm, 2024–2025 releases) |

**Deklaracja kompatybilności z Supabase Edge / Deno:**

`docxtemplater` + `pizzip` są projektowane jako browser-compatible (pure JS, brak Node-only API). Deno wspiera większość bibliotek npm bez zależności od API systemowych. Jednak:

> **RYZYKO BLOKUJĄCE PILOT PR-02:** Kompatybilność z runtime Supabase Edge (Deno) nie może być uczciwie potwierdzona bez uruchomienia kodu. Import przez `npm:docxtemplater` i `npm:pizzip` w Deno nie jest przetestowany w tym projekcie. Może wystąpić niekompatybilność w zakresie bundlowania, rozmiaru bundla (limit Edge Function) lub zachowania binarnego bufora. Pilot PR-02 jest jedynym dowodem potwierdzającym lub obalającym tę hipotezę.

### 4.2 Architektura wykonania

```
[Frontend UI — Tryb B]
        |
        | HTTP POST /functions/v1/generate-docx-mode-b
        |
[Supabase Edge Function — Deno runtime]
        |
        |-- pobierz dane projektu/klienta/oferty z bazy (service_role)
        |-- pobierz master DOCX template z Supabase Storage
        |-- wykonaj docxtemplater.render(template, dane)
        |-- zwróć binarny plik .docx jako Response (Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document)
        |
[Frontend — pobieranie pliku przez użytkownika]
```

### 4.3 Przechowywanie szablonów

Master DOCX template'y przechowywane są w Supabase Storage w dedykowanym, niepublicznym bucket'cie (`docx-templates`). Dostęp tylko przez service_role wewnątrz Edge Function. Użytkownicy nie mają bezpośredniego dostępu do surowych plików szablonów.

### 4.4 Pilot techniczny PR-02 — obowiązkowy

Przed wdrożeniem jakiegokolwiek dokumentu produkcyjnego w Trybie B, PR-02 musi zrealizować i zaliczyć pilot techniczny z dokumentem „Protokół odbioru końcowego".

**Dokument pilotowy jest sztywno ustalony: „Protokół odbioru końcowego".**
Bez negocjacji. Bez zamiany na prostszy dokument. Uzasadnienie: ten dokument ma tabele, sekcje warunkowe i polskie znaki — jest reprezentatywny dla najtrudniejszych przypadków użycia Trybu B.

---

## 5. Kryteria sukcesu pilota PR-02

Wszystkie poniższe kryteria muszą być spełnione łącznie. Brak któregokolwiek = pilot niezaliczony.

| Nr | Kryterium | Mierzalne warunki |
|----|-----------|-------------------|
| S1 | Master DOCX z placeholderami | Plik `.docx` z placeholderami `{tag}`, `{#sekcja}..{/sekcja}` istnieje w Storage i jest ładowany przez Edge Function |
| S2 | Poprawne podstawienie danych | Wszystkie zdefiniowane placeholdery są zastąpione danymi testowymi; zero literalnych `{tag}` w wyjściowym DOCX |
| S3 | Poprawny output DOCX | Wygenerowany plik otwiera się w Microsoft Word i LibreOffice bez błędów i ostrzeżeń |
| S4 | Polskie znaki | Wszystkie polskie znaki (ą ę ó ś ź ż ć ń ł) poprawnie renderują się w wygenerowanym DOCX |
| S5 | Tabele | Tabele z danych (np. lista pozycji kosztorysu) generują się z poprawną liczbą wierszy, bez uszkodzonej struktury XML |
| S6 | Sekcje warunkowe | Sekcje obecne/nieobecne w zależności od danych wejściowych renderują się poprawnie |
| S7 | End-to-end flow pobrania | Użytkownik (w środowisku testowym) klika „Pobierz DOCX", plik jest pobierany i otwarty jako poprawny dokument |
| S8 | Disclaimer | Wygenerowany dokument zawiera wymagany disclaimer „Wzór do dostosowania i weryfikacji prawnej przed użyciem." |
| S9 | Runtime — akceptowalny czas | Edge Function kończy się w czasie < 25 sekund dla dokumentu pilotowego (wewnętrzny target jakościowy pilota; faktyczny limit timeout platformy Supabase Edge do zweryfikowania w PR-02 — nie jest to limit platformy, tylko target użyteczności) |
| S10 | Runtime — brak błędów krytycznych | Brak wyjątków runtime w logach Supabase Edge podczas generowania |

---

## 6. Kryteria porażki pilota PR-02

Wystąpienie któregokolwiek z poniższych = pilot niezaliczony = uruchamiamy Plan B.

| Nr | Kryterium porażki |
|----|-------------------|
| F1 | Wygenerowany DOCX jest uszkodzony (nie otwiera się lub zgłasza błąd naprawy w Word/LibreOffice) |
| F2 | Layout dokumentu jest rozwalony (tabele przekroczone, zawartość poza sekcjami, brakujące wiersze) |
| F3 | Placeholdery nie są zastępowane lub zastępowane częściowo (literalne `{tag}` w wyjściu) |
| F4 | Edge Function zwraca timeout lub błąd 5xx przy generowaniu dokumentu pilotowego |
| F5 | Import `npm:docxtemplater` lub `npm:pizzip` powoduje błąd bundlowania w Deno/Edge |
| F6 | Rozmiar bundla Edge Function przekracza limit Supabase (aktualnie 20 MB skompresowane) po dodaniu bibliotek DOCX |
| F7 | Polskie znaki są uszkodzone w wyjściowym DOCX (mojibake, znaki zastępcze) |
| F8 | Biblioteka zachowuje się niestabilnie (inne wyniki przy tych samych danych wejściowych) |

---

## 7. Plan B

### 7.1 Warunki uruchomienia Planu B

Plan B jest uruchamiany, gdy pilot PR-02 nie zalicza się (wystąpi jedno lub więcej kryteriów porażki z sekcji 6).

### 7.2 Cel dynamicznego DOCX pozostaje nienaruszony

**Plan B nie jest rezygnacją z DOCX.** Nie przechodzimy na PDF-only. Nie upraszczamy wymagania. Cel — dynamiczny DOCX z pełnymi danymi platformy — pozostaje niezmieniony.

### 7.3 Zmiana runtime

Jeśli Supabase Edge / Deno runtime nie daje rady z generatorem DOCX, generator przenoszony jest do **Node.js-based serverless runtime**. Kandydaci (do oceny w momencie uruchomienia Planu B):

| Opcja | Opis |
|-------|------|
| Vercel Serverless Function (Node 20) | Osobna funkcja w tym samym repozytorium, wywoływana przez Edge Proxy |
| Dedykowany mikroserwis Node.js | Osobny deployment z single endpoint `/generate-docx` |

Wybór konkretnego podejścia Node.js zapada w osobnym mini-ADR w momencie uruchomienia Planu B.

### 7.4 Biblioteka DOCX w Planie B

W Planie B ta sama biblioteka (`docxtemplater` + `pizzip`) pozostaje pierwszym kandydatem — w środowisku Node.js jej kompatybilność jest dobrze udokumentowana. Jeśli biblioteka sama w sobie jest problemem (nie runtime), oceniamy alternatywę: `docx` (docx.js) — do budowania struktury DOCX od zera bez template.

### 7.5 Feature flaga w Planie B

Tryb B pozostaje pod feature flagą (`mode_b_docx_enabled`) przez cały czas trwania Planu B do czasu uzyskania stabilności produkcyjnej.

---

## 8. GO / NO-GO po PR-02

Po zakończeniu pilota PR-02 musi zapaść **jawna decyzja GO / NO-GO**. Milczenie = NO-GO.

### GO — warunki

- Wszystkie kryteria sukcesu S1–S10 zaliczone.
- Żadne kryterium porażki F1–F8 nie wystąpiło.
- Product Owner zatwierdza wynik pilota.

**Konsekwencje GO:** Kontynuujemy PR-03 (infrastruktura Edge Function produkcyjna), PR-04 (UI Trybu B), PR-05a/b/c (dokumenty contentowe).

### NO-GO — warunki

- Wystąpiło jedno lub więcej kryteriów porażki F1–F8.
- LUB Product Owner nie zatwierdza wyniku pilota.

**Konsekwencje NO-GO:** Uruchamiamy Plan B (sekcja 7). PR-03 nie startuje do czasu zaliczenia Planu B. Feature flaga pozostaje wyłączona na produkcji.

### Blokada dalszych PR-ów przy NO-GO

Przy decyzji NO-GO **żaden PR-03, PR-04, PR-05x nie może startować** dopóki Plan B nie zaliczy równoważnego pilota technicznego z dokumentem „Protokół odbioru końcowego" i tymi samymi kryteriami sukcesu S1–S10.

---

## 9. Konsekwencje decyzji

### 9.1 Co ta decyzja upraszcza

- Eliminuje zgadywanie architektury w PR-01 do PR-05.
- Zamyka wybór biblioteki — nie ma dyskusji per-PR.
- Definiuje jeden punkt weryfikacji (PR-02 pilot) zamiast odkrywania problemów runtime w produkcji.
- Tryb A jest chroniony — brak ryzyka regresji istniejącego flow.

### 9.2 Ryzyka

| Nr | Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|----|--------|--------------------|-------|-----------|
| R1 | `docxtemplater`+`pizzip` niekompatybilne z Deno Edge runtime | Średnie | Wysoki (blokuje Plan A) | Pilot PR-02 jako obowiązkowy etap weryfikacji |
| R2 | Rozmiar bundla Edge Function przekracza limit po dodaniu bibliotek DOCX | Niskie-Średnie | Wysoki (blokuje deployment) | Zmierzyć w PR-02 przed wdrożeniem prod |
| R3 | Plan B (Node runtime) wymaga dodatkowego kosztu infrastrukturalnego | Niskie | Średni | Ocenić opcje darmowe/tanie przy uruchamianiu Planu B |
| R4 | Złożone dokumenty (duże tabele, wiele sekcji) przekraczają timeout platformy lub powodują nieakceptowalny czas odpowiedzi | Niskie | Wysoki | Pilot PR-02 mierzy realny czas generowania; faktyczny limit timeout platformy Supabase Edge do zweryfikowania w trakcie pilota |
| R5 | Nieznane niezgodności formatowania DOCX między Word a LibreOffice | Niskie | Średni | Kryterium S3 wymaga testu w obu aplikacjach |

### 9.3 Co blokuje dalsze PR-y

| Bloker | Blokowane PR-y |
|--------|----------------|
| Pilot PR-02 niezaliczony (NO-GO) | PR-03, PR-04, PR-05a, PR-05b, PR-05c |
| Brak jawnej decyzji GO/NO-GO po PR-02 | Jak wyżej (milczenie = NO-GO) |
| Plan B nieukończony (jeśli NO-GO) | Jak wyżej, dopóki Plan B nie zalicza pilota |

---

## 10. Zakres kolejnych PR-ów po PR-00

### PR-01 — Fundament: model danych, typy, feature flaga
**Scope:**
- Implementacja feature flagi `mode_b_docx_enabled` (domyślnie `false`)
- Definicja interfejsów TypeScript dla danych wejściowych generatora (model danych)
- Definicja struktury registry master templates (typy / model — bez plików DOCX)

**Zakaz:** Brak pliku DOCX pilota. Brak instalacji bibliotek DOCX. Brak kodu generatora. Brak UI. Brak uploadu do Storage.

### PR-02 — Pilot techniczny: master DOCX + generator w Edge Function
**Scope:**
- Stworzenie master DOCX template „Protokół odbioru końcowego" z placeholderami
- Upload template do Supabase Storage bucket `docx-templates`
- Instalacja `docxtemplater` + `pizzip` w Edge Function
- Implementacja Edge Function `generate-docx-mode-b` (minimalny flow)
- Test end-to-end z dokumentem „Protokół odbioru końcowego"
- Weryfikacja kryteriów S1–S10
- Raport pilota + jawna decyzja GO/NO-GO

**Zakaz:** Brak UI produkcyjnego. Brak innych dokumentów niż pilotowy. Brak deployment na produkcję.

### PR-03 — Infrastruktura produkcyjna Edge Function (tylko po GO)
**Scope:** Pełna infrastruktura generatora, obsługa błędów, logowanie, RLS na templates.

### PR-04 — UI Trybu B (tylko po GO)
**Scope:** Interfejs użytkownika do inicjowania generowania i pobierania DOCX.

### PR-05a / PR-05b / PR-05c — Dokumenty contentowe (tylko po GO)
**Scope:** Kolejne master template'y dokumentów biznesowych.

**ZASADA OBOWIĄZUJĄCA DLA PR-05a/b/c:**
Wszystkie PR-05x używają **wyłącznie biblioteki DOCX potwierdzonej w PR-02** zgodnie z tym ADR. Instalacja nowej biblioteki DOCX w PR-05x lub późniejszych jest zakazana bez nowego jawnego ADR zatwierdzonego przez Product Ownera.

---

## Alternatywy odrzucone

| Opcja | Powód odrzucenia |
|-------|-----------------|
| PDF-only dla Trybu B | Właściciel produktu zdecydował: wymagany jest edytowalny DOCX |
| Generowanie DOCX po stronie klienta (frontend) | Eksponuje logikę biznesową i szablony; brak kontroli serwera; ryzyko bezpieczeństwa |
| `officegen` jako silnik DOCX | Zależność od Node-only API — niezgodna z Deno Edge runtime |
| LibreOffice server-side | Zbyt duże obciążenie infrastrukturalne; niekompatybilny z Edge Functions |
| Odłożenie dynamicznego DOCX na późniejszy etap | Odrzucone decyzją właściciela produktu 2026-04-06 |

---

## Podpis decyzji

| Rola | Osoba | Data |
|------|-------|------|
| Product Owner | RobertB1978 | 2026-04-06 |
| Tech Lead | Claude Sonnet 4.6 | 2026-04-06 |

---

*ADR-0013 jest dokumentem wykonawczym. Kolejne PR-y nie mogą wprowadzać decyzji architektonicznych sprzecznych z tym dokumentem bez nowego jawnego ADR.*
