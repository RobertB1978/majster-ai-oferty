# Majster.AI — ROADMAP MARZEC 2026 (ŹRÓDŁO PRAWDY v5)

> **STATUS:** AKTYWNY — zastępuje `ROADMAP_ENTERPRISE.md` (v4) jako jedyne źródło prawdy od 2026-03-01.
> Patrz: [ADR-0000](./ADR/ADR-0000-source-of-truth.md) (zaktualizowany) i [ADR-0004](./ADR/ADR-0004-free-tier-limit.md).

**Wersja:** 5.0
**Data:** 2026-03-01
**Właściciel:** Product Owner (Robert B.) + Tech Lead (Claude)
**Repozytorium:** RobertB1978/majster-ai-oferty

---

## DLA LAIKA (bez żargonu)

Ten dokument to **mapa pracy Majster.AI na rok 2026** — 21 PR-ów podzielonych na 6 faz.
Każdy PR ma **jeden cel**, **jasne warunki ukończenia** i **nie rusza niczego poza swoim zakresem**.

- **PR** = Pull Request = jedna porcja zmiany w kodzie, sprawdzana i zatwierdzana przed wdrożeniem
- **ADR** = Architecture Decision Record = zapis decyzji „dlaczego tak, a nie inaczej"
- **RLS** = Row Level Security = zamki bazodanowe — „user A nie widzi danych user B"
- **FF** = Feature Flag = przełącznik — „włącz nową funkcję bez ryzyka"
- **DoD** = Definition of Done = lista warunków, po których PR jest naprawdę skończony

---

## REGUŁY GLOBALNE (obowiązują od PR-00)

| # | Reguła | Co to znaczy w praktyce |
|---|--------|--------------------------|
| G1 | **Main zawsze deployowalny** | Duże zmiany = feature flag / ukryta ścieżka, nie „broken main" |
| G2 | **No Green, No Finish** | Bez zielonych checków CI nie ma merge |
| G3 | **1 zmiana = 1 PR** | Zero „przy okazji" |
| G4 | **i18n: zero hardcode** | Każdy tekst w PL/EN/UK przez system tłumaczeń |
| G5 | **RLS od razu** | Każda nowa tabela ma RLS i test „2 konta" |
| G6 | **FF_NEW_SHELL od PR-07** | Każdy PR-07..PR-20 musi działać przy fladze ON i OFF |
| G7 | **Scope Fence** | PR dotyka tylko plików zadeklarowanych w planie |
| G8 | **Evidence-First** | Decyzja = dowód (git log / test output / screenshot) |
| G9 | **Max 200-300 LOC** | Wyjątek: migracje, wygenerowany kod |
| G10 | **Język: Polski** | Komunikacja, commity, PR opisy — po polsku |

---

## ZIELONE CHECKLISTY CI (No Green No Finish)

Każdy PR musi zdać PRZED merge:

```
☑ npm run lint          → 0 błędów
☑ npm test              → wszystkie testy zielone
☑ npm run build         → build produkcyjny OK
☑ npm run type-check    → TypeScript strict, 0 błędów
☑ npm audit --audit-level=high → 0 wysokich CVE
```

---

## MAPA FAZY I PR-ów

### PR-00 — Roadmap-as-code *(TEN PR)*

**Faza:** Przed Fazą 0
**Cel:** Wrzucić tę roadmapę do repo jako jedyne źródło prawdy — status, decyzje, DoD dla każdego PR.
**Zakres:** tylko `/docs/**`, `/.github/**`

**DoD:**
- [ ] `docs/ROADMAP.md` istnieje i zawiera PR-00..PR-20
- [ ] `docs/ROADMAP_STATUS.md` z tabelą statusów i checklistami
- [ ] `docs/ADR/` ma 6 nowych ADR (0004–0009) z kluczowymi decyzjami
- [ ] `.github/pull_request_template.md` wskazuje na nową roadmapę
- [ ] Diff nie zawiera zmian poza `/docs` i `/.github`

---

### FAZA 0 — Fundament

#### PR-01 — Tooling Fundamentów

**Cel:** Bramka CI na hardcode i18n + stały monitoring błędów (Sentry) + wersjonowanie.
**Dla laika:** „Alarm gdy ktoś napisze tekst po polsku bez systemu tłumaczeń + rejestr crashy."
**Zakres:** `src/`, `.github/workflows/`, config ESLint

**Kluczowe zmiany:**
- ESLint plugin blokujący hardcoded string poza i18n
- Integracja Sentry (DSN w zmiennych środowiskowych)
- Reguła semantycznego wersjonowania w CI

**DoD:**
- [ ] CI odrzuca PR z hardcoded tekstem poza i18n
- [ ] Sentry rejestruje pierwsze zdarzenie testowe
- [ ] `npm run lint` czyste po zmianach
- [ ] Testy komponentów z hardcoded tekstem zaktualizowane

---

#### PR-02 — Security Baseline + RLS jako standard

**Cel:** Izolacja tenantów — zanim wejdą nowe tabele, standard RLS jest udokumentowany i wymuszony.
**Dla laika:** „User A naprawdę nie zobaczy danych user B — to twarda własność systemu."
**Zakres:** `supabase/migrations/` (nowe), `supabase/functions/_shared/`, `docs/`

**DoD:**
- [ ] Procedura sprawdzenia RLS w CI udokumentowana
- [ ] Test IDOR (2 konta) napisany i zielony
- [ ] Nowa migracja z `enable_rls` dla każdej tabeli bez RLS
- [ ] `docs/SECURITY_RLS_STANDARD.md` istnieje

---

#### PR-03 — Design System + UI States

**Cel:** Spójny wygląd premium + gotowe komponenty: skeleton / empty / error / toast.
**Dla laika:** „Każdy ekran wygląda tak samo, a użytkownik wie co się dzieje (ładowanie, błąd, brak danych)."
**Zakres:** `src/components/ui/`, `src/components/design-system/`, tokeny Tailwind

**DoD:**
- [ ] Tokeny kolorów i typografii w `tailwind.config.ts`
- [ ] Komponenty: `<Skeleton>`, `<EmptyState>`, `<ErrorBoundary>`, `<Toast>`
- [ ] Wszystkie istniejące ekrany korzystają z nowych stanów UI

---

### FAZA 1 — Dostęp i ustawienia

#### PR-04 — Social Login PACK

**Cel:** Google + Apple login + bezpieczny fallback email/hasło.
**Dla laika:** „Logowanie jednym kliknięciem na budowie."
**Zakres:** `src/components/auth/`, `supabase/` (OAuth config)

**Decyzja:** Apple login WYMAGANY (wymóg App Store dla app z social login).

**DoD:**
- [ ] Google OAuth działa (test e2e lub manualny)
- [ ] Apple OAuth działa (test manualny na urządzeniu Apple)
- [ ] Fallback email/hasło działa i jest przetestowany
- [ ] i18n dla wszystkich komunikatów auth

---

#### PR-05 — Profil firmy + Ustawienia + „Usuń konto" + dane do PDF

**Cel:** Logo / NIP / adres / telefon / konto + wymagania RODO i Apple.
**Dla laika:** „Dane firmy trafiają do PDF, a użytkownik może usunąć konto (wymóg Apple i GDPR)."
**Zakres:** `src/components/settings/`, `src/pages/Settings.tsx`, `supabase/functions/delete-user-account/`

**DoD:**
- [ ] Formularz profilu firmy z walidacją Zod
- [ ] Dane firmy widoczne w wygenerowanym PDF
- [ ] Przycisk „Usuń konto" działa i usuwa dane zgodnie z RODO
- [ ] i18n dla wszystkich ekranów ustawień

---

#### PR-06 — Free plan: limit 3 ofert/miesiąc + paywall + haczyk retencyjny

**Cel:** Monetyzacja — limit ofert + paywall + CRM/historia zostają (bo wtedy użytkownik nie kasuje apki).
**Dla laika:** „Darmowy plan: 3 oferty miesięcznie. Po przekroczeniu — propozycja płatności. Ale kontakty i historia zawsze dostępne."
**Zakres:** `src/`, `supabase/migrations/`, `supabase/functions/`

**Kluczowe stałe (niezmienne — patrz ADR-0004):**
```typescript
export const FREE_TIER_OFFER_LIMIT = 3; // oferty/miesiąc
// Liczony po statusie: 'sent' | 'accepted' | 'rejected' — NIE drafty
```

**DoD:**
- [ ] Stała `FREE_TIER_OFFER_LIMIT = 3` w kodzie (nie magic number)
- [ ] Licznik oparty na statusie finalizacji (nie draftach)
- [ ] Paywall modal z wyjaśnieniem i CTA upgrade
- [ ] CRM / historia zawsze dostępne (nie blokowane limitem)
- [ ] Test: po 3 finalnych ofertach 4. jest blokowana

---

### FAZA 2 — Shell aplikacji

#### PR-07 — Shell za flagą FF_NEW_SHELL

**Cel:** Nowa struktura nawigacji bez ryzyka — wszystko przełączalne feature flagiem.
**Dla laika:** „Nowy wygląd apki z bezpiecznym przełącznikiem — jeśli coś nie działa, włączamy stary wygląd."
**Zakres:** `src/components/layout/`, `src/App.tsx`, feature flag system

**⚠️ PIVOT: Od tego PR każdy kolejny (PR-08..PR-20) musi działać przy `FF_NEW_SHELL=ON` i `FF_NEW_SHELL=OFF`.**

**Zawartość:**
- Nowa nawigacja: dolny nav + FAB (Floating Action Button) + „Więcej"
- Home screen (dashboard uproszczony)
- Lekki onboarding (3 kroki, tylko pierwsze logowanie — patrz ADR-0009)

**DoD:**
- [ ] `FF_NEW_SHELL` zaimplementowany jako feature flag
- [ ] Nawigacja działa przy OFF (stara) i ON (nowa)
- [ ] Onboarding 3 kroków pokazuje się tylko raz (localStorage)
- [ ] Testy nawigacji zielone

---

### FAZA 3 — Kotwice danych + oferty (start)

#### PR-08 — CRM + Cennik (Klienci + Biblioteka pozycji)

**Cel:** Baza: kontrahenci + klocki cenowe, zanim powstanie wizard ofert.
**Dla laika:** „Zamiast wpisywać dane klienta za każdym razem — wybierasz z listy. Zamiast pisać ceny od zera — wybierasz z cennika."
**Zakres:** `src/components/`, `supabase/migrations/` (tabele: `clients`, `price_items`)

**DoD:**
- [ ] CRUD klientów z walidacją NIP/adres
- [ ] CRUD pozycji cennika z jednostkami
- [ ] RLS: user widzi tylko swoje dane
- [ ] Test IDOR (2 konta)
- [ ] i18n kompletne

---

#### PR-09 — Oferty A: lista + statusy + filtry + szybkie akcje

**Cel:** Kontrola pipeline — co domknąć, gdzie utknęło.
**Dla laika:** „Lista wszystkich ofert z kolorem statusu i możliwością szybkiej akcji."
**Zakres:** `src/components/offers/`, `src/pages/Offers.tsx`

**Statusy oferty:** `draft` → `sent` → `accepted` | `rejected` | `expired`

**DoD:**
- [ ] Lista z filtrem po statusie i dacie
- [ ] Szybkie akcje: wyślij, duplikuj, archiwizuj
- [ ] Sortowanie (data, wartość, klient)
- [ ] Paginacja lub infinite scroll

---

### FAZA 4 — Oferty jako proces

#### PR-10 — Oferty B1: Wizard bez PDF

**Cel:** UX tworzenia oferty bez ryzyka PDF-owego piekła.
**Dla laika:** „Krok po kroku: klient → pozycje → podsumowanie — i dopiero potem PDF."
**Zakres:** `src/components/offers/wizard/`

**DoD:**
- [ ] Wizard 3-4 kroki: klient / pozycje / podsumowanie / walidacja
- [ ] Zapis jako draft w każdym kroku
- [ ] Walidacja Zod na każdym etapie
- [ ] Test: cały flow bez błędu

---

#### PR-11 — Oferty B2: PDF + podgląd + wysyłka

**Cel:** Render PDF, preview, wysyłka, obsługa błędów.
**Dla laika:** „Kliknij → zobaczysz jak wygląda PDF → wyślij emailem."
**Zakres:** `src/components/offers/`, `supabase/functions/send-offer-email/`

**DoD:**
- [ ] Podgląd PDF (iframe lub nowa karta)
- [ ] Generowanie PDF z danymi oferty i firmy
- [ ] Wysyłka emailem (Resend)
- [ ] Obsługa błędów (brak email klienta, błąd wysyłki)
- [ ] Test end-to-end: stworzono → PDF → wysłano

---

#### PR-12 — Oferty C: domykanie + link akceptacji + bulk add

**Cel:** Konwersja „wysłana → zaakceptowana" + szybkie dodawanie pozycji.
**Dla laika:** „Klient dostaje link i klika 'Akceptuję'. Majster widzi status w czasie rzeczywistym."
**Zakres:** `src/`, `supabase/functions/approve-offer/`

**DoD:**
- [ ] Publiczny link akceptacji (token, bez logowania)
- [ ] Strona akceptacji: podgląd oferty + przycisk
- [ ] Po akceptacji: status → `accepted`, powiadomienie dla majstra
- [ ] Bulk add pozycji z cennika
- [ ] Test IDOR: token nie daje dostępu do innych ofert

---

### FAZA 5 — Projekty i przewagi

#### PR-13 — Projekty: lista + hub + powiązanie z ofertą + QR status

**Cel:** Projekt = centrum realizacji. Klient przestaje dzwonić co 2 dni.
**Dla laika:** „Każdy projekt ma stronę dla klienta z postępem prac — bez logowania, przez link/QR."
**Zakres:** `src/components/projects/`, `supabase/migrations/`

**QR Status dla klienta (patrz ADR-0006):**
- ✅ Etapy prac (lista)
- ✅ Terminy (daty)
- ✅ % postępu
- ❌ Kwoty / ceny (POZA ZAKRESEM — nie pokazujemy klientowi kwot)

**DoD:**
- [ ] CRUD projektów z powiązaniem do oferty
- [ ] Publiczna strona QR dla klienta (token, bez logowania)
- [ ] Aktualizacja postępu przez majstra
- [ ] Test IDOR: token nie daje dostępu do innych projektów

---

#### PR-14 — Burn Bar BASIC

**Cel:** Majster widzi czy zarabia w trakcie, a nie po fakcie.
**Dla laika:** „Pasek postępu: tyle zabudżetowano vs tyle wydano do tej pory."
**Zakres:** `src/components/projects/`, `src/components/finance/`

**Kluczowa decyzja (patrz ADR-0007):**
- Budżet domyślny: z zaakceptowanej oferty netto (edytowalny ręcznie)
- Koszty: materiały + robocizna wprowadzane ręcznie

**DoD:**
- [ ] Burn bar widoczny w hub projektu
- [ ] Budżet = oferta netto (domyślnie) lub ręczny
- [ ] Alert przy >80% budżetu
- [ ] Test: burn bar aktualizuje się po dodaniu kosztu

---

#### PR-15 — Fotoprotokół + Checklist + podpis + uprawnienia OS

**Cel:** Dowody wykonania + podpis — mniej sporów z klientami.
**Dla laika:** „Zdjęcia przed/po + lista kontrolna + podpis klienta w jednym miejscu."
**Zakres:** `src/components/photos/`, Capacitor Camera API

**DoD:**
- [ ] Upload zdjęć z aparatu (Capacitor) i galerii
- [ ] Checklist z krokami odbioru
- [ ] Podpis cyfrowy (canvas)
- [ ] Prawidłowe zapytanie o uprawnienia aparatu (iOS + Android)
- [ ] Zdjęcia zapisane w Supabase Storage

---

#### PR-16 — Teczka dokumentów + eksport + bezpieczny link

**Cel:** Komplet dokumentacji projektu w 30 sekund.
**Dla laika:** „Jedno miejsce na wszystkie dokumenty — pobierz ZIP lub wyślij link klientowi."
**Zakres:** `src/components/documents/`, Supabase Storage

**DoD:**
- [ ] Kategorie dokumentów (umowa, faktura, protokół, inne)
- [ ] Eksport ZIP
- [ ] Bezpieczny link z czasem wygaśnięcia
- [ ] Test: link wygasa po czasie

---

#### PR-17 — Wzory dokumentów (auto-fill + edycja + zapis do teczki)

**Cel:** Umowy/protokoły gotowe i uzupełnione danymi projektu w kilka minut.
**Dla laika:** „Wybierasz wzór → dane projektu się wstawiają → edytujesz → zapisujesz."
**Zakres:** `src/components/documents/templates/`

**DoD:**
- [ ] Min. 3 wzory: umowa o dzieło, protokół odbioru, oferta prosta
- [ ] Auto-fill z danych projektu/klienta/firmy
- [ ] Edycja przed zapisem
- [ ] Zapis do teczki projektu

---

#### PR-18 — Gwarancje + karta PDF + przypomnienia

**Cel:** Gwarancja jako mechanizm retencji i leadów.
**Dla laika:** „Klient dostaje kartę gwarancyjną PDF. Apka sama przypomina 30 i 7 dni przed końcem gwarancji."
**Zakres:** `src/components/`, `supabase/functions/send-expiring-offer-reminders/`

**DoD:**
- [ ] Karta gwarancyjna PDF z danymi projektu
- [ ] Wysyłka karty do klienta emailem
- [ ] Przypomnienia T-30 i T-7 (Supabase scheduled functions)
- [ ] Test: przypomnienie wysyłane w odpowiednim czasie

---

### FAZA 6 — Offline + Stripe (najtrudniejsze na koniec)

#### PR-19 — PWA Offline (minimum)

**Cel:** Piwnica bez zasięgu nie zabija użycia.
**Dla laika:** „Bez internetu nadal widać listę ofert i szczegóły projektu."
**Zakres:** `vite.config.ts` (workbox), Service Worker

**Minimum offline (patrz ADR-0008 — NIE WIĘCEJ):**
- ✅ Read-only: lista ofert (ostatnie 20)
- ✅ Read-only: szczegół projektu
- ❌ Tworzenie/edycja offline (poza zakresem)
- ❌ Synchronizacja konfliktów (poza zakresem)

**DoD:**
- [ ] Service Worker zarejestrowany
- [ ] Cache: lista ofert + szczegół projektu
- [ ] Komunikat „Tryb offline" widoczny
- [ ] Test: wyłącz network → lista ofert widoczna

---

#### PR-20 — Stripe Billing (finalny)

**Cel:** Paywall z PR-06 nie jest ślepą uliczką — płatność naprawdę działa.
**Dla laika:** „Kliknij 'Przejdź na PRO' → formularz Stripe → zapłać → dostęp odblokowany."
**Zakres:** `src/components/billing/`, `supabase/functions/create-checkout-session/`, `supabase/functions/stripe-webhook/`

**DoD:**
- [ ] Checkout Session Stripe (redirect)
- [ ] Webhook: `checkout.session.completed` → aktualizacja planu
- [ ] Upgrade flow: paywall modal → Stripe → powrót do apki
- [ ] Test: zakup testowy (Stripe test mode)
- [ ] Dane finansowe obsłużone zgodnie z RODO

---

## ZALEŻNOŚCI MIĘDZY PR-ami

```
PR-00 (docs)
    └── PR-01 (tooling i18n + Sentry)
        └── PR-02 (security RLS)
            └── PR-03 (design system)
                └── PR-04 (social login)
                    └── PR-05 (profil firmy)
                        └── PR-06 (free plan + paywall)
                            └── PR-07 (shell FF_NEW_SHELL) ← PIVOT
                                ├── PR-08 (CRM + cennik)
                                │   └── PR-09 (oferty lista)
                                │       └── PR-10 (wizard bez PDF)
                                │           └── PR-11 (PDF + wysyłka)
                                │               └── PR-12 (domykanie + akceptacja)
                                │                   └── PR-13 (projekty + QR)
                                │                       ├── PR-14 (burn bar)
                                │                       ├── PR-15 (fotoprotokół)
                                │                       ├── PR-16 (teczka)
                                │                       │   └── PR-17 (wzory)
                                │                       └── PR-18 (gwarancje)
                                └── PR-19 (offline PWA)
PR-20 (Stripe) ← wymaga PR-06 i PR-07
```

---

## ZASADY AKTUALIZACJI TEGO DOKUMENTU

1. Po każdym merge → zaktualizuj `ROADMAP_STATUS.md` (status + link PR + data)
2. Jeśli zmienia się zakres PR → stwórz ADR z uzasadnieniem, zaktualizuj ten plik
3. Nowe PR-y dodaj NA KOŃCU — nie przepisuj istniejących
4. Każda zmiana zakresu musi być zatwierdzona przez Product Ownera
5. Format commitów do tego pliku: `docs: aktualizuj status PR-XX w ROADMAP`

---

*Dokument: v5.0 | Data: 2026-03-01 | Autor: Claude (Tech Lead Majster.AI) | Właściciel: Robert B.*
