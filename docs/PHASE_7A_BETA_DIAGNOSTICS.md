# FAZA 7A – Diagnostyka BETA Modułu Ofert

**Data:** 2025-12-09
**Autor:** Claude Code (Session: 01HDa6VfMgytvCurjQoujG4y)
**Cel:** Przegląd całego modułu ofert przed testami BETA z fachowcami

---

## 1. MAPA CAŁEGO FLOW MODUŁU OFERT

### ETAP 1: Tworzenie Wyceny
**Komponenty:**
- Frontend: `src/hooks/useQuotes.ts` + `QuoteEditor` (nie przeanalizowany szczegółowo)
- Database: `quotes` table (project_id UNIQUE)

**Dane:**
```typescript
{
  positions: QuotePosition[],  // JSONB array
  summary_materials: NUMERIC,
  summary_labor: NUMERIC,
  margin_percent: NUMERIC,
  total: NUMERIC
}
```

**Kluczowe pliki:**
- `src/hooks/useQuotes.ts:29` - `useQuote(projectId)`
- `src/hooks/useQuotes.ts:55` - `useSaveQuote()` (UPSERT logic)

---

### ETAP 2: Konfiguracja Oferty PDF
**Komponenty:**
- Frontend: `PdfPreviewPanel` component
- Hook: `usePdfData(projectId)`, `useSavePdfData()`
- Database: `pdf_data` table (project_id UNIQUE)

**Dane:**
```typescript
{
  version: 'standard' | 'premium',
  title: string,
  offer_text: string,
  terms: string,
  deadline_text: string
}
```

**Kluczowe pliki:**
- `src/hooks/usePdfData.ts:18` - `usePdfData()`
- `src/hooks/usePdfData.ts:37` - `useSavePdfData()` (INSERT or UPDATE logic)
- `src/components/offers/PdfPreviewPanel.tsx:34` - główny komponent

---

### ETAP 3: Generowanie PDF (Phase 5B)
**Komponenty:**
- `PdfPreviewPanel` → button "Generuj PDF"
- `buildOfferData()` - zbiera dane z różnych źródeł
- `generateOfferPdf()` - tworzy PDF blob
- `uploadOfferPdf()` - upload do Supabase Storage

**Storage:**
- Bucket: `offer-pdfs` (prawdopodobnie, nie zweryfikowano)
- Format: `{userId}/{projectId}/offer-{timestamp}.pdf`

**Output:**
- `publicUrl` zapisywany lokalnie w state `generatedPdfUrl`
- Callback `onPdfGenerated(publicUrl)` wywołany w rodzicu

**Kluczowe pliki:**
- `src/components/offers/PdfPreviewPanel.tsx:85` - `handleGeneratePdf()`
- `src/lib/offerDataBuilder.ts` - budowanie payloadu
- `src/lib/offerPdfGenerator.ts` - generowanie i upload

---

### ETAP 4: Wysyłka Email (Phase 5C)
**Komponenty:**
- Frontend: `SendOfferModal` component
- Hooks: `useCreateOfferSend()`, `useUpdateOfferSend()`
- Edge Function: `supabase/functions/send-offer-email/index.ts`

**Flow:**
1. User wypełnia formularz (email, subject, message)
2. Opcjonalnie wybiera template maila (Phase 6B)
3. `useCreateOfferSend()` → INSERT do `offer_sends` (status: 'pending')
4. Edge Function `send-offer-email` → wysyłka przez Resend API
5. `useUpdateOfferSend()` → UPDATE status='sent', tracking_status='sent', pdf_url

**Dane w `offer_sends`:**
```typescript
{
  project_id: UUID,
  client_email: string,
  subject: string,
  message: string,
  status: 'pending' | 'sent' | 'failed',
  tracking_status: 'sent' | 'opened' | 'pdf_viewed' | 'accepted' | 'rejected' | null,
  pdf_url: string | null,
  pdf_generated_at: timestamp | null,
  error_message: string | null,
  sent_at: timestamp
}
```

**Kluczowe pliki:**
- `src/components/offers/SendOfferModal.tsx:28` - główny komponent
- `src/hooks/useOfferSends.ts:42` - `useCreateOfferSend()`
- `supabase/functions/send-offer-email/index.ts:31` - Edge Function

---

### ETAP 5: Statystyki Ofert (Phase 6A)
**Komponenty:**
- Hook: `useOfferStats()` - pobiera wysyłki z ostatnich 30 dni
- Component: `OfferStatsPanel` - wyświetla statystyki

**Metryki:**
```typescript
{
  sentCount: number,           // Liczba wysłanych ofert
  acceptedCount: number,        // Liczba zaakceptowanych
  conversionRate: number,       // % konwersji (zaokrąglone)
  followupCount: number,        // Oferty wymagające follow-up
  followupNotOpened: number,    // Nieotwarte > 3 dni
  followupOpenedNoDecision: number // Otwarte > 7 dni, brak decyzji
}
```

**Logika follow-up:**
- Używa `classifyOfferSendForFollowup()` z `src/lib/offerFollowupUtils.ts`
- Klasyfikacje: no_action_needed, fresh_recent, followup_not_opened, followup_opened_no_decision

**Kluczowe pliki:**
- `src/hooks/useOfferStats.ts:20` - główny hook
- `src/lib/offerFollowupUtils.ts:63` - klasyfikacja follow-up

---

### ETAP 6: Szablony Maili (Phase 6B)
**Komponenty:**
- Lib: `src/lib/offerEmailTemplates.ts`
- `OFFER_EMAIL_TEMPLATES` - array z gotowymi szablonami
- `renderOfferEmailTemplate()` - zamienia placeholdery

**Szablony:**
- general-construction, renovation, plumbing, electrical, roofing, etc.
- Placeholdery: `{client_name}`, `{project_name}`, `{total_price}`, `{deadline}`, `{company_name}`, `{company_phone}`

**Integracja:**
- `SendOfferModal` ma dropdown z wyborem szablonu
- Po wyborze: zastępuje message, resetuje `messageManuallyEdited` flag
- User może dalej edytować wiadomość ręcznie

**Kluczowe pliki:**
- `src/lib/offerEmailTemplates.ts:33` - lista szablonów
- `src/components/offers/SendOfferModal.tsx:78` - `handleTemplateChange()`

---

### ETAP 7: Follow-up i Przypomnienia (Phase 6C)
**Komponenty:**
- Edge Function: `supabase/functions/send-expiring-offer-reminders/index.ts`
- Prawdopodobnie uruchamiana przez cron job (nie zweryfikowano)

**Logika:**
1. Szuka `offer_approvals` z `status='pending'` wygasających za 3 dni
2. Sprawdza czy reminder został już wysłany dzisiaj (LIKE '%przypomnienie%' w subject)
3. Wysyła email przez Resend API
4. Zapisuje w `offer_sends` (status='sent', subject z ⏰)

**Kluczowe pliki:**
- `supabase/functions/send-expiring-offer-reminders/index.ts:20` - główna funkcja
- `supabase/migrations/20251207123630_*.sql` - dodanie `expires_at` do `offer_approvals`

---

### ETAP 8: Akceptacja przez Klienta
**Komponenty:**
- Public page: `/offer/:token` (nie przeanalizowana w tej sesji)
- Hook: `usePublicOfferApproval(token)`, `useSubmitOfferApproval()`
- Edge Function: `supabase/functions/approve-offer/index.ts`

**Flow:**
1. Klient klika link z public_token w mailu
2. GET `/approve-offer` → zwraca dane oferty (quote, project, company)
3. Klient wypełnia formularz (signature, comment)
4. POST `/approve-offer` → action='approve' lub 'reject'
5. Update `offer_approvals` (status, signature_data, approved_at)
6. Update `projects.status = 'Zaakceptowany'`
7. Create notification dla właściciela

**Kluczowe pliki:**
- `supabase/functions/approve-offer/index.ts:20` - Edge Function
- `src/hooks/useOfferApprovals.ts:108` - `usePublicOfferApproval()`

---

## 2. STRUKTURA BAZY DANYCH

### Tabele związane z ofertami:

#### `quotes`
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  positions JSONB NOT NULL DEFAULT '[]',
  summary_materials NUMERIC(12, 2),
  summary_labor NUMERIC(12, 2),
  margin_percent NUMERIC(5, 2),
  total NUMERIC(12, 2),
  created_at TIMESTAMP WITH TIME ZONE
);
```

#### `pdf_data`
```sql
CREATE TABLE pdf_data (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version TEXT DEFAULT 'standard' CHECK (version IN ('standard', 'premium')),
  title TEXT,
  offer_text TEXT,
  terms TEXT,
  deadline_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE
);
```

#### `offer_sends`
```sql
CREATE TABLE offer_sends (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  client_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  tracking_status TEXT,  -- Phase 6A: 'sent', 'opened', 'pdf_viewed', 'accepted', 'rejected'
  pdf_url TEXT,          -- Phase 5C: URL wygenerowanego PDF
  pdf_generated_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `offer_approvals`
```sql
CREATE TABLE offer_approvals (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  public_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  client_name TEXT,
  client_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  signature_data TEXT,
  client_comment TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE
);
```

**RLS Policies:**
- Wszystkie tabele mają RLS enabled
- Użytkownicy widzą tylko swoje dane (auth.uid() = user_id)
- `offer_approvals` ma dodatkowe public policies dla klientów (by token)

---

## 3. ZIDENTYFIKOWANE NIESPÓJNOŚCI I PROBLEMY

### 🔴 KRYTYCZNE (MUSZĄ być naprawione przed BETA)

#### 1. **Brak relacji FK między `offer_sends` a `offer_approvals`**
- **Problem:** Dwie niezależne tabele, brak powiązania
- **Skutek:** Nie wiadomo która wysyłka jest powiązana z którym linkiem do akceptacji
- **Ryzyko:** Confusion w trackingu, trudność w debugowaniu
- **Lokalizacja:** Database schema
- **Priorytet:** HIGH, rozmiar: M (100-200 LOC: migracja + aktualizacja hooków)

#### 2. **`tracking_status` może być NULL - niekonsekwencja**
- **Problem:** Dokumentacja mówi "NULL = treat as sent", ale kod nie zawsze to obsługuje
- **Skutek:** Potencjalne błędy w statystykach i follow-up logic
- **Ryzyko:** Błędne liczby w dashboardzie dla właściciela
- **Lokalizacja:**
  - `supabase/migrations/20251209154608_add_tracking_status_to_offer_sends.sql:14`
  - `src/hooks/useOfferStats.ts:42` (filtruje po tracking_status='accepted')
- **Priorytet:** HIGH, rozmiar: S (50-80 LOC: default value + null handling)

#### 3. **Brak walidacji że quote istnieje przed wysyłką**
- **Problem:** `SendOfferModal` nie sprawdza czy quote jest utworzona
- **Skutek:** User może wysłać pustą ofertę (brak kosztorysu)
- **Ryzyko:** Zły UX, konfuzja klienta
- **Lokalizacja:** `src/components/offers/SendOfferModal.tsx:118`
- **Priorytet:** HIGH, rozmiar: S (20-30 LOC: walidacja + toast)

---

### 🟠 WAŻNE (Powinny być naprawione przed BETA, ale nie blokujące)

#### 4. **SendOfferModal: brak debounce - możliwe duplikaty**
- **Problem:** User może kliknąć "Wyślij" wielokrotnie, tworząc wiele pending records
- **Skutek:** Duplikaty w bazie, potencjalne wielokrotne maile
- **Ryzyko:** Spam do klienta, nieporządek w historii
- **Lokalizacja:** `src/components/offers/SendOfferModal.tsx:118`
- **Priorytet:** MEDIUM, rozmiar: S (10-20 LOC: disable button podczas wysyłki)

#### 5. **send-expiring-offer-reminders: brak idempotentności**
- **Problem:** Sprawdza czy wysłano reminder przez LIKE '%przypomnienie%' w subject
- **Skutek:** Jeśli subject się zmieni lub funkcja uruchomi 2x, wyśle duplikat
- **Ryzyko:** Duplikaty reminderów dla klientów
- **Lokalizacja:** `supabase/functions/send-expiring-offer-reminders/index.ts:114`
- **Priorytet:** MEDIUM, rozmiar: M (80-120 LOC: nowa kolumna reminder_sent_at + migracja)

#### 6. **Brak testów dla Edge Functions**
- **Problem:** Krytyczne funkcje (send-offer-email, approve-offer) nie mają testów
- **Skutek:** Trudność w refactoringu, ryzyko regresji
- **Ryzyko:** Breaking changes w production
- **Lokalizacja:** `supabase/functions/*/index.ts`
- **Priorytet:** MEDIUM, rozmiar: M (150-250 LOC: setup testów + podstawowe test cases)

---

### 🟡 NICE-TO-HAVE (Ulepszenia UX, nie krytyczne)

#### 7. **Performance: useOfferStats pobiera wszystkie rekordy z 30 dni**
- **Problem:** Dla usera z setkami wysyłek może być wolne
- **Skutek:** Opóźnienie w ładowaniu dashboardu
- **Ryzyko:** Zły UX dla power userów
- **Lokalizacja:** `src/hooks/useOfferStats.ts:31`
- **Priorytet:** LOW, rozmiar: M (100-150 LOC: agregacja w DB lub caching)

#### 8. **UX: brak guided flow dla nowych userów**
- **Problem:** User nie wie jaki jest następny krok po utworzeniu wyceny
- **Skutek:** Confusion, opuszczanie narzędzia
- **Ryzyko:** Gorsze onboarding
- **Lokalizacja:** `src/pages/ProjectDetail.tsx`
- **Priorytet:** LOW, rozmiar: M (120-180 LOC: stepper component + state management)

#### 9. **Email templates: potencjalne XSS w placeholderach**
- **Problem:** `renderOfferEmailTemplate()` nie escapuje HTML w wartościach
- **Skutek:** Teoretyczny XSS jeśli user wpisze złośliwy kod w nazwie klienta
- **Ryzyko:** Bardzo niskie (internal tool, trusted users)
- **Lokalizacja:** `src/lib/offerEmailTemplates.ts` (nie przeanalizowano szczegółów implementacji)
- **Priorytet:** LOW, rozmiar: S (30-50 LOC: HTML escape function)

#### 10. **Brak mechanizmu "draft" dla ofert**
- **Problem:** Wszystkie oferty są od razu w statusie "wysłane"
- **Skutek:** Brak możliwości przygotowania oferty bez wysyłania
- **Ryzyko:** User case: chcę przygotować kilka wersji przed wysłaniem
- **Lokalizacja:** Database schema + UI
- **Priorytet:** LOW, rozmiar: M (150-200 LOC: nowy status + UI updates)

---

## 4. LISTA "BETA TODO" – TOP 10 PRIORYTETÓW

### ✅ Zadania do wykonania przed testami BETA

| # | Zadanie | Typ | Priorytet | Rozmiar | Pliki do zmiany |
|---|---------|-----|-----------|---------|-----------------|
| **1** | Naprawić nullable `tracking_status` - dodać default value 'sent' | bugfix | HIGH | S | `supabase/migrations/`, `src/hooks/useOfferStats.ts`, `src/lib/offerFollowupUtils.ts` |
| **2** | Walidacja istnienia quote przed wysyłką oferty | safety | HIGH | S | `src/components/offers/SendOfferModal.tsx` |
| **3** | Debounce/disable w SendOfferModal podczas wysyłki | bugfix | MEDIUM | S | `src/components/offers/SendOfferModal.tsx` |
| **4** | Dodać testy dla send-offer-email Edge Function | safety | MEDIUM | M | `supabase/functions/send-offer-email/index.test.ts` (nowy) |
| **5** | Idempotentność send-expiring-offer-reminders | bugfix | MEDIUM | M | `supabase/functions/send-expiring-offer-reminders/`, migracja `offer_approvals` |
| **6** | Dodać relację offer_sends ↔ offer_approvals | UX polish | MEDIUM | M | `supabase/migrations/`, `src/hooks/useOfferSends.ts`, `src/hooks/useOfferApprovals.ts` |
| **7** | HTML escape w email templates placeholders | safety | LOW | S | `src/lib/offerEmailTemplates.ts` |
| **8** | Performance: cache lub agregacja dla useOfferStats | performance | LOW | M | `src/hooks/useOfferStats.ts`, możliwa nowa tabela cache |
| **9** | Guided flow / stepper dla nowych userów | UX polish | LOW | M | `src/pages/ProjectDetail.tsx`, nowy komponent Stepper |
| **10** | Mechanizm "draft" dla ofert | nice-to-have | LOW | M | Database schema, `src/components/offers/` |

---

## 5. PODSUMOWANIE DIAGNOZY

### ✅ Co działa dobrze:
- **Kompleksowy flow:** Od wyceny do wysyłki do akceptacji - wszystkie etapy są zaimplementowane
- **Phase 6A-6C:** Statystyki, szablony, follow-up - zaawansowane funkcje dodane
- **RLS Security:** Wszystkie tabele mają włączony RLS, polityki są poprawne
- **Testy jednostkowe:** 24 pliki testowe, dobre pokrycie dla hooków
- **Dokumentacja:** Komentarze w kodzie są jasne i szczegółowe

### ⚠️ Co wymaga uwagi:
- **Spójność danych:** Brak relacji FK między kluczowymi tabelami
- **Null handling:** `tracking_status` może być NULL, brak jednolitego traktowania
- **Walidacje:** Brak sprawdzenia czy dane są kompletne przed wysyłką
- **Idempotentność:** Edge Functions nie są w pełni odporne na wielokrotne wywołanie
- **Testowanie:** Brak testów dla krytycznych Edge Functions

### 📊 Ocena gotowości BETA:
**75% gotowe** - Większość funkcjonalności działa, ale wymaga poprawek przed testami z fachowcami.

**Rekomendacja:** Zrealizować zadania #1-#3 (HIGH priority, łącznie ~100-130 LOC) przed rozpoczęciem testów BETA. Zadania #4-#6 (MEDIUM priority) mogą poczekać na feedback od testerów.

---

## 6. NASTĘPNE KROKI

### Faza 7B (po tej diagnozie):
1. Napraw zadania HIGH priority (#1-#3)
2. Wykonaj smoke testy całego flow (ręcznie lub E2E)
3. Deploy do środowiska staging
4. Zbierz feedback od 2-3 power userów (wewnętrzni testerzy)

### Faza 7C (po BETA testach):
1. Przeanalizuj feedback od fachowców
2. Priorytetyzuj nowe zadania (bugs vs features)
3. Napraw krytyczne bugi w trybie hot-fix
4. Zaplanuj iterację 2 (nowe funkcje z feedbacku)

---

**Koniec raportu diagnostycznego**
*Wygenerowano automatycznie przez Claude Code - Phase 7A*
