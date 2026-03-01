# ADR-0007: Burn Bar BASIC — źródło budżetu domyślnego

- **Status:** Zaakceptowany
- **Data:** 2026-03-01
- **Decydenci:** Product Owner (Robert B.), Tech Lead (Claude)
- **Związany PR:** PR-14 (Burn Bar BASIC)

---

## Kontekst

PR-14 wprowadza „Burn Bar" — pasek postępu wydatków projektu vs budżet.
Kluczowe pytanie: skąd pochodzi domyślny budżet projektu?

Opcje:
- Z zaakceptowanej oferty (automatycznie)
- Wpisywany ręcznie przez majstra
- Obliczany na podstawie kosztów (wsteczne)

---

## Decyzja

**Budżet domyślny = wartość netto z zaakceptowanej oferty powiązanej z projektem.**

Zasady:
1. Jeśli projekt ma powiązaną zaakceptowaną ofertę → budżet = oferta netto (automatycznie)
2. Majster może ręcznie zmienić budżet w dowolnym momencie
3. Jeśli brak powiązanej oferty → pole budżetu puste, majster wpisuje ręcznie
4. Koszty (materiały + robocizna) są wprowadzane ręcznie — NIE przez AI (BASIC)

**Zakres BASIC (PR-14) — NIE WIĘCEJ:**
- ✅ Pasek: budżet vs suma kosztów
- ✅ Alert >80% budżetu
- ✅ Lista kosztów (ręczny wpis)
- ❌ Prognozowanie kosztów przez AI (poza zakresem)
- ❌ Automatyczna synchronizacja z fakturami (poza zakresem)
- ❌ Porównanie z poprzednimi projektami (poza zakresem)

---

## Alternatywy rozważane

| Opcja | Powód odrzucenia |
|-------|-----------------|
| Budżet = oferta brutto | Majster liczy w netto; brutto zależy od VAT-u |
| Budżet = suma wycen z wizarda | Nie zawsze pokrywa się z ofertą końcową |
| Tylko ręczny wpis | Utrata wartości — dane z oferty są dostępne |
| AI prognozuje budżet | Za złożone na BASIC — osobny PR/ADR |

---

## Konsekwencje

### Pozytywne
- Zero tarcia — budżet jest od razu po powiązaniu z ofertą
- Majster zawsze może zmienić (elastyczność)
- Wartość netto to właściwa podstawa do oceny rentowności

### Negatywne / ryzyki
- Jeśli oferta miała błędy → budżet też jest zły (ale edytowalny)
- Brak synchronizacji z fakturami kosztowymi — wymaga ręcznego wprowadzania

### Model danych
```sql
-- Tabela: project_budget
-- budget_amount:   NUMERIC — wartość budżetu
-- budget_source:   TEXT CHECK ('offer_net' | 'manual')
-- offer_id:        UUID REFERENCES offers(id) ON DELETE SET NULL
```

---

## Rozszerzenie w przyszłości

„Burn Bar SMART" (AI-powered, automatyczna synchronizacja z OCR faktur) to osobny PR — **poza zakresem roadmapy 2026**. Wymaga nowego ADR.

---

*ADR-0007 | 2026-03-01 | Majster.AI*
