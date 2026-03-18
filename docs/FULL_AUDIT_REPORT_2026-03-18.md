# PEŁNY AUDYT APLIKACJI MAJSTER.AI

**Data audytu:** 18 marca 2026
**Wersja:** 0.1.0-alpha
**Audytor:** Claude Code (Opus 4.6)

---

## SPIS TREŚCI

1. [Podsumowanie wykonawcze](#1-podsumowanie-wykonawcze)
2. [Audyt kodu aplikacji](#2-audyt-kodu-aplikacji)
3. [Audyt Supabase (backend)](#3-audyt-supabase-backend)
4. [Audyt Vercel (deployment)](#4-audyt-vercel-deployment)
5. [Audyt GitHub (repozytorium)](#5-audyt-github-repozytorium)
6. [Audyt bezpieczeństwa](#6-audyt-bezpieczeństwa)
7. [Audyt SEO](#7-audyt-seo)
8. [Audyt polityk prawnych i RODO](#8-audyt-polityk-prawnych-i-rodo)
9. [Audyt tekstów i grafik](#9-audyt-tekstów-i-grafik)
10. [Analiza biznesowa i rynkowa](#10-analiza-biznesowa-i-rynkowa)
11. [Analiza SWOT](#11-analiza-swot)
12. [Plan rozwoju aplikacji](#12-plan-rozwoju-aplikacji)
13. [Podsumowanie ocen](#13-podsumowanie-ocen)

---

## 1. PODSUMOWANIE WYKONAWCZE

### Ogólna ocena: 8.2/10 — Aplikacja na poziomie produkcyjnym

Majster.AI to zaawansowana platforma SaaS dla profesjonalistów budowlanych w Polsce. Aplikacja jest **technicznie dojrzała**, z solidną architekturą, kompleksowymi zabezpieczeniami i bogatym zestawem funkcji. Główne wnioski:

| Obszar | Ocena | Status |
|--------|-------|--------|
| Kod i architektura | **9/10** | Doskonała jakość kodu, TypeScript strict |
| Supabase (backend) | **9/10** | 53 tabele z RLS, 20 Edge Functions |
| Vercel (deployment) | **8.8/10** | Produkcyjne headery bezpieczeństwa |
| GitHub (repozytorium) | **7.5/10** | 50 commitów, 1366 testów, 4 podatności npm |
| Bezpieczeństwo | **8/10** | Silne RLS, CSP, HSTS; 1 krytyczna podatność jsPDF |
| SEO | **7/10** | Solidna baza, brakuje optymalizacji obrazów |
| Polityki prawne | **8/10** | Pełne RODO, DPA, cookies; drobne luki |
| Teksty i grafiki | **7/10** | 3 języki, brak WebP, brak OG image 1200x630 |
| Biznes i rynek | **8.5/10** | Ogromna szansa rynkowa, brak konkurencji |

### Co działa świetnie
- 500 plików TypeScript, 215 komponentów, 72 hooki
- 18 dojrzałych funkcji biznesowych (oferty, projekty, dokumenty, kalendarz, AI)
- 100% tabel z Row Level Security
- 3 języki (PL, EN, UK) z parytetem tłumaczeń
- PWA + Capacitor (gotowość mobilna)
- Offline-first z kolejką synchronizacji

### Co wymaga natychmiastowej naprawy
1. **KRYTYCZNE:** Podatność jsPDF (HTML injection) — `npm audit fix`
2. **WYSOKIE:** Limity planów tylko po stronie klienta (brak server-side enforcement)
3. **WYSOKIE:** Główny bundle 930 KB (283 KB gzip) — za duży

---

## 2. AUDYT KODU APLIKACJI

### 2.1 Statystyki kodu

| Metryka | Wartość |
|---------|---------|
| Pliki TypeScript/TSX | 500 |
| Komponenty React | 215 |
| Strony/trasy | 63 strony, 70+ tras |
| Custom hooki | 72 |
| Biblioteki/utility | 53 |
| Pliki testowe | 90 |
| Testy | 1 366 (wszystkie przechodzą) |
| Migracje Supabase | 49 |
| Edge Functions | 20 |
| Linie kodu | ~70 114 |

### 2.2 Jakość komponentów

**TypeScript Strict Mode:** ✅ Pełna konfiguracja
- `strict: true`, `noImplicitAny`, `strictNullChecks`, `noUnusedParameters`, `noUnusedLocals`

**Wzorce kodu:**
- ✅ Wyłącznie komponenty funkcyjne
- ✅ Hooki przestrzegają konwencji nazewnictwa (`useXxx`)
- ✅ Destrukturyzacja props w sygnaturze funkcji
- ✅ Jeden komponent na plik
- ✅ Kolokacja testów
- ✅ 38 instancji memoizacji (React.memo, useMemo)
- ✅ 306+ atrybutów ARIA (dostępność)

### 2.3 Routing i strony

**Strefy aplikacji:**

| Strefa | Liczba tras | Opis |
|--------|-------------|------|
| Publiczne | ~15 | Landing, auth, oferty publiczne, prawne |
| Aplikacja klienta | 30+ | Dashboard, oferty, projekty, dokumenty, kalendarz |
| Admin | 12 | Zarządzanie użytkownikami, systemem, treścią |
| Przekierowania legacy | 10+ | Zachowanie starych linków |

### 2.4 Status funkcji

| Funkcja | Pliki | Dojrzałość | Uwagi |
|---------|-------|------------|-------|
| Oferty (wizard, zatwierdzanie, PDF) | 16 | ✅ Enterprise | Pełny pipeline akceptacji |
| Projekty V2 | Hooks + strony | ✅ Enterprise | Publiczny status, dossier |
| Dokumenty | 10 | ✅ Zaawansowany | Szablony, dossier, inspekcje |
| Billing/Subskrypcje | 10 | ✅ Kompletny | Stripe, trial, paywall |
| Kalendarz | 10 | ✅ Zaawansowany | Miesiąc/tydzień/dzień/Gantt |
| Quick Estimate | 7 | ✅ Kompletny | Drafty, walidacja |
| Zdjęcia | 4+ | ✅ Kompletny | EXIF, kompresja, batch |
| AI (chat, wyceny, OCR) | Edge Functions | ✅ Zaimplementowany | OpenAI/Anthropic/Gemini |
| Finanse | 2 | ⚠️ Podstawowy | Wymaga rozbudowy |
| Marketplace | 1 | ⚠️ Minimalny | Tylko karta podwykonawcy |

### 2.5 Wydajność

**Code splitting:** 8+ manualnych chunków (react, ui, supabase, forms, charts, framer, leaflet, pdf)

| Chunk | Rozmiar (raw) | Rozmiar (gzip) |
|-------|--------------|----------------|
| index (główny) | 930 KB | 283 KB |
| charts-vendor | 420 KB | 113 KB |
| pdf-vendor | 418 KB | 136 KB |
| html2canvas | 201 KB | 47 KB |
| supabase-vendor | 177 KB | 45 KB |
| react-vendor | 165 KB | 54 KB |

**⚠️ Problem:** Główny bundle (930 KB / 283 KB gzip) jest za duży. Powinien być < 200 KB gzip.

### 2.6 Dostępność (a11y)

- ✅ Radix UI (WCAG 2.1 compliant) jako baza
- ✅ 306+ atrybutów ARIA
- ✅ Nawigacja klawiaturowa
- ✅ Semantyczny HTML
- ⚠️ Brak weryfikacji kontrastu kolorów
- ⚠️ Brak zautomatyzowanych testów screen reader

### 2.7 PWA i Mobile

- ✅ Capacitor 7.4 (iOS + Android)
- ✅ Service Worker z auto-rejestracją
- ✅ Offline Queue (IndexedDB, batch sync)
- ✅ Push notifications
- ✅ Biometric auth (hook)
- ✅ Bottom navigation (mobile-first shell)
- ✅ FAB (Floating Action Button)
- ⚠️ InstallPrompt ma zahardkodowany tekst PL (brak i18n)

---

## 3. AUDYT SUPABASE (BACKEND)

### 3.1 Migracje

| Metryka | Wartość |
|---------|---------|
| Liczba migracji | 49 |
| Okres rozwoju | Grudzień 2025 — Marzec 2026 (~3.5 miesiąca) |
| Jakość | Doskonała — komentarze, idempotentność, triggery |

### 3.2 Row Level Security (RLS)

**✅ 53 tabele z włączonym RLS — 100% pokrycia danych użytkowników**

Wzorce polityk:
- SELECT: `auth.uid() = user_id` (lub organizacyjne dla zespołów)
- INSERT: `WITH CHECK (auth.uid() = user_id)`
- UPDATE: `USING` i `WITH CHECK` weryfikują własność
- DELETE: `USING (auth.uid() = user_id)`

**Kluczowe zabezpieczenia:**
- `user_subscriptions` — tylko odczyt dla użytkowników (zapisy wyłącznie przez Edge Functions)
- `admin_system_settings` — dostęp tylko dla admin/owner
- Izolacja organizacji — użytkownicy widzą tylko dane swojej firmy

### 3.3 Edge Functions

| Funkcja | JWT | Walidacja | Rate Limit | Jakość |
|---------|-----|-----------|------------|--------|
| send-offer-email | ✅ | Zod + combineValidations | 10/min | Doskonała |
| ai-quote-suggestions | ✅ | Pełna sanityzacja | 30/min | Doskonała |
| approve-offer | ❌ (token) | UUID + lifecycle | 30/min | Doskonała |
| stripe-webhook | ❌ (sygnatura) | Weryfikacja sygnatury | — | Doskonała |
| delete-user-account | ✅ | RODO Art. 17 | 3/godz. | Doskonała |
| ai-chat-agent | ✅ | Rate limit | 20/min | Dobra |
| public-api | ❌ (API key) | Format + RLS | 100/min | Doskonała |
| healthcheck | ❌ | — | — | Prosta |

### 3.4 Shared Utilities

- `validation.ts` — 17 walidatorów (email, UUID, string, array, number, date)
- `sanitization.ts` — XSS prevention, AI output cleaning
- `rate-limiter.ts` — per-endpoint limity z bazą danych
- `ai-provider.ts` — abstrakcja OpenAI/Anthropic/Gemini
- `moderation.ts` — moderacja treści

### 3.5 Schemat bazy danych

```
OFERTY:     offers → offer_items, offer_variants, offer_photos, offer_approvals, offer_sends
PROJEKTY:   projects → quotes, quote_versions, project_photos, project_costs, calendar_events
PROJEKTY V2: v2_projects → checklists, dossier_items, inspections, warranties, reminders
KLIENCI:    clients → subcontractors
BILLING:    user_subscriptions, stripe_events, subscription_events, user_addons, plan_limits
ORGANIZACJE: organizations → organization_members
ADMIN:      admin_system_settings, admin_theme_config, admin_audit_log
```

### 3.6 Problemy Supabase

1. **⚠️ Race condition w rate limiter** — check-then-increment nie jest atomowy. Użyć `FOR UPDATE` lub atomic increment.
2. **⚠️ Dual offer system** — legacy (offer_approvals) i nowy (offers) działają równolegle. Akceptowalne na etapie migracji.

---

## 4. AUDYT VERCEL (DEPLOYMENT)

### 4.1 Konfiguracja

| Element | Status | Ocena |
|---------|--------|-------|
| Build command | `npm ci && npm run build` | ✅ Deterministyczny |
| Output directory | `dist` | ✅ Poprawny |
| SPA routing | Rewrite `/(.*) → /index.html` | ✅ Poprawny |
| Cache control | no-cache dla index.html, version.json, sw | ✅ Inteligentny |

### 4.2 Nagłówki bezpieczeństwa

| Nagłówek | Wartość | Ocena |
|----------|---------|-------|
| X-Frame-Options | DENY | ✅ Krytyczny |
| X-Content-Type-Options | nosniff | ✅ Wysoki |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | ✅ Krytyczny |
| Content-Security-Policy | Kompletna polityka (patrz poniżej) | ✅ Krytyczny |
| Cross-Origin-Opener-Policy | same-origin | ✅ Wysoki |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | ✅ Średni |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ Średni |

**CSP:**
```
default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://unpkg.com;
style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com
https://api.anthropic.com https://generativelanguage.googleapis.com https://sentry.io;
object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests
```

### 4.3 Build performance

- Czas budowania: 13.73 sekundy
- Sourcemapy: hidden w produkcji (Sentry upload)
- Bundle analysis: dostępny (`ANALYZE_BUNDLE=true`)
- Version endpoint: `/version.json` z metadanymi buildu

### 4.4 Problemy Vercel

1. **⚠️ robots.txt — zahardkodowana domena** (`majsterai.com` zamiast zmiennej środowiskowej)
2. **⚠️ style-src 'unsafe-inline'** — wymagane przez Tailwind, ale mniej bezpieczne

---

## 5. AUDYT GITHUB (REPOZYTORIUM)

### 5.1 Statystyki Git

| Metryka | Wartość |
|---------|---------|
| Commitów | 50 |
| Kontrybutorów | 1 (RobertB1978) |
| Okres rozwoju | 5 dni (12-17.03.2026) |
| Średnio commitów/dzień | ~10 |
| Gałęzie | master (local), main (remote) |

### 5.2 Zależności

| Kategoria | Liczba |
|-----------|--------|
| Produkcyjne | 70 |
| DevDependencies | 28 |
| Razem w package.json | 98 |
| Pakiety w node_modules | 499 |
| Rozmiar node_modules | 543 MB |

### 5.3 Podatności npm

| Pakiet | Ważność | Problem | Naprawialny |
|--------|---------|---------|-------------|
| **jsPDF ≤4.2.0** | 🔴 KRYTYCZNY | HTML injection + PDF object injection | ✅ npm audit fix |
| minimatch ≤3.1.3 | 🟠 WYSOKI | ReDoS | ✅ npm audit fix |
| flatted <3.4.0 | 🟠 WYSOKI | Unbounded recursion DoS | ✅ npm audit fix |
| ajv <6.14.0 | 🟡 ŚREDNI | ReDoS | ✅ npm audit fix |

### 5.4 Przestarzałe pakiety (major versions)

| Pakiet | Obecna | Najnowsza |
|--------|--------|-----------|
| React | 18.3.1 | 19.2.4 |
| @hookform/resolvers | 3.10.0 | 5.2.2 |
| framer-motion | 11.18.2 | 12.38.0 |
| date-fns | 3.6.0 | 4.1.0 |
| Capacitor | 7.x | 8.x |
| lucide-react | 0.462.0 | 0.577.0 |

### 5.5 Testy

| Metryka | Wartość |
|---------|---------|
| Pliki testowe | 93 |
| Testy razem | 1 366 zdanych, 5 pominięte |
| Czas wykonania | 44.80 sekund |
| Pliki E2E | 7 (Playwright) |
| Pokrycie plikami | ~22% (90 testów / 403 pliki źródłowe) |

### 5.6 Problemy GitHub

1. **⚠️ Niezgodność nazwy gałęzi** — local `master` vs remote `main`
2. **⚠️ Źle umieszczone zależności** — `@capacitor/cli`, `@types/leaflet`, `@types/qrcode` powinny być w devDependencies

---

## 6. AUDYT BEZPIECZEŃSTWA

### 6.1 Ocena ogólna: MODERATE-to-HIGH (z naprawami → LOW)

### 6.2 Wyniki szczegółowe

| Obszar | Ocena | Uwagi |
|--------|-------|-------|
| Autentykacja | ✅ SILNA | Supabase Auth, OAuth2, JWT, weryfikacja email |
| Autoryzacja/RLS | ✅ DOSKONAŁA | 53 tabele z RLS, izolacja organizacji |
| Walidacja inputów | ✅ DOSKONAŁA | Zod + 17 walidatorów server-side |
| Ochrona XSS | ✅ DOSKONAŁA | React auto-escape, sanityzacja, CSP |
| Sekrety/env vars | ✅ DOSKONAŁA | VITE_ prefix, brak service_role w frontend |
| Rate limiting | ✅ DOBRY | Per-endpoint limity, minor race condition |
| Logowanie | ✅ DOSKONAŁE | PII masking, Sentry bez danych wrażliwych |
| RODO | ✅ ZAIMPLEMENTOWANE | Pełne kasowanie konta, audit trail |

### 6.3 Krytyczne znaleziska

#### 🔴 FINDING #1: Podatność jsPDF (KRYTYCZNA)
- **Problem:** HTML injection i PDF object injection w jsPDF ≤4.2.0
- **Wpływ:** Możliwość wstrzyknięcia kodu w generowane PDF-y
- **Naprawa:** `npm audit fix` (aktualizacja do 4.2.1)
- **Priorytet:** NATYCHMIASTOWY

#### 🔴 FINDING #2: Limity planów tylko client-side (WYSOKI)
- **Problem:** Plan limits (free: 3 projekty, pro: 15) egzekwowane TYLKO w frontend
- **Wpływ:** Użytkownik może ominąć limity przez bezpośrednie zapytania API
- **Naprawa:** Dodać server-side validation w Edge Functions lub database triggers
- **Priorytet:** PRZED LAUNCH

#### 🟡 FINDING #3: Rate limiter fail-open (ŚREDNI)
- **Problem:** Gdy baza danych niedostępna, rate limiter przepuszcza wszystkie zapytania
- **Naprawa:** Zmienić na fail-closed (odrzucaj gdy DB unavailable)

#### 🟡 FINDING #4: dangerouslySetInnerHTML w chart (NISKI)
- **Problem:** Użycie w chart-internal.tsx dla CSS
- **Ryzyko:** Minimalne — dane z konfiguracji aplikacji, nie od użytkownika

### 6.4 Zgodność ze standardami

| Standard | Status |
|----------|--------|
| OWASP Top 10 | ✅ SILNA — ochrona XSS, CSRF, SQLi |
| RODO Art. 17 (prawo do usunięcia) | ✅ ZAIMPLEMENTOWANE |
| PCI DSS | ⚠️ CZĘŚCIOWA — Stripe, brak przechowywania kart |
| WCAG 2.1 Level AA | ⚠️ CZĘŚCIOWA — wymaga testów runtime |

---

## 7. AUDYT SEO

### 7.1 Ocena: 7/10

### 7.2 Mocne strony

- ✅ Kompletne meta tagi (title, description, viewport, author)
- ✅ Open Graph (title, description, image, type, URL, locale)
- ✅ Twitter Card
- ✅ Keywords (25+ fraz branżowych)
- ✅ Komponent SEOHead.tsx z react-helmet-async
- ✅ Structured Data (JSON-LD): WebApplication, Organization, SoftwareApplication, FAQPage
- ✅ sitemap.xml (11 URL-i, hreflang dla pl/en/uk)
- ✅ robots.txt (Googlebot, Bingbot, Twitterbot, Facebook reguły)
- ✅ Crawl-delay: 1s
- ✅ Hierarchia nagłówków (H1 → H2 → H3) prawidłowa
- ✅ Lazy loading tras (code splitting)
- ✅ Pre-loaded fonty (self-hosted)

### 7.3 Problemy

1. **⚠️ Brak alt text na obrazach** — 0 atrybutów alt znalezionych w landing
2. **⚠️ Brak formatów WebP/AVIF** — tylko PNG
3. **⚠️ Niezgodność theme-color** — index.html: #9b5208, SEOHead: #4f46e5
4. **⚠️ OG image 512x512** — powinien być 1200x630 dla social shares
5. **⚠️ Incomplete structured data** — brak AggregateRating, szczegółów cenowych

### 7.4 Rekomendacje SEO

| Priorytet | Akcja | Wysiłek |
|-----------|-------|---------|
| 🔴 Wysoki | Dodać alt text do wszystkich obrazów | 2-4h |
| 🔴 Wysoki | Naprawić niezgodność theme-color | 15 min |
| 🔴 Wysoki | Stworzyć OG image 1200x630 | 30 min |
| 🟡 Średni | Konwersja PNG → WebP | 1-2h |
| 🟡 Średni | Rozszerzyć structured data (AggregateRating, LocalBusiness) | 2-3h |
| 🟢 Niski | Dodać screenshots do PWA manifest | 1h |

---

## 8. AUDYT POLITYK PRAWNYCH I RODO

### 8.1 Ocena: 8/10

### 8.2 Zaimplementowane dokumenty

| Dokument | Ścieżka | Status |
|----------|---------|--------|
| Polityka prywatności | `/legal/privacy` | ✅ Art. 13/14 RODO |
| Regulamin | `/legal/terms` | ✅ Kompletny |
| Polityka cookies | `/legal/cookies` | ✅ 6 cookies udokumentowanych |
| Umowa powierzenia (DPA) | `/legal/dpa` | ✅ Art. 28 RODO |
| Centrum RODO | `/legal/gdpr` | ✅ Prawa podmiotów danych |
| Cookie Consent Banner | Komponent | ✅ Granularne zgody |

**Wszystkie dokumenty w 3 językach:** PL, EN, UK

### 8.3 Cookie Consent

- ✅ Wymagana jawna zgoda przed analytics/marketing
- ✅ Essential cookies zawsze włączone (nie można wyłączyć)
- ✅ Granularne kontrolki (toggle per kategoria)
- ✅ "Accept All" / "Essential Only" szybkie akcje
- ✅ Linki do polityki prywatności i regulaminu
- ✅ Persystencja w localStorage + baza danych

### 8.4 DPA (Umowa powierzenia)

- ✅ Zgodna z Art. 28 RODO
- ✅ Zabezpieczenia: TLS 1.3, AES-256, RBAC, RLS
- ✅ Podprocesorzy: Supabase + SCC, Resend + SCC
- ✅ 72h powiadomienie o naruszeniu
- ✅ 30-dniowe kopie zapasowe

### 8.5 Centrum RODO

- ✅ Art. 15: Prawo dostępu
- ✅ Art. 16: Prawo do sprostowania
- ✅ Art. 20: Prawo do przenoszenia (eksport JSON)
- ✅ Art. 17: Prawo do usunięcia (z potwierdzeniem)

### 8.6 Problemy prawne

1. **⚠️ Brak mechanizmu wycofania zgody cookies** — po akceptacji nie ma sposobu na zmianę ustawień
2. **⚠️ Niekompletna lista podprocesorów** — brak Sentry, analytics providers
3. **⚠️ Niejasna polityka retencji danych** — brak harmonogramu per typ danych
4. **⚠️ Brak adresu pocztowego** — tylko email, Art. 13 może wymagać adresu siedziby
5. **⚠️ Eksport danych (portability)** — JSON export może nie obejmować plików PDF/zdjęć

---

## 9. AUDYT TEKSTÓW I GRAFIK

### 9.1 Tłumaczenia

| Język | Plik | Linie | Sekcje | Status |
|-------|------|-------|--------|--------|
| 🇵🇱 Polski | pl.json | 5 088 | 114 | ✅ Kompletny |
| 🇬🇧 Angielski | en.json | 5 088 | 114 | ✅ Kompletny |
| 🇺🇦 Ukraiński | uk.json | 5 088 | 114 | ✅ Kompletny (wymaga review) |

- ✅ CI check parytet tłumaczeń (`npm run check:i18n`)
- ✅ CI check hardkodowanych tekstów PL (`npm run check:no-hardcoded-polish`)
- ✅ Brak hardkodowanych stringów w komponentach (translation keys)
- ⚠️ InstallPrompt (PWA) ma zahardkodowany tekst PL

### 9.2 Grafiki i zasoby

| Zasób | Rozmiar | Status |
|-------|---------|--------|
| favicon.svg | 508 B | ✅ Lekki, skalowalny |
| favicon.ico | 20 KB | ✅ Legacy support |
| icon-192.png | 7.4 KB | ✅ PWA (maskable) |
| icon-512.png | 12 KB | ✅ PWA (maskable) |
| placeholder.svg | 3.2 KB | ✅ Fallback |
| Fonty (Bricolage, JetBrains) | woff2 | ✅ Preloaded |

### 9.3 Problemy grafik

1. **⚠️ Brak WebP/AVIF** — tylko PNG
2. **⚠️ Brak logo w public/** — prawdopodobnie inline SVG
3. **⚠️ Brak screenshots w manifest.json** — pusta tablica
4. **⚠️ Brak splash screens iOS**
5. **⚠️ OG image za mały** (512x512, powinien 1200x630)
6. **⚠️ Brak dark mode ikony** w PWA manifest

---

## 10. ANALIZA BIZNESOWA I RYNKOWA

### 10.1 Wielkość rynku

| Metryka | Wartość |
|---------|---------|
| Wartość rynku budowlanego PL | 350+ mld PLN (54 mld EUR w 2026) |
| Prognoza wzrostu | CAGR 4.1% do 2030 |
| Firmy budowlane w PL | ~437 000 |
| Mikroprzedsiębiorstwa (do 9 os.) | ~419 000 (95.9%) |
| **Adresowalny rynek (TAM)** | **~434 000 firm** |

### 10.2 Konkurencja

**Bezpośrednia konkurencja: BRAK** ✅

| Konkurent | Typ | Model | Cena | Zagrożenie |
|-----------|-----|-------|------|-----------|
| Fixly.pl | Marketplace | Pay-per-lead | 119-948 PLN | Niskie (inna kategoria) |
| Oferteo.pl | Marketplace | Pay-per-lead | 200 pkt = 948 PLN | Niskie (inna kategoria) |
| Norma Pro/Zuzia | Kosztorysowanie | Desktop license | Drogie | Niskie (przestarzałe) |
| Buildertrend | Zarządzanie | Subskrypcja | $299-900/mies. | Brak w PL |
| Jobber | Zarządzanie | Subskrypcja | $49-199/mies. | Brak w PL |

**Kluczowy wniosek:** Żadna platforma na polskim rynku nie łączy AI-powered wycen z zarządzaniem biznesem budowlanym. To unikalna pozycja.

### 10.3 Koszty infrastruktury

| Skala | 100 użytk. | 1 000 użytk. | 10 000 użytk. |
|-------|-----------|-------------|--------------|
| Supabase | $25 | $50-75 | $200-400 |
| Vercel | $20 | $20-40 | $60-100 |
| AI API (Gemini) | ~$2-5 | ~$20-50 | ~$200-500 |
| Email (Resend) | $0 | $20 | $100 |
| **RAZEM** | **~250 PLN** | **~500-800 PLN** | **~2 300-4 500 PLN** |
| **Per user** | ~2.50 PLN | ~0.50-0.80 PLN | ~0.23-0.45 PLN |

### 10.4 Rekomendowany model cenowy

| Plan | Cena/mies. | Funkcje |
|------|-----------|---------|
| Darmowy | 0 PLN | 3 wyceny/mies., 1 projekt |
| Starter | 49 PLN | 20 wycen, 10 projektów, PDF |
| Professional | 99 PLN | Bez limitów, AI chat, zespół 3 os. |
| Business | 199 PLN | Wszystko + marketplace, API, priorytet |

### 10.5 Projekcje przychodowe

| Okres | Płatni użytkownicy | MRR (PLN) | ARR (PLN) |
|-------|-------------------|-----------|-----------|
| Q4 2026 | 200 | 17 800 | 213 600 |
| Q2 2027 | 500 | 44 500 | 534 000 |
| Q4 2027 | 1 500 | 133 500 | 1 602 000 |
| Q4 2028 | 3 000 | 267 000 | 3 204 000 |

### 10.6 Punkt rentowności

- Szacowane koszty operacyjne: ~50 000 PLN/mies. (z zespołem 2-3 osobowym)
- ARPU: 89 PLN/mies.
- **Break-even: ~562 płatnych użytkowników**
- **Szacowany czas: 12-18 miesięcy od launchu**

### 10.7 Rekomendowane kanały marketingowe

| Kanał | Priorytet | Uzasadnienie |
|-------|----------|-------------|
| Facebook Groups | 🔴 NAJWYŻSZY | Wykonawcy są w grupach budowlanych |
| YouTube | 🟠 WYSOKI | Tutoriale, porównania, demo |
| Google Ads | 🟠 WYSOKI | "Kosztorys budowlany", "program dla wykonawcy" |
| SEO / Content | 🟠 WYSOKI | Blog, kalkulatory online |
| Hurtownie budowlane | 🟡 ŚREDNI | Partnerstwa, ulotki, QR |
| Targi (BUDMA) | 🟡 ŚREDNI | Networking, demo |
| TikTok/Reels | 🟡 ŚREDNI | "Przed i po", tipy |

---

## 11. ANALIZA SWOT

### Mocne strony (Strengths)
1. **Unikalna pozycja rynkowa** — brak polskiego konkurenta w kategorii "AI business management dla wykonawców"
2. **Niskie koszty operacyjne** — stack Supabase + Vercel + Gemini minimalizuje wydatki
3. **AI jako wyróżnik** — generowanie wycen przez AI to funkcja, której nikt nie oferuje w PL
4. **Pełna lokalizacja** — polski interfejs, prawo, dokumenty PDF, 3 języki
5. **Mobile-first** — Capacitor + PWA, offline queue
6. **Kompleksowe rozwiązanie** — od wyceny po fakturę w jednym miejscu
7. **Silne zabezpieczenia** — RLS 100%, CSP, HSTS, walidacja input/output
8. **Solidna baza testowa** — 1 366 testów, CI checks

### Słabe strony (Weaknesses)
1. **Wczesna faza** — brak bazy użytkowników i referencji
2. **Jednoosobowy zespół** — ograniczone zasoby
3. **Zależność od dostawców** — Supabase, Vercel, OpenAI/Google
4. **Brak integracji z polskimi systemami** — JPK, KSeF, iFirma, Fakturownia
5. **Marketplace minimalny** — tylko 1 komponent
6. **Finanse podstawowe** — 2 komponenty, wymaga rozbudowy
7. **Bundle za duży** — 283 KB gzip główny chunk

### Szanse (Opportunities)
1. **437 000 firm budowlanych** w PL, większość niezdigitalizowanych
2. **Fundusze UE (KPO)** — dotacje na cyfryzację MSP
3. **Rosnący rynek** — CAGR 4-5% w budownictwie
4. **Obowiązkowe KSeF** — zmusi firmy do cyfryzacji
5. **Ekspansja regionalna** — Czechy, Słowacja, kraje bałtyckie
6. **Partnerstwa** z hurtowniami budowlanymi
7. **Program poleceń** — word-of-mouth w branży

### Zagrożenia (Threats)
1. **Fixly/Oferteo** mogą dodać funkcje zarządzania
2. **Globalni gracze** (Houzz Pro, Jobber) mogą wejść na rynek PL
3. **Niska adopcja technologii** w branży — długi cykl edukacji
4. **Sezonowość budownictwa** — niższe przychody zimą
5. **Regulacje AI** (AI Act UE) mogą zwiększyć koszty compliance
6. **Wzrost cen API AI** — choć trend jest odwrotny

---

## 12. PLAN ROZWOJU APLIKACJI

### 12.1 Faza 1: Pre-launch (NATYCHMIASTOWE — przed uruchomieniem)

| # | Zadanie | Priorytet | Wysiłek |
|---|---------|-----------|---------|
| 1 | `npm audit fix` — naprawić 4 podatności (szczególnie jsPDF) | 🔴 KRYTYCZNY | 1h |
| 2 | Server-side plan enforcement (triggers/Edge Functions) | 🔴 KRYTYCZNY | 4-8h |
| 3 | Naprawić theme-color mismatch (SEOHead vs index.html) | 🔴 WYSOKI | 15 min |
| 4 | Stworzyć OG image 1200x630 dla social shares | 🔴 WYSOKI | 30 min |
| 5 | Dodać alt text do wszystkich obrazów | 🔴 WYSOKI | 2-4h |
| 6 | Rate limiter → fail-closed | 🟡 ŚREDNI | 1h |
| 7 | Przenieść @capacitor/cli i @types/* do devDependencies | 🟡 ŚREDNI | 15 min |

### 12.2 Faza 2: Launch (Q2 2026)

| # | Zadanie | Opis |
|---|---------|------|
| 1 | Soft launch z beta testerami | 50 wykonawców budowlanych |
| 2 | Landing page optimization | A/B testy, CTA, social proof |
| 3 | Darmowy kalkulator kosztów remontu | SEO magnet dla ruchu organicznego |
| 4 | Facebook Ads + grupy budowlane | Pierwszy kanał pozyskania |
| 5 | Feedback loop | Zbieranie opinii, iteracja UX |

### 12.3 Faza 3: Wzrost (Q3-Q4 2026)

| # | Funkcja | Opis |
|---|---------|------|
| 1 | **Integracja KSeF** | Krajowy System e-Faktur — obowiązkowy w PL |
| 2 | **Rozbudowa Marketplace** | Profil firmy, portfolio, oceny, wyszukiwanie |
| 3 | **Rozbudowa Finansów** | Raporty P&L, cash flow, prognozowanie |
| 4 | **Integracja z programami księgowymi** | iFirma, Fakturownia, wFirma |
| 5 | **Program poleceń** | Darmowy miesiąc za polecenie |
| 6 | **Optymalizacja bundle** | Redukcja głównego chunk < 200 KB gzip |
| 7 | **Konwersja grafik na WebP** | Mniejsze ikony i obrazy |
| 8 | **Cookie Preference Center** | Link w stopce do zarządzania zgodami |

### 12.4 Faza 4: Skalowanie (2027)

| # | Funkcja | Opis |
|---|---------|------|
| 1 | **Integracja z hurtowniami** | Cenniki materiałów real-time (np. Castorama, Leroy Merlin) |
| 2 | **Moduł kosztorysowania zaawansowany** | KNR, KNNR, bazy cennikowe |
| 3 | **Raporty i analityka zaawansowana** | Business Intelligence, trendy |
| 4 | **Asystent AI v2** | Analiza rentowności projektów, predykcje |
| 5 | **Moduł zespołowy zaawansowany** | Harmonogramy, śledzenie czasu pracy |
| 6 | **Aplikacja mobilna natywna** | Publikacja iOS App Store + Google Play |
| 7 | **Integracje zewnętrzne** | Google Calendar, Microsoft 365, Slack |
| 8 | **API dla partnerów** | Otwarcie platformy dla integratorów |

### 12.5 Faza 5: Ekspansja (2028+)

| # | Inicjatywa | Opis |
|---|-----------|------|
| 1 | **Wejście na rynki CZ/SK** | Lokalizacja czeska/słowacka |
| 2 | **Kraje bałtyckie** | LT, LV, EE |
| 3 | **Moduł ubezpieczeń** | Partnerstwa z ubezpieczycielami budowlanymi |
| 4 | **Szkolenia online** | Platforma edukacyjna dla wykonawców |
| 5 | **AI Copilot** | Pełny asystent biznesowy AI |

### 12.6 Brakujące funkcje (roadmap)

Na podstawie analizy rynku i konkurencji, aplikacja powinna dodać:

| Funkcja | Priorytet | Uzasadnienie |
|---------|-----------|-------------|
| **Integracja KSeF** | 🔴 Krytyczny | Obowiązkowe w PL, brak = brak rynku |
| **Zaawansowany marketplace** | 🔴 Wysoki | Główne źródło wartości dla użytkowników |
| **Integracje księgowe** | 🔴 Wysoki | iFirma, Fakturownia — eliminacja podwójnego wpisu |
| **Moduł kosztorysowania KNR** | 🟠 Wysoki | Standard branżowy w PL |
| **Chat z klientem** | 🟡 Średni | Komunikacja bez wychodzenia z aplikacji |
| **Automatyczne follow-upy** | 🟡 Średni | Email/SMS przypomnienia po wysłaniu oferty |
| **Śledzenie czasu pracy** | 🟡 Średni | Rozliczenie z klientem, tracking kosztów |
| **Galeria realizacji** | 🟡 Średni | Portfolio online dla wykonawcy |
| **CRM zaawansowany** | 🟢 Niski | Pipeline sprzedażowy, scoring klientów |
| **Integracja bankowa (Open Banking)** | 🟢 Niski | Automatyczne rozliczenia |
| **Moduł gwarancyjny z powiadomieniami** | 🟢 Niski | Automatyczne przypomnienia o przeglądach |

---

## 13. PODSUMOWANIE OCEN

### Tabela końcowa

| Obszar | Ocena | Komentarz |
|--------|-------|-----------|
| **Architektura kodu** | 9/10 | Enterprise-grade, TypeScript strict, 72 hooki |
| **Komponenty React** | 9/10 | 215 komponentów, shadcn/ui, Radix UI |
| **Backend (Supabase)** | 9/10 | 53 tabele z RLS, 20 Edge Functions |
| **Deployment (Vercel)** | 8.8/10 | Pełne security headers, CSP, HSTS |
| **Bezpieczeństwo** | 8/10 | Silne, 1 krytyczna podatność do naprawy |
| **Testy** | 7.5/10 | 1 366 testów, 22% pokrycie plików |
| **SEO** | 7/10 | Solidna baza, brak optymalizacji grafik |
| **Polityki prawne** | 8/10 | Pełne RODO, DPA, cookies; drobne luki |
| **i18n** | 8.5/10 | 3 języki, parytet, CI checks |
| **UX/UI** | 8/10 | Mobile-first, PWA, offline; marketplace minimalny |
| **Wydajność** | 7/10 | Dobry code splitting, za duży main bundle |
| **Pozycja rynkowa** | 9/10 | Brak konkurencji w PL, ogromny TAM |
| **Potencjał biznesowy** | 8.5/10 | Break-even ~562 użytk., marża brutto ~97% |
| **ŚREDNIA WAŻONA** | **8.2/10** | **Produkcyjnie gotowa, wymaga drobnych napraw** |

### Czy to się opłaca? ✅ TAK

**Argumenty za kontynuacją:**
1. **Rynek 437 000 firm** bez dedykowanego narzędzia
2. **Koszty infrastruktury < 1 PLN/user/miesiąc**
3. **Break-even przy 562 płatnych użytkownikach** (0.13% rynku!)
4. **Marża brutto ~97%** (typowa dla SaaS)
5. **Brak bezpośredniej konkurencji** w kategorii
6. **AI jako unikalna wartość** — nikt tego nie oferuje w PL
7. **KSeF zmusi firmy do cyfryzacji** — okno szansy

**Ryzyka do zarządzania:**
1. Edukacja rynku (niska adopcja tech w branży)
2. Jednoosobowy zespół (skalowanie wymaga ludzi)
3. Zależność od Supabase/Vercel/AI providers

### Końcowa rekomendacja

**Aplikacja jest na etapie alpha (0.1.0-alpha) z jakością kodu na poziomie produkcyjnym.** Technicznie jest gotowa do soft-launch po naprawie 2 krytycznych problemów (jsPDF i server-side plan enforcement). Biznesowo ma unikalne pozycjonowanie na ogromnym, niezagospodarowanym rynku. Rekomendacja: **KONTYNUOWAĆ ROZWÓJ** z naciskiem na integrację KSeF i budowę marketplace jako kluczowe funkcje wzrostu.

---

*Raport wygenerowany: 18 marca 2026*
*Narzędzie: Claude Code (Opus 4.6)*
*Repozytorium: majster-ai-oferty*
*Branch: claude/app-audit-compliance-liXVW*
