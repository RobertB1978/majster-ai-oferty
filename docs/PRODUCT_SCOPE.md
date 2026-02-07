# Majster.AI — Product Scope

**Cel**: Definicja modułów aplikacji z priorytetami (MVP vs Enterprise).
**Data**: 4 luty 2026

---

## Core Revenue Flow (PRIORYTET NAJWYŻSZY)

To jest "droga pieniędzy" w aplikacji. Bez tego flow nie ma produktu.

```
Klient → Projekt → Wycena/Oferta (AI) → PDF → Wysyłka email → Akceptacja → Status projektu
```

Każdy krok tego flow musi działać end-to-end na produkcji.

---

## Moduły — MVP (must-have)

### 1. Zarządzanie klientami
**Priorytet**: KRYTYCZNY
**Opis**: CRUD klientów — imię, firma, telefon, email, adres, notatki.
**Pliki**: `src/components/` (clients), Supabase tabele
**Status**: Istnieje, wymaga weryfikacji na produkcji

### 2. Zarządzanie projektami
**Priorytet**: KRYTYCZNY
**Opis**: CRUD projektów powiązanych z klientem — nazwa, opis, lokalizacja, status, budżet.
**Pliki**: `src/components/` (projects), Supabase tabele
**Status**: Istnieje, wymaga weryfikacji na produkcji

### 3. Wyceny i oferty (AI-assisted)
**Priorytet**: KRYTYCZNY
**Opis**: Tworzenie wycen z pomocą AI — materiały, robocizna, marża. Konwersja wyceny do oferty.
**Pliki**: `src/components/offers/`, `supabase/functions/ai-quote-suggestions/`
**Status**: Istnieje, wymaga weryfikacji na produkcji
**AI Providers**: OpenAI / Anthropic / Gemini (konfigurowane przez ENV)

### 4. Generowanie PDF
**Priorytet**: KRYTYCZNY
**Opis**: Generowanie dokumentu PDF z oferty — logo firmy, dane klienta, pozycje, kwoty, warunki.
**Pliki**: Edge Functions + frontend rendering
**Status**: Istnieje, wymaga weryfikacji na produkcji
**Ryzyko**: Wyższe — generowanie PDF to złożony proces

### 5. Wysyłka email
**Priorytet**: KRYTYCZNY
**Opis**: Wysyłka oferty mailem do klienta z linkiem do akceptacji.
**Pliki**: `supabase/functions/send-offer-email/`
**Provider**: Resend (RESEND_API_KEY)
**Status**: Istnieje, wymaga weryfikacji na produkcji
**Zależność**: Edge Function secret RESEND_API_KEY musi być ustawiony

### 6. Akceptacja oferty (publiczny link)
**Priorytet**: KRYTYCZNY
**Opis**: Klient (bez konta w Majster) otwiera link `/offer/<id>`, widzi ofertę, może zaakceptować/odrzucić.
**Pliki**: `src/pages/OfferApproval.tsx`, `supabase/functions/approve-offer/`
**Status**: Istnieje, wymaga weryfikacji na produkcji
**Ryzyko**: CSP frame-ancestors 'none' może blokować jeśli link jest embeddowany

### 7. Autentykacja
**Priorytet**: KRYTYCZNY
**Opis**: Rejestracja, logowanie, reset hasła, zarządzanie sesją.
**Pliki**: `src/components/auth/`, `src/pages/Login.tsx`, `src/pages/Register.tsx`
**Provider**: Supabase Auth
**Status**: Istnieje, wymaga weryfikacji redirect URLs

---

## Moduły — Enterprise (nice-to-have, ale planowane)

### 8. Admin Panel
**Priorytet**: WYSOKI
**Opis**: Konfiguracja systemowa, audit log, zarządzanie użytkownikami, tematyka.
**Pliki**: `src/components/admin/`
**Status**: Istnieje (PR#1, PR#3, PR#6), ACTION_LABELS wymaga i18n

### 9. Multi-tenant (organizacje)
**Priorytet**: WYSOKI
**Opis**: Separacja danych między firmami. Role: owner, admin, member, viewer.
**Pliki**: `src/components/organizations/`, Supabase RLS
**Status**: Struktura istnieje, wymaga audytu RLS

### 10. Billing / Stripe
**Priorytet**: ŚREDNI
**Opis**: Plany subskrypcyjne (Free/Pro/Enterprise), płatności przez Stripe.
**Pliki**: `supabase/functions/create-checkout-session/`, `supabase/functions/stripe-webhook/`, `src/components/billing/`
**Status**: Integracja istnieje w repo, wymaga weryfikacji

### 11. Kalendarz / Harmonogram
**Priorytet**: ŚREDNI
**Opis**: Planowanie wizyt, terminów, przypomnień.
**Pliki**: `src/components/calendar/`
**Status**: Istnieje, wymaga weryfikacji

### 12. Finanse
**Priorytet**: ŚREDNI
**Opis**: Przegląd finansów, koszty, przychody, raporty.
**Pliki**: `src/components/finance/`, `supabase/functions/finance-ai-analysis/`
**Status**: Istnieje, wymaga weryfikacji

### 13. Zespół
**Priorytet**: ŚREDNI
**Opis**: Zarządzanie członkami zespołu, role, uprawnienia.
**Pliki**: `src/components/team/`
**Status**: Istnieje, wymaga weryfikacji

### 14. Marketplace
**Priorytet**: NISKI
**Opis**: Łączenie wykonawców z klientami, oferty publiczne.
**Pliki**: `src/components/marketplace/`
**Status**: Istnieje, wymaga weryfikacji

### 15. Głosowy kreator wycen
**Priorytet**: NISKI
**Opis**: Tworzenie wycen głosem (speech-to-text → AI → wycena).
**Pliki**: `src/components/voice/`, `supabase/functions/voice-quote-processor/`
**Status**: Istnieje, wymaga weryfikacji

### 16. OCR faktur
**Priorytet**: NISKI
**Opis**: Skanowanie faktur (zdjęcie → tekst → dane).
**Pliki**: `supabase/functions/ocr-invoice/`
**Status**: Istnieje, wymaga weryfikacji

### 17. Analiza zdjęć
**Priorytet**: NISKI
**Opis**: AI analiza zdjęć z budowy/remontu.
**Pliki**: `supabase/functions/analyze-photo/`, `src/components/photos/`
**Status**: Istnieje, wymaga weryfikacji

---

## Moduły — Infrastruktura (nie widoczne dla użytkownika, ale konieczne)

### 18. Security hardening
- Rate limiting na Edge Functions
- Captcha/Turnstile (opcjonalnie)
- Audit log (istnieje)
- Secrets hygiene

### 19. Observability
- Sentry error tracking (konfiguracja istnieje)
- CSP report endpoint (Edge Function istnieje)
- Bundle analysis (workflow istnieje)

### 20. Legal (RODO/PL/UE)
- Polityka prywatności (komponent istnieje)
- Regulamin (komponent istnieje)
- Cookie consent (TODO)
- Data export/delete (Edge Function istnieje)

### 21. Internationalization (i18n)
- PL/EN support (i18next)
- Status: ~70% pokrycia, wymaga domknięcia (PR#03, PR#4B)

---

## Priorytety — podsumowanie

| Priorytet | Moduły | Status |
|-----------|--------|--------|
| KRYTYCZNY | 1-7 (Core Revenue Flow + Auth) | Istnieją, wymagają weryfikacji produkcyjnej |
| WYSOKI | 8-9 (Admin, Multi-tenant) | Istnieją, wymagają doszlifowania |
| ŚREDNI | 10-13 (Billing, Calendar, Finance, Team) | Istnieją, wymagają weryfikacji |
| NISKI | 14-17 (Marketplace, Voice, OCR, Photos) | Istnieją, mogą poczekać |
| INFRASTRUKTURA | 18-21 (Security, Observability, Legal, i18n) | Częściowo, wymaga pracy |

---

_Ten dokument definiuje co jest "core" a co "nice-to-have". Każda decyzja o priorytecie prac powinna się tu odwoływać._
