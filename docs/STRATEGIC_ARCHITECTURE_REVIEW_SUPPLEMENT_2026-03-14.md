# SUPLEMENT DO STRATEGICZNEJ ANALIZY ARCHITEKTONICZNEJ MAJSTER.AI

**Data:** 2026-03-14
**Dotyczy:** STRATEGIC_ARCHITECTURE_REVIEW_2026-03-14.md
**Cel:** Uzupełnienie do 100%+ — brakujące sekcje, dane runtime, benchmark konkurencji, deep audit PRów, analiza kosztowa z liczbami

---

# ANEKS A: WERYFIKACJA RUNTIME (DOWODY OBIEKTYWNE)

Weryfikacja wykonana na HEAD `7f4f1f1` (PR #431), z zainstalowanymi zależnościami.

## A.1 Build produkcyjny

```
✅ Build: SUCCESS — 16.06s
✅ TypeScript: 0 ERRORS (strict mode)
✅ ESLint: 0 ERRORS, 657 warnings (639 i18next/no-literal-string + 18 react-refresh)
✅ Testy: 85 plików / 1200 passed / 5 skipped / 0 failures / 39.11s
```

**Uwaga:** Od ostatniego audytu (Closing Audit 2026-03-13) testy wzrosły z 1113 → 1200 (+87 nowych testów w 4 PRach).

## A.2 Analiza bundle (rozmiary gzip)

| Chunk | Gzip | Ocena |
|-------|------|-------|
| `index.js` (main) | **274.75 KB** | ⚠️ DUŻY — wymaga analizy co trafia do main |
| `pdf-vendor` | 136.38 KB | OK — lazy loaded |
| `charts-vendor` | 113.46 KB | OK — lazy loaded |
| `react-vendor` | 54.17 KB | OK |
| `html2canvas` | 47.43 KB | OK — lazy loaded |
| `supabase-vendor` | 45.77 KB | OK |
| `framer-motion-vendor` | 37.88 KB | OK — lazy loaded |
| `ui-vendor` | 37.80 KB | OK |
| `form-vendor` | 20.98 KB | OK |
| **Total gzip** | **~769 KB** | Akceptowalne dla SaaS |

**Największe page chunks (gzip):**
- OfferDetail: 19.11 KB
- ProjectHub: 18.46 KB
- Landing: 13.48 KB
- DocumentTemplates: 13.40 KB
- Dashboard: 13.00 KB
- QuickEstimate: 12.19 KB

**Ocena:** Chunk splitting jest **dobrze skonfigurowany**. Wszystkie ciężkie biblioteki (recharts, jsPDF, html2canvas, leaflet, framer-motion) są izolowane w osobnych chunks i lazy-loaded. Main bundle 274 KB gzip jest na granicy — warto przeanalizować co tam trafia, ale nie jest to bloker.

## A.3 ESLint: Prawda o hardcoded strings

**Poprzednie audyty twierdziły: 1259 hardcoded strings.**
**Obecny stan: 639 warnings i18next/no-literal-string.**

Spadek z 1259 → 639 to efekt PRów #425 (i18n coverage) i #416 (VoiceQuoteCreator/Finance i18n). Problem wciąż istnieje, ale jest **o połowę mniejszy** niż raportowały audyty.

Weryfikacja wykazała, że wiele tych 639 warnings to:
- Klucze techniczne (`'cookie_consent'`, `'theme'`, `'en'`)
- String literals w logice (`'DRAFT'`, `'SENT'`)
- Data-testid wartości
- Console/debug strings

**Realne hardcoded Polish strings widoczne dla użytkownika** to szacunkowo **~150-200**, nie 639. Problem jest mniejszy niż zakładano.

---

# ANEKS B: DEEP AUDIT PRów #428-431

## PR #428 — Harden Offer Flow (10 plików, +430/-116)

**Ocena: DOBRY** ✅

**Co zrobiono dobrze:**
- Usunięto zduplikowaną kartę AI z QuoteCreationHub (obiecywała coś, czego nie dostarczała)
- Naprawiono wyciek wewnętrznego URL w OfferPreviewModal (security fix)
- Dodano ErrorState na OfferDetail gdy oferta nie istnieje
- 19 nowych testów

**Znalezione problemy:**
1. `handleCopyLink` (OfferPreviewModal.tsx:261) — cisza gdy brak tokenu akceptacji. Przycisk widoczny i klikalny, nic się nie dzieje. Powinien być disabled.
2. Testy statusów badge'ów weryfikują lokalne kopie, nie importy z prawdziwych komponentów.

## PR #429 — Price Book Search (+1017/-62)

**Ocena: MIESZANY** ⚠️

**Co zrobiono dobrze:**
- Nowy hook `useItemNameSuggestions` z inteligentną deduplikacją
- Discriminated union types (PriceBookSuggestion vs HistoricalSuggestion)
- 23 testy czystej logiki

**Znalezione problemy:**
1. **Unsanitized ilike pattern** (useItemNameSuggestions.ts:66) — `%${search.trim()}%` wpuszcza wildcards `%` i `_` od użytkownika. Niskie ryzyko (RLS limituje), ale niepoprawne.
2. **Race condition blur/click** (WorkspaceLineItems.tsx) — `setTimeout 150ms` na blur. Na wolnych urządzeniach dropdown zamknie się przed kliknięciem.
3. **Brak feedback** na SaveToPriceBookButton — bez toastu, bez zmiany ikony. Użytkownik nie wie czy zapisano.
4. **Zduplikowany rendering** — PriceBookPanel i NameFieldWithAutocomplete renderują niemal identyczne sekcje.
5. **Rozmiar PR: 1017 linii** — 3.4x ponad limit 300 LOC z CLAUDE.md.

## PR #430 — Offer Variants (+2184/-329)

**Ocena: MIESZANY Z BUGAMI** ⚠️🔴

**Co zrobiono dobrze:**
- Dobrze zaprojektowana migracja SQL z RLS, cascading deletes
- Backward compatibility zachowana (tryb bez wariantów działa)
- Widoczność zdjęć (internal/public/PDF) — czysty design
- 18 testów

**Znalezione BUGI:**

1. **🔴 BUG: `hasVariants` niespójność semantyczna**
   - Wizard: `variants.length > 0` = tryb wariantowy
   - Public Accept: `variants.length > 1` = tryb wariantowy
   - **Skutek:** Oferta z 1 wariantem wyświetla się INACZEJ w kreatorze i na stronie klienta. Sumy mogą się nie zgadzać.

2. **🔴 BUG: Brak transakcji przy zapisie wariantów** (useOfferWizard.ts:283-340)
   - Warianty zapisywane sekwencyjnie w pętli for. Jeśli drugi wariant się nie zapisze, pierwszy jest już committed.
   - **Skutek:** Oferta w stanie częściowym — nieprzewidywalne zachowanie.

3. **🟡 BUG: `removeVariant` dead code** — zmienne `removed` i `removedOther` są bezsenasowne logicznie, kod działa "przez przypadek".

4. **🟡 Brak zdjęć na publicznej stronie** — `OfferPhotoAttach` podłączony do OfferDetail ale NIE do OfferPublicAccept. Zdjęcia z `show_in_public=true` nie są widoczne dla klienta.

5. **🟡 Max 3 warianty tylko w UI** — brak constrainta w DB. API call może stworzyć więcej.

6. **Rozmiar PR: 2184 linii** — **7.3x ponad limit** 300 LOC. Powinien być rozbity na 3 PRy.

## PR #431 — Offer Follow-up + Billing Beta Notice (+276/-7)

**Ocena: DOBRY** ✅

**Co zrobiono dobrze:**
- Czysty, skoncentrowany PR w ramach limitu 300 LOC
- Reużywa istniejący hook `useAddCalendarEvent`
- Uczciwy banner beta dla billingu
- Dobre testy

**Znalezione problemy:**
1. Brak toast success/error na schedule follow-up
2. Brak ochrony przed duplikatami (wielokrotne kliknięcie = wiele eventów)
3. Hardcoded 2-day delay (today+2)

## Podsumowanie PRów: WZORZEC SYSTEMOWY

Wszystkie 4 PRy dzielą wspólny problem: **brak feedbacku użytkownikowi po akcji**. Copy link, save to price book, schedule follow-up — wszystkie milczą. To systematyczny problem UX, nie jednorazowe pominięcie.

| PR | LOC | Limit 300 | Bugs |
|----|-----|-----------|------|
| #428 | 430 | +43% | 0 krytycznych |
| #429 | 1017 | +239% | 1 potencjalny |
| #430 | 2184 | **+628%** | **2 krytyczne** |
| #431 | 276 | ✅ OK | 0 krytycznych |

---

# ANEKS C: BENCHMARK KONKURENCJI — POLSKI RYNEK

## C.1 Mapa konkurencji

| Konkurent | Jakość wizualna | Mobile | Cena | Zagrożenie dla Majster.AI |
|-----------|:---:|:---:|---|:---:|
| **Procore** | 9/10 | Doskonały | $4.5K-25K+/rok | Brak (za drogi) |
| **BIMcloud/Archicad** | 9/10 | Tylko wizualizacja | $200+/mies. | Brak (inna kategoria) |
| **BuildBook** | 8.5/10 | Doskonały (natywny) | $79/mies./user | Niski (brak PL) |
| **PlanRadar** | 8/10 | Dobry | $32/user/mies. | Średni (duże firmy) |
| **Buildern** | 7.5/10 | Dobry | Custom | Niski (brak PL) |
| **SCCOT** | 6.5/10 | Responsywny web | Freemium | **WYSOKI** — najbliższy konkurent |
| **Oferteo.pl** | 6/10 | Podstawowy | Kredyty 259-499 PLN | Niski (marketplace) |
| **Comarch ERP** | 5/10 | Słaby | Custom | Niski (za skomplikowany) |
| **Rodos/Norma** | 4/10 | Brak | Jednorazowy | Niski (desktop legacy) |
| **Majster.AI (dziś)** | **5.5-6/10** | **Dobry** | **Freemium** | — |

## C.2 Kluczowe wnioski

### Luka rynkowa jest REALNA
Nie istnieje polskojęzyczny, mobile-first, AI-powered SaaS łączący zarządzanie projektami + wyceny + CRM + PDF dla małych firm remontowych. Najbliższy konkurent to SCCOT (6.5/10 wizualnie), który ma dobre funkcje ale ograniczony design.

### Benchmark wizualny
Aby wyróżnić się na polskim rynku, Majster.AI potrzebuje **7.5-8/10** wizualnie. BuildBook jest wzorem aspiracyjnym — czysty, nieskomplikowany, mobile-natywny, z brandowanymi outputami dla klientów. Polska konkurencja (SCCOT, budzetuje.pl, Rodos) stoi na **4-6.5/10**, więc jest wyraźna szansa na zróżnicowanie samym designem.

### AI to wyróżnik
Żaden z polskich konkurentów (SCCOT, Rodos, Norma, budzetuje.pl) nie oferuje AI. Tylko Procore i Buildern mają AI, ale obsługują inne rynki. AI capabilities Majster.AI to **prawdziwa przewaga konkurencyjna** w polskiej niszy.

### Sweet spot cenowy
SCCOT oferuje freemium. BuildBook kosztuje $79/mies. Przy polskiej wrażliwości cenowej, model freemium z planami **49-149 PLN/mies.** byłby konkurencyjny i odpowiedni.

### KSeF (2026) — strategiczna okazja
Polska wprowadza obowiązkowy KSeF (e-faktury) w 2026. Wczesna integracja = przewaga adopcyjna.

### Co robi BuildBook "premium" (wzór do naśladowania):
- Czysty, nieskomplikowany interfejs (brak clutter)
- Brandowane dashboardy dla klientów
- Mobile-native design
- Transparentne ceny
- "Simplicity as the premium signal" — prostota JEST premiumem

---

# ANEKS D: ANALIZA ZALEŻNOŚCI I DEAD CODE

## D.1 Metryki codebase

| Metryka | Wartość |
|---------|--------|
| Pliki komponentów (.tsx) | 304 |
| Pliki utility (.ts) | 118 |
| Pliki testowe | 82 |
| **Łącznie plików źródłowych** | **465** |
| **Łącznie linii kodu** | **81,924** |
| Edge Functions | 20 (~7,100 LOC) |
| Migracje SQL | 50 |
| Tłumaczenia | 3 × ~4,939 linii = 14,817 |
| Zależności produkcyjne | 95 |
| Zależności dev | 48 |

## D.2 Dead code (do usunięcia)

**8 nieużywanych hooków:**
- useOfferStats, usePurchaseCosts, useProjectPhotos, useOfferSends
- useOfferVariants, usePushNotifications + 2 pliki testowe

**24 nieużywane komponenty (nigdy importowane):**
- BiometricLoginButton, TeamMembersPanel, VoiceQuoteCreator, OfflineFallback
- OfferTrackingTimeline, ComingSoonSection, BackToDashboard, PageTransitionAnimated
- SplashScreen, NotificationCenter, OfferQuotaIndicator, UpgradeModal
- BillingDashboard, OrganizationManager, OnboardingModal, NewShellOnboarding
- TradeOnboardingModal, WorkTasksGantt, PluginsPanel, AnalyticsCharts + 4 inne

**7 osieroconych stron (w filesystem ale nie routowanych):**
- Admin.tsx, Billing.tsx, Marketplace.tsx, Privacy.tsx, Team.tsx, Terms.tsx, Index.tsx

**87 instancji typu `any`** — do refactoru na `unknown` lub właściwe typy.

**Szacowany zysk z cleanup:** ~3,500-5,000 LOC mniej, prostszy codebase, szybszy build.

## D.3 Architektura zależności

**✅ Brak circular dependencies** — czysta hierarchia:
```
Pages → Components → Hooks → Lib → Types
```

**✅ Chunk splitting optymalny** — wszystkie ciężkie biblioteki izolowane i lazy-loaded.

**⚠️ 3 minor one-way hook→lib dependencies** (warrantyPdfGenerator, templatePdfGenerator, exportUtils importują z hooków). Akceptowalne, ale naruszają czystość warstw.

---

# ANEKS E: KOREKTA TWIERDZEŃ AUDYTOWYCH

Po dogłębnej weryfikacji **16 konkretnych twierdzeń** z 6 audytów, wyniki są następujące:

| # | Twierdzenie z audytów | Weryfikacja HEAD | Status |
|---|---|---|---|
| 1 | "Analytics URL leak — /app/analytics dostępna" | Route istnieje bez redirect guard, nav `visible: false` | **PRAWDA** — URL wyciek potwierdzon |
| 2 | "Offer duplication = coming soon toast" | **Przycisk USUNIĘTY z Offers.tsx** — brak kodu duplikacji | **ZMIENIONE** — problem nie istnieje |
| 3 | "AI prompts hardcoded po polsku" | AiChatAgent.tsx używa `t()` i18n kluczy + `getSpeechLocale()` | **FAŁSZ** — naprawione |
| 4 | "Voice hardcoded pl-PL" | Default `pl-PL` w useVoiceToText, ale runtime używa `getSpeechLocale(i18n.language)` | **CZĘŚCIOWO** — default hardcoded, runtime dynamiczny |
| 5 | "1259 hardcoded strings" | 639 warnings ESLint, ~150-200 realnie widocznych | **PRZESADZONE** — problem mniejszy |
| 6 | "Brak linku klient → oferty/projekty" | Clients.tsx = CRUD, zero nawigacji relacyjnej | **PRAWDA** |
| 7 | "DashboardStats fałszywie klikalne" | `cursor-default`, brak `hover:-translate-y` | **FAŁSZ** — naprawione |
| 8 | "Finance export disabled coming soon" | Przyciski exportu usunięte w PR #420 | **ZMIENIONE** — usunięte |
| 9 | "OG image = icon-512.png" | `index.html:20`, `Landing.tsx:111` — kwadrat 512px | **PRAWDA** |
| 10 | "OfferWizard nie czyta state.mode" | Plik OfferWizard.tsx **nie istnieje** w codebase | **NIEAKTUALNY** — komponent usunięty/przemianowany |
| 11 | "Calendar uses v2_projects" | `Calendar.tsx:64-67` — `useProjectsV2List()` | **PRAWDA** — naprawione |
| 12 | "QuickEstimate → v2_projects" | `QuickEstimateWorkspace.tsx:197-217` — tworzy v2_project | **PRAWDA** — naprawione |
| 13 | "Marketplace/Team redirects" | `App.tsx:260,262` — Navigate to `/app/dashboard` | **PRAWDA** |
| 14 | "approve-offer dual-write" | `approve-offer/index.ts:403-440` — v2 + legacy | **PRAWDA** |
| 15 | "PDF v2-first" | `PdfGenerator.tsx:35-69` — v2 first, legacy fallback | **PRAWDA** |
| 16 | "Stripe Price IDs = null" | Wszystkie plany w plans.ts: `stripePriceId: null` | **PRAWDA** |

**Wynik korekty:** Z 10 problemów raportowanych w sekcji #3 głównego raportu:
- 3 problemy **naprawione** (AI prompts, DashboardStats, Finance export)
- 1 problem **usunięty** (offer duplication button)
- 1 problem **przesadzony** (hardcoded strings: 639 nie 1259, ~200 realnych)
- 5 problemów **potwierdzonych** (Analytics leak, klient→oferty, OG image, voice default, Stripe null)

---

# ANEKS F: PRECYZYJNA ANALIZA KOSZTOWA PO ETAPACH

## Etap 1: Premium Design System Uplift

| Element | Pliki do zmiany | LOC zmian (est.) | Czas |
|---------|:---:|:---:|---|
| tailwind.config.ts — nowe tokeny | 1 | ~50 | 2h |
| Pliki z `bg-white` do cieplejszych tonów | 20 | ~40 | 3h |
| Pliki z hardcoded `bg-gray-*` | 19 | ~60 | 3h |
| Pliki z `shadow-*` do refactoru | 68 | ~100 | 4h |
| Card redesign (ui/card.tsx + usage) | ~72 pliki używają `bg-card` | ~80 | 4h |
| Typography hierarchy (headingi) | ~30 | ~60 | 3h |
| Button/input micro-animations | ~10 | ~40 | 2h |
| Dark mode refinement | ~20 | ~60 | 3h |
| **SUMA ETAP 1** | **~120 plików** | **~490 LOC** | **~24h = 3 dni** |

## Etap 2: Psychologia produktu

| Element | Pliki | LOC (est.) | Czas |
|---------|:---:|:---:|---|
| Onboarding redesign (4 pliki + 2 nowe) | 6 | ~300 | 2 dni |
| Dashboard motywacyjny (8 plików) | 8 | ~400 | 2 dni |
| Trust signals (nowe badges, 5 plików) | 5 | ~150 | 1 dzień |
| Success celebrations (confetti, checkmarks) | 3 | ~150 | 1 dzień |
| Empty states z kontekstem | 10 | ~200 | 1 dzień |
| Testy | 5 | ~200 | 1 dzień |
| **SUMA ETAP 2** | **~37 plików** | **~1,400 LOC** | **~8 dni** |

## Etap 3: Landing & Visual Sales

| Element | Pliki | LOC (est.) | Czas |
|---------|:---:|:---:|---|
| Hero redesign (video/demo) | 2 | ~100 | 1 dzień |
| Screenshoty w device mockups | 3 | ~150 | 1 dzień + design |
| Before/after comparison | 1 nowy | ~80 | 0.5 dnia |
| Social proof section | 2 | ~100 | 0.5 dnia |
| OG image 1200×630 | 1 | ~10 | 0.5 dnia + design |
| Scroll-triggered animations | 5 | ~100 | 1 dzień |
| Landing testy | 2 | ~100 | 0.5 dnia |
| **SUMA ETAP 3** | **~16 plików** | **~640 LOC** | **~5 dni + content** |

## Etap 4: PDF & publiczne oferty

| Element | Pliki | LOC (est.) | Czas |
|---------|:---:|:---:|---|
| PDF redesign (5 plików lib) | 5 | ~400 | 3 dni |
| Public offer page uplift (588 + 465 linii) | 2 | ~300 | 2 dni |
| Acceptance celebration animation | 1 | ~50 | 0.5 dnia |
| QR code na PDF | 1 | ~50 | 0.5 dnia |
| Testy | 3 | ~150 | 1 dzień |
| **SUMA ETAP 4** | **~12 plików** | **~950 LOC** | **~7 dni** |

## Etap 5: Mobile & micro-interactions

| Element | Pliki | LOC (est.) | Czas |
|---------|:---:|:---:|---|
| Page transitions direction-aware | 2 | ~80 | 0.5 dnia |
| List animations (staggered) | 5 | ~100 | 1 dzień |
| Scroll reveals (landing) | 3 | ~60 | 0.5 dnia |
| Touch optimization (44px targets) | 10 | ~40 | 0.5 dnia |
| Shimmer loading states | 3 | ~60 | 0.5 dnia |
| **SUMA ETAP 5** | **~23 pliki** | **~340 LOC** | **~3 dni** |

## Etap 6: Infrastruktura & monetyzacja

| Element | Pliki | LOC (est.) | Czas |
|---------|:---:|:---:|---|
| Dead code cleanup (31 plików) | 31 usunięć | -3,500 LOC | 1 dzień |
| `any` → proper types (87 instancji) | ~30 | ~100 | 1 dzień |
| Analytics route redirect guard | 1 | ~5 | 5 min |
| Finance export (podłączenie UI) | 2 | ~50 | 0.5 dnia |
| hasVariants bug fix (PR #430) | 2 | ~10 | 1h |
| Variant save transaction fix | 1 | ~30 | 2h |
| Brak feedback toast fix (4 PRy) | 4 | ~20 | 1h |
| Stripe config (owner) | 1 | ~10 | 30 min (owner) |
| DB migrations push (owner) | 0 | 0 | 30-60 min (owner) |
| **SUMA ETAP 6** | **~72 pliki** | **-3,275 LOC** | **~3 dni** |

## Podsumowanie kosztowe

| Etap | Pliki | LOC | Czas | Widoczność |
|------|:---:|:---:|---|---|
| 1. Design System | 120 | +490 | 3 dni | 🟢🟢🟢 NATYCHMIASTOWA |
| 2. Psychologia | 37 | +1,400 | 8 dni | 🟢🟢🟢 WYSOKA |
| 3. Landing | 16 | +640 | 5 dni + content | 🟢🟢🟢 KRYTYCZNA |
| 4. PDF/Output | 12 | +950 | 7 dni | 🟢🟢 WYSOKA |
| 5. Mobile polish | 23 | +340 | 3 dni | 🟢🟢 ŚREDNIA |
| 6. Infra/cleanup | 72 | -3,275 | 3 dni | 🟡 NIEWIDOCZNA (architektura) |
| **ŁĄCZNIE** | **280** | **+545 netto** | **~29 dni roboczych** | |

**Koszt migracji na Next.js dla porównania: ~60-90 dni roboczych** (2-3 miesiące), z ryzykiem regresji.

---

# ANEKS G: NOWO ZNALEZIONE BUGI (Z AUDYTU PRów)

Bugi znalezione w PRach #428-431, których żaden z 6 poprzednich audytów nie raportował:

| # | Bug | Plik:Linia | Priorytet | Opis |
|---|-----|-----------|-----------|------|
| 1 | **hasVariants semantyczna niespójność** | OfferPublicAccept.tsx:271 vs WizardStepItems.tsx | 🔴 KRYTYCZNY | Wizard: `>0` = warianty. Public: `>1` = warianty. 1-wariantowa oferta wyświetla się różnie |
| 2 | **Brak transakcji przy zapisie wariantów** | useOfferWizard.ts:283-340 | 🔴 KRYTYCZNY | Sekwencyjny zapis w for loop, brak rollback przy błędzie |
| 3 | **Offer photos nie na public page** | OfferPublicAccept.tsx | 🟡 ŚREDNI | show_in_public=true zdjęcia nie renderowane |
| 4 | **Unsanitized ilike pattern** | useItemNameSuggestions.ts:66 | 🟡 NISKI | `%` i `_` w search nie escape'owane |
| 5 | **Brak toast feedback** (systemowy) | 4 pliki w PRach #428-431 | 🟡 ŚREDNI | Silent actions bez potwierdzenia |
| 6 | **removeVariant dead code** | WizardStepItems.tsx:~200-215 | 🟡 NISKI | Logika działa "przez przypadek" |
| 7 | **Max 3 variants only in UI** | Brak DB constraint | 🟡 NISKI | API może stworzyć >3 |
| 8 | **Non-standard storage policy** | Migration 20260314120000:136-145 | 🟡 NISKI | Direct INSERT do storage.policies |

---

# ANEKS H: SKORYGOWANA TABELA STANU PRODUKTU

Na podstawie WSZYSTKICH weryfikacji, oto zaktualizowana prawda:

| Wymiar | Poprzednia ocena | Skorygowana ocena | Zmiana | Uzasadnienie |
|--------|:---:|:---:|---|---|
| Architektura / kod | 8.5 | **8.5** | = | Potwierdzona, czysta hierarchia, 0 circular deps |
| Funkcjonalność core | 8.5 | **8.0** | ↓ | 2 nowe bugi w offer variants (hasVariants + brak transakcji) |
| Bezpieczeństwo | 9.0 | **9.0** | = | Potwierdzona, RLS + CSP + HSTS + rate limiting |
| Jakość wizualna | 5.5 | **6.0** | ↑ | Lepsza niż zakładano — DashboardStats premium, animacje exist |
| Psychologia UX | 5.0 | **5.0** | = | Potwierdzony brak |
| Landing / sprzedaż | 5.5 | **6.0** | ↑ | SEO solidne, struktura dobra, brakuje contentu |
| Mobile UX | 7.0 | **7.0** | = | FAB, bottom nav, spring animations |
| PDF / output | 6.5 | **6.5** | = | 3 szablony, działa, ale nieinspirujący |
| Branding / tożsamość | 6.0 | **6.0** | = | Logo dobre, reszta generyczna |
| Testy | — | **7.5** | nowe | 1200 testów, 85 plików, 0 failures |
| Dead code / higiena | — | **5.0** | nowe | 31 unused items, 87 `any`, 7 orphaned pages |
| **Średnia ważona** | **~7.0** | **~7.0** | = | Potwierdzona |

## Skorygowany limit na obecnym stacku:

| Cel | Skorygowana ocena |
|:---:|---|
| **8.0/10** | ✅ TAK — 3 tygodnie (Etap 1 + Etap 6 cleanup) |
| **8.5/10** | ✅ TAK — 6 tygodni (+ Etap 2 + Etap 3) |
| **9.0/10** | ⚠️ WARUNKOWO — 8-10 tygodni (+ Etap 4 + Etap 5 + content creation + custom illustrations) |

---

# ANEKS I: ZAKTUALIZOWANA REKOMENDACJA

Pierwotna rekomendacja **nie zmienia się** po uzupełnieniu:

## ✅ NIE MIGROWAĆ. PREMIUM UPLIFT NA OBECNYM STACKU.

Dodatkowe argumenty z uzupełnień:

1. **Benchmark konkurencji** potwierdza, że Majster.AI jest wizualnie na **poziomie polskiej konkurencji** (SCCOT 6.5/10, Majster 6.0/10) ale poniżej aspiracyjnego benchmarku (BuildBook 8.5/10). Różnica 2.5 punkta to **praca designowa, nie migracja frameworka**.

2. **Bundle analysis** potwierdza, że obecny stack jest **dobrze zoptymalizowany**. Chunk splitting działa poprawnie. Migracja na Next.js nie zmniejszy bundle'a — zmieni tylko sposób ładowania.

3. **2 nowe krytyczne bugi** w offer variants (PR #430) muszą być naprawione PRZED premium uplift. hasVariants niespójność = klient widzi inną ofertę niż twórca. Brak transakcji = ryzyko corrupted data.

4. **29 dni roboczych** na pełny premium uplift (6 etapów) vs **60-90 dni** na migrację Next.js. ROI jest 3x lepszy na obecnym stacku.

5. **Luka rynkowa jest potwierdzona** — brak polskojęzycznego, mobile-first, AI-powered SaaS w tej niszy. Czas na rynku jest ważniejszy niż zmiana frameworka.

---

*Suplement wygenerowany na podstawie: npm run build, npx tsc, npx vitest run, npm run lint, git show 4 commitów, analiza 16 claim-by-claim, web research 14 konkurentów, dependency audit 143 packages, dead code scan 465 plików źródłowych.*
