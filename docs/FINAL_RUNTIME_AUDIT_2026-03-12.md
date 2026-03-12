# FINALNY AUDYT RUNTIME — MAJSTER.AI
## Weryfikacja gotowości do zamkniętej bety
### Data: 2026-03-12 | Wersja: 3.0 (V1+V2+V3 skonsolidowane, weryfikacja 200%)

---

## SPIS TREŚCI

1. [Werdykt wykonawczy](#1-werdykt-wykonawczy)
2. [Migawka prawdy beta](#2-migawka-prawdy-beta)
3. [Audyt FTUE](#3-audyt-ftue-pierwsza-wizyta-uzytkownika)
4. [Audyt ekran po ekranie](#4-audyt-ekran-po-ekranie)
5. [Audyt mobile / desktop](#5-audyt-mobile--desktop)
6. [Werdykt zdjęcia](#6-werdykt-zdjecia)
7. [Co powinno pozostać ukryte na betę](#7-co-powinno-pozostac-ukryte-na-bete)
8. [TOP finalne poprawki przed betą](#8-top-finalne-poprawki-przed-beta)
9. [Co już nie wymaga audytowania](#9-co-juz-nie-wymaga-audytowania)
10. [Finalna rekomendacja](#10-finalna-rekomendacja)
11. [ANEKS A: Export PDF/Excel/Word](#aneks-a-export-pdfexcelword)
12. [ANEKS B: Szczegóły kolorów](#aneks-b-szczegoly-kolorow)
13. [ANEKS C: Wydajność i bundle](#aneks-c-wydajnosc-i-bundle)
14. [ANEKS D: Ikony i logo](#aneks-d-ikony-i-logo)
15. [ANEKS E: Strony publiczne i SEO](#aneks-e-strony-publiczne-i-seo)
16. [ANEKS F: Obsługa błędów](#aneks-f-obsluga-bledow)
17. [ANEKS G: Zarządzanie klientami](#aneks-g-zarzadzanie-klientami)
18. [ANEKS H: Flow tworzenia oferty end-to-end](#aneks-h-flow-tworzenia-oferty-end-to-end)
19. [ANEKS I: Zweryfikowane pliki źródłowe](#aneks-i-zweryfikowane-pliki-zrodlowe)

---

## 1. WERDYKT WYKONAWCZY

### NIE GOTOWY NA ZAMKNIĘTĄ BETĘ — WYMAGA KRYTYCZNYCH POPRAWEK

Aplikacja Majster.AI posiada **solidny fundament architektoniczny** i imponujący zakres funkcji:
- 25 prawdziwych szablonów dokumentów budowlanych z odniesieniami do Kodeksu Cywilnego
- Pełny pipeline foto z kompresją WebP, 4 fazami (BEFORE/DURING/AFTER/ISSUE), podpisem cyfrowym
- 3 języki z 3281+ kluczami tłumaczeń każdy
- Nowoczesna nawigacja z FAB i bottom nav
- Działający export PDF (jsPDF, 3 szablony: classic/modern/minimal)
- Solidny system klientów z CRUD, walidacją Zod, paginacją
- ErrorBoundary z integracją Sentry na poziomie root
- Lazy loading 100% stron + manual chunk splitting (458KB gzipped)

Jednak **rzeczywistość runtime brutalnie rozmija się z prawdą kodu**:

| # | Problem | Dotkliwość |
|---|---------|-----------|
| 1 | **BLOKER ZERO**: Strony Ofert i Projektów pokazują błąd ładowania — brak migracji DB na produkcji | 🔴 KRYTYCZNY |
| 2 | **POTWIERDZONE**: Voice/AI/Manual na Dashboard prowadzą do IDENTYCZNEGO formularza ręcznego — OfferWizard **kompletnie ignoruje** `state.mode` | 🔴 KRYTYCZNY |
| 3 | **POTWIERDZONE**: Strona `/app/photos` istnieje ale **NIE MA JEJ W ŻADNEJ NAWIGACJI** — feature osierocona | 🔴 KRYTYCZNY |
| 4 | **POTWIERDZONE**: DashboardStats karty mają hover animacje ale **NIE SĄ KLIKALNE** | 🟡 ŚREDNI |
| 5 | **POTWIERDZONE**: Karty są czystym białym #FFFFFF na tle #F9FAFB — kontrast 1.05:1 | 🟡 ŚREDNI |
| 6 | **POTWIERDZONE**: Wzory dokumentów to puste formularze — zero podglądów PDF | 🟡 ŚREDNI |
| 7 | **POTWIERDZONE**: Sidebar primary color w light mode: 3.07:1 (WCAG AA wymaga 4.5:1) | 🟡 ŚREDNI |
| 8 | **V3-NOWE**: Excel export gotowy w kodzie ale **MARTWY** — brak przycisku w UI | 🟢 NISKI |
| 9 | **V3-NOWE**: Word export **NIE ISTNIEJE** w żadnej formie | 🟢 NISKI |
| 10 | **V3-NOWE**: Login page — `overflow-hidden` + `min-h-screen` na mobile może powodować overflow | 🟡 ŚREDNI |

**Z 8-10 celowanymi poprawkami aplikacja BĘDZIE gotowa na betę.**

---

## 2. MIGAWKA PRAWDY BETA

### Co jest NAPRAWDĘ silne teraz:

| Obszar | Ocena | Detale |
|--------|-------|--------|
| **Routing i nawigacja** | 9/10 | 40+ tras, zero martwych linków, spójna nawigacja w obu shellach |
| **i18n infrastruktura** | 9/10 | PL/EN/UK kompletne (3281+ kluczy), zero brakujących na głównych powierzchniach |
| **Bezpieczeństwo** | 9/10 | RLS na wszystkich tabelach, prywatne buckety storage, walidacja plików, CAPTCHA |
| **Mobile layout** | 8/10 | Bottom nav z FAB, safe area dla notcha, animacje sprężystowe Framer Motion |
| **Zarządzanie klientami** | 8/10 | Pełny CRUD, walidacja Zod, paginacja server-side, search z debounce, empty state |
| **PDF export** | 8/10 | jsPDF z 3 szablonami, nagłówek firmy, tabela pozycji, podpisy, waluta PLN |
| **Settings** | 8/10 | 8 aktywnych zakładek, responsywne na mobile i desktop |
| **Onboarding** | 8/10 | 5-krokowy wizard z opcją pominięcia, auto-trigger dla nowych użytkowników |
| **Kompresja obrazów** | 9/10 | WebP, 1600px, 0.75 quality, EXIF strip — enterprise jakość |
| **Error handling (infrastruktura)** | 7/10 | ErrorBoundary root + PanelErrorBoundary + Sentry + toast (sonner) |
| **Wydajność** | 8/10 | 458KB gzip, lazy loading, manual chunks, 5min staleTime React Query |
| **Landing page** | 8/10 | SEO kompletne (structured data, OG, hreflang), responsive, dark mode |

### Co jest TYLKO "dobre w kodzie" ale NIE w runtime:

| Obszar | Problem |
|--------|---------|
| **Oferty i Projekty** | Tabele nie istnieją na produkcji → ekran błędu |
| **Pipeline foto** | Kod kompletny ale **osierocony** — brak w nawigacji + zależny od Projektów |
| **Voice/AI mode** | `state.mode` jest PRZEKAZYWANY ale **KOMPLETNIE IGNOROWANY** przez OfferWizard |
| **Asystent AI** | Chat działa ale nie jest zintegrowany z tworzeniem oferty — osobny chatbot |
| **Wzory dokumentów** | 25 szablonów z ref. prawnymi, ale użytkownik widzi **puste formularze** |
| **Excel export** | `exportQuoteToExcel()` gotowy w `src/lib/exportUtils.ts` — zero przycisków w UI |
| **CSV export** | `exportQuoteToCSV()`, `exportProjectsToCSV()` gotowe — zero przycisków w UI |

### Co nadal osłabia zaufanie:

- Czysty biały #FFFFFF na kartach — kontrast z tłem 1.05:1 (WCAG wymaga 3.0)
- DashboardStats WYGLĄDAJĄ na klikalne (`hover:shadow-xl`, `hover:-translate-y-1`) ale nie prowadzą nigdzie
- EmptyDashboard benefit cards mają hover animacje ale nie są klikalne
- AdBanner CTA przycisk istnieje wizualnie ale **NIE MA onClick handler**
- Brak pastelowych/ciepłych tonów — cała paleta jest zimna/korporacyjna
- Zero podglądów PDF w bibliotece dokumentów
- AI prompty hardcoded po polsku (EN/UK użytkownicy wysyłają polskie prompty)
- Voice input hardcoded na `pl-PL`
- Mesh-gradient jawnie wyłączony (`'mesh-gradient': 'none'`), efekt glow zdefiniowany ale nieużywany
- Brak niestandardowych ilustracji — tylko generyczne ikony lucide-react
- Finance page: przyciski exportu **istnieją** ale brak onClick (martwe)
- Kalendarz: brak ErrorState i EmptyState — spinner w nieskończoność

---

## 3. AUDYT FTUE (Pierwsza Wizyta Użytkownika)

| Etap | Ocena | Gotowość | Tarcie | Wpływ na zaufanie |
|------|-------|----------|--------|-------------------|
| **Landing** | 8/10 | 90% | Niskie | Pozytywny — czysta, profesjonalna, SEO kompletne |
| **Rejestracja** | 7/10 | 85% | Niskie | Dobry — siła hasła, opcjonalny telefon, `p-4` safe |
| **Weryfikacja email** | 7/10 | 85% | Średnie | Neutralny — hint o SPAM, resend z cooldown |
| **Login** | 6/10 | 70% | **Średnie** | **RYZYKO** — `overflow-hidden` + `min-h-screen` na mobile |
| **Onboarding** | 8/10 | 90% | Niskie | Pozytywny — 5 kroków, skip, progress |
| **Dashboard (nowy)** | 4/10 | 45% | **Wysokie** | **NEGATYWNY** — karty wyglądają klikalnie ale nie są |

### Szczegóły krytyczne:

**Login page overflow (V3 — pogłębiona analiza):**
- `src/pages/Login.tsx:189` — root div: `overflow-hidden` na `min-h-screen flex flex-col`
- `src/pages/Login.tsx:289` — prawy panel: `min-h-screen lg:min-h-0` + `py-12`
- Gdy pojawią się dodatkowe elementy (banner niepotwierdzony email ln 314-364, CAPTCHA ln 451-457, komunikaty błędów ln 397-408), łączna wysokość może przekroczyć viewport na urządzeniach < 600px
- **WYMAGA MANUALNEJ WERYFIKACJI** na iPhone SE (375px) i Galaxy S8 (360px)

**Dashboard nowego użytkownika:**
- EmptyDashboard benefit cards: `hover:shadow-md hover:y-4` ale zero onClick — użytkownik klika, nic się nie dzieje
- Voice/AI/Manual: 3 karty OBIECUJĄ różne doświadczenia, wszystkie prowadzą do identycznego formularza
- OfferWizard.tsx:73-76 — Props: `{ offerId?: string }` — ZERO parametru mode, NIE importuje useLocation

---

## 4. AUDYT EKRAN PO EKRANIE

### Landing: 8/10 | 90%
- **Działa**: Hero z "Zacznij bezpłatnie — bez karty kredytowej", sticky header, dark mode, responsive, language switcher
- **SEO**: Helmet z meta, OG tags, hreflang PL/EN/UK, structured data (Organization, SoftwareApplication, FAQPage)
- **Komponenty**: LandingHeader (hamburger mobile), HeroSection (responsive CTA), TrustBar, FeaturesGrid, HowItWorks, Testimonials, Pricing, FAQ (accordion), Footer (`safe-area-inset-bottom`)
- **Nie gra**: Brak prawdziwych testimoniali, brak demo video, brak screenshotów app

### Register: 7/10 | 85%
- **Działa**: Walidacja Zod, Google/Apple login, wskaźnik siły hasła, anty-duplikat telefonu
- **Layout**: `min-h-screen items-center justify-center p-4` + `max-w-md` — **BEZPIECZNY** na mobile
- **SEO**: Helmet z title, description, canonical, OG tags

### Login: 6/10 | 70%
- **Działa**: CAPTCHA po 3 próbach, social login, email verification z resend+cooldown
- **RYZYKO**: `overflow-hidden` na root + `min-h-screen` na panelu formularza — potencjalny overflow na małych ekranach z dodatkowymi elementami (error banner, CAPTCHA widget)
- **SEO**: Helmet z title, description, canonical

### Dashboard: 4/10 | 50%
- **Działa**: QuickActions (4 karty) nawigują poprawnie, RecentProjects klikalne, TodayTasks ze strzałkami, AnimatedCounter ze sparklines
- **Nie gra**:
  - **DashboardStats**: `hover:shadow-xl transition-all duration-300 hover:-translate-y-1` + `cursor-default` — WYGLĄDAJĄ klikalnie ale NIE SĄ
  - **EmptyDashboard benefit cards**: `hover:shadow-md` ale zero onClick
  - **AdBanner CTA button**: Button bez onClick handler
  - **Voice/AI/Manual**: POTWIERDZONE — OfferWizard NIE importuje useLocation, NIE czyta state.mode
  - Brak interaktywnych wykresów na Dashboard (Recharts użyty tylko w Finance)
  - Gradienty minimalne, mesh-gradient wyłączony

### Oferty: 3/10 | 40%
- **Działa w kodzie**: Error handling z detekcją PGRST205, empty state z CTA, filtry statusów (ALL/DRAFT/SENT/ACCEPTED/REJECTED/ARCHIVED), search z debounce 300ms, "Szablony branżowe" → IndustryTemplateSheet
- **Nie gra na live**: **EKRAN BŁĘDU** — "Błąd ładowania ofert. Baza danych wymaga aktualizacji." — tabela `offers` nie istnieje (migracja `20260301140000`)
- **PDF export**: DZIAŁA — jsPDF z 3 szablonami (classic/modern/minimal), nagłówek firmy, tabela pozycji, podsumowanie, podpisy, waluta PLN
- **Excel/CSV export**: Kod gotowy w `src/lib/exportUtils.ts` ale **ZERO przycisków w UI**

### Projekty: 3/10 | 40%
- **Działa w kodzie**: Filtry (ALL/ACTIVE/COMPLETED/ON_HOLD), search z debounce, soft-delete z AlertDialog, klikalne karty → ProjectHub
- **Nie gra na live**: **EKRAN BŁĘDU** — tabela `v2_projects` nie istnieje (migracja `20260301180000`)

### Klienci: 7/10 | 80%
- **Działa**: Pełny CRUD (dodaj/edytuj/usuń), walidacja Zod (`clientSchema`), paginacja server-side (`useClientsPaginated` z page/pageSize/search), search z debounce 300ms, skeleton loading (`ClientsGridSkeleton`), empty state z CTA, auto-open modal via `?new=1` query param
- **Nawigacja**: Dostępni w sidebar (`/app/customers`), FAB ("Dodaj klienta"), bottom nav (old shell), redirecty `/clients` → `/app/customers`
- **Layout**: Responsive grid `sm:grid-cols-2 lg:grid-cols-3`, karty z ikonami (Phone/Mail/MapPin), hover animacje
- **Nie gra**: Brak linku klient → jego oferty/projekty (relacja istnieje w DB via `client_id` ale UI nie pokazuje), `confirm()` natywny zamiast AlertDialog przy usuwaniu, brak ErrorState przy błędzie query

### Kalendarz: 5/10 | 60%
- **Działa**: 5 widoków (miesiąc/tydzień/dzień/agenda/timeline), CRUD eventów, typy: deadline/meeting/reminder/work/other
- **Nie gra**: **BRAK ErrorState** — spinner w nieskończoność przy błędzie. **BRAK EmptyState** — pusty kalendarz nie mówi "Dodaj pierwsze wydarzenie"

### Finance: 6/10 | 70%
- **Działa**: Recharts wykresy (AreaChart, BarChart), real data z Supabase, filtry dat, karty podsumowania
- **Nie gra**: Przyciski exportu istnieją wizualnie ale **nie mają onClick** — martwe. Quick Estimate workspace za to jest **doskonały** (auto-save, drafty, pełna funkcjonalność)

### Settings: 7.5/10 | 85%
- **Działa**: 8 aktywnych zakładek, mobile vertical list z chevron, desktop horizontal tabs, responsywne
- **Nie gra**: Biometric/Push disabled (feature flags = false) — OK dla bety

### Plan/Subskrypcja: 6/10 | 70%
- **Działa**: 4 plany z limitami, fallback na PlanRequestModal (email), banner informacyjny
- **Nie gra**: Stripe niekonfigurowany, hardcoded angielskie nazwy planów zamiast tłumaczeń

### Zdjęcia: 2/10 | 25% (runtime)
- **Działa w kodzie (80%)**: PhotoReportPanel z 4 fazami, kamera mobilna `capture="environment"`, CameraPermissionGate, kompresja WebP, optimistic UI, galeria 3-kolumnowa, podpis cyfrowy SignaturePad, checklist akceptacji
- **Nie gra w runtime**: Strona `/app/photos` NIE JEST W ŻADNEJ NAWIGACJI (zweryfikowane w 6 komponentach nawigacyjnych). Feature dostępna TYLKO wewnątrz ProjectHub który nie działa

### Wzory dokumentów: 6/10 | 65%
- **Działa**: 25 szablonów (5 umów, 9 protokołów, 6 aneksów, 5 przeglądów), autofill, edytor z accordion, PDF z nagłówkiem i podpisami, referencje prawne
- **Nie gra**: ZERO podglądów wizualnych, ZERO miniatur, ZERO wypełnionych przykładów, ZERO podglądu PDF przed generowaniem

### Strony publiczne (V3):
- **OfferPublicPage**: Responsywna, `noindex/nofollow` (poprawnie), token-based, grid `sm:grid-cols-2`
- **DossierPublicPage**: Dobrze zbudowana, ale **BRAK Helmet/SEO** (nie krytyczne bo token-scoped)
- **Privacy/Terms**: Responsywne, `max-w-4xl`, poprawne

---

## 5. AUDYT MOBILE / DESKTOP

### Poprawne:
- Bottom Nav (4 taby + FAB slot) z animacjami sprężystowymi (stiffness 380-500, damping 30-32)
- Desktop Sidebar sticky z 3 sekcjami, 44px min-height per item (accessibility)
- Breakpoint lg (1024px) prawidłowo rozdziela mobile od desktop
- Settings responsywne (vertical list <640px, horizontal tabs >=640px)
- Safe area dla notcha (`env(safe-area-inset-bottom)`) na footer
- Landing: hamburger `md:hidden`, drawer `w-72` z overlay, body scroll lock
- Register: `p-4` + `max-w-md` — bezpieczny na każdym viewport
- CTA buttons: `min-h-[48px]` — touch-friendly (48px minimum)
- Hero: `text-4xl md:text-6xl` — responsive typography
- Pricing: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Clients: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` — responsive grid

### Wymaga dopracowania:
- **Login page overflow** — `overflow-hidden` + `min-h-screen` potencjalnie problematyczne na małych ekranach
- **Brak pull-to-refresh** na mobile
- **Desktop nie wykorzystuje pełnej przestrzeni** — karty zbyt wąskie, za "mobilny" layout
- **Page transitions niekonsekwentne** — tylko Dashboard ma `animate-fade-in`
- **Brak `/app/photos` w nawigacji** — niewidoczna na wszystkich urządzeniach
- **Zdjęcia mobile**: Pipeline foto DOSKONAŁY w kodzie (camera `capture="environment"`, CameraPermissionGate, kompresja), ale użytkownik **NIE MOŻE GO ZNALEŹĆ**

### Shell bezpieczny na betę: TAK (z wyjątkiem brakującego linku do Photos)

---

## 6. WERDYKT ZDJĘCIA

### TRZYMAĆ UKRYTE — ALE NAPRAWIĆ ODKRYWALNOŚĆ PRZED BETĄ

Kod pipeline foto jest **produkcyjnej jakości**:
- Kamera mobilna z `capture="environment"` i CameraPermissionGate
- Kompresja WebP 1600px, quality 0.75, EXIF strip
- 4 fazy: BEFORE/DURING/AFTER/ISSUE
- Galeria 3-kolumnowa z lazy loading
- Podpis cyfrowy SignaturePad
- Checklist akceptacji z 4 szablonami
- Optimistic UI z retry na upload

ALE:
1. **BLOKER**: Strona `/app/photos` NIE JEST PODŁĄCZONA DO ŻADNEJ NAWIGACJI
2. **BLOKER**: Feature dostępna tylko wewnątrz ProjectHub, który nie działa (brak tabeli `v2_projects`)
3. **BLOKER**: Bucket `project-photos` musi istnieć na produkcji Supabase

**Wymagane akcje**:
- Dodać "Zdjęcia" do MoreScreen i NewShellDesktopSidebar (Tools section)
- Uruchomić migracje DB (odblokuje ProjectHub i photo report)
- Manualny test: Projekt → Raport foto → Dodaj zdjęcie → Kamera → Upload

---

## 7. CO POWINNO POZOSTAĆ UKRYTE NA BETĘ

| Powierzchnia | Status | Powód |
|-------------|--------|-------|
| **Biometric Settings** | UKRYĆ | WebAuthn niegotowy, feature flag=false |
| **Push Notifications** | UKRYĆ | Brak persistencji, feature flag=false |
| **Analytics** (`/app/analytics`) | UKRYĆ | Wymaga danych historycznych, puste |
| **Marketplace** | UKRYĆ | Redirect do dashboard, niezaimplementowane |
| **Team Management** | UKRYĆ | Widoczne w planach ale incomplete |
| **HomeLobby** (`/app/home`) | UKRYĆ | Redirect do dashboard, placeholder |
| **Stripe Checkout** | DE-EMFAZOWAĆ | Fallback na email OK |
| **Admin Console** (`/admin/*`) | UKRYĆ | Tylko dla ownera |
| **Voice/AI mode w QuoteCreationHub** | UKRYĆ LUB NAPRAWIĆ | Obiecują funkcje których nie ma |
| **Excel/CSV export buttons** (V3) | NIE POKAZYWAĆ | Kod gotowy ale UI buttons martwe |

---

## 8. TOP FINALNE POPRAWKI PRZED BETĄ

| # | Problem | Dotkliwość | Wysiłek | Priorytet |
|---|---------|-----------|---------|-----------|
| **1** | **Uruchomić migracje DB** (48 plików — offers, v2_projects, calendar_events, project_photos, dossier, document_instances, quick_estimate_drafts, acceptance_bridge) | 🔴 KRYTYCZNY | Mały | **MUST** |
| **2** | **Dodać /app/photos do nawigacji** (MoreScreen + NewShellDesktopSidebar) | 🔴 KRYTYCZNY | Mały | **MUST** |
| **3** | **Naprawić Voice/AI/Manual mode** — OfferWizard musi czytać `location.state.mode` LUB usunąć obietnicę z Dashboard | 🔴 KRYTYCZNY | Średni | **MUST** |
| **4** | **Zmienić biały #FFFFFF na ciepły ecru** — `--card: 40 20% 96%` (~#F7EFE5), `--popover` analogicznie | 🟡 ŚREDNI | Mały | **MUST** |
| **5** | **Naprawić DashboardStats** — dodać onClick z nawigacją LUB usunąć hover animacje | 🟡 ŚREDNI | Mały | **MUST** |
| **6** | **Dodać ErrorState + EmptyState do Kalendarza** | 🟡 ŚREDNI | Mały | **MUST** |
| **7** | **Weryfikacja live Login overflow** na prawdziwym urządzeniu mobilnym | 🟡 ŚREDNI | Mały | **MUST** |
| **8** | **Naprawić sidebar primary kontrast** w light mode (3.07:1 → min 4.5:1 WCAG AA) | 🟡 ŚREDNI | Mały | **SHOULD** |
| **9** | **Przenieść AI prompts do i18n** + zmienić voice language z `pl-PL` na dynamiczny | 🟡 ŚREDNI | Mały | **SHOULD** |
| **10** | **Podłączyć Excel/CSV export do UI** — przyciski istnieją w Finance ale brak onClick, kod `exportUtils.ts` gotowy | 🟡 ŚREDNI | Mały | **SHOULD** |
| **11** | **Dodać preview/thumbnails do wzorów dokumentów** | 🟢 NISKI | Średni | **SHOULD** |
| **12** | **Naprawić Clients page** — zmienić `confirm()` na AlertDialog, dodać ErrorState, dodać link klient→oferty | 🟢 NISKI | Mały | **SHOULD** |
| **13** | **Naprawić AdBanner CTA button** — dodać onClick lub usunąć | 🟢 NISKI | Mały | **SHOULD** |
| **14** | **Dodać EmptyDashboard benefit cards onClick** lub usunąć hover | 🟢 NISKI | Mały | **SHOULD** |
| **15** | **Włączyć page transitions** na wszystkich stronach (nie tylko Dashboard) | 🟢 NISKI | Mały | **NICE** |
| **16** | **Dodać gradients/glow** do stat cards i primary CTA | 🟢 NISKI | Mały | **NICE** |
| **17** | **Dodać custom ilustracje SVG** dla empty states | 🟢 NISKI | Duży | **NICE** |
| **18** | **DossierPublicPage — dodać Helmet** z title/description | 🟢 NISKI | Mały | **NICE** |

---

## 9. CO JUŻ NIE WYMAGA AUDYTOWANIA

| Obszar | Status | Powód zamknięcia |
|--------|--------|-----------------|
| Routing i nawigacja | ZAMKNIĘTY | 40+ tras, zero martwych linków, oba shelle spójne |
| i18n infrastruktura (klucze) | ZAMKNIĘTY | 3 języki, 3281+ kluczy, zero brakujących |
| RLS i bezpieczeństwo | ZAMKNIĘTY | Wszystkie tabele z RLS, prywatne buckety, walidacja |
| Kompresja obrazów | ZAMKNIĘTY | WebP, 1600px, 0.75 quality, EXIF strip |
| Feature flags | ZAMKNIĘTY | FF_NEW_SHELL, biometric, push — prawidłowo gated |
| Mobile safe areas | ZAMKNIĘTY | Notch support, env(safe-area-inset-bottom) |
| Onboarding wizard | ZAMKNIĘTY | 5 kroków, skip, progress, auto-trigger |
| Settings responsywność | ZAMKNIĘTY | Vertical list mobile, horizontal tabs desktop |
| Ikony spójność | ZAMKNIĘTY | lucide-react w 141 plikach, zero mieszania bibliotek |
| Photo pipeline (KOD) | ZAMKNIĘTY | Kod produkcyjny — problem to odkrywalność |
| PDF export | ZAMKNIĘTY | jsPDF z 3 szablonami, działa poprawnie |
| ErrorBoundary infrastruktura | ZAMKNIĘTY | Root + Panel boundary, Sentry integration, i18n |
| Landing SEO | ZAMKNIĘTY | Structured data, OG, hreflang, robots |
| Register page | ZAMKNIĘTY | Bezpieczny layout, walidacja, SEO |
| Bundle i wydajność | ZAMKNIĘTY | 458KB gzip, lazy loading, manual chunks |
| Klienci (Clients) | ZAMKNIĘTY | CRUD pełny, walidacja, paginacja, search |

---

## 10. FINALNA REKOMENDACJA

### Czy możemy przejść do zamkniętej bety?
**TAK — ale po wykonaniu 7 obowiązkowych poprawek (MUST).**

### 7 Obowiązkowych poprawek (MUST):
1. **Uruchomić migracje DB** na produkcji Supabase — odblokuje 60% aplikacji jednym ruchem
2. **Dodać /app/photos do nawigacji** — MoreScreen + Desktop Sidebar
3. **Naprawić lub usunąć Voice/AI mode** — OfferWizard musi czytać mode albo Dashboard nie może obiecywać
4. **Zmienić --card na ciepły ecru** — 1 linia CSS w index.css
5. **Naprawić DashboardStats klikalność** — dodać onClick lub usunąć hover efekty
6. **Dodać ErrorState + EmptyState do Kalendarza**
7. **Manualny test Login** na prawdziwym urządzeniu mobilnym

### Szacowany wysiłek:
- Poprawki 1-2: **Małe** (operacja infra + 2 pliki nawigacji)
- Poprawka 3: **Średnia** (wymaga decyzji: naprawić OfferWizard czy ukryć tryby)
- Poprawki 4-7: **Małe** (CSS, komponent, test)
- **Łącznie**: Jeden sprint (1-2 dni robocze)

### Akcje właściciela:
1. Uruchomić `supabase db push` w panelu Supabase (migracje)
2. Zweryfikować stronę logowania na telefonie
3. Zdecydować: naprawić Voice/AI mode czy usunąć obietnice z Dashboard?
4. Zdecydować: Stripe na betę czy formularz email wystarczy?
5. Potwierdzić działanie zdjęć po naprawieniu nawigacji + projektów

### Następna akcja:
**Uruchomić migracje bazy danych na produkcji Supabase** — to odblokuje 60% aplikacji jednym ruchem. Następnie dodać `/app/photos` do nawigacji i naprawić DashboardStats klikalność. Te 3 rzeczy dają najwyższy zwrot z wysiłku.

---

## ANEKS A: EXPORT PDF/EXCEL/WORD

### PDF Export — DZIAŁA ✅

| Aspekt | Status | Detale |
|--------|--------|--------|
| **Biblioteka** | jsPDF | `src/lib/offerPdfGenerator.ts` (494 linii) |
| **Szablony** | 3 | classic, modern, minimal |
| **Format** | A4 portrait | Nagłówek firmy, logo, dane klienta, tabela pozycji, podsumowanie, podpisy |
| **Waluta** | PLN | Formatowanie polskie (spacja jako separator tysięcy) |
| **Trigger** | Przycisk "Pobierz PDF" | Na stronie szczegółów oferty |
| **Payload builder** | `offerPdfPayloadBuilder.ts` | Łączy dane firmy + klienta + pozycji z Supabase |

### Excel Export — KOD GOTOWY, UI MARTWY ⚠️

| Aspekt | Status | Detale |
|--------|--------|--------|
| **Biblioteka** | exceljs | `src/lib/exportUtils.ts:13-97` |
| **Funkcja** | `exportQuoteToExcel()` | Kompletna — nagłówki, formatowanie, auto-width kolumn |
| **UI przycisk** | **BRAK** | Zero komponentów importuje `exportQuoteToExcel` |
| **CSV alternatywa** | `exportQuoteToCSV()` | Gotowa, też martwa |
| **Projekty CSV** | `exportProjectsToCSV()` | Gotowa, też martwa |

### Word Export — NIE ISTNIEJE ❌

| Aspekt | Status |
|--------|--------|
| **Biblioteka** | Brak (żadna: docx, mammoth, officegen) |
| **Kod** | Zero wzmianek o Word/docx w całym codebase |
| **Rekomendacja** | Dodać bibliotekę `docx` (npm) — ~200KB, MIT license |

---

## ANEKS B: SZCZEGÓŁY KOLORÓW

### Light Mode
| Element | HSL | Hex | Problem |
|---------|-----|-----|---------|
| Background | 210 20% 98% | #F9FAFB | Zimny, korporacyjny |
| Card | 0 0% 100% | #FFFFFF | Za jasny, kontrast z bg = 1.05:1 |
| Primary | 30 90% 32% | #9B5208 | OK kontrast na białym (5.83:1) |
| Secondary | 215 16% 94% | #EDEFF2 | Zimny szary |
| Muted | 220 14% 92% | #E8EAED | Zimny szary |
| Sidebar BG | 222 47% 11% | #0F1729 | Ciemny — OK |
| Sidebar Primary | 30 90% 32% | #9B5208 | **FAIL WCAG AA (3.07:1)** |

### Dark Mode
| Element | HSL | Hex | Ocena |
|---------|-----|-----|-------|
| Background | 222 47% 8% | #0B111E | OK |
| Card | 222 40% 12% | #121A2B | OK — widoczna różnica z bg |
| Primary | 38 92% 55% | #F6A823 | Jasny amber — excellent |
| Sidebar Primary | 38 92% 55% | #F6A823 | PASS WCAG AA (10.5:1) |

### Rekomendacja kolorów:
- `--card`: zmienić na `40 20% 96%` (~#F7EFE5 ciepły ecru)
- `--popover`: analogicznie
- `--sidebar-primary` (light): rozjaśnić do ~HSL(35 85% 45%) dla kontrastu ≥4.5:1
- `--background`: rozważyć cieplejszy odcień `35 15% 97%` (~#F9F6F2)

---

## ANEKS C: WYDAJNOŚĆ I BUNDLE

### Bundle Analysis
| Metryka | Wartość | Ocena |
|---------|---------|-------|
| **Total bundle** | ~1.5MB raw | Duży ale chunked |
| **Gzipped** | ~458KB | ✅ Dobry |
| **Lazy loading** | 100% stron | ✅ Excellent |
| **Manual chunks** | 8 grup | react-vendor, ui-vendor, charts-vendor, pdf-vendor, map-vendor, motion-vendor, query-vendor, i18n-vendor |

### Lazy Loading
- Wszystkie 40+ stron załadowane via `React.lazy()` — `src/App.tsx:28-110`
- Ciężkie komponenty (mapy, wykresy) osobne chunki
- `Suspense` z fallback na każdym route

### React Query Configuration
| Parametr | Wartość | Ocena |
|----------|---------|-------|
| staleTime | 5 min | ✅ Rozsądny — unika nadmiernych refetch |
| gcTime | 10 min | ✅ Dobry cache lifetime |
| refetchOnWindowFocus | true | ✅ Standard |
| retry | 1 | ✅ Minimalne retry |

### Vite Configuration
- Manual chunk splitting w `vite.config.ts:136-152`
- 8 vendor chunks — minimalizuje main bundle
- Tree shaking aktywny

---

## ANEKS D: IKONY I LOGO

### Logo
- **Plik**: `src/components/branding/Logo.tsx`
- **Design**: Custom SVG — młotek + AI spark circles + circuit lines
- **Warianty**: 4 rozmiary (sm/md/lg/xl)
- **Animacje**: Hover effects (scale, rotate sparks)
- **Ocena**: 7/10 — oryginalne, rozpoznawalne, ale mogłoby być bardziej "budowlane"

### Ikony
- **Biblioteka**: lucide-react (jedyna)
- **Spójność**: 141 plików importuje lucide-react, zero mieszania z innymi bibliotekami (FontAwesome, Heroicons itp.)
- **Ilość**: 56+ unikalnych ikon
- **Styl**: Wszystkie outline-only (domyślny lucide), brak filled/duotone wariantów
- **Ocena**: 7/10 — spójne, ale generyczne. Brak custom ikon branżowych (wiertarka, murarka, rusztowanie)

### Rekomendacje:
- Rozważyć dodanie 5-10 custom SVG ikon branżowych dla key features
- Dodać filled warianty dla active states w nawigacji
- Dodać custom ilustracje SVG dla empty states

---

## ANEKS E: STRONY PUBLICZNE I SEO

### Pokrycie SEO

| Strona | Helmet | Meta Desc | OG Tags | Structured Data | noindex |
|--------|--------|-----------|---------|-----------------|---------|
| Landing | ✅ | ✅ | ✅ | ✅ (3 schematy) | ❌ |
| Login | ✅ | ✅ | ✅ | ❌ | ❌ |
| Register | ✅ | ✅ | ✅ | ❌ | ❌ |
| Offer (Public) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Dossier (Public) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Privacy/Terms | ✅ | ✅ | ❌ | ❌ | ❌ |

### SEOHead Component (`src/components/seo/SEOHead.tsx`)
- Kompletny utility: canonical URL, OG, Twitter Card, hreflang, robots, structured data, preconnect, dns-prefetch
- Dobrze zbudowany, reusable

### Landing Components
- **LandingHeader**: Sticky, responsive, hamburger mobile, drawer z overlay
- **HeroSection**: `text-4xl md:text-6xl`, CTA `min-h-[48px]`, right column `hidden lg:flex`
- **PricingSection**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **FAQSection**: Accessible accordion z `overflow-hidden transition-all`
- **LandingFooter**: `pb-[env(safe-area-inset-bottom)]`

### viewport (`index.html`)
- `width=device-width, initial-scale=1` — poprawny
- Brak `maximum-scale=5` (minor — nie krytyczne)

---

## ANEKS F: OBSŁUGA BŁĘDÓW

### Architektura Error Handling

| Warstwa | Komponent | Status |
|---------|-----------|--------|
| **Root Error Boundary** | `ErrorBoundary` w `src/App.tsx:159` | ✅ Aktywny — łapie crashe React |
| **Panel Error Boundary** | `PanelErrorBoundary` | ✅ Ciche (renderuje null) — nie crashuje strony |
| **Sentry integration** | `logError()` w obu boundaries | ✅ Raportuje z context (componentStack, boundary name) |
| **Toast notifications** | `sonner` (toast) | ✅ Używany w mutacjach (Clients, Offers) |
| **TanStack Query** | Per-query error handling | ⚠️ Niekonsekwentne — niektóre strony mają ErrorState, inne nie |

### ErrorBoundary UI (`src/components/ErrorBoundary.tsx`)
- Card z AlertTriangle icon, i18n'd messages
- "Retry" button (resetuje state) + "Refresh Page" button
- Error details w `<details>` tag (expandable)
- **UWAGA**: Pokazuje `error.message` — potencjalnie wrażliwe info (stacktrace nie, ale message tak)

### Strony z ErrorState vs bez:

| Strona | ErrorState | EmptyState | Loading |
|--------|-----------|------------|---------|
| Offers | ✅ (z PGRST205 detection) | ✅ | ✅ Skeleton |
| Projects | ✅ | ✅ | ✅ Skeleton |
| Clients | ❌ (brak) | ✅ | ✅ Skeleton |
| Calendar | ❌ (spinner w nieskończoność) | ❌ | ✅ Spinner |
| Finance | ✅ | ✅ | ✅ |
| Dashboard | ✅ (via ErrorBoundary) | ✅ (EmptyDashboard) | ✅ |

### 404/NotFound
- Brak dedykowanej strony 404 — React Router catch-all redirect do `/` (Index → Dashboard)
- Nie krytyczne dla bety ale warto dodać

---

## ANEKS G: ZARZĄDZANIE KLIENTAMI

### Clients Page (`src/pages/Clients.tsx`) — Pełna analiza

**CRUD Operations:**
- ADD: Dialog z formularzem, walidacja Zod (`clientSchema`), `useAddClient()` mutation
- EDIT: Ten sam dialog, pre-filled z danymi klienta, `useUpdateClient()` mutation
- DELETE: `confirm()` natywny (powinien być AlertDialog), `useDeleteClient()` mutation

**Paginacja:**
- Server-side via `useClientsPaginated({ page, pageSize, search })`
- `PAGE_SIZE = 20`
- `PaginationControls` komponent z page/totalPages

**Search:**
- `SearchInput` z `useDebounce(300ms)`
- Reset do page 1 przy zmianie query

**Deep Link:**
- `/app/customers?new=1` auto-otwiera modal dodawania (via `useSearchParams`)

**Nawigacja do klientów:**
- `NewShellDesktopSidebar`: `/app/customers` ✅
- `NewShellFAB`: "Dodaj klienta" → `/app/customers` ✅
- `NewShellTopBar`: "add-client" → `/app/customers` ✅
- `MobileBottomNav` (old shell): `/app/customers` ✅
- Redirecty: `/clients` → `/app/customers`, `/customers` → `/app/customers` ✅

**Relacje z innymi encjami:**
- `client_id` w typach Project (`src/types/index.ts:13`)
- `client_id` w Offer (`src/lib/offerPdfPayloadBuilder.ts`)
- Walidacja: `projectSchema` wymaga `client_id`
- **ALE**: UI nie pokazuje ofert/projektów klienta na karcie klienta

---

## ANEKS H: FLOW TWORZENIA OFERTY END-TO-END

### Ścieżka użytkownika:

```
Dashboard → QuoteCreationHub → navigate('/app/offers/new', { state: { mode } })
                                           ↓
                                    OfferDetail.tsx
                                           ↓
                                    OfferWizard.tsx ← NIE CZYTA state.mode!
                                           ↓
                            (identyczny formularz ręczny zawsze)
```

### 11 faz OfferWizard (gdy tabela istnieje):
1. **Typ usługi** — wybór kategorii
2. **Dane klienta** — formularz lub wybór z bazy
3. **Pozycje oferty** — tabela z cenami, ilościami, VAT
4. **Podsumowanie kosztów** — netto/VAT/brutto, waluta
5. **Warunki handlowe** — termin ważności, warunki płatności
6. **Notatki** — uwagi do oferty
7. **Szablon PDF** — classic/modern/minimal
8. **Podgląd** — preview przed generowaniem
9. **Generowanie PDF** — jsPDF
10. **Wysyłka** — email via Resend + public link z tokenem
11. **Akceptacja** — klient zatwierdza przez public page

### Problem Voice/AI/Manual:
- `QuoteCreationHub` przekazuje `{ state: { mode: 'voice' | 'ai' | 'manual' } }`
- `OfferDetail` NIE importuje `useLocation`, NIE czyta state
- `OfferWizard` Props: `{ offerId?: string }` — ZERO parametru mode
- **Wynik**: Wszystkie 3 tryby renderują identyczny formularz ręczny

---

## ANEKS I: ZWERYFIKOWANE PLIKI ŹRÓDŁOWE

| Komponent | Ścieżka | Kluczowe linie |
|-----------|---------|---------------|
| Router | src/App.tsx | 1-340 (40+ routes, lazy loading, ErrorBoundary) |
| Dashboard | src/pages/Dashboard.tsx | 1-231 |
| DashboardStats | src/components/dashboard/DashboardStats.tsx | 160-210 (hover bez onClick) |
| QuoteCreationHub | src/components/dashboard/QuoteCreationHub.tsx | 29,39,45 (state.mode) |
| OfferWizard | src/components/offers/wizard/OfferWizard.tsx | 73-76 (Props: tylko offerId) |
| OfferDetail | src/pages/OfferDetail.tsx | NIE importuje useLocation |
| PDF Generator | src/lib/offerPdfGenerator.ts | 90-494 (3 szablony) |
| Export Utils | src/lib/exportUtils.ts | 13-185 (Excel/CSV — martwy kod) |
| Photos page | src/pages/Photos.tsx | 1-170 (istnieje ale osierocona) |
| PhotoReportPanel | src/components/photos/PhotoReportPanel.tsx | 4 fazy, kamera, kompresja |
| Clients | src/pages/Clients.tsx | 1-334 (CRUD, paginacja, search) |
| NewShellBottomNav | src/components/layout/NewShellBottomNav.tsx | 15-20 (bez photos) |
| NewShellDesktopSidebar | src/components/layout/NewShellDesktopSidebar.tsx | 36-61 (bez photos) |
| MoreScreen | src/pages/MoreScreen.tsx | 38-55 (bez photos) |
| Calendar | src/pages/Calendar.tsx | 197-203 (brak ErrorState) |
| Finance | src/pages/Finance.tsx | Recharts, export buttons martwe |
| ErrorBoundary | src/components/ErrorBoundary.tsx | 1-118 (Root + Panel, Sentry) |
| CSS kolory | src/index.css | 8-153 |
| Document Templates | src/data/documentTemplates.ts | 1-1721 (25 szablonów) |
| TemplatesLibrary | src/components/documents/templates/TemplatesLibrary.tsx | 75-110 (tylko tekst) |
| AiChatAgent | src/components/ai/AiChatAgent.tsx | 51-53 (hardcoded PL), 81 (pl-PL) |
| Logo | src/components/branding/Logo.tsx | Custom SVG, 4 rozmiary, hover |
| Landing | src/pages/Landing.tsx | SEO, structured data, 10 komponentów |
| Login | src/pages/Login.tsx | 189 (overflow-hidden), 289 (min-h-screen) |
| Register | src/pages/Register.tsx | 124 (p-4 safe) |
| SEOHead | src/components/seo/SEOHead.tsx | Kompletny SEO utility |
| LandingHeader | src/components/landing/LandingHeader.tsx | Sticky, hamburger, drawer |
| LandingFooter | src/components/landing/LandingFooter.tsx | safe-area-inset-bottom |
| Vite config | vite.config.ts | 136-152 (manual chunks) |
| Migracje DB | supabase/migrations/ | 48 plików, poprawna kolejność |

---

**Koniec raportu V3. Wersja skonsolidowana — V1+V2+V3 w jednym dokumencie, weryfikacja 200%.**
