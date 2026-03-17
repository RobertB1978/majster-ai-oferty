# AUDYT RECONCILIATION — RAPORT GŁÓWNY

**Data:** 2026-03-17
**Audytor:** Claude Opus 4.6 (Senior Enterprise Product Audit Engineer)
**Tryb:** READ-ONLY — żaden plik produkcyjny nie został zmieniony
**Źródło prawdy:** `docs/ULTRA_ENTERPRISE_ROADMAP.md` v1.0 FINAL
**Kontekst:** Reconciliation po audycie E0+E1 z 2026-03-16 i baseline z 2026-03-14

---

## 1. KRÓTKIE SEDNO

**Od ostatniego audytu (2026-03-16) naprawiono dwa krytyczne blokery:**

1. **Quick→Full data continuity** — DraftContext zamontowany w App root, IDB persistence, QuickEstimateWorkspace czyta dane z Quick Mode. Gate 1 Condition 2 zmienił status z FAIL na PASS.
2. **Offline queue sync** — `useOfflineSync` podłączony w App.tsx:116, `flushQueue()` wywoływany na mount + online event, MVP SyncProcessor routuje do Supabase. Gate 0 E0-C zmienił status z PARTIAL na PASS.

**Jednak owner nadal ma rację że "niewiele się zmieniło wizualnie":**
- Większość zmian to infrastruktura techniczna (tokeny, analytics, offline queue, DraftContext)
- Widoczne zmiany dotyczą **nowych ekranów** (Quick Mode) i **PDF prestige**
- Istniejące ekrany (dashboard, offers, projects, landing) wyglądają **niemal identycznie**
- Billing/Stripe jest **zepsuty** (null Price IDs = checkout niemożliwy)
- Nie wiadomo czy migracje DB działają na produkcji

**Jednym zdaniem:** Fundamenty techniczne Gate 0 i Gate 1 są solidne. Problem polega na tym, że zmiany są niewidoczne gołym okiem na ekranach, które owner zna.

---

## 2. TABELA STATUSÓW

### Gate 0 — Visual Authority Foundation

| Element | Status | Komentarz |
|---------|--------|-----------|
| E0-A: Design Tokens | **PARTIAL** | 36+ tokenów w :root + .dark. Core UI używa. Landing NIE. |
| E0-B: Analytics | **PASS** | 14 eventów, trackEvent(), 5 miejsc użycia. Sink = console (brak backendu). |
| E0-C: Offline Queue | **PASS** | ✅ Naprawione. flushQueue() podłączony w useOfflineSync, mount + online. |
| E0-D: OfferDraft | **PASS** | 24 pola, readonly id, 50+ testów. DraftContext = single source of truth. |
| Fonty self-hosted | **PASS** | Bricolage Grotesque + JetBrains Mono w /public/fonts/, preload. |
| **Gate 0 ŁĄCZNIE** | **PARTIAL** | Landing page blokuje zamknięcie. |

### Gate 1 — Core Value Flow

| Warunek | Status | Komentarz |
|---------|--------|-----------|
| G1-C1: Quick Mode mobile | **PASS** | Pełny ekran, 4 sekcje, touch 48px, sticky CTA. |
| G1-C2: Quick→Full continuity | **PASS** | ✅ Naprawione. DraftContext + IDB persistence + context panel. |
| G1-C3: PDF prestige | **PASS** | JBM, QR, amber, 3 szablony, alternating rows. |
| G1-C4: Send + public link | **PASS** | Idempotentny, non-fatal email/PDF, OFFER_SENT tracking. |
| G1-C5: Flow 390px | **UNKNOWN** | Brak testu na prawdziwym urządzeniu. |
| **Gate 1 ŁĄCZNIE** | **PASS** | Z zastrzeżeniem G1-C5 = UNKNOWN. |

### Etap 2 Readiness

| Element | Status | Komentarz |
|---------|--------|-----------|
| Prompt 2: Design System Uplift | **NOT STARTED** | Baseline gotowy. |
| Prompt 3: Psychologia produktu | **NOT STARTED** | Zależy od Prompt 2. |
| Prompt 4: Landing+PDF+Public | **NOT STARTED** | Zależy od Prompt 2. |
| Prompt 5: Mobile polish | **NOT STARTED** | Zależy od Prompt 2. |
| Stripe Price IDs | **UNKNOWN** | null w plans.ts. OWNER ACTION. |
| Migracje DB produkcja | **UNKNOWN** | 53 migracji w repo. OWNER ACTION. |
| RESEND_API_KEY | **UNKNOWN** | Wymagany dla emaili. OWNER ACTION. |
| FRONTEND_URL | **UNKNOWN** | Wymagany dla linków. OWNER ACTION. |

---

## 3. CO NAPRAWDĘ DZIAŁA

### 3.1 Kompletnie działające (end-to-end w kodzie)

1. **Quick Mode** (`/app/quick-mode`) — nowy ekran, 4 sekcje: zdjęcia, notatka, klient, checklist. Sticky CTA "Mam wszystko — zaczynam wycenę". Touch targets 48px.

2. **Quick→Full transition** — DraftContext persystuje do IndexedDB, QuickEstimateWorkspace wyświetla context panel z amber kartą: dane klienta, notatka, liczba zdjęć z Quick Mode. draft_id stabilny.

3. **PDF prestige** — jsPDF z JetBrains Mono dla kwot, QR code z linkiem do publicznej oferty, amber total highlighting, alternating rows, 3 szablony (classic/modern/minimal).

4. **Send flow** — useSendOffer: DRAFT→SENT transition z guard, PDF generate + upload (non-fatal), email via Edge Function (non-fatal), OFFER_SENT tracking (idempotentny).

5. **Public offer page** (`/oferta/:token`) — formularz akceptacji z podpisem, pytania klienta, expired handling (status page, nie 404), copy link.

6. **Offline queue** — zapis do IndexedDB, flush na mount (po 1.5s) + na event online (debounce 800ms), MVP SyncProcessor routuje OFFER_DRAFT_SAVE do upsert w tabeli `offers`.

7. **Design tokens** — 36+ tokenów CSS w :root + .dark, zmapowane w tailwind.config.ts na ds-* namespace, fonty self-hosted z preload.

8. **Build & testy** — `tsc --noEmit`: 0 błędów, `vitest run`: 93 pliki, 1366 passed, 0 failed, build: sukces.

### 3.2 Zweryfikowane w kodzie, ale wymagające runtime confirmation

- Offer acceptance via token (approve-offer EF) — logika poprawna, ale zależy od Supabase secrets
- Email delivery (send-offer-email EF) — zależy od RESEND_API_KEY
- AI features (ai-chat-agent, ai-quote-suggestions) — zależy od OPENAI/ANTHROPIC/GEMINI keys
- Stripe checkout — kod kompletny, ale null Price IDs = nie działa

---

## 4. CO JEST TYLKO CZĘŚCIOWE

### 4.1 Landing page — tokeny NIE zastosowane

**Problem:** 13 komponentów w `src/components/landing/` używa hard-coded klas Tailwind:
- `bg-gray-900`, `bg-gray-800`, `text-gray-300`, `text-amber-500`
- Zamiast `bg-ds-bg-base`, `text-ds-text-secondary`, `text-ds-accent-amber`

**Konsekwencja:** Zmiana palety kolorów w tokenach NIE wpłynie na landing page. Dark mode na landing nie korzysta z systemu tokenów. Gate 0 Condition 1 ("tokeny widoczne w CAŁEJ aplikacji") nie jest spełniony.

**Pliki:** HeroSection, CTASection, FAQSection, FeaturesGrid, LandingHeader, LandingFooter, PricingSection, ComingSoonSection, TestimonialsSection, TrustBar, HowItWorksSection, BeforeAfterSection, InteractiveDemo.

### 4.2 Analytics — brak sink

**Problem:** `trackEvent()` jest fire-and-forget z try/catch. W środku jest `console.debug()` ale brak wysyłki do backendu (brak Supabase insert, brak API call, brak GA/Mixpanel).

**Konsekwencja:** Dane analityczne z 5 miejsc (OFFER_QUICK_STARTED, OFFER_QUICK_TO_FULL, OFFER_PDF_GENERATED, OFFER_SENT, OFFER_DRAFT_SAVE) nie trafiają nigdzie. Architektura jest poprawna — brakuje tylko sink.

### 4.3 Offline queue UI — brak widocznego statusu

**Problem:** `SYNC_STATUS_LABELS` (polskie etykiety) istnieją w constants.ts, ale żaden komponent UI ich nie wyświetla. Użytkownik nie wie, że dane się synchronizują.

### 4.4 Offer photos na public page — nie wyświetlane

**Problem:** `OfferPublicAccept.tsx` nie renderuje zdjęć z `show_in_public=true`. Tabela `offer_photos` ma kolumnę `show_in_public`, ale publiczna strona oferty nie korzysta z niej.

---

## 5. CO JEST ZEPSUTE

### 5.1 Billing / Stripe — BROKEN

**Problem:** `src/config/plans.ts` — wszystkie 4 plany (Free, Starter, Pro, Business) mają `stripePriceId: null`. Edge Function `create-checkout-session` nie może utworzyć sesji checkout bez Price ID.

**Wpływ:** Monetyzacja zablokowana. Użytkownik nie może przejść na płatny plan.

**Bloker:** OWNER ACTION — konfiguracja w Stripe Dashboard + uzupełnienie plans.ts + ustawienie STRIPE_SECRET_KEY w Supabase secrets.

### 5.2 Migracje DB na produkcji — UNKNOWN

**Problem:** Repo zawiera 53 migracji SQL. Nie wiadomo, ile z nich zostało zaaplikowanych na produkcji Supabase. Jeśli brakuje kluczowych migracji (offers, offer_items, offer_variants, v2_projects, acceptance_links), to:
- Lista ofert może być pusta lub zwracać błędy
- Projekty v2 mogą nie istnieć
- Acceptance links mogą nie działać

**Bloker:** OWNER ACTION — weryfikacja via Supabase Dashboard lub `supabase db push`.

---

## 6. CO TYLKO WYGLĄDA NA ZROBIONE, ALE OWNER TEGO NIE WIDZI

### 6.1 Dlaczego owner czuje że "niewiele się zmieniło"

**Odpowiedź jest brutalna ale uczciwa:**

| Co owner widzi na co dzień | Co się zmieniło | Dlaczego tego nie widać |
|---------------------------|-----------------|----------------------|
| Dashboard | Kolory zmienione na tokeny (PR #443, #452) | Layout, karty, typo — identyczne. Zmiana kolorów z `bg-gray-800` na `bg-ds-bg-surface` jest estetycznie niezauważalna. |
| Lista ofert | Wewnętrznie nowy system (offers v2) | Komponent UI ten sam. Dane mogą nie istnieć jeśli migracje nie zaaplikowane. |
| Lista projektów | v2_projects wewnętrznie | Komponent UI ten sam. |
| Landing page | Fake testimonials zastąpione (PR #437) | Hard-coded kolory — wygląda tak samo. |
| Billing | Stripe kod kompletny | Price IDs = null → checkout nie działa → owner widzi "nic". |
| Quick Mode | NOWY EKRAN | Owner może nie wiedzieć o route `/app/quick-mode` — brak widocznego CTA z dashboardu. |
| PDF prestige | JBM + QR + amber + szablony | Owner musi wygenerować PDF żeby zobaczyć — a jeśli nie ma ofert w DB, nie może. |

**Kluczowy insight:** Większość pracy Gate 0/1 to **infrastruktura niewidoczna** (tokeny, analytics, offline queue, DraftContext, typy, walidacja, testy). Widoczne zmiany istnieją ale:
1. Są na **nowych ekranach** do których owner nie trafia naturalnie
2. Wymagają **danych w bazie** które mogą nie istnieć na produkcji
3. Istniejące ekrany wyglądają **identycznie** bo zmiana dotyczyła tokenów CSS, nie layoutu

### 6.2 Mapa widoczności zmian

| Zmiana | Typ | Widoczna? | Dlaczego nie? |
|--------|-----|-----------|---------------|
| 36 tokenów CSS | Infrastruktura | NIE | Token remapping = identyczny kolor |
| 14 eventów analytics | Infrastruktura | NIE | console.debug only |
| Offline queue | Infrastruktura | NIE | Brak UI statusu |
| DraftContext | Infrastruktura | NIE | Wewnętrzny state management |
| OfferDraft interface | Infrastruktura | NIE | TypeScript types |
| Quick Mode page | Nowy ekran | TAK* | *Ale brak CTA z dashboardu |
| PDF prestige | Zmiana outputu | TAK* | *Ale wymaga wygenerowania PDF |
| Public offer | Istniejący ekran | TAK* | *Ale wymaga wysłanej oferty |
| Quick→Full panel | Nowy element | TAK* | *Ale wymaga przejścia Quick→Full |

---

## 7. SUPABASE / SCHEMA / MIGRATION REALITY

### 7.1 Schema match — kod vs. migracje

| Moduł | Tabela | Kod oczekuje | Migracja tworzy | Status |
|-------|--------|-------------|----------------|--------|
| Offers | `offers` | id, user_id, client_id, status, title, total_net, total_gross, currency | ✅ Zgodne | SCHEMA MATCH OK |
| Offer items | `offer_items` | FK do offers(id), variant_id nullable | ✅ Zgodne | SCHEMA MATCH OK |
| Offer variants | `offer_variants` | FK do user_id, offer_id | ✅ Zgodne | SCHEMA MATCH OK |
| Offer photos | `offer_photos` | show_in_public, photo_url | ✅ Zgodne | SCHEMA MATCH OK |
| Clients | `clients` | name, phone, email, user_id | ✅ Zgodne | SCHEMA MATCH OK |
| v2_projects | `v2_projects` | source_offer_id | ✅ Zgodne | SCHEMA MATCH OK |
| Acceptance links | `acceptance_links` | token, valid_until, offer_approval_id | ✅ Zgodne | SCHEMA MATCH OK |
| Quick draft (IDB) | N/A (IndexedDB) | OfferDraft interface | N/A | LOCAL ONLY |

### 7.2 Offline sync — schema compatibility

**Krytyczny test:** Czy `useOfflineSync` → `createMvpSyncProcessor` → upsert do `offers` zadziała?

```typescript
// Z useOfflineSync.ts:69-82
await supabase.from('offers').upsert({
  id: payload.draftId,        // crypto.randomUUID() → uuid ✅
  user_id: payload.draft.ownerUserId,  // z auth → musi = auth.uid() ✅
  client_id: null,             // nullable ✅
  status: 'draft',             // pasuje do CHECK ✅
  currency: 'PLN',             // text ✅
}, { onConflict: 'id' });
```

**Werdykt:** Schema jest kompatybilna. RLS wymaga `auth.uid() = user_id` — jeśli `ownerUserId` jest poprawnie ustawiony z auth context, upsert zadziała. Jedyne ryzyko: `id` z `crypto.randomUUID()` jest w formacie UUID v4 a tabela `offers` ma `id uuid PRIMARY KEY` — zgodne.

### 7.3 Tabele referencjonowane w kodzie ale potencjalnie nieistniejące na produkcji

| Tabela | Pierwsza migracja | Ryzyko |
|--------|-------------------|--------|
| `offers` | `20260301140000_pr09` | UNKNOWN — zależy od `supabase db push` |
| `offer_items` | `20260301160000_pr10` | UNKNOWN |
| `offer_variants` | `20260312...7RcU5` | UNKNOWN |
| `v2_projects` | `20260312...acceptance_bridge` | UNKNOWN |
| `acceptance_links` | `20260312...acceptance_bridge` | UNKNOWN |
| `offer_photos` | `20260312...offer_photos` | UNKNOWN |

**Wniosek:** Jeśli owner widzi "puste listy" lub errory na produkcji, PIERWSZA hipoteza to: **migracje nie zostały zaaplikowane**. Bez `supabase db push` tabele nie istnieją → frontend robi SELECT z nieistniejącej tabeli → pusty wynik lub 42P01 error (relation does not exist).

### 7.4 RLS — ocena bezpieczeństwa

| Wymiar | Status | Uwagi |
|--------|--------|-------|
| RLS na wszystkich tabelach | **PASS** | 54+ tabel z ENABLE ROW LEVEL SECURITY |
| User isolation | **PASS** | `auth.uid() = user_id` na CRUD |
| Org isolation | **PASS** | `is_org_member()`, `is_org_admin()` |
| Public token access | **PASS** | `validate_offer_token()` z expiry check |
| Service role w frontend | **PASS** | Nigdzie nie użyty — tylko anon key |
| Subscription updates | **PASS** | Tylko service_role (webhook handler) |

### 7.5 Environment config risks

| Variable | Wymagany przez | Bloker jeśli brak |
|----------|---------------|-------------------|
| `VITE_SUPABASE_URL` | Frontend | App się nie uruchomi |
| `VITE_SUPABASE_ANON_KEY` | Frontend | App się nie uruchomi |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Email, AI, Stripe nie zadziałają |
| `RESEND_API_KEY` | send-offer-email | Emaile nie wysyłane |
| `FRONTEND_URL` | Edge Functions | Linki w emailach broken |
| `OPENAI_API_KEY` lub alternatywa | AI features | AI chat/suggestions nie zadziałają |
| `STRIPE_SECRET_KEY` | create-checkout-session | Checkout nie zadziała |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | Subscription sync nie zadziała |

---

## 8. EVIDENCE GAPS — LUKI DOWODOWE

### 8.1 Co ma dowody

| Obszar | Screenshot | Unit test | Integracja |
|--------|-----------|----------|------------|
| Gate 0 tokens (dashboard) | TAK (4 pliki) | NIE | NIE |
| Gate 0 tokens (landing) | TAK (4 pliki w gate0-landing/) | NIE | NIE |

### 8.2 Co NIE ma dowodów

| Obszar | Brakuje | Priorytet |
|--------|---------|-----------|
| Quick Mode 390px | Screenshot mobile | WYSOKI |
| Quick→Full transition | Screenshot context panel | WYSOKI |
| PDF prestige (3 szablony) | Screenshot/PDF output | WYSOKI |
| Public offer page | Screenshot akceptacji | ŚREDNI |
| Send flow end-to-end | Runtime test | ŚREDNI |
| Offline sync round-trip | Runtime test | ŚREDNI |
| Mobile real device | Owner test report | WYSOKI |
| Dashboard po token migration | Porównanie before/after | NISKI |
| Stripe checkout | Runtime test | NISKI (blocked) |

### 8.3 Reguła §10.1 Before/After Proof Rule

Roadmapa wymaga: "Każda zmiana wizualna musi mieć screenshot before/after".

**Stan:** Tylko Gate 0 Condition 1 (tokens) ma screenshots. Reszta (Quick Mode, PDF, public offer, dashboard) — brak.

**Konsekwencja:** Formalnie żaden Gate nie może być zamknięty bez wizualnych dowodów. Ale to nie blokuje developmentu — blokuje jedynie formalne zamknięcie.

---

## 9. JEDEN REKOMENDOWANY NASTĘPNY KROK

### ⚠️ DECYZJA: Jedna akcja runtime/data — nie kosmetyczny PR

**Uzasadnienie:** Na podstawie audytu, główny bloker to **UNKNOWN state Supabase na produkcji**. Owner widzi "nic się nie zmieniło" potencjalnie dlatego, że:
1. Migracje nie zostały zaaplikowane → tabele nie istnieją → dane nie ładują się
2. Brak Stripe secrets → billing broken
3. Brak RESEND_API_KEY → emaile nie wysyłane

**Żaden PR kosmetyczny tego nie naprawi.**

---

### REKOMENDACJA: Supabase Reality Check — weryfikacja produkcji

**Co:** Owner musi zweryfikować stan produkcyjny Supabase:

**Krok 1 — Sprawdzenie migracji (5 min):**
W Supabase Dashboard → SQL Editor:
```sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```
Oczekiwany wynik: **54+ tabel**. Jeśli mniej — migracje nie zaaplikowane.

**Krok 2 — Sprawdzenie kluczowych tabel (2 min):**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('offers', 'offer_items', 'offer_variants', 'v2_projects', 'acceptance_links', 'offer_photos')
ORDER BY table_name;
```
Oczekiwany wynik: 6 wierszy. Jeśli brakuje — `supabase db push` konieczny.

**Krok 3 — Sprawdzenie secrets (3 min):**
W Supabase Dashboard → Edge Functions → Secrets sprawdzić czy istnieją:
- `RESEND_API_KEY`
- `FRONTEND_URL`
- `OPENAI_API_KEY` lub `ANTHROPIC_API_KEY` lub `GEMINI_API_KEY`

**Krok 4 — Jeśli migracje brakują:**
```bash
npx supabase db push
```

**Dlaczego ten krok PRZED czymkolwiek innym:**
- Jeśli tabele nie istnieją na produkcji, to **każdy PR jest niewidoczny** bo dane nie ładują się
- Żaden front-end fix nie pomoże jeśli backend nie ma schematów
- To wyjaśni czy problem ownera to "kod nie działa" czy "backend nie gotowy"

**Po tym kroku** będziemy wiedzieć czy:
- A) Migracje OK → problem jest w percepcji wizualnej → Prompt 2 (Design System Uplift)
- B) Migracje brakują → zaaplikować → owner zobaczy dane → re-ewaluacja

---

## 10. ANALIZA DODATKOWA — KWESTIE ODKRYTE PODCZAS AUDYTU

### 10.1 Dwie ścieżki tworzenia ofert — potencjalna konfuzja

W aplikacji istnieją **trzy** sposoby tworzenia oferty:
1. **Quick Mode** → `/app/quick-mode` → DraftContext → `/app/szybka-wycena`
2. **Offer Wizard** → `/app/oferta/nowa` → useOfferWizard → pełny formularz z krokami
3. **Quick Estimate** → `/app/szybka-wycena` (bezpośrednie wejście, bez Quick Mode)

Te ścieżki nie kolidują technicznie, ale owner/user może nie wiedzieć o Quick Mode bo:
- Dashboard nie ma CTA do Quick Mode
- Bottom nav nie prowadzi do Quick Mode
- Jedyny dostęp to URL lub redirect z `/quick-mode`

### 10.2 offers vs. offer_approvals — dwa systemy

Tabela `offers` (PR-09) i `offer_approvals` (pre-existing) to **dwa osobne systemy**:
- `offers` — nowy system statusów (DRAFT/SENT/ACCEPTED/REJECTED/ARCHIVED)
- `offer_approvals` — legacy system z public_token, accept_token, dual-token flow
- **NIE mają FK między sobą** (offer_approvals.offer_id nie istnieje)

To oznacza że oferta w `offers` i jej akceptacja w `offer_approvals` to osobne encje. Flow jest spójny bo `useSendOffer` operuje na `offer_approvals` (nie na `offers`), a `offers` służy do listowania drafts.

### 10.3 Type definitions drift

`src/integrations/supabase/types.ts` (auto-generated) ma **45 tabel** ale repo ma **53+ migracji** tworzących tabele. Kilka tabel nie ma typów TypeScript:
- `v2_projects` — używany w kodzie, ale referencja ad-hoc
- `acceptance_links` — dostęp przez RPC functions
- `stripe_events` — używany tylko w Edge Functions
- `subscription_events` — j.w.

To nie jest bloker bo te tabele są dostępne przez RPC functions lub Edge Functions, ale sugeruje że `types.ts` wymaga regeneracji (`supabase gen types typescript`).

### 10.4 GitHub Actions — Supabase Reality Check

W repo istnieje workflow `.github/workflows/` z Supabase Reality Check (PR #453, #454, #455). To automatyczny sprawdzacz schematów. Warto zweryfikować czy działa na produkcji.

---

## PODSUMOWANIE KOŃCOWE

| Wymiar | Ocena | Komentarz |
|--------|-------|-----------|
| **Kod / infrastruktura** | 8/10 | Solidne fundamenty, testy pass, typy czyste |
| **Widoczność dla usera** | 3/10 | Większość zmian niewidoczna, istniejące ekrany identyczne |
| **Supabase / data** | UNKNOWN | Nie da się ocenić bez weryfikacji produkcji |
| **Evidence / dowody** | 2/10 | Tylko 8 screenshots, brak runtime/device evidence |
| **Gotowość Etap 2** | **WARUNKOWA** | Gotowy technicznie, ale blokowany przez Supabase UNKNOWN |

---

*Raport wygenerowany na podstawie: analizy 100+ plików źródłowych, 53 migracji SQL, 19 Edge Functions, audytu E0+E1 z 2026-03-16, baseline z 2026-03-14, weryfikacji build (18.54s sukces) i testów (1366 passed, 0 failed). Żaden plik produkcyjny nie został zmodyfikowany.*
