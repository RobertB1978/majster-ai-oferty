> ⚠️ **ARCHIWUM — NIE AKTUALIZOWAĆ**
> Ten dokument zawiera historyczną analizę produktową i propozycje transformacji (Marzec 2026).
> **Źródłem prawdy dla kolejności prac i zakresu jest [`docs/ROADMAP.md`](./ROADMAP.md) (v5, 2026-03-01).**
> Twierdzenie poniżej „jedynym źródłem prawdy dla całego programu" jest **nieaktualne** — patrz [ADR-0000](./ADR/ADR-0000-source-of-truth.md).

# MAJSTER.AI — Ultra Enterprise Product Transformation Program

## Dokument sterujący v1.0 FINAL — REPO-READY ~~[ŹRÓDŁO PRAWDY]~~ [ARCHIWUM]

**Marzec 2026 · React + Vite + TypeScript + Supabase + Vercel**

> ~~**Ten dokument jest jedynym źródłem prawdy dla całego programu.**~~
> **KOREKTA:** Źródłem prawdy jest `docs/ROADMAP.md` (v5). Ten dokument jest archiwum analitycznym.
> Poprzednie wersje (v2.3, v2.4, v2.5) są archiwum.
> Ścieżka w repo: `docs/ULTRA_ENTERPRISE_ROADMAP.md`

---

## CEL PROGRAMU

Transformacja Majster.AI z "poprawnego SaaS" w "najlepszy produkt dla fachowców w Polsce".
Wizualnie, systemowo, funkcjonalnie, klientowo i operacyjnie — bez migracji frameworka.

---

## 0. Core Value Flow — fundament wszystkich decyzji

> **Najważniejsza sekcja dokumentu.**
> Każda zmiana w produkcie musi być oceniana relative do tego przepływu. Jeśli zmiana nie redukuje kroków, decyzji lub tarcia — nie jest P0.

### 0.1 Jak fachowiec dziś robi ofertę — User Replacement Reality

| # | Co robi fachowiec | Narzędzie dziś | Problem / tarcie |
|---|---|---|---|
| 1 | Dostaje zapytanie od klienta | Telefon, WhatsApp, SMS | Dane są rozproszone |
| 2 | Jedzie na wizję lokalną | Oczy, miarka, aparat | Zdjęcia w galerii, notatki na kartce |
| 3 | Zapisuje co widzi | Kartka, kalendarz, notatnik telefonu | Brak struktury — brak kontekstu do starych zdjęć |
| 4 | Pyta klienta o dokumentację | Telefon / WhatsApp ponownie | Czeka, musi pamiętać że czeka |
| 5 | Sprawdza czy jest kosztorys inwestorski | Rozmowa / e-mail | Jeśli nie ma — wycenia od zera |
| 6 | Zbiera wytyczne klienta | Rozmowa, e-mail, WhatsApp | Wytyczne w 3 miejscach, łatwo pominąć |
| 7 | Siada do wyceny wieczorem w domu | Excel, kartka, pamięć | Przepisuje z kartki/telefonu — żmudne |
| 8 | Wysyła wycenę | E-mail z PDF lub zdjęciem ekranu | Nie wie czy klient otworzył |
| 9 | Czeka na odpowiedź klienta | Telefon, WhatsApp | Brak formalnej ścieżki akceptacji |

> **Kluczowy wniosek:** Fachowiec nie robi wyceny. Fachowiec ZBIERA DANE z kilku miejsc, a wycena to ostatni krok. Majster.AI wygrywa tym że zbiera wszystko w jedno miejsce zanim liczenie się zaczyna.

### 0.2 Prawdziwy Core Value Flow

| Krok | Majster.AI zastępuje | Engineering filter | Tryb |
|---|---|---|---|
| 1 | Zbieranie danych z terenu (zdjęcia, notatki, wymiary) | Szybki zapis jedną ręką, offline-safe | Quick Mode |
| 2 | Powiązanie z klientem i zleceniem | Wybór klienta w 1 kroku lub dodanie w 2 polach | Quick Mode |
| 3 | Checklist pytań do klienta (dokumentacja? kosztorys? wytyczne?) | Strukturalne pytania zamiast chaotycznej rozmowy | Quick Mode |
| 4 | Agregacja wszystkich danych w jeden draft | Draft zapisany automatycznie, offline-safe | Quick → Full |
| 5 | Wycena pozycji z zebranych danych | Pozycje, ilości, ceny, VAT, warianty | Full Mode |
| 6 | Generowanie PDF | Dziś: jsPDF browser-side prestige generation. Docelowo: server-side milestone po Etapie 2 (sekcja 26). | Full Mode |
| 7 | Wysyłka do klienta z linkiem śledzenia | Publiczny link, klient nie musi mieć konta | Full Mode |
| 8 | Formalna akceptacja lub prośba o zmiany | Przycisk akceptacji, zmiana statusu, potwierdzenie | Public Client View |

### 0.3 Engineering Filter — jedyne kryterium P0

| ZMIANA JEST P0 JEŚLI REDUKUJE | ZMIANA JEST DEKORACYJNA JEŚLI TYLKO |
|---|---|
| Liczbę kroków do wysłanego PDF | Wygląda lepiej wizualnie |
| Liczbę decyzji których wymaga | Ma więcej animacji |
| Liczbę przełączeń kontekstu | Pasuje do design systemu |
| Liczbę miejsc gdzie dane mogą zaginąć | Konkurencja tak robi |
| Ryzyko że fachowiec powie "zrobię to wieczorem" | "Fajnie by było mieć" |

### 0.4 Quick Mode — definicja i zasady architektoniczne

**Czym jest Quick Mode:**
- Schowek terenowy: zdjęcia + notatka + checklist + klient — w 60 sekund jedną ręką
- Draft zapisywany automatycznie offline
- Przejście do Full Mode bez restartu i bez utraty danych
- Wspólny model danych — ten sam draft, ten sam URL, ten sam PDF

**Quick Mode Expansion Rule:**
- Użytkownik może przejść Quick→Full w dowolnym momencie
- Żadne dane nie giną — formularz rozszerza się, nie restartuje
- draft_id pozostaje ten sam przed i po rozszerzeniu
- Full Mode = Quick Mode + dodatkowe sekcje (ceny, warianty, terminy)

**Quick Mode — ekran nr 1:**
- Aparat / dodaj zdjęcia z galerii — pierwsza rzecz na ekranie
- Notatka głosowa lub tekstowa
- Wybór klienta (1 tap) lub dodanie nowego (2 pola: imię + telefon)
- Checklist: Klient ma dokumentację? TAK / NIE / CZEKAM
- Checklist: Jest kosztorys inwestorski? TAK / NIE / SPRAWDZAM
- Przycisk: "Mam wszystko — zaczynam wycenę" → Full Mode

> **Zasada User Replacement:** Quick Mode musi być szybszy od WhatsApp + kartka + zdjęcie. To jest właściwy benchmark — nie "szybszy od Full Mode".

---

## 1. Definicja celu i standardu jakości

### 1.1 Ultra Enterprise Standard

| # | Warunek | Co to oznacza w praktyce |
|---|---|---|
| 1 | Wyraźnie widoczna zmiana | "Wow, to jest inne narzędzie" — bez briefingu |
| 2 | Wyższy prestiż | Wygląda drożej niż cena sugeruje |
| 3 | Wyższe zaufanie i czytelność | Każda informacja na właściwym miejscu |
| 4 | Szybkość i mobilność nienaruszone | Premium nie może oznaczać wolniejszego ładowania |
| 5 | Spójność systemowa | Cały produkt idzie razem |
| 6 | Zero premium islands | Program nie kończy się z niespójnymi ekranami |

### 1.2 Perceived Quality Gate (PQG) — minimum 5/6 = TAK

1. Czy ekran wygląda wyraźnie drożej i bardziej profesjonalnie niż wcześniej?
2. Czy hierarchia informacji jest lepsza?
3. Czy główne CTA jest mocniejsze i czytelniejsze?
4. Czy zaufanie użytkownika lub klienta jest większe?
5. Czy mobile jest lepszy funkcjonalnie — nie tylko ładniejszy?
6. Czy konkurencja na tym ekranie wygląda teraz słabiej?

> **No Cosmetic Pass:** Zmiana wyłącznie kolorów bez realnego wzrostu percepcji jakości = sprint failed.

---

## 2. Stack, ograniczenia i decyzje strategiczne

### 2.1 Stack

| ZOSTAJE / WCHODZI | NIE DOTYKAMY / ZAKAZANE |
|---|---|
| React + Vite + TypeScript | Migracja do Next.js — decyzja ostateczna |
| Tailwind CSS | Nowy backend ani nowa baza |
| Supabase (Auth / DB / Storage / Edge Functions) | Zmiana modelu auth |
| Vercel (hosting + CDN + preview deployments) | Nowe ciężkie UI libraries (> 50KB gzipped) |
| Framer Motion | Framework-level refaktory |
| Recharts | Zmiana modelu ofert / akceptacji |
| Lucide React (jedyna biblioteka ikon) | Fake testimonials / wymyślone metryki |
| i18n: PL / EN / UK | Google Fonts CDN dla Bricolage Grotesque i JetBrains Mono |
| React Query (data fetching + offline persistence) | Recharts / Framer Motion bez manualChunks w Vite |
| jsPDF (PDF browser-side — TERAZ, sekcja 23.1) | — |
| @react-pdf/renderer (PDF server-side — PLANNED po Etapie 2) | — |

**Trzy kluczowe decyzje technologiczne:**
1. PDF: jsPDF browser-side teraz. Migracja na server-side = osobny milestone po Etapie 2 (sekcja 26).
2. Fonty Bricolage Grotesque + JetBrains Mono: self-hosted w `/public/fonts/` z preload. Inter: Google Fonts OK.
3. Vite manualChunks: vendor-charts, vendor-motion, vendor-illustrations — obowiązkowe.

### 2.2 Dwa konteksty użytkowania — traktowane osobno

| MOBILE FIELD MODE | OFFICE POWER MODE |
|---|---|
| Telefon w terenie | Biuro / desktop |
| Jedna ręka, często rękawice | Mysz i klawiatura |
| Słabe lub brak WiFi — offline queue obowiązkowy | Stabilne WiFi — pre-fetch przy hover |
| Słoneczne warunki — wysoki kontrast | Gęstość danych — więcej na ekranie |
| Min. 48px touch targets | Sidebar navigation + keyboard shortcuts |
| Bottom navigation zawsze widoczna | Dense mode opcjonalny |
| Dense mode WYŁĄCZONY | Wiele zakładek i modułów naraz |

---

## 3. Faza 0 — Visual Authority Foundation

> **Fundament całego programu. Bez ukończenia tej fazy nie wolno zaczynać żadnej kolejnej.**

### 3.1 System tokenów kolorów — Light Mode

| Token | Wartość | Zastosowanie |
|---|---|---|
| --bg-base | #FAFAF8 | Tło bazowe — ciepła biel, nie czysta |
| --bg-surface | #FFFFFF | Karty, panele, modale |
| --bg-surface-raised | #F5F3EF | Wzniesione powierzchnie, hover states |
| --bg-sidebar | #0F172A | Sidebar desktop |
| --border-default | #E8E4DC | Obramowania kart i inputów |
| --border-subtle | #F0EDE8 | Delikatne separatory |
| --text-primary | #111827 | Główny tekst, nagłówki |
| --text-secondary | #6B7280 | Opisy, etykiety, metadane |
| --text-muted | #9CA3AF | Placeholder, disabled, hint |
| --accent-amber | #F59E0B | Główny akcent marki |
| --accent-amber-hover | #D97706 | Amber hover |
| --accent-amber-subtle | #FEF3C7 | Amber tło dla badge, callout |
| --accent-blue | #1E40AF | Dane, wykresy, linki |
| --accent-blue-subtle | #DBEAFE | Niebieskie tło informacji |
| --state-success | #16A34A | Zaakceptowano, opłacono |
| --state-warning | #D97706 | Oczekuje, zbliża się termin |
| --state-error | #DC2626 | Błąd, odrzucono |
| --state-info | #2563EB | Informacja, podpowiedź |

### 3.2 System typografii

- **Bricolage Grotesque** — display i nagłówki (H1–H4). Wagi: 500, 600, 700, 800. **Self-hosted.**
- **Inter** — treść, formularze, opisy. Wagi: 400, 500, 600 — tylko te trzy.
- **JetBrains Mono** — liczby, kwoty PLN, kody. **Self-hosted.**

Skala rozmiarów (px) — **nic poza:** 12 / 14 / 16 / 18 / 24 / 32 / 40 / 56

> **Font Hosting REGUŁA:** Bricolage Grotesque i JetBrains Mono: self-hosted w `/public/fonts/`, `font-display: swap`, `<link rel="preload">` w index.html. NIE Google Fonts CDN dla tych dwóch fontów.

### 3.3 System elevation i shadow

| Token | Wartość |
|---|---|
| shadow-xs | 0 1px 2px rgba(0,0,0,0.05) |
| shadow-sm | 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04) |
| shadow-md | 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05) |
| shadow-lg | 0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04) |
| shadow-xl | 0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04) |
| shadow-amber | 0 4px 14px rgba(245,158,11,0.30) |
| shadow-amber-lg | 0 8px 24px rgba(245,158,11,0.25) |

### 3.4 Spacing i radius

| SPACING | RADIUS |
|---|---|
| xs: 4px | radius-sm: 6px — inputy, badge |
| sm: 8px | radius-md: 10px — karty, przyciski |
| md: 16px | radius-lg: 16px — modale, panele |
| lg: 24px | radius-xl: 24px — hero karty |
| xl: 32px | radius-full: 9999px — pills, avatary |
| 2xl: 48px, 3xl: 64px, 4xl: 96px | — |

### 3.5 Deterministic UI State System

- **LOADING** — skeleton oddający kształt treści (nie generic spinner wszędzie)
- **SUCCESS** — zielony flash lub checkmark + komunikat
- **EMPTY** — ilustracja + kontekstowy komunikat + CTA — nigdy pusty ekran
- **ERROR** — czytelny komunikat + retry + fallback
- **DISABLED/PENDING** — stan wizualny + tooltip wyjaśniający dlaczego
- **OPTIMISTIC** — natychmiastowa odpowiedź UI z rollback

> **No Silent Actions:** Żadna akcja użytkownika bez wyraźnego feedback = brak zaufania do produktu.

### 3.6 Motion System

- Page transitions: fade + translateY(6px), 150ms ease-out
- Card entrance: staggered fade + translateY(8px), 60ms stagger, tylko przy pierwszym mount
- Number counters: count-up od 0, 1200ms ease-out
- Button feedback: success (green flash + check), loading (spinner zastępuje ikonę), error (shake 200ms)
- Modal: slide-from-bottom mobile, scale-from-center desktop, backdrop blur
- Charts: Recharts wbudowane animacje, 800ms, fire once on mount

**Limit twardy:** żadna animacja interaktywna > 400ms. Listy > 20 elementów nie animują wejścia. `prefers-reduced-motion` zawsze respektowany.

### 3.7 Accessibility jako Premium

- Focus visible: amber focus ring (2px, offset 2px) na każdym elemencie interaktywnym
- Kontrast: min 4.5:1 treść, 3:1 duże nagłówki
- Touch targets: min 44×44px mobile, 40×40px desktop
- Semantyczny HTML, ARIA tylko gdzie HTML nie wystarcza
- Modal: focus trap, Escape zamyka, focus wraca do triggera
- Form errors: `aria-describedby` powiązany z inputem

### 3.8 Dark Mode Token System

Klasa `.dark` na `<html>`:

| Token (dark) | Wartość |
|---|---|
| --bg-base | #0A0F1E |
| --bg-surface | #111827 |
| --bg-surface-raised | #1F2937 |
| --bg-sidebar | #060B14 |
| --border-default | #1F2937 |
| --border-subtle | #374151 |
| --text-primary | #F9FAFB |
| --text-secondary | #9CA3AF |
| --text-muted | #6B7280 |
| --accent-amber | #F59E0B |
| --accent-amber-subtle | #292524 |
| --state-success | #22C55E |
| --state-error | #EF4444 |

> Tokeny definiujemy w Fazie 0. Premium polish dark mode (Luxury Dark Pass) = Faza 6/P2.

### 3.9 Offline & Queue System

- Każda mutacja przez queue layer
- Brak sieci > 5s → dane do IndexedDB (idb-keyval)
- UI: "Zapisano lokalnie. Synchronizacja po połączeniu..." z amber ikoną
- Auto-retry po powrocie + potwierdzenie synchronizacji
- Dane nie tracone przy odświeżeniu strony (persistence)

> **Zero Data Loss na Mobile:** Fachowiec wypełniający ofertę na budowie bez zasięgu NIE MOŻE stracić danych.

---

## 4. Faza 1 — Core Product Prestige

### 4.1 [1A] Dashboard Command Center — P0

**Desktop:** Sidebar (264px, #0F172A) + TopBar (56px, sticky) + Content (warm off-white, max-width 1440px)

**Dashboard Desktop:** KPI Sparkline Cards (4x) → RevenueLineChart (2/3) + ProjectStatusDonut (1/3) → OffersBarChart (1/2) + ActivityFeed (1/2) → Quick Actions (4 karty)

**Dashboard Mobile:** Bottom tab bar (56px) + KPI horizontal scroll row + wykresy full width + Quick Actions grid 2×2

### 4.2 [1B] Onboarding Premium Experience — P0

> **Ilustracje w tej fazie:** szare placeholdery 240×240px. Finalne SVG w Fazie 4.

- Progress indicator (numerowany, amber aktywny krok)
- CTA motywujące (nie generyczne "Dalej")
- Trust markers: "Twoje dane bezpieczne w EU" / "Anuluj kiedy chcesz"
- Celebracja ukończenia + redirect z checklist

### 4.3 [1C] Core Components & Shell Polish — P0

Button (4 warianty), Input/Textarea, Select/Dropdown, Modal/Dialog, Sheet, Badge/Status pill, Table/DataGrid, List items, Tabs, Empty states, Form pattern, Toast.

---

## 5. Faza 2 — Client-Facing Prestige Layer

### 5.1 [2A] Public Offer Experience — P0

**Header:** Logo/nazwa firmy + numer + daty + status badge premium pill + countdown < 7 dni

**Desktop 2-kolumnowy:** Lewa (60%): zakres + pozycje + warianty (tabs) + galeria. Prawa (40%, sticky): netto/VAT/brutto JetBrains Mono + amber Total + CTA 52px + trust signals

**Mobile:** Sticky bottom bar (80px) z Total + "Zaakceptuj" zawsze nad foldem

### 5.2 [2B] PDF Prestige Pass — P0

> **Stan obecny: jsPDF. Prestige uplift na jsPDF. Migracja server-side = osobny milestone po Etapie 2 (sekcja 26).**

Header: logo + dane firmy + numer. Typografia: Bricolage/Inter/JetBrains Mono. Tabela: przestronna, alternating rows. Total: duży, amber. Footer: ważność + data + strona X/Y. QR kod (`qrcode 1.5.4` — już w repo).

---

## 6. Faza 3 — Landing Premium Sales System

**Hero (60/40 desktop):** H1 Bricolage Grotesque + CTA "Zacznij bezpłatnie" amber 52px + 3 defensible trust stats + CSS/SVG visual composition

**Features grid (3 kolumny):** 6 kart: Oferty PDF / Projekty / Klienci / Szablony / AI Asystent (uczciwy framing) / 3 języki

**How it Works:** 3 kroki, connecting line on-scroll. Sloty na ilustracje (Faza 5).

**Trust section:** Bezpieczeństwo dane w EU / SSL / RODO. FAQ accordion.

**Pricing:** Istniejące plany. Amber glow na rekomendowanym. "Zacznij za darmo, bez karty."

**Final CTA:** Full-width amber gradient. "Bez umowy. Anuluj kiedy chcesz."

---

## 7. Faza 4 — Visual Asset & Illustration System

**Empty States (5 szt.):** EmptyOffers, EmptyProjects, EmptyClients, EmptyTemplates, EmptyDashboard (horyzont budowy, 240px)

**Onboarding (4 szt.):** Krok 1 (kask+narzędzia), Krok 2 (dokument+amber pióro), Krok 3 (koperta+amber skrzydła), Krok 4 (sukces+zielony check)

**Landing Feature (3 szt.):** FeatureOffers, FeatureProjects, FeatureClients

**Hero Composition:** Izometryczna SVG: dashboard + karta oferty + frame mobilny. CSS parallax 3–4s loop.

**Reguły techniczne:**
- `export default function Name({ className, size, animated = true })`
- `animated=false` = statyczny SVG (+ prefers-reduced-motion auto)
- Kolory przez CSS custom properties — automatycznie dark mode
- CSS @keyframes only — nie Framer Motion
- `aria-hidden="true"` — dekoracyjne
- Max 15KB per komponent po minifikacji

---

## 8. Faza 5 — Micro-Interactions & Quality Polish

**Motion components:** PageTransition, StaggerChildren, CountUp (1200ms ease-out), SkeletonPremium (shimmer), MotionCard (hover translateY(-2px))

**Button feedback:** Success (green flash → check 1.5s), Loading (spinner zastępuje ikonę), Error (red + shake 200ms)

**Charts:** RevenueLineChart (gradient, amber/blue), OffersBarChart (grouped), ProjectStatusDonut (rotation on mount), KPISparklineCard (trend arrow + mono value), ActivityFeed (amber left border)

---

## 9. Faza 6 — Global Coverage Pass

**Moduły P0:** Dashboard, Oferty, Publiczna oferta, PDF, Onboarding

**Moduły P1:** Projekty, Klienci, Szablony, Ustawienia, Landing, Login/Register

**Moduły P2:** Admin/Owner dense mode, Dark mode luxury

**Brand Signature Layer:**
- Amber jedyny główny akcent. Niebieski tylko dla danych/linków.
- JetBrains Mono dla KAŻDEJ kwoty PLN
- Amber left border na aktywnym stanie sidebar
- Shadow-amber TYLKO na primary CTA
- Zero pustych białych ekranów — zawsze ilustracja + CTA
- Konsekwentne 24px/32px między sekcjami

**Dense Office Mode (P2):** Spacing 24px→16px, row height 56px→44px, keyboard shortcuts (N/P/K/slash/Ctrl+S/G+D/O/P), pre-fetch przy hover (200ms, tylko Dense Mode), Dense mode WYŁĄCZONY na mobile.

---

## 10. Zasady kontroli jakości

### 10.1 Before/After Proof Rule
Screenshot BEFORE (desktop 1280px + mobile 390px) PRZED pierwszą linią kodu. Screenshot AFTER po implementacji. 3 zdania co użytkownik poczuje. Wynik PQG.

### 10.2 No Silent Completion
Obowiązkowy checkpoint ręczny (3 flow): dashboard, tworzenie oferty end-to-end, publiczna oferta + akceptacja.

### 10.3 PR Size Discipline
1 prompt = 1 zamykalna część. 1 PR = max 5–8 plików LUB 1 spójna powierzchnia. Żaden PR nie zmienia jednocześnie: business logic + visual + routing + testy.

### 10.4 Critical Business Surfaces Lock

| Powierzchnia | Co musi działać |
|---|---|
| Tworzenie oferty | Formularz → zapis → lista |
| Wysyłka oferty | Link publiczny generuje się, działa bez logowania |
| Publiczna akceptacja | Klient akceptuje → status zmienia się |
| PDF export | Generuje się, czytelny, A4 |
| Auth Login/Register | Działa, redirect, sesja |
| Mobile navigation | Bottom nav, brak horizontal scroll |

### 10.5 Performance Budget
- Żadna animacja interaktywna > 400ms
- Żadna animacja na listach > 20 elementów
- LCP landing page < 2.5s na mobile (3G)
- SVG ilustracje max 15KB per komponent
- `prefers-reduced-motion` zawsze respektowany
- Bundle: żaden chunk > 200KB gzipped
- Recharts/Framer Motion/ilustracje w osobnych manualChunks

---

## 11. Core Components — specyfikacja

### 11.1 Button

| Wariant | Wygląd | Zachowanie |
|---|---|---|
| Primary | Amber bg, biały tekst, radius-md, 44px, shadow-amber hover | Loading spinner, success: green flash + check |
| Secondary | Biały bg, amber border 2px, amber tekst | Hover: amber-subtle bg |
| Ghost | Transparentny bg, slate tekst | Hover: surface-raised bg |
| Destructive | Czerwony bg, biały tekst | Wymaga confirm dialogu |

### 11.2 Input / Textarea
- Border: --border-default, radius-sm 6px, height 42px
- Focus: amber outline 2px, offset 2px
- Label: Inter 14px/500, nad inputem (nie placeholder jako label)
- Error: czerwona border + helper text + aria-describedby
- Disabled: 50% opacity, cursor: not-allowed

### 11.3 Modal / Dialog
- Desktop: scale(0.95→1), 200ms ease-out, backdrop blur(4px)
- Mobile: slide-from-bottom, 280ms ease-out
- Focus trap, Escape zamyka, focus wraca do triggera

### 11.4 Status Badge System

| Status | Tło | Tekst |
|---|---|---|
| ZAAKCEPTOWANA / OPŁACONA | #DCFCE7 | #15803D |
| OCZEKUJE / W TOKU | #FEF3C7 | #B45309 |
| WYGASŁA / PRZEKROCZONA | #FEE2E2 | #B91C1C |
| ODRZUCONA / ANULOWANA | #F1F5F9 | #475569 |
| WERSJA ROBOCZA | #EFF6FF | #1D4ED8 |
| WKRÓTCE / BETA | #F5F3FF | #6D28D9 |

---

## 12. Global Coverage Checklist (8 kryteriów per moduł — wszystkie wymagane)

1. Tokeny — zero hard-coded kolorów, tylko CSS custom properties
2. Typografia — Bricolage nagłówki, Inter treść, JetBrains Mono liczby
3. Stany — loading / empty / error / success spójne i zaimplementowane
4. Mobile — 390px, brak horizontal scroll, touch targets ≥ 44px
5. Dark mode — kontrast sprawdzony, brak broken layouts
6. Accessibility — focus visible, aria labels, semantyczny HTML
7. Animacje — prefers-reduced-motion, czas < 400ms
8. Performance — brak niepotrzebnych re-renderów przy scroll lub hover

---

## 13. Analytics & Observability

### 13.1 Sentry (P0 — przed pierwszym użytkownikiem)
- `@sentry/react ^10.29.0` — zainstalowany, wymaga DSN
- Error tagging per flow: offer_create / offer_send / offer_accept / pdf_generate / auth_login
- Source maps na Vercel

### 13.2 Event Plan

| Event name | Metryka |
|---|---|
| landing_cta_click | Landing → signup conversion |
| signup_started, signup_completed | Funnel rejestracji |
| onboarding_started, onboarding_completed | Onboarding completion rate |
| offer_quick_started | Quick Mode adoption |
| offer_full_started | Full Mode adoption |
| offer_quick_to_full | Expansion rate |
| offer_pdf_generated | PDF generation rate |
| offer_sent | Offer send rate |
| public_offer_opened | Offer open rate |
| offer_accepted | **Acceptance rate — kluczowa metryka** |
| offer_changes_requested | Revision rate |
| first_week_return | Weekly return rate |

Wszystkie eventy aktywne przed zamknięciem Etapu 4.

---

## 14. Business Impact Matrix

| Faza | Metryka | Baseline | Target | Status |
|---|---|---|---|---|
| 0 — Foundation | Spójność tokenów | 0% | 100% | TO VERIFY |
| 1 — Quick Mode | Time to first draft PDF | MISSING | < 3 min mobile | TRACKING NEEDED |
| 1 — Dashboard | Weekly return rate | MISSING | +15% | TRACKING NEEDED |
| 1 — Onboarding | Onboarding completion | MISSING | +20% | TRACKING NEEDED |
| 2 — Public Offer | Offer acceptance rate | MISSING | +10% | TRACKING NEEDED |
| 2 — PDF | PDF share/send rate | MISSING | +15% | TRACKING NEEDED |
| 3 — Landing | Landing → signup | MISSING | +20% | TRACKING NEEDED |
| 6 — Coverage | Zero premium islands | MISSING | 100% modules pass | MANUAL |

---

## 15. Competitor Evidence Library

| Produkt | Co robi dobrze | Gdzie słabszy |
|---|---|---|
| Oferteo | Zasięg, rozpoznawalność PL | Brak własnego PDF, brak akceptacji online |
| Sellasist | Solidne CRM | Zbyt złożony dla fachowca w terenie |
| Excel + e-mail | Zero learning curve | Brak śledzenia, chaos wersji |
| WhatsApp + zdjęcie | Zero friction, natychmiastowy | Brak profesjonalizmu |
| Fakturownia / iFirma | Dobra faktura, VAT | Nie dla ofert terenowych |
| Buildxact | Bogaty w funkcje | Po angielsku, za drogi dla PL |

> **Owner Action:** Screenshoty w `docs/competition/` przed Fazą 6.

---

## 16. Illustration Style Brief

| Parametr | Zasada | Zakaz |
|---|---|---|
| Styl | Construction-friendly isometric flat | Clip-art, cartoon, startup blobs |
| Geometria | Uproszczone kształty, brak twarzy | Cartoon eyes, kreskówkowe postaci |
| Linie | Cienkie (strokeWidth 0–1.5px) | Grube obrysy jak w komiksie |
| Paleta | Amber #F59E0B akcent, Slate #1E293B baza | Przypadkowe gradienty, jaskrawe tła |
| Kompozycja | 70% obiekt / 30% przestrzeń | Przeładowane sceny |
| Motion | 3–8s loop, translateY ±6px | Szybkie, skaczące animacje |
| Tematyka | Budownictwo, narzędzia, dokumenty, teren | Rakiety, żarówki, chmury, generyczne SaaS |

> **Style Consistency:** Pierwsza ilustracja w Fazie 4 = standard dla pozostałych 13.
> **Owner Action:** 3–4 referencje z undraw.co → `docs/illustrations/STYLE_REFERENCES.md` przed Etapem 5.

---

## 17. Tablet Hybrid Mode (768–1024px)

| Parametr | Mobile < 768px | Tablet 768–1024px |
|---|---|---|
| Nawigacja | Bottom tab bar | Sidebar zwinięty (ikony 64px) LUB bottom bar |
| Gęstość | 1 kolumna | 2 kolumny tam gdzie pomaga |
| Dense Mode | WYŁĄCZONY | WYŁĄCZONY — dotyk first |
| Touch targets | Min. 48px | Min. 44px |
| Quick Mode | Pełny | Identyczny jak mobile |
| Pre-fetch | NIE | NIE |

---

## 18. Decyzje techniczne

### 18.1 Offline Queue — IndexedDB przez idb-keyval
- Queue storage (web): IndexedDB via **idb-keyval**
- Queue storage (native): Capacitor Storage dla iOS/Android
- Persistence: TanStack Query `persistQueryClient` z idb-keyval adapter
- Retry: exponential backoff — 1s, 2s, 4s, 8s, max 5 prób
- Conflict: latest local wins until server reject
- UI: Zapisano lokalnie → Oczekuje synchronizacji → Zsynchronizowano → Konflikt
- localStorage: TYLKO UI preferences (dark mode, dense mode, language)

### 18.2 QR Code — Public Link Permanence Rule
- URL oferty nigdy nie zwraca 404 po emisji
- Soft delete only — expired/deleted offer → status page
- QR zawsze otwiera stronę (WYGASŁA / USUNIĘTA / AKTYWNA / ZAAKCEPTOWANA)

### 18.3 Dark Mode — rozdzielenie
- Faza 0: PEŁNY zestaw dark tokenów + minimalna zgodność techniczna
- Fazy 1–5: tokeny dostępne, CSS variables działają automatycznie
- Faza 6/P2: Luxury Dark Pass — premium polish

---

## 19. Draft Data Contract

> **draft_id jest stały od pierwszego zdjęcia z terenu aż do wysłanej oferty. Nigdy nie zmienia się przy przejściu Quick→Full.**

### 19.1 OfferDraft Interface

| Pole | Typ | Opis |
|---|---|---|
| id | string (readonly) | draft_id — stały od Quick Mode do końca |
| mode | 'quick' \| 'full' | Tylko quick→full, nigdy odwrotnie |
| status | enum | 'draft' \| 'pricing_in_progress' \| 'ready_for_pdf' \| 'sent' |
| ownerUserId | string | Wymagany od początku |
| client.id | string \| null | Istniejący klient |
| client.tempName | string \| null | Tymczasowa nazwa (Quick Mode) |
| client.tempPhone | string \| null | Telefon tymczasowy |
| client.tempEmail | string \| null | Email tymczasowy |
| sourceContext.createdFrom | enum | 'quick-mode' \| 'full-mode' \| 'template' |
| sourceContext.deviceType | enum | 'mobile' \| 'tablet' \| 'desktop' |
| sourceContext.startedAt | string (ISO) | Czas pierwszego zapisu |
| fieldCapture.photos[] | Photo[] | id, storagePath, localQueueId, caption, category |
| fieldCapture.textNote | string \| null | Notatka tekstowa |
| fieldCapture.voiceNotePath | string \| null | Ścieżka nagrania |
| fieldCapture.measurements[] | Measurement[] | label, value, unit (m/m2/m3/pcs/mb) |
| checklist.hasDocumentation | enum | 'yes' \| 'no' \| 'waiting' \| 'unknown' |
| checklist.hasInvestorEstimate | enum | 'yes' \| 'no' \| 'checking' \| 'unknown' |
| checklist.clientRequirements | string \| null | Wytyczne klienta |
| checklist.siteConstraints | string \| null | Ograniczenia na budowie |
| pricing.lineItems[] | LineItem[] | id, name, qty, unit, unitPriceNet, vatRate, totals, source |
| pricing.variants[] | Variant[] \| null | Full Mode only |
| pricing.currency | 'PLN' | Zawsze PLN |
| pricing.pricingState | enum | 'not_started' \| 'draft' \| 'completed' |
| output.pdfState | enum | 'not_ready' \| 'ready' \| 'generated' |
| output.publicLinkState | enum | 'not_ready' \| 'ready' \| 'sent' |

### 19.2 Quick Mode — minimalny zakres
- id (auto), mode='quick', ownerUserId (sesja)
- client: istniejący id LUB tempName + tempPhone
- fieldCapture: min. jedno z: zdjęcie, notatka, checklista
- pricing.pricingState = 'not_started'

### 19.3 Warunek przejścia Quick→Full (4 binarne warunki)
1. draft_id istnieje
2. ownerUserId przypisany
3. Klient: id LUB tempName + (tempPhone lub tempEmail)
4. Min. jedno źródło kontekstu: zdjęcie LUB notatka LUB checklista

Przycisk "Zaczynam wycenę" disabled jeśli niespełnione + tooltip z wyjaśnieniem.

### 19.4 Expansion Rule
- draft_id NIE ZMIENIA SIĘ
- mode: quick→full (tylko w jednym kierunku)
- URL bez utraty stanu
- Full Mode TYLKO DOKŁADA sekcje — nic nie nadpisuje
- sourceContext.createdFrom pozostaje 'quick-mode' dla analytics

### 19.5 Definition of Ready for PDF

| Warunek | Stan jeśli niespełniony |
|---|---|
| Klient ma nazwę + telefon lub email | Przycisk PDF disabled + tooltip |
| Min. 1 line item | Przycisk PDF disabled + tooltip |
| Każda pozycja: nazwa + ilość + jednostka + cena | Inline error |
| VAT ustawiony lub świadomie wyłączony | Modal: 'Netto czy brutto?' |
| pricing.pricingState = 'completed' | System ustawia automatycznie |

---

## 20. Event Tracking Architecture

> **Zero Ad Hoc:** Żadna nazwa eventu jako literal string w komponencie. Zawsze: `trackEvent(ANALYTICS_EVENTS.OFFER_SENT, payload)`.

### 20.1 Struktura modułów
- `src/lib/analytics/events.ts` — centralny słownik ANALYTICS_EVENTS
- `src/lib/analytics/track.ts` — helper trackEvent()
- `src/lib/analytics/event-schema.ts` — typy payloadów

### 20.2 ANALYTICS_EVENTS dictionary

```typescript
export const ANALYTICS_EVENTS = {
  LANDING_CTA_CLICK: "landing_cta_click",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_COMPLETED: "onboarding_completed",
  OFFER_QUICK_STARTED: "offer_quick_started",
  OFFER_FULL_STARTED: "offer_full_started",
  OFFER_QUICK_TO_FULL: "offer_quick_to_full",
  OFFER_PDF_GENERATED: "offer_pdf_generated",
  OFFER_SENT: "offer_sent",
  PUBLIC_OFFER_OPENED: "public_offer_opened",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_CHANGES_REQUESTED: "offer_changes_requested",
  FIRST_WEEK_RETURN: "first_week_return",
} as const;
```

### 20.3 Payload contract
Opcjonalne: `userId, draftId, offerId, clientId, source, mode, screen, meta`.

**NIGDY w payloadzie:** telefon, email, notatki, adresy, kwoty, zdjęcia, dane osobowe.

### 20.4 trackEvent — zasady
- Jedyna funkcja wołana z komponentów i hooków
- Try/catch wewnątrz, silent fail w produkcji
- Development: console.log
- Nie blokuje renderowania — asynchroniczna
- Zmiana nazwy = nowa stała + deprecacja starej (nie usunięcie)

---

## 21. Non-Goals — absolutne zakazy

| Co jest poza zakresem | Dlaczego |
|---|---|
| Migracja do Next.js | Stack zostaje — decyzja ostateczna |
| Nowy backend lub baza | Supabase zostaje |
| Nowy model auth | Auth działa |
| Marketplace 2.0 | Osobny produkt |
| Pełny ERP | Majster dla jednego wykonawcy |
| Moduł ekip / HR / kadry | Poza scope |
| KSeF end-to-end | Osobny projekt |
| Quick Mode jako osobny produkt | Quick Mode = tryb, nie produkt |
| "AI zrobi ofertę bez kontroli fachowca" | AI asystuje, nie zastępuje |
| Blog / CMS | Osobny projekt marketingowy |
| Hard delete ofert z QR | Public Link Permanence Rule |
| Fake testimonials / fake metrics | Absolutny zakaz |
| Wielkie refaktory "przy okazji" | 1 PR = 1 zamknięta zmiana |
| Ciężkie biblioteki tylko dla efektu | Performance budget |

> **Test:** Jeśli zmiana nie jest opisana w sekcjach 0–12 — jest poza zakresem.

---

## 22. Priority Execution Order — 6 etapów z Hard Stop Gates

> **Dashboard NIE jest ważniejszy od Quick Mode + Public Offer. Kolejność odzwierciedla wartość biznesową, nie estetyczną.**

---

### ETAP 0 — Foundation

**Zakres:** Faza 0 (tokeny, typografia, elevation, motion, states) + Event Tracking Architecture (sekcja 20) + Offline Queue foundation (sekcja 18.1) + OfferDraft contract (sekcja 19)

**HARD STOP GATE 0:**
1. Tokeny działają i są widoczne w całej aplikacji
2. `trackEvent()` istnieje i ANALYTICS_EVENTS kompletny
3. OfferDraft interface zaimplementowany, TypeScript akceptuje
4. idb-keyval zainstalowany, draft zapisuje się lokalnie offline
5. Brak regresji: auth / tworzenie oferty / public offer / akceptacja

---

### ETAP 1 — Core Value Flow

**Zakres:** Quick Mode entry + Quick→Full expansion (sekcja 19.4) + Full Mode completion + PDF Prestige Pass (jsPDF uplift) + Offer send flow

**HARD STOP GATE 1:**
1. Fachowiec może zebrać dane w Quick Mode jedną ręką na mobile
2. Quick→Full: draft_id stały, zero utraty danych
3. PDF generuje się (jsPDF prestige), wygląda profesjonalnie, A4 poprawny
4. Oferta wysłana, klient dostaje link, działa bez logowania
5. Cały flow jedną ręką na 390px

> **USER TEST CHECKPOINT po Gate 1:** Przed Etapem 2 — Owner daje produkt jednemu fachowcowi na 1 dzień. Feedback w `docs/USER_TEST_01.md`. Korekty Quick Mode / PDF / wysyłki PRZED Etapem 2.

---

### ETAP 2 — Client Trust Layer

**Zakres:** Public Offer Experience (Faza 2A) + Acceptance/change-request UX + QR permanence (sekcja 18.2) + PDF Prestige Pass (Faza 2B)

**HARD STOP GATE 2:**
1. Publiczna oferta działa bez logowania
2. Klient może zaakceptować lub poprosić o zmiany — end-to-end
3. PDF prestiżowy i czytelny na wszystkich urządzeniach
4. QR/public link nigdy nie kończy się martwą stroną

---

### ETAP 3 — Product Adoption Layer

**Zakres:** Onboarding Premium Experience (Faza 1B) + Dashboard Command Center (Faza 1A) + Core Components Polish (sekcja 11)

**HARD STOP GATE 3:**
1. Onboarding jest czytelny i kończony przez nowych użytkowników
2. Dashboard pokazuje realne dane — nie jest premium island
3. Komponenty spójne systemowo — PQG min. 5/6

---

### ETAP 4 — Sales Layer

**Zakres:** Landing Premium Sales Layer (Faza 3) + Pricing polish + CTA/signup funnel

> **Warunek przed startem:** Analytics sink DECISION zrobiona przez Ownera (sekcja 23.2).

**HARD STOP GATE 4:**
1. Tracking aktywny — landing_cta_click, signup events zbierają dane
2. Landing ma before/after proof desktop + mobile
3. Zero fake proof
4. Baseline funnel zaczyna się zbierać

---

### ETAP 5 — Brand Layer

**Zakres:** Illustration Asset System (Faza 4 / sekcje 7 + 16) + Motion & Micro-interactions (Faza 5) + Dark Luxury Pass (sekcja 18.3)

**HARD STOP GATE 5:**
1. 14 ilustracji spójnych stylistycznie
2. Motion nie łamie performance budget — LCP < 2.5s, animacje < 400ms
3. Dark mode spójny i czytelny

---

### ETAP 6 — Coverage & Advanced Mode

**Zakres:** Global Coverage Pass (8-pkt checklist sekcja 12) + Dense Office Mode (P2) + Competitor audit + Final polish

**PROGRAM ZAMKNIĘTY gdy:**
1. Każdy moduł przeszedł 8-punktowy Global Coverage checklist
2. 6 Critical Business Surfaces działa end-to-end bez regresji
3. Before/after proof dla każdej fazy
4. PQG min. 5/6 dla każdego sprintu
5. Brak premium islands
6. Analytics zbierają dane
7. **Majster pokazuje aplikację drugiemu majstrowi i mówi: "patrz jak to działa"**

---

## 23. Decision Records — stan rzeczywisty repo

### 23.1 PDF Decision Record

| | |
|---|---|
| Stan obecny | `jspdf ^4.1.0` + `jspdf-autotable` — browser-side |
| Stan docelowy | `@react-pdf/renderer` w Supabase Edge Function — server-side |
| Dlaczego nie teraz | Migracja = 5–7 dni. Łączenie z redesignem UI = gwarantowana regresja. |
| Status | PLANNED — osobny milestone po Etapie 2 (sekcja 26) |
| Co wolno teraz | Poprawiać wygląd PDF przez jsPDF (typografia, spacing, QR) |
| Zakaz | NIE łączyć migracji PDF z żadnym PR visual |

### 23.2 Analytics Sink Decision Record

| | |
|---|---|
| Error monitoring | `@sentry/react ^10.29.0` — ZAINSTALOWANY, wymaga DSN |
| Performance | `web-vitals ^5.1.0` — ZAINSTALOWANY |
| Product analytics | BRAK — zero PostHog / Plausible / Mixpanel |
| Rekomendacja | Plausible Cloud — RODO-compliant, EU, prosta integracja |
| Status | **DECISION PENDING — Owner Action wymagany PRZED Etapem 4** |
| Zakaz | Agent NIE instaluje providera bez jawnej decyzji Ownera |

### 23.3 Offline Queue Decision Record

| | |
|---|---|
| Foundation | `@tanstack/react-query ^5.83.0` — ZAINSTALOWANY |
| Capacitor | `@capacitor/core ^7.4.4` — ZAINSTALOWANY |
| Queue (web) | `idb-keyval` — NOT YET INSTALLED (E0-C instaluje) |
| Queue (native) | Capacitor Storage — dla iOS/Android build |
| Status | PLANNED — wchodzi w Etap 0 / E0-C |
| Retry | Exponential backoff: 1s, 2s, 4s, 8s, max 5 prób |

---

## 24. Quick Mode — Definition of Done UX

> **Agent NIE może zamknąć Quick Mode jako 'done' na podstawie samego kodu. Wymaga ręcznego testu na prawdziwym telefonie.**

| # | Warunek DoD | Weryfikacja |
|---|---|---|
| 1 | Draft w max 90 sekund od otwarcia | Stopwatch na prawdziwym telefonie — nie emulator |
| 2 | Max 5 elementów bez scrolla na pierwszym ekranie | Screenshot 390px |
| 3 | Klient w max 2 tappy / 2 pola | Nowy: imię+telefon+tap. Istniejący: szukaj+tap |
| 4 | Zdjęcie w max 3 tappy | Tap źródło → wybór → potwierdzenie |
| 5 | Notatka 1 tapem, visible na pierwszym ekranie | Screenshot — nie schowana za menu |
| 6 | Autosave bez przycisku "Zapisz" | Zamknij app → otwórz → draft jest |
| 7 | Działa offline | Tryb samolotowy → wypełnij → sync po powrocie |
| 8 | CTA disabled bez warunków + tooltip | Test negatywny: bez klienta = disabled |
| 9 | Quick→Full bez utraty danych | Sprawdź: zdjęcia, notatka, checklista, klient po przejściu |
| 10 | One-hand UX | Cały flow prawą ręką kciukiem na 390px |

**Benchmark:** 90s = maksimum. Cel: 45–60s. Musi być szybszy od WhatsApp + kartka.

---

## 25. MVP Offline Queue Scope

### 25.1 Co wchodzi (lista zamknięta)

| Akcja | Priorytet |
|---|---|
| Zapis draftu oferty (Quick Mode) | P0 — KRYTYCZNY |
| Zapis metadanych zdjęć (nie binary pliki) | P0 — KRYTYCZNY |
| Notatka tekstowa z terenu | P0 — KRYTYCZNY |
| Aktualizacja checklisty draftu | P1 |
| Dodanie tymczasowego klienta | P1 |

### 25.2 Co NIE wchodzi (lista zamknięta)

Upload zdjęć (binary), wysyłanie oferty, generowanie PDF, akceptacja klienta, ustawienia/billing, tworzenie szablonów, zmiany projektu poza draftem, merge klienta tymczasowego.

---

## 26. PDF Milestone Boundary

### 26.1 Co wolno teraz z jsPDF
Typografia, spacing, hierarchia, układ tabeli, kolory (amber Total, JetBrains Mono), header (logo, dane, numer), footer (ważność, data, strona X/Y), QR kod (`qrcode 1.5.4` — już w repo).

### 26.2 Co zarezerwowane dla PDF Migration Milestone
Instalacja `@react-pdf/renderer`, Supabase Edge Function, payload contract (JSON→binary), testy A4 na 3+ urządzeniach, fallback errors, usunięcie jspdf.

### 26.3 PDF Migration — 5 osobnych PR-ów (nigdy łączyć z PR visual)

| # | Task |
|---|---|
| 1 | Payload Contract PR — TypeScript interface OfferPDFPayload |
| 2 | Edge Function PR — Supabase EF: JSON → binary PDF |
| 3 | Renderer PR — @react-pdf/renderer szablon A4 z tokenami |
| 4 | Frontend Integration PR — zastąpienie wywołań jsPDF |
| 5 | QA & Cleanup PR — testy A4, usunięcie jspdf, update docs |

---

## 27. PRE-MERGE Standard — obowiązkowy dla KAŻDEGO PR

> **Agent NIE zamyka sprintu bez spełnienia wszystkich 12 punktów.**

| # | Warunek | Jak udokumentować |
|---|---|---|
| 1 | Screenshot BEFORE — desktop 1280px | Dołącz do PR PRZED pierwszą linią kodu |
| 2 | Screenshot BEFORE — mobile 390px | Dołącz do PR PRZED pierwszą linią kodu |
| 3 | Screenshot AFTER — desktop 1280px | Po implementacji, przed reviewem |
| 4 | Screenshot AFTER — mobile 390px | Po implementacji, przed reviewem |
| 5 | `npm run lint` — zero nowych błędów | Wklej ostatnią linię output |
| 6 | `npx tsc --noEmit` — zero błędów | Wklej ostatnią linię output |
| 7 | `npx vitest run` — wszystkie testy zielone | "X passed, 0 failed" |
| 8 | Manual QA: tworzenie i wysłanie nowej oferty | "Przetestowano — działa / nie działa" |
| 9 | Manual QA: publiczna oferta + akceptacja | "Przetestowano — działa / nie działa" |
| 10 | Manual QA: mobile navigation bez horizontal scroll | "Przetestowano — działa / nie działa" |
| 11 | PQG — 5 z 6 pytań = TAK | Wynik: X/6 |
| 12 | Max 5–8 plików istotnie zmienionych | "Files changed: X" |

### 27.1 Granularność promptów przy limicie 5x Claude Code Web

| Poziom | Przy limicie 5x |
|---|---|
| Ten dokument (docs/ULTRA_ENTERPRISE_ROADMAP.md) | Żyje w repo. NIE wrzucamy do promptu. |
| Etap (np. Etap 0 — 4 Gate Conditions) | Za duży. Dzielimy na Gate Conditions. |
| **Gate Condition (jeden warunek z Hard Stop Gate)** | **Jeden prompt = jedna Gate Condition.** Idealna granularność. |
| PR | Jeden prompt produkuje jeden PR. Nie więcej. |

---

## 28. Prompt Routing Matrix

| Zadanie | Claude Code Web (Opus/Sonnet) | Codex (GPT-4o/o3) |
|---|---|---|
| Design System spec | Diagnosis + token spec | Implementacja tokenów |
| Analytics | Architecture decision | Implementacja modułu |
| Offline Queue | Architecture decision | Implementacja queue |
| Draft Contract | Interface design | Implementacja types |
| Quick Mode | UX architecture + flow | Implementacja ekranów |
| PDF | Payload contract + spec | Implementacja renderera |
| Public Offer | Layout + trust architecture | Implementacja komponentów |
| Dashboard | Data architecture + chart spec | Implementacja Recharts |
| Landing | Copy strategy + conversion | Implementacja sekcji |
| Illustrations | Style brief enforcement + review | Generowanie SVG |
| Bug fixes | NIE (za drogi na debug) | TAK |

> **Fallback gdy Codex niedostępny:** Claude Sonnet 4.6 przejmuje "mechaniczne" zadania. 1 prompt = max 1 plik z pełną implementacją. Prompt Contract Standard (sekcja 29) obowiązuje identycznie.

**Czego nigdy nie łączymy w jednym promptcie:**
Zmiana tokenów + redesign strony | PDF migration + UI redesign | Analytics setup + komponent UI | Offline queue + nowy ekran | Refactor + nowa funkcja | Debug + premium uplift | Migracja deps + logika biznesowa

---

## 29. Prompt Contract Standard

> **Prompt bez source of truth, scope fence i PRE-MERGE = prośba, nie instrukcja.**

### 29.1 Obowiązkowe 8 elementów

1. **ROLE** — precyzyjna rola agenta
2. **MODEL** — jawna deklaracja: 'Claude Opus 4.6' / 'Claude Sonnet 4.6'
3. **SOURCE OF TRUTH** — konkretna sekcja tego dokumentu
4. **GATE CONDITION** — który warunek z Hard Stop Gate realizuje
5. **SCOPE FENCE — ALLOWED** — lista plików/folderów do dotknięcia
6. **SCOPE FENCE — FORBIDDEN** — lista absolutnych zakazów
7. **DOD** — binarne warunki zaliczenia
8. **PRE-MERGE CHECKLIST** — odwołanie do sekcji 27

---

## 30. Gate Cards — do wklejania w prompty wykonawcze

> **Skopiuj odpowiednią Gate Card na początek promptu jako 'CONTEXT FOR THIS SPRINT'.**

---

**GATE CARD — ETAP 0: Visual Authority Foundation**

| | |
|---|---|
| WEJŚCIE | Etap 1 NIE może startować bez tego gate. |
| ZAKRES | src/index.css, tailwind.config.*, src/components/ui/** (tokens only), src/lib/analytics/, idb-keyval + TanStack persistence, src/types/offer-draft.ts |
| PLIKI (max 8) | index.css, tailwind.config.ts, button.tsx, card.tsx, input.tsx, events.ts, track.ts, offer-draft.ts, package.json (idb-keyval only) |
| DOWÓD | Screenshot before/after 1280px + 390px. TypeScript clean. Tests passing. |
| HARD STOP | (1) Tokeny widoczne w całej app. (2) trackEvent() + ANALYTICS_EVENTS kompletny. (3) OfferDraft interface w repo. (4) idb-keyval + persistence bazowy. (5) Brak regresji. |

---

**GATE CARD — ETAP 1: Core Value Flow**

| | |
|---|---|
| WEJŚCIE | Gate 0 zamknięty. |
| ZAKRES | QuickMode.tsx (new), FullMode.tsx (extend), quick-mode/**, useDraft.ts, offline-queue.ts, jsPDF prestige uplift (NIE migration), fieldCapture components |
| DOWÓD | Stopwatch Quick Mode na telefonie. Screenshot 390px. Quick→Full transition. PDF generated. Offer link sent. |
| HARD STOP | (1) Quick Mode offline. (2) Quick→Full: draft_id stały, zero utraty. (3) PDF prestige (jsPDF). (4) Offer wysłana, link publiczny. (5) Jedną ręką 390px. |
| USER TEST | Po Gate 1: Owner daje produkt fachowcowi na 1 dzień → docs/USER_TEST_01.md |

---

**GATE CARD — ETAP 2: Client Trust Layer**

| | |
|---|---|
| WEJŚCIE | Gate 1 zamknięty + USER TEST CHECKPOINT ukończony. |
| ZAKRES | OfferPublicPage.tsx, OfferPublicAccept.tsx, public offer components, jsPDF uplift, i18n keys |
| DOWÓD | Screenshot before/after. Test akceptacji e2e. PDF before/after. QR test. |
| HARD STOP | (1) Public offer bez logowania. (2) Accept/reject działa. (3) PDF prestiżowy. (4) QR nigdy 404. |

---

**GATE CARD — ETAP 3: Product Adoption Layer**

| | |
|---|---|
| WEJŚCIE | Gate 2 zamknięty. |
| ZAKRES | Dashboard.tsx, dashboard/**, charts/** (new), onboarding/**, ui/** (premium uplift) |
| DOWÓD | Screenshot dashboard before/after. Charts rendering. Onboarding walkthrough. PQG 5/6. |
| HARD STOP | (1) Dashboard Ultra Enterprise. (2) Onboarding czytelny, kończony. (3) PQG min. 5/6. |

---

**GATE CARD — ETAP 4: Sales Layer**

| | |
|---|---|
| WEJŚCIE | Gate 3 zamknięty. Analytics sink DECISION zrobiona (Owner). |
| ZAKRES | Landing.tsx, landing/**, seo/**, SVG placeholders, i18n PL |
| DOWÓD | Screenshot landing before/after. Analytics events firing. No fake proof. Mobile CTA above fold. |
| HARD STOP | (1) Landing premium. (2) Tracking aktywny. (3) Zero fake. (4) Baseline funnel zbiera się. |

---

**GATE CARD — ETAP 5/6: Brand Layer + Global Coverage**

| | |
|---|---|
| WEJŚCIE | Gate 4 zamknięty. |
| ZAKRES | illustrations/** (14 SVG), empty states, onboarding slots, landing slots, global audit |
| DOWÓD | 14 ilustracji. Empty states before/after. Global Coverage 8/8 per moduł. |
| HARD STOP | (1) 14 ilustracji spójnych. (2) 8-pkt checklist per moduł. (3) Brak premium islands. (4) PQG 5/6. (5) "Patrz jak to działa." |

---

## 31. Gotowe prompty wykonawcze — Etap 0

> ⚠️ **ARCHIWUM — PROMPTY NIEAKTUALNE.** Ten dokument został zastąpiony przez [`docs/ROADMAP.md`](./ROADMAP.md) (v5),
> który definiuje inny framework realizacji (21 PR-ów w 6 fazach zamiast Etapów E0–E6 z Gate Cards).
> Poniższe prompty odnoszą się do starego frameworku i **nie powinny być używane** do nowych prac.
> Zachowane wyłącznie jako historia projektu.

> ~~**Skopiuj cały blok. Wklej do Claude Code Web. Nie skracaj scope fence. Nie usuwaj PRE-MERGE.**~~

---

### PROMPT E0-A — Design Token Foundation [Claude Sonnet 4.6]

**ROLE:** Senior Frontend Design System Engineer for Majster.AI working in repo `majster-ai-oferty`

**SOURCE OF TRUTH:** Read sections 3.1–3.8 of `docs/ULTRA_ENTERPRISE_ROADMAP.md` in repo. These sections define every token value, font, shadow, spacing, and radius. Do NOT guess — read the document first.

**GATE CONDITION:** Implements Gate 0 Condition 1: "Tokeny działają i są widoczne w całej aplikacji."

**SCOPE — ALLOWED:** `src/index.css` (rewrite token system), `tailwind.config.*` (extend theme), `src/components/ui/button.tsx` (apply tokens — no redesign), `src/components/ui/card.tsx`, `src/components/ui/input.tsx`, `src/components/ui/badge.tsx`

**SCOPE — FORBIDDEN:** No page redesigns. No new components. No routing. No business logic. No auth. Do NOT touch: Dashboard.tsx, Landing.tsx, OfferPublicPage.tsx, any Supabase files.

**DOD:** All CSS custom properties in `:root` and `.dark`. Bricolage Grotesque and JetBrains Mono self-hosted in `/public/fonts/` with preload. Inter via Google Fonts OK. Button/Card/Input/Badge use tokens (not hard-coded colors). TypeScript clean. Tests passing. No regression in offer flow.

**PRE-MERGE:** `npm run lint || true` | `npx tsc --noEmit` | `npx vitest run` | `npm run build || true`. Screenshots before/after 1280px + 390px. Manual QA 3 flows. PQG 5/6. Report in Polish.

---

### PROMPT E0-B — Event Tracking Architecture [Claude Sonnet 4.6]

**ROLE:** Senior Frontend Architecture Engineer for Majster.AI working in repo `majster-ai-oferty`

**SOURCE OF TRUTH:** Read section 20 of `docs/ULTRA_ENTERPRISE_ROADMAP.md`. Implement exactly what is written — no additions, no analytics provider installation.

**GATE CONDITION:** Implements Gate 0 Condition 2: "trackEvent() istnieje i ANALYTICS_EVENTS słownik jest kompletny."

**SCOPE — ALLOWED:** `src/lib/analytics/` (create directory), `events.ts`, `track.ts`, `event-schema.ts`

**SCOPE — FORBIDDEN:** No UI components. No page changes. No Sentry changes. No analytics provider installation (PENDING — Owner Action). No tracking calls in components yet.

**DOD:** ANALYTICS_EVENTS with all 14 events. `trackEvent()` never throws. EventPayload type. No PII. TypeScript clean. Unit tests.

**PRE-MERGE:** `npm run lint || true` | `npx tsc --noEmit` | `npx vitest run`. No UI change — no screenshots required. Report in Polish.

---

### PROMPT E0-C — Offline Queue Foundation [Claude Sonnet 4.6]

**ROLE:** Senior Frontend Infrastructure Engineer for Majster.AI working in repo `majster-ai-oferty`

**SOURCE OF TRUTH:** Read sections 3.9, 18.1, and 25 of `docs/ULTRA_ENTERPRISE_ROADMAP.md`. Section 3.9 = principles. Section 18.1 = IndexedDB decision. Section 25 = which 5 actions queued, which 8 NOT.

**GATE CONDITION:** Implements Gate 0 Condition 4: "idb-keyval zainstalowany, draft zapisuje się lokalnie offline."

**SCOPE — ALLOWED:** `package.json` (add idb-keyval only), `src/lib/offline-queue/` (create), `storage.ts`, `queue.ts`, `sync.ts`, `types.ts`

**SCOPE — FORBIDDEN:** No UI. No Supabase schema. No existing hooks. No Dexie.js. Only the 5 actions from section 25.1.

**DOD:** idb-keyval installed. Queue accepts 5 MVP actions (25.1). Queue rejects 8 excluded (25.2). Exponential backoff. UI status strings defined. TypeScript clean. Unit tests.

**PRE-MERGE:** `npm run lint || true` | `npx tsc --noEmit` | `npx vitest run`. No UI change — no screenshots. Report in Polish.

---

### PROMPT E0-D — OfferDraft Interface [Claude Sonnet 4.6]

**ROLE:** Senior TypeScript Architect for Majster.AI working in repo `majster-ai-oferty`

**SOURCE OF TRUTH:** Read section 19 of `docs/ULTRA_ENTERPRISE_ROADMAP.md`. 19.1 = interface, 19.2 = Quick Mode minimum, 19.3 = transition conditions, 19.4 = Expansion Rule, 19.5 = Definition of Ready for PDF.

**GATE CONDITION:** Implements Gate 0 Condition 3: "OfferDraft interface zaimplementowany, TypeScript akceptuje."

**SCOPE — ALLOWED:** `src/types/offer-draft.ts` (create), `src/types/offer-draft-helpers.ts` (isReadyForTransition, isReadyForPDF, isDraftValid), `src/lib/draft-validation.ts`

**SCOPE — FORBIDDEN:** No UI. No pages. No Supabase schema. No existing types modification. No Zod — TypeScript types only.

**DOD:** OfferDraft matches section 19.1 exactly. `isReadyForTransition()` implements 4 conditions (19.3). `isReadyForPDF()` implements 5 conditions (19.5). `draft_id` readonly. `mode` only quick→full. TypeScript clean. Unit tests for all helpers.

**PRE-MERGE:** `npm run lint || true` | `npx tsc --noEmit` | `npx vitest run`. No UI change — no screenshots. Report in Polish.

---

## 32. Repo Reality Map

### 32.1 Zielone — istnieje i działa

| Biblioteka | Wersja | Status |
|---|---|---|
| React + Vite + TypeScript | 18.3 / 7.3 / 5.8 | Zgodny. Stack zostaje. |
| TanStack Query | ^5.83.0 | Fundament offline queue. Gotowy. |
| Supabase JS | ^2.86.2 | Backend stays. Auth works. |
| Framer Motion | ^11.18.2 | Motion system gotowy. |
| Recharts | ^2.15.4 | Charts system gotowy. |
| Lucide React | ^0.462.0 | Icon system gotowy. |
| Tailwind CSS | ^3.4.17 | Token system gotowy. |
| Radix UI | pełen zestaw | Komponenty gotowe. |
| @sentry/react | ^10.29.0 | Error monitoring. Wymaga DSN. |
| web-vitals | ^5.1.0 | Performance monitoring. Gotowy. |
| rollup-plugin-visualizer | 6.0.5 | Bundle analyzer. Gotowy. |
| i18next + react-i18next | ^25 / ^16 | i18n PL/EN/UK. Gotowy. |
| Capacitor | ^7.4.4 | Native mobile. Gotowy. |
| @axe-core/playwright | 4.11.0 | A11y testing. Gotowy. |
| qrcode | 1.5.4 | QR do PDF. Gotowy. |
| react-hook-form + zod | ^7 / ^3 | Formularz oferty. Gotowy. |

### 32.2 Czerwone — sprzeczne z dokumentem

| Co jest | Sprzeczność | Rozwiązanie |
|---|---|---|
| jspdf ^4.1.0 + jspdf-autotable | Dokument planuje server-side PDF | DR 23.1: jsPDF teraz. Migration po Etapie 2. |
| Brak analytics providera | Dokument zakłada event tracking | DR 23.2: PENDING — Owner Action przed Etapem 4. |
| Brak idb-keyval | Dokument wymaga IndexedDB queue | E0-C instaluje. |
| Brak src/lib/analytics/ | Dokument zakłada moduł analytics | E0-B tworzy. |
| Brak src/types/offer-draft.ts | Dokument definiuje OfferDraft | E0-D tworzy. |

### 32.3 Migration Ledger

| Migracja | Teraz | Docelowo | Kiedy |
|---|---|---|---|
| PDF Engine | jsPDF browser-side | @react-pdf/renderer Edge Function | Po Etapie 2 — 5 PR-ów (sekcja 26) |
| Product Analytics | Brak | Plausible / PostHog — Owner Decision | Przed Etapem 4 |
| Offline Queue | Brak | idb-keyval + TanStack persistence | Etap 0 — E0-C |

---

## 33. Owner Input Pack

| # | Co potrzebne | Jak dostarczyć | Blokuje |
|---|---|---|---|
| 1 | Decyzja: Analytics Provider | Wybierz Plausible/PostHog → wpis do DR 23.2 | Etap 4 |
| 2 | Referencje stylu ilustracji | undraw.co — 3–4 bliskie → `docs/illustrations/STYLE_REFERENCES.md` | Etap 5 |
| 3 | Competitor Screenshots | Oferteo, Sellasist, Fakturownia → `docs/competition/` | Gate 5/6 |
| 4 | Branżowe szablony ofert (3-5) | Łazienka/malowanie/elektryka — pozycje, jednostki → `docs/templates/` (JSON/CSV) | Template Library Milestone |
| 5 | Logo firmy dla PDF | SVG lub PNG @2x → `public/assets/logo/` | Faza 2B |
| 6 | Dane firmy dla PDF | Nazwa, adres, NIP, telefon, email | Faza 2B |
| 7 | Quick Mode checklist pytania | Potwierdź lub dostosuj 3 pytania | Etap 1 |
| 8 | Test Quick Mode na telefonie | Po E0-A/B/C/D: przetestuj osobiście. DoD = sekcja 24. | Gate 1 |

---

## 34. Template Library Milestone (Owner-First)

**Szablony ofert (5-8):** Remont łazienki, Malowanie/tapetowanie, Instalacja elektryczna, Hydraulika, Elewacja, Wykończenia wnętrz, Płytki, Stolarka okienna.

**Dokumenty budowlane:** Umowa o roboty, Protokół odbioru, Aneks, Harmonogram płac, Protokół zmian, Oświadczenie wykonawcy, Notatka ze spotkania, Gwarancja.

**Format:** `{ name: 'Remont łazienki', items: [{ name: 'Demontaż płytek', unit: 'm2', typicalQty: 12 }] }`

**Kiedy:** Po Etapie 3. Status: **OWNER INPUT REQUIRED** — bez treści Owner = milestone zamrożony.

---

## 35. Business Proof Pack

| Metryka | Kto mierzy | Po ilu dniach | Co jeśli nie drgnie |
|---|---|---|---|
| Landing→signup | Owner / Analytics | 14 dni po Etap 4 | A/B test hero. Sprawdź CTA. |
| Onboarding completion | Owner / Analytics | 7 dni po Etap 3 | Uprość krok z najwyższym dropoutem. |
| Offer acceptance rate | Owner / Supabase | Po 20 wysłanych | Sprawdź public offer UX. Zapytaj klientów. |
| Quick Mode time to draft | Owner (stopwatch) | Po Etap 1 | Uprość pierwszy ekran. DoD sekcja 24. |
| Weekly return rate | Analytics | 21 dni po Etap 3 | Sprawdź wartość dashboardu. |
| PDF share rate | Analytics | Po 10 wygenerowanych | Sprawdź wygląd PDF. |

---

## 36. Finalny standard — definicja ukończenia programu

**PROGRAM JEST UKOŃCZONY KIEDY:**

- Landing, dashboard, public offer, PDF, onboarding i shell są na tym samym poziomie premium
- Żaden moduł nie wygląda jak "zostało z poprzedniej wersji"
- Każdy moduł przeszedł 8-punktowy Global Coverage checklist (sekcja 12)
- Każda faza ma before/after screenshot proof i PQG ≥ 5/6
- Aplikacja na mobile działa szybciej lub tak samo jak przed transformacją
- 6 Critical Business Surfaces przeszło ręczny test end-to-end bez regresji
- Analytics zbierają dane — metryki biznesowe mierzalne
- Klient fachowca widząc ofertę myśli: ta firma jest profesjonalna
- Nowy użytkownik po onboardingu rozumie produkt i chce go używać
- **Produkt wygląda drożej niż kosztuje — i działa lepiej niż obiecuje**
- **Majster pokazuje aplikację drugiemu majstrowi i mówi: "patrz jak to działa"**

---

## PIERWSZY KROK

> ⚠️ **ARCHIWUM — patrz [`docs/ROADMAP.md`](./ROADMAP.md) (v5) dla aktualnego planu prac.**

~~Wklej Prompt E0-A do Claude Code Web.~~
~~Cztery prompty E0-A/B/C/D są gotowe w sekcji 31.~~

---

*Wersja: v1.0 FINAL*
*Data: Marzec 2026*
*Ścieżka w repo: `docs/ULTRA_ENTERPRISE_ROADMAP.md`*
*Nie wrzucaj całego dokumentu do promptu wykonawczego. Jeden prompt = jedna Gate Condition z sekcji 22.*
