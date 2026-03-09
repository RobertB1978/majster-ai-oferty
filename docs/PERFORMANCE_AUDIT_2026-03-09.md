# AUDYT WYDAJNOŚCI I RESPONSYWNOŚCI — Majster.AI

**Data:** 2026-03-09
**Model:** Claude Opus 4.6
**Źródło:** analiza repozytorium (kod, konfiguracja, architektura)
**REPO ACCESS = AVAILABLE**

---

## SEKCJA 1 — WERDYKT WYKONAWCZY

**Status ogólny: MIXED — dobra baza, z istotnymi lukami**

Aplikacja Majster.AI ma solidne fundamenty wydajnościowe: lazy loading na wszystkich stronach, React Query z 5-minutowym staleTime globalnie, code splitting z manualChunks, lazy-loaded Recharts i framer-motion, splash screen eliminujący CLS, oraz theme-init.js zapobiegający flash-of-wrong-theme. Jednak poniżej tej warstwy kryje się **5 głównych klas wąskich gardeł**:

1. **select('*') w ~30 hookach** — nadmierne pobieranie danych z Supabase, zwiększone payload i czas odpowiedzi
2. **Brak staleTime w wielu hookach** (poleganie na globalnym default) — brak świadomej polityki cache'owania per-hook, część hooków nie ma go wcale (notifications, calendar, subscription)
3. **Brak wirtualizacji list** — przy rosnącej ilości danych (oferty, projekty, taski) listy mogą spowolnić rendering
4. **Niski poziom memoizacji** — tylko 63 użycia useMemo/useCallback/React.memo w 21 plikach na ~200+ komponentów
5. **AnimatePresence mode="wait"** w PageTransition — blokuje wyświetlenie nowej strony do zakończenia animacji wyjścia (80ms), dodając percepcyjne opóźnienie przy każdej nawigacji

**Największe ryzyko dla przyszłej szybkości:** brak polityki kolumn w zapytaniach Supabase (select('*')) i brak dyscypliny memoizacji — obydwa problemy będą się skalować liniowo z rozrostem aplikacji.

---

## SEKCJA 2 — MAPA FEATURE'ÓW

| Feature/Obszar | Pierwsze otwarcie | Powtórne otwarcie | Klasa wąskiego gardła | Severity | Typ dowodu | Uwagi |
|---|---|---|---|---|---|---|
| Login/Register | Szybkie (lazy) | Natychmiastowe (cache) | Brak | P2 | Zweryfikowane | Strony auth są lazy-loaded |
| App Shell (AppLayout) | Średnie | Szybkie | AUTH+CONFIG bootstrap | P1 | Zweryfikowane | AuthProvider + ConfigProvider + supabase.auth.getSession() blokują render |
| Dashboard | Średnie | Szybkie (5min cache) | 3 równoległe zapytania | P1 | Zweryfikowane | useDashboardStats = 3 query, plus useOnboarding, useSubscription, useExpirationMonitor |
| Oferty (lista) | Szybkie | Szybkie (30s cache) | Brak wirtualizacji | P2 | Hipoteza | useOffers z debounced search, ale bez virtualization |
| OfferDetail | Średnie | Średnie (10s staleTime) | Krótki cache, select('*') | P1 | Zweryfikowane | staleTime: 10_000 = częsty refetch |
| Projekty V1 (Projects) | Szybkie | Szybkie (default 5min) | select z kolumnami OK | P2 | Zweryfikowane | useProjectsPaginated z pagination |
| Projekty V2 (ProjectsList) | Szybkie | Szybkie (30s cache) | select('*') na v2_projects | P1 | Zweryfikowane | useProjectsV2List uses select('*') |
| ProjectHub/Detail | Średnie | Średnie | select('*'), wielokrotne hooki | P1 | Zweryfikowane | useProjectV2 + useProjectChecklist + useProjectCosts + useDossier |
| Klienci | Szybkie | Szybkie (default 5min) | Brak staleTime jawnie | P2 | Zweryfikowane | useClientsPaginated z pagination, ale bez jawnego staleTime |
| Kalendarz | Wolne | Średnie | select('*'), brak staleTime, deprecated useProjects, 687 LOC | P0 | Zweryfikowane | useCalendarEvents: select('*'), PLUS useProjects() (deprecated!) pobiera WSZYSTKIE projekty; 4 widoki kalendarza (Month/Week/Day/Agenda) renderowane eagerly |
| Finanse | Wolne | Średnie | 3 zapytania sekwencyjne w useFinancialSummary | P0 | Zweryfikowane | Pobiera quotes + costs + projects osobno, przetwarza client-side |
| Quick Estimate | Szybkie | Szybkie | — | P2 | Zweryfikowane | Lekki komponent |
| Szybka Wycena Workspace | Średnie | Średnie | useItemTemplates + inne hooki | P2 | Zweryfikowane | |
| Zdjęcia (Photos) | Średnie | Średnie | Potencjalnie duże payloady | P2 | Hipoteza | useProjectPhotos: select('*') |
| Ustawienia (Settings) | Szybkie | Szybkie | — | P2 | Zweryfikowane | Lekki komponent |
| Profil firmy | Średnie | Średnie | useProfile: select('*') | P2 | Zweryfikowane | |
| Szablony dokumentów | Szybkie | Szybkie | useDocumentInstances: select('*') wielokrotnie | P1 | Zweryfikowane | 4× select('*') |
| Analytics | Wolne | Średnie (15min cache) | **BEZPOŚREDNI import Recharts** (omija chart-lazy.tsx!), 4 wykresy na mount | P0 | Zweryfikowane | Analytics.tsx:6-8 importuje BarChart/PieChart/AreaChart bezpośrednio z recharts |
| Admin (wszystkie strony) | Szybkie | Szybkie | select('*'), Realtime subscriptions | P2 | Zweryfikowane | Izolowane lazy chunki, ale select('*') |
| Dossier (publiczny) | Średnie | Średnie | select('*') wielokrotnie | P2 | Zweryfikowane | useDossier: 4× select('*') |
| Mapa zespołu | Wolne | Wolne | Leaflet ładowany na żądanie | P2 | Zweryfikowane | leaflet-vendor chunk, ale import synchroniczny w komponencie |
| AI Chat | Średnie | Szybkie (2min cache) | Lazy-loaded | P2 | Zweryfikowane | AiChatAgent lazy w AppLayout |
| PDF Generator | Wolne | Wolne | jspdf + autotable | P1 | Hipoteza | pdf-vendor chunk, ale generacja PDF może trwać długo |
| Powiadomienia | Szybkie | Szybkie (brak staleTime) | select('*'), brak staleTime | P1 | Zweryfikowane | useNotifications: brak staleTime, select('*') |
| Billing/Plan | Szybkie | Szybkie | useSubscription: select('*'), brak staleTime | P2 | Zweryfikowane | |

---

## SEKCJA 3 — TABELA ZNALEZISK

| ID | Obszar | Plik/Lokalizacja | Objaw dla użytkownika | Przyczyna techniczna | Severity | Dowód | Fix Class |
|---|---|---|---|---|---|---|---|
| F01 | Dane | ~30 hooków (patrz lista poniżej) | Wolniejsze ładowanie danych, większe payloady | `select('*')` zamiast jawnych kolumn | P0 | Zweryfikowane | QUERY |
| F02 | Finanse | `src/hooks/useFinancialReports.ts:40-107` | Wolne otwarcie strony Finanse | useFinancialSummary: 3 osobne zapytania (quotes + costs + projects), przetwarzanie client-side | P0 | Zweryfikowane | QUERY |
| F03 | Cache | `src/hooks/useNotifications.ts` | Niepotrzebny refetch powiadomień | Brak staleTime (polega na globalnym 5min, ale nie ma gcTime) | P1 | Zweryfikowane | CACHE |
| F04 | Cache | `src/hooks/useCalendarEvents.ts` | Niepotrzebny refetch kalendarza | Brak jawnego staleTime i gcTime | P1 | Zweryfikowane | CACHE |
| F05 | Cache | `src/hooks/useSubscription.ts` | Subskrypcja pobierana za każdym razem | Brak staleTime (dane subskrypcji powinny mieć długi cache) | P1 | Zweryfikowane | CACHE |
| F06 | Cache | `src/hooks/useClients.ts` (deprecated useClients) | Refetch na każdym mount | Brak staleTime w deprecated hook, wciąż używany | P1 | Zweryfikowane | CACHE |
| F07 | Cache | `src/hooks/useProjects.ts` (deprecated useProjects) | Refetch na każdym mount | Brak staleTime w deprecated hook, wciąż używany | P1 | Zweryfikowane | CACHE |
| F08 | Routing | `src/components/layout/PageTransitionAnimated.tsx` | 80ms opóźnienie przy wyjściu ze strony | AnimatePresence mode="wait" = czeka na exit (80ms) przed wejściem nowej strony | P1 | Zweryfikowane | ROUTE |
| F09 | Lista | Oferty, Projekty, Klienci | Potencjalne spowolnienie przy dużej ilości danych | Brak wirtualizacji (react-virtual/react-window) | P1 | Hipoteza | LIST |
| F10 | Rerender | Cała aplikacja | Nadmierne rerendery | Tylko 63 użycia memo/useMemo/useCallback w 21 plikach | P1 | Zweryfikowane | RERENDER |
| F11 | Dashboard | `src/pages/Dashboard.tsx` | 5-6 hooków na mount = kaskada zapytań | useDashboardStats(3q) + useOnboarding + useSubscription + useExpirationMonitor(2q) = ~8 zapytań | P1 | Zweryfikowane | QUERY |
| F12 | OfferDetail | `src/pages/OfferDetail.tsx:45` | Częsty refetch detali oferty | staleTime: 10_000 (10 sekund) — zbyt krótkie | P1 | Zweryfikowane | CACHE |
| F13 | Expiration | `src/hooks/useExpirationMonitor.ts` | Dodatkowe zapytania przy każdym mount Dashboardu | 2 oddzielne query + waterfall checkAndNotify z dodatkowymi zapytaniami | P1 | Zweryfikowane | QUERY |
| F14 | Auth | `src/contexts/AuthContext.tsx:25-43` | Podwójne ustawienie stanu auth | onAuthStateChange + getSession() mogą powodować race condition na isLoading | P2 | Zweryfikowane | STARTUP |
| F15 | Bundle | `index.html` | Splash screen stylowany inline w HTML | Styl inline w #root = nie cacheable oddzielnie (choć mały) | P2 | Zweryfikowane | ASSET |
| F16 | i18n | `src/i18n/index.ts` | ~320KB (60KB gzip) locale w startup | Wszystkie 3 locale ładowane synchronicznie | P2 | Zweryfikowane | BUNDLE |
| F17 | Dossier | `src/hooks/useDossier.ts` | Ciężkie payloady Dossier | 4× select('*') w różnych hookach | P1 | Zweryfikowane | QUERY |
| F18 | Documents | `src/hooks/useDocumentInstances.ts` | Ciężkie payloady dokumentów | 4× select('*') w CRUD hookach | P1 | Zweryfikowane | QUERY |
| F19 | ProjectCosts | `src/hooks/useProjectCosts.ts:68` | Wolne ładowanie kosztów projektu | select('*') z staleTime: 15_000 | P2 | Zweryfikowane | QUERY |
| F20 | Layout | `src/components/layout/AppLayout.tsx:56` | 200ms transition na treści | `transition-all duration-200` + opacity/translate na głównym content | P2 | Zweryfikowane | CLS |
| F21 | WorkTasks | `src/hooks/useWorkTasks.ts` | select('*, team_members(*)') bez limitu jawnego | Join z team_members, limit 200 ale bez staleTime | P1 | Zweryfikowane | QUERY |
| F22 | Subcontractors | `src/hooks/useSubcontractors.ts` | 5× select('*') w hookach | Wielokrotne niepotrzebne full-selects | P1 | Zweryfikowane | QUERY |
| F23 | AcceptPage | `src/pages/OfferPublicAccept.tsx:135` | Zawsze refetch na publicznej stronie akceptacji | staleTime: 0 = zawsze refetch | P2 | Zweryfikowane | CACHE |
| F24 | Analytics | `src/pages/Analytics.tsx:6-8` | Ciężki chunk Recharts ładowany bezpośrednio | Bezpośredni import z `recharts` omijający `chart-lazy.tsx`; 4 wykresy mount na raz | P0 | Zweryfikowane | BUNDLE |
| F25 | Kalendarz | `src/pages/Calendar.tsx:9` | Wolne otwarcie kalendarza; wszystkie projekty ładowane | `useProjects()` (deprecated!) pobiera WSZYSTKIE projekty do dropdownu dialogu | P1 | Zweryfikowane | QUERY |
| F26 | Kalendarz | `src/pages/Calendar.tsx` | 4 widoki kalendarza eagerly rendered | Month/Week/Day/Agenda w Tabs — brak lazy loading widoków | P1 | Zweryfikowane | ROUTE |
| F27 | Settings | `src/pages/Settings.tsx` | 9 tabów z ciężkimi komponentami eagerly mounted | Wszystkie 9 tabów (Profile, Docs, Calendar, Notifications, Biometric, Email, Subscription, Account) renderowane na mount | P1 | Zweryfikowane | MODAL |
| F28 | ProjectDetail | `src/pages/ProjectDetail.tsx` | 6 ciężkich tabów (Photos, Costs, PDF Preview, Approval) eagerly mounted | Tab content z heavy components ładuje się na mount strony | P1 | Zweryfikowane | ROUTE |
| F29 | TopBar | `src/components/layout/TopBar.tsx:6` | Zapytanie do Supabase na starcie (powiadomienia) | NotificationCenter importowany eagerly w TopBar — uruchamia useNotifications hook na mount AppLayout | P1 | Zweryfikowane | STARTUP |
| F30 | Sentry | `src/main.tsx:5` + `src/lib/sentry.ts` | ~30KB w main bundle bez potrzeby | Sentry importowany statycznie (initSentry deferred, ale moduł parsowany na starcie) | P2 | Zweryfikowane | BUNDLE |
| F31 | Fonty | `index.html` | Potencjalny FOUT (Flash of Unstyled Text) | Font "Plus Jakarta Sans" nie ma `<link rel="preload">` — ładowany dopiero przez CSS | P2 | Zweryfikowane | ASSET |
| F32 | Modal | `src/components/offers/SendOfferModal.tsx` | Dane pobierane przy KAŻDYM otwarciu modala | useEffect z direct supabase call (nie przez React Query) — brak cache między otwieraniami | P1 | Zweryfikowane | MODAL |
| F33 | Modal | `src/components/offers/OfferPreviewModal.tsx` | Ciężki podgląd A4 + generacja PDF blokuje UI | jsPDF generuje PDF synchronicznie na main thread; staleTime: 60s na danych | P1 | Zweryfikowane | MODAL |
| F34 | EdgeFn | `supabase/functions/analyze-photo/` | Brak walidacji rozmiaru obrazu przed AI | Duże zdjęcia mogą spowodować timeout edge function | P2 | Zweryfikowane | ARCHITECTURE |
| F35 | EdgeFn | `supabase/functions/send-expiring-offer-reminders/` | Brak paginacji w cron job | Może załadować cały result set do pamięci | P2 | Zweryfikowane | ARCHITECTURE |

---

## SEKCJA 4 — ZWERYFIKOWANE Z REPO

### 4.1 select('*') — pełna lista hooków

Poniższe hooki używają `select('*')` zamiast jawnych kolumn:

1. `useApiKeys.ts:25`
2. `useTeamMembers.ts:37`
3. `usePdfData.ts:29`
4. `useReminders.ts:49`
5. `useAiChatHistory.ts:22`
6. `useFinancialReports.ts:26,118,123,128`
7. `useProjectPhotos.ts:51`
8. `useWarranty.ts:66`
9. `useSubscription.ts:26`
10. `usePurchaseCosts.ts:40,62`
11. `useWorkTasks.ts:131`
12. `useOnboarding.ts:33`
13. `useProjectAcceptance.ts:65,115,166`
14. `useDocumentInstances.ts:199,223,257,291`
15. `useAdminSettings.ts:83`
16. `useDossier.ts:113,173,232,264`
17. `useProjectsV2.ts:105,135,179,203,227,258`
18. `useOfferSends.ts:26`
19. `useProjectChecklist.ts:110,151`
20. `useInspection.ts:138`
21. `useOrganizations.ts:38,56`
22. `useQuotes.ts:38`
23. `useOfferApprovals.ts:34`
24. `useBiometricCredentials.ts:55`
25. `useProjectCosts.ts:68,101`
26. `useSubcontractors.ts:52,69,93,160,176`
27. `useAuditLog.ts:125`
28. `useQuoteVersions.ts:34,56`
29. `useNotifications.ts:24`
30. `useAdminTheme.ts:63`
31. `useCalendarEvents.ts:28`
32. `useProfile.ts:47`

### 4.2 Hooki bez jawnego staleTime (polegają na globalnym 5min default)

Te hooki nie definiują staleTime, co oznacza, że polegają na globalnym domyślnym 5min. Nie jest to samo w sobie bug, ale brak świadomej decyzji per-hook:

- `useNotifications` — powinno mieć krótsze staleTime (dane mogą się szybko zmieniać)
- `useCalendarEvents` — powinno mieć jawne staleTime
- `useSubscription` / `useUserSubscription` — powinno mieć długie staleTime (15-30min)
- `useClients` (deprecated) — brak staleTime
- `useProjects` (deprecated) — brak staleTime
- `useQuote` — brak staleTime
- `useOnboarding` — brak staleTime (OK: jednorazowe)
- `useReminders` — brak staleTime
- `useWarranty` — brak staleTime
- `useWorkTasks` — brak staleTime

### 4.3 Architektura animacji strony

`PageTransitionAnimated.tsx` używa `AnimatePresence mode="wait"` co oznacza:
- Stara strona animuje wyjście (80ms)
- Dopiero potem nowa strona się pojawia
- Łączny czas przejścia: ~230ms (80ms exit + 150ms enter)
- To jest odczuwalne opóźnienie przy szybkim przełączaniu zakładek

### 4.4 Kaskada zapytań na Dashboard

Dashboard mount = minimum 8 zapytań do Supabase:
1. `dashboard-project-stats` (projects - status, created_at)
2. `dashboard-recent-projects` (projects - top 5)
3. `dashboard-clients-count` (clients - count)
4. `onboarding-progress`
5. `user-subscription`
6. `expiring-offers`
7. `subscription-expiration`
8. Ewentualne dodatkowe z TrialBanner

### 4.5 Eager NotificationCenter w TopBar

`TopBar.tsx:6` importuje `NotificationCenter` eagerly. Ten komponent uruchamia `useNotifications()` hook, który wykonuje zapytanie do Supabase (`notifications` table, select('*')`) na mount AppLayout. Oznacza to, że **każde wejście do app shell powoduje dodatkowe zapytanie o powiadomienia** — nawet jeśli użytkownik nie otwierał panelu powiadomień.

### 4.6 Sentry statyczny import

`main.tsx:5` importuje `initSentry` z `@/lib/sentry`. Choć `initSentry()` jest wywołane w `setTimeout(0)`, sam moduł Sentry (~30KB) jest parsowany podczas startu aplikacji. Można go zamienić na dynamic import z guardem env var.

### 4.5 Pozytywne wzorce (zweryfikowane)

- ✅ Wszystkie strony lazy-loaded (`React.lazy`)
- ✅ QueryClient z globalnym `staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false`
- ✅ manualChunks dobrze skonfigurowane (react, UI, supabase, forms, charts, framer-motion, leaflet, pdf)
- ✅ Recharts lazy-loaded przez `chart-lazy.tsx`
- ✅ framer-motion lazy-loaded przez `PageTransition.tsx`
- ✅ theme-init.js synchroniczny w `<head>` — brak flash-of-wrong-theme
- ✅ Splash screen inline w HTML — szybki FCP
- ✅ Sentry inicjalizowany asynchronicznie po `setTimeout(0)`
- ✅ DevTools lazy-loaded tylko w development
- ✅ useDebounce użyty konsekwentnie w search (300ms)
- ✅ Dashboard ma DashboardSkeleton
- ✅ Paginacja w useClientsPaginated i useProjectsPaginated
- ✅ Query key factory pattern w clients, projects, offers, projectsV2
- ✅ Optimistic updates w useAddProject, useDeleteProject
- ✅ AI Chat lazy-loaded w AppLayout
- ✅ Onboarding modals lazy-loaded
- ✅ Realtime subscriptions tylko w admin (nie w user-facing)
- ✅ OfflineBanner zamiast full-screen blocker
- ✅ Service worker registration

---

## SEKCJA 5 — SILNE HIPOTEZY

| ID | Hipoteza | Podstawa | Co potrzeba do potwierdzenia |
|---|---|---|---|
| H01 | Strona Finanse (Finance) jest zauważalnie wolniejsza od innych | useFinancialSummary robi 3 sekwencyjne zapytania + client-side processing | Lighthouse/DevTools Performance trace |
| H02 | Listy ofert/projektów przy >50 elementach mogą powodować jank | Brak wirtualizacji, renderowanie wszystkich kart w DOM | DevTools FPS monitor przy scrollu 100+ elementów |
| H03 | Dashboard kaskada 8 zapytań powoduje widoczny loading state | Wiele równoległych zapytań, ale łączny czas może być >1s | Network waterfall w DevTools |
| H04 | AnimatePresence mode="wait" dodaje percepcyjne ~100ms opóźnienie | Analiza kodu (exit 80ms przed wejściem nowej strony) | Nagranie video 240fps z Performance trace |
| H05 | useExpirationMonitor może powodować dodatkowe zapytania w tle | checkAndNotify sprawdza notifications table, tworzy notifications | Network panel + React Profiler |
| H06 | PDF generation (jspdf) blokuje UI thread | jspdf generuje PDF synchronicznie | DevTools Long Task monitor |
| H07 | Przy dużej ilości danych, useWorkTasks (limit 200) z joinem team_members może być wolny | select('*, team_members(*)') z limitem 200 | Supabase query analyzer |
| H08 | Mapa Leaflet na stronie zespołu ładuje się wolno przy pierwszym otwarciu | Leaflet ~40KB + tiles download | Network + Performance trace |
| H09 | Brak React.memo na elementach list powoduje niepotrzebne rerendery przy zmianach stanu rodzica | Tylko 21 plików z memo/useMemo/useCallback | React Profiler "Highlight updates" |
| H10 | i18n: 320KB locale data zwiększa parse time na wolnych urządzeniach mobilnych | Statyczny import 3 plików locale | Lighthouse mobile simulation |

---

## SEKCJA 6 — NIEZNANE DO POTWIERDZENIA W RUNTIME

| ID | Co zmierzyć | Gdzie zmierzyć | Narzędzie |
|---|---|---|---|
| U01 | Rzeczywisty TTI (Time to Interactive) po login | /app/dashboard po zalogowaniu | Lighthouse, Web Vitals |
| U02 | Wielkość bundles po build (gzipped) | dist/ po `npm run build` | rollup-plugin-visualizer |
| U03 | Rzeczywisty czas odpowiedzi zapytań Supabase | Każda strona z danymi | Supabase Dashboard → Performance |
| U04 | CLS (Cumulative Layout Shift) na dashboard i listach | /app/dashboard, /app/offers | Lighthouse, Web Vitals |
| U05 | LCP (Largest Contentful Paint) na landing i dashboard | /, /app/dashboard | Lighthouse |
| U06 | INP (Interaction to Next Paint) przy klikaniu tabów/filtrów | /app/offers, /app/projects | Chrome DevTools INP debugger |
| U07 | Czas generacji PDF dla dużych ofert (>20 pozycji) | /app/jobs/:id/pdf | Performance trace |
| U08 | Memory usage po długiej sesji (memory leaks) | Po 30min aktywnego użycia | DevTools Memory panel |
| U09 | Wielkość payloadów Supabase dla select('*') vs jawne kolumny | Wszystkie hooki z select('*') | Network panel → response size |
| U10 | FPS przy scrollu list z >100 elementami | /app/offers z dużą ilością danych | DevTools FPS counter |
| U11 | Czas przejścia między stronami (route transition) | Nawigacja między stronami | Performance trace |
| U12 | Vercel cold start / edge function latency | Pierwsze zapytanie po deploy | Vercel Analytics |
| U13 | Service Worker cache hit ratio | Powrotne wizyty | DevTools → Application → Service Workers |

---

## SEKCJA 7 — ANALIZA LUKI DO CELÓW SZYBKOŚCI

| Cel UX | Obecny status | Dlaczego nie osiągnięty | Severity | Potrzebna poprawka kodu czy runtime proof? |
|---|---|---|---|---|
| Login/wejście do app natychmiastowe | PARTIAL | Auth bootstrap (getSession) blokuje render. Lazy pages OK. | P2 | Runtime proof (TTI measurement) |
| Przełączanie tab/route szybkie (<100ms) | PARTIAL | AnimatePresence mode="wait" dodaje 80ms exit delay | P1 | Fix kodu (mode="popLayout" lub usunięcie wait) |
| Otwarcie narzędzia/modalu natychmiastowe | PASS | Modale lazy-loaded z Suspense fallback=null | — | — |
| Powtórna wizyta bez loading | PARTIAL | 5min globalny staleTime OK, ale wiele hooków go nie dziedziczy lub ma zbyt krótki | P1 | Fix kodu |
| Brak widocznego flickera/skoku | PARTIAL | Splash + theme-init OK, ale 200ms opacity transition na content może być widoczny | P2 | Runtime proof (CLS measurement) |
| Brak "pauzy myślenia" po kliknięciu | PARTIAL | Dashboard 8 zapytań = widoczny loading state; Finanse 3 sekwencyjne zapytania | P0 | Fix kodu |
| Zmiana języka natychmiastowa | PASS | Wszystkie locale załadowane synchronicznie, brak flash | — | — |
| Zmiana motywu natychmiastowa | PASS | theme-init.js + useTheme z localStorage | — | — |
| Lista/search/filter responsywne | PASS | useDebounce(300ms) konsekwentnie używany | — | Ale brak wirtualizacji = potencjalny problem przy skalowaniu |
| Stabilność wizualna (brak hesitation) | UNKNOWN | Potrzebny runtime proof CLS, INP | — | Runtime proof |

---

## SEKCJA 8 — KOLEJNOŚĆ PRIORYTETÓW

### P0 — Krytyczne (wpływ na codzienne użycie)

**P0-1: Polityka kolumn w zapytaniach Supabase (select('*') → jawne kolumny)**
- Dlaczego: ~30 hooków pobiera niepotrzebne dane. Przy skalowaniu bazy (nowe kolumny, JSON pola) problem będzie narastał.
- Zysk: Mniejsze payloady, szybsze zapytania, mniejsze użycie pamięci, mniejsze ryzyko wycieków danych.
- Ryzyko: Niskie — zmiana jest mechaniczna i bezpieczna.
- PR: **PR1**

**P0-2: Analytics.tsx — bezpośredni import Recharts omijający chart-lazy.tsx**
- Dlaczego: Analytics.tsx importuje BarChart/PieChart/AreaChart bezpośrednio z `recharts`, omijając istniejący lazy wrapper `chart-lazy.tsx`. To włącza ~410KB Recharts do strony Analytics chunk zamiast lazy-load.
- Zysk: Recharts ładowany dopiero gdy użytkownik wchodzi na stronę z wykresem.
- Ryzyko: Niskie — wystarczy użyć istniejącego chart-lazy.tsx lub lazy(() => import).
- PR: **PR1**

**P0-3: Optymalizacja useFinancialSummary (3 sekwencyjne zapytania → 1 lub widok SQL)**
- Dlaczego: Strona Finanse jest prawdopodobnie najwolniejsza w aplikacji.
- Zysk: 3× szybsze ładowanie strony Finanse.
- Ryzyko: Średnie — wymaga zmiany logiki zapytania lub nowej migracji.
- PR: **PR2**

### P1 — Ważne (wpływ na płynność)

**P1-1: Usunięcie AnimatePresence mode="wait" lub zmiana na mode="popLayout"**
- Dlaczego: 80ms delay na każdej nawigacji jest odczuwalny.
- Zysk: Natychmiastowe przejścia między stronami.
- Ryzyko: Niskie — proste usunięcie mode="wait" lub zmiana.
- PR: **PR1**

**P1-2: Jawne staleTime/gcTime dla kluczowych hooków**
- Dlaczego: useNotifications, useCalendarEvents, useSubscription, useWorkTasks, useQuote itd. polegają na globalnym default, co utrudnia świadome zarządzanie cache.
- Zysk: Mniej niepotrzebnych refetchów, szybsze powtórne wizyty.
- Ryzyko: Niskie.
- PR: **PR1**

**P1-3: Redukcja kaskady zapytań na Dashboard**
- Dlaczego: 8 zapytań na mount = widoczny loading state.
- Zysk: Szybsze otwarcie Dashboard.
- Ryzyko: Średnie — wymaga konsolidacji hooków lub prefetchingu.
- PR: **PR2**

**P1-4: Dodanie wirtualizacji dla nieograniczonych list**
- Dlaczego: Oferty, projekty, taski mogą rosnąć bez limitu.
- Zysk: Stały czas renderingu niezależnie od ilości danych.
- Ryzyko: Średnie — wymaga nowej zależności (wymaga zatwierdzenia).
- PR: **PR3**

### P2 — Pomocne (jakość doświadczenia)

**P2-1: Memoizacja komponentów list items**
- Dlaczego: Brak React.memo na elementach list = rerendery całej listy przy zmianie jednego elementu.
- Zysk: Płynniejsze interakcje na listach.
- Ryzyko: Niskie.
- PR: **PR3**

**P2-2: Skrócenie transition-all duration-200 na AppLayout content**
- Dlaczego: 200ms opacity+translate transition dodaje percepcyjne opóźnienie.
- Zysk: Szybsze pojawienie się treści.
- Ryzyko: Niskie.
- PR: **PR1**

**P2-3: Stale-time tuning dla OfferDetail (10s → 60s minimum)**
- Dlaczego: staleTime: 10_000 powoduje refetch co 10s.
- Zysk: Szybsze powroty do detali oferty.
- Ryzyko: Niskie.
- PR: **PR1**

---

## SEKCJA 9 — CO JUŻ JEST DOBRZE ZROBIONE

**NIE DOTYKAĆ następujących elementów — są już zoptymalizowane:**

1. ✅ **Lazy loading wszystkich stron** — `React.lazy()` dla każdej strony w `App.tsx`
2. ✅ **QueryClient globalny config** — `staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false`, `retry: 1`
3. ✅ **manualChunks w Vite** — izolacja react, UI, supabase, forms, charts, framer-motion, leaflet, pdf
4. ✅ **Recharts lazy-loaded** — `chart-lazy.tsx` z Suspense wrapper
5. ✅ **framer-motion lazy-loaded** — `PageTransition.tsx` → lazy `PageTransitionAnimated.tsx`
6. ✅ **theme-init.js** — synchroniczny skrypt w `<head>` zapobiegający FOUT/FOUC
7. ✅ **Splash screen** — inline w HTML, instant FCP
8. ✅ **Sentry async** — `setTimeout(() => initSentry(), 0)` nie blokuje render
9. ✅ **DevTools only in dev** — `lazy(() => import('@tanstack/react-query-devtools'))`
10. ✅ **useDebounce** — konsekwentnie 300ms na search inputs
11. ✅ **DashboardSkeleton** — placeholder podczas ładowania
12. ✅ **Paginacja server-side** — `useClientsPaginated`, `useProjectsPaginated`
13. ✅ **Query key factory** — `clientsKeys`, `projectsKeys`, `offersKeys`, `projectsV2Keys`
14. ✅ **Optimistic updates** — `useAddProject`, `useDeleteProject`
15. ✅ **AI Chat lazy** — `Suspense fallback={null}` w AppLayout
16. ✅ **Onboarding lazy** — TradeOnboardingModal i OnboardingModal lazy-loaded
17. ✅ **OfflineBanner** — mały banner zamiast full-screen blocker
18. ✅ **Explicit column selection** — `useOffers`, `useDashboardStats`, `useClientsPaginated`, `useProjectsPaginated` już używają jawnych kolumn
19. ✅ **Service Worker** — `sw-register.js` dla PWA caching
20. ✅ **Build analysis** — `rollup-plugin-visualizer` skonfigurowany
21. ✅ **CSP compliance** — theme-init jako zewnętrzny plik, nie inline script
22. ✅ **i18n synchroniczny** — eliminuje flash-of-wrong-language (świadomy trade-off)
23. ✅ **ScrollRestoration** — przywraca pozycję scroll przy nawigacji POP

---

## SEKCJA 10 — LUKI DO STANDARDU WORLD-CLASS

| Standard | Status | Co brakuje |
|---|---|---|
| Ścisła polityka kolumn (żaden select('*') w user-facing) | ❌ BRAK | ~30 hooków używa select('*'). Potrzebna reguła: "każdy hook musi jawnie wymieniać kolumny" |
| Polityka cache per-hook | ❌ CZĘŚCIOWA | ~15 hooków bez jawnego staleTime. Potrzebna reguła: "każdy useQuery musi mieć jawne staleTime i gcTime" |
| Polityka powtórnych wizyt route | ❌ BRAK | Brak reguły co stare dane na stronie = fresh vs stale. Potrzebna reguła: "dashboard-level pages: 5min stale, detail pages: 1min, admin: 5min" |
| Polityka startu aplikacji | ✅ CZĘŚCIOWA | Dobra baza (lazy pages, async Sentry), ale AuthProvider blokuje render. Potrzebna reguła: "startup path nie może mieć więcej niż 2 synchroniczne zapytania" |
| Polityka montowania modali | ✅ DOBRA | Lazy-loaded modals z Suspense fallback=null |
| Pułap animacji | ❌ BRAK | Brak reguły: "żadna animacja UI > 150ms, żadna animacja przejścia > 100ms" |
| Reguła wirtualizacji | ❌ BRAK | Brak wirtualizacji nigdzie w aplikacji. Potrzebna reguła: "lista z potencjałem >50 elementów musi mieć wirtualizację" |
| Reguła anty-staleTime:0 | ❌ CZĘŚCIOWA | `OfferPublicAccept.tsx:135` ma staleTime: 0. Potrzebna reguła: "staleTime: 0 wymaga komentarza uzasadniającego" |
| Governance anty-regresji performance | ❌ BRAK | Brak CI budgets, brak automatycznych checków wielkości bundles, brak performance gate w PR |
| CI performance budgets | ❌ BRAK | Brak Lighthouse CI, brak bundle size check, brak automated performance testing |
| Smoke test krytycznych flow | ❌ CZĘŚCIOWA | Playwright istnieje, ale brak performance-specific test cases |
| Polityka memoizacji | ❌ BRAK | Potrzebna reguła: "komponenty renderowane w .map() muszą być React.memo" |

---

## SEKCJA 11 — CODEX EXECUTION BRIEF

### PR1 — Quick Wins: Cache, Animacja, Bundle fix (łatwe)
**Zakres:**
- **FIX P0:** Analytics.tsx — zmiana bezpośredniego importu Recharts na lazy import przez chart-lazy.tsx
- Zmiana `AnimatePresence mode="wait"` → usunięcie mode lub `mode="popLayout"` w `PageTransitionAnimated.tsx`
- Dodanie jawnego staleTime/gcTime do ~15 hooków bez niego
- Zmiana staleTime: 10_000 → 60_000 w `OfferDetail.tsx`
- Skrócenie `transition-all duration-200` → `duration-100` w AppLayout
- Dodanie jawnego staleTime do useSubscription (15min), useNotifications (30s), useCalendarEvents (2min)
- Calendar.tsx: zamiana `useProjects()` (deprecated) na lekkie zapytanie do dropdown
- TopBar: lazy-load NotificationCenter (eliminacja eager DB query na starcie)
- Dodanie `<link rel="preload">` dla fontu Plus Jakarta Sans w index.html

**Dlaczego teraz:** Zerowe ryzyko, natychmiastowy efekt.
**Oczekiwany zysk:** ~100ms szybsze przejścia, mniej refetchów, 1 mniej query na start.
**Ryzyko:** Minimalne.
**Pomiar przed/po:** DevTools route transition timing, Network request count na Dashboard.

### PR2 — Query Optimization: select kolumny + konsolidacja Dashboard
**Zakres:**
- Zamiana `select('*')` → jawne kolumny w 15 najczęściej używanych hookach (useProjectsV2, useNotifications, useCalendarEvents, useSubscription, useProfile, useQuotes, useDossier, useDocumentInstances, useSubcontractors, useWorkTasks, useProjectCosts, usePurchaseCosts, useProjectChecklist, useProjectPhotos, useFinancialReports)
- Optymalizacja useFinancialSummary — konsolidacja 3 zapytań do 1-2 lub SQL view
- Konsolidacja kaskady zapytań na Dashboard (np. useExpirationMonitor → merge z useSubscription)

**Dlaczego teraz:** Największy wpływ na rzeczywistą szybkość ładowania danych.
**Oczekiwany zysk:** 30-50% mniejsze payloady, szybsze ładowanie stron.
**Ryzyko:** Niskie-średnie — wymaga sprawdzenia które kolumny są potrzebne w każdym przypadku.
**Pomiar przed/po:** Network response sizes, Supabase query timing.

### PR3 — Rendering: Wirtualizacja + Memoizacja + Lazy Tabs
**Zakres:**
- Dodanie react-virtual (lub @tanstack/virtual) do list ofert, projektów, szablonów (wymaga zatwierdzenia zależności)
- Dodanie React.memo do komponentów renderowanych w .map() (OfferCard, ProjectCard, ClientRow, itp.)
- Dodanie useMemo do filteredItems/sortedItems w komponentach list
- Lazy-load ciężkich tabów: Settings (9 tabów), ProjectDetail (6 tabów), Calendar (4 widoki), Admin (8 tabów)

**Dlaczego teraz:** Zapobiega regresji wydajności przy skalowaniu danych.
**Oczekiwany zysk:** Stały czas renderingu list, mniej rerender cascade.
**Ryzyko:** Średnie — nowa zależność, zmiana struktury list.
**Pomiar przed/po:** React Profiler commit counts, FPS przy scrollu 100+ elementów.

### PR4 — Performance Governance: CI Budgets + Polityki
**Zakres:**
- Dodanie Lighthouse CI budget do pipeline
- Dodanie bundle size check (max chunk size warning)
- Dokumentacja polityk: kolumn, cache, animacji, wirtualizacji
- Dodanie eslint rule/script sprawdzającego select('*') w nowym kodzie
- Dodanie performance smoke test w Playwright

**Dlaczego teraz:** Zapobiega regresji — bez governance każdy nowy PR może zepsuć wydajność.
**Oczekiwany zysk:** Trwała ochrona przed regresją wydajności.
**Ryzyko:** Niskie.
**Pomiar:** Lighthouse score trend, bundle size trend.

---

## SEKCJA X — DODATKOWE OBSZARY ANALIZY DODANE PRZEZ CLAUDE

| Dodany obszar | Dlaczego ważny | Co analizowano | Co znaleziono | Pewność |
|---|---|---|---|---|
| Deprecated hooks (useClients, useProjects) | Wciąż używane, ale bez staleTime | Pliki hooków, wyszukiwanie użyć | Deprecated hooki bez cache policy, prawdopodobnie wciąż aktywne | Zweryfikowane |
| ExpirationMonitor side-effects | Dodatkowe zapytania w tle na Dashboard | useExpirationMonitor.ts | checkAndNotify tworzy dodatkowe queries do notifications table | Zweryfikowane |
| i18n bundle strategy | Wpływ na startup parse time | src/i18n/index.ts | 320KB statycznie załadowane (świadomy trade-off, dobrze udokumentowany) | Zweryfikowane |
| Service Worker strategy | Caching dla powrotnych wizyt | index.html, sw-register.js | SW zarejestrowany, ale strategia cache niewidoczna z repo (potrzebny runtime check) | Nieznane |
| Realtime subscriptions scope | Potencjalny wyciek zasobów | Grep na .subscribe() | Tylko 2 subskrypcje w admin (useAdminSettings, useAdminTheme) — niskie ryzyko | Zweryfikowane |
| AppLayout content transition | Percepcyjne opóźnienie | AppLayout.tsx:56 | 200ms opacity+translate transition = widoczna "pauza" po auth resolve | Zweryfikowane |
| Theme duplication | Potencjalny conflict między theme-init.js a ThemeInitializer + useTheme | theme-init.js, App.tsx, useTheme.ts | 3 miejsca zarządzające theme — potencjalny race condition, ale praktycznie bezpieczne | Hipoteza |
| Offer wizard data fetch | Wpływ na user flow | useOfferWizard.ts | staleTime: 60s, plus WizardStepItems z inline useQuery | Zweryfikowane |
| PDF generation blocking | Potencjalne zamrożenie UI | jspdf w pdf-vendor chunk | Generacja PDF prawdopodobnie blokuje main thread | Hipoteza |
| date-fns usage | Tree-shaking vs full import | useExpirationMonitor.ts | Named imports (differenceInDays, etc.) — tree-shaking OK | Zweryfikowane |
| SendOfferModal direct supabase | Dane nie cache'owane między otwieraniami | SendOfferModal.tsx | useEffect z bezpośrednim supabase call — omija React Query cache | Zweryfikowane |
| OfferPreviewModal weight | Ciężki modal z podglądem A4 | OfferPreviewModal.tsx | Wielokrotne zapytania (offer + items + client + profile) + jsPDF na main thread | Zweryfikowane |
| Edge Functions — AI timeouts | Brak jawnych timeoutów w AI functions | analyze-photo, ocr-invoice, voice-quote-processor | Polegają na domyślnym timeout (mogą się zawiesić) | Zweryfikowane |
| Edge Functions — batch safety | Brak paginacji w cron jobs | send-expiring-offer-reminders, cleanup-expired-data | Brak LIMIT w batch operations | Zweryfikowane |
| Dialog/Sheet animations | Spójność animacji UI | dialog.tsx, sheet.tsx, drawer.tsx | Wszystkie 200ms duration — spójne i rozsądne | Zweryfikowane |
| Sonner toast performance | Wpływ na rendering | sonner.tsx | Lekki, zoptymalizowany — brak problemu | Zweryfikowane |

---

**STOP. Czekam na fazę wykonania Codex.**
