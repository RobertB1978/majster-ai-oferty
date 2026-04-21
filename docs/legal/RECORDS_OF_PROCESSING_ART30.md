# Rejestr Czynności Przetwarzania (Art. 30 RODO)

**Majster.AI — Records of Processing Activities (RoPA)**
Wersja: 1.0 | Data: 2026-04-21 | Status: DRAFT — wymaga zatwierdzenia przez Administratora

> Dokument sporządzony na podstawie analizy kodu źródłowego repozytorium.
> Pola oznaczone `UNKNOWN` wymagają uzupełnienia przez Administratora Danych.
> Nie stanowi porady prawnej.

---

## Executive Summary

Majster.AI przetwarza dane osobowe użytkowników (fachowców budowlanych, remontowych)
oraz ich klientów (dane kontaktowe podawane przy wycenach). Platforma działa w modelu SaaS,
gdzie Majster.AI pełni rolę **Administratora** danych swoich użytkowników oraz **Podmiotu
Przetwarzającego** w stosunku do danych klientów użytkowników (end-clientów).

Główne systemy: Supabase (PostgreSQL/Auth), Resend (e-mail), OpenAI/Anthropic/Gemini (AI),
Vercel (hosting frontendowy).

---

## Tabela Czynności Przetwarzania

| # | Czynność przetwarzania | Cel przetwarzania | Kategorie danych | Osoby, których dane dot. | Rola Majster.AI | Systemy / Podprzetwarzający | Status retencji | Dowód w repozytorium | Uwagi / UNKNOWN |
|---|----------------------|-------------------|-----------------|--------------------------|-----------------|----------------------------|-----------------|----------------------|-----------------|
| 1 | Rejestracja i uwierzytelnianie użytkowników | Świadczenie usługi SaaS, weryfikacja tożsamości | E-mail, hash hasła, token sesji, metadane logowania | Użytkownicy (fachowcy) | **Administrator** | Supabase Auth (EU region UNKNOWN) | UNKNOWN — brak zdefiniowanej polityki retencji | `supabase/migrations/`, `src/contexts/AuthContext.tsx` | Region Supabase do potwierdzenia; retencja po usunięciu konta UNKNOWN |
| 2 | Profil firmy i dane firmowe | Personalizacja usługi, generowanie dokumentów PDF | Nazwa firmy, adres, NIP, telefon, logo, dane kontaktowe | Użytkownicy | **Administrator** | Supabase PostgreSQL | UNKNOWN | `src/pages/legal/`, tabela `organizations` w migracjach | Czy NIP traktowany jako dane osobowe — do oceny prawnej |
| 3 | Zarządzanie danymi klientów użytkownika | Umożliwienie tworzenia wycen i ofert | Imię/nazwisko klienta, e-mail, telefon, adres | Klienci użytkowników (end-clienty) | **Podmiot Przetwarzający** | Supabase PostgreSQL | UNKNOWN | `src/components/` obszar clients/quotes | Brak umowy powierzenia z użytkownikami — **do uzupełnienia** |
| 4 | Generowanie wycen i ofert | Podstawowa funkcjonalność platformy | Dane klienta, dane projektu, kwoty finansowe | Klienci użytkowników | **Podmiot Przetwarzający** | Supabase PostgreSQL, generacja PDF | UNKNOWN | `src/components/offers/`, `supabase/functions/` | — |
| 5 | Wysyłka e-mail (oferty, powiadomienia) | Dostarczenie ofert, powiadomień systemowych | E-mail odbiorcy, treść oferty | Klienci użytkowników, użytkownicy | **Podmiot Przetwarzający** / Administrator | Resend (resend.com) | UNKNOWN | `supabase/functions/send-offer-email/` | Resend: sprawdzić DPA i region przechowywania |
| 6 | Przetwarzanie AI (generowanie treści wycen) | Automatyzacja tworzenia wycen przez AI | Dane projektu, opisy prac (mogą zawierać dane os.) | Użytkownicy, pośrednio klienci | **Administrator** / Podmiot Przetwarzający | OpenAI / Anthropic / Gemini (konfigurowalny) | Zgodnie z polityką dostawcy AI | `supabase/functions/ai-quote-suggestions/`, `supabase/functions/ai-chat-agent/` | Dane wysyłane do zewn. API AI — **wymagana ocena DPA z każdym dostawcą** |
| 7 | OCR faktur i analiza zdjęć | Automatyczne przetwarzanie dokumentów | Treść faktur (mogą zawierać dane os.), zdjęcia | Użytkownicy | **Administrator** | OpenAI (Vision) / Gemini | Zgodnie z polityką dostawcy | `supabase/functions/ocr-invoice/`, `supabase/functions/analyze-photo/` | UNKNOWN — czy dane z OCR są logowane/przechowywane? |
| 8 | Logi audytowe | Bezpieczeństwo, compliance, ślad dostępu | ID użytkownika, typ zdarzenia, timestamp, metadane | Użytkownicy | **Administrator** | Supabase PostgreSQL (tabela `audit_log`) | UNKNOWN | `src/hooks/useAuditLog.ts`, `docs/legal/HARD_AUDIT_LOG_FOUNDATION.md` | Retencja logów audytowych do zdefiniowania |
| 9 | Obsługa żądań praw podmiotów (DSAR) | Realizacja praw RODO (dostęp, usunięcie, etc.) | E-mail, treść żądania, historia korespondencji | Użytkownicy | **Administrator** | Supabase PostgreSQL (tabela `dsar_requests`) | UNKNOWN | `src/hooks/useDsarRequests.ts`, `docs/legal/DSAR_INBOX_WORKFLOW.md` | Workflow zdefiniowany, retencja zamkniętych spraw UNKNOWN |
| 10 | Śledzenie akceptacji regulaminów | Dowód zgody, compliance | E-mail, timestamp akceptacji, wersja regulaminu/PP | Użytkownicy | **Administrator** | Supabase PostgreSQL (tabela `terms_acceptances`) | UNKNOWN | `docs/legal/TERMS_ACCEPTANCE_BINDING.md` | — |
| 11 | Zarządzanie subskrypcją i płatnościami | Obsługa rozliczeń | Dane płatnicze (zakres UNKNOWN), e-mail | Użytkownicy | **Administrator** | UNKNOWN (dostawca płatności nie zidentyfikowany w repo) | UNKNOWN | `src/components/billing/` | **Dostawca płatności nieznany** — wymaga uzupełnienia |
| 12 | Zarządzanie kalendarzem i zadaniami | Planowanie prac | Daty, opisy zadań (mogą zawierać dane os.) | Użytkownicy | **Administrator** | Supabase PostgreSQL | UNKNOWN | `src/components/calendar/` | — |
| 13 | Dane głosowe (transkrypcja) | Ułatwienie tworzenia wycen głosowo | Nagranie głosowe, transkrypt | Użytkownicy | **Administrator** | OpenAI Whisper / inny | Zgodnie z polityką dostawcy | `supabase/functions/voice-quote-processor/` | Dane głosowe = wrażliwe w kontekście przetwarzania — **ocena prawna wymagana** |
| 14 | Marketplace (łączenie z klientami) | Pozyskiwanie zleceń | Dane profilu firmy, ogłoszenia | Użytkownicy, potencjalni klienci | **Administrator** | Supabase PostgreSQL | UNKNOWN | `src/components/marketplace/` | — |
| 15 | Mapy i lokalizacja | Wyświetlanie zasięgu działania | Współrzędne geograficzne (jeśli podane) | Użytkownicy | **Administrator** | Leaflet (lokalny), dane lokalizacji przechowywane w Supabase | UNKNOWN | `src/components/map/` | Leaflet nie wysyła danych do zewn. serwerów — OK |

---

## Zidentyfikowani Podprzetwarzający (summary)

Szczegóły w: `docs/legal/SUBPROCESSORS_REGISTRY_AND_DPA.md`

| Podprzetwarzający | Cel | Dane przekazywane | DPA podpisane | Region |
|------------------|-----|-------------------|---------------|--------|
| Supabase Inc. | Baza danych, auth, storage | Wszystkie dane platformy | UNKNOWN | UNKNOWN |
| Resend Inc. | Wysyłka e-mail | E-mail odbiorcy, treść wiadomości | UNKNOWN | UNKNOWN |
| OpenAI / Anthropic / Gemini | Przetwarzanie AI | Dane projektów, opisy (konfigurowalny) | UNKNOWN | USA |
| Vercel Inc. | Hosting frontend | Logi dostępu, adresy IP | UNKNOWN | UNKNOWN |

---

## Znane Luki — Wymagające Działania

1. **Umowy powierzenia z użytkownikami** — użytkownicy są de facto procesorami danych swoich klientów przez platformę. Brak mechanizmu DPA user ↔ Majster.AI.
2. **Region Supabase** — nie zidentyfikowano konfiguracji regionu w repo. Wymaga sprawdzenia w panelu Supabase.
3. **Dostawca płatności** — nieznany. Konieczne uzupełnienie.
4. **Retencja danych** — brak zdefiniowanej polityki retencji dla większości kategorii.
5. **DPA z dostawcami AI** — wysyłanie danych do OpenAI/Anthropic/Gemini wymaga DPA i oceny transferu.

---

## Metadata

```
Przygotował:    Claude (analiza automatyczna kodu)
Data:           2026-04-21
Zatwierdził:    [WYMAGANE — Administrator Danych]
Następny review: UNKNOWN
Podstawa prawna: Art. 30 RODO (Rozporządzenie 2016/679)
```
