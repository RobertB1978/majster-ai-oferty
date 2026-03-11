# Audyt Luk Implementacyjnych — Majster.AI

**Data:** 2026-03-11
**Rodzaj:** Audyt weryfikacyjny (READ-ONLY)
**Cel:** Ustalenie DLACZEGO wcześniej zidentyfikowane elementy pozostają niedokończone

---

## Podsumowanie Wykonawcze

### Główne kategorie niedokończonych prac

1. **Niedokończona migracja backend → v2_projects** — Frontend częściowo zmigrowany, ale ŻADNA z Edge Functions nie została przeniesiona na `v2_projects`. Zero referencji do `v2_projects` w katalogu `supabase/functions/`.
2. **Placeholder/szkieletowy kod UI** — HomeLobby, PRICE_TO_PLAN_MAP czekają na dane produkcyjne.
3. **Martwy kod legacy** — Stare pliki (`NewProject.tsx`, stary route `/app/quick-est`) istnieją obok nowych odpowiedników.
4. **Brakujące akcje właściciela** — Konfiguracja Stripe wymaga prawdziwych Price ID z dashboardu Stripe.

### Dlaczego te elementy pozostają niedokończone?

**Główny wzorzec:** Migracja z `projects` na `v2_projects` była realizowana "od frontendu do środka" — nowe komponenty UI i hooki (np. `useProjectsV2`, `useDashboardStats`) poprawnie używają `v2_projects`, ale Edge Functions backendu i starsze hooki (finansowe, analityczne, PDF) NIGDY nie zostały zaktualizowane. Każdy kolejny PR zakładał, że "backend zostanie zaktualizowany w następnym PR" — ale ten PR nigdy nie nadszedł.

---

## Badanie Element po Elemencie

### 1. approve-offer nadal zapisuje do legacy `projects` zamiast `v2_projects`

**Aktualny stan:** ❌ NADAL LEGACY

**Dowody:**
- `supabase/functions/approve-offer/index.ts`, linia 148: `.from('projects')` — odczyt
- `supabase/functions/approve-offer/index.ts`, linia 321: `.from('projects')` — zapis statusu `'Zaakceptowany'`
- Zero referencji do `v2_projects` w tym pliku
- Zero referencji do `v2_projects` w JAKIEJKOLWIEK Edge Function

**Dlaczego niedokończone:** POMINIĘCIE PRZY WYKONANIU. Migracja frontendowa (PR-13 i kolejne) skupiła się na hookach i komponentach React. Edge Functions backendu zostały całkowicie pominięte. Żaden prompt nie został wyraźnie skierowany na migrację Edge Functions do v2_projects.

**Kategoria:** POTRZEBUJE OSOBNEGO PR
**Ryzyko:** WYSOKIE — zatwierdzenie oferty aktualizuje starą tabelę, a dashboard odczytuje z nowej.

---

### 2. PdfGenerator nadal odczytuje legacy `projects`

**Aktualny stan:** ❌ NADAL LEGACY

**Dowody:**
- `src/pages/PdfGenerator.tsx`, linia 4: `import { useProject } from '@/hooks/useProjects'`
- Hook `useProject()` w `useProjects.ts`, linia 113: `.from('projects')`
- Brak referencji do `v2_projects` w łańcuchu PdfGenerator

**Dlaczego niedokończone:** POMINIĘCIE PRZY WYKONANIU. PdfGenerator nie został uwzględniony w zakresie PR-ów migracyjnych. Ponieważ importuje `useProject` (nie `useProjectV2`), nigdy automatycznie nie przejdzie na nową tabelę.

**Kategoria:** POTRZEBUJE OSOBNEGO PR
**Ryzyko:** ŚREDNIE — Generowanie PDF może pokazywać nieaktualne dane projektów jeśli są aktualizowane tylko w `v2_projects`.

---

### 3. Stary route `/app/quick-est` nadal żyje

**Aktualny stan:** ❌ NADAL ROUTOWANY

**Dowody:**
- `src/App.tsx`, linia 254: `<Route path="quick-est" element={<QuickEstimate />} />`
- Nowy odpowiednik: `/app/szybka-wycena` → `QuickEstimateWorkspace`
- Audyt `VERIFICATION_AUDIT_FINAL_2026-03-11.md` wyraźnie zidentyfikował to jako problem do naprawienia
- Audyt `FRONTEND_UX_AUDIT_2026-02-26.md` zalecił konsolidację ścieżek

**Dlaczego niedokończone:** ŚWIADOMIE ODROCZONE. Wielokrotnie identyfikowane w audytach, ale nigdy nie był dedykowany PR do usunięcia. Prawdopodobnie z ostrożności — stary `QuickEstimate.tsx` nadal odpytuje starą tabelę `projects` i mógłby być potrzebny jako fallback.

**Kategoria:** BEZPIECZNE DO NAPRAWY TERAZ
**Ryzyko:** NISKIE — ale dezorientuje użytkowników posiadając dwie ścieżki do szybkiej wyceny.

---

### 4. useFinancialReports nadal odczytuje legacy `projects`

**Aktualny stan:** ❌ NADAL LEGACY

**Dowody:**
- `src/hooks/useFinancialReports.ts`, linia 61: `.from('projects')` w `useFinancialSummary()`
- `src/hooks/useFinancialReports.ts`, linia 117: `.from('projects')` w `useAIFinancialAnalysis()`

**Dlaczego niedokończone:** POMINIĘCIE PRZY WYKONANIU. Hooki finansowe nie zostały uwzględnione w żadnym PR migracyjnym. Dashboard (`useDashboardStats`) został zmigrowany, ale moduł finansowy nie.

**Kategoria:** POTRZEBUJE OSOBNEGO PR
**Ryzyko:** ŚREDNIE — raporty finansowe mogą nie pokazywać projektów utworzonych po migracji.

---

### 5. useAnalyticsStats nadal odczytuje legacy `projects`

**Aktualny stan:** ❌ NADAL LEGACY

**Dowody:**
- `src/hooks/useAnalyticsStats.ts`, linia 63: `.from('projects')` — statusy i daty projektów

**Dlaczego niedokończone:** POMINIĘCIE PRZY WYKONANIU. Identyczny wzorzec jak useFinancialReports — hook analityczny został pominięty w migracji. `useDashboardStats` (nowy) używa `v2_projects`, ale `useAnalyticsStats` (starszy) nie.

**Kategoria:** POTRZEBUJE OSOBNEGO PR
**Ryzyko:** ŚREDNIE — statystyki mogą być niedokładne.

---

### 6. Stripe webhook `PRICE_TO_PLAN_MAP` nadal używa placeholderów

**Aktualny stan:** ❌ PLACEHOLDERY

**Dowody:**
- `supabase/functions/stripe-webhook/index.ts`, linie 25-35:
  ```
  "price_pro_monthly": "pro"
  "price_starter_monthly": "starter"
  ```
- Komentarz w kodzie: `// Replace with actual Stripe Price IDs`
- Dokumentacja w `docs/STRIPE_SETUP.md` opisuje kroki konfiguracji

**Dlaczego niedokończone:** WYMAGA AKCJI WŁAŚCICIELA. To NIE jest błąd kodu — to wymaga:
1. Właściciel musi utworzyć produkty/ceny w dashboardzie Stripe
2. Skopiować prawdziwe Price ID (np. `price_1ABC123def456`)
3. Zaktualizować mapę lub ustawić jako zmienne środowiskowe

Claude nie może tego zrobić — wymaga dostępu do konta Stripe właściciela.

**Kategoria:** WYMAGA AKCJI WŁAŚCICIELA
**Ryzyko:** KRYTYCZNE dla produkcji — ale OK dla closed beta z darmowym planem.

---

### 7. Company Profile niewyraźnie dostępny z desktop sidebar

**Aktualny stan:** ⚠️ CZĘŚCIOWO ROZWIĄZANE

**Dowody:**
- `src/data/defaultConfig.ts`, linie 23-35: Profil firmy NIE jest w `mainItems`
- `src/components/layout/Navigation.tsx`, linie 81-82: Dynamiczny fallback dodaje link profilu na KOŃCU nawigacji
- Link jest dostępny, ale na samym dole, po Ustawieniach — trudny do odkrycia

**Dlaczego niedokończone:** WYMAGA DECYZJI PRODUKTOWEJ. Profil firmy jest dostępny, ale jego pozycja w nawigacji nie została świadomie zaprojektowana. Fallback gwarantuje, że link istnieje, ale nie że jest widoczny i intuicyjny.

**Kategoria:** WYMAGA DECYZJI PRODUKTOWEJ
**Ryzyko:** NISKIE — funkcja działa, ale UX wymaga poprawy.

---

### 8. HomeLobby nadal pokazuje zero/placeholder sekcje

**Aktualny stan:** ❌ PLACEHOLDERY (66% komponentu)

**Dowody:**
- `src/pages/HomeLobby.tsx`:
  - Sekcja "Kontynuuj" (linia 36-37): Statyczny tekst "Brak ostatnio otwartych elementów"
  - Sekcja "Dziś" (linie 48-50): Hardkodowane `value={0}` dla trzech liczników
  - Sekcja "Szybki start" (linie 60-79): ✅ Jedyna funkcjonalna sekcja
- Komentarz w kodzie (linia 13): `Dane biznesowe (projekty, oferty) będą podłączone w PR-08+`

**Dlaczego niedokończone:** ŚWIADOMIE ODROCZONE. Komentarz w kodzie wyraźnie mówi, że dane biznesowe zostaną podłączone "w PR-08+". To był świadomy placeholder z planem na przyszłość. Hook `useDashboardStats` istnieje i mógłby zasilić liczniki, ale nigdy nie został podpięty.

**Kategoria:** POTRZEBUJE OSOBNEGO PR
**Ryzyko:** NISKIE-ŚREDNIE — użytkownicy widzą puste liczniki, co wygląda niechlujnie.

---

### 9. manifest.json `start_url` nadal ustawiony na `/dashboard`

**Aktualny stan:** ⚠️ TECHNICZNIE DZIAŁA, ALE NIEPOPRAWNIE

**Dowody:**
- `public/manifest.json`, linia 5: `"start_url": "/dashboard"`
- `src/App.tsx`, linia 301: `<Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />`
- Redirect istnieje, więc użytkownicy trafią na `/app/dashboard`

**Dlaczego niedokończone:** DROBNE POMINIĘCIE. Redirect pokrywa problem, ale:
1. PWA instalacja zapisuje `/dashboard` jako punkt startowy
2. Każde uruchomienie PWA wykonuje niepotrzebny redirect
3. Wygląda nieprofesjonalnie w narzędziach deweloperskich

**Kategoria:** BEZPIECZNE DO NAPRAWY TERAZ
**Ryzyko:** MINIMALNE — ale łatwe do naprawienia.

---

### 10. Niespójność etykiet mobile vs desktop

**Aktualny stan:** ⚠️ DROBNA NIESPÓJNOŚĆ

**Dowody:**
- Mobile (`NewShellBottomNav.tsx`): 4 elementy — Dom, Oferty, Projekty, Więcej
- Desktop (`NewShellDesktopSidebar.tsx`): 8+ elementów — Dom, Oferty, Projekty, Klienci, Kalendarz, Dokumenty, Finanse, Ustawienia
- Mobile używa `nav.home` (stary klucz tłumaczenia), Desktop używa `newShell.nav.home` (nowy klucz) — ale oba rozwiązują się do "Dom"
- "Klienci" widoczni na desktop, ale na mobile tylko w "Więcej"

**Dlaczego niedokończone:** DECYZJA PROJEKTOWA, NIE BŁĄD. Mobile ma ograniczoną przestrzeń — 4 elementy + "Więcej" to standardowy wzorzec mobilny. Desktop może pokazać więcej elementów. Niespójność klucza tłumaczenia (`nav.home` vs `newShell.nav.home`) jest jedynym prawdziwym problemem technicznym.

**Kategoria:** WYMAGA DECYZJI PRODUKTOWEJ (jeśli chodzi o priorytety elementów mobilnych)
**Ryzyko:** MINIMALNE.

---

### 11. Onboarding — krok Team nadal martwy/przekierowujący

**Aktualny stan:** ❌ BRAK KROKU TEAM W ONBOARDINGU

**Dowody:**
- `src/hooks/useOnboarding.ts`, linie 17-23: Tylko 5 kroków — Profil, Klient, Projekt, Wycena, PDF. BRAK kroku "Zespół"
- `src/data/defaultConfig.ts`, linia 31: `/app/team` ma `visible: false`
- `src/App.tsx`, linia 310: Redirect `/team` → `/app/team`, ale brak komponentu docelowego z rzeczywistą funkcjonalnością

**Dlaczego niedokończone:** POZA ZAKRESEM + WYMAGA DECYZJI PRODUKTOWEJ. Funkcja "Zespół" nie została zaimplementowana jako funkcjonalność — jest oznaczona jako `requiredPlan: 'pro'` i `visible: false`. To sugeruje, że jest planowana jako funkcja premium, ale jeszcze nie zdecydowano o jej zakresie.

**Kategoria:** ZOSTAWIĆ NA PÓŹNIEJ (wymaga decyzji produktowej o zakresie)
**Ryzyko:** MINIMALNE — ukryta w nawigacji, nie blokuje niczego.

---

### 12. Legacy remnants: `useProjects.ts`, `NewProject.tsx`, stare strony projektów

**Aktualny stan:**

#### `useProjects.ts` — ⚠️ DEPRECATED ALE AKTYWNY
- Plik istnieje i eksportuje hooki oznaczone `@deprecated`
- Nadal używany w 3+ miejscach: `Projects.tsx` (eksport CSV), `Calendar.tsx`, `ProjectTimeline.tsx`
- **Dlaczego:** Nie wszystkie konsumenty zostały zmigrowane na `useProjectsV2`/`useProjectsPaginated`

#### `NewProject.tsx` — ❌ MARTWY KOD
- 566-liniowy plik, NIGDY nie routowany w App.tsx
- Zastąpiony przez `NewProjectV2.tsx` (100 linii)
- **Dlaczego:** Pominięcie usunięcia po migracji. PR tworzący NewProjectV2 nie usunął starego pliku.

#### Stare strony projektów — ✅ W WIĘKSZOŚCI POSPRZĄTANE
- `ProjectsList.tsx`, `ProjectDetail.tsx`, `ProjectHub.tsx` — wszystkie używają V2
- Routingi poprawnie przekierowują

**Kategoria:**
- `useProjects.ts`: ZOSTAWIĆ NA PÓŹNIEJ (jeszcze potrzebny dla CSV/Calendar)
- `NewProject.tsx`: BEZPIECZNE DO NAPRAWY TERAZ (usunąć)

---

### 13. Martwy kod subskrypcji — `useCreateSubscription`

**Aktualny stan:** ✅ ŚWIADOMIE WYŁĄCZONY

**Dowody:**
- `src/hooks/useSubscription.ts`, linie 48-57: Hook istnieje jako stub, rzuca błąd przy wywołaniu
- Komentarz `@deprecated` wyjaśnia, że zmiana planu musi przejść przez Stripe Checkout
- Zero aktywnych importów w kodzie produkcyjnym
- Test (`cleanup-pack-point4.test.ts`) weryfikuje, że rzuca błąd
- Nowy flow: `useCreateCheckoutSession()` i `useCustomerPortal()` w `useStripe.ts`

**Dlaczego nadal istnieje:** ŚWIADOMA DECYZJA. Stub zachowany celowo, aby nie łamać ewentualnych importów. Poprawny wzorzec deprecjacji.

**Kategoria:** ZOSTAWIĆ NA PÓŹNIEJ (lub usunąć stub przy okazji)
**Ryzyko:** ZERO — nie można go przypadkowo wywołać.

---

### 14. Dodatkowe odkrycia

#### public-api Edge Function — LEGACY
- `supabase/functions/public-api/index.ts`: `.from('projects')` — linie 102, 150
- Publiczne API nadal operuje na starych tabelach

#### delete-user-account Edge Function — LEGACY
- `supabase/functions/delete-user-account/index.ts`: `.from('projects')` — linia 203
- Usuwanie konta użytkownika czyści starą tabelę, ale nie nową

#### QuickEstimate.tsx odpytuje starą tabelę
- `src/pages/QuickEstimate.tsx`, linia 373: `.from('projects')` — szybka wycena zapisuje do starej tabeli

---

## Powtarzające się Wzorce Porażek

### Wzorzec 1: "Frontend zmigrowany, backend pominięty"
Edge Functions (`approve-offer`, `public-api`, `delete-user-account`) NIGDY nie zostały zmigrowane na `v2_projects`. Każdy PR migracyjny skupiał się na hookach React i komponentach, kompletnie ignorując backend.

**Dotknięte elementy:** #1, #2, #4, #5, #14

### Wzorzec 2: "Nowy komponent obok starego bez usunięcia"
Nowe wersje powstają (`NewProjectV2`, `QuickEstimateWorkspace`, `useProjectsV2`), ale stare wersje nie są usuwane ani nawet zamieniane na redirect.

**Dotknięte elementy:** #3, #12

### Wzorzec 3: "Placeholder z obietnicą 'w następnym PR'"
Kod zawiera komentarze "TODO w PR-08+" lub "Replace with actual values" — ale te PR-y nigdy nie nadeszły.

**Dotknięte elementy:** #6, #8

### Wzorzec 4: "Audyt identyfikuje problem, ale nikt go nie naprawia"
Ten sam problem (`/app/quick-est`, approve-offer legacy) pojawia się w 3+ audytach z rzędu. Każdy audyt go raportuje, żaden PR go nie naprawia.

**Dotknięte elementy:** #1, #2, #3, #4, #5

---

## Elementy Najprawdopodobniej Uznane za "Zrobione" — Ale Nie Są

| Element | Dlaczego uznano za zrobione | Dlaczego NIE jest zrobione |
|---------|---------------------------|--------------------------|
| **Migracja v2_projects** | Dashboard, lista projektów, hub — wszystko działa na v2 | Edge Functions, finanse, analityka, PDF — nadal na starych tabelach |
| **Quick Estimate** | Nowy workspace `/app/szybka-wycena` z draftem działa | Stary `/app/quick-est` nadal routowany obok nowego |
| **Profil firmy w nawigacji** | Link istnieje dzięki fallbackowi | Pozycja na samym dole, nie skonfigurowany świadomie w mainItems |
| **HomeLobby** | Komponent renderuje się, Quick Start działa | 2/3 sekcji to hardkodowane zera i placeholder tekst |

---

## Elementy Które Prawdopodobnie Były Poza Zakresem, Nie Zapomniane

| Element | Uzasadnienie |
|---------|-------------|
| **Stripe PRICE_TO_PLAN_MAP** | Wymaga fizycznego dostępu do konta Stripe właściciela. Claude nie mógł tego zrobić. |
| **Onboarding Team step** | Funkcja "Zespół" nie jest jeszcze zaprojektowana jako produkt. Brak specyfikacji co krok powinien robić. |
| **Mobile vs desktop etykiety** | To jest decyzja UX, nie bug. Mobile ma ograniczoną przestrzeń. |

---

## Elementy Które Powinny Być Naprawione Przed Closed Beta

| Priorytet | Element | Uzasadnienie |
|-----------|---------|-------------|
| **P0** | approve-offer → v2_projects | Zatwierdzenie oferty aktualizuje niewłaściwą tabelę — krytyczny bug danych |
| **P0** | PdfGenerator → v2_projects | PDF może zawierać nieaktualne dane projektu |
| **P1** | useFinancialReports → v2_projects | Raporty finansowe mogą nie widzieć nowych projektów |
| **P1** | useAnalyticsStats → v2_projects | Statystyki mogą być niedokładne |
| **P1** | Usunąć route /app/quick-est | Dwa równoległe flow dezorientują użytkowników |
| **P2** | HomeLobby — podłączyć dane | Puste liczniki wyglądają jak bug |
| **P2** | manifest.json start_url | Niepotrzebny redirect przy starcie PWA |
| **P3** | Usunąć NewProject.tsx | Martwy kod, 566 linii |

---

## Końcowa Rekomendacja

### Co Claude prawdopodobnie pominął przez błąd:
1. **Migracja Edge Functions na v2_projects** — to jest najpoważniejsze pominięcie. Frontend został zmigrowany, ale backend kompletnie zapomniany. Żaden prompt nie adresował tego wprost, więc żaden PR tego nie zrobił.
2. **Usunięcie starego route /app/quick-est** — wielokrotnie identyfikowane w audytach, nigdy naprawione.
3. **Usunięcie NewProject.tsx** — oczywiste pominięcie przy tworzeniu NewProjectV2.

### Co zostało poprawnie odroczone:
1. **Stripe PRICE_TO_PLAN_MAP** — wymaga akcji właściciela, nie Claude'a
2. **Onboarding Team step** — wymaga decyzji produktowej
3. **useCreateSubscription stub** — poprawnie zdeprecjonowany z guardem

### Co powinno być naprawione teraz:
1. **approve-offer + PdfGenerator → v2_projects** (1 PR)
2. **useFinancialReports + useAnalyticsStats → v2_projects** (1 PR)
3. **Usunąć /app/quick-est route + QuickEstimate.tsx** (1 PR)
4. **manifest.json start_url → /app/dashboard** (można w dowolnym PR)
5. **Usunąć NewProject.tsx** (można w dowolnym PR)

### Co powinno poczekać:
1. **HomeLobby dane** — do kolejnej iteracji UI
2. **Company Profile pozycja w nav** — decyzja produktowa
3. **Mobile etykiety** — decyzja UX
4. **Team step** — brak specyfikacji
5. **useCreateSubscription stub** — nie szkodzi, poprawnie zabezpieczony

---

## Tabelaryczne podsumowanie klasyfikacji

| # | Element | Klasyfikacja |
|---|---------|-------------|
| 1 | approve-offer legacy projects | POTRZEBUJE OSOBNEGO PR |
| 2 | PdfGenerator legacy projects | POTRZEBUJE OSOBNEGO PR |
| 3 | /app/quick-est nadal żyje | BEZPIECZNE DO NAPRAWY TERAZ |
| 4 | useFinancialReports legacy | POTRZEBUJE OSOBNEGO PR |
| 5 | useAnalyticsStats legacy | POTRZEBUJE OSOBNEGO PR |
| 6 | Stripe PRICE_TO_PLAN_MAP | WYMAGA AKCJI WŁAŚCICIELA |
| 7 | Company Profile w sidebar | WYMAGA DECYZJI PRODUKTOWEJ |
| 8 | HomeLobby placeholdery | POTRZEBUJE OSOBNEGO PR |
| 9 | manifest.json start_url | BEZPIECZNE DO NAPRAWY TERAZ |
| 10 | Mobile vs desktop etykiety | WYMAGA DECYZJI PRODUKTOWEJ |
| 11 | Onboarding Team step | ZOSTAWIĆ NA PÓŹNIEJ |
| 12a | useProjects.ts deprecated | ZOSTAWIĆ NA PÓŹNIEJ |
| 12b | NewProject.tsx martwy kod | BEZPIECZNE DO NAPRAWY TERAZ |
| 13 | useCreateSubscription | ZOSTAWIĆ NA PÓŹNIEJ |
| 14 | public-api + delete-user legacy | POTRZEBUJE OSOBNEGO PR |
