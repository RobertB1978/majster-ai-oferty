# Retention Rules Foundation (PR-L6)

**Majster.AI — Data Retention Policy Foundation**
Wersja: 1.0 | Data: 2026-04-21 | Status: DRAFT — wymaga zatwierdzenia przez Administratora Danych

> Dokument opisuje podstawy retencji danych wdrożone w PR-L6.
> Pola oznaczone `UNKNOWN` wymagają uzupełnienia przez Administratora Danych / radcę prawnego.

---

## Executive Summary

PR-L6 tworzy fundament retencji danych:
1. **Tabelę `retention_rules`** — rejestr reguł retencji z metadanymi wykonania
2. **Widok administratora** — panel `/admin/retention` widoczny tylko dla roli `admin`
3. **Integrację z cleanup-expired-data** — funkcja edge aktualizuje `last_run_at`/`last_run_status` po każdym przebiegu
4. **10 zaseedowanych reguł** — tylko na podstawie dowodów z repozytorium

---

## Zasady metodologiczne

**Truth Rule (zasada szczerości):**
- Okresy retencji są podawane TYLKO wtedy, gdy istnieje dowód w kodzie lub dokumentacji
- Jeśli brak dowodu → `retention_period_days = NULL`, `deletion_strategy = 'manual_review'`
- Żadne liczby nie są wymyślone

---

## Tabela reguł — stan po PR-L6

| `applies_to` | Domena | Okres retencji | Strategia | Status | Dowód |
|-------------|--------|----------------|-----------|--------|-------|
| `api_keys` | system | **90 dni** | hard_delete | active | `cleanup-expired-data/index.ts:68` — inactive keys |
| `offer_approvals` | offers | **90 dni** | hard_delete | active | `cleanup-expired-data/index.ts:91` — approved/rejected |
| `push_tokens` | system | **180 dni** | hard_delete | active | `cleanup-expired-data/index.ts:116` — inactive tokens |
| `ai_chat_history` | ai | **180 dni** | hard_delete | active | `cleanup-expired-data/index.ts:141` — all history |
| `compliance_audit_log` | compliance | **UNKNOWN** | manual_review | manual | PR-L8: append-only, brak retencji w kodzie |
| `dsar_requests` | compliance | **UNKNOWN** | manual_review | manual | PR-L3: brak logiki usuwania zamkniętych wniosków |
| `terms_acceptances` | legal | **UNKNOWN** | manual_review | manual | PR-L2: brak retencji, prawdopodobnie = czas relacji + 3 lata |
| `user_profiles_organizations` | users | **UNKNOWN** | manual_review | manual | `delete-user-account` edge function istnieje, retencja po zamknięciu UNKNOWN |
| `clients` | clients | **UNKNOWN** | manual_review | manual | ROPA: Majster.AI jako Podmiot Przetwarzający — retencja zależna od DPA z fachowcami |
| `offers_projects` | offers | **UNKNOWN** | manual_review | manual | Wymaga analizy przepisów podatkowych (potencjalnie 5 lat, UNKNOWN) |

---

## Enforcement — stan wdrożenia

### Domeny z działającym enforcement (przez cleanup-expired-data)

| Domena | Mechanizm | Harmonogram |
|--------|-----------|-------------|
| `api_keys` | Edge function hard-delete po 90 dniach | Cron (CRON_SECRET) |
| `offer_approvals` | Edge function hard-delete po 90 dniach | Cron (CRON_SECRET) |
| `push_tokens` | Edge function hard-delete po 180 dniach | Cron (CRON_SECRET) |
| `ai_chat_history` | Edge function hard-delete po 180 dniach | Cron (CRON_SECRET) |

Po każdym uruchomieniu cleanup-expired-data, pole `last_run_at` i `last_run_status` jest
aktualizowane w `retention_rules` dla każdej z powyższych domen. Widoczne w `/admin/retention`.

### Domeny bez automatycznego enforcement (manual_review)

Dla 6 pozostałych domen enforcement jest **celowo niedostępny** — brak precyzyjnych
podstaw prawnych do automatycznego usuwania. Wymagają decyzji Administratora Danych.

**Bloker dla pełnego automation:** brak zdefiniowanej polityki retencji zatwierdzonej prawnie
dla compliance_audit_log, dsar_requests, terms_acceptances, user_profiles, clients, offers_projects.

**PR-L4 (planowany)** może dodać pełną automatyzację dla wybranych domen
po zatwierdzeniu polityki retencji przez Administratora Danych.

---

## Bezpieczeństwo — kontrola dostępu

```
Rola          | SELECT | UPDATE | INSERT | DELETE
------------- |--------|--------|--------|--------
admin         |   ✅   |   ✅   |   ❌   |   ❌
authenticated |   ❌   |   ❌   |   ❌   |   ❌
anon          |   ❌   |   ❌   |   ❌   |   ❌
service_role  |   ✅   |   ✅   |   ✅   |   ✅  (bypass RLS — used by edge functions)
```

INSERT jest możliwy tylko przez service_role (migration/edge function). Zwykli użytkownicy
nie widzą ani nie modyfikują reguł retencji.

---

## Pola UNKNOWN — wymagane decyzje

1. **`compliance_audit_log`** — append-only log audytowy. Prawdopodobna retencja: min. 3 lata
   (wymogi bezpieczeństwa), ale wymaga decyzji prawnej. Nie można automatycznie usuwać bez ryzyka
   utraty dowodów compliance.

2. **`dsar_requests`** — wnioski RODO. SLA = 30 dni na odpowiedź. Retencja po zamknięciu:
   prawdopodobnie 3-6 lat (dowód realizacji praw), ale UNKNOWN.

3. **`terms_acceptances`** — dowód zgody użytkownika. Retencja: czas trwania relacji + 3 lata
   po zakończeniu (typowa praktyka), ale **wymaga zatwierdzenia przez radcę prawnego**.

4. **`user_profiles_organizations`** — dane konta. Powiązane z `delete-user-account` edge function
   (twarde usunięcie na żądanie), ale retencja nieaktywnych kont UNKNOWN.

5. **`clients`** — dane klientów fachowców. Majster.AI jest Podmiot Przetwarzający.
   Retencja zależy od umów DPA z użytkownikami. **Brak tych umów to znana luka (ROPA #3).**

6. **`offers_projects`** — dane biznesowe. Polskie prawo podatkowe wymaga przechowywania
   dokumentów przez 5 lat. Jednak `retention_period_days` wymaga potwierdzenia przez
   radcę prawnego / administratora danych.

---

## Plany przyszłe

| PR | Cel | Priorytet |
|----|-----|-----------|
| PR-L4 | Pełna automatyzacja dla domen z potwierdzonym UNKNOWN → known | Po zatwierdzeniu polityki retencji |
| PR-L7 | Breach register (powiązany z compliance_audit_log) | Wysoki |
| Follow-up | Umowy DPA z użytkownikami (klienci end-clients) | Wysoki — luka prawna |

---

## Rollback

W przypadku konieczności wycofania PR-L6:

```sql
-- Usuń tabelę retention_rules (NIEODWRACALNE — usuwa dane)
-- Wykonać TYLKO po konsultacji z Administratorem Danych
DROP TABLE IF EXISTS public.retention_rules CASCADE;
DROP FUNCTION IF EXISTS public.retention_rules_set_updated_at() CASCADE;
```

Cofnąć integrację w cleanup-expired-data:
- Usunąć funkcję `recordRetentionRun` (linie 24-33)
- Usunąć wywołania `await recordRetentionRun(...)` z bloków try-catch (8 wywołań)

Frontend:
- Usunąć `AdminRetentionPage.tsx`, `useRetentionRules.ts`, `src/types/retention.ts`
- Usunąć route `/admin/retention` z `App.tsx`

---

## Evidence Log

```
Symptom:     Brak zdefiniowanej polityki retencji danych — ROPA wskazała "UNKNOWN" dla większości domen
Dowód:       docs/legal/RECORDS_OF_PROCESSING_ART30.md — kolumna "Status retencji" = UNKNOWN dla 11/15 pozycji
             cleanup-expired-data/index.ts:68,91,116,141 — 4 domeny z hardcoded retention periods
Zmiana:      - Nowa tabela retention_rules (migration 20260421120000)
             - 10 seedowanych reguł opartych wyłącznie na dowodach z kodu
             - Widok admin /admin/retention z listą reguł i last_run_at
             - Integracja cleanup-expired-data: aktualizuje last_run_at/last_run_status
Weryfikacja: Patrz Pass #2 w raporcie końcowym PR-L6
Rollback:    Instrukcja powyżej
```

---

## Metadata

```
Przygotował:    Claude (analiza kodu + implementacja PR-L6)
Data:           2026-04-21
Zatwierdził:    [WYMAGANE — Administrator Danych]
Następny review: Po zatwierdzeniu polityki retencji dla UNKNOWN domen
Powiązane PR:   PR-L9 (data flow map), PR-L10 (ROPA), PR-L4 (future automation)
```
