# GATE 1 — MANUAL QA CHECKLIST

**Data:** 2026-03-16
**Weryfikator:** Claude Sonnet 4.6
**Metoda:** Analiza statyczna kodu (READ-ONLY). Testy manualne na urządzeniu NIE zostały przeprowadzone.

> **WAŻNE:** §24 roadmapy ("Quick Mode — Definition of Done UX") mówi wprost:
> _"Agent NIE może zamknąć Quick Mode jako 'done' na podstawie samego kodu. Wymaga ręcznego testu na prawdziwym telefonie."_
>
> Wszystkie scenariusze oznaczone `NOT TESTED` wymagają ręcznej weryfikacji przez Ownera lub testera na prawdziwym urządzeniu mobilnym (390px).

---

## Scenariusz 1: Quick Mode — zbieranie danych jedną ręką

**Warunek Gate 1:** _Fachowiec może zebrać dane w Quick Mode jedną ręką na mobile_

### Kroki do wykonania (dla ręcznego testera)
1. Zaloguj się na konto testowe
2. Przejdź do `/app/quick-mode`
3. Obserwuj co jest widoczne bez scrollowania (above the fold) na 390px
4. Dodaj zdjęcie (tap Aparat lub Galeria)
5. Wpisz notatkę tekstową
6. Wpisz imię i telefon klienta
7. Zaznacz przynajmniej jeden element checklisty
8. Sprawdź czy CTA ("Mam wszystko — zaczynam wycenę") staje się aktywny
9. Zmierz czas całej operacji stopwatchem

| # | Krok weryfikacji | Wynik | Źródło dowodu |
|---|-----------------|-------|---------------|
| 1.1 | Route `/app/quick-mode` dostępny i renderuje stronę | **NOT TESTED** | Kod: App.tsx:270 `<Route path="quick-mode" element={<QuickMode />} />` |
| 1.2 | Max 5 elementów interaktywnych above the fold na 390px | **NOT TESTED** | Kod: QuickMode.tsx — 4 sekcje (Photo, Note, Client, Checklist) + header |
| 1.3 | PhotoCapture: zdjęcie w max 3 tapnięciach | **NOT TESTED** | Kod: `src/components/field-capture/PhotoCapture.tsx` |
| 1.4 | TextNote: widoczna na pierwszym ekranie bez scrolla | **NOT TESTED** | Kod: QuickMode.tsx:368 `<TextNote minRows={2} />` — jest na ekranie |
| 1.5 | Client: 2 pola (imię + telefon), touch target min 48px | **PARTIAL** | Kod: QuickMode.tsx:394-420 `className="min-h-[48px]"` na obu inputach |
| 1.6 | ChecklistPanel: widoczna na ekranie | **NOT TESTED** | Kod: QuickMode.tsx:428-433 — sekcja checklisty |
| 1.7 | CTA disabled gdy brak klienta + kontekstu | **PARTIAL** | Kod: QuickMode.tsx:470 `disabled={!canTransitionToFull \|\| transitioning}` — guard z §19.3 |
| 1.8 | Tooltip + inline hint przy disabled CTA | **PARTIAL** | Kod: QuickMode.tsx:447-492 — AlertCircle hint + TooltipContent |
| 1.9 | Cały formularz w 90 sekund (benchmark §24) | **NOT TESTED** | Wymaga stopwatch na prawdziwym telefonie — §24 DoD #1 |
| 1.10 | One-hand UX — kciuk dosięga wszystkich elementów na 390px | **NOT TESTED** | Wymaga testu manualnego na telefonie — §24 DoD #10 |

**Werdykt scenariusza:** PARTIAL — kod spełnia wymogi strukturalne, brak testu manualnego na telefonie

---

## Scenariusz 2: Quick→Full — ciągłość danych

**Warunek Gate 1:** _Quick→Full: draft_id stały, zero utraty danych_

### Kroki do wykonania (dla ręcznego testera)
1. Wejdź do Quick Mode, wypełnij dane (zdjęcie, notatka, klient, checklist)
2. Kliknij CTA "Mam wszystko — zaczynam wycenę"
3. Sprawdź czy pojawia się context panel w QuickEstimateWorkspace
4. Odśwież stronę w QuickEstimateWorkspace
5. Sprawdź czy context panel nadal jest widoczny

| # | Krok weryfikacji | Wynik | Źródło dowodu |
|---|-----------------|-------|---------------|
| 2.1 | draft_id stabilny przez cały czas (nie zmienia się przy update polach) | **PASS** | Testy: `DraftContext.test.tsx:83` "draft_id is stable across multiple field updates" |
| 2.2 | draft_id stabilny po transitionToFull() | **PASS** | Testy: `DraftContext.test.tsx:106` "draft_id is stable after transitionToFull()" |
| 2.3 | mode zmienia się quick→full, full→quick zablokowane | **PASS** | Testy: `DraftContext.test.tsx:121,129` mode transitions |
| 2.4 | Po przejściu do Full Mode: imię i telefon klienta widoczne | **NOT TESTED** | Kod: `QuickEstimateWorkspace.tsx:324-333` context panel pokazuje client.tempName + tempPhone |
| 2.5 | Po przejściu do Full Mode: notatka widoczna | **NOT TESTED** | Kod: `QuickEstimateWorkspace.tsx:336-340` context panel pokazuje fieldCapture.textNote |
| 2.6 | Po przejściu do Full Mode: liczba zdjęć widoczna | **NOT TESTED** | Kod: `QuickEstimateWorkspace.tsx:342-348` context panel pokazuje photos.length |
| 2.7 | Po przejściu do Full Mode: checklist widoczna | **PARTIAL** | Kod: QuickEstimateWorkspace nie wyświetla checklist w context panelu — dane zachowane w IDB ale nie pokazane |
| 2.8 | Dane przeżywają reload strony (IDB persistence) | **PASS** | Testy: `DraftContext.test.tsx:177` "hydration from IDB restores the same draft after reload" |
| 2.9 | sourceContext.createdFrom pozostaje 'quick-mode' po transition | **PASS** | Kod: `DraftContext.tsx:270` "sourceContext.createdFrom intentionally stays 'quick-mode'" |
| 2.10 | DraftProvider w App root — shared state między stronami | **PASS** | Kod: `App.tsx:183` `<DraftProvider>` owijający wszystkie protected routes |

**Werdykt scenariusza:** PARTIAL — draft_id stabilny, IDB persistence działa, context panel istnieje; checklist brak w panelu, brak testu manualnego

---

## Scenariusz 3: PDF — jakość i zgodność z §26.1

**Warunek Gate 1:** _PDF generuje się (jsPDF prestige), wygląda profesjonalnie, A4 poprawny_

### Kroki do wykonania (dla ręcznego testera)
1. Stwórz ofertę z min 3 pozycjami i danymi firmy
2. Wygeneruj PDF (wyślij ofertę)
3. Sprawdź wygląd PDF w każdym z 3 szablonów
4. Zmierz czy strona jest A4 (210×297mm)

| # | Krok weryfikacji | Wynik | Źródło dowodu |
|---|-----------------|-------|---------------|
| 3.1 | jsPDF jako silnik PDF (nie @react-pdf/renderer) | **PASS** | Kod: `offerPdfGenerator.ts:13` `import jsPDF from 'jspdf'` |
| 3.2 | Format A4 portrait | **PASS** | Kod: `offerPdfGenerator.ts:137-141` `format: 'a4'`, `orientation: 'portrait'` |
| 3.3 | JetBrains Mono dla kwot pieniężnych | **PASS** | Kod: `offerPdfGenerator.ts:34-47` `registerJetBrainsMono()`, `src/lib/jetbrains-mono-b64.ts` |
| 3.4 | QR kod z linkiem do oferty online | **PASS** | Kod: `offerPdfGenerator.ts:253-275` `QRCode.toDataURL()`, 28×28mm |
| 3.5 | Amber highlighting dla sumy brutto | **PASS** | Kod: `offerPdfGenerator.ts:88-89` `summaryBg: AMBER_50`, `grossAccent: AMBER_700` |
| 3.6 | Alternating rows w tabeli | **PASS** | Kod: `TEMPLATE_THEMES` — `alternateRowFill` w classic/modern/minimal |
| 3.7 | Header z danymi firmy (nazwa, NIP, adres, kontakt) | **PASS** | Kod: `offerPdfGenerator.ts:158-247` — header logic dla każdego szablonu |
| 3.8 | Footer: ważność oferty + strona X/Y | **PASS** | Kod: `offerPdfGenerator.ts:627-659` `Str. pageNum / totalPages`, `Ważna do:` |
| 3.9 | 3 szablony: classic, modern, minimal | **PASS** | Kod: `offerPdfGenerator.ts:81-111` `TEMPLATE_THEMES: Record<PdfTemplateId, TemplateTheme>` |
| 3.10 | PDF wygląda profesjonalnie — weryfikacja wizualna | **NOT TESTED** | Wymaga generacji i oceny wzrokowej — brak screenshots w `docs/screenshots/gate1/` |

**Werdykt scenariusza:** PARTIAL — wszystkie cechy obecne w kodzie, brak dowodu wizualnego (screenshota PDF)

---

## Scenariusz 4: Send flow — klient dostaje link bez logowania

**Warunek Gate 1:** _Oferta wysłana, klient dostaje link, działa bez logowania_

### Kroki do wykonania (dla ręcznego testera)
1. Wyślij ofertę z email klienta
2. Sprawdź czy status zmienił się na SENT
3. Skopiuj publiczny link do oferty
4. Otwórz link w trybie incognito (bez logowania)
5. Sprawdź czy oferta wyświetla się i można ją zaakceptować

| # | Krok weryfikacji | Wynik | Źródło dowodu |
|---|-----------------|-------|---------------|
| 4.1 | useSendOffer: DRAFT→SENT transition | **PASS** | Kod: `useSendOffer.ts:79-89` `.update({ status: 'SENT' }).eq('status','DRAFT')` |
| 4.2 | Idempotencja: ponowne wysłanie SENT oferty = brak zmiany | **PASS** | Kod: `useSendOffer.ts:67-75` early return dla SENT/ACCEPTED/REJECTED |
| 4.3 | PDF generowany i uploadowany do Supabase Storage | **PASS** | Kod: `useSendOffer.ts:91-106` generateOfferPdf + uploadOfferPdf |
| 4.4 | Email wysłany przez Edge Function (non-fatal) | **PASS** | Kod: `useSendOffer.ts:108-132` EF `send-offer-email` z guard try/catch |
| 4.5 | OFFER_SENT analytics event | **PASS** | Kod: `useSendOffer.ts:140` `trackEvent(ANALYTICS_EVENTS.OFFER_SENT)` |
| 4.6 | Publiczny route `/oferta/:token` bez auth | **PASS** | Kod: `App.tsx:205` w ZONE 1 PUBLIC — poza ProtectedRoute |
| 4.7 | OfferPublicPage: oferta widoczna bez logowania | **PASS** | Kod: `OfferPublicPage.tsx` — fetchPublicOffer bez auth, brak useAuth dependency |
| 4.8 | Formularz akceptacji z podpisem na publicznej stronie | **PASS** | Kod: `OfferPublicPage.tsx` — SignatureCanvas, acceptPublicOffer() |
| 4.9 | Expired offer → status page (nie 404) | **PASS** | Kod: `OfferPublicPage.tsx` — obsługa statusów wygaśnięcia |
| 4.10 | End-to-end: email dostarczony do klienta z prawdziwym linkiem | **NOT TESTED** | Wymaga testu z prawdziwym email — nie jest możliwy w analizie statycznej |

**Werdykt scenariusza:** PASS — wszystkie kluczowe komponenty potwierdzone w kodzie; e2e email test NOT TESTED ale nie blokuje PASS (email jest non-fatal)

---

## Scenariusz 5: Pełny flow — 390px jedną ręką

**Warunek Gate 1:** _Cały flow działa na mobile 390px jedną ręką_

### Kroki do wykonania (dla ręcznego testera)
1. Na prawdziwym telefonie (390px) lub Chrome DevTools 390px
2. Przejdź przez: Quick Mode → wypełnij → przejdź do Full → wyślij
3. Oceń czy każdy krok jest dostępny jedną ręką (kciukiem)
4. Sprawdź czy żaden element nie wymaga precyzyjnego tapnięcia <44px

| # | Krok weryfikacji | Wynik | Źródło dowodu |
|---|-----------------|-------|---------------|
| 5.1 | QuickMode: max-w-lg (full width na 390px) | **PASS** | Kod: `QuickMode.tsx:329` `className="max-w-lg mx-auto"` |
| 5.2 | QuickMode: sticky CTA w zasięgu kciuka | **PARTIAL** | Kod: `QuickMode.tsx:443` `fixed bottom-0` — anatomicznie w zasięgu kciuka, brak dowodu wizualnego |
| 5.3 | QuickMode: touch targets min 48px | **PASS** | Kod: `QuickMode.tsx:338,394,403,409,418,469` `min-h-[48px]` / `min-h-[52px]` |
| 5.4 | QuickEstimateWorkspace: mobilny sticky bar | **PASS** | Kod: `QuickEstimateWorkspace.tsx:399` `lg:hidden fixed bottom-0` |
| 5.5 | QuickEstimateWorkspace: pb-28 na mobile (zapas pod sticky bar) | **PASS** | Kod: `QuickEstimateWorkspace.tsx:258` `pb-28 lg:pb-6` |
| 5.6 | OfferPublicPage: wyświetla się na 390px | **NOT TESTED** | Brak screenshota, brak testu |
| 5.7 | Cały flow jedną ręką w czasie < 5 minut | **NOT TESTED** | Wymaga testu manualnego na prawdziwym telefonie |
| 5.8 | Brak elementów < 44px wymagających precyzyjnego tapnięcia | **NOT TESTED** | Wymaga inspekcji wizualnej na telefonie |

**Werdykt scenariusza:** PARTIAL — struktura mobilna potwierdzona w kodzie, brak testu manualnego e2e na 390px

---

## Podsumowanie

| Warunek | Werdykt |
|---------|---------|
| 1. Quick Mode jedną ręką | **PARTIAL** |
| 2. Quick→Full zero danych | **PARTIAL** |
| 3. PDF prestige A4 | **PARTIAL** |
| 4. Send flow bez logowania | **PASS** |
| 5. Pełny flow 390px | **PARTIAL** |

**Najważniejszy następny krok:** Właściciel produktu powinien osobiście przetestować Quick Mode na prawdziwym telefonie (390px), przejść cały flow do wysłania oferty i sprawdzić PDF wizualnie. §24 DoD wymaga testu stopwatch — 90 sekund to maksimum.

---

*Ten dokument jest wynikiem analizy statycznej kodu. Żaden scenariusz oznaczony "NOT TESTED" nie był wykonywany manualnie przez autora tego dokumentu.*
