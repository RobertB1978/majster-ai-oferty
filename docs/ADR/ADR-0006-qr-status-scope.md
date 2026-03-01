# ADR-0006: Zakres strony QR statusu projektu — bez kwot

- **Status:** Zaakceptowany
- **Data:** 2026-03-01
- **Decydenci:** Product Owner (Robert B.), Tech Lead (Claude)
- **Związany PR:** PR-13 (Projekty + QR status)

---

## Kontekst

PR-13 wprowadza publiczną stronę statusu projektu dla klienta — dostępną przez link/QR code, bez logowania.

Pytanie: co klient powinien widzieć na tej stronie?

Majster może chcieć informować klienta o postępie, ale **kwoty i ceny to wrażliwe informacje handlowe**, które mogą być:
- Podstawą do negocjacji przez klienta
- Ujawnione osobom trzecim (link jest publiczny — bez logowania)
- Źródłem nieporozumień (np. różnica brutto/netto)

---

## Decyzja

Strona QR statusu projektu pokazuje TYLKO:

| Element | Dostępny | Uzasadnienie |
|---------|----------|--------------|
| Etapy prac (lista kroków) | ✅ TAK | Klient chce wiedzieć co jest robione |
| Daty / terminy | ✅ TAK | Klient chce wiedzieć kiedy |
| % postępu (pasek) | ✅ TAK | Intuicyjny wskaźnik dla klienta |
| Zdjęcia (fotoprotokół) | ✅ TAK | Dowód wykonania pracy |
| Kwoty / ceny / budżet | ❌ NIE | Wrażliwe dane handlowe |
| Koszty materiałów | ❌ NIE | Dane wewnętrzne majstra |
| Dane finansowe | ❌ NIE | Poza zakresem QR |

**Strona jest publicznie dostępna przez unikalny token** (bez logowania, bez hasła).

---

## Alternatywy rozważane

| Opcja | Powód odrzucenia |
|-------|-----------------|
| Pokazywać kwoty z oferty | Ryzyko: klient negocjuje w trakcie prac |
| Pokazywać budżet | Ujawnia marżę i koszty majstra |
| Chronić hasłem | Dodatkowe tarcie — klient nie użyje |
| Pełny dostęp klienta (logowanie) | Nadmiarowa złożoność, poza zakresem PR-13 |

---

## Konsekwencje

### Pozytywne
- Klient ma realną wartość (wie co się dzieje) bez narażania danych handlowych
- Majster nie musi się bać udostępnienia linku
- Prosta implementacja — brak logiki dostępu do danych finansowych

### Negatywne / ryzyki
- Klient może chcieć zobaczyć więcej — to edge case, obsługiwany przez przyszły „Portal Klienta"
- Jeśli link wycieknie, ktoś inny zobaczy etapy prac (akceptowalne ryzyko)

### Bezpieczeństwo tokenu
```typescript
// Token: UUID v4, 36 znaków
// Generowany przy tworzeniu projektu
// Bez daty wygaśnięcia (projekt trwa określony czas)
// Odwoływalny przez majstra (regeneracja tokenu)
```

---

## Rozszerzenie w przyszłości

Pełny „Portal Klienta" (z logowaniem klienta, widokiem ofert, historią płatności) to osobny feature — **poza zakresem roadmapy 2026**. Decyzja wymaga nowego ADR i nowego PR.

---

*ADR-0006 | 2026-03-01 | Majster.AI*
