# FINALNY AUDYT RUNTIME — MAJSTER.AI
## Weryfikacja gotowości do zamkniętej bety
### Data: 2026-03-12 | Wersja: 2.0 (pełna, zweryfikowana)

---

## 1. WERDYKT WYKONAWCZY

### NIE GOTOWY NA ZAMKNIETĄ BETĘ — WYMAGA KRYTYCZNYCH POPRAWEK

Aplikacja Majster.AI posiada solidny fundament architektoniczny i imponujacy zakres funkcji — 25 prawdziwych szablonów dokumentów budowlanych z odniesieniami do Kodeksu Cywilnego, pełny pipeline foto z kompresja, 3 jezyki z 3281 kluczami tłumaczeń, nowoczesna nawigacje z FAB i bottom nav. Jednak **rzeczywistość runtime brutalnie rozmija sie z prawda kodu**:

1. **BLOKER ZERO**: Strony Ofert i Projektów pokazuja błąd ładowania — brak migracji DB na produkcji
2. **POTWIERDZONE**: Voice/AI/Manual na Dashboard prowadza do IDENTYCZNEGO formularza recznego — OfferWizard **kompletnie ignoruje** `state.mode` (nie importuje nawet `useLocation`)
3. **POTWIERDZONE**: Strona `/app/photos` istnieje ale **NIE MA JEJ W ŻADNEJ NAWIGACJI** — ani sidebar, bottom nav, MoreScreen, ani FAB. Feature jest osierocona
4. **POTWIERDZONE**: DashboardStats karty maja hover animacje (shadow-xl, translate-y) ale **NIE SĄ KLIKALNE** — mysla uzytkownika
5. **POTWIERDZONE**: Karty sa czystym białym #FFFFFF na tle #F9FAFB — kontrast 1.05:1, karty praktycznie niewidoczne bez cieni
6. **POTWIERDZONE**: Wzory dokumentów to puste formularze — zero podgladów PDF, zero wypełnionych przykładów, zero miniatur
7. **POTWIERDZONE**: Sidebar primary color w light mode nie spełnia WCAG AA (3.07:1 vs wymagane 4.5:1)
8. Zero pastelowych tonów — palette jest korporacyjna/zimna zamiast ciepłej/budowlanej
9. Brak niestandardowych ilustracji — tylko generyczne ikony lucide-react
10. Mesh-gradient jawnie wyłaczony w configu (`'mesh-gradient': 'none'`), efekt glow zdefiniowany ale nieuzywany

**Z 8-10 celowanymi poprawkami aplikacja BEDZIE gotowa na bete, ale wymaga wiecej pracy niz wstępnie zakładano.**

---

## 2. MIGAWKA PRAWDY BETA

### Co jest NAPRAWDE silne teraz:
- **Routing i nawigacja**: 40+ tras, zero martwych linków, spójna nawigacja w obu shellach
- **i18n infrastruktura**: PL/EN/UK kompletne (3873 linie kazdego), zero brakujacych kluczy na głównych powierzchniach
- **Bezpieczeństwo**: RLS na wszystkich tabelach, prywatne buckety storage, walidacja plików, blokowanie niebezpiecznych rozszerzeń
- **Mobile layout**: Bottom nav z FAB, safe area dla notcha, animacje sprezystowe Framer Motion
- **Settings**: 8 aktywnych zakładek, responsywne na mobile (vertical list) i desktop (horizontal tabs)
- **Onboarding**: 5-krokowy wizard z opcja pominiecia, auto-trigger dla nowych uzytkowników
- **Kompresja obrazów**: WebP, 1600px, 0.75 quality, EXIF strip — enterprise jakość
- **Ikony**: lucide-react konsekwentnie w 141 plikach, zero mieszania bibliotek

### Co jest TYLKO "dobre w kodzie" ale NIE w runtime:
- **Oferty i Projekty**: Tabele nie istnieja na produkcji → ekran błedu
- **Pipeline foto**: Kod kompletny (kamera, kompresja, galeria, 4 fazy, podpis) ale **osierocony** — brak w nawigacji + zależny od Projektów które nie działaja
- **Voice/AI mode**: `state.mode` jest PRZEKAZYWANY przez QuoteCreationHub ale **KOMPLETNIE IGNOROWANY** przez OfferWizard (nie importuje useLocation, nie ma props mode)
- **Asystent AI**: Chat działa ale nie jest zintegrowany z tworzeniem oferty — to osobny chatbot
- **Wzory dokumentów**: 25 szablonów z referencjami prawnymi, ale uzytkownik widzi **puste formularze** zamiast gotowych dokumentów

### Co nadal osłabia zaufanie:
- Czysty biały #FFFFFF na kartach — kontrast z tłem 1.05:1 (WCAG wymaga 3.0)
- DashboardStats WYGLADAJA na klikalne (hover:shadow-xl, hover:-translate-y-1) ale nie prowadza nigdzie
- EmptyDashboard benefit cards maja hover animacje ale nie sa klikalne
- AdBanner CTA przycisk istnieje wizualnie ale **NIE MA onClick handler**
- Brak pastelowych/ciepłych tonów — cała paleta jest zimna/korporacyjna
- Zero podgladów PDF w bibliotece dokumentów
- AI prompty hardcoded po polsku (EN/UK uzytkownicy wysyłaja polskie prompty)
- Voice input hardcoded na `pl-PL`

---

## 3. AUDYT FTUE (Pierwsza Wizyta Uzytkownika)

| Etap | Ocena | Gotowość | Tarcie | Zamet | Wpływ na zaufanie |
|------|-------|----------|--------|-------|-------------------|
| **Landing** | 8/10 | 90% | Niskie | Niskie | Pozytywny — czysta, profesjonalna |
| **Rejestracja** | 7/10 | 85% | Niskie | Niskie | Dobry — siła hasła, opcjonalny telefon |
| **Weryfikacja email** | 7/10 | 85% | Średnie | Niskie | Neutralny — hint o SPAM, resend z cooldown |
| **Login** | 6/10 | 75% | **Średnie** | Niskie | **NIEZNANE** — uzytkownik zgłasza overflow |
| **Onboarding** | 8/10 | 90% | Niskie | Niskie | Pozytywny — 5 kroków, skip, progress |
| **Dashboard (nowy uzytkownik)** | 4/10 | 45% | **Wysokie** | **Wysokie** | **NEGATYWNY** — karty wyglądają klikalnie ale nie sa, Voice/AI nie działaja |

### Szczegóły krytyczne:
- **Dashboard nowego uzytkownika**: EmptyDashboard pokazuje benefit cards z `hover:shadow-md hover:y-4` — uzytkownik klika, nic sie nie dzieje. Traci zaufanie w ciagu 10 sekund
- **Voice/AI/Manual**: 3 karty z roznymi ikonami i opisami OBIECUJA rózne doswiadczenia. Wszystkie prowadza do **identycznego formularza recznego**. OfferWizard.tsx:73-76 — Props interface to TYLKO `{ offerId?: string }`, zero parametru mode
- **Zdjecia**: Uzytkownik szuka "Zdjecia" w nawigacji — **NIE MA**. Route `/app/photos` istnieje ale nie jest podłaczona do zadnej nawigacji (NewShellBottomNav, NewShellDesktopSidebar, MoreScreen, FAB — zweryfikowane, zero wzmianki o photos)

---

## 4. AUDYT EKRAN PO EKRANIE

### Landing: 8/10 | 90%
- **Działa**: Hero z "Zacznij bezpłatnie — bez karty kredytowej", PDF preview, 2 CTA, sticky header, dark mode, responsive, language switcher
- **Nie gra**: Brak prawdziwych testimoniali, brak demo video, brak screenshotów app, brak social proof z liczbami

### Register / Verify / Login: 6/10 | 75%
- **Działa**: Walidacja Zod, CAPTCHA po 3 próbach, Google/Apple login, wskaźnik siły hasła, email verification z resend+cooldown, anty-duplikat telefonu
- **Nie gra**: **NIEZNANE** — uzytkownik zgłasza overflow na stronie logowania. W kodzie: `max-w-sm`, `overflow-hidden` — wyglada poprawnie. **WYMAGA MANUALNEJ WERYFIKACJI LIVE na prawdziwym urzadzeniu**

### Dashboard: 4/10 | 50%
- **Działa**: QuickActions (4 karty) nawiguja poprawnie, RecentProjects klikalne z nawigacja do `/app/projects/:id`, TodayTasks ze strzałkami do ofert/projektów, AnimatedCounter ze sparklines
- **Nie gra**:
  - **DashboardStats**: `hover:shadow-xl transition-all duration-300 hover:-translate-y-1` + `cursor-default` — karty WYGLADAJA klikalnie ale NIE SA (src/components/dashboard/DashboardStats.tsx)
  - **EmptyDashboard benefit cards**: `hover:shadow-md hover:y-4` ale zero onClick
  - **AdBanner CTA button**: Button wizualnie istnieje ale **NIE MA onClick handler**
  - **Voice/AI/Manual**: POTWIERDZONE — OfferWizard NIE importuje useLocation, NIE czyta state.mode, interface Props = `{ offerId?: string }` TYLKO
  - Brak interaktywnych wykresów (Recharts zaladowany ale uzyty tylko w Finance, nie na Dashboard)
  - Gradienty minimalne, mesh-gradient wyłaczony

### Oferty: 3/10 | 40%
- **Działa**: Error handling z detekcja PGRST205, empty state z CTA, "Szablony branżowe" otwiera IndustryTemplateSheet, filtry statusów (ALL/DRAFT/SENT/ACCEPTED/REJECTED/ARCHIVED), search z debounce 300ms
- **Nie gra**: **EKRAN BŁEDU NA LIVE** — "Błąd ładowania ofert. Baza danych wymaga aktualizacji." — tabela `offers` nie istnieje na produkcji (migracja `20260301140000_pr09_offers_table.sql`)

### Projekty: 3/10 | 40%
- **Działa**: Kod solidny — filtry (ALL/ACTIVE/COMPLETED/ON_HOLD), search z debounce, soft-delete z AlertDialog, klikalne karty nawiguja do ProjectHub
- **Nie gra**: **EKRAN BŁEDU NA LIVE** — "Nie udało sie załadować projektów." — tabela `v2_projects` nie istnieje (migracja `20260301180000_pr13_projects_v2.sql`)

### Kalendarz: 5/10 | 60%
- **Działa**: 5 widoków (miesiąc/tydzień/dzień/agenda/timeline), CRUD eventów z dialogiem, typy: deadline/meeting/reminder/work/other
- **Nie gra**: **BRAK ErrorState** — jeśli query sie nie powiedzie, spinner kreci sie w nieskończoność. **BRAK EmptyState** — pusty kalendarz nie mówi "Dodaj pierwsze wydarzenie". Uzytkownik nie wie czy ładuje sie czy jest pusty

### Settings: 7.5/10 | 85%
- **Działa**: 8 aktywnych zakładek (Firma, Jezyk, Dokumenty, Kalendarz, Email, Subskrypcja, Prywatność, Konto), mobile vertical list z chevron, desktop horizontal tabs, responsywne
- **Nie gra**: Biometric/Push disabled (feature flags = false) — OK dla bety, nie przeszkadza

### Plan / Subskrypcja: 6/10 | 70%
- **Działa**: 4 plany (Darmowy/Pro/Biznes/Enterprise) z limitami, fallback na PlanRequestModal (email do kontakt.majsterai@gmail.com) gdy Stripe brak, banner informacyjny
- **Nie gra**: Stripe niekonfigurowany (brak `VITE_STRIPE_ENABLED`). PricingPlans.tsx ma hardcoded angielskie nazwy ('Pro', 'Business') zamiast tłumaczeń. Brak `docs/BILLING_RUNBOOK.md`

### Zdjecia: 2/10 | 25% (runtime)
- **Działa w kodzie (80%)**: PhotoReportPanel z 4 fazami (BEFORE/DURING/AFTER/ISSUE), kamera mobilna z `capture="environment"`, CameraPermissionGate, kompresja WebP 1600px/0.75, optimistic UI z retry, galeria 3-kolumnowa z lazy loading, podpis cyfrowy SignaturePad, checklist akceptacji z 4 szablonami
- **Nie gra w runtime**:
  - **Strona `/app/photos` NIE JEST W ŻADNEJ NAWIGACJI** — nie ma jej w: NewShellBottomNav (ln 15-20), NewShellDesktopSidebar (ln 36-61), MoreScreen (ln 38-55), FAB (ln 21-26), MobileBottomNav (ln 14-20), defaultConfig.ts (ln 35-47)
  - Feature dostepna TYLKO wewnątrz ProjectHub (zakładka "Raport fotograficzny") — ale Projekty nie działaja (brak tabeli)
  - **Uzytkownik ma 100% racje ze "brak robienia zdjec"** — z perspektywy runtime feature jest niewidoczna i niedostepna

### Wzory Dokumentów: 6/10 | 65%
- **Działa**: 25 szablonów (5 umów, 9 protokołów, 6 aneksów, 5 przeglądów technicznych), autofill z danych firmy/klienta/oferty/projektu, edytor z accordion sekcjami, generowanie PDF z nagłówkiem firmy i podpisami, zapis do dossier, referencje prawne (Kodeks Cywilny, Prawo Budowlane)
- **Nie gra**:
  - **ZERO podgladów wizualnych** — karty szablonów to TYLKO tekst (tytuł + opis 2-liniowy)
  - **ZERO miniatur/thumbnails** — brak jakichkolwiek obrazów preview w `/public/`
  - **ZERO wypełnionych przykładów** — uzytkownik widzi puste pola formularza
  - **ZERO podgladu PDF** przed generowaniem — trzeba wypełnić i kliknac "Pobierz PDF" zeby zobaczyc wynik
  - Uzytkownik oczekuje **galerię gotowych, pięknie zaprojektowanych dokumentów** — dostaje **pusty formularz**
  - Wrażenie: "To jest kreator formularzy" zamiast "To sa profesjonalne dokumenty"

---

## 5. AUDYT MOBILE / DESKTOP

### Poprawne:
- Bottom Nav (4 taby + FAB slot) z animacjami sprezystowymi (stiffness 380-500, damping 30-32)
- Desktop Sidebar sticky z 3 sekcjami, 44px min-height per item (accessibility)
- Breakpoint lg (1024px) prawidłowo rozdziela mobile od desktop
- Settings responsywne (vertical list <640px, horizontal tabs >=640px)
- Safe area dla notcha (`env(safe-area-inset-bottom)`)
- Page transitions z Framer Motion fade-in (ale niekonsekwentne — tylko Dashboard)

### Wymaga dopracowania:
- **Brak pull-to-refresh** na mobile — uzytkownicy mobile oczekuja tego gestu
- **Desktop nie wykorzystuje pełnej przestrzeni** — karty sa zbyt waskie, za "mobilny" layout na duzych ekranach
- **Page transitions niekonsekwentne** — tylko Dashboard uzywa `animate-fade-in`, inne strony pojawiaja sie natychmiast
- **Brak `/app/photos` w nawigacji** — feature kompletnie niewidoczna na wszystkich urzadzeniach

### Shell bezpieczny na bete: TAK (z wyjatkiem brakujacego linku do Photos)

---

## 6. WERDYKT ZDJECIA

### TRZYMAĆ UKRYTE — ALE NAPRAWIĆ ODKRYWALNOŚĆ PRZED BETĄ

Kod pipeline foto jest **produkcyjnej jakosci** — kamera, kompresja, galeria, podpis. ALE:

1. **BLOKER**: Strona `/app/photos` NIE JEST PODŁACZONA DO ŻADNEJ NAWIGACJI — uzytkownik nie moze jej znaleźć chyba ze wpisze URL recznie
2. **BLOKER**: Feature dostepna tylko wewnątrz ProjectHub, który nie działa (brak tabeli `v2_projects`)
3. **BLOKER**: Bucket `project-photos` musi istnieć na produkcji Supabase
4. Camera Permission API wymaga testu na róznych przegladarkach mobilnych

**Wymagane akcje**:
- Dodać "Zdjecia" do MoreScreen i NewShellDesktopSidebar (Tools section)
- Uruchomić migracje DB (odblokuje ProjectHub i photo report)
- Manualny test: Projekt → Raport foto → Dodaj zdjecie → Kamera → Upload

---

## 7. CO POWINNO POZOSTAC UKRYTE NA BETE

| Powierzchnia | Status | Powód |
|-------------|--------|-------|
| **Biometric Settings** | UKRYĆ | WebAuthn niegotowy, feature flag=false |
| **Push Notifications** | UKRYĆ | Brak persistencji, feature flag=false |
| **Analytics** (`/app/analytics`) | UKRYĆ | Wymaga danych historycznych, puste |
| **Marketplace** | UKRYĆ | Redirect do dashboard, niezaimplementowane |
| **Team Management** | UKRYĆ | Widoczne w planach ale incomplete |
| **HomeLobby** (`/app/home`) | UKRYĆ | Redirect do dashboard, "Brak ostatnio otwartych" placeholder |
| **Stripe Checkout** | DE-EMFAZOWAĆ | Fallback na email OK, ale nie udawać ze płatnosci działaja |
| **Admin Console** (`/admin/*`) | UKRYĆ | Tylko dla ownera |
| **Voice/AI mode w QuoteCreationHub** | UKRYĆ LUB NAPRAWIĆ | Obiecuja funkcje których nie ma — misleading |

---

## 8. TOP FINALNE POPRAWKI PRZED BETĄ

| # | Problem | Dotkliwość | Wysiłek | Dlaczego | Priorytet |
|---|---------|-----------|---------|----------|-----------|
| **1** | **Uruchomić migracje DB** (offers, v2_projects, calendar_events, project_photos, dossier, document_instances) | 🔴 KRYTYCZNY | Mały | Bez tego Oferty, Projekty, Zdjecia, Kalendarz pokazuja błąd — 60% app niefunkcjonalna | **MUST** |
| **2** | **Dodać /app/photos do nawigacji** (MoreScreen + NewShellDesktopSidebar) | 🔴 KRYTYCZNY | Mały | Feature kompletna w kodzie ale kompletnie niewidoczna dla uzytkownika | **MUST** |
| **3** | **Naprawić Voice/AI/Manual mode** — OfferWizard musi czytać `location.state.mode` i zmieniać zachowanie, LUB usunąc obietnicę z Dashboard | 🔴 KRYTYCZNY | Sredni | 3 przyciski obiecuja rózne doswiadczenia ale prowadza do identycznego formularza — misleading | **MUST** |
| **4** | **Zmienić biały #FFFFFF na ciepły ecru** — `--card: 40 20% 96%` (~#F7EFE5), `--popover` analogicznie | 🟡 ŚREDNI | Mały | Kontrast card/background = 1.05:1 (niewidoczne), zimna paleta nie pasuje do branzy budowlanej | **MUST** |
| **5** | **Naprawić DashboardStats** — albo dodać onClick z nawigacja, albo usunać hover animacje (`hover:shadow-xl`, `hover:-translate-y-1`) | 🟡 ŚREDNI | Mały | Karty WYGLADAJA klikalnie ale nie sa — frustruje uzytkownika | **MUST** |
| **6** | **Dodać ErrorState + EmptyState do Kalendarza** | 🟡 ŚREDNI | Mały | Spinner w nieskonczoność przy błedzie, brak komunikatu przy pustym kalendarzu | **MUST** |
| **7** | **Weryfikacja live Login overflow** na prawdziwym urzadzeniu mobilnym | 🟡 ŚREDNI | Mały | Uzytkownik zgłasza overflow, kod wyglada OK — potrzeba manual test | **MUST** |
| **8** | **Naprawić sidebar primary kontrast** w light mode (3.07:1 → min 4.5:1 WCAG AA) | 🟡 ŚREDNI | Mały | Accessibility violation — primary links na ciemnym sidebar nieczytelne | **SHOULD** |
| **9** | **Przenieść AI prompts do i18n** + zmienić voice language z `pl-PL` na dynamiczny | 🟡 ŚREDNI | Mały | EN/UK uzytkownicy wysyłaja polskie prompty i mówie po polsku do mikrofonu | **SHOULD** |
| **10** | **Dodać preview/thumbnails do wzorów dokumentów** — chociaz statyczne screenshoty PDF | 🟢 NISKI | Sredni | Uzytkownik widzi puste formularze zamiast gotowych dokumentów — wrażenie "bety" | **SHOULD** |
| **11** | **Naprawić AdBanner CTA button** — dodać onClick lub usunąc przycisk | 🟢 NISKI | Mały | Przycisk CTA bez akcji to martwy element | **SHOULD** |
| **12** | **Dodać EmptyDashboard benefit cards onClick** lub usunąc hover animacje | 🟢 NISKI | Mały | Karty wygladaja klikalnie ale nie sa | **SHOULD** |
| **13** | **Włączyć page transitions** na wszystkich głównych stronach (nie tylko Dashboard) | 🟢 NISKI | Mały | Niekonsekwentne — Dashboard ma fade-in, inne strony pojawiaja sie nagle | **NICE** |
| **14** | **Dodać gradients/glow** do stat cards i primary CTA — efekt "glow" jest ZDEFINIOWANY ale nie uzywany | 🟢 NISKI | Mały | Wizualna modernizacja z minimalnym wysiłkiem | **NICE** |
| **15** | **Dodać custom ilustracje SVG** dla empty states (budowlane motywy) | 🟢 NISKI | Duzy | Tylko generyczne ikony lucide-react, brak osobowosci marki | **NICE** |

---

## 9. CO JUZ NIE WYMAGA AUDYTOWANIA

| Obszar | Status | Powód zamkniecia |
|--------|--------|-----------------|
| Routing i nawigacja | ZAMKNIĘTY | 40+ tras, zero martwych linków, oba shelle spójne |
| i18n infrastruktura (klucze) | ZAMKNIĘTY | 3 jezyki, 3281 kluczy, zero brakujacych na głównych powierzchniach |
| RLS i bezpieczeństwo | ZAMKNIĘTY | Wszystkie tabele z RLS, prywatne buckety, walidacja plików |
| Kompresja obrazów | ZAMKNIĘTY | WebP, 1600px, 0.75 quality, EXIF strip |
| Feature flags | ZAMKNIĘTY | FF_NEW_SHELL, biometric, push — prawidłowo gated |
| Mobile safe areas | ZAMKNIĘTY | Notch support, env(safe-area-inset-bottom) |
| Onboarding wizard | ZAMKNIĘTY | 5 kroków, skip, progress, auto-trigger |
| Settings responsywność | ZAMKNIĘTY | Vertical list mobile, horizontal tabs desktop |
| Ikony spójność | ZAMKNIĘTY | lucide-react w 141 plikach, zero mieszania |
| Photo pipeline (KOD) | ZAMKNIĘTY | Kod produkcyjny — problem to odkrywalność, nie jakość kodu |

---

## 10. FINALNA REKOMENDACJA

### Czy mozemy przejść do zamknietej bety?
**TAK — ale po wykonaniu 7 obowiazkowych poprawek (MUST), nie 4 jak wstepnie zakładano.**

### 7 Obowiazkowych poprawek (MUST):
1. **Uruchomić migracje DB** na produkcji Supabase — odblokuje Oferty, Projekty, Zdjecia, Kalendarz
2. **Dodać /app/photos do nawigacji** — MoreScreen + Desktop Sidebar
3. **Naprawić lub usunąć Voice/AI mode** — OfferWizard musi czytać mode albo Dashboard nie moze obiecywać róznych trybów
4. **Zmienić --card na ciepły ecru** — 1 linia CSS w index.css
5. **Naprawić DashboardStats klikalnośc** — dodać onClick lub usunąc hover efekty
6. **Dodać ErrorState + EmptyState do Kalendarza** — wzorując sie na Offers/Projects
7. **Manualny test Login** na prawdziwym urzadzeniu mobilnym — zweryfikować overflow

### Akcje właściciela:
- Uruchomić `supabase db push` w panelu Supabase (migracje)
- Zweryfikować strone logowania na telefonie
- Zdecydować: naprawić Voice/AI mode czy usunąc obietnice z Dashboard?
- Zdecydować: Stripe na bete czy formularz email wystarczy?
- Potwierdzić działanie zdjęć po naprawieniu nawigacji + projektów

### Nastepna akcja:
**Uruchomić migracje bazy danych na produkcji Supabase** — to odblokuje 60% aplikacji jednym ruchem. Nastepnie dodać `/app/photos` do nawigacji i naprawić DashboardStats klikalnośc. Te 3 rzeczy daja najwyzszy zwrot z wysiłku.

---

## ANEKS A: SZCZEGÓŁY KOLORÓW

### Light Mode
| Element | HSL | Hex | Problem |
|---------|-----|-----|---------|
| Background | 210 20% 98% | #F9FAFB | Zimny, korporacyjny |
| Card | 0 0% 100% | #FFFFFF | Za jasny, kontrast z bg = 1.05:1 |
| Primary | 30 90% 32% | #9B5208 | OK kontrast na białym (5.83:1) |
| Secondary | 215 16% 94% | #EDEFF2 | Zimny szary, brak ciepła |
| Muted | 220 14% 92% | #E8EAED | Zimny szary |
| Sidebar BG | 222 47% 11% | #0F1729 | Ciemny — OK |
| Sidebar Primary | 30 90% 32% | #9B5208 | **FAIL WCAG AA na ciemnym tle (3.07:1)** |

### Dark Mode
| Element | HSL | Hex | Ocena |
|---------|-----|-----|-------|
| Background | 222 47% 8% | #0B111E | OK — nie za ciemny |
| Card | 222 40% 12% | #121A2B | OK — widoczna róznica z bg |
| Primary | 38 92% 55% | #F6A823 | Jasny amber — excellent |
| Sidebar Primary | 38 92% 55% | #F6A823 | PASS WCAG AA (10.5:1) |

### Rekomendacja kolorów:
- `--card`: zmienić na `40 20% 96%` (~#F7EFE5 ciepły ecru) — poprawi kontrast I doda ciepła
- `--popover`: analogicznie
- `--sidebar-primary` (light): rozjaśnić do ~HSL(35 85% 45%) dla lepszego kontrastu na ciemnym tle
- Rozważyć zmiane `--background` na cieplejszy odcień: `35 15% 97%` (~#F9F6F2)

---

## ANEKS B: ZWERYFIKOWANE PLIKI ŹRÓDŁOWE

| Komponent | Ścieżka | Kluczowe linie |
|-----------|---------|---------------|
| Router | src/App.tsx | 1-340 |
| Dashboard | src/pages/Dashboard.tsx | 1-231 |
| DashboardStats | src/components/dashboard/DashboardStats.tsx | 160-210 (hover bez onClick) |
| QuoteCreationHub | src/components/dashboard/QuoteCreationHub.tsx | 29,39,45 (state.mode) |
| OfferWizard | src/components/offers/wizard/OfferWizard.tsx | 73-76 (Props: tylko offerId) |
| OfferDetail | src/pages/OfferDetail.tsx | NIE importuje useLocation |
| Photos page | src/pages/Photos.tsx | 1-170 (istnieje ale osierocona) |
| NewShellBottomNav | src/components/layout/NewShellBottomNav.tsx | 15-20 (4 taby, bez photos) |
| NewShellDesktopSidebar | src/components/layout/NewShellDesktopSidebar.tsx | 36-61 (bez photos) |
| MoreScreen | src/pages/MoreScreen.tsx | 38-55 (bez photos) |
| Calendar | src/pages/Calendar.tsx | 197-203 (brak ErrorState) |
| CSS kolory | src/index.css | 8-153 |
| Document Templates | src/data/documentTemplates.ts | 1-1721 (25 szablonów) |
| TemplatesLibrary | src/components/documents/templates/TemplatesLibrary.tsx | 75-110 (tylko tekst) |
| AiChatAgent | src/components/ai/AiChatAgent.tsx | 51-53 (hardcoded PL prompts), 81 (pl-PL) |
| EmptyDashboard | src/components/dashboard/EmptyDashboard.tsx | hover bez onClick |
| AdBanner | src/components/ads/AdBanner.tsx | CTA button bez onClick |
