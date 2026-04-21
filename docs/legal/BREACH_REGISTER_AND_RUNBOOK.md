# Rejestr Naruszeń Danych Osobowych — Opis i Runbook Operacyjny

**Projekt:** Majster.AI  
**Status dokumentu:** Aktywny  
**Podstawa prawna:** RODO art. 33, 34; ustawa z dnia 10 maja 2018 r. o ochronie danych osobowych  
**Ostatnia aktualizacja:** 2026-04-21  
**Właściciel dokumentu:** Administrator systemu / IOD (jeśli powołany)

---

## 1. Co rejestr śledzi — i czego nie śledzi

### Co jest faktem (rejestrowane obiektywnie):
- **detected_at** — kiedy incydent został wykryty przez organizację
- **title / description** — co się stało (opis zdarzenia, nie ocena prawna)
- **severity** — poziom zagrożenia: `low | medium | high | critical`
- **status** — etap obsługi incydentu
- **report_deadline_at** — 72h deadline liczony od `detected_at`
- **reported_to_authority** — czy zgłoszono do organu nadzorczego (wartość boolean)
- **reported_at** — kiedy zgłoszono
- **authority_name** — do jakiego organu
- **impact_summary** — wstępna ocena zakresu naruszenia (liczba osób, kategorie danych)
- **containment_actions** — podjęte działania ograniczające szkody

### Co jest oceną (wymaga decyzji ludzkiej):
- Czy incydent spełnia definicję "naruszenia danych osobowych" wg art. 4(12) RODO
- Czy naruszenie "może powodować ryzyko dla praw i wolności osób fizycznych"
- Czy naruszenie "może powodować wysokie ryzyko" (→ obowiązek informowania osób)
- Czy zastosowanie ma wyjątek z art. 33 ust. 1 (brak ryzyka → brak obowiązku zgłoszenia)
- Końcowy wybór: zgłosić do UODO / nie zgłaszać / poinformować osoby

**System nie wydaje automatycznych decyzji prawnych.** Pole `reported_to_authority` rejestruje decyzję podjętą przez uprawnioną osobę, nie jest obliczane automatycznie.

---

## 2. Reguła 72 godzin (art. 33 RODO)

### Zasada:
Administrator ma **72 godziny od wykrycia naruszenia** na zgłoszenie go do organu nadzorczego (w Polsce: UODO — Urząd Ochrony Danych Osobowych), **jeżeli naruszenie może powodować ryzyko dla praw i wolności osób fizycznych**.

### Jak działa w systemie:
- `report_deadline_at` jest ustawiany automatycznie jako `detected_at + 72h`
- Widok admin pokazuje: pozostałe godziny LUB "termin przekroczony o X h"
- Termin jest **orientacyjny dla celów operacyjnych** — liczy się rzeczywista data/godzina wykrycia, którą operator wpisuje

### Ważne zastrzeżenia:
- Jeśli incydent jest oceniany jako `false_positive` — termin nie ma zastosowania
- Jeśli incydent zostanie zamknięty jako `low` severity bez ryzyka — decyzja o braku zgłoszenia powinna być udokumentowana w polu `containment_actions`
- 72h **nie** oznacza, że każdy incydent musi być zgłoszony — tylko te z ryzykiem dla osób


---

## 3. Statusy incydentu — znaczenie operacyjne

| Status | Znaczenie |
|--------|-----------|
| `open` | Incydent wykryty, ocena w toku — działaj pilnie |
| `assessment` | Trwa analiza zakresu i ryzyka |
| `contained` | Naruszenie opanowane, ryzyko ograniczone |
| `reported` | Zgłoszono do organu nadzorczego |
| `closed` | Sprawa zamknięta, dokumentacja kompletna |
| `false_positive` | Zdarzenie przeanalizowane — nie było naruszeniem danych osobowych |

### Kiedy używać `assessment`:
Gdy nie masz jeszcze pełnych informacji o:
- zakresie danych (których kategorii dotyczy)
- liczbie osób, których dane zostały naruszone
- czy nastąpił nieuprawniony dostęp vs. tylko utrata dostępności

Incydent **może pozostawać w `assessment` przez część 72h**, ale musi zostać rozstrzygnięty przed upływem terminu.

---

## 4. Praktyczny step-by-step runbook

### Krok 1: Wykrycie incydentu (T+0)

1. Wejdź do panelu admin → **Rejestr naruszeń** (`/admin/breach`)
2. Kliknij „Nowy incydent"
3. Wypełnij:
   - **Tytuł** — krótki, faktyczny opis (np. "Błędne wyświetlanie danych klienta X użytkownikowi Y")
   - **Opis** — co dokładnie się stało, kiedy, jak zostało wykryte
   - **Poziom zagrożenia** — wstępna ocena:
     - `low` = brak dostępu zewnętrznego, minimalne dane
     - `medium` = potencjalny wgląd, dane nizkiego ryzyka
     - `high` = dostęp do danych wrażliwych lub dużej grupy
     - `critical` = szeroki wyciek, dane szczególnej kategorii
   - **Wykryto** — rzeczywista data/godzina wykrycia (nie rejestracji!)
4. Zapisz → system ustawi `report_deadline_at = detected_at + 72h`

### Krok 2: Ocena (T+0 do T+48h)

1. Zbierz fakty:
   - Jakie kategorie danych osobowych? (imiona, emaile, hasła, dane finansowe, zdrowotne?)
   - Ilu użytkowników dotkniętych?
   - Czy nastąpił nieuprawniony **dostęp** czy tylko **utrata dostępności**?
   - Czy masz dowód na to, że dane trafiły do nieuprawnionej osoby?
2. Zaktualizuj status na `assessment` jeśli analiza trwa
3. Uzupełnij `impact_summary` i `containment_actions`

### Krok 3: Decyzja o zgłoszeniu (T+48h, max T+72h)

Decyzję podejmuje administrator danych (Robert / IOD jeśli powołany):

**Scenariusz A — Brak ryzyka → brak zgłoszenia:**
- Zaktualizuj status → `contained` lub `closed`
- W `containment_actions` zapisz uzasadnienie braku zgłoszenia:
  np. "Incydent dotyczył tylko danych publicznie dostępnych, brak ryzyka dla osób"

**Scenariusz B — Ryzyko → zgłoś do UODO:**
- Zarejestruj zgłoszenie na [uodo.gov.pl](https://uodo.gov.pl) (formularz online)
- Po zgłoszeniu: zaktualizuj `reported_to_authority = Tak`, `authority_name = UODO`, `reported_at = teraz`
- Zaktualizuj status → `reported`

**Scenariusz C — Wysokie ryzyko → poinformuj też osoby (art. 34 RODO):**
- Najpierw kroki z Scenariusza B
- Następnie przygotuj komunikat dla osób dotkniętych naruszeniem (poza zakresem tego PR)

### Krok 4: Zamknięcie

1. Po zakończeniu wszystkich działań → status `closed`
2. Upewnij się, że `containment_actions` zawiera pełny zapis podjętych kroków
3. Każda zmiana jest logowana w `compliance_audit_log`


---

## 5. Ślad audytowy — co jest automatycznie logowane

Każda operacja na rejestrze generuje wpis w `compliance_audit_log`:

| Zdarzenie | Event type | Kiedy |
|-----------|-----------|-------|
| Rejestracja incydentu | `breach.created` | Po utworzeniu nowego rekordu |
| Zmiana statusu | `breach.status_changed` | Po każdej aktualizacji statusu |
| Oznaczenie zgłoszenia | `breach.report_marked` | Po zmianie `reported_to_authority` |
| Zamknięcie | `breach.closed` | Gdy status = `closed` lub `false_positive` |

Logi są **append-only** (nie można ich usunąć ani edytować) i przechowywane w tabeli `compliance_audit_log`.

---

## 6. Co ta implementacja NIE obejmuje (follow-up)

| Funkcja | Szacunek LOC | Powód odroczenia |
|---------|-------------|-----------------|
| Automatyczne przypomnienia emailem przy zbliżającym się terminie | ~50 LOC + Edge Function | Wymaga konfiguracji silnika email; zdefiniowany osobny PR |
| Pełny formularz UODO (strukturyzowany) | ~80 LOC | Wymaga aktualizacji formularza UODO — decyzja procesu |
| Informowanie osób dotkniętych naruszeniem (art. 34) | ~60 LOC | Wymaga szablonów komunikatów, zgody UX |
| Historia zmian per-incydent (timeline) | ~40 LOC | Wygodne ale nieobowiązkowe w tym etapie |
| Eksport PDF rejestru | ~30 LOC | Narzędzie operacyjne na późniejszy etap |

---

## 7. Rollback

Aby cofnąć tę zmianę:

```sql
-- Usuń tabelę (TYLKO w środowisku non-prod, nigdy na prod z danymi)
DROP TABLE IF EXISTS public.data_breaches;
DROP FUNCTION IF EXISTS public.set_data_breaches_updated_at();
```

Na produkcji: jeśli tabela jest pusta → można bezpiecznie usunąć.  
Jeśli tabela zawiera dane → **nie usuwaj bez zgody administratora** — dane są dowodem prawnym.

Plik kodu do usunięcia:
- `supabase/migrations/20260421130000_pr_l7_breach_register.sql`
- `src/types/breach.ts`
- `src/hooks/useBreaches.ts`
- `src/components/admin/BreachRegister.tsx`
- `src/pages/admin/AdminBreachPage.tsx`
- Revert w `src/App.tsx` (usunąć import i route `breach`)
- Revert w `src/types/audit.ts` (usunąć `breach.*` event types)

---

## 8. Kontakt / eskalacja

W razie wątpliwości co do obowiązku zgłoszenia:
- **IOD/DPO** (jeśli powołany w organizacji)
- **UODO infolinia:** +48 606 950 000 (linia dla administratorów)
- **UODO portal:** [uodo.gov.pl/pl/p/kontakt](https://uodo.gov.pl/pl/p/kontakt)

Ten dokument nie zastępuje porady prawnej. Ostateczne decyzje podejmuje administrator danych.

