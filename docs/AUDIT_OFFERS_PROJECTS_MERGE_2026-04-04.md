# RAPORT AUDYTOWY: Analiza polaczenia modulow Oferty i Projekty

## Majster.AI — Enterprise Architecture Audit Report
**Data:** 2026-04-04 | **Autor:** Lead Engineer | **Wersja:** 1.0

---

## 1. EXECUTIVE SUMMARY

Po doglebnej analizie ~50 plikow zrodlowych, 4 tabel bazodanowych, 18 hookow React i pelnego flow uzytkownika:

**Oferty i Projekty NIE powinny byc laczone w jedna tabele, ALE powinny byc polaczone w jeden spojny pipeline widoczny jako jednolity przeplyw pracy.**

Aktualnie system **juz ma** relacje Oferta -> Projekt (przez `source_offer_id`), ale jest ona zbyt luzna i tworzy zamieszanie u uzytkownika. Rekomendacja: **Pipeline View** — jeden widok "Zlecenia" z fazami, nie dwa osobne moduly.

---

## 2. AKTUALNY STAN ARCHITEKTURY

### 2.1 Modul Ofert (tabela `offers`)
| Aspekt | Wartosc |
|--------|---------|
| Tabela DB | `offers` (PR-09) |
| Powiazane tabele | `offer_items`, `offer_variants`, `offer_sends`, `offer_approvals`, `offer_acceptance_tokens` |
| Statusy | `DRAFT -> SENT -> ACCEPTED / REJECTED / ARCHIVED` |
| Pliki komponentow | 15 plikow w `src/components/offers/` |
| Hooki | 9 hookow (`useOffers`, `useOfferWizard`, `useOfferStats`, itd.) |
| Strony | 5 stron (`Offers`, `OfferDetail`, `OfferApproval`, `OfferPublicPage`, `OfferPublicAccept`) |
| Glowna wartosc | Tworzenie wycen, generowanie PDF, wysylka do klienta, akceptacja online |

### 2.2 Modul Projektow (tabela `v2_projects`)
| Aspekt | Wartosc |
|--------|---------|
| Tabela DB | `v2_projects` (PR-13) + legacy `projects` |
| Powiazane tabele | `project_costs`, `project_checklists`, `project_dossier_items`, `project_public_status_tokens` |
| Statusy | `ACTIVE -> COMPLETED / ON_HOLD / CANCELLED` |
| Pliki komponentow | ~12 plikow w `src/components/costs/`, `photos/`, `documents/` |
| Hooki | 7 hookow (`useProjectsV2`, `useProjectCosts`, `useProjectPhotos`, itd.) |
| Strony | 3 strony (`ProjectsList`, `ProjectHub`, `ProjectPublicStatus`) |
| Glowna wartosc | Zarzadzanie realizacja, etapy, koszty, fotodokumentacja, odbior, gwarancja |

### 2.3 Istniejace powiazanie
```
v2_projects.source_offer_id -> offers.id (FK, ON DELETE SET NULL)
```
- Projekt powstaje z zaakceptowanej oferty (przycisk "Utworz projekt" w AcceptanceLinkPanel)
- Istnieje unique index zapobiegajacy duplikatom
- Na liscie ofert wyswietla sie badge statusu projektu
- Budzet projektu pobierany z `total_net` oferty

### 2.4 Legacy: tabela `projects` (stary system)
Istnieje stara tabela `projects` z polskimi statusami (`Nowy`, `Wycena w toku`, `Oferta wyslana`, `Zaakceptowany`) — jest deprecated ale nadal uzywana przez Kalendarz i Gantt (FK constraints).

---

## 3. ANALIZA: CZY LACZENIE MA SENS?

### 3.1 Argumenty ZA polaczeniem (w jedna tabele)

| # | Argument | Waga |
|---|----------|------|
| 1 | Uzytkownik nie rozumie roznicy "Oferta vs Projekt" | Wysoka |
| 2 | Mniej klikniec — jeden flow zamiast dwoch | Wysoka |
| 3 | Latwiejsze raportowanie (jeden pipeline) | Srednia |
| 4 | Mniej duplikacji kodu (statusy, filtry, listy) | Srednia |

### 3.2 Argumenty PRZECIW polaczeniu (w jedna tabele)

| # | Argument | Waga |
|---|----------|------|
| 1 | **Fundamentalnie rozne modele danych** — oferta ma items/variants/ceny/VAT, projekt ma stages/progress/koszty/zdjecia | **Krytyczna** |
| 2 | **Zlamanie RLS i migracji** — naruszenie regul CLAUDE.md (nigdy nie rename'uj tabel) | **Krytyczna** |
| 3 | **Ogromny blast radius** — 34+ plikow do modyfikacji, 4+ tabele FK | Wysoka |
| 4 | Oferta moze NIE stac sie projektem (odrzucona) | Wysoka |
| 5 | Projekt moze powstac BEZ oferty (bezposrednie zlecenie) | Wysoka |
| 6 | Rozne cykle zycia i uprawnienia (publiczny link oferty vs QR projektu) | Srednia |

### 3.3 Werdykt: Laczenie tabel

> **WERDYKT: NIE laczyc tabel `offers` i `v2_projects`.**

Powody:
- Dane sa fundamentalnie rozne (wycena != realizacja)
- Ryzyko regresji: 34+ plikow, 18 hookow, 4+ tabele powiazane
- Lamie zasady migracji CLAUDE.md
- Szacowany czas: 3-4 tygodnie, ~2000+ LOC zmian
- Ryzyko: WYSOKIE — zlamanie flow PDF, emaili, akceptacji online

---

## 4. REKOMENDACJA: UNIFIED PIPELINE VIEW

Zamiast laczyc tabele, proponuje **warstwe prezentacji** ktora laczy oba moduly w jeden spojny flow:

### 4.1 Koncepcja: "Zlecenia" (Jobs Pipeline)

```
+-----------------------------------------------------------+
|                    ZLECENIA (Pipeline)                      |
+----------+----------+-----------+----------+--------------+
|  Wycena  | Wyslana  | Negocjacja| Realizacja| Zakonczone  |
|  (DRAFT) |  (SENT)  |(ACCEPTED) | (ACTIVE) |(COMPLETED)  |
+----------+----------+-----------+----------+--------------+
| Oferta 1 | Oferta 3 | Oferta 5  |Projekt 2 | Projekt 7   |
| Oferta 2 | Oferta 4 |           |Projekt 6 | Projekt 8   |
+----------+----------+-----------+----------+--------------+
```

**Co to daje:**
- Uzytkownik widzi JEDEN widok z calym flow: od wyceny do zakonczenia
- Tabele DB zostaja osobne (zero migracji)
- Dane laczy sie na poziomie frontendu (query z `offers` + `v2_projects`)
- Klik na oferte -> OfferDetail, klik na projekt -> ProjectHub (bez zmian)

### 4.2 Ulepszenia przy okazji

| Ulepszenie | Opis | LOC | Trudnosc |
|------------|------|-----|----------|
| Auto-konwersja | Zaakceptowana oferta automatycznie tworzy projekt | ~50 | Niska |
| Unified timeline | Os czasu: oferta->wysylka->akceptacja->start->etapy->odbior | ~150 | Srednia |
| Usuniecie legacy `projects` | Migracja FK kalendarza na `v2_projects` | ~100 | Srednia |
| Pipeline widok (Kanban) | Drag-and-drop kolumny statusow | ~300 | Srednia |
| Unified search | Jeden GlobalSearch juz istnieje — rozszerzyc o filtr "Zlecenia" | ~30 | Niska |

---

## 5. ANALIZA KONFUZJI UZYTKOWNIKA

### 5.1 Obecne problemy UX

| Problem | Opis | Dotkliwosc |
|---------|------|------------|
| **Dwa osobne menu** | "Oferty" i "Projekty" w bottom nav — uzytkownik nie wie gdzie isc | Wysoka |
| **Reczne tworzenie projektu** | Po akceptacji oferty trzeba kliknac "Utworz projekt" — powinno byc automatyczne | Wysoka |
| **Brak ciaglosci** | Na liscie ofert widac badge projektu, ale na projekcie zrodlo oferty jest ukryte | Srednia |
| **Legacy projects** | Stara tabela `projects` nadal dziala rownolegle | Srednia |
| **Trzy terminy** | "Oferta" vs "Projekt" vs "Wycena" (quotes) — zbyt wiele pojec | Srednia |

### 5.2 Benchmark swiatowy (SaaS dla budowlanki)

| Platforma | Podejscie | Model |
|-----------|-----------|-------|
| **Buildertrend** (USA) | Unified "Jobs" z fazami | Estimate -> Proposal -> Production -> Warranty |
| **CoConstruct** (USA) | Jedna encja "Project" z etapami | Lead -> Estimate -> Contract -> Build -> Close |
| **Procore** (Enterprise) | Osobne moduly, ale unified dashboard | Bidding -> Preconstruction -> Project Management |
| **PlanRadar** (EU) | Jeden "Project" z dokumentami | Jednopoziomowy — projekt od A do Z |

**Wniosek:** Liderzy rynku uzywaja koncepcji jednego "Job/Zlecenie" z fazami, nie dwoch osobnych modulow.

---

## 6. PLAN MODERNIZACJI (Rekomendowany)

### Faza 1: Quick Wins (1-2 PR, ~200 LOC)
- [ ] Auto-tworzenie projektu po akceptacji oferty (webhook/trigger DB)
- [ ] Zmiana nazwy w nawigacji: "Oferty" -> "Zlecenia" / pozostawienie "Projekty" jako sub-zakladki
- [ ] Breadcrumb: Projekt -> pokazac link do zrodlowej oferty prominentnie

### Faza 2: Pipeline View (2-3 PR, ~400 LOC)
- [ ] Nowa strona `/app/pipeline` — unified view z `offers` + `v2_projects`
- [ ] Filtrowanie: Wyceny | Wyslane | W realizacji | Zakonczone
- [ ] Zamiana bottom-nav: `Oferty + Projekty` -> `Zlecenia`

### Faza 3: Legacy Cleanup (1-2 PR, ~200 LOC)
- [ ] Migracja FK `calendar_events.project_id` i `work_tasks.project_id` na `v2_projects`
- [ ] Deprecacja starej tabeli `projects` (zostawic view dla backwards compat)

### Faza 4: Kanban Board (opcjonalne, 1 PR, ~300 LOC)
- [ ] Drag-and-drop pipeline board (jak Trello/Jira)
- [ ] Mobilne przesuwanie kart miedzy fazami

---

## 7. ANALIZA RYZYKA POLACZENIA (gdyby mimo wszystko)

| Ryzyko | Prawdopodobienstwo | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Zlamanie flow PDF | Wysokie | Krytyczny | Wymaga przepisania generatora |
| Zlamanie emaili (offer sends) | Wysokie | Wysoki | Wymaga przepisania Edge Functions |
| Zlamanie akceptacji online | Wysokie | Krytyczny | Token system musi byc przebudowany |
| Utrata danych | Srednie | Krytyczny | Wymaga starannej migracji |
| Regresja UI | Wysokie | Sredni | 34+ plikow do aktualizacji |
| Zlamanie testow | Pewne | Niski | Trzeba przepisac 5+ test suites |

**Calkowite ryzyko: WYSOKIE. Nie rekomendowane.**

---

## 8. PODSUMOWANIE KOSZTOW

| Podejscie | LOC | PRs | Ryzyko | Wartosc biznesowa |
|-----------|-----|-----|--------|------------------|
| **A: Polaczenie tabel** | ~2000+ | 8-10 | WYSOKIE | Srednia |
| **B: Pipeline View (rekomendowane)** | ~800 | 4-6 | NISKIE | WYSOKA |
| **C: Status quo** | 0 | 0 | ZERO | Niska |

---

## 9. REKOMENDACJA KONCOWA

```
+===============================================================+
|  REKOMENDACJA: Podejscie B — Unified Pipeline View            |
|                                                                |
|  - NIE laczyc tabel DB (za duze ryzyko, za mala wartosc)      |
|  - TAK stworzyc unified "Zlecenia" pipeline na frontendzie    |
|  - TAK automatycznie konwertowac oferte -> projekt            |
|  - TAK usunac legacy tabeli `projects` (po migracji FK)       |
|                                                                |
|  Trudnosc: SREDNIA | Ryzyko: NISKIE | ROI: WYSOKI            |
+===============================================================+
```

---

## Pliki przeanalizowane w audycie

### Baza danych (migracje)
- `supabase/migrations/20260301140000_pr09_offers_table.sql`
- `supabase/migrations/20260301150000_pr10_offer_items.sql`
- `supabase/migrations/20260301180000_pr13_projects_v2.sql`
- `supabase/migrations/20260301190000_pr14_burn_bar.sql`
- `supabase/migrations/20260301200000_pr15_photo_report.sql`
- `supabase/migrations/20260302000000_pr16_dossier.sql`
- `supabase/migrations/20260314120000_offer_variants.sql`
- `supabase/migrations/20251205160746_*.sql` (legacy projects + quotes)

### Hooki React
- `src/hooks/useOffers.ts`
- `src/hooks/useOfferWizard.ts`
- `src/hooks/useOfferStats.ts`
- `src/hooks/useOfferVariants.ts`
- `src/hooks/useOfferPhotos.ts`
- `src/hooks/useOfferSends.ts`
- `src/hooks/useOfferApprovals.ts`
- `src/hooks/useSendOffer.ts`
- `src/hooks/useCreateOfferFromTemplate.ts`
- `src/hooks/useProjectsV2.ts`
- `src/hooks/useProjects.ts`
- `src/hooks/useProjectCosts.ts`
- `src/hooks/useProjectPhotos.ts`
- `src/hooks/useProjectChecklist.ts`
- `src/hooks/useProjectAcceptance.ts`
- `src/hooks/useQuotes.ts`

### Strony
- `src/pages/Offers.tsx`
- `src/pages/OfferDetail.tsx`
- `src/pages/OfferApproval.tsx`
- `src/pages/ProjectsList.tsx`
- `src/pages/ProjectHub.tsx`
- `src/pages/NewProjectV2.tsx`

### Nawigacja
- `src/components/layout/NewShellBottomNav.tsx`
- `src/components/layout/NewShellDesktopSidebar.tsx`
- `src/components/layout/GlobalSearch.tsx`
- `src/App.tsx`
