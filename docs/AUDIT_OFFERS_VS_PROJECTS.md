# Audyt architektury: Oferty vs Projekty

**Data:** 2026-03-11
**Autor:** Claude Opus 4.6 (audyt read-only)
**Branch:** `claude/audit-offers-projects-3tvLH`

---

## Executive verdict

**DOMYŚLNY FLOW POWINIEN BYĆ: OFERTA → AKCEPTACJA → PROJEKT**

---

## Dlaczego to jest poprawny model

### 1. Tak działa rzeczywistość rzemieślnika/budowlańca w Polsce

Prawdziwy cykl pracy fachowca:
- Klient dzwoni/pisze z zapytaniem
- Fachowiec jedzie na wizję lokalną, robi pomiary
- Fachowiec tworzy **ofertę/kosztorys** z pozycjami, cenami, VAT-em
- Wysyła ofertę do klienta (email/PDF/link)
- Klient **akceptuje** lub odrzuca
- Po akceptacji zaczyna się **realizacja = projekt/zlecenie**

**Nikt normalny nie tworzy "projektu" zanim klient powie "tak".** Projekt bez akceptacji to strata czasu na planowanie czegoś, co może nie dojść do skutku.

### 2. Kod już potwierdza ten kierunek

Nowszy system (PR-09 do PR-18) implementuje dokładnie model Oferta → Projekt:

- **Tabela `offers`** (PR-09) jest **samodzielna** — nie ma `project_id`, nie zależy od żadnego projektu
- **Tabela `v2_projects`** (PR-13) ma kolumnę `source_offer_id` — projekt może powstać Z oferty
- **Tabela `offer_items`** (PR-10) — pozycje kosztorysu żyją na ofercie, nie na projekcie
- **`acceptance_links`** (PR-12) — publiczna akceptacja/odrzucenie oferty przez klienta
- **`process_offer_acceptance_action()`** — funkcja DB zmienia status oferty na ACCEPTED/REJECTED
- **Przycisk "Utwórz projekt"** pojawia się **tylko** na zaakceptowanych ofertach (status === 'ACCEPTED')
- **`total_from_offer`** na projekcie — projekt dziedziczy kwotę z oferty

### 3. Stary model (Projekt → Wycena) jest legacy i powinien być wygaszany

Stary system (`projects` + `quotes` + `pdf_data`) implementował model:
- Klient → Projekt → Wycena (quote) → PDF → Wysłanie

Statusy starego `projects`: `'Nowy' | 'Wycena w toku' | 'Oferta wysłana' | 'Zaakceptowany'` — to statusy **ofertowe**, nie projektowe. Nowy `v2_projects` ma poprawne statusy realizacji: `'ACTIVE' | 'COMPLETED' | 'ON_HOLD'`.

---

## Co należy do Ofert (Offers)

| Element | Gdzie żyje | Opis |
|---------|-----------|------|
| Tytuł oferty | `offers.title` | Nazwa/opis zlecenia |
| Klient | `offers.client_id` | Dla kogo oferta |
| Pozycje kosztorysu | `offer_items` | Nazwy, ilości, ceny jednostkowe, VAT |
| Sumy netto/brutto/VAT | `offers.total_net/total_vat/total_gross` | Kalkulacja cenowa |
| Waluta | `offers.currency` | PLN domyślnie |
| Status handlowy | `offers.status` | DRAFT → SENT → ACCEPTED/REJECTED/ARCHIVED |
| Data wysłania | `offers.sent_at` | Kiedy wysłano do klienta |
| Data akceptacji/odrzucenia | `offers.accepted_at/rejected_at` | Decyzja klienta |
| Link do akceptacji | `acceptance_links` | Publiczny URL z tokenem |
| Działania klienta | `offer_public_actions` | Log akceptacji/odrzucenia |
| PDF oferty | Generowanie PDF | Dokument do wysłania |
| Szablon branży | `IndustryTemplateSheet` | AI-generowane szablony |
| Podgląd oferty | `OfferPreviewModal` | Preview przed wysłaniem |
| Wysyłka emailem | `send-offer-email` edge fn | Email z PDF-em |

**Oferta = dokument handlowy. Odpowiada na pytanie: "ILE TO BĘDZIE KOSZTOWAĆ?"**

---

## Co należy do Projektów (Projects)

| Element | Gdzie żyje | Opis |
|---------|-----------|------|
| Tytuł projektu | `v2_projects.title` | Nazwa realizacji |
| Klient | `v2_projects.client_id` | Dziedziczony z oferty lub ręczny |
| Źródłowa oferta | `v2_projects.source_offer_id` | Skąd powstał projekt |
| Status realizacji | `v2_projects.status` | ACTIVE / COMPLETED / ON_HOLD |
| Etapy (kamienie milowe) | `v2_projects.stages_json` | Lista etapów z terminami |
| Postęp % | `v2_projects.progress_percent` | Procent ukończenia |
| Budżet | `v2_projects.budget_net` | Ile mamy do wydania |
| Koszty rzeczywiste | `project_costs` | Materiał, robocizna, dojazdy |
| Burn bar | `BurnBarSection` | Budżet vs wydatki |
| Fotoraport | `photo_report` | Zdjęcia przed/w trakcie/po |
| Lista kontrolna odbioru | `acceptance_checklist` | Punkty do zaznaczenia |
| Podpis klienta (odbiór) | `project_acceptance` | Akceptacja wykonanej pracy |
| Dokumenty projektowe | Dossier (teczka) | Pliki/dokumenty projektu |
| Gwarancja | `WarrantySection` | Karta gwarancyjna |
| Kod QR statusu | `project_public_status_tokens` | Publiczna strona statusu |
| Daty start/koniec | `v2_projects.start_date/end_date` | Harmonogram |

**Projekt = realizacja zlecenia. Odpowiada na pytanie: "JAK IDZIE PRACA?"**

---

## Co użytkownik powinien widzieć w UI

### Główna nawigacja (bez zmian — już poprawna)
```
Dom | Oferty | [+] | Projekty | Więcej
```

### Flow użytkownika — ścieżka główna
```
1. [Oferty] → "Nowa oferta" → Wizard (tytuł, klient, pozycje, ceny)
2. [Oferty] → Podgląd/edycja → "Wyślij do klienta" (email/link)
3. Klient klika link → Akceptuje lub odrzuca
4. [Oferty] → Filtr "Zaakceptowane" → Zielony przycisk "Utwórz projekt"
5. [Projekty] → ProjectHub z etapami, kosztami, zdjęciami, odbiorem
```

### Flow użytkownika — ścieżka alternatywna (ręczny projekt)
```
1. [Projekty] → "Nowy projekt" → Prosty formularz (tytuł, klient opcjonalnie)
2. Projekt BEZ oferty — np. mały remont dla stałego klienta, prace godzinowe
3. Budżet wpisany ręcznie (budget_source = 'MANUAL')
```

### Kluczowe zasady UI
1. **FAB (+) powinien prowadzić do `/app/offers/new`** — nie do `/app/quick-est`
2. **QuoteCreationHub na dashboardzie** powinien prowadzić do tworzenia OFERTY, nie projektu
3. **Na liście ofert** zaakceptowana oferta powinna wyraźnie pokazywać CTA "Utwórz projekt" (już jest)
4. **Na stronie projektu** powinna być widoczna informacja "Powstał z oferty: [nazwa]" z linkiem
5. **Ręczne tworzenie projektu** powinno być dostępne ale drugoplanowe

---

## Co jest obecnie mylące

### 1. QuoteCreationHub prowadzi do `/app/projects/new` zamiast do ofert
**Plik:** `src/components/dashboard/QuoteCreationHub.tsx:29,39,45`

Wszystkie 3 przyciski (głosowy, AI, ręczny) prowadzą do `/app/projects/new`. Użytkownik chce stworzyć wycenę/ofertę, a ląduje w tworzeniu projektu.

### 2. FAB i Quick-Create prowadzą do `/app/quick-est` zamiast `/app/offers/new`
**Pliki:** `NewShellFAB.tsx`, `NewShellTopBar.tsx`, `HomeLobby.tsx`

"Nowa oferta" w menu szybkich akcji prowadzi do QuickEstimate, nie do nowego offers flow.

### 3. Dwie tabele projektów: `projects` (stara) i `v2_projects` (nowa)
**Pliki:** `useProjects.ts` (stara), `useProjectsV2.ts` (nowa)

Dashboard (`useDashboardStats.ts`) nadal czyta ze **starej** tabeli `projects`. ProjectsList czyta z v2. Użytkownik może widzieć niespójne dane.

### 4. Stare statusy projektów to tak naprawdę statusy ofert
**Stara tabela:** `'Nowy' | 'Wycena w toku' | 'Oferta wysłana' | 'Zaakceptowany'`

Te statusy opisują **cykl ofertowy**, nie realizację projektu.

### 5. Stary `quotes` table jest przywiązany do projektu
**Stara tabela:** `quotes.project_id` (FK do `projects`)

W starym modelu wycena żyje **w projekcie**. W nowym modelu pozycje kosztorysu żyją **w ofercie** (`offer_items`). Systemy działają równolegle.

### 6. Brak widocznego połączenia Oferta → Projekt w ProjectHub
Na stronie projektu (ProjectHub) nie ma informacji "Ten projekt powstał z oferty X". Użytkownik traci kontekst.

### 7. HomeLobby ma dwa nieczytelne linki do wycen
`HomeLobby.tsx` ma zarówno "Nowa wycena" (`/app/quick-est`) jak i "Szybka wycena" (`/app/szybka-wycena`). Dwa różne entry pointy do podobnej funkcji.

---

## Najmniejsza bezpieczna sekwencja PR-ów (max 5)

### PR 1: Przekierowanie QuoteCreationHub do flow ofert
**Zmiana:** W `QuoteCreationHub.tsx` zmień nawigację z `/app/projects/new` na `/app/offers/new`.
**Wpływ:** ~10 LOC. Dashboard zacznie kierować do ofert zamiast do projektów.
**Ryzyko:** Niskie.

### PR 2: Unifikacja FAB i Quick-Create do flow ofert
**Zmiana:** W `NewShellFAB.tsx`, `NewShellTopBar.tsx`, `HomeLobby.tsx` zmień "Nowa oferta" z `/app/quick-est` na `/app/offers/new`.
**Wpływ:** ~15 LOC. Wszystkie entry pointy "nowa oferta" prowadzą do jednego flow.
**Ryzyko:** Niskie.

### PR 3: Dodaj link do źródłowej oferty w ProjectHub
**Zmiana:** W `ProjectHub.tsx` — jeśli `source_offer_id` istnieje, pokaż "Powstał z oferty: [tytuł]" z linkiem.
**Wpływ:** ~30 LOC. Użytkownik widzi kontekst handlowy projektu.
**Ryzyko:** Niskie.

### PR 4: Migracja dashboardu ze starej tabeli `projects` na `v2_projects`
**Zmiana:** W `useDashboardStats.ts` zmień `.from('projects')` na `.from('v2_projects')`. Dostosuj statusy.
**Wpływ:** ~50 LOC. Dashboard pokazuje dane z nowego systemu.
**Ryzyko:** Średnie. Wymaga testowania.

### PR 5: Ukryj ręczne tworzenie projektów jako opcję drugoplanową
**Zmiana:** Na stronie `/app/projects` zmień główny CTA z "Nowy projekt" na "Utwórz z oferty" (prowadzący do listy ofert z filtrem ACCEPTED). Zostaw "Nowy projekt (ręczny)" jako mniejszy przycisk secondary.
**Wpływ:** ~40 LOC.
**Ryzyko:** Niskie.

---

## Finalna rekomendacja

**Majster.AI powinien traktować OFERTĘ jako początek każdego zlecenia, a PROJEKT jako jego realizację.**

Obecny kod **już implementuje** ten model w nowym systemie (PR-09 do PR-18). Problem polega na tym, że:
1. **Stary system** (tabela `projects` + `quotes`) nadal żyje i jest widoczny w UI
2. **Entry pointy** (FAB, Dashboard, HomeLobby) prowadzą do starych/niejednoznacznych ścieżek
3. **Użytkownik nie widzi** jasnego połączenia między ofertą a projektem

**5 PR-ów powyżej rozwiąże 80% problemu** bez dotykania bazy danych, bez łamania migracji, bez dużego refactoru. Każdy PR < 50 LOC, każdy można wdrożyć niezależnie.

**Ręczne tworzenie projektu** powinno zostać — ale jako opcja drugoplanowa dla prac, które nie wymagają oferty (drobne naprawy, prace godzinowe dla stałych klientów).

**Stary system `projects` + `quotes`** powinien być stopniowo wygaszany w kolejnych iteracjach (poza zakresem tych 5 PR-ów), ale **nie należy go usuwać nagle** — może mieć dane produkcyjne.

---

## Mapa zależności (schemat)

```
┌─────────────┐
│   KLIENT    │
│  (clients)  │
└──────┬──────┘
       │ client_id
       ▼
┌─────────────────────────────────────────────────┐
│                    OFERTA                        │
│                   (offers)                       │
│                                                  │
│  status: DRAFT → SENT → ACCEPTED/REJECTED       │
│  offer_items: pozycje kosztorysu                 │
│  acceptance_links: publiczny link                │
│  offer_public_actions: log decyzji               │
│  PDF + email wysyłka                             │
└──────────┬──────────────────────────────────────┘
           │ source_offer_id (po akceptacji)
           ▼
┌─────────────────────────────────────────────────┐
│                   PROJEKT                        │
│                (v2_projects)                     │
│                                                  │
│  status: ACTIVE → COMPLETED / ON_HOLD            │
│  stages_json: etapy realizacji                   │
│  progress_percent: postęp                        │
│  budget_net: budżet (z oferty lub ręczny)        │
│  project_costs: koszty rzeczywiste               │
│  photo_report: fotoraport                        │
│  acceptance_checklist: lista kontrolna            │
│  project_acceptance: podpis odbioru               │
│  project_public_status_tokens: QR status          │
│  warranty: karta gwarancyjna                      │
└─────────────────────────────────────────────────┘
```
