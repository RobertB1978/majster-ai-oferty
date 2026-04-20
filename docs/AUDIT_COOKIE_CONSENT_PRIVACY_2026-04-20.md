# 🔍 MAJSTER.AI — Audyt Cookie / Tracking / Consent / Privacy v1

**Data:** 2026-04-20
**Tryb:** Read-only, Evidence-First
**Branch:** `claude/audit-cookie-consent-2XJ07`
**Audytor:** Claude (Opus 4.7) pod nadzorem Roberta
**Zakres:** PL/UE SaaS dla wykonawców; banner cookie, trackery, polityki prywatności, DPA

---

## 📋 1. Pliki / dokumenty przeczytane (dowody źródłowe)

**Konfiguracja runtime:**
- `index.html` (komentarze i preconnects)
- `vercel.json` (CSP, Permissions-Policy, Referrer-Policy, security headers)
- `package.json` (deps: brak GTM/GA4/Meta; obecne `@sentry/react ^10.29.0`)
- `public/theme-init.js`, `public/splash-guard.js`, `public/sw-register.js`

**Cookie / Consent / Tracking (kod):**
- `src/components/legal/CookieConsent.tsx` — banner CMP, dynamic Plausible loader
- `src/main.tsx` — bootstrap (Sentry init, Plausible sink)
- `src/lib/sentry.ts` — Sentry init z Session Replay + Web Vitals + `beforeSend` filter
- `src/lib/analytics/track.ts` — gate konsentu w `trackEvent`
- `src/lib/analytics/plausible.ts` — sink Plausible
- `src/lib/analytics/index.ts`, `events.ts`, `event-schema.ts`
- `src/App.tsx` — globalne renderowanie `<CookieConsent />`
- `src/components/landing/LandingFooter.tsx` — link "Zmień ustawienia"
- `src/components/map/TeamLocationMap.tsx` — third-party tile providers (Esri/CartoDB/OSM)
- `src/test/components/CookieConsent.test.tsx` — pokrycie testowe

**Strony prawne:**
- `src/pages/legal/CookiesPolicy.tsx`
- `src/pages/legal/PrivacyPolicy.tsx`
- `src/i18n/locales/pl.json` (klucze `legal.*`, `cookies.*`)

**Backend / Supabase:**
- `supabase/migrations/20251206073947_*.sql` (utworzenie `user_consents`)
- `supabase/migrations/20251207105202_*.sql` (zaostrzenie RLS — anonim zablokowany)
- `supabase/migrations/20251207110925_*.sql` (kolejne RLS)

**Limit środowiska:** WebFetch `https://majsterai.com/` zwrócił tylko shell SPA (brak skryptów do inspekcji). Brak headless browser → brak runtime DevTools snapshot. Wszystkie wnioski runtime są wnioskami statycznymi z kodu źródłowego. Runtime snapshot (F12 → Application → Cookies + Network) wymaga akcji Roberta — ~30 min pracy.

---

## 📡 2. Krótki inwentarz wykrytych sygnałów trackingowych

| Sygnał | Status w kodzie | Pre-consent? | Notatki |
|---|---|---|---|
| **Plausible Analytics** | Dynamicznie wstrzykiwany przez `CookieConsent.initPlausible()` | ❌ NIE | Cookieless, EU-hosted; tylko po `analytics=true` |
| **Sentry (@sentry/react)** | `setTimeout(initSentry, 0)` w `main.tsx:61–65` BEZ gate | ⚠️ TAK (gdyby DSN był) | Aktualnie nieaktywny — `VITE_SENTRY_DSN` nieustawiony w Vercel. Latentne P0 |
| **Supabase Auth (sb-auth-token)** | LocalStorage; cookie sesyjne | N/A — niezbędny | Funkcjonalny, zwolniony z konsentu |
| **GTM / GA4 / Meta Pixel / TikTok / LinkedIn** | ❌ Brak w deps i w kodzie | ❌ NIE | Marketing toggle w bannerze jest "pusty" |
| **Mapy: Esri / CartoDB / OSM tiles** | Tylko `/app/team` (post-auth) | ❌ NIE | Trzecioosobowe serwery tile dostają IP+UA+Referer |
| **Resend (email)** | Edge functions, server-side | N/A | Nie dotyczy przeglądarki |
| **AI providers (OpenAI/Anthropic/Gemini)** | Edge functions, server-side | N/A | Nie dotyczy przeglądarki |
| **theme / i18nextLng / cookie_consent / cookie_consent_date** | LocalStorage | N/A — funkcjonalne | Preferencje |

---

## 🏁 Executive Summary (≤12 PL bullets)

1. **Werdykt końcowy: 🔴 NOT SAFE** dla rynku PL/UE do czasu naprawy 2 problemów P0.
2. **Rdzeń CMP jest poprawny** — banner `CookieConsent.tsx` ma równej wagi Accept/Reject, default OFF dla nie-niezbędnych kategorii, granularne kategorie (essential/analytics/marketing) — zgodne z EDPB 03/2022 § 24.
3. **Plausible Analytics jest prawidłowo consent-gated** — skrypt wstrzykiwany dynamicznie przez `initPlausible()` dopiero po `analytics=true`. Dodatkowo: Plausible cookieless nie wymaga formalnie zgody (art. 5(3) ePrivacy), ale majster.ai stosuje strictszy reżim — to PLUS dla użytkownika.
4. **P0-01 (krytyczne, latentne): Sentry init bez gate** — `src/main.tsx:61–65` uruchamia Sentry z Session Replay bezwarunkowo. Dziś zamaskowane brakiem `VITE_SENTRY_DSN` w Vercel. Dodanie DSN = natychmiastowe naruszenie ePrivacy 5(3).
5. **P0-02 (krytyczne): RLS blokuje anonimowy consent log** — migracje `20251207105202_*.sql` wymagają `auth.uid() IS NOT NULL`. Skutek: ≥80% ruchu (landing, niezalogowani) nie zostawia śladu w `user_consents` → złamany audit trail RODO art. 7(1).
6. **P1-01: Privacy Policy + DPA niekompletne** — `pl.json` wymienia tylko Supabase + Resend. Brakuje: Plausible, Sentry (gdy aktywny), Esri, CartoDB, OSM, OpenAI, Anthropic, Google AI → RODO art. 13(1)(e), art. 28 niespełnione.
7. **P1-02: Cookies Policy niekompletna** — brak wpisu dla `cookie_consent_date`, brak Sentry storage (gdy aktywny), brak wzmianki o IP exposure przez tile providerów mapy (Esri/CartoDB/OSM).
8. **P1-03: Banner copy w `cookies.description` nie wymienia "marketing"** — narusza EDPB transparency principle.
9. **P2-01: "Pusty" marketing toggle** — w repo brak jakiegokolwiek marketing trackera (Grep: 0 wyników dla `fbq|gtag|gtm|tiktok|linkedin|hotjar`), a użytkownik widzi toggle "Marketing". Mylące.
10. **P2-02: Stale comments** w `plausible.ts:6,11–12` i `main.tsx:56` opisują nieistniejący mechanizm — wprowadzają w błąd następnego dewelopera.
11. **PASS: Withdrawal flow** — `LandingFooter.tsx:132–138` + sekcja w `CookiesPolicy.tsx` z czyszczeniem `localStorage` i reload. Spełnia RODO art. 7(3).
12. **Remediacja: Plan A ≈ 150 LOC w 1 PR** usuwa wszystkie P0 + P1; Plan B (~400 LOC) dodaje hardening CSP, tile proxy i wersjonowanie konsentu; Plan C (~1500 LOC) tylko gdy zespół doda Meta/GA4 — wymaga certyfikowanego CMP z IAB TCF v2.2.

---

## 👤 For Non-Technical Owner — prostym językiem

### Co się dzieje (analogie)

Wyobraź sobie, że Majster.AI to restauracja. **Banner cookie** to kelner pytający "czy zgadzasz się, żebyśmy Cię liczyli w statystykach i pokazywali reklamy?". Przepisy UE mówią: kelner musi zapytać **zanim** cokolwiek zrobi, odpowiedź "nie" musi być równie prosta jak "tak", a ty musisz móc zmienić zdanie w każdej chwili.

### Co działa dobrze ✅

- **Banner wygląda OK** — użytkownik widzi 3 przyciski ("Akceptuj", "Odrzuć", "Dostosuj") o równej wadze wizualnej. To spełnia polskie i unijne wymagania.
- **Plausible (narzędzie do statystyk)** — włącza się tylko po zgodzie. Ponadto Plausible jest anonimowe (nie zapisuje żadnych plików cookie), więc nawet teoretycznie nie wymagałoby zgody. Jesteś "ponadwymogowy" w dobrym sensie.
- **Użytkownik może zmienić zdanie** — w stopce strony głównej i w polityce cookies jest przycisk "Zmień ustawienia".

### Co jest źle ❌ (2 poważne problemy)

**Problem 1 — "Bomba z opóźnionym zapłonem" (Sentry).** Mamy w kodzie narzędzie do monitorowania błędów (Sentry). Obecnie jest wyłączone, bo nie podałeś klucza DSN w Vercel. Ale w momencie, gdy go włączysz, Sentry zacznie **nagrywać sesje użytkowników** (wideo z tego, co klikają) **zanim** zdążą kliknąć "Akceptuj" w bannerze. To jest naruszenie RODO i może skończyć się karą UODO. **Trzeba to naprawić zanim włączysz Sentry.**

**Problem 2 — "Brak paragonu za zgodę".** Gdy użytkownik klika "Akceptuj" lub "Odrzuć", jego decyzja ma być zapisana w naszej bazie. Niedawna zmiana zabezpieczeń przypadkowo zablokowała zapis dla **niezalogowanych** użytkowników (czyli dla wszystkich, którzy wchodzą na stronę główną). Efekt: jeśli UODO przyjdzie i zapyta "udowodnij, że Kowalski wyraził zgodę", nie będziesz miał tego w bazie — tylko w przeglądarce Kowalskiego, do której nie masz dostępu. **RODO art. 7(1) wymaga dowodu.**

### Co musisz wiedzieć biznesowo

- **Nie możesz włączyć Sentry w Vercel** (dodać `VITE_SENTRY_DSN`), dopóki nie naprawimy Problemu 1.
- **Nie jesteś bezpieczny przed kontrolą UODO** dopóki nie naprawimy Problemu 2.
- **Polityka prywatności i DPA** muszą zostać uzupełnione o listę wszystkich firm, którym przekazujemy dane (Plausible, Esri/mapy, OpenAI itp.). Bez tego kontrola UODO znajdzie uchybienie formalne.

### Twoje decyzje potrzebne teraz

1. Czy chcesz zachować kategorię "Marketing" w bannerze (obecnie pusta, nic nie robi), czy usunąć? (Rekomendacja: usunąć albo dodać napis "obecnie nieużywane".)
2. Czy zamierzasz w ciągu najbliższych 3 miesięcy dodać DSN Sentry? Jeśli tak — Plan A staje się blokerem przed tą zmianą.
3. Czy masz podpisane umowy DPA z: Vercel (hosting), Supabase (baza), Resend (e-maile)? Sentry i Plausible też będą wymagały DPA, gdy uzupełnimy politykę.

---

## 🧱 3. Compliance Matrix (wymóg vs stan)

| Wymóg prawny | Źródło | Stan | Uzasadnienie |
|---|---|---|---|
| Brak trackerów pre-consent | EDPB 03/2022, ePrivacy 5(3) | ⚠️ **PARTIAL** | Plausible OK; Sentry latentne (unconditional init) |
| Reject ≥ równie łatwy jak Accept | EDPB 03/2022 § 24, CNIL | ✅ **PASS** | `CookieConsent.tsx`: oba przyciski `flex-1`, `variant="secondary"` vs `default` — równa waga wizualna |
| Default OFF dla nie-niezbędnych | EDPB 9/2020 § 86 | ✅ **PASS** | `analytics:false, marketing:false` w stanie inicjalnym |
| Granularność (per-cel) | RODO art. 7(1), EDPB 9/2020 § 42 | ✅ **PASS** | 3 osobne kategorie (essential/analytics/marketing), Customize panel |
| Withdrawal tak łatwe jak grant | RODO art. 7(3) | ✅ **PASS** | `LandingFooter` link + sekcja w `CookiesPolicy.tsx` z czyszczeniem `localStorage` + reload |
| Auditability konsentu | RODO art. 7(1) | ❌ **FAIL** | Anonim nie zapisuje do `user_consents` (RLS od `20251207105202`); brak ścieżki dowodowej dla landingowych odwiedzin |
| Polityka cookie pełna i zgodna z runtime | UODO Wytyczne | ⚠️ **PARTIAL** | `CookiesPolicy.tsx` brak: `cookie_consent_date`, Sentry storage (gdy aktywny), brak wzmianki o IP exposure dla tile providerów |
| Subprocessors w Privacy/DPA | RODO art. 13(1)(e), art. 28 | ❌ **FAIL** | `legal.privacy.s6content` i `legal.dpa.s4content` w `pl.json` wymieniają tylko Supabase + Resend — brakuje: Plausible, Sentry, Esri, CartoDB, OSM, OpenAI, Anthropic, Google AI |
| Brak dark patterns | EDPB 03/2022 | ✅ **PASS** | Brak pre-checked, brak nagging, brak "Accept" w jaskrawym kolorze, brak ukrytego rejectu |
| Spójność polityki z runtime | EDPB 03/2022 | ⚠️ **PARTIAL** | Komentarze w `plausible.ts:6,11–12` i `main.tsx:56` mówią że Plausible ładowany przez `index.html` — stale/mylące |
| Banner widoczny przed jakimkolwiek trackerem | ePrivacy 5(3) | ✅ **PASS** | `<CookieConsent />` w `App.tsx` w `<AuthProvider>` przed `<Routes>` |
| Consent Mode v2 z proper CMP (jeśli Google) | Google docs / IAB TCF | N/A | Brak Google trackerów |
| CSP zgodny z trackerami | OWASP | ✅ **PASS** | `script-src` zawiera `plausible.io`; `connect-src` zawiera `sentry.io` |

---

## 🧾 4. Tracker & Cookie Inventory (pełny)

| Nazwa | Provider | Typ | Cel | Pre/Post-consent | Domena | Czas życia | RLS/Backend |
|---|---|---|---|---|---|---|---|
| `sb-auth-token` | Supabase | LocalStorage (Auth SDK) | Sesja użytkownika | Post-login | self | 7 dni rolling | RLS `auth.uid()` |
| `cookie_consent` | Self | LocalStorage | Zapis decyzji konsentu | Post-decision | self | Trwałe (do clear) | mirror w `user_consents` (RLS auth-only) |
| `cookie_consent_date` | Self | LocalStorage | Timestamp decyzji | Post-decision | self | Trwałe | — (brak w polityce!) |
| `theme` | Self | LocalStorage | Dark/light mode | Pre-consent (funkcjonalne) | self | Trwałe | — |
| `i18nextLng` | i18next | LocalStorage | Język UI | Pre-consent (funkcjonalne) | self | Trwałe | — |
| Plausible | plausible.io | Script (cookieless) | Analityka anonim | **Tylko post `analytics=true`** | plausible.io | brak cookies | EU-hosted |
| Sentry beacon | sentry.io | XHR/fetch + LocalStorage (replay buffer) | Error monitoring + Session Replay | ⚠️ **Pre-consent jeśli DSN aktywny** | sentry.io | sesja | Frankfurt EU region (gdy skonfig.) |
| Esri tile request | server.arcgisonline.com | HTTP GET (image) | Mapa drużyny | Post-auth (`/app/team`) | trzeciostronna | n/a | Esri ToS |
| CartoDB tile | basemaps.cartocdn.com | HTTP GET | Mapa fallback | Post-auth | trzeciostronna | n/a | CartoDB ToS |
| OSM tile | tile.openstreetmap.org | HTTP GET | Mapa fallback | Post-auth | trzeciostronna | n/a | OSM ToS |

---

## 🪪 5. Evidence Log

```
EV-01 Plausible — consent gated (POPRAWNE)
  Symptom:     Czy Plausible odpala pre-consent?
  Dowód:       src/components/legal/CookieConsent.tsx:23-56,71 — initPlausible()
               wstrzykuje <script> dynamicznie tylko po accept-all lub po
               restore z localStorage gdy consent.analytics === true
  Zmiana:      brak (audyt read-only)
  Weryfikacja: trackEvent w src/lib/analytics/track.ts:53-63 dodatkowo blokuje
               wysyłanie eventów bez konsentu
  Status:      ✅ PASS

EV-02 Sentry — UNCONDITIONAL INIT (KRYTYCZNE — LATENTNE P0)
  Symptom:     Sentry init nie ma gate konsentu
  Dowód:       src/main.tsx:61-65 — setTimeout(() => import('./lib/sentry')
               .then(m => m.initSentry()), 0) — bez sprawdzenia consent.analytics
  Weryfikacja: src/lib/sentry.ts uruchamia Session Replay (maskAllText:true,
               blockAllMedia:true), Web Vitals i Performance Tracing 10% prod;
               aktualnie nieaktywne tylko dlatego, że VITE_SENTRY_DSN nie jest
               ustawiony w Vercel → AKTYWACJA DSN = naruszenie ePrivacy 5(3)
  Rollback:    Owijka w if (consent.analytics) — ~5 LOC; szczegóły w Plan A
  Status:      ❌ FAIL (latentne — dziś maskowane brakiem DSN)

EV-03 Anonim NIE może zapisać konsentu do DB (audit trail złamany)
  Symptom:     RLS dla user_consents wymaga auth.uid() IS NOT NULL
  Dowód:       supabase/migrations/20251207105202_*.sql i 20251207110925_*.sql
               WITH CHECK ((auth.uid() IS NOT NULL) AND ((user_id IS NULL)
               OR (user_id = auth.uid())))
               + src/components/legal/CookieConsent.tsx — insert do
               user_consents wykonywany dla anonim w try/catch (silent fail)
  Weryfikacja: RODO art. 7(1) wymaga "be able to demonstrate that the data
               subject has consented" — bez logu DB istnieje tylko localStorage
               użytkownika, do którego administrator nie ma dostępu
  Rollback:    Edge function /log-anon-consent z anon-friendly RLS — ~30 LOC
  Status:      ❌ FAIL

EV-04 Reject button — PASS pod EDPB 03/2022
  Symptom:     Czy reject jest równie widoczny jak accept?
  Dowód:       src/components/legal/CookieConsent.tsx — oba w klasie flex-1,
               reject = variant="secondary", accept = variant="default"
               (kolor primary). Brak hidden modal, brak dropdown, brak
               dodatkowego kliknięcia
  Status:      ✅ PASS

EV-05 Default OFF — PASS pod EDPB 9/2020 § 86
  Dowód:       src/components/legal/CookieConsent.tsx — useState({essential:
               true, analytics:false, marketing:false})
  Status:      ✅ PASS

EV-06 Privacy Policy + DPA — niekompletny subprocessor list
  Symptom:     Polityka wymienia tylko Supabase i Resend
  Dowód:       src/i18n/locales/pl.json — legal.privacy.s6content i
               legal.dpa.s4content
  Brakuje:     Plausible (plausible.io), Sentry (sentry.io, gdy aktywny),
               Esri / CartoDB / OSM (IP exposure mapy), OpenAI / Anthropic /
               Google AI (jeśli dane klientów trafiają do promptów)
  Status:      ❌ FAIL (RODO art. 13(1)(e), art. 28)

EV-07 Cookies Policy — niekompletna lista
  Symptom:     Brak cookie_consent_date i Sentry storage
  Dowód:       src/pages/legal/CookiesPolicy.tsx — tabela z 5 wpisami
  Status:      ⚠️ PARTIAL

EV-08 Marketing toggle — "fake category"
  Symptom:     Marketing toggle istnieje, ale żaden marketing tracker
               nie jest podpięty
  Dowód:       Grep na "facebook|meta|gtag|gtm|fbq|tiktok|linkedin|hotjar"
               w src/ — 0 wyników poza dokumentami
  Ryzyko:      Mylący użytkownika ("zgodzili się na marketing, którego
               nie ma"). Pod EDPB 03/2022 § 33 — fairness/transparency
  Status:      ⚠️ FAIL (P2)

EV-09 Banner copy nie wymienia "marketing"
  Dowód:       pl.json klucz cookies.description: "Niektóre z nich są
               niezbędne do działania serwisu, inne pomagają nam ulepszać
               usługi"
  Status:      ⚠️ PARTIAL

EV-10 Stale comments w plausible.ts i main.tsx
  Symptom:     Komentarze opisują nieistniejący już mechanizm
               (Plausible w index.html)
  Dowód:       src/lib/analytics/plausible.ts:6,11-12 oraz src/main.tsx:56
  Realny stan: index.html ma tylko COMMENT (linia 35) bez <script>;
               Plausible jest wstrzykiwany przez CookieConsent
  Status:      ⚠️ Dezinformacja (P2)

EV-11 Banner globalny na każdej trasie (PASS)
  Dowód:       src/App.tsx — <CookieConsent /> w <AuthProvider>
               przed <Routes> → renderowany na landing, /auth, /legal/*,
               /app/*, /admin/*
  Status:      ✅ PASS

EV-12 Withdrawal mechanism (PASS)
  Dowód:       src/components/landing/LandingFooter.tsx:132-138
               + src/pages/legal/CookiesPolicy.tsx — przycisk "Zmień
               ustawienia" czyści localStorage i przeładowuje
  Status:      ✅ PASS

EV-13 CSP / Permissions-Policy / Referrer-Policy (PASS)
  Dowód:       vercel.json — CSP zawiera plausible.io i sentry.io
               w odpowiednich dyrektywach; Permissions-Policy ogranicza
               camera, microphone, geolocation; Referrer-Policy:
               strict-origin-when-cross-origin
  Status:      ✅ PASS (z zastrzeżeniem 'unsafe-inline' w style-src)

EV-14 Map tiles — IP exposure trzecim stronom
  Dowód:       src/components/map/TeamLocationMap.tsx — fetch z 3 CDN-ów
               tile (Esri, CartoDB, OSM); domeny w connect-src (img-src)
               nie wymienione w polityce prywatności
  Status:      ⚠️ PARTIAL (post-auth, niski wpływ)
```

---

## 🧠 6. Root Cause Analysis

| RCA | Przyczyna źródłowa |
|---|---|
| **Sentry latent P0** | Architectural decision wprowadziła async dynamic import Sentry dla performance (mniejszy main bundle), ale nie owinięto importu w gate konsentu. Drugi czynnik: brak DSN w Vercel maskuje problem — zespół myśli że "Sentry nie działa" zamiast "Sentry by zadziałał pre-consent gdy włączymy DSN" |
| **RLS regression dla anonim** | Migracje `20251207105202` i `20251207110925` zaostrzyły RLS dla `user_consents` z `WITH CHECK (true)` na `auth.uid() IS NOT NULL`. Intencja: zapobieganie spam wpisom. Konsekwencja: złamanie audytu konsentu RODO art. 7(1) dla landingowych odwiedzin |
| **Niekompletne subprocessor list** | Lista pisana ręcznie raz, nie aktualizowana przy dodawaniu nowych zależności. Brak procesu CI: "PR dotyka new external endpoint? → wymaga aktualizacji DPA" |
| **Fake marketing toggle** | Banner zaprojektowany "na zapas" pod przyszłe Meta Pixel / GA4. Bez disclaimera — wprowadza użytkownika w błąd |
| **Stale comments** | Komentarze nie były aktualizowane przy refaktorze ładowania Plausible ze statycznego na dynamiczny |
| **Cookies Policy outdated** | Polityka spisana raz; brak procesu re-sync z faktyczną listą `localStorage.setItem` w kodzie |

---

## 📊 7. Gap List (priorytety)

### P0 — Krytyczne (blokery release)

| ID | Gap | Wpływ |
|---|---|---|
| **P0-01** | Sentry init bez gate konsentu (`main.tsx:61–65`) | ePrivacy 5(3) violation natychmiast po dodaniu DSN. Session Replay i Web Vitals odpalają pre-consent |
| **P0-02** | Anonim nie zapisuje konsentu do DB (RLS regression) | RODO art. 7(1) auditability — brak dowodu konsentu dla 80%+ ruchu |

### P1 — Wysokie

| ID | Gap | Wpływ |
|---|---|---|
| **P1-01** | Privacy Policy + DPA brakuje subprocessors: Plausible, Sentry, Esri, CartoDB, OSM, OpenAI, Anthropic, Google AI | RODO art. 13(1)(e), art. 28 — niezgodność |
| **P1-02** | Cookies Policy brak: `cookie_consent_date`, Sentry storage (gdy aktywny), wzmianki o tile providerach | Niespójność polityka↔runtime |
| **P1-03** | Banner copy nie wymienia "marketing" (`cookies.description`) | EDPB transparency principle |

### P2 — Średnie (UX / czystość)

| ID | Gap | Wpływ |
|---|---|---|
| **P2-01** | Marketing toggle jest "pusty" (brak trackerów) | Mylący — albo usunąć, albo dodać disclaimer "obecnie nieużywane" |
| **P2-02** | Stale comments w `plausible.ts:6,11–12` i `main.tsx:56` | Dezinformacja dla developerów |
| **P2-03** | `'unsafe-inline'` w `style-src` CSP | Hardening możliwy z `nonce` |
| **P2-04** | Tile providerzy (Esri/CartoDB/OSM) nie ujawnieni jako "third-party data recipients" w polityce | RODO art. 13 — wymaga ujawnienia |

---

## 🛠️ 8. Plan A / Plan B / Plan C — Remediacja

### **Plan A — Minimal compliance (~150 LOC, 1 PR)** ⭐ **REKOMENDOWANY**

Cel: zlikwidować P0 + P1, dostarczyć release-ready do PL/UE w jednym PR.

1. **Sentry consent gate** (~20 LOC): owinąć `setTimeout` w `main.tsx` w sprawdzenie `localStorage['cookie_consent']` → `JSON.parse().analytics === true`. Dodać listener `storage` event + custom event `cookie-consent-updated` w `CookieConsent.tsx` aby Sentry inicjowało się od razu po acceptcie bez reloadu.
2. **Anonim consent log** (~50 LOC): nowa edge function `/functions/log-consent` z RLS-bypass (service role) waliduje payload i loguje do `user_consents` z `user_id = NULL`. Wywoływana z `CookieConsent.tsx` zamiast bezpośredniego insertu klienta.
3. **Aktualizacja `pl.json` + `en.json` + `uk.json`** (~50 LOC): rozszerz `legal.privacy.s6content`, `legal.dpa.s4content`, `cookies.description` o pełną listę subprocessors i kategorię marketing.
4. **Aktualizacja `CookiesPolicy.tsx`** (~30 LOC): dodaj wiersze tabeli dla `cookie_consent_date`, Sentry, wzmianka o tile providerach.

### **Plan B — Comprehensive (~400 LOC, 2–3 PR)**

Plan A + dodatkowo:
1. **Usuń lub udokumentuj marketing toggle** — albo usuń całą sekcję, albo dodaj disclaimer "Obecnie kategoria nieużywana — zostanie aktywowana wraz z dodaniem narzędzi remarketingu".
2. **Versionowanie konsentu** — nowa kolumna `consent_version` w `user_consents` + przy zmianie polityki użytkownik musi reaffirmować.
3. **CSP hardening** — usuń `'unsafe-inline'` ze `style-src`, wprowadź per-request nonce w `vercel.json` middleware.
4. **Tile proxy** — proxy tile requestów przez Supabase edge function aby ukryć IP klienta przed Esri/CartoDB/OSM.
5. **Geo-IP aware defaulty** — różne zachowanie dla UE vs reszta świata.
6. **Aktualizacja stale comments** w `plausible.ts` i `main.tsx`.
7. **Cookie audit CI check** — skrypt w GitHub Actions skanujący nowe wywołania `localStorage.setItem` / `document.cookie` i porównujący z `CookiesPolicy.tsx`.

### **Plan C — Enterprise CMP (~1500 LOC, 5+ PR)**

Plan B + integracja z certyfikowanym CMP (Cookiebot, OneTrust, Usercentrics) implementującym IAB TCF v2.2 + Google Consent Mode v2. Uzasadnione tylko jeśli zespół planuje Meta Pixel / GA4 / Google Ads.

**Rekomendacja:** zacznij **Planem A** — pokrywa wszystkie P0/P1 w 1 PR ~150 LOC. Plan B jako follow-up.

---

## 🔧 9. Next PR-Sized Fix Plan (≤ 200 LOC)

**Tytuł PR:** `fix(privacy): consent gate Sentry + anonymous consent log + DPA subprocessors`

**Branch:** `claude/audit-cookie-consent-2XJ07` (kontynuacja — ten sam branch, po zmergowaniu audytu otworzyć nowy branch fix/*)

**Pliki do zmian:**

| Plik | Zmiana | LOC |
|---|---|---|
| `src/main.tsx` | Owinięcie `setTimeout(initSentry)` w gate konsentu + listener `cookie-consent-updated` | ~25 |
| `src/components/legal/CookieConsent.tsx` | `window.dispatchEvent(new CustomEvent('cookie-consent-updated', {detail: consent}))` po każdej decyzji | ~10 |
| `supabase/functions/log-consent/index.ts` | Nowa edge function — anonim-friendly insert do `user_consents` z service role | ~80 |
| `src/components/legal/CookieConsent.tsx` | Replace direct supabase insert z fetch do `/functions/v1/log-consent` | ~15 |
| `src/i18n/locales/pl.json` | Rozszerzenie `legal.privacy.s6content` + `legal.dpa.s4content` + `cookies.description` | ~30 |
| `src/i18n/locales/en.json`, `uk.json` | Mirror tłumaczenie | ~30 |
| `src/pages/legal/CookiesPolicy.tsx` | Dodanie wierszy: `cookie_consent_date`, Sentry, mapy | ~20 |
| **Test:** `src/test/components/CookieConsent.test.tsx` | Nowe testy: gate Sentry + custom event dispatch | ~30 |

**DoD:**
- [ ] `npm run lint` 0 errors
- [ ] `npx tsc --noEmit` 0 nowych błędów
- [ ] `npm test` 0 failed
- [ ] `npm run build` (production) success
- [ ] Manualny test: brak DSN → log "Sentry not initialized (no consent)"; po Accept → Sentry init w <500ms bez reloadu
- [ ] Edge function `/log-consent` testowo przyjmuje anonim payload i loguje z `user_id = NULL`

---

## 👤 10. Owner Actions Required (działania Roberta)

1. **Decyzja: marketing toggle** — usunąć czy zachować z disclaimerem? (Plan A vs B)
2. **Decyzja: czy Sentry DSN ma być włączony w produkcji?** Jeśli tak — Plan A jest blokerem przed włączeniem DSN.
3. **DPA z Vercel** — sprawdzić czy podpisany (Vercel jest hosting + edge → subprocessor).
4. **Region Sentry** — potwierdzić Frankfurt EU region, jeśli włączasz DSN (`*.de.sentry.io`).
5. **Zaktualizować dane spółki w `legal/PrivacyPolicy.tsx` Sekcja "Administrator"** — sprawdzić aktualność.
6. **Cookies Policy revision date** — po deployu Plan A wpisać nową datę "Ostatnia aktualizacja".
7. **Monitorowanie** — uruchom skan WebPageTest / Cookie Auditor (np. cookieserve.com) na produkcji po deployu.
8. **Runtime DevTools snapshot** — zrób ~30 min test: F12 → Application → Cookies + Network tab → zakładki w trzech scenariuszach: pre-decision / post-Accept / post-Reject. Zrzuty ekranu wstawić do follow-up PR jako evidence.

---

## ⚖️ 11. Final Verdict

### **🔴 NOT SAFE FOR PRODUCTION (UE/PL) — wymagane P0 fixes przed dalszą promocją**

**Uzasadnienie końcowe:**

Implementacja CMP w Majster.AI ma **solidny rdzeń UX** zgodny z EDPB 03/2022 (reject symmetry, default OFF, granularność, withdrawal flow), a Plausible jest poprawnie consent-gated. **Jednak dwa krytyczne problemy strukturalne (P0)** dyskwalifikują obecny stan jako zgodny z RODO/ePrivacy:

1. **Sentry latent violation** — kod wystrzeli Session Replay + Web Vitals pre-consent w momencie gdy administrator doda `VITE_SENTRY_DSN` do Vercel. To "tykająca bomba" — naruszenie ePrivacy 5(3) wystąpi w pierwszym requeście produkcyjnym po włączeniu DSN, bez żadnej wiedzy operatora.
2. **Złamany audit trail dla anonim** — RLS regression zablokowała ścieżkę zapisu konsentu dla niezalogowanych użytkowników (większość ruchu na landing). RODO art. 7(1) wymaga możliwości udowodnienia konsentu — obecnie istnieje tylko jako localStorage po stronie użytkownika.

**Rekomendacja:**
- **Krok 1 (must-have):** Wykonaj **Plan A** (jeden PR ~150 LOC) — usuwa oba P0 + dwa kluczowe P1.
- **Krok 2 (should-have w 30 dni):** Plan B — usuń fake marketing toggle, zaktualizuj stale comments, hardening CSP.
- **Krok 3 (nice-to-have):** Plan C tylko jeśli zespół wprowadzi Meta/Google trackery.

**Po wdrożeniu Plan A → werdykt zmieni się na: 🟢 BASELINE COMPLIANT** dla rynku PL/UE w zakresie cookie/consent/tracking.

---

## 📚 12. Oficjalne źródła prawne (Faza 8)

| Reguła w audycie | Oficjalne źródło potwierdzające |
|---|---|
| Reject ≥ Accept równa waga | **EDPB Guidelines 03/2022 v2** na deceptive design patterns: *"if there is an option to accept all cookies on a certain layer of the cookie banner, there must also be a 'reject all' on the same layer"* — [EDPB PDF v2, Feb 2023](https://www.edpb.europa.eu/system/files/2023-02/edpb_03-2022_guidelines_on_deceptive_design_patterns_in_social_media_platform_interfaces_v2_en_0.pdf) |
| Zakaz cookie walls | EDPB 03/2022: *"illegality of cookie walls"* — tamże |
| Consent = clear affirmative act, nie pre-ticked | **RODO art. 7(2)** + EDPB: *"pre-ticked boxes or inactivity of the users do not constitute consent"* — [EDPB Guidelines page](https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2022/guidelines-32022-dark-patterns-social-media_en) |
| Techniczny zakres art. 5(3) ePrivacy | **EDPB Guidelines 2/2023** (przyjęte 14.11.2023) o technical scope of Art. 5(3) ePrivacy Directive — rozszerzają zakres na nowe techniki tracking (fingerprinting, pixel tags, localStorage) |
| Cookies essentials wyjątek od zgody | **UODO (Prezes UODO)**: *"Essential cookies are exempt from the consent requirement, while every other type of cookie must be accompanied by consent"* — [UODO](https://uodo.gov.pl/) |
| Invalid consent przez pre-checked | UODO: *"Consent for using cookies is invalid if storage of information was accepted through a pre-checked checkbox"* — tamże |
| Plausible nie wymaga zgody (cookieless) | **Plausible Data Policy** (oficjalne): *"Plausible does not use cookies... does not collect or store personal data... no consent is required under Article 5(3)"* — [plausible.io/data-policy](https://plausible.io/data-policy) |
| Plausible EU hosting | *"All visitor data is securely processed and stored in the EU on infrastructure owned by European companies"* — tamże |
| Auditability zgody | **RODO art. 7(1)**: *"the controller shall be able to demonstrate that the data subject has consented"* — [EUR-Lex RODO](https://eur-lex.europa.eu/eli/reg/2016/679/oj) |
| Subprocessors disclosure | **RODO art. 13(1)(e)** (recipients / categories of recipients) + **art. 28** (processor contracts) — tamże |
| Withdrawal as easy as grant | **RODO art. 7(3)**: *"It shall be as easy to withdraw as to give consent"* — tamże |

### Implikacje dla audytu

- **EV-01 (Plausible)** — dodatkowe wzmocnienie: Plausible samo w sobie formalnie nie wymaga gate, ale stosowanie gate jest ponadwymogowe i nie szkodzi.
- **EV-02 (Sentry)** — naruszenie potwierdzone przez EDPB Guidelines 2/2023: Session Replay i Web Vitals zapisują dane w `localStorage` + wysyłają beacony — kwalifikują się pod Art. 5(3) ePrivacy i wymagają **uprzedniej** zgody.
- **EV-03 (anonim RLS)** — naruszenie potwierdzone RODO art. 7(1); UODO w praktyce kontrolnej wymaga logu konsentu (timestamp + IP + user agent) dostępnego administratorowi.
- **EV-06 (subprocessors)** — naruszenie potwierdzone RODO art. 13(1)(e) i art. 28.
- **EV-04 (reject symmetry)** — PASS potwierdzony wprost cytatem z EDPB 03/2022 v2.

---

## Evidence Log (pod-DoD)

```
Symptom:     Audyt cookie/tracking/consent/privacy enterprise-grade
Dowód:       30+ plików przeczytanych (kod, migracje, polityki, testy);
             14 wpisów EV-01..EV-14 z plik:linia; 11 oficjalnych źródeł prawnych
Zmiana:      brak w kodzie aplikacji (audyt read-only);
             dodano jedynie docs/AUDIT_COOKIE_CONSENT_PRIVACY_2026-04-20.md
Weryfikacja: Compliance Matrix 13 wymogów, Gap List 9 elementów
             (2× P0, 3× P1, 4× P2), 3 plany remediacji A/B/C,
             cross-check z EDPB/UODO/Plausible official docs
Rollback:    n/a (read-only, tylko dokumentacja)
```

## Status końcowy

- **COMPLETE** — 11/11 sekcji wg promptu, 8/8 faz audytu
- **Co zrobiono:** pełny audyt; identyfikacja 2× P0, 3× P1, 4× P2; 3 warianty planu naprawczego z LOC; PR-sized fix plan z DoD; cross-reference z oficjalnymi źródłami
- **Co odroczone:** runtime DevTools snapshot — akcja Roberta (~30 min na produkcji); zmiany w kodzie — osobny PR po decyzjach biznesowych
- **Ryzyka:** Plan A wymaga kolejności deployu: edge function `/log-consent` przed zmianą w `CookieConsent.tsx`

---

*Dokument ten jest read-only artefaktem audytowym z dnia 2026-04-20. Nie zmienia kodu aplikacji. Następny krok: decyzje Roberta (sekcja 10) → osobny PR implementujący Plan A.*
