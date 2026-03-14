# PREMIUM UPLIFT — BASELINE WYKONAWCZY

**Data:** 2026-03-14
**Audytor:** Claude Opus 4.6 (Principal Product Architect + UX Auditor + Frontend Strategist)
**Repozytorium:** majster-ai-oferty, branch `claude/premium-uplift-baseline-BbbxP`, HEAD `e77da92`
**Tryb:** READ-ONLY — audit strategiczno-wykonawczy
**Cel:** Baseline dla Promptów 2–5 (premium uplift na obecnym stacku)

---

## 1. Podsumowanie

Majster.AI to dojrzałe MVP na solidnym stacku (Vite 7 + React 18 + Tailwind 3.4 + shadcn/ui + Supabase + Framer Motion). Architektura jest czysta, bezpieczeństwo na wysokim poziomie, core flow działa end-to-end. **Wąskim gardłem nie jest technologia — jest percepcja jakości wizualnej i brak warstwy sprzedażowej.**

Niniejszy dokument stanowi obowiązujący baseline wykonawczy. Każdy z Promptów 2–5 MUSI działać w ramach ustaleń tego dokumentu.

---

## 2. Zweryfikowane fakty (potwierdzone w kodzie na HEAD `e77da92`)

### 2.1 Weryfikacja runtime

| Metryka | Wynik | Status |
|---------|-------|--------|
| TypeScript strict | 0 błędów | ZWERYFIKOWANY FAKT |
| Build produkcyjny | 16.42s, sukces | ZWERYFIKOWANY FAKT |
| Testy | 85 plików, 1200 passed, 5 skipped, 0 failures | ZWERYFIKOWANY FAKT |
| ESLint | 0 errors, ~660 warnings (głównie i18next/no-literal-string) | ZWERYFIKOWANY FAKT |
| Main bundle (gzip) | 274.75 KB | ZWERYFIKOWANY FAKT |
| Total gzip | ~769 KB | ZWERYFIKOWANY FAKT |
| Chunk splitting | Poprawny — ciężkie libs izolowane i lazy-loaded | ZWERYFIKOWANY FAKT |

### 2.2 Architektura i bezpieczeństwo

| Fakt | Weryfikacja | Kategoria |
|------|-------------|-----------|
| RLS na 57 tabelach (nie 55 jak w raporcie strategicznym) | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — 57 instancji w migracjach | ZWERYFIKOWANY FAKT |
| i18n parytet PL/EN/UK — 4513 kluczy (nie 3330 jak w raporcie strategicznym) | Zliczenie kluczy w plikach JSON | ZWERYFIKOWANY FAKT |
| Core flow Oferta → PDF → Email → Akceptacja → Projekt V2 | Przegląd kodu approve-offer, PdfGenerator, send-offer-email | ZWERYFIKOWANY FAKT |
| v2_projects jako jedno źródło prawdy | PdfGenerator v2-first, Calendar useProjectsV2List, QuickEstimate tworzy v2_project | ZWERYFIKOWANY FAKT |
| 50 migracji SQL | Zliczenie plików w supabase/migrations/ | ZWERYFIKOWANY FAKT |
| 20 Edge Functions | Zliczenie folderów w supabase/functions/ | ZWERYFIKOWANY FAKT |
| Stripe Price IDs = null we wszystkich 4 planach | src/config/plans.ts — linie 76, 117, 163, 208 | ZWERYFIKOWANY FAKT |

### 2.3 Korekty raportu strategicznego

Raport strategiczny (STRATEGIC_ARCHITECTURE_REVIEW_2026-03-14.md) zawiera **5 nieścisłości**, które korygujemy:

| # | Twierdzenie raportu | Prawda w kodzie | Korekta |
|---|---------------------|-----------------|---------|
| 1 | "RLS na 55+ tabelach" | 57 tabel | Niedoszacowanie — różnica kosmetyczna |
| 2 | "i18n parytet 3330 kluczy" | 4513 kluczy per język | Znaczne niedoszacowanie — i18n jest bardziej kompletne |
| 3 | "hasVariants = BUG KRYTYCZNY" | Wizard: `>0`, Public: `>1` — kontekstowo poprawne | PRZECENIONE — wizard `addVariant()` zawsze tworzy min. 2 warianty; `>1` na public jest logicznie uzasadnione (1 wariant = brak wyboru = nie pokazuj selektora). Ryzyko: NISKIE (nie krytyczne) |
| 4 | "NotificationCenter = dead code" | Aktywnie używane w TopBar.tsx (lazy-loaded) | FAŁSZ — komponent jest w użyciu |
| 5 | "Dashboard informacyjny, nie motywujący" | Dashboard ma: animowane liczniki, staggered animacje, kolorowe quick actions, activity feed z pulse | CZĘŚCIOWO FAŁSZ — dashboard jest lepszy wizualnie niż sugeruje raport |

### 2.4 Faktyczne blokery monetyzacji (OWNER ACTION)

| # | Bloker | Kto | Kategoria |
|---|--------|-----|-----------|
| 1 | Stripe Price IDs = null → checkout niemożliwy | Właściciel (Stripe Dashboard) | OWNER ACTION |
| 2 | Migracje DB na produkcji — niezweryfikowane | Właściciel (`supabase db push`) | OWNER ACTION / RUNTIME UNKNOWN |
| 3 | RESEND_API_KEY + SENDER_EMAIL niekonfigurowane | Właściciel (Supabase Secrets) | OWNER ACTION / RUNTIME UNKNOWN |
| 4 | FRONTEND_URL niekonfigurowane | Właściciel (Supabase Secrets) | OWNER ACTION / RUNTIME UNKNOWN |
| 5 | Google OAuth callback | Właściciel (Supabase Auth config) | OWNER ACTION / RUNTIME UNKNOWN |

---

## 3. Słabości, które nadal mają znaczenie

Poniższe słabości zweryfikowano w kodzie i sklasyfikowano wg wpływu na premium perception.

### 3.1 Jakość wizualna (WYSOKI priorytet)

| # | Słabość | Dowód w kodzie | Wpływ |
|---|---------|----------------|-------|
| 1 | **Paleta "industrial/cool"** — poprawna, ale zimna | index.css: `hsl(220 13% 11%)` shadows, `96% lightness` backgrounds | Produkt wygląda jak narzędzie, nie jak premium SaaS |
| 2 | **Cienie minimalne** — `shadow-card: 0.08 opacity` | index.css linie 59-67 | Brak głębi, karty "pływają" bez zakotwiczenia |
| 3 | **Brak gradientów na kluczowych powierzchniach** | Przegląd komponentów dashboard, sidebar | Monohromatyczny wygląd |
| 4 | **Generyczne ikony Lucide bez customizacji** | Wszędzie — brak custom icon set | Brak tożsamości wizualnej |
| 5 | **Brak micro-interactions nagradzających** | Zapis oferty, akceptacja — brak confetti/celebration | Brak "wow" momentu |

### 3.2 Psychologia produktu (ŚREDNI-WYSOKI priorytet)

| # | Słabość | Dowód | Wpływ |
|---|---------|-------|-------|
| 1 | **Onboarding prosty modalowy** — 5 kroków, ale brak guided tour | OnboardingWizard.tsx — Dialog + progress bar, brak spotlight/highlight overlay | Użytkownik nie jest prowadzony za rękę |
| 2 | **Brak "moment aha"** w onboardingu | Brak automatycznego tworzenia demo oferty | Użytkownik nie widzi wartości natychmiast |
| 3 | **Empty states generyczne** na ekranach poza dashboardem | ui/empty-state.tsx — ikona + tekst + przycisk | Brak emocji, brak kontekstowych podpowiedzi |
| 4 | **Brak trust signals w produkcie** | Brak badge'ów "encrypted", "autosave", "RODO" | Użytkownik nie czuje bezpieczeństwa |

### 3.3 Landing/warstwa sprzedażowa (WYSOKI priorytet)

| # | Słabość | Dowód | Wpływ |
|---|---------|-------|-------|
| 1 | **Brak video/demo/screenshotów** | HeroSection.tsx — animowany mock UI, ale brak prawdziwych screenshotów ani video | Odwiedzający nie widzi prawdziwego produktu |
| 2 | **Testimoniale nieprawdziwe** | TestimonialsSection.tsx — "Marek K.", "Tomasz W." — brak weryfikowalnych danych | Niski social proof |
| 3 | **OG image = icon-512.png (JPEG w rozszerzeniu .png, kwadrat)** | index.html:20 + `file` command potwierdza JPEG | Słaby social sharing, zły MIME type |
| 4 | **Brak porównania "przed/po"** | Landing nie zawiera sekcji Excel vs Majster.AI | Brak kontrastu wartości |

### 3.4 PDF i publiczne oferty (ŚREDNI priorytet)

| # | Słabość | Dowód | Wpływ |
|---|---------|-------|-------|
| 1 | **PDF poprawny, ale standardowy** | offerPdfGenerator.ts — 3 szablony (classic/modern/minimal), jsPDF + autotable | Nie buduje wrażenia "premium narzędzia" |
| 2 | **Brak QR code na PDF** | Przegląd offerPdfGenerator.ts — brak generacji QR | Brak linku do cyfrowej wersji |
| 3 | **Publiczna strona oferty — czysta ale surowa** | OfferPublicAccept.tsx — brak animacji, brak countdown, brak celebration na akceptacji | Klient widzi "formularz", nie "profesjonalny system" |
| 4 | **Zdjęcia z show_in_public=true nie wyświetlane na public page** | OfferPublicAccept.tsx — brak komponentu OfferPhotoAttach | REPO INFERENCE — zdjęcia mogą nie być widoczne |

### 3.5 Mobile polish (NISKI priorytet — działa dobrze)

| # | Słabość | Dowód | Wpływ |
|---|---------|-------|-------|
| 1 | **Brak page transitions direction-aware** | Przejścia między stronami bez animacji kierunkowej | Mniej "native" feel |
| 2 | **Brak pull-to-refresh** | Listy ofert/projektów bez gestu odświeżania | Standard mobile oczekiwany |
| 3 | **Brak swipe gestures** | Listy bez swipe-to-action | Brak szybkich akcji mobilnych |

---

## 4. Obszary do zamrożenia (NIE RUSZAĆ w Promptach 2–5)

### 4.1 Absolutny zakaz zmian

| # | Obszar | Powód |
|---|--------|-------|
| 1 | **Migracje DB** (`supabase/migrations/`) | Immutowalne; nowe migracje poza scope premium uplift |
| 2 | **Edge Functions** (`supabase/functions/`) | Backend działa; zmiany wymagają testów E2E na produkcji |
| 3 | **RLS policies** | Bezpieczeństwo = absolutny priorytet; 57 tabel z RLS = nie ruszać |
| 4 | **Routing / App.tsx structure** | 40+ tras, 15+ redirectów; zmiana ryzyka regresji nawigacji |
| 5 | **Auth flow** (ProtectedRoute, Supabase Auth) | Krytyczny flow; zmiana = ryzyko lockoutu |
| 6 | **i18n keys** (src/i18n/locales/*.json) | 4513 kluczy × 3 języki; zmiana struktury = regresja tłumaczeń |
| 7 | **Hook logic** (src/hooks/) | 73 custom hooki; zmiana logiki biznesowej poza scope |
| 8 | **Test suite** (src/test/) | 1200 testów musi przechodzić po każdym Prompt; nie modyfikować istniejących |
| 9 | **Capacitor config** | Konfiguracja mobilna; zmiana poza scope |
| 10 | **Package dependencies** | Żadnych nowych zależności bez aprobaty (zasada CLAUDE.md #7) |

### 4.2 Dozwolone zmiany (scope Promptów 2–5)

| Kategoria | Co wolno | Warunek |
|-----------|----------|---------|
| CSS / Tailwind | Modyfikacja klas, tokenów kolorów, cieni | Build musi przechodzić |
| tailwind.config.ts | Nowe tokeny, extend | Istniejące tokeny nie mogą być usunięte |
| index.css | CSS custom properties | Zachować istniejącą strukturę |
| Komponenty UI (src/components/ui/) | Rozszerzanie stylów | Nie zmieniać API komponentów |
| Komponenty stron | Dodawanie animacji, zmiana layoutu | Nie zmieniać logiki biznesowej |
| Landing page | Nowe sekcje, redesign hero | Nie usuwać istniejących funkcji |
| PDF generator | Ulepszanie szablonów | Zachować kompatybilność 3 szablonów |
| Public offer page | Dodawanie animacji, lepszy layout | Nie zmieniać flow akceptacji |
| Onboarding | Dodawanie kroków, guided tour | Nie zmieniać istniejących danych |
| Empty states | Lepsze ilustracje, kontekst | Nie zmieniać fallback behavior |
| Nowe pliki | SVG ilustracje, animacje | Tylko w src/components/ lub public/ |
| public/ | OG image 1200×630, ikony | Nie usuwać istniejących assetów |

---

## 5. Kolejność wykonania Promptów 2–5

### Logika sekwencji

Kolejność wynika z **zależności wizualnych**: design tokens (Prompt 2) → psychologia (Prompt 3) → landing/output (Prompt 4) → mobile polish (Prompt 5). Każdy następny prompt buduje na fundamencie poprzedniego.

---

### PROMPT 2: Premium Design System Uplift

**Cel:** Podnieść bazową jakość wizualną z 6.0/10 do 7.5/10

**Zakres:**
1. Cieplejsza paleta kolorów w index.css — `--background`, `--card`, `--muted`
2. Lepszy system cieni — layered shadows z dwiema warstwami (ambient + directional)
3. Gradient accenty na kluczowych powierzchniach (header hero, karty premium)
4. Typography hierarchy — zwiększenie kontrastu rozmiarów headingów
5. Card redesign — subtelniejsze borders, cieplejsze tło, lepszy spacing
6. Button micro-interactions — press feedback (scale 0.97 + spring)
7. Input polish — focus ring z amber accent, validation animations

**Pliki do zmiany (szacunek):** ~80-120
**LOC (szacunek):** ~400-500 (głównie zmiany klas Tailwind)
**Warunek zakończenia:**
- Build przechodzi ✅
- Testy przechodzą (1200+) ✅
- Żadne nowe zależności ✅
- Screenshot porównanie "przed/po" na 3 ekranach: dashboard, oferta, landing

**STOP jeśli:**
- Zmiana tworzy nowy visual language zamiast upgrade istniejącego
- Zmiana wymaga modyfikacji logiki komponentów
- Zmiana łamie dark mode
- Zmiana łamie mobile layout

**Powierzchnie wrażliwe na regresję:**
- Dark mode (index.css dark section)
- Mobile bottom nav i FAB
- PDF rendering (używa własnych kolorów, nie Tailwind)
- Karty w dashboardzie (DashboardStats, QuickActions, RecentProjects)

---

### PROMPT 3: Psychologia produktu i trust surfaces

**Cel:** Zmienić percepcję z "narzędzia" na "partnera biznesowego"

**Zakres:**
1. Onboarding redesign — spotlight overlay, guided tour do "pierwsza oferta w 3 min"
2. Empty states z kontekstem i mini-ilustracjami (rozbudowa EmptyDashboard wzorca)
3. Trust signals — badge "Autosave aktywny", "Dane szyfrowane", "RODO"
4. Success celebrations — animacja na save oferty, akceptację, milestone
5. Progress indicators — "Twój profil: X% kompletny" w sidebar
6. Lepsze error states — empathetic copy zamiast technicznych komunikatów

**Pliki do zmiany:** ~30-40
**LOC:** ~800-1200
**Warunek zakończenia:**
- Build + testy przechodzą ✅
- Onboarding flow testowany manualnie ✅
- Żadne nowe zależności ✅

**STOP jeśli:**
- Zmiana wymaga nowych hooków z logiką biznesową
- Zmiana modyfikuje dane w Supabase
- Zmiana wymaga nowych migracji DB

**Zależność od Prompt 2:** TAK — używa nowych tokenów kolorów i cieni

**Powierzchnie wrażliwe na regresję:**
- Onboarding wizard (istniejący stan musi się zachować)
- Dashboard layout (nie zmieniać grid structure)
- Sidebar navigation (nie zmieniać routingu)

---

### PROMPT 4: Landing page + PDF + publiczne oferty

**Cel:** Konwersja landing > 3%, PDF i public page budują prestiż

**Zakres:**
1. Landing hero — screenshoty produktu w device mockups (lub animated showcase)
2. Sekcja "przed/po" — Excel vs Majster.AI
3. OG image 1200×630 — poprawny format i rozmiar (zastąpić icon-512.png)
4. Testimoniale — oznaczyć jako "oczekiwane wyniki" lub usunąć do czasu zebrania prawdziwych
5. PDF uplift — gradient header, lepszy layout tabeli, QR code do cyfrowej wersji
6. Public offer page — animowany countdown wygaśnięcia, celebration na akceptacji
7. Wyświetlanie zdjęć z `show_in_public=true` na public page

**Pliki do zmiany:** ~20-30
**LOC:** ~600-1000
**Warunek zakończenia:**
- Build + testy przechodzą ✅
- PDF generuje się poprawnie w 3 szablonach ✅
- Public offer page działa z i bez wariantów ✅
- OG image renderuje się na social media (weryfikacja meta tagów) ✅

**STOP jeśli:**
- Zmiana PDF łamie istniejące szablony
- Zmiana public page modyfikuje flow akceptacji (approve-offer Edge Function)
- Zmiana landing wymaga nowych dependencies (np. video player)

**Zależność od Prompt 2:** TAK — kolory i cienie
**Zależność od Prompt 3:** NIE — niezależne surfaces

**Powierzchnie wrażliwe na regresję:**
- PDF rendering (3 szablony muszą działać)
- Public offer acceptance flow (token validation, status change)
- Landing SEO (meta tagi, structured data, sitemap)
- OG image (social sharing na FB, LinkedIn, Twitter)

---

### PROMPT 5: Mobile polish + micro-interactions + cleanup

**Cel:** Mobile experience na poziomie bliskim native; finalne szlify

**Zakres:**
1. Page transitions — direction-aware slide (Framer Motion, już w dependencies)
2. List animations — staggered entrance na listach ofert/projektów
3. Loading states — shimmer/skeleton na kluczowych listach
4. Touch optimization — minimum 44px touch targets gdzie brakuje
5. Success state animations — SVG stroke draw na checkmarkach
6. Dead code cleanup — usunięcie potwierdzonych nieużywanych komponentów:
   - BiometricLoginButton, SplashScreen, PluginsPanel, VoiceQuoteCreator
   - (NIE usuwać NotificationCenter — jest w użyciu!)
7. Toast feedback fix — dodać toasty na silent actions (copy link, save to price book, schedule follow-up)

**Pliki do zmiany:** ~25-35
**LOC:** ~300-500 (plus usunięcia dead code: -1500-2000)
**Warunek zakończenia:**
- Build + testy przechodzą ✅
- Animacje działają na mobile (Chrome DevTools simulation) ✅
- Dead code usunięty bez łamania importów ✅

**STOP jeśli:**
- Animacje powodują jank na słabszych urządzeniach (>16ms frame time)
- Touch targets zmieniają layout desktop
- Dead code removal łamie build

**Zależność od Prompt 2:** TAK
**Zależność od Prompt 3:** CZĘŚCIOWO (celebrations)
**Zależność od Prompt 4:** NIE

**Powierzchnie wrażliwe na regresję:**
- Mobile bottom navigation
- FAB (Floating Action Button)
- Capacitor native wrapper
- Existing Framer Motion animations (nie nadpisywać)

---

## 6. Powierzchnie wrażliwe na regresję — kompletna mapa

| Powierzchnia | Pliki kluczowe | Ryzyko | Jak testować |
|-------------|----------------|--------|-------------|
| **Dark mode** | index.css (sekcja dark), tailwind.config.ts | WYSOKIE | Przełącznik motywu, wizualna inspekcja |
| **Mobile layout** | MobileShell, BottomNav, FAB | WYSOKIE | Chrome DevTools, 375px viewport |
| **PDF rendering** | offerPdfGenerator.ts, warrantyPdfGenerator.ts, templatePdfGenerator.ts | WYSOKIE | Generacja PDF w 3 szablonach |
| **Public offer flow** | OfferPublicAccept.tsx, approve-offer/ | KRYTYCZNE | Test akceptacji z tokenem |
| **Dashboard** | Dashboard.tsx, DashboardStats, QuickActions | ŚREDNIE | Wizualna inspekcja, animacje |
| **Onboarding** | OnboardingWizard.tsx | ŚREDNIE | Pełny flow 5 kroków |
| **Auth flow** | Login, ProtectedRoute | KRYTYCZNE | NIE RUSZAĆ |
| **i18n** | Pliki locale + t() calls | WYSOKIE | `npm run check:i18n-parity` |
| **SEO/meta** | Landing Helmet, structured data | ŚREDNIE | Inspekcja meta tagów |
| **Build size** | vite.config.ts, chunk splitting | ŚREDNIE | `npm run build` — porównanie rozmiarów |
| **Testy** | src/test/ (85 plików) | KRYTYCZNE | `npm test` — 1200 musi przechodzić |

---

## 7. Blokery właściciela / infrastruktury

Te elementy **nie mogą być rozwiązane przez Prompty 2–5** — wymagają działania właściciela:

| # | Bloker | Wpływ | Estymata właściciela |
|---|--------|-------|---------------------|
| 1 | **Stripe Price IDs** — konfiguracja w Stripe Dashboard + uzupełnienie plans.ts | Monetyzacja zablokowana | 30 min |
| 2 | **Migracje DB na produkcji** — `supabase db push` | Nowe features niewidoczne | 30-60 min |
| 3 | **RESEND_API_KEY** — konfiguracja emaili | Oferty nie dostarczane emailem | 15 min |
| 4 | **FRONTEND_URL** — URL dla linków w emailach | Linki w emailach nie działają | 5 min |
| 5 | **Prawdziwe testimoniale** — zebranie od beta testerów | Landing bez social proof | Czas beta testów |
| 6 | **Video / screenshoty** — nagranie demo produktu | Landing bez dowodu produktu | 2-3h pracy |
| 7 | **Custom OG image 1200×630** — zaprojektowanie | Social sharing nieskuteczne | 1h design |
| 8 | **Sentry DSN produkcyjny** — monitoring błędów | Brak widoczności produkcyjnych błędów | 15 min |

---

## 8. Ryzyka i uwagi

### 8.1 Ryzyka techniczne

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| Zmiana tokenów Tailwind łamie dark mode | ŚREDNIE | WYSOKIE | Testować oba motywy po każdej zmianie |
| Animacje Framer Motion powodują jank na mobile | NISKIE | ŚREDNIE | Testować na throttled CPU w DevTools |
| PDF uplift łamie istniejące szablony | ŚREDNIE | WYSOKIE | Test generacji PDF w 3 szablonach po każdej zmianie |
| Dead code removal łamie ukryte importy | NISKIE | ŚREDNIE | `npm run build` + `npm test` po każdym usunięciu |
| Zmiana Landing łamie SEO | NISKIE | ŚREDNIE | Zachować Helmet, structured data, sitemap |

### 8.2 Ryzyka procesowe

| Ryzyko | Mitygacja |
|--------|-----------|
| Prompt 2 (design system) dotyka ~120 plików — PR może być za duży | Podzielić na 2-3 PRy: (a) tokeny/config, (b) karty/shadows, (c) buttons/inputs |
| "Premium uplift" przeradza się w redesign | Zasada: upgrade, nie rewrite; ulepszaj istniejący language |
| Brak testów wizualnych (screenshot comparison) | Porównywać ręcznie 5 kluczowych ekranów przed/po |

### 8.3 Uwagi o raporcie strategicznym

Raport strategiczny (STRATEGIC_ARCHITECTURE_REVIEW_2026-03-14.md) jest **w 90% poprawny**. Znalezione nieścisłości:
- i18n kluczy: 4513 nie 3330 (lepsza sytuacja niż raportowana)
- RLS tabel: 57 nie 55 (lepsza sytuacja)
- hasVariants: kontekstowo poprawne, nie "bug krytyczny" (niższe ryzyko)
- NotificationCenter: aktywnie używany (nie dead code)
- Dashboard: lepszy wizualnie niż sugerowano

**Wniosek:** Raport strategiczny jest wiarygodny jako źródło kontekstu, ale nie powinien być traktowany jako jedyne źródło prawdy. Niniejszy baseline koryguje nieścisłości.

### 8.4 Brak transakcji przy zapisie wariantów

Sekwencyjny zapis wariantów w `useOfferWizard.ts:283-340` (for loop bez wrappera transakcyjnego) to realne ryzyko, ale:
- Naprawienie wymaga zmiany logiki biznesowej (poza scope premium uplift)
- Wymaga potencjalnie nowej Edge Function z `rpc()` call
- Klasyfikacja: **znane ryzyko, naprawa w osobnym PR, nie w Promptach 2–5**

### 8.5 Brak zdjęć na public offer page

`OfferPublicAccept.tsx` nie renderuje zdjęć z `show_in_public=true`. To **REPO INFERENCE** — nie testowano runtime. Jeśli potwierdzone, naprawienie jest proste (dodanie komponentu) i mieści się w scope Prompt 4.

---

## 9. Podsumowanie wykonawcze

### Co jest prawdą o produkcie dziś:
- **Solidne MVP** — architektura czysta, bezpieczeństwo mocne, core flow działa
- **Jakość wizualna ~6.0/10** — poprawna, industrial, ale nie premium
- **Psychologia UX ~5.0/10** — onboarding istnieje, ale nie prowadzi i nie motywuje
- **Landing/sprzedaż ~6.0/10** — SEO dobre, struktura ok, brak contentu sprzedażowego
- **PDF/output ~6.5/10** — 3 szablony, działa, ale nie imponuje
- **Mobile ~7.0/10** — FAB, bottom nav, responsywność — dobra baza

### Co daje premium uplift na obecnym stacku:
- Z 6.0 do 8.0-8.5/10 jakości wizualnej — **bez migracji**
- ~120-200 zmienionych plików w 4 Promptach
- ~2000-3000 LOC zmian (netto, po cleanup dead code: ~500-1000)
- **29 dni roboczych** (szacunek z raportu strategicznego — realistyczny)

### Co NIE jest celem Promptów 2–5:
- Migracja na Next.js
- Zmiana backend/Edge Functions
- Nowe migracje DB
- Nowe zależności npm
- Zmiana logiki biznesowej
- Refactor hooków
- Zmiana routingu

### Definicja sukcesu (DoD dla całego uplift):
1. Build przechodzi ✅
2. 1200+ testów przechodzi ✅
3. 0 nowych TypeScript errors ✅
4. Jakość wizualna: screenshot comparison "przed/po" na 5 ekranach pokazuje widoczną poprawę
5. Dark mode działa poprawnie
6. Mobile layout nienaruszony
7. PDF generuje się w 3 szablonach
8. Public offer flow działa end-to-end
9. Żadne nowe dependencies

---

*Baseline wygenerowany na podstawie: analizy 2 dokumentów strategicznych, weryfikacji 10 kluczowych twierdzeń w kodzie, runtime verification (tsc, build, vitest, eslint), przeglądu ~50 plików źródłowych, korekty 5 nieścisłości raportu strategicznego.*
