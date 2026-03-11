# RAPORT WERYFIKACYJNY MAJSTER.AI — AUDYT POST-IMPLEMENTACYJNY

**Data:** 2026-03-11
**Audytor:** Claude Opus 4.6 (Principal Verification Auditor)
**Repozytorium:** majster-ai-oferty, branch `master`
**Tryb:** READ-ONLY — żadne pliki nie zostały zmienione

---

## Werdykt Wykonawczy

### **CLOSED BETA READY WITH FINAL PATCHES**

Produkt jest bliski gotowości do zamkniętej bety, ale wymaga jednej krótkiej iteracji naprawczej (3-5 dni roboczych) aby zamknąć krytyczne niespójności danych i relikty legacy.

**Uzasadnienie:** Core flows (auth, oferty, projekty v2, dashboard, klienci) działają poprawnie. Bezpieczeństwo (RLS 55 tabel, sanitization, rate limiting) jest solidne. Branding jest czysty. Ale istnieją 2 złamane flow (approve-offer + PdfGenerator odpytują starą tabelę) i 4 moduły z niespójnymi danymi (finance, analytics, stary QuickEstimate, webhook Stripe).

---

## Podsumowanie Weryfikacji

| Status | Liczba |
|--------|--------|
| ZWERYFIKOWANE KOMPLETNE | 21 |
| ZWERYFIKOWANE CZĘŚCIOWE | 9 |
| ZWERYFIKOWANE BRAKUJĄCE | 2 |
| ZWERYFIKOWANE ZŁAMANE | 2 |
| ZWERYFIKOWANE LEGACY | 5 |
| ZWERYFIKOWANE UKRYTE/ODROCZONE | 3 |

---

## Odpowiedzi na Obowiązkowe Pytania

### Które dokładne problemy z wcześniejszych audytów są teraz w pełni zamknięte?

1. ✅ Shell split mobile vs desktop — `NewShellLayout` z FF_NEW_SHELL
2. ✅ Kanoniczny home — `/app/dashboard` jako CANONICAL_HOME
3. ✅ Dashboard CTA offer-first — główny przycisk "Utwórz ofertę"
4. ✅ Email verification flow — Register → verify → auto-redirect
5. ✅ Quick Estimate persistence (nowy workspace) — drafty w Supabase
6. ✅ Email delivery hardening — walidacja domen, SENDER_EMAIL z env
7. ✅ Stripe guard rails — `isRealStripePriceId()` blokuje placeholdery
8. ✅ Lovable artifact removal — zero wyników w codebase
9. ✅ Settings separation — 9 zakładek, billing osobno
10. ✅ Legacy route redirects — pełne pokrycie /projects→/app/projects, /jobs→/app/projects
11. ✅ RLS na nowych tabelach — v2_projects, offers, offer_items z user isolation
12. ✅ Loading/empty/error states — EmptyState, ErrorState, SkeletonList na głównych stronach
13. ✅ SEO/robots/sitemap — robots blokuje /app/ i /admin/, structured data
14. ✅ Notification system — center, push, categories, realtime

### Które dokładne problemy z wcześniejszych audytów są nadal otwarte?

1. ❌ `approve-offer` edge function odpytuje starą tabelę `projects` — KRYTYCZNE
2. ❌ `PdfGenerator` odpytuje starą tabelę — KRYTYCZNE
3. ❌ Finance/Analytics hooki odpytują starą tabelę — WYSOKIE
4. ❌ Stary QuickEstimate `/app/quick-est` nadal routowany — ŚREDNIE
5. ❌ Stripe webhook PRICE_TO_PLAN_MAP z placeholderami — WYSOKIE
6. ❌ Profil firmy niedostępny z desktop sidebar — ŚREDNIE
7. ❌ HomeLobby sekcje bez danych — NISKIE
8. ❌ manifest.json start_url `/dashboard` zamiast `/app/dashboard` — NISKIE

### Które elementy były zgłoszone jako naprawione, ale są tylko częściowe?

1. **Offer → Project flow:** Frontend tworzy w v2_projects ✅, ale edge function `approve-offer` (publiczne akceptowanie) tworzy w starej tabeli ❌
2. **Quick Estimate:** Nowy workspace z draftem działa ✅, ale stary QuickEstimate nadal routowany pod `/app/quick-est` ❌
3. **v2_projects migration:** Dashboard/ProjectsList/ProjectHub na v2 ✅, ale PdfGenerator/Finance/Analytics nadal na starej tabeli ❌

### Które moduły nie są jeszcze bezpieczne dla bety?

- **Finance** — dane ze starej tabeli, niespójne z dashboardem
- **Analytics** — j.w.
- **PdfGenerator** — nie znajdzie projektów z v2_projects

### Czy billing jest nadal niefunkcjonalny, czy czeka na konfigurację właściciela?

**Billing jest bezpieczny i czeka na konfigurację właściciela.** Guard rails działają: checkout zablokowany bez real price IDs, UI planów wyświetla się poprawnie, request-plan jako fallback gdy Stripe wyłączony. Jedyny problem: webhook `PRICE_TO_PLAN_MAP` ma hardcoded placeholdery — powinien czytać z env variables.

### Czy Quick Estimate jest teraz kanoniczny, czy nadal skażony legacy?

**Częściowo skażony.** `QuickEstimateWorkspace` (`/app/szybka-wycena`) jest kanonicznym nowym flow z draft persistence w Supabase. Ale stary `QuickEstimate` (`/app/quick-est`) nadal jest routowany i odpytuje starą tabelę `projects`.

### Czy Offer → Project jest naprawdę spójny w UI i danych?

**NIE.** Frontend path (Offers.tsx → tworzenie v2_project po akceptacji) działa. Ale publiczne akceptowanie (edge function `approve-offer` → tworzy w starej tabeli `projects`). ProjectHub odpytuje `v2_projects` → projekt znika.

### Czy są nadal fałszywe lub mylące powierzchnie produktu widoczne dla użytkowników?

1. `/app/quick-est` — stary flow, może zdezorientować
2. Finance page — dane ze starej tabeli, mogą być puste/niespójne
3. Analytics page — j.w.
4. HomeLobby — sekcje "Kontynuuj" i "Dzisiaj" z zerami
5. Landing testimoniale — prawdopodobnie fikcyjne/reprezentatywne

### Czy produkt jest naprawdę gotowy do zamkniętej bety teraz?

**Prawie.** 4 krytyczne poprawki potrzebne: (1) approve-offer → v2_projects, (2) PdfGenerator → v2_projects, (3) usunięcie /app/quick-est, (4) Finance/Analytics → v2_projects. Po tych poprawkach — TAK.

### Co dokładnie blokuje?

1. approve-offer → v2_projects (złamany flow publicznego akceptowania)
2. PdfGenerator → v2_projects (złamany PDF dla nowych projektów)
3. Finance/Analytics na starej tabeli (mylące dane)
4. Stary QuickEstimate nadal routowany (duplikacja flow)

---

## Co Zostało Zweryfikowane jako KOMPLETNE

1. **Shell split mobilny vs desktop** — `NewShellLayout.tsx`: bottom nav + FAB na mobile, sidebar + topbar na desktop. FF_NEW_SHELL=true domyślnie. — ZWERYFIKOWANE KOMPLETNE

2. **Kanoniczny ekran domowy** — `/app/dashboard` jest CANONICAL_HOME. Route `/app` → redirect do `/app/dashboard`. — ZWERYFIKOWANE KOMPLETNE

3. **Dashboard CTA offer-first** — Główny przycisk „Utwórz ofertę" prowadzi do `/app/offers/new`, umieszczony powyżej foldu. — ZWERYFIKOWANE KOMPLETNE

4. **Dashboard na v2_projects** — `useDashboardStats` odpytuje wyłącznie `v2_projects`. — ZWERYFIKOWANE KOMPLETNE

5. **ProjectsList na v2_projects** — `useProjectsV2List()` odpytuje `v2_projects`. — ZWERYFIKOWANE KOMPLETNE

6. **ProjectHub z bannerem źródłowej oferty** — `SourceOfferBanner` wyświetlany gdy `project.source_offer_id` istnieje, linkuje do `/app/offers/{id}`. — ZWERYFIKOWANE KOMPLETNE

7. **Email verification flow** — Register → `/verify-email?email=X` → auto-redirect gdy `email_confirmed_at` istnieje. Resend z 60s cooldown. — ZWERYFIKOWANE KOMPLETNE

8. **Quick Estimate draft persistence** — `useQuickEstimateDraft` zapisuje do Supabase (`offers` + `offer_items` z `status=DRAFT`, `source=quick_estimate`), 2s debounce, restore on mount. — ZWERYFIKOWANE KOMPLETNE

9. **Email delivery hardening** — `SENDER_EMAIL` z env, walidacja odrzuca resend.dev sandbox, domeny konsumenckie (gmail, wp.pl, onet, itp.). — ZWERYFIKOWANE KOMPLETNE

10. **Stripe billing guard rails** — `isRealStripePriceId()` waliduje format, blokuje placeholdery. Checkout zablokowany gdy price ID nieprawidłowy. — ZWERYFIKOWANE KOMPLETNE

11. **Lovable artifact removal** — Zero wyników grep dla "lovable" w całym codebase. Branding 100% Majster.AI. — ZWERYFIKOWANE KOMPLETNE

12. **Settings separation** — Billing w osobnej zakładce "Subskrypcja" w Settings. 9 zakładek: firma, ogólne, dokumenty, kalendarz, powiadomienia, email, subskrypcja, prywatność, konto. — ZWERYFIKOWANE KOMPLETNE

13. **Legacy route redirects** — `/projects/*` → `/app/projects/*`, `/app/jobs/*` → `/app/projects/*`, `/billing` → `/app/settings`. Pełne pokrycie redirectów. — ZWERYFIKOWANE KOMPLETNE

14. **RLS na wszystkich tabelach** — 55 tabel z RLS. `v2_projects`, `offers`, `offer_items` — wszystkie z user isolation. — ZWERYFIKOWANE KOMPLETNE

15. **SEO/meta/robots/sitemap** — `robots.txt` blokuje `/app/` i `/admin/`, `sitemap.xml` z 13 URL i hreflang PL/EN/UK, structured data (Organization, SoftwareApplication, FAQ). 404 z noindex. — ZWERYFIKOWANE KOMPLETNE

16. **PWA manifest** — Branding Majster.AI, amber theme, ikony 192+512. — ZWERYFIKOWANE KOMPLETNE

17. **Offer system (lista + tworzenie + edycja)** — `useOffers()` odpytuje tabelę `offers`. CRUD działa. AcceptanceLinkPanel dla publicznego akceptowania. — ZWERYFIKOWANE KOMPLETNE

18. **Notification system** — NotificationCenter + PushNotificationSettings + PermissionPrompt. Supabase realtime. Kategorie powiadomień. — ZWERYFIKOWANE KOMPLETNE

19. **Loading/Empty/Error states na głównych stronach** — EmptyState (`ui/empty-state.tsx` z `role="status"`), ErrorState (`ui/error-state.tsx` z `role="alert"`), SkeletonList/DashboardSkeleton/ClientsGridSkeleton. Offers, ProjectsList, Clients, Dashboard — pełne trzy-stanowe renderowanie (loading→error→empty→content). — ZWERYFIKOWANE KOMPLETNE

20. **Shared Edge Function utilities** — 9 modułów: ai-provider (3 providery), moderation, rate-limiter (10 endpointów), sanitization (XSS prevention), validation (RFC 5322 email), sentry. — ZWERYFIKOWANE KOMPLETNE

21. **Client module** — CRUD, wyszukiwanie, formularz, ClientsGridSkeleton, empty state. — ZWERYFIKOWANE KOMPLETNE

---

## Co Zostało Zweryfikowane jako CZĘŚCIOWE

1. **Offer → accepted → project flow** — ZWERYFIKOWANE CZĘŚCIOWE
   - Frontend: Offers.tsx tworzy `v2_projects` z `source_offer_id` po akceptacji — OK
   - **PROBLEM**: Edge function `approve-offer` nadal operuje na starej tabeli `projects` (linie 148, 321), NIE na `v2_projects`. Publiczne akceptowanie tworzy projekt niewidoczny w ProjectHub.

2. **QuickEstimate stary vs nowy** — ZWERYFIKOWANE CZĘŚCIOWE
   - `QuickEstimateWorkspace.tsx` (nowy, z persistencją draftu) — działa poprawnie pod `/app/szybka-wycena`
   - `QuickEstimate.tsx` (stary) — nadal routowany pod `/app/quick-est`, odpytuje starą tabelę

3. **Finance module** — ZWERYFIKOWANE CZĘŚCIOWE
   - Strona z FinanceDashboard, KPI cards, wykresy
   - `useFinancialReports.ts` odpytuje starą tabelę `projects` (linie 61, 117)
   - Eksport PDF/Excel — przyciski istnieją ale bez pełnych handlerów

4. **Analytics module** — ZWERYFIKOWANE CZĘŚCIOWE
   - Strona funkcjonalna z wykresami i KPI
   - `useAnalyticsStats.ts` odpytuje starą tabelę `projects` (linia 63)
   - Dane niespójne z dashboardem (v2_projects)

5. **Onboarding flow** — ZWERYFIKOWANE CZĘŚCIOWE
   - `NewShellOnboarding` + `OnboardingWizard` istnieją
   - Team link w OnboardingWizard prowadzi do redirectu (dashboard) — martwy krok

6. **HomeLobby** — ZWERYFIKOWANE CZĘŚCIOWE
   - Istnieje pod `/app/home`, quick start buttons
   - Sekcje „Kontynuuj" i „Dzisiaj" z zerami/placeholder — brak podłączonych danych

7. **Mobile vs Desktop spójność** — ZWERYFIKOWANE CZĘŚCIOWE
   - Feature parity istnieje (wszystkie moduły dostępne z obu platform)
   - **PROBLEM**: Company Profile niedostępny z desktop sidebar (tylko przez "More" na mobile lub bezpośredni URL)
   - **PROBLEM**: Etykiety niespójne: "Documents" (desktop) vs "Document Templates" (mobile)
   - **PROBLEM**: FAB quick actions (4 skróty) tylko na mobile — desktop nie ma ekwiwalentu

8. **Billing / Stripe system** — ZWERYFIKOWANE CZĘŚCIOWE
   - UI planów działa, guard rails skuteczne, request-plan jako fallback
   - Checkout zablokowany bez real price IDs (zamierzone, bezpieczne)
   - **PROBLEM**: Webhook `PRICE_TO_PLAN_MAP` z hardcoded placeholderami — powinien czytać z env

9. **Calendar** — ZWERYFIKOWANE CZĘŚCIOWE
   - Funkcjonalny moduł z CRUD i wieloma widokami (tydzień/miesiąc/lista)
   - Dedykowany `useCalendarEvents()` — OK
   - Import `useProjects` widoczny w pliku ale bez bezpośredniego `.from('projects')` call

---

## Co Zostało Zweryfikowane jako BRAKUJĄCE lub ZŁAMANE

### ZŁAMANE:

1. **approve-offer edge function → stara tabela `projects`** — ZWERYFIKOWANE ZŁAMANE
   - **Lokalizacja:** `supabase/functions/approve-offer/index.ts` linie 148, 321
   - Publiczne akceptowanie ofert tworzy projekty w starej tabeli
   - Frontend ProjectHub odpytuje `v2_projects` — projekt NIEWIDOCZNY
   - Flow: `/a/:token` → OfferPublicAccept → approve-offer → `projects` (STARA)

2. **Stripe webhook PRICE_TO_PLAN_MAP** — ZWERYFIKOWANE ZŁAMANE
   - **Lokalizacja:** `supabase/functions/stripe-webhook/index.ts` linie 25-35
   - Mapa zawiera placeholdery: `price_pro_monthly`, `price_starter_monthly`, itp.
   - Frontend `isRealStripePriceId` blokuje te formaty — checkout nigdy nie dojdzie
   - Ale gdyby właściciel skonfigurował real Stripe IDs na frontend → webhook ich NIE ROZPOZNA
   - **Naprawka:** Mapa powinna czytać z env variables, nie hardcoded

### BRAKUJĄCE:

1. **approve-offer → v2_projects migration** — nigdy nie wykonana
2. **PdfGenerator → v2_projects** — PdfGenerator pod `/app/projects/:id/pdf` używa `useProject()` ze starego hooka (`useProjects.ts`) → odpytuje starą tabelę → nie znajdzie projektów z v2_projects

---

## Co Jest Nadal LEGACY / Zduplikowane

1. **`useProjects.ts` hook** — ZWERYFIKOWANE LEGACY
   - Odpytuje starą tabelę `projects`, oznaczony `@deprecated`
   - Nadal importowany przez: QuickEstimate (stary), PdfGenerator, ProjectDetail, Projects, QuoteEditor
   - PdfGenerator jest routowany pod `/app/projects/:id/pdf` — jedyny z tych plików dostępny w głównym flow

2. **`NewProject.tsx`** — ZWERYFIKOWANE LEGACY
   - 22KB, używa `useAddProject()` (stara tabela)
   - NIE routowany (zastąpiony przez NewProjectV2.tsx)
   - Martwy kod powiększający bundle

3. **`Projects.tsx` + `ProjectDetail.tsx`** — ZWERYFIKOWANE LEGACY
   - Stare strony projektów, nie routowane
   - Zastąpione przez ProjectsList.tsx + ProjectHub.tsx

4. **`useFinancialReports.ts` + `useAnalyticsStats.ts`** — ZWERYFIKOWANE LEGACY
   - Odpytują starą tabelę `projects`
   - Dane niespójne z resztą aplikacji

5. **`approve-offer` edge function** — ZWERYFIKOWANE LEGACY
   - Operuje na starej tabeli `projects` (linie 148, 321)
   - Nie zmigrowana do v2_projects mimo migracji frontendu

---

## Weryfikacja Moduł-po-Module

| Moduł | Status | Co działa | Co nie działa | Beta-safe? |
|-------|--------|-----------|---------------|------------|
| **Auth / verification** | KOMPLETNE | Register → verify → login → dashboard | — | ✅ TAK |
| **Onboarding** | CZĘŚCIOWE | Wizard + NewShell onboarding | Team link → redirect do dashboard | ✅ TAK (kosmetyczne) |
| **Clients** | KOMPLETNE | CRUD, wyszukiwanie, formularz, empty/loading state | — | ✅ TAK |
| **Offers** | KOMPLETNE | Lista, tworzenie, edycja, wysyłka, PDF, empty state | — | ✅ TAK |
| **Projects / ProjectHub** | CZĘŚCIOWE | Lista v2, hub, source banner, loading/empty/error | approve-offer tworzy w starej tabeli | ⚠️ TAK z zastrzeżeniem |
| **Quick Estimate** | CZĘŚCIOWE | Workspace z draftem | Stary QE nadal pod /app/quick-est | ⚠️ Zdezorientuje |
| **Documents / PDF** | CZĘŚCIOWE | DocumentTemplates OK | PdfGenerator odpytuje starą tabelę | ❌ RYZYKO |
| **Calendar** | KOMPLETNE | Multi-view, CRUD events | — | ✅ TAK |
| **Finance / analytics** | CZĘŚCIOWE | UI z wykresami i KPI | Dane ze starej tabeli, eksport bez handlerów | ❌ Mylące dane |
| **Billing / plans** | CZĘŚCIOWE | UI planów, guard rails, request-plan | Webhook placeholdery, checkout zablokowany | ✅ TAK (bezpieczny, nieaktywny) |
| **Profile / settings** | KOMPLETNE | Pełny profil, logo, 9 zakładek | Profile niedostępny z desktop sidebar | ✅ TAK |
| **AI / voice / OCR** | KOMPLETNE | AiChatAgent, VoiceQuoteCreator, plan-gated | — | ✅ TAK |
| **Marketplace** | UKRYTE | Pełny komponent istnieje | Nie routowany | ✅ TAK (niewidoczny) |
| **Team** | UKRYTE | Pełny komponent istnieje | Redirect do dashboard | ✅ TAK (niewidoczny) |
| **Notifications** | KOMPLETNE | Center, push, categories, realtime | — | ✅ TAK |
| **SEO / meta** | KOMPLETNE | robots, sitemap, structured data | manifest start_url stary | ✅ TAK |
| **Security** | KOMPLETNE | RLS 55 tabel, sanitization, rate limiting, moderation | — | ✅ TAK |
| **Loading/Empty/Error** | KOMPLETNE | EmptyState, ErrorState, SkeletonList, a11y roles | Modals nie mają error states | ✅ TAK |

---

## Weryfikacja Flow End-to-End

| Flow | Status | Szczegóły |
|------|--------|-----------|
| Register → verify → login → onboarding | **DZIAŁA** | Pełny flow z email_confirmed_at check, auto-redirect |
| Client → offer → PDF → send → accept → project (frontend) | **DZIAŁA** | Offers.tsx tworzy v2_project z source_offer_id |
| Client → offer → send → **publiczne** akceptowanie → project | **ZŁAMANY** | approve-offer edge function → stara tabela `projects` → niewidoczny w ProjectHub |
| Quick estimate → save → resume → continue | **DZIAŁA** | Workspace z draftem w Supabase, auto-save z 2s debounce, restore on mount |
| Dashboard → correct CTA flow | **DZIAŁA** | Offer-first CTA → /app/offers/new |
| Billing → plan → checkout → webhook → subscription | **CZĘŚCIOWY** | UI gotowe, checkout zablokowany bez real IDs, webhook z placeholderami |
| Notifications / reminders | **DZIAŁA** | NotificationCenter + push + email reminders |
| Gated premium feature | **DZIAŁA** | usePlanGate() blokuje AI/voice dla free, UpgradeModal → /app/plan |
| PDF generation for v2 project | **ZŁAMANY** | PdfGenerator odpytuje starą tabelę → nie znajdzie projektu |
| v2 project → public status page | **DZIAŁA** | `/p/:token` z resolve_project_public_token() |

---

## Weryfikacja Powierzchni Beta

| Kryterium | Status | Szczegóły |
|-----------|--------|-----------|
| Brak oczywistych fake features | ⚠️ CZĘŚCIOWE | HomeLobby sekcje z zerami, Finance ze starymi danymi |
| Brak dead-end actions | ⚠️ CZĘŚCIOWE | PdfGenerator pod /projects/:id/pdf nie znajdzie v2 projektu |
| Brak mylących placeholderów w krytycznych miejscach | ✅ OK | Główne flow czyste |
| Brak niedokończonych modułów overexposed | ⚠️ CZĘŚCIOWE | Finance/Analytics ze starymi danymi, stary QuickEstimate |
| Brak sprzeczności web vs mobile | ⚠️ CZĘŚCIOWE | Profile tylko mobile, etykiety niespójne |
| Brak sprzecznych ścieżek CTA | ✅ OK | Dashboard → Offers → Projects flow jest spójny |

---

## Co Jest Nadal Mylące lub Overexposed

1. **`/app/quick-est`** — stary QuickEstimate (bez draftu, stara tabela) nadal routowany obok nowego `/app/szybka-wycena`
2. **Finance page** — pokazuje dane ze starej tabeli `projects`, potencjalnie puste lub niespójne z dashboardem
3. **Analytics page** — j.w., dane ze starej tabeli
4. **PdfGenerator** — routowany pod `/app/projects/:id/pdf`, ale odpytuje starą tabelę
5. **HomeLobby** — sekcje „Kontynuuj" i „Dzisiaj" z zerami — wygląda na pustą/niedziałającą stronę
6. **manifest.json `start_url`** — `/dashboard` zamiast `/app/dashboard` (minor, redirect zadziała)

---

## Regresje / Nowe Problemy Wprowadzone

1. **KRYTYCZNE: approve-offer ↔ v2_projects disconnect** — Publiczne akceptowanie ofert tworzy projekt w starej tabeli `projects`. Frontend (ProjectHub, ProjectsList, Dashboard) odpytuje `v2_projects`. Projekt „znika" po akceptacji przez klienta. To jest regresja logiczna — migracja frontendu do v2 bez migracji backendu.

2. **PdfGenerator disconnect** — Routowany i dostępny pod `/app/projects/:id/pdf`, ale odpytuje starą tabelę. Projekty z v2 nie mają działającego PDF generation path.

3. **Finance/Analytics data mismatch** — Dashboard pokazuje dane z v2_projects, finance i analytics ze starej tabeli. Użytkownik widzi różne liczby w różnych miejscach.

4. **Desktop sidebar bez Profile** — Company Profile dostępny na mobile przez MoreScreen, ale nie z desktop sidebar. Użytkownik na desktopie może nie znaleźć swojego profilu firmy.

---

## Finalne Blokery Przed Czystą Closed Beta

### KRYTYCZNE (muszą być naprawione przed betą):

| # | Bloker | Lokalizacja | Opis |
|---|--------|-------------|------|
| 1 | approve-offer → v2_projects | `supabase/functions/approve-offer/index.ts:148,321` | Publiczne akceptowanie ofert tworzy w starej tabeli |
| 2 | PdfGenerator → v2_projects | `src/pages/PdfGenerator.tsx` + `src/hooks/useProjects.ts` | Generator PDF odpytuje starą tabelę |

### WYSOKIE (powinny być naprawione):

| # | Bloker | Lokalizacja | Opis |
|---|--------|-------------|------|
| 3 | Usunąć route /app/quick-est | `src/App.tsx` | Stary QuickEstimate zdezorientuje użytkowników |
| 4 | Finance hook → v2_projects | `src/hooks/useFinancialReports.ts:61,117` | Dane ze starej tabeli |
| 5 | Analytics hook → v2_projects | `src/hooks/useAnalyticsStats.ts:63` | Dane ze starej tabeli |
| 6 | Webhook PRICE_TO_PLAN_MAP → env | `supabase/functions/stripe-webhook/index.ts:25-35` | Hardcoded placeholdery |

### ŚREDNIE (mogą poczekać na pierwszą iterację po becie):

| # | Item | Opis |
|---|------|------|
| 7 | Dodać Profile do desktop sidebar | Niedostępny z desktop sidebar |
| 8 | Usunąć martwy kod | NewProject.tsx, Projects.tsx, ProjectDetail.tsx |
| 9 | HomeLobby dane lub ukrycie | Sekcje z zerami |
| 10 | manifest.json start_url | `/dashboard` → `/app/dashboard` |
| 11 | Ujednolicić etykiety mobile vs desktop | "Documents" vs "Document Templates" |
| 12 | Testimoniale na landingu | Oznaczyć jako przykładowe lub zweryfikować |

---

## Finalna Rekomendacja

### Czy startujemy z closed beta teraz?

**NIE JESZCZE — potrzebna jest jedna krótka iteracja naprawcza (3-5 dni).**

### Co dokładnie trzeba zrobić przed betą (MUST):

1. **Zmigrować `approve-offer` edge function** z `.from('projects')` na `.from('v2_projects')` — aby publiczne akceptowanie ofert tworzyło projekty widoczne w aplikacji
2. **Zmigrować `PdfGenerator`** z `useProject` na `useProjectV2` — aby PDF generation działał dla nowych projektów
3. **Usunąć route `/app/quick-est`** — zostawić tylko `/app/szybka-wycena` (workspace z draftem)
4. **Zmigrować `useFinancialReports` i `useAnalyticsStats`** z `.from('projects')` na `.from('v2_projects')` — aby dane były spójne z dashboardem

### Po tych 4 poprawkach → **CLOSED BETA READY**.

### Czy UI/UX powinien być zamrożony?

**TAK** — obecny UI jest spójny i profesjonalny. Nie należy dodawać nowych features ani zmieniać layoutu. Jedynie naprawki danych i usunięcie legacy routes.

### Następna akcja:

Utworzyć jeden PR z 4 krytycznymi/wysokimi poprawkami, przetestować flow end-to-end:
1. Akceptacja oferty (publiczna) → projekt widoczny w ProjectHub ✓
2. v2 projekt → PDF generation ✓
3. Dashboard vs Finance — te same liczby ✓
4. Tylko jeden QuickEstimate flow dostępny ✓

Po wdrożeniu — produkt jest gotowy do zamkniętej bety.

---

*Raport kończy się tutaj. Wszystkie ustalenia oparte na bezpośredniej inspekcji kodu źródłowego, migracji, edge functions, hooków, routingu i komponentów. Żadne pliki nie zostały zmodyfikowane.*
