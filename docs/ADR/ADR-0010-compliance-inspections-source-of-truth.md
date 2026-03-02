# ADR-0010: Compliance/Inspections — Source of Truth i procedura aktualizacji

**Status:** ZAAKCEPTOWANE
**Data:** 2026-03-02
**Autorzy:** Tech Lead (Claude), Product Owner (Robert B.)
**Kontekst:** PR-17 — Biblioteka wzorów dokumentów

---

## Kontekst

PR-17 wprowadza szablony dla przeglądów technicznych budynków (Compliance/Inspections).
Szablony muszą być zgodne z aktualnym polskim prawem budowlanym i normami technicznymi.
Prawo budowlane bywa zmieniane — szablony mogą stać się nieaktualne.

## Decyzja

**`/docs/COMPLIANCE/INSPECTIONS_PL.md` jest JEDYNYM źródłem prawdy** dla:
1. Listy typów obowiązkowych przeglądów technicznych w Polsce
2. Wymaganych pól formularza dla każdego przeglądu
3. Referencji prawnych (artykuły ustaw, numery rozporządzeń, normy)
4. Kto może przeprowadzić dany przegląd (wymagane kwalifikacje)

Implementacja szablonów w `src/data/documentTemplates.ts` musi wiernie odzwierciedlać definicje z tego pliku.

## Konsekwencje

### Obowiązki przy zmianie przepisów

Każdorazowo gdy zmieni się:
- Ustawa Prawo budowlane (art. 62 i powiązane)
- Rozporządzenia dotyczące instalacji elektrycznych, gazowych, kominowych
- Wymagania kwalifikacyjne dla inspektorów (SEP, PIIB, itp.)
- Polskie normy techniczne mające wpływ na zakres przeglądów

**WYMAGANE DZIAŁANIA:**
1. Zaktualizować `/docs/COMPLIANCE/INSPECTIONS_PL.md` — odzwierciedlić zmianę
2. Ocenić czy zmiana wpływa na pola formularzy w `src/data/documentTemplates.ts`
3. Jeśli tak — zaktualizować szablony i zwiększyć `template_version` w JSON
4. Poinformować użytkowników posiadających stare instancje (TODO: mechanizm powiadomień)
5. Commit: `docs: aktualizuj INSPECTIONS_PL.md — [opis zmiany]`

### Ograniczenia odpowiedzialności

Majster.AI dostarcza szablony jako narzędzie pomocnicze. Odpowiedzialność za:
- aktualność prawną,
- poprawność wypełnienia,
- ważność prawną wygenerowanego dokumentu

leży po stronie użytkownika. Szablony NIE zastępują porady prawnika ani certyfikowanego inspektora.

### Przegląd dokumentu

Zalecana częstotliwość przeglądu INSPECTIONS_PL.md: **co 12 miesięcy** lub po ogłoszeniu zmian w Dz.U.

## Alternatywy odrzucone

- **Hardcode referencji w szablonach JSON** — odrzucone, bo zmiany wymagałyby deployu kodu.
- **Zewnętrzna baza przepisów** — odrzucone, zbyt złożone na obecnym etapie.
- **Brak gwarancji aktualności** — odrzucone, niezgodne z zasadą odpowiedzialnego produktu dla budownictwa.

---

*Dokument: ADR-0010 v1.0 | Data: 2026-03-02 | PR: PR-17*
